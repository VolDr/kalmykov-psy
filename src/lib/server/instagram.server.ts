import https from 'node:https';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { env } from '$env/dynamic/private';
import { db } from '../..';
import * as schema from '../../db/schema';
import { and, asc, eq, sql } from 'drizzle-orm';

// Instagram API with Instagram Login (без Facebook-страницы), см. docs/instagram.md.
// Все переменные читаются через $env/dynamic — сайт работает и без настроенной интеграции.
const GRAPH_BASE = 'https://graph.instagram.com/v23.0';

export type InstagramRule = typeof schema.instagramRules.$inferSelect;

export function igConfigured(): boolean {
	return Boolean(env.INSTAGRAM_ACCESS_TOKEN);
}

// graph.instagram.com с хостинга может требовать тот же SOCKS5-прокси, что и
// Telegram Bot API (см. telegram-client-bot.server.ts) — задаётся INSTAGRAM_PROXY.
function proxyAgent(): https.Agent | undefined {
	return env.INSTAGRAM_PROXY ? new SocksProxyAgent(env.INSTAGRAM_PROXY) : undefined;
}

/**
 * POST к Graph API. Глобальный fetch (undici) не умеет SOCKS-прокси,
 * поэтому node:https + socks-proxy-agent.
 */
function igApi(path: string, body: Record<string, unknown>): Promise<unknown> {
	const payload = JSON.stringify(body);
	const url = new URL(`${GRAPH_BASE}${path}`);
	url.searchParams.set('access_token', env.INSTAGRAM_ACCESS_TOKEN ?? '');

	return new Promise((resolve, reject) => {
		const req = https.request(
			url,
			{
				method: 'POST',
				agent: proxyAgent(),
				headers: {
					'Content-Type': 'application/json',
					'Content-Length': Buffer.byteLength(payload)
				}
			},
			(res) => {
				let data = '';
				res.on('data', (chunk) => (data += chunk));
				res.on('end', () => {
					if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
						try {
							resolve(JSON.parse(data));
						} catch {
							resolve(data);
						}
					} else {
						reject(new Error(`Instagram API ${path}: HTTP ${res.statusCode} ${data}`));
					}
				});
			}
		);
		req.on('error', reject);
		req.write(payload);
		req.end();
	});
}

/** Публичный ответ под комментарием. */
export function replyToComment(commentId: string, text: string): Promise<unknown> {
	return igApi(`/${commentId}/replies`, { message: text });
}

/**
 * Private reply: сообщение в директ автору комментария.
 * Лимиты Meta: одно сообщение на комментарий, в течение 7 дней, до 750/час.
 */
export function privateReplyToComment(commentId: string, text: string): Promise<unknown> {
	return igApi('/me/messages', {
		recipient: { comment_id: commentId },
		message: { text }
	});
}

/** Ответ в директ по IGSID пользователя (окно 24 часа после его сообщения). */
export function sendDm(igUserId: string, text: string): Promise<unknown> {
	return igApi('/me/messages', {
		recipient: { id: igUserId },
		message: { text }
	});
}

/** Проверяет текст против ключевых слов правила (без учёта регистра). */
export function ruleMatchesText(
	rule: Pick<InstagramRule, 'keywords' | 'matchExact'>,
	text: string
): boolean {
	const normalized = text.trim().toLowerCase();
	if (!normalized) return false;
	return rule.keywords.some((keyword) => {
		const kw = keyword.trim().toLowerCase();
		if (!kw) return false;
		return rule.matchExact ? normalized === kw : normalized.includes(kw);
	});
}

/**
 * Первое подходящее правило (по возрастанию id). Берём только одно:
 * Meta всё равно разрешает один private reply на комментарий, а несколько
 * автоответов подряд выглядят как спам.
 */
export function findMatchingRule(
	rules: InstagramRule[],
	text: string,
	mediaId?: string | null
): InstagramRule | null {
	for (const rule of rules) {
		if (rule.mediaId && rule.mediaId !== mediaId) continue;
		if (ruleMatchesText(rule, text)) return rule;
	}
	return null;
}

async function listEnabledRules(
	triggerType: (typeof schema.instagramRuleTriggerEnum.enumValues)[number]
): Promise<InstagramRule[]> {
	return db
		.select()
		.from(schema.instagramRules)
		.where(
			and(
				eq(schema.instagramRules.enabled, true),
				eq(schema.instagramRules.triggerType, triggerType)
			)
		)
		.orderBy(asc(schema.instagramRules.id));
}

/**
 * Помечает объект (comment id / message id) обработанным.
 * false — уже обрабатывали (ретрай вебхука), действие повторять нельзя.
 */
async function claimProcessed(objectId: string): Promise<boolean> {
	const inserted = await db
		.insert(schema.instagramProcessed)
		.values({ objectId })
		.onConflictDoNothing()
		.returning({ id: schema.instagramProcessed.id });
	return inserted.length > 0;
}

async function registerHit(ruleId: number) {
	await db
		.update(schema.instagramRules)
		.set({
			hits: sql`${schema.instagramRules.hits} + 1`,
			lastHitAt: sql`now()`,
			updatedAt: sql`now()`
		})
		.where(eq(schema.instagramRules.id, ruleId));
}

// --- Разбор вебхука (object: 'instagram') ---

type CommentValue = {
	id?: string;
	text?: string;
	from?: { id?: string; username?: string };
	media?: { id?: string };
};

type MessagingItem = {
	sender?: { id?: string };
	message?: { mid?: string; text?: string; is_echo?: boolean };
};

type WebhookEntry = {
	id?: string;
	changes?: { field?: string; value?: CommentValue }[];
	messaging?: MessagingItem[];
};

export type InstagramWebhookPayload = {
	object?: string;
	entry?: WebhookEntry[];
};

async function handleComment(selfId: string | undefined, value: CommentValue) {
	// Свои комментарии (в т.ч. собственные автоответы) пропускаем — иначе цикл
	if (!value.id || !value.text || value.from?.id === selfId) return;

	const rules = await listEnabledRules('comment');
	const rule = findMatchingRule(rules, value.text, value.media?.id ?? null);
	if (!rule) return;

	if (!(await claimProcessed(value.id))) return;

	if (rule.commentReplyText) {
		await replyToComment(value.id, rule.commentReplyText);
	}
	if (rule.dmText) {
		await privateReplyToComment(value.id, rule.dmText);
	}
	await registerHit(rule.id);
}

async function handleMessage(selfId: string | undefined, item: MessagingItem) {
	const message = item.message;
	// is_echo — наши собственные исходящие, их Meta тоже присылает в вебхук
	if (!message?.mid || !message.text || message.is_echo || item.sender?.id === selfId) return;
	if (!item.sender?.id) return;

	const rules = await listEnabledRules('dm');
	const rule = findMatchingRule(rules, message.text);
	if (!rule || !rule.dmText) return;

	if (!(await claimProcessed(message.mid))) return;

	await sendDm(item.sender.id, rule.dmText);
	await registerHit(rule.id);
}

/**
 * Обрабатывает POST от Meta. Ошибки отдельных событий логируются и не
 * прерывают остальные — вебхук должен ответить 200, иначе Meta ретраит
 * всю пачку и растёт риск дублей.
 */
export async function processInstagramWebhook(payload: InstagramWebhookPayload) {
	if (payload.object !== 'instagram' || !igConfigured()) return;

	for (const entry of payload.entry ?? []) {
		for (const change of entry.changes ?? []) {
			if (change.field !== 'comments' || !change.value) continue;
			try {
				await handleComment(entry.id, change.value);
			} catch (err) {
				console.error('[instagram] Ошибка обработки комментария:', err);
			}
		}
		for (const item of entry.messaging ?? []) {
			try {
				await handleMessage(entry.id, item);
			} catch (err) {
				console.error('[instagram] Ошибка обработки сообщения:', err);
			}
		}
	}
}

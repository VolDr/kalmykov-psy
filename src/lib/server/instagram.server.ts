import { resolve } from 'node:path';
import { INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_PROXY } from '$app/env/private';
import { db } from '../..';
import * as schema from '../../db/schema';
import { and, asc, eq, sql } from 'drizzle-orm';
import { instagramMessage, type InstagramLinkButton } from '../instagram-message';
import { instagramRequest } from './instagram-http.server';
import { InstagramTokenStore } from './instagram-token.server';

// Instagram API with Instagram Login (без Facebook-страницы), см. docs/instagram.md.
const GRAPH_BASE = 'https://graph.instagram.com/v23.0';

const tokenStore = new InstagramTokenStore({
	seedToken: INSTAGRAM_ACCESS_TOKEN,
	filePath: resolve(process.env.INSTAGRAM_TOKEN_FILE || 'tmp/instagram-token.json'),
	refresh: (token) => {
		const url = new URL('https://graph.instagram.com/refresh_access_token');
		url.searchParams.set('grant_type', 'ig_refresh_token');
		return instagramRequest(url, token, INSTAGRAM_PROXY);
	}
});

export const getInstagramTokenStatus = () => tokenStore.getStatus();

let tokenRefreshTimer: ReturnType<typeof setInterval> | undefined;

/** Check on startup and hourly; refresh every 30 days, retry failures daily. */
export function startInstagramTokenRefresh() {
	if (!igConfigured() || tokenRefreshTimer) return;
	const check = async () => {
		try {
			const result = await tokenStore.check();
			if (result === 'refreshed')
				console.log('[instagram] Токен автоматически продлён и сохранён.');
			if (result === 'failed')
				console.error(
					'[instagram] Не удалось продлить токен; повтор через сутки. Проверьте статус в админке.'
				);
		} catch {
			console.error(
				'[instagram] Ошибка хранилища токена; проверьте файл INSTAGRAM_TOKEN_FILE и права доступа.'
			);
		}
	};
	tokenRefreshTimer = setInterval(() => void check(), 60 * 60 * 1000);
	tokenRefreshTimer.unref();
	void check();
}

export type InstagramRule = typeof schema.instagramRules.$inferSelect;

export function igConfigured(): boolean {
	return Boolean(INSTAGRAM_ACCESS_TOKEN);
}

async function igApi(path: string, body: Record<string, unknown>): Promise<unknown> {
	return instagramRequest(
		new URL(`${GRAPH_BASE}${path}`),
		await tokenStore.getToken(),
		INSTAGRAM_PROXY,
		body
	);
}

/** Публичный ответ под комментарием. */
export function replyToComment(commentId: string, text: string): Promise<unknown> {
	return igApi(`/${commentId}/replies`, { message: text });
}

/**
 * Private reply: сообщение в директ автору комментария.
 * Лимиты Meta: одно сообщение на комментарий, в течение 7 дней, до 750/час.
 */
export function privateReplyToComment(
	commentId: string,
	text: string,
	button?: InstagramLinkButton
): Promise<unknown> {
	return igApi('/me/messages', {
		recipient: { comment_id: commentId },
		message: instagramMessage(text, button)
	});
}

/** Ответ в директ по IGSID пользователя (окно 24 часа после его сообщения). */
export function sendDm(
	igUserId: string,
	text: string,
	button?: InstagramLinkButton
): Promise<unknown> {
	return igApi('/me/messages', {
		recipient: { id: igUserId },
		message: instagramMessage(text, button)
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
		await privateReplyToComment(value.id, rule.dmText, ruleLinkButton(rule));
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

	await sendDm(item.sender.id, rule.dmText, ruleLinkButton(rule));
	await registerHit(rule.id);
}

function ruleLinkButton(rule: InstagramRule): InstagramLinkButton | undefined {
	return rule.dmButtonTitle && rule.dmButtonUrl
		? { title: rule.dmButtonTitle, url: rule.dmButtonUrl }
		: undefined;
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

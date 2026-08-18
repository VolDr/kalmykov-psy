import { randomBytes } from 'node:crypto';
import { db } from '../..';
import * as schema from '../../db/schema';
import type { QuizSphereRecs, QuizSubscaleResult } from '../../db/schema';
import { and, eq, isNotNull, isNull, or, sql } from 'drizzle-orm';
import { DEFAULT_QUIZ_BOT_TEXTS, DEFAULT_SPHERE_RECS } from './quiz-messages';

export type QuizResult = typeof schema.quizResults.$inferSelect;

/**
 * Токен для диплинка t.me/<бот>?start=qr_<token>.
 * base64url — ровно тот алфавит, который Telegram разрешает в start-payload.
 */
function randomToken(): string {
	return randomBytes(16).toString('base64url');
}

export async function createQuizResult(data: {
	articleSlug: string;
	totalScore: number;
	averageScore: number | null;
	severity: string;
	color: string;
	subscales: QuizSubscaleResult[];
}): Promise<QuizResult> {
	const [result] = await db
		.insert(schema.quizResults)
		.values({ ...data, token: randomToken() })
		.returning();
	return result;
}

export async function getQuizResultByToken(token: string): Promise<QuizResult | null> {
	const [result] = await db
		.select()
		.from(schema.quizResults)
		.where(eq(schema.quizResults.token, token));
	return result ?? null;
}

/**
 * Захватывает право на первую выдачу разбора. Атомарно: побеждает ровно один
 * процесс, остальные получают false и молча отходят — иначе два одновременных
 * нажатия «Я подписался» слали бы человеку два полных разбора и дважды
 * запускали побочные эффекты (теги, прогревочную цепочку).
 *
 * Заодно это и метка для подметания: пара delivery_started_at + delivered_at
 * отличает «упало на середине» (повторить) от «человек ещё не прошёл шлагбаум»
 * (повторять нечего). Захват старше staleMinutes считается брошенным.
 */
export async function claimQuizDelivery(id: number, staleMinutes = 5): Promise<boolean> {
	const claimed = await db
		.update(schema.quizResults)
		.set({ deliveryStartedAt: sql`now()` })
		.where(
			and(
				eq(schema.quizResults.id, id),
				isNull(schema.quizResults.deliveredAt),
				or(
					isNull(schema.quizResults.deliveryStartedAt),
					sql`${schema.quizResults.deliveryStartedAt} < now() - make_interval(mins => ${staleMinutes})`
				)
			)
		)
		.returning({ id: schema.quizResults.id });
	return claimed.length > 0;
}

/**
 * Разборы, выдача которых началась и не завершилась: процесс перезапустили или
 * Telegram отвалился на середине. Свежие пропускаем — их, возможно, прямо
 * сейчас и отправляют.
 *
 * Контакт приходит тем же запросом, и заблокировавшие бота отсеиваются прямо в
 * SQL: доставить им нельзя, а место в выборке они занимали бы вечно и вытесняли
 * тех, кому доотправить реально надо. Разблокируется — снова попадёт в выборку.
 * Удалённые контакты отсеиваются сами: contact_id у них обнуляется по FK.
 */
export async function findStalledQuizDeliveries(staleMinutes = 5, limit = 50) {
	const rows = await db
		.select({ result: schema.quizResults, contact: schema.botContacts })
		.from(schema.quizResults)
		.innerJoin(schema.botContacts, eq(schema.quizResults.contactId, schema.botContacts.id))
		.where(
			and(
				isNotNull(schema.quizResults.deliveryStartedAt),
				isNull(schema.quizResults.deliveredAt),
				eq(schema.botContacts.botBlocked, false),
				sql`${schema.quizResults.deliveryStartedAt} < now() - make_interval(mins => ${staleMinutes})`
			)
		)
		.limit(limit);
	return rows;
}

export async function markQuizResultDelivered(id: number, contactId: number) {
	await db
		.update(schema.quizResults)
		.set({ contactId, deliveredAt: sql`now()` })
		.where(eq(schema.quizResults.id, id));
}

/**
 * Привязывает результат к контакту при первом заходе по диплинку (до проверки
 * подписки) и отвечает, вправе ли этот контакт его получить.
 *
 * Токен в ссылке t.me/<бот>?start=qr_<token> — предъявительский, а за ним стоят
 * результаты психологического опросника. Ссылку пересылают, поэтому владельца
 * фиксируем ровно один раз: привязка проходит только при пустом contact_id,
 * дальше результат отдаётся исключительно этому контакту. Условие в WHERE, а не
 * в коде, чтобы два одновременных перехода не перетёрли владельца.
 */
export async function claimQuizResult(id: number, contactId: number): Promise<boolean> {
	const claimed = await db
		.update(schema.quizResults)
		.set({ contactId })
		.where(
			and(
				eq(schema.quizResults.id, id),
				or(isNull(schema.quizResults.contactId), eq(schema.quizResults.contactId, contactId))
			)
		)
		.returning({ id: schema.quizResults.id });
	return claimed.length > 0;
}

// --- Настройки выдачи результатов в боте (singleton-строка) ---

export type QuizBotSettings = {
	botUsername: string | null;
	channelChatId: string | null;
	channelUrl: string | null;
	requireSubscription: boolean;
	subscribeText: string;
	subscribeButtonText: string;
	checkButtonText: string;
	notSubscribedAlert: string;
	resultsHeaderText: string;
	resultsFooterText: string;
	sphereRecs: QuizSphereRecs;
	allGreenText: string;
};

/**
 * Настройки бота для опросника: строка из БД, пустые поля добиваются дефолтами.
 * Пока админ ничего не сохранил, всё работает на дефолтных текстах.
 */
export async function getQuizBotSettings(): Promise<QuizBotSettings> {
	const [row] = await db.select().from(schema.quizBotSettings).limit(1);
	return {
		botUsername: row?.botUsername?.trim() || null,
		channelChatId: row?.channelChatId?.trim() || null,
		channelUrl: row?.channelUrl?.trim() || null,
		requireSubscription: row?.requireSubscription ?? true,
		subscribeText: row?.subscribeText?.trim() || DEFAULT_QUIZ_BOT_TEXTS.subscribeText,
		subscribeButtonText:
			row?.subscribeButtonText?.trim() || DEFAULT_QUIZ_BOT_TEXTS.subscribeButtonText,
		checkButtonText: row?.checkButtonText?.trim() || DEFAULT_QUIZ_BOT_TEXTS.checkButtonText,
		notSubscribedAlert:
			row?.notSubscribedAlert?.trim() || DEFAULT_QUIZ_BOT_TEXTS.notSubscribedAlert,
		resultsHeaderText: row?.resultsHeaderText?.trim() || DEFAULT_QUIZ_BOT_TEXTS.resultsHeaderText,
		resultsFooterText: row?.resultsFooterText?.trim() || DEFAULT_QUIZ_BOT_TEXTS.resultsFooterText,
		sphereRecs:
			row && Object.keys(row.sphereRecs).length > 0 ? row.sphereRecs : DEFAULT_SPHERE_RECS,
		allGreenText: row?.allGreenText?.trim() || DEFAULT_QUIZ_BOT_TEXTS.allGreenText
	};
}

/** Строка настроек как есть (для формы админки; null — ещё не сохраняли). */
export async function getQuizBotSettingsRow() {
	const [row] = await db.select().from(schema.quizBotSettings).limit(1);
	return row ?? null;
}

export async function saveQuizBotSettings(
	data: Omit<typeof schema.quizBotSettings.$inferInsert, 'id' | 'updatedAt'>
) {
	const existing = await getQuizBotSettingsRow();
	if (existing) {
		await db
			.update(schema.quizBotSettings)
			.set({ ...data, updatedAt: sql`now()` })
			.where(eq(schema.quizBotSettings.id, existing.id));
	} else {
		await db.insert(schema.quizBotSettings).values(data);
	}
}

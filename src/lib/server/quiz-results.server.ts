import { randomBytes } from 'node:crypto';
import { db } from '../..';
import * as schema from '../../db/schema';
import type { QuizSphereRecs, QuizSubscaleResult } from '../../db/schema';
import { eq, sql } from 'drizzle-orm';
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

export async function markQuizResultDelivered(id: number, contactId: number) {
	await db
		.update(schema.quizResults)
		.set({ contactId, deliveredAt: sql`now()` })
		.where(eq(schema.quizResults.id, id));
}

/** Привязывает результат к контакту при первом заходе по диплинку (до проверки подписки). */
export async function claimQuizResult(id: number, contactId: number) {
	await db
		.update(schema.quizResults)
		.set({ contactId })
		.where(eq(schema.quizResults.id, id));
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

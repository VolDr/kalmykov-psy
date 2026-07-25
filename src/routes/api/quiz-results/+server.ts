import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { bat23Config } from '../../../configs/bat23ConfigSoft';
import { calculateScore, validateAnswers } from '$lib/utils/questionnaire/scoringEngine';
import { getEnabledClipArticleBySlug } from '$lib/server/clip-articles.server';
import { createQuizResult, getQuizBotSettings } from '$lib/server/quiz-results.server';
import { getBotUsername } from '$lib/server/telegram-client-bot.server';
import { QUIZ_START_PREFIX } from '$lib/server/quiz-bot.server';

/**
 * Финал опросника на клип-статье: пересчитывает результат на сервере (клиент
 * шлёт только ответы), сохраняет его и возвращает диплинк в бота за разбором.
 */
export const POST: RequestHandler = async ({ request }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}
	if (body === null || typeof body !== 'object' || Array.isArray(body)) {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}

	const { articleSlug, answers } = body as Record<string, unknown>;

	if (typeof articleSlug !== 'string') {
		return json({ error: 'Invalid articleSlug' }, { status: 400 });
	}
	const article = await getEnabledClipArticleBySlug(articleSlug);
	if (!article || !article.quizEnabled) {
		return json({ error: 'Unknown article' }, { status: 400 });
	}

	if (answers === null || typeof answers !== 'object' || Array.isArray(answers)) {
		return json({ error: 'Invalid answers' }, { status: 400 });
	}

	// Каждый ответ должен ссылаться на существующий вопрос и его вариант
	const cleanAnswers: Record<string, number> = {};
	for (const [questionId, value] of Object.entries(answers as Record<string, unknown>)) {
		const question = bat23Config.questions.find((q) => q.id === questionId);
		if (!question || question.type !== 'radio') continue;
		if (typeof value !== 'number' || !question.options?.some((o) => o.value === value)) {
			return json({ error: 'Invalid answer value' }, { status: 400 });
		}
		cleanAnswers[questionId] = value;
	}

	const { isValid } = validateAnswers(cleanAnswers, bat23Config);
	if (!isValid) {
		return json({ error: 'Not all questions answered' }, { status: 400 });
	}

	const score = calculateScore(cleanAnswers, bat23Config);
	const result = await createQuizResult({
		articleSlug,
		totalScore: score.totalScore,
		averageScore: score.averageScore ?? null,
		severity: score.interpretation.severity,
		color: score.interpretation.color,
		subscales: (score.subscales ?? []).map((s) => ({
			id: s.id,
			name: s.name,
			averageScore: s.averageScore,
			severity: s.interpretation.severity,
			color: s.interpretation.color
		}))
	});

	// Username бота: из настроек админки, иначе getMe(); не вышло — кнопку в бота
	// на сайте не покажем (deeplink: null), но результат уже сохранён
	let botUsername: string | null = null;
	try {
		const settings = await getQuizBotSettings();
		botUsername = settings.botUsername?.replace(/^@/, '') || (await getBotUsername());
	} catch (err) {
		console.error('[quiz-results] Не удалось получить username бота:', err);
	}

	return json({
		severity: result.severity,
		color: result.color,
		averageScore: result.averageScore,
		deeplink: botUsername
			? `https://t.me/${botUsername}?start=${QUIZ_START_PREFIX}${result.token}`
			: null
	});
};

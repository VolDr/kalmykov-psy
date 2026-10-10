import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { bat23Config } from '../../../configs/bat23ConfigSoft';
import { calculateScore, validateAnswers } from '$lib/utils/questionnaire/scoringEngine';
import { getEnabledClipArticleBySlug, STATIC_QUIZ_SLUGS } from '$lib/server/clip-articles.server';
import { createQuizResult, getQuizBotSettings } from '$lib/server/quiz-results.server';
import { getContactByPublicId } from '$lib/server/bot-contacts.server';
import { getBotUsername } from '$lib/server/telegram-client-bot.server';
import { QUIZ_START_PREFIX } from '$lib/server/quiz-bot.server';

/**
 * Финал опросника на клип-статье: пересчитывает результат на сервере (клиент
 * шлёт только ответы), сохраняет его и возвращает диплинк в бота за разбором.
 */
/**
 * Контакт бота по cookie sb_client_id (ставится ссылками /go/*). Ошибка поиска
 * не должна ронять сохранение результата — просто не привяжем.
 */
async function resolveSiteContactId(raw: string | undefined): Promise<number | null> {
	const publicId = raw ? parseInt(raw, 10) : NaN;
	if (!Number.isSafeInteger(publicId) || publicId <= 0) return null;
	try {
		return (await getContactByPublicId(publicId))?.id ?? null;
	} catch (err) {
		console.error('[quiz-results] Не удалось найти контакт по cookie:', err);
		return null;
	}
}

export const POST: RequestHandler = async ({ request, cookies }) => {
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
	// Статические страницы с опросником (например, вариант B лид-магнита focus)
	// записи в clip_articles не имеют — для них достаточно слага из белого списка
	if (!STATIC_QUIZ_SLUGS.has(articleSlug)) {
		const article = await getEnabledClipArticleBySlug(articleSlug);
		if (!article || !article.quizEnabled) {
			return json({ error: 'Unknown article' }, { status: 400 });
		}
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
	// Пришёл из бота — запоминаем контакт: если он не нажмёт кнопку на сайте,
	// цепочка-напоминание выдаст разбор по /start quiz_result
	const siteContactId = await resolveSiteContactId(cookies.get('sb_client_id'));
	const result = await createQuizResult({
		siteContactId,
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

	console.log(
		`[quiz-results] сохранён результат ${result.id}: ${articleSlug}, ${result.color}, контакт из cookie: ${siteContactId ?? 'нет'}`
	);

	// Username бота: из настроек админки, иначе getMe(); не вышло — кнопку в бота
	// на сайте не покажем (deeplink: null), но результат уже сохранён
	let botUsername: string | null = null;
	try {
		const settings = await getQuizBotSettings();
		botUsername = settings.botUsername?.replace(/^@/, '') || (await getBotUsername());
	} catch (err) {
		console.error('[quiz-results] Не удалось получить username бота:', err);
	}

	if (!botUsername) {
		console.warn(
			`[quiz-results] результат ${result.id}: нет username бота — кнопки в бота на сайте не будет`
		);
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

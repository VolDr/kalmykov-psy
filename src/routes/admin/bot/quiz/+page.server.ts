import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireAuth } from '$lib/server/protected';
import { getQuizBotSettings, saveQuizBotSettings } from '$lib/server/quiz-results.server';
import { tgFormat, TELEGRAM_MESSAGE_LIMIT } from '$lib/server/telegram-client-bot.server';
import type { QuizSphereRecs } from '../../../../db/schema';
import { bat23Config } from '../../../../configs/bat23ConfigSoft';

const SPHERES = (bat23Config.scoring.subscales ?? []).map((s) => ({ id: s.id, name: s.name }));

export const load: PageServerLoad = async () => {
	// Эффективные значения (пустые поля добиты дефолтами) — админ видит, что реально уйдёт
	return { settings: await getQuizBotSettings(), spheres: SPHERES };
};

export const actions = {
	save: async (event) => {
		requireAuth(event);
		const form = await event.request.formData();

		const text = (name: string) => ((form.get(name) as string) ?? '').trim();

		const notSubscribedAlert = text('notSubscribedAlert');
		if (notSubscribedAlert.length > 200) {
			return fail(400, { error: 'Алерт «не подписан»: максимум 200 символов (лимит Telegram)' });
		}

		const channelChatId = text('channelChatId');
		if (channelChatId && !/^(@[A-Za-z0-9_]{4,}|-100\d+)$/.test(channelChatId)) {
			return fail(400, { error: 'Канал: @username или id вида -100…' });
		}

		const channelUrl = text('channelUrl');
		if (channelUrl && !/^https:\/\//.test(channelUrl)) {
			return fail(400, { error: 'Ссылка на канал должна начинаться с https://' });
		}

		const sphereRecs: QuizSphereRecs = {};
		for (const sphere of SPHERES) {
			const orange = text(`rec_${sphere.id}_orange`);
			const red = text(`rec_${sphere.id}_red`);
			if (orange || red) {
				sphereRecs[sphere.id] = {
					...(orange ? { orange } : {}),
					...(red ? { red } : {})
				};
			}
		}

		// Каждый текст уходит отдельным блоком — проверяем каждый по лимиту Telegram
		const longText = [
			text('subscribeText'),
			text('resultsFooterText'),
			text('allGreenText'),
			...Object.values(sphereRecs).flatMap((zones) => Object.values(zones))
		].find((t) => tgFormat(t).length > TELEGRAM_MESSAGE_LIMIT);
		if (longText) {
			return fail(400, {
				error: `Один из текстов длиннее ${TELEGRAM_MESSAGE_LIMIT} символов — Telegram не отправит такое сообщение`
			});
		}

		// Заголовок делит сообщение-сводку с общим баллом и списком сфер — оставляем запас
		const HEADER_LIMIT = TELEGRAM_MESSAGE_LIMIT - 600;
		if (tgFormat(text('resultsHeaderText')).length > HEADER_LIMIT) {
			return fail(400, {
				error: `Вступление к разбору длиннее ${HEADER_LIMIT} символов (оно идёт в одном сообщении со сводкой по сферам)`
			});
		}

		await saveQuizBotSettings({
			botUsername: text('botUsername').replace(/^@/, '') || null,
			channelChatId: channelChatId || null,
			channelUrl: channelUrl || null,
			requireSubscription: form.get('requireSubscription') === 'on',
			subscribeText: text('subscribeText') || null,
			subscribeButtonText: text('subscribeButtonText') || null,
			checkButtonText: text('checkButtonText') || null,
			notSubscribedAlert: notSubscribedAlert || null,
			resultsHeaderText: text('resultsHeaderText') || null,
			resultsFooterText: text('resultsFooterText') || null,
			sphereRecs,
			allGreenText: text('allGreenText') || null
		});

		return { success: true };
	}
} satisfies Actions;

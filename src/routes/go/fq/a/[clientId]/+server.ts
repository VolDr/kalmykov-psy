import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Вариант B лид-магнита focus сразу на блок с кнопкой опросника — аналог
 * /go/f/a/ у варианта A. Для напоминаний в цепочке «вы не прошли опросник».
 *
 * В шагах сценариев: https://kalmykov-psy.ru/go/fq/a/{contact_id}
 */
export const GET: RequestHandler = async ({ params, cookies }) => {
	const clientId = parseInt(params.clientId, 10);
	if (Number.isSafeInteger(clientId) && clientId > 0) {
		cookies.set('sb_client_id', String(clientId), {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 30 // 30 дней
		});
		console.log(`[go/fq/a] контакт ${clientId} → /useful/focus-attention-quiz#acquaintance`);
	} else {
		console.log(`[go/fq/a] некорректный id «${params.clientId}» — cookie не поставлена`);
	}
	redirect(302, '/useful/focus-attention-quiz#acquaintance');
};

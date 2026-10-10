import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Короткая ссылка на страницу «Обсудим ваш результат» — кнопка в боте после
 * разбора опросника. Как и остальные /go/*, кладёт id контакта в HttpOnly
 * cookie: страница допишет его в ссылку на запись, и бронь привяжется к
 * контакту (тег и цепочка intro_booked).
 *
 * В шагах сценариев: https://kalmykov-psy.ru/go/r/{contact_id}
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
		console.log(`[go/r] контакт ${clientId} → /useful/discuss-result`);
	} else {
		console.log(`[go/r] некорректный id «${params.clientId}» — cookie не поставлена`);
	}
	redirect(302, '/useful/discuss-result');
};

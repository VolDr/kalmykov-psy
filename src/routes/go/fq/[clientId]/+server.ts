import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Короткая ссылка на вариант B лид-магнита focus (лонгрид + опросник).
 * Как и остальные /go/*, кладёт id контакта в HttpOnly cookie: по нему
 * страница потом шлёт события прочтения, а /booking подставляет контакт.
 *
 * В шагах сценариев пишется как /go/fq/{contact_id} — бот подставит id.
 * Вариант A — /go/f/{contact_id}. Сразу к кнопке опросника — /go/fq/a/{contact_id}.
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
		console.log(`[go/fq] контакт ${clientId} → /useful/focus-attention-quiz`);
	} else {
		console.log(`[go/fq] некорректный id «${params.clientId}» — cookie не поставлена`);
	}
	redirect(302, '/useful/focus-attention-quiz');
};

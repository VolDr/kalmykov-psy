import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, url }) => {
	// Сначала cookie (установлен /go/v/[clientId]), фоллбэк — URL-параметр для обратной совместимости
	const raw = cookies.get('sb_client_id') ?? url.searchParams.get('sb_client_id');
	const parsed = raw ? parseInt(raw, 10) : null;
	const sbClientId = parsed && Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
	return { sbClientId };
};

import type { RequestHandler } from './$types';

/**
 * Плагин для Lampa: в «Настройки → Расширения» указывается URL
 * https://kalmykov-psy.ru/pl, и Lampa подключает его как <script src>.
 * Поэтому отдаём чистый JavaScript, а не HTML-страницу, а запрет индексации
 * передаём заголовком X-Robots-Tag — мета-тег у не-HTML ответа не прочитать.
 */
const PLUGIN = `(function () {
	'use strict';

	//Lampa. LGBT plugin
	window.lampa_settings.disable_features.lgbt=true;

})();
`;

export const GET: RequestHandler = () =>
	new Response(PLUGIN, {
		headers: {
			'Content-Type': 'application/javascript; charset=utf-8',
			'X-Robots-Tag': 'noindex, nofollow',
			// Веб-версия Lampa может загружать плагин с другого домена
			'Access-Control-Allow-Origin': '*',
			// Короткий кеш, чтобы правки плагина доезжали до клиентов быстро
			'Cache-Control': 'public, max-age=300'
		}
	});

import { browser } from '$app/environment';

const COUNTER_ID = 105424317;

/** Username бота без @ — для диплинков t.me/<бот>?start=… */
export const BOT_USERNAME = 'kalmykov_psy_bot';

/**
 * ClientID Метрики текущего посетителя. Метрика отдаёт его только через колбэк,
 * поэтому спрашиваем заранее, при загрузке страницы, а не в момент клика:
 * ссылка в кнопке должна быть готова синхронно, иначе браузер сочтёт переход
 * незапрошенным и заблокирует его.
 */
export function requestMetrikaClientId(): Promise<string | null> {
	const ym = browser ? window.ym : undefined;
	if (typeof ym !== 'function') return Promise.resolve(null);

	return new Promise((resolve) => {
		let settled = false;
		const finish = (value: string | null) => {
			if (settled) return;
			settled = true;
			resolve(value);
		};

		// Счётчик мог не успеть инициализироваться — ждём, но не бесконечно
		setTimeout(() => finish(null), 3000);
		try {
			ym(COUNTER_ID, 'getClientID', (id: string) => finish(/^\d{1,32}$/.test(id) ? id : null));
		} catch {
			finish(null);
		}
	});
}

/**
 * Диплинк в бота. Весь трафик с посадочных ведём в бота, а не на пост канала:
 * под постом inline-кнопка не отображается в веб-превью t.me, и на десктопе
 * путь обрывался. Подписку проверяет сам бот шагом-шлагбаумом, так что пост
 * в цепочке больше не нужен.
 *
 * ClientID уезжает в payload (`<ключ>__<clientId>`) и связывает человека в боте
 * с его визитом на сайте — без этого офлайн-конверсию не к чему прицепить.
 * Нет ClientID (блокировщик, счётчик не успел) — ссылка работает без него.
 */
export function botDeepLink(scenarioKey: string, metrikaClientId: string | null): string {
	const payload = metrikaClientId ? `${scenarioKey}__${metrikaClientId}` : scenarioKey;
	return `https://t.me/${BOT_USERNAME}?start=${payload}`;
}

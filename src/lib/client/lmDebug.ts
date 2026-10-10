import { browser } from '$app/environment';

const FLAG = 'debuglm';

/**
 * Отладка лид-магнитов в консоли браузера. Включается параметром ?debuglm в
 * адресе и держится до конца вкладки (sessionStorage), чтобы пережить переходы
 * по страницам. Без параметра ничего не пишется — у посетителей консоль чистая,
 * как у подсказки ?debughint на /booking.
 *
 * Ссылки /go/* параметры не пробрасывают: открыть по ссылке из бота, затем
 * дописать ?debuglm к адресу /useful/... и перезагрузить.
 */
export function lmDebugEnabled(): boolean {
	if (!browser) return false;
	try {
		if (new URLSearchParams(location.search).has(FLAG)) sessionStorage.setItem(FLAG, '1');
		return sessionStorage.getItem(FLAG) === '1';
	} catch {
		return false;
	}
}

export function lmLog(message: string, details?: unknown) {
	if (!lmDebugEnabled()) return;
	if (details === undefined) console.log(`[lm] ${message}`);
	else console.log(`[lm] ${message}`, details);
}

/**
 * Не даёт экрану телефона погаснуть, пока идёт игра: уснувший экран рвёт поток событий,
 * и друзья видят игрока «вышедшим». Браузер сам снимает блокировку, когда вкладка
 * скрывается, поэтому при возврате её нужно запросить заново.
 *
 * Работает только в безопасном контексте (https или localhost) и не везде; если API
 * нет или запрос отклонён (например, при низком заряде), игра просто идёт как раньше.
 */
export function createWakeLock() {
	let sentinel: WakeLockSentinel | null = null;
	let wanted = false;

	async function request() {
		if (!wanted || sentinel) return;
		if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;
		if (document.visibilityState !== 'visible') return;
		try {
			const lock = await navigator.wakeLock.request('screen');
			if (!wanted || sentinel) {
				await lock.release();
				return;
			}
			sentinel = lock;
			lock.addEventListener('release', () => {
				if (sentinel === lock) sentinel = null;
			});
		} catch {
			// отказ браузера — не критично
		}
	}

	function onVisibilityChange() {
		if (document.visibilityState === 'visible') void request();
	}

	return {
		/** Удерживать экран включённым. Повторные вызовы безвредны. */
		hold() {
			if (wanted) return;
			wanted = true;
			document.addEventListener('visibilitychange', onVisibilityChange);
			void request();
		},
		release() {
			if (!wanted) return;
			wanted = false;
			document.removeEventListener('visibilitychange', onVisibilityChange);
			const lock = sentinel;
			sentinel = null;
			void lock?.release().catch(() => {});
		}
	};
}

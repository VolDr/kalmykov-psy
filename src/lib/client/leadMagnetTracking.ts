import { browser } from '$app/environment';
import { lmDebugEnabled, lmLog } from './lmDebug';

interface TrackingOptions {
	leadMagnet: string;
	readThreshold?: number;
	minimumReadingTimeMs?: number;
}

/**
 * Разовая отправка события лид-магнита. Для статей вызывается изнутри
 * setupLeadMagnetTracking, для опросника — напрямую со страницы.
 */
export async function sendEvent(
	leadMagnet: string,
	event: string,
	progress: number
): Promise<boolean> {
	const key = `lm_${leadMagnet}_${event}`;
	lmLog(`→ отправляю ${key}`, { progress });
	// clientId читается сервером из HttpOnly cookie — в тело не передаём
	try {
		const res = await fetch('/api/lm-progress', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			keepalive: true,
			body: JSON.stringify({ leadMagnet, event, progress })
		});
		if (lmDebugEnabled()) {
			const body = await res
				.clone()
				.json()
				.catch(() => null);
			lmLog(`← ${key}: HTTP ${res.status}`, describeProgressResponse(body));
		}
		return res.ok;
	} catch (err) {
		lmLog(`✗ ${key}: запрос не ушёл`, err);
		return false;
	}
}

/** Человекочитаемый ответ /api/lm-progress для отладочного лога. */
function describeProgressResponse(body: unknown): string {
	if (!body || typeof body !== 'object') return 'ответ не JSON';
	const b = body as Record<string, unknown>;
	if (b.skipped) {
		return b.reason === 'contact_not_found'
			? 'сервер пропустил: контакт из cookie не найден в боте'
			: 'сервер пропустил: нет cookie sb_client_id (страницу открыли не по ссылке из бота)';
	}
	if (b.error) return `ошибка: ${String(b.error)}`;
	if (b.chain === 'started') return 'тег повешен, цепочка запущена';
	if (b.chain === 'bot_blocked') return 'тег повешен, цепочка НЕ запущена: бот заблокирован';
	return 'тег повешен, цепочка НЕ запущена: нет включённого сценария с таким ключом';
}

export function setupLeadMagnetTracking({
	leadMagnet,
	readThreshold = 75,
	minimumReadingTimeMs = 30_000
}: TrackingOptions): () => void {
	if (!browser) return () => {};

	// In-memory флаги предотвращают параллельные запросы в рамках одной загрузки страницы.
	// Дедупликация между сессиями — на сервере через DB unique constraint.
	let read75InFlight = false;
	let read75Sent = false;

	lmLog(`трекинг чтения запущен: ${leadMagnet}`, {
		read75: `глубина ≥ ${readThreshold}% и ≥ ${minimumReadingTimeMs / 1000} с на странице`
	});
	sendEvent(leadMagnet, 'opened', 0);

	let maxScrollDepth = 0;
	let timeMet = false;
	let scrollMet = false;

	function getScrollDepth(): number {
		const scrollable =
			document.documentElement.scrollHeight - document.documentElement.clientHeight;
		if (scrollable <= 0) return 100;
		return Math.min(100, (window.scrollY / scrollable) * 100);
	}

	function maybeFireRead75() {
		if (read75Sent || read75InFlight || !timeMet || !scrollMet) return;
		read75InFlight = true;
		sendEvent(leadMagnet, 'read75', readThreshold).then((ok) => {
			if (ok) {
				read75Sent = true;
			} else {
				read75InFlight = false; // allow retry on next scroll/timer
			}
		});
	}

	function checkScroll() {
		if (read75Sent) return;
		const depth = getScrollDepth();
		if (depth > maxScrollDepth) maxScrollDepth = depth;
		if (maxScrollDepth >= readThreshold) {
			if (!scrollMet) lmLog(`✓ глубина ${Math.round(maxScrollDepth)}% ≥ ${readThreshold}%`);
			scrollMet = true;
			maybeFireRead75();
		}
	}

	const onScroll = () => checkScroll();
	const onResize = () => checkScroll();

	window.addEventListener('scroll', onScroll, { passive: true });
	window.addEventListener('resize', onResize, { passive: true });

	// Catch document height changes from lazy-loaded images.
	// requestAnimationFrame откладывает DOM-чтение на следующий кадр —
	// синхронный доступ к scrollHeight/scrollY из ResizeObserver прерывает CSS smooth scroll в Chrome.
	const bodyObserver = new ResizeObserver(() => requestAnimationFrame(checkScroll));
	bodyObserver.observe(document.body);

	// Initial check (page may already be scrolled or short enough)
	checkScroll();

	const timer = setTimeout(() => {
		timeMet = true;
		lmLog(`✓ на странице ${minimumReadingTimeMs / 1000} с`, scrollMet ? undefined : 'ждём глубину');
		checkScroll();
	}, minimumReadingTimeMs);

	return () => {
		window.removeEventListener('scroll', onScroll);
		window.removeEventListener('resize', onResize);
		bodyObserver.disconnect();
		clearTimeout(timer);
	};
}

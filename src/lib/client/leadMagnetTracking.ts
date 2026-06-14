import { browser } from '$app/environment';

interface TrackingOptions {
	leadMagnet: string;
	readThreshold?: number;
	minimumReadingTimeMs?: number;
}

async function sendEvent(
	leadMagnet: string,
	event: string,
	progress: number
): Promise<boolean> {
	// clientId читается сервером из HttpOnly cookie — в тело не передаём
	try {
		const res = await fetch('/api/lm-progress', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			keepalive: true,
			body: JSON.stringify({ leadMagnet, event, progress })
		});
		return res.ok;
	} catch {
		return false;
	}
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

	sendEvent(leadMagnet, 'opened', 0);

	let maxScrollDepth = 0;
	let timeMet = false;
	let scrollMet = false;

	function getScrollDepth(): number {
		const scrollable = document.documentElement.scrollHeight - document.documentElement.clientHeight;
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
		checkScroll();
	}, minimumReadingTimeMs);

	return () => {
		window.removeEventListener('scroll', onScroll);
		window.removeEventListener('resize', onResize);
		bodyObserver.disconnect();
		clearTimeout(timer);
	};
}

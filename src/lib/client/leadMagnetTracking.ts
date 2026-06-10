import { browser } from '$app/environment';

interface TrackingOptions {
	clientId: string;
	leadMagnet: string;
	readThreshold?: number;
	minimumReadingTimeMs?: number;
}

function lsKey(clientId: string, leadMagnet: string, event: string): string {
	return `salebot_lm_${leadMagnet}_${event}_${clientId}`;
}

async function sendEvent(
	clientId: string,
	leadMagnet: string,
	event: string,
	progress: number
): Promise<boolean> {
	try {
		const res = await fetch('/api/lm-progress', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			keepalive: true,
			body: JSON.stringify({ clientId, leadMagnet, event, progress })
		});
		return res.ok;
	} catch {
		return false;
	}
}

export function setupLeadMagnetTracking({
	clientId,
	leadMagnet,
	readThreshold = 75,
	minimumReadingTimeMs = 30_000
}: TrackingOptions): () => void {
	if (!browser) return () => {};

	const openedKey = lsKey(clientId, leadMagnet, 'opened');
	const read75Key = lsKey(clientId, leadMagnet, 'read75');

	// In-memory flags prevent parallel requests within the same page load
	let read75InFlight = false;
	let read75Sent = !!localStorage.getItem(read75Key);

	// Fire "opened" once per client+magnet combination
	if (!localStorage.getItem(openedKey)) {
		sendEvent(clientId, leadMagnet, 'opened', 0).then((ok) => {
			if (ok) localStorage.setItem(openedKey, '1');
		});
	}

	// If read75 already confirmed — nothing left to track
	if (read75Sent) return () => {};

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
		sendEvent(clientId, leadMagnet, 'read75', readThreshold).then((ok) => {
			if (ok) {
				read75Sent = true;
				localStorage.setItem(read75Key, '1');
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

	// Catch document height changes from lazy-loaded images
	const bodyObserver = new ResizeObserver(() => checkScroll());
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

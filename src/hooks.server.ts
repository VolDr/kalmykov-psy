import type { Handle } from '@sveltejs/kit/hooks';
import { getSession } from '#lib/server/auth.server.js';
import { dev, building } from '$app/env';
import { releaseExpiredLocks } from '#lib/server/booking.server.js';
import { releaseExpiredPayments } from '#lib/server/robokassa.server.js';
import { isAdminRequest, protectRequest } from '#lib/server/request-security.server.js';

if (!building && !dev) {
	void import('#lib/server/instagram.server.js')
		.then(({ startInstagramTokenRefresh }) => {
			startInstagramTokenRefresh();
		})
		.catch(() => console.error('[instagram] Не удалось запустить автопродление токена.'));
}

// Initialize scheduler on server startup (production only)
if (!dev || process.env.ENABLE_NOTIFICATIONS === 'true') {
	import('#lib/server/scheduler.server.js').then(({ notificationScheduler }) => {
		notificationScheduler.start();
		console.log('🚀 Планировщик уведомлений запущен');
	});
	import('#lib/server/bot-scheduler.server.js').then(({ botScenarioScheduler }) => {
		botScenarioScheduler.start();
		console.log('🤖 Планировщик шагов бота запущен');
	});
}

// Throttled cleanup — runs at most once per 60s regardless of server restarts
let lastCleanup = 0;

async function runCleanup() {
	const now = Date.now();
	if (now - lastCleanup < 60_000) return;
	lastCleanup = now;
	try {
		const [released, failed] = await Promise.all([releaseExpiredLocks(), releaseExpiredPayments()]);
		if (released > 0) console.log(`[cleanup] releaseExpiredLocks: ${released} освобождено`);
		if (failed > 0) console.log(`[cleanup] releaseExpiredPayments: ${failed} помечено как failed`);
	} catch (err) {
		console.error('[cleanup] ошибка:', err);
	}
}

export const handle: Handle = async ({ event, resolve }) => {
	// Get session from cookie
	const session = getSession(event.cookies);

	// Add user data to locals if session exists
	if (session) {
		event.locals.user = {
			username: session.username
		};
	} else {
		event.locals.user = null;
	}

	const blocked = await protectRequest(event);
	if (blocked) return blocked;
	void runCleanup();
	const response = await resolve(event);
	if (isAdminRequest(event)) {
		response.headers.set('Cache-Control', 'private, no-store');
		response.headers.append('Vary', 'Cookie');
		return response;
	}

	const path = event.url.pathname;

	// Hashed assets from Vite build — cache forever (content changes → new URL)
	if (path.startsWith('/_app/immutable/')) {
		response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
	} else if (/\.(webp|jpg|jpeg|png|gif|svg|ico|woff2?|ttf|otf)$/i.test(path)) {
		// Static files (images, fonts, etc.) — cache 1 week, revalidate with ETag
		response.headers.set('Cache-Control', 'public, max-age=604800, must-revalidate');
	}

	return response;
};

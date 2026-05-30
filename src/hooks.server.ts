import type { Handle } from '@sveltejs/kit';
import { getSession } from '$lib/server/auth.server';
import { dev } from '$app/environment';
import { releaseExpiredLocks } from '$lib/server/booking.server';
import { releaseExpiredPayments } from '$lib/server/robokassa.server';

// Initialize scheduler on server startup (production only)
if (!dev || process.env.ENABLE_NOTIFICATIONS === 'true') {
	import('$lib/server/scheduler.server').then(({ notificationScheduler }) => {
		notificationScheduler.start();
		console.log('🚀 Планировщик уведомлений запущен');
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
	// Run expired-booking / expired-payment cleanup on every request (throttled to 60s)
	runCleanup();

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

	return resolve(event);
};

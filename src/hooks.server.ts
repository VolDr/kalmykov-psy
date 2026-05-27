import type { Handle } from '@sveltejs/kit';
import { getSession } from '$lib/server/auth.server';
import { dev } from '$app/environment';

// Initialize scheduler on server startup (production only)
if (!dev || process.env.ENABLE_NOTIFICATIONS === 'true') {
	import('$lib/server/scheduler.server').then(({ notificationScheduler }) => {
		notificationScheduler.start();
		console.log('🚀 Планировщик уведомлений запущен');
	});
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

	return resolve(event);
};

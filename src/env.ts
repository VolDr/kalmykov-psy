import { defineEnvVars } from '@sveltejs/kit/env';

// Optional integrations preserve the previous missing-value checks by defaulting to an empty string.
export const variables = defineEnvVars({
	VITE_URL: { static: true },
	MAILOPOST_API_TOKEN: { static: true },
	TELEGRAM_WEBHOOK_SECRET: { static: true },
	INSTAGRAM_VERIFY_TOKEN: { schema: (input) => input ?? '' },
	INSTAGRAM_APP_SECRET: { schema: (input) => input ?? '' },
	PUBLIC_SITE_URL: { public: true, static: true },
	YANDEX_METRIKA_OAUTH_TOKEN: { schema: (input) => input ?? '' },
	INSTAGRAM_ACCESS_TOKEN: { schema: (input) => input ?? '' },
	INSTAGRAM_PROXY: { schema: (input) => input ?? '' },
	TELEGRAM_CLIENT_BOT_TOKEN: { static: true }
});

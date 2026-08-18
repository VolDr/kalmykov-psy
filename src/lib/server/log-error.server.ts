import { GrammyError, HttpError } from 'grammy';

/**
 * Ошибки Telegram и сети тащат за собой полный контекст запроса — вплоть до
 * URL с токеном бота и payload сообщения (то есть персональных данных клиента).
 * В логи должно попадать ровно столько, сколько нужно для разбора инцидента.
 */
export function safeErrorDetails(error: unknown): Record<string, unknown> {
	if (error instanceof GrammyError) {
		return {
			name: 'GrammyError',
			method: error.method,
			code: error.error_code,
			description: error.description
		};
	}
	if (error instanceof HttpError) {
		return { name: 'HttpError', message: error.message };
	}
	if (error instanceof Error) return { name: error.name, message: error.message };
	return { message: String(error) };
}

/** console.error, не выносящий в лог токен бота и переписку. */
export function logSafeError(prefix: string, error: unknown): void {
	console.error(prefix, safeErrorDetails(error));
}

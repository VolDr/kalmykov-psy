import 'dotenv/config';

import process from 'node:process';
import { Bot, GrammyError } from 'grammy';
import pg from 'pg';
import { SocksProxyAgent } from 'socks-proxy-agent';

const BATCH_SIZE = 5;
const BATCH_INTERVAL_MS = 1_000;
const REQUEST_TIMEOUT_MS = 5_000;

function wait(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function probe(bot, telegramUserId) {
	while (true) {
		try {
			await bot.api.sendChatAction(
				telegramUserId,
				'typing',
				undefined,
				AbortSignal.timeout(REQUEST_TIMEOUT_MS)
			);
			return { blocked: false, error: false };
		} catch (error) {
			if (error instanceof GrammyError && error.error_code === 403) {
				return { blocked: true, error: false };
			}
			if (error instanceof GrammyError && error.error_code === 429) {
				await wait(Math.max(1, error.parameters.retry_after ?? 1) * 1_000);
				continue;
			}
			console.error(`Telegram ${telegramUserId}:`, error instanceof Error ? error.message : error);
			return { blocked: null, error: true };
		}
	}
}

async function main() {
	const connectionString = process.env.DATABASE_URL;
	const token = process.env.TELEGRAM_CLIENT_BOT_TOKEN;
	if (!connectionString) throw new Error('DATABASE_URL is not set');
	if (!token) throw new Error('TELEGRAM_CLIENT_BOT_TOKEN is not set');

	const proxyUrl = process.env.TELEGRAM_PROXY_URL ?? 'socks5://127.0.0.1:1080';
	const agent = new SocksProxyAgent(proxyUrl, { keepAlive: true, timeout: 60_000 });
	const bot = new Bot(token, {
		client: {
			baseFetchConfig: { agent, compress: true },
			timeoutSeconds: 30
		}
	});
	const client = new pg.Client({ connectionString });
	await client.connect();

	try {
		const contacts = await client.query(`
			select id::text, telegram_user_id::text, bot_blocked
			from bot_contacts
			order by id
		`);

		const stats = {
			total: contacts.rows.length,
			checked: 0,
			blockedFound: 0,
			newlyBlocked: 0,
			unblocked: 0,
			cancelledQueued: 0,
			errors: 0
		};
		console.log(`Проверяю ${stats.total} контактов, по ${BATCH_SIZE} в секунду...`);

		for (let offset = 0; offset < contacts.rows.length; offset += BATCH_SIZE) {
			const batch = contacts.rows.slice(offset, offset + BATCH_SIZE);
			const results = await Promise.all(
				batch.map((contact) => probe(bot, contact.telegram_user_id))
			);

			for (let index = 0; index < batch.length; index += 1) {
				const contact = batch[index];
				const result = results[index];
				stats.checked++;
				if (result.error || result.blocked === null) {
					stats.errors++;
					continue;
				}
				if (result.blocked) stats.blockedFound++;

				if (result.blocked) {
					await client.query('begin');
					try {
						if (!contact.bot_blocked) {
							await client.query(
								'update bot_contacts set bot_blocked = true, updated_at = now() where id = $1::bigint',
								[contact.id]
							);
							stats.newlyBlocked++;
						}

						// Выполняем и для ранее архивированных: повторный запуск скрипта
						// гарантированно дочистит оставшуюся очередь старой версии.
						const cancelled = await client.query(
							`update bot_scheduled_steps
							 set status = 'cancelled',
							     cancellation_reason = 'contact_blocked',
							     processed_at = now()
							 where contact_id = $1::bigint and status = 'pending'`,
							[contact.id]
						);
						stats.cancelledQueued += cancelled.rowCount ?? 0;
						await client.query('commit');
					} catch (error) {
						await client.query('rollback');
						throw error;
					}
				} else if (contact.bot_blocked) {
					await client.query(
						'update bot_contacts set bot_blocked = false, updated_at = now() where id = $1::bigint',
						[contact.id]
					);
					stats.unblocked++;
				}
			}

			if (stats.checked % 100 === 0 || stats.checked === stats.total) {
				console.log(`Проверено ${stats.checked}/${stats.total}`);
			}
			if (offset + BATCH_SIZE < contacts.rows.length) await wait(BATCH_INTERVAL_MS);
		}

		console.log(JSON.stringify(stats, null, 2));
	} finally {
		await client.end();
		agent.destroy();
	}
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : String(error));
	process.exitCode = 1;
});

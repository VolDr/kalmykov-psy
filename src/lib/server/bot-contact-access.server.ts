import { asc } from 'drizzle-orm';
import { GrammyError } from 'grammy';
import { db } from '../..';
import * as schema from '../../db/schema';
import { setBotBlocked } from './bot-contacts.server';
import { apiDeadline, clientBotApi } from './telegram-client-bot.server';

// Telegram допускает заметно больший общий темп, но эта проверка не срочная.
// Пять запросов в секунду оставляют запас для обычных сообщений и сценариев бота.
const PROBE_BATCH_SIZE = 5;
const PROBE_BATCH_INTERVAL_MS = 1_000;
const PROBE_TIMEOUT_MS = 5_000;

export type BotAccessCheckState = {
	status: 'idle' | 'running' | 'completed';
	total: number;
	checked: number;
	blockedFound: number;
	errors: number;
	startedAt: string | null;
	finishedAt: string | null;
};

let state: BotAccessCheckState = {
	status: 'idle',
	total: 0,
	checked: 0,
	blockedFound: 0,
	errors: 0,
	startedAt: null,
	finishedAt: null
};

let running: Promise<void> | null = null;

function wait(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getBotAccessCheckState(): BotAccessCheckState {
	return { ...state };
}

/**
 * Telegram не отдаёт боту готовый список заблокировавших его пользователей.
 * Проверяем право писать без сообщения через sendChatAction. В открытом чате
 * пользователь может на несколько секунд увидеть статус «печатает…».
 */
export async function startBotAccessCheck(): Promise<BotAccessCheckState> {
	if (running) return getBotAccessCheckState();

	const contacts = await db
		.select({
			id: schema.botContacts.id,
			telegramUserId: schema.botContacts.telegramUserId,
			botBlocked: schema.botContacts.botBlocked
		})
		.from(schema.botContacts)
		.orderBy(asc(schema.botContacts.id));

	state = {
		status: 'running',
		total: contacts.length,
		checked: 0,
		blockedFound: 0,
		errors: 0,
		startedAt: new Date().toISOString(),
		finishedAt: null
	};

	async function probe(contact: (typeof contacts)[number]) {
		let finished = false;
		while (!finished) {
			try {
				await clientBotApi.sendChatAction(
					contact.telegramUserId,
					'typing',
					undefined,
					apiDeadline(PROBE_TIMEOUT_MS)
				);
				if (contact.botBlocked) await setBotBlocked(contact.id, false);
				finished = true;
			} catch (error) {
				if (error instanceof GrammyError && error.error_code === 403) {
					// Повторно применяем и для уже архивных контактов: это гарантирует,
					// что старая ожидающая очередь тоже будет снята после обновления.
					await setBotBlocked(contact.id, true);
					state.blockedFound++;
					finished = true;
				} else if (error instanceof GrammyError && error.error_code === 429) {
					await wait(Math.max(1, error.parameters.retry_after ?? 1) * 1_000);
				} else {
					state.errors++;
					finished = true;
				}
			}
		}

		state.checked++;
	}

	running = (async () => {
		for (let offset = 0; offset < contacts.length; offset += PROBE_BATCH_SIZE) {
			await Promise.all(contacts.slice(offset, offset + PROBE_BATCH_SIZE).map(probe));
			if (offset + PROBE_BATCH_SIZE < contacts.length) await wait(PROBE_BATCH_INTERVAL_MS);
		}

		state.status = 'completed';
		state.finishedAt = new Date().toISOString();
	})()
		.catch((error) => {
			console.error('[bot-contacts] Ошибка массовой проверки доступности:', error);
			state.errors++;
			state.status = 'completed';
			state.finishedAt = new Date().toISOString();
		})
		.finally(() => {
			const durationSeconds = state.startedAt
				? Math.round((Date.now() - new Date(state.startedAt).getTime()) / 1_000)
				: 0;
			console.log(
				`[bot-contacts] проверка отписок завершена: проверено ${state.checked}/${state.total}, недоступно ${state.blockedFound}, ошибок ${state.errors}, ${durationSeconds} с`
			);
			running = null;
		});

	return getBotAccessCheckState();
}

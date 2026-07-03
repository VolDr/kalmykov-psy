// Планировщик отложенных шагов сценариев бота — по образцу scheduler.server.ts
import cron from 'node-cron';
import { sql } from 'drizzle-orm';
import { db } from '../..';
import * as schema from '../../db/schema';
import { processDueScheduledSteps } from './bot-scenarios.server';

class BotScenarioScheduler {
	private isStarted = false;
	private tasks: ReturnType<typeof cron.schedule>[] = [];

	start() {
		if (this.isStarted) {
			console.log('Планировщик шагов бота уже запущен');
			return;
		}

		// Отправляем назревшие отложенные шаги каждую минуту.
		// Обработка батча может занять больше минуты (рассылки) — пропускаем тик,
		// пока предыдущий не закончился, иначе будут дубли отправок.
		let processing = false;
		const stepsTask = cron.schedule('* * * * *', async () => {
			if (processing) return;
			processing = true;
			try {
				const results = await processDueScheduledSteps();
				if (results.processed > 0) {
					console.log(
						`[bot-cron] шаги сценариев: отправлено ${results.sent}/${results.processed}, ошибок ${results.errors}`
					);
				}
			} catch (error) {
				console.error('[bot-cron] Ошибка обработки отложенных шагов:', error);
			} finally {
				processing = false;
			}
		});

		// Чистим сырые payload'ы апдейтов старше 30 дней (нужны только для отладки) —
		// раз в сутки, чтобы jsonb не раздувал таблицу bot_messages
		const cleanupTask = cron.schedule('20 4 * * *', async () => {
			try {
				const result = await db
					.update(schema.botMessages)
					.set({ payload: null })
					.where(
						sql`${schema.botMessages.payload} is not null and ${schema.botMessages.createdAt} < now() - interval '30 days'`
					);
				if ((result.rowCount ?? 0) > 0) {
					console.log(`[bot-cron] очищено payload у ${result.rowCount} старых сообщений`);
				}
			} catch (error) {
				console.error('[bot-cron] Ошибка очистки payload:', error);
			}
		});

		this.tasks = [stepsTask, cleanupTask];
		this.isStarted = true;
		console.log('Планировщик шагов бота запущен (проверка каждую минуту)');
	}

	stop() {
		for (const task of this.tasks) task.stop();
		this.tasks = [];
		this.isStarted = false;
		console.log('Планировщик шагов бота остановлен');
	}
}

export const botScenarioScheduler = new BotScenarioScheduler();

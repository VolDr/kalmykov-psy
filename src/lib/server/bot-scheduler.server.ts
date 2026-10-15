// Планировщик отложенных шагов сценариев бота — по образцу scheduler.server.ts
import cron from 'node-cron';
import { sql } from 'drizzle-orm';
import { db } from '../..';
import * as schema from '../../db/schema';
import { processDueScheduledSteps } from './bot-scenarios.server';
import { startBotAccessCheck } from './bot-contact-access.server';
import { uploadOfflineConversions } from './bot-funnel.server';
import { retryStalledQuizDeliveries } from './quiz-bot.server';
import { startApiWarmup } from './telegram-client-bot.server';

class BotScenarioScheduler {
	private isStarted = false;
	private tasks: ReturnType<typeof cron.schedule>[] = [];
	private stopWarmup: (() => void) | null = null;

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
			}

			// Разбор опросника выдаётся вне очереди шагов (у него нет ни сценария,
			// ни шага) и в фоне после ответа на callback. Если процесс перезапустят
			// на середине, доиграть выдачу больше некому — кнопка уже снята.
			try {
				const recovered = await retryStalledQuizDeliveries();
				if (recovered > 0) {
					console.log(`[bot-cron] доиграно разборов опросника: ${recovered}`);
				}
			} catch (error) {
				console.error('[bot-cron] Ошибка повторной выдачи разборов:', error);
			} finally {
				processing = false;
			}
		});

		// Чистим сырые payload'ы апдейтов старше 30 дней (нужны только для отладки) —
		// раз в сутки, чтобы jsonb не раздувал таблицу bot_messages.
		// Заодно подрезаем историю очереди: через неё проходит каждый шаг каждой
		// цепочки, включая мгновенные, поэтому отработавшие записи копятся быстро.
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

			// 30 дней — запас на разбор жалоб «мне не пришло», дальше история очереди
			// не нужна. Удалять можно всё подряд: нажатие по старой кнопке шлагбаума
			// теперь перезапускает цепочку так же, как повторный /start, поэтому
			// хранить память о давних нажатиях вечно незачем.
			try {
				const removed = await db.delete(schema.botScheduledSteps).where(
					sql`${schema.botScheduledSteps.status} <> 'pending'
							and ${schema.botScheduledSteps.processedAt} < now() - interval '30 days'`
				);
				if ((removed.rowCount ?? 0) > 0) {
					console.log(`[bot-cron] удалено ${removed.rowCount} отработавших заданий очереди`);
				}
			} catch (error) {
				console.error('[bot-cron] Ошибка очистки очереди шагов:', error);
			}
		});

		// Отдаём Директу офлайн-конверсии «дошёл до бота» и «подписался» раз в час.
		// Без YANDEX_METRIKA_OAUTH_TOKEN выгрузка no-op, события копятся в базе
		// и уедут при первой успешной попытке.
		const offlineTask = cron.schedule('7 * * * *', async () => {
			try {
				const { sent, expired } = await uploadOfflineConversions();
				if (sent > 0 || expired > 0) {
					console.log(`[bot-cron] офлайн-конверсии: отправлено ${sent}, просрочено ${expired}`);
				}
			} catch (error) {
				console.error('[bot-cron] Ошибка выгрузки офлайн-конверсий:', error);
			}
		});

		// Telegram не отдаёт список заблокировавших бота, поэтому раз в сутки
		// аккуратно проверяем доступность контактов через sendChatAction. Новые
		// блокировки между проверками по-прежнему фиксирует my_chat_member.
		const accessCheckTask = cron.schedule(
			'45 4 * * *',
			async () => {
				try {
					const check = await startBotAccessCheck();
					console.log(`[bot-cron] проверка отписавшихся запущена для ${check.total} контактов`);
				} catch (error) {
					console.error('[bot-cron] Не удалось запустить проверку отписавшихся:', error);
				}
			},
			{ timezone: 'Europe/Moscow' }
		);

		this.tasks = [stepsTask, cleanupTask, offlineTask, accessCheckTask];
		this.stopWarmup = startApiWarmup();
		this.isStarted = true;
		console.log('Планировщик шагов бота запущен (проверка каждую минуту)');
	}

	stop() {
		for (const task of this.tasks) task.stop();
		this.tasks = [];
		this.stopWarmup?.();
		this.stopWarmup = null;
		this.isStarted = false;
		console.log('Планировщик шагов бота остановлен');
	}
}

export const botScenarioScheduler = new BotScenarioScheduler();

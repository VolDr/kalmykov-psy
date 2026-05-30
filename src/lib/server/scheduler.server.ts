// app/services/scheduler.server.ts
import cron from 'node-cron';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { notificationService } from './notification.server';
import { releaseExpiredLocks } from './booking.server';
import { releaseExpiredPayments } from './robokassa.server';

// Настраиваем timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

class NotificationScheduler {
	private isStarted = false;

	start() {
		if (this.isStarted) {
			console.log('Планировщик уведомлений уже запущен');
			return;
		}

		// Проверяем уведомления каждые 5 минут
		cron.schedule('*/5 * * * *', async () => {
			try {
				console.log(
					'Проверка уведомлений...',
					dayjs().tz('Europe/Moscow').format('DD.MM.YYYY HH:mm:ss')
				);
				const results = await notificationService.checkAndSendNotifications();

				if (results.sent > 0) {
					console.log(`Отправлено уведомлений: ${results.sent}/${results.processed}`);
				}

				if (results.errors > 0) {
					console.log(`Ошибок при отправке: ${results.errors}`);
				}
			} catch (error) {
				console.error('Ошибка в планировщике уведомлений:', error);
			}
		});

		// Освобождаем просроченные брони каждую минуту
		cron.schedule('* * * * *', async () => {
			try {
				const released = await releaseExpiredLocks();
				console.log(`[cron] releaseExpiredLocks: ${released} освобождено`);
			} catch (error) {
				console.error('[cron] Ошибка при освобождении броней:', error);
			}
		});

		// Помечаем просроченные платежи как failed каждую минуту
		cron.schedule('* * * * *', async () => {
			try {
				const count = await releaseExpiredPayments();
				console.log(`[cron] releaseExpiredPayments: ${count} помечено как failed`);
			} catch (error) {
				console.error('[cron] Ошибка при обновлении просроченных платежей:', error);
			}
		});

		this.isStarted = true;
		console.log('Планировщик уведомлений запущен (проверка каждые 5 минут)');
	}

	stop() {
		cron.destroy();
		this.isStarted = false;
		console.log('Планировщик уведомлений остановлен');
	}
}

export const notificationScheduler = new NotificationScheduler();

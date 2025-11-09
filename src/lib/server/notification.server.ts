import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { db } from '../..';
import * as schema from '../../db/schema';
import { and, eq, gte, lte } from 'drizzle-orm';
import { telegramService } from './telegram.server';

// Настраиваем timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

// Устанавливаем московский timezone по умолчанию
dayjs.tz.setDefault('Europe/Moscow');

type NotificationType = '24h' | '1h';

class NotificationService {
  async checkAndSendNotifications() {
    const now = dayjs().tz('Europe/Moscow');

    // Получаем все активные записи на ближайшие 25 часов
    const activities = await db
      .select()
      .from(schema.activity)
      .where(
        and(
          eq(schema.activity.disabled, false),
          eq(schema.activity.status, 'active'),
          gte(schema.activity.scheduledDate, now.toISOString()),
          lte(schema.activity.scheduledDate, now.add(25, 'hours').toISOString())
        )
      );

    // Загружаем клиентов для каждой активности
    const activitiesWithClients = await Promise.all(
      activities.map(async (activity) => {
        const [client] = await db
          .select()
          .from(schema.client)
          .where(eq(schema.client.id, activity.clientId))
          .limit(1);
        return {
          ...activity,
          client
        };
      })
    );

    const results = {
      processed: activitiesWithClients.length,
      sent: 0,
      errors: 0,
      details: [] as Array<{
        activity: string;
        type: NotificationType;
        status: string;
      }>,
    };

    for (const activity of activitiesWithClients) {
      const scheduledTime = dayjs(activity.scheduledDate).tz('Europe/Moscow');
      const timeDiff = scheduledTime.diff(now, 'minutes');

      console.log(
        `🔍 Проверяем: ${activity.client.nick || activity.client.name} - ${scheduledTime.format('DD.MM HH:mm')} (через ${Math.round((timeDiff / 60) * 10) / 10}ч)`
      );

      // РАСШИРЕННЫЕ временные окна для надежности

      // Уведомление за 24 часа: от 25 часов до 22 часов до события
      if (timeDiff <= 25 * 60 && timeDiff >= 22 * 60) {
        console.log(
          `📅 Пора отправить уведомление за день (через ${Math.round((timeDiff / 60) * 10) / 10}ч)`
        );
        const sent = await this.sendNotificationIfNotSent(activity, '24h');
        if (sent) {
          results.sent++;
          results.details.push({
            activity: activity.client.nick || activity.client.name,
            type: '24h',
            status: 'sent',
          });
        }
      }

      // Уведомление за 1 час: от 2 часов до 45 минут до события
      if (timeDiff <= 2 * 60 && timeDiff >= 45) {
        console.log(
          `⏰ Пора отправить уведомление за час (через ${Math.round(timeDiff)}мин)`
        );
        const sent = await this.sendNotificationIfNotSent(activity, '1h');
        if (sent) {
          results.sent++;
          results.details.push({
            activity: activity.client.nick || activity.client.name,
            type: '1h',
            status: 'sent',
          });
        }
      }

      // ДОПОЛНИТЕЛЬНО: поиск пропущенных уведомлений
      await this.checkMissedNotifications(activity, now, results);
    }

    // Очищаем старые записи
    await this.cleanupOldData();

    if (results.sent > 0) {
      console.log(`📨 Отправлено уведомлений: ${results.sent}`);
      results.details.forEach((detail) => {
        console.log(
          `  - ${detail.type} для ${detail.activity}: ${detail.status}`
        );
      });
    } else if (results.processed > 0) {
      console.log(
        `📋 Обработано ${results.processed} записей, уведомлений не требуется`
      );
    } else {
      console.log(`📭 Нет записей для проверки`);
    }

    return results;
  }

  private async sendNotificationIfNotSent(
    activity: any,
    type: NotificationType
  ): Promise<boolean> {
    const key = this.getNotificationKey(activity.id, type);

    // Проверяем в файловом хранилище
    if (await this.isNotificationSent(key)) {
      console.log(
        `⏭️ ${type} уведомление уже отправлено для: ${activity.client.nick || activity.client.name}`
      );
      return false; // Уже отправлено
    }

    try {
      console.log(
        `📤 Отправляем ${type} уведомление для: ${activity.client.nick || activity.client.name}`
      );
      const success = await telegramService.sendAppointmentReminder(
        activity,
        activity.client,
        type
      );

      if (success) {
        // Отмечаем как отправленное
        await this.markNotificationSent(key, activity, type);
        console.log(
          `✅ ${type} уведомление отправлено: ${activity.client.nick || activity.client.name}`
        );
        return true;
      } else {
        console.log(
          `❌ Ошибка отправки ${type} уведомления: ${activity.client.nick || activity.client.name}`
        );
        return false;
      }
    } catch (error) {
      console.error(`💥 Исключение при отправке ${type} уведомления:`, error);
      return false;
    }
  }

  // Поиск пропущенных уведомлений
  private async checkMissedNotifications(
    activity: any,
    now: dayjs.Dayjs,
    results: any
  ) {
    const scheduledTime = dayjs(activity.scheduledDate).tz('Europe/Moscow');
    const timeDiff = scheduledTime.diff(now, 'minutes');

    // Если до события меньше 22 часов, но уведомление за день не отправлено
    if (timeDiff < 22 * 60 && timeDiff > 45) {
      const dayKey = this.getNotificationKey(activity.id, '24h');
      if (!(await this.isNotificationSent(dayKey))) {
        console.log(
          `⚠️ ПРОПУЩЕНО уведомление за день для: ${activity.client.nick || activity.client.name}`
        );
        const sent = await this.sendNotificationIfNotSent(activity, '24h');
        if (sent) {
          results.sent++;
          results.details.push({
            activity: activity.client.nick || activity.client.name,
            type: '24h',
            status: 'recovered',
          });
        }
      }
    }

    // Если до события меньше 45 минут, но уведомление за час не отправлено
    if (timeDiff < 45 && timeDiff > 0) {
      const hourKey = this.getNotificationKey(activity.id, '1h');
      if (!(await this.isNotificationSent(hourKey))) {
        console.log(
          `⚠️ ПРОПУЩЕНО уведомление за час для: ${activity.client.nick || activity.client.name}`
        );
        const sent = await this.sendNotificationIfNotSent(activity, '1h');
        if (sent) {
          results.sent++;
          results.details.push({
            activity: activity.client.nick || activity.client.name,
            type: '1h',
            status: 'recovered',
          });
        }
      }
    }
  }

  // Простое файловое хранилище для отправленных уведомлений
  private getNotificationKey(
    activityId: string,
    type: NotificationType
  ): string {
    return `${activityId}_${type}`;
  }

  private async isNotificationSent(key: string): Promise<boolean> {
    try {
      const fs = await import('fs/promises');
      const path = './tmp/notifications.json';

      try {
        const data = await fs.readFile(path, 'utf8');
        const notifications = JSON.parse(data);
        return (
          notifications[key] === true ||
          (notifications[key] && notifications[key].sent === true)
        );
      } catch {
        return false; // Файл не существует или поврежден
      }
    } catch {
      return false;
    }
  }

  private async markNotificationSent(
    key: string,
    activity: any,
    type: NotificationType
  ): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const path = './tmp/notifications.json';

      // Создаем директорию если не существует
      await fs.mkdir('./tmp', { recursive: true });

      let notifications = {};
      try {
        const data = await fs.readFile(path, 'utf8');
        notifications = JSON.parse(data);
      } catch {
        // Файл не существует - создаем новый
      }

      notifications[key] = {
        sent: true,
        timestamp: dayjs().tz('Europe/Moscow').toISOString(),
        activityId: activity.id,
        clientName: activity.client.nick || activity.client.name,
        scheduledDate: activity.scheduledDate,
        type,
      };

      await fs.writeFile(path, JSON.stringify(notifications, null, 2));
      console.log(`💾 Сохранили статус уведомления: ${key}`);
    } catch (error) {
      console.error('Ошибка сохранения статуса уведомления:', error);
    }
  }

  private async cleanupOldData() {
    try {
      const fs = await import('fs/promises');
      const path = './tmp/notifications.json';

      const data = await fs.readFile(path, 'utf8');
      const notifications = JSON.parse(data);

      const cutoffDate = dayjs().tz('Europe/Moscow').subtract(7, 'days');
      const cleaned = {};
      let cleanedCount = 0;

      for (const [key, value] of Object.entries(notifications)) {
        if (typeof value === 'object' && value && 'timestamp' in value) {
          const notificationDate = dayjs(value.timestamp);
          if (notificationDate.isAfter(cutoffDate)) {
            cleaned[key] = value;
          } else {
            cleanedCount++;
          }
        } else {
          // Старый формат - удаляем
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        await fs.writeFile(path, JSON.stringify(cleaned, null, 2));
        console.log(
          `🧹 Очищено старых уведомлений: ${cleanedCount}. Осталось: ${Object.keys(cleaned).length}`
        );
      }
    } catch (error) {
      // Ignore cleanup errors
      console.log('Ошибка очистки (не критично):', error.message);
    }
  }

  async getNotificationStatus(activityId: string) {
    const dayKey = this.getNotificationKey(activityId, '24h');
    const hourKey = this.getNotificationKey(activityId, '1h');

    return {
      day: await this.isNotificationSent(dayKey),
      hour: await this.isNotificationSent(hourKey),
    };
  }

  async testTelegramConnection() {
    return await telegramService.testConnection();
  }

  // Метод для создания тестовой записи
  async createTestNotification() {
    const testMessage = `🧪 <b>Тестовое уведомление</b>

Система уведомлений работает корректно!
Время: ${dayjs().tz('Europe/Moscow').format('DD.MM.YYYY HH:mm')}

Все готово для отправки реальных уведомлений.`;

    return await telegramService.sendNotification(testMessage);
  }
}

export const notificationService = new NotificationService();

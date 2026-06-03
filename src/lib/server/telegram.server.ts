import type { Api } from 'grammy';
import { Bot } from 'grammy';
import { SocksProxyAgent } from 'socks-proxy-agent';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

// Настраиваем timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

/** Экранирует спецсимволы HTML для Telegram parse_mode:'HTML' */
function tgEscape(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const BOT_TOKEN = '7547958197:AAGOGOTBCMRvNM8kiNV5rb-eX4T8TqGPWsI';
const CHAT_ID = '5365717876';

class TelegramService {
	private bot: Bot | null = null;
	private api: Api | null = null;

	constructor() {
		if (BOT_TOKEN) {
			const agent = new SocksProxyAgent('socks5://127.0.0.1:1080');
			this.bot = new Bot(BOT_TOKEN, {
				client: { baseFetchConfig: { agent, compress: true } }
			});
			this.api = this.bot.api;
			console.log('🤖 Telegram bot инициализирован (через SOCKS5 прокси)');
		} else {
			console.warn('⚠️ TELEGRAM_BOT_TOKEN не найден в переменных окружения');
		}
	}

	async getBotInfo() {
		if (!this.api) {
			throw new Error('Bot не инициализирован - проверьте TELEGRAM_BOT_TOKEN');
		}

		try {
			const me = await this.api.getMe();
			return {
				id: me.id,
				is_bot: me.is_bot,
				first_name: me.first_name,
				username: me.username
			};
		} catch (error: any) {
			throw new Error(`Ошибка получения информации о боте: ${error?.message}`);
		}
	}

	async getUpdates() {
		if (!this.api) {
			throw new Error('Bot не инициализирован');
		}

		try {
			const updates = await this.api.getUpdates();
			return updates.map((update) => ({
				update_id: update.update_id,
				message: update.message
					? {
							message_id: update.message.message_id,
							from: {
								id: update.message.from?.id,
								first_name: update.message.from?.first_name,
								username: update.message.from?.username
							},
							chat: {
								id: update.message.chat.id,
								type: update.message.chat.type
							},
							date: update.message.date,
							text: update.message.text
						}
					: null
			}));
		} catch (error: any) {
			throw new Error(`Ошибка получения обновлений: ${error?.message}`);
		}
	}

	async sendNotification(message: string, chatId?: string): Promise<boolean> {
		if (!this.api) {
			console.warn('Telegram bot не настроен - нет BOT_TOKEN');
			return false;
		}

		const targetChatId = chatId || CHAT_ID;
		if (!targetChatId) {
			console.warn('Telegram CHAT_ID не указан');
			return false;
		}

		try {
			await this.api.sendMessage(targetChatId, message, {
				parse_mode: 'HTML',
				link_preview_options: { is_disabled: true }
			});
			console.log('✅ Telegram уведомление отправлено');
			return true;
		} catch (error: any) {
			console.error('❌ Ошибка отправки Telegram уведомления:', error?.message || error);
			return false;
		}
	}

	async sendBookingConfirmed(params: {
		clientName: string;
		email: string;
		bookedAt: string;
		source: 'website' | 'admin';
	}) {
		const sourceLabel = params.source === 'admin' ? 'через админку' : 'через сайт';

		const message = `
✅ <b>Новая запись подтверждена</b>

👤 <b>Клиент:</b> ${tgEscape(params.clientName)}
📧 <b>Email:</b> ${tgEscape(params.email)}
📅 <b>Дата:</b> ${dayjs(params.bookedAt).tz('Europe/Moscow').format('DD.MM.YYYY')}
🕐 <b>Время:</b> ${dayjs(params.bookedAt).tz('Europe/Moscow').format('HH:mm')}
🔗 <b>Источник:</b> ${sourceLabel}
		`.trim();

		return await this.sendNotification(message);
	}

	async sendPaymentConfirmed(params: {
		email: string;
		amount: string;
		description: string;
		bookedAt?: string;
	}) {
		const sessionLine = params.bookedAt
			? `\n📅 <b>Дата:</b> ${dayjs(params.bookedAt).tz('Europe/Moscow').format('DD.MM.YYYY')}\n🕐 <b>Время:</b> ${dayjs(params.bookedAt).tz('Europe/Moscow').format('HH:mm')}`
			: '';

		const message = `
💳 <b>Оплата подтверждена</b>

📧 <b>Email:</b> ${tgEscape(params.email)}
🛒 <b>Продукт:</b> ${tgEscape(params.description)}${sessionLine}
💰 <b>Сумма:</b> ${tgEscape(params.amount)} ₽
		`.trim();

		return await this.sendNotification(message);
	}

	async sendAppointmentReminder(activity: any, client: any, hoursBeforeType: '24h' | '1h') {
		const timeText = hoursBeforeType === '24h' ? 'за день' : 'за час';
		const emoji = hoursBeforeType === '24h' ? '🗓' : '⏰';

		const message = `
${emoji} <b>Напоминание ${timeText}</b>

👤 <b>Клиент:</b> ${tgEscape(client.nick || client.name)}
📅 <b>Дата:</b> ${dayjs(activity.scheduledDate).tz('Europe/Moscow').format('DD.MM.YYYY')}
🕐 <b>Время:</b> ${dayjs(activity.scheduledDate).tz('Europe/Moscow').format('HH:mm')}
${activity.description ? `📝 <b>Описание:</b> ${tgEscape(activity.description)}` : ''}
${hoursBeforeType === '1h' ? '\n⚡ <b>Скоро встреча!</b>' : ''}
    `.trim();

		return await this.sendNotification(message);
	}
}

export const telegramService = new TelegramService();

import { db } from '../..';
import * as schema from '../../db/schema';
import { and, eq, inArray, isNotNull, isNull, or, sql } from 'drizzle-orm';
import { env } from '$env/dynamic/private';

/** Счётчик Метрики — тот же, что в src/lib/metrika.ts и в +layout.svelte */
const COUNTER_ID = 105424317;

/** Имена офлайн-целей Метрики (создаются в интерфейсе счётчика как офлайн-цели) */
const TARGET_BOT_STARTED = 'bot_started';
const TARGET_BOT_SUBSCRIBED = 'bot_subscribed';

/**
 * Отмечает шаг воронки на контакте. Все три шага write-once: повторный /start
 * или второе нажатие «Я подписался» не должны сдвигать время и слать в Метрику
 * дубль конверсии. Замер не должен ронять выдачу материала, поэтому ошибки
 * только логируются.
 */
async function markOnce(contactId: number, column: 'gateShownAt' | 'gatePassedAt'): Promise<void> {
	try {
		await db
			.update(schema.botContacts)
			.set({ [column]: sql`now()`, updatedAt: sql`now()` })
			.where(and(eq(schema.botContacts.id, contactId), isNull(schema.botContacts[column])));
	} catch (err) {
		// Замер никогда не должен мешать выдаче материала — только логируем
		console.error(`[bot-funnel] Не смог отметить ${column}:`, err);
	}
}

/**
 * Человек дошёл до бота и запустил цепочку.
 *
 * Обе колонки write-once, но независимо друг от друга: контакт мог сначала
 * написать боту напрямую (тогда bot_started_at уже стоит, а source_key пуст),
 * а потом прийти по рекламному диплинку — источник в этом случае надо записать.
 */
export async function markBotStarted(contactId: number, sourceKey: string | null): Promise<void> {
	try {
		await db
			.update(schema.botContacts)
			.set({
				botStartedAt: sql`coalesce(${schema.botContacts.botStartedAt}, now())`,
				sourceKey: sourceKey
					? sql`coalesce(${schema.botContacts.sourceKey}, ${sourceKey})`
					: schema.botContacts.sourceKey,
				updatedAt: sql`now()`
			})
			.where(eq(schema.botContacts.id, contactId));
	} catch (err) {
		console.error('[bot-funnel] Не смог отметить старт бота:', err);
	}
}

/** Человека остановил шлагбаум подписки. */
export async function markGateShown(contactId: number): Promise<void> {
	await markOnce(contactId, 'gateShownAt');
}

/**
 * Человек подписался и прошёл шлагбаум.
 *
 * Это метка аналитики на контакте, а не защита от повторного нажатия: у одного
 * человека может быть несколько цепочек со шлагбаумом, и вторая не должна
 * упираться в отметку, поставленную первой. От повторного нажатия защищает
 * снятие клавиатуры у сообщения после успешной проверки.
 */
export async function markGatePassed(contactId: number): Promise<void> {
	await markOnce(contactId, 'gatePassedAt');
}

/**
 * Воронка бота по источникам за последние N дней:
 * дошли до бота → упёрлись в шлагбаум → прошли его.
 */
export async function funnelStats(days = 30) {
	return db
		.select({
			sourceKey: schema.botContacts.sourceKey,
			started: sql<number>`count(*)::int`,
			gateShown: sql<number>`count(${schema.botContacts.gateShownAt})::int`,
			gatePassed: sql<number>`count(${schema.botContacts.gatePassedAt})::int`,
			withClientId: sql<number>`count(${schema.botContacts.metrikaClientId})::int`
		})
		.from(schema.botContacts)
		.where(
			and(
				isNotNull(schema.botContacts.botStartedAt),
				sql`${schema.botContacts.botStartedAt} > now() - make_interval(days => ${days})`
			)
		)
		.groupBy(schema.botContacts.sourceKey)
		.orderBy(sql`count(*) desc`);
}

/**
 * Отдаёт Директу офлайн-конверсии «дошёл до бота» и «подписался» по ClientID
 * Метрики. Без YANDEX_METRIKA_OAUTH_TOKEN тихо ничего не делает — контакты
 * копятся и уедут при первой успешной выгрузке.
 *
 * Метрика не принимает конверсии старше 21 дня, поэтому просроченные закрываем,
 * чтобы они не висели в очереди вечно.
 */
export async function uploadOfflineConversions(): Promise<{ sent: number; expired: number }> {
	const token = env.YANDEX_METRIKA_OAUTH_TOKEN?.trim();
	if (!token) return { sent: 0, expired: 0 };

	const fresh = sql`> now() - interval '21 days'`;
	const candidates = await db
		.select({
			id: schema.botContacts.id,
			clientId: schema.botContacts.metrikaClientId,
			botStartedAt: schema.botContacts.botStartedAt,
			gatePassedAt: schema.botContacts.gatePassedAt,
			startSentAt: schema.botContacts.metrikaStartSentAt,
			subscribedSentAt: schema.botContacts.metrikaSubscribedSentAt
		})
		.from(schema.botContacts)
		.where(
			and(
				isNotNull(schema.botContacts.metrikaClientId),
				or(
					and(
						isNotNull(schema.botContacts.botStartedAt),
						isNull(schema.botContacts.metrikaStartSentAt),
						sql`${schema.botContacts.botStartedAt} ${fresh}`
					),
					and(
						isNotNull(schema.botContacts.gatePassedAt),
						isNull(schema.botContacts.metrikaSubscribedSentAt),
						sql`${schema.botContacts.gatePassedAt} ${fresh}`
					)
				)
			)
		)
		.limit(500);

	const expired = await closeExpired();
	if (candidates.length === 0) return { sent: 0, expired };

	const lines: string[] = [];
	const startIds: number[] = [];
	const subscribedIds: number[] = [];

	for (const row of candidates) {
		if (row.botStartedAt && !row.startSentAt) {
			lines.push(`${row.clientId},${TARGET_BOT_STARTED},${unix(row.botStartedAt)}`);
			startIds.push(row.id);
		}
		if (row.gatePassedAt && !row.subscribedSentAt) {
			lines.push(`${row.clientId},${TARGET_BOT_SUBSCRIBED},${unix(row.gatePassedAt)}`);
			subscribedIds.push(row.id);
		}
	}
	if (lines.length === 0) return { sent: 0, expired };

	const form = new FormData();
	form.append(
		'file',
		new Blob([['ClientId,Target,DateTime', ...lines].join('\n')], { type: 'text/csv' }),
		'conversions.csv'
	);

	const response = await fetch(
		`https://api-metrika.yandex.net/management/v1/counter/${COUNTER_ID}/offline_conversions/upload?client_id_type=CLIENT_ID`,
		{ method: 'POST', headers: { Authorization: `OAuth ${token}` }, body: form }
	);

	// Не помечаем отправленными — уедут следующим запуском через час
	if (!response.ok) {
		throw new Error(
			`Метрика отклонила офлайн-конверсии: ${response.status} ${await response.text()}`
		);
	}

	if (startIds.length > 0) {
		await db
			.update(schema.botContacts)
			.set({ metrikaStartSentAt: sql`now()` })
			.where(inArray(schema.botContacts.id, startIds));
	}
	if (subscribedIds.length > 0) {
		await db
			.update(schema.botContacts)
			.set({ metrikaSubscribedSentAt: sql`now()` })
			.where(inArray(schema.botContacts.id, subscribedIds));
	}

	return { sent: lines.length, expired };
}

function unix(iso: string): number {
	return Math.floor(new Date(iso).getTime() / 1000);
}

/** Конверсии старше 21 дня Метрика уже не примет — закрываем очередь. */
async function closeExpired(): Promise<number> {
	const stale = sql`<= now() - interval '21 days'`;
	const starts = await db
		.update(schema.botContacts)
		.set({ metrikaStartSentAt: sql`now()` })
		.where(
			and(
				isNull(schema.botContacts.metrikaStartSentAt),
				isNotNull(schema.botContacts.botStartedAt),
				sql`${schema.botContacts.botStartedAt} ${stale}`
			)
		)
		.returning({ id: schema.botContacts.id });

	const subscribed = await db
		.update(schema.botContacts)
		.set({ metrikaSubscribedSentAt: sql`now()` })
		.where(
			and(
				isNull(schema.botContacts.metrikaSubscribedSentAt),
				isNotNull(schema.botContacts.gatePassedAt),
				sql`${schema.botContacts.gatePassedAt} ${stale}`
			)
		)
		.returning({ id: schema.botContacts.id });

	return starts.length + subscribed.length;
}

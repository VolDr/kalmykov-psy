import {
	pgTable,
	uniqueIndex,
	bigserial,
	timestamp,
	boolean,
	text,
	foreignKey,
	varchar,
	bigint,
	numeric,
	index,
	doublePrecision,
	integer,
	jsonb,
	pgEnum
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// --- Telegram-бот: CRM-контакты и инбокс (Фаза 1, см. docs/bot.md) ---

export const botMessageDirectionEnum = pgEnum('bot_message_direction', ['in', 'out']);

export const botContacts = pgTable(
	'bot_contacts',
	{
		id: bigserial('id', { mode: 'number' }).primaryKey(),
		// Публичный 9-значный id для ссылок/куки (внутренний id наружу не светим)
		publicId: bigint('public_id', { mode: 'number' }).notNull(),
		telegramUserId: bigint('telegram_user_id', { mode: 'number' }).notNull(),
		username: text('username'),
		firstName: text('first_name'),
		lastName: text('last_name'),
		// Свободный текст, не enum — этапы CRM будут меняться без миграций
		stage: text('stage').default('new').notNull(),
		tags: text('tags')
			.array()
			.default(sql`'{}'::text[]`)
			.notNull(),
		notes: text('notes'),
		// ClientID Яндекс Метрики из payload диплинка (t.me/<бот>?start=<ключ>__<clientId>).
		// Связывает человека в боте с его визитом на посадочной — без него офлайн-конверсию
		// не к чему прицепить. Пишется один раз, первый визит не перетирается.
		metrikaClientId: text('metrika_client_id'),
		// Ключ цепочки, через которую человек пришёл: 'otpusk', 'focus'. Тоже write-once.
		sourceKey: text('source_key'),
		// Замер воронки: дошёл до бота → упёрся в шлагбаум подписки → прошёл его
		botStartedAt: timestamp('bot_started_at', { withTimezone: true, mode: 'string' }),
		gateShownAt: timestamp('gate_shown_at', { withTimezone: true, mode: 'string' }),
		gatePassedAt: timestamp('gate_passed_at', { withTimezone: true, mode: 'string' }),
		// Когда соответствующая офлайн-конверсия уехала в Метрику (null — ещё в очереди)
		metrikaStartSentAt: timestamp('metrika_start_sent_at', { withTimezone: true, mode: 'string' }),
		metrikaSubscribedSentAt: timestamp('metrika_subscribed_sent_at', {
			withTimezone: true,
			mode: 'string'
		}),
		botBlocked: boolean('bot_blocked').default(false).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		lastInteractionAt: timestamp('last_interaction_at', { withTimezone: true, mode: 'string' })
	},
	(table) => [
		uniqueIndex('bot_contacts_telegram_user_id_key').on(table.telegramUserId),
		uniqueIndex('bot_contacts_public_id_key').on(table.publicId)
	]
);

export const botMessages = pgTable(
	'bot_messages',
	{
		id: bigserial('id', { mode: 'number' }).primaryKey(),
		contactId: bigint('contact_id', { mode: 'number' }).notNull(),
		direction: botMessageDirectionEnum('direction').notNull(),
		telegramMessageId: bigint('telegram_message_id', { mode: 'number' }),
		text: text('text'),
		// Сырое содержимое апдейта от Telegram — пригодится для отладки
		payload: jsonb('payload'),
		// Account.id — заполняется, когда direction='out' и это ручной ответ админа
		sentByAccountId: text('sent_by_account_id'),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull()
	},
	(table) => [
		index('bot_messages_contact_created_idx').on(table.contactId, table.createdAt),
		foreignKey({
			columns: [table.contactId],
			foreignColumns: [botContacts.id],
			name: 'bot_messages_contact_id_fkey'
		}).onDelete('cascade')
	]
);

// --- Telegram-бот: сценарии и кнопки на постах канала (Фаза 2, см. docs/bot.md) ---

export const botScenarioTriggerEnum = pgEnum('bot_scenario_trigger', [
	// Диплинк t.me/<bot>?start=<payload> — основной триггер для кнопок на постах канала
	'start_param',
	// Команда вида /start (без параметра), /help и т.п.
	'command',
	// Точное совпадение текста сообщения (без учёта регистра)
	'text'
]);

// Условие выполнения шага: пусто — шаг выполняется всегда. Проверяется в момент
// выполнения шага (для отложенных — когда его достаёт cron), поэтому подписка,
// оформленная во время задержки, учитывается.
export const botStepConditionEnum = pgEnum('bot_step_condition', ['subscribed', 'not_subscribed']);

// Тип кнопки шага: 'url' — обычная ссылка; 'check_subscription' — «шлагбаум»:
// под сообщением две кнопки (ссылка на канал из button_url + callback-кнопка
// button_text), цепочка останавливается и продолжается по нажатию.
export const botStepButtonActionEnum = pgEnum('bot_step_button_action', [
	'url',
	'check_subscription'
]);

// skipped — условие шага не выполнилось, отправлять было нечего. Это не 'sent'
// (сообщение не уходило, иначе статистика врёт) и не 'cancelled' (ничего не
// ломалось, поднимать такую запись повторным нажатием кнопки не нужно).
export const botScheduledStepStatusEnum = pgEnum('bot_scheduled_step_status', [
	'pending',
	'sent',
	'skipped',
	'failed',
	'cancelled'
]);

// funnel — воронка (запускается триггером), broadcast — рассылка (запускается вручную по сегменту)
export const botScenarioKindEnum = pgEnum('bot_scenario_kind', ['funnel', 'broadcast']);

export const botScenarios = pgTable('bot_scenarios', {
	id: bigserial('id', { mode: 'number' }).primaryKey(),
	name: text('name').notNull(),
	kind: botScenarioKindEnum('kind').default('funnel').notNull(),
	// Для рассылок триггер необязателен (запуск вручную по сегменту)
	triggerType: botScenarioTriggerEnum('trigger_type'),
	triggerValue: text('trigger_value'),
	enabled: boolean('enabled').default(false).notNull(),
	// При запуске отменяет все ожидающие шаги других цепочек контакта (кроме защищённых)
	cancelsOthers: boolean('cancels_others').default(false).notNull(),
	// «Не отменять»: цепочка переживает отмену со стороны cancelsOthers-сценариев
	protectedFromCancel: boolean('protected_from_cancel').default(false).notNull(),
	// Кулдаун: не запускать для контакта чаще раза в N дней (0 — без ограничений)
	cooldownDays: integer('cooldown_days').default(0).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
});

export const botScenarioSteps = pgTable(
	'bot_scenario_steps',
	{
		id: bigserial('id', { mode: 'number' }).primaryKey(),
		scenarioId: bigint('scenario_id', { mode: 'number' }).notNull(),
		position: integer('position').notNull(),
		// Задержка перед этим шагом относительно предыдущего; 0 — выполняется сразу
		delaySeconds: integer('delay_seconds').default(0).notNull(),
		messageText: text('message_text'),
		// Inline-кнопка под сообщением (обе колонки либо заполнены, либо null)
		buttonText: text('button_text'),
		buttonUrl: text('button_url'),
		// null — шаг выполняется всегда; иначе выполняется только при совпадении условия
		condition: botStepConditionEnum('condition'),
		// 'check_subscription' превращает кнопку в шлагбаум и останавливает цепочку
		buttonAction: botStepButtonActionEnum('button_action').default('url').notNull(),
		// Запустить другую цепочку (сценарий/рассылку) после выполнения этого шага
		startScenarioId: bigint('start_scenario_id', { mode: 'number' }),
		addTags: text('add_tags')
			.array()
			.default(sql`'{}'::text[]`)
			.notNull(),
		setStage: text('set_stage'),
		// Файл-вложение: оригинальное имя (для админки и Telegram), имя файла
		// в uploads/bot-files и кеш telegram file_id после первой отправки
		fileName: text('file_name'),
		filePath: text('file_path'),
		fileTelegramId: text('file_telegram_id'),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull()
	},
	(table) => [
		index('bot_scenario_steps_scenario_position_idx').on(table.scenarioId, table.position),
		foreignKey({
			columns: [table.scenarioId],
			foreignColumns: [botScenarios.id],
			name: 'bot_scenario_steps_scenario_id_fkey'
		}).onDelete('cascade'),
		foreignKey({
			columns: [table.startScenarioId],
			foreignColumns: [botScenarios.id],
			name: 'bot_scenario_steps_start_scenario_id_fkey'
		}).onDelete('set null')
	]
);

// Последний запуск цепочки по контакту — для кулдауна «не чаще раза в N дней»
export const botScenarioRuns = pgTable(
	'bot_scenario_runs',
	{
		id: bigserial('id', { mode: 'number' }).primaryKey(),
		contactId: bigint('contact_id', { mode: 'number' }).notNull(),
		scenarioId: bigint('scenario_id', { mode: 'number' }).notNull(),
		lastStartedAt: timestamp('last_started_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull()
	},
	(table) => [
		uniqueIndex('bot_scenario_runs_contact_scenario_key').on(table.contactId, table.scenarioId),
		foreignKey({
			columns: [table.contactId],
			foreignColumns: [botContacts.id],
			name: 'bot_scenario_runs_contact_id_fkey'
		}).onDelete('cascade'),
		foreignKey({
			columns: [table.scenarioId],
			foreignColumns: [botScenarios.id],
			name: 'bot_scenario_runs_scenario_id_fkey'
		}).onDelete('cascade')
	]
);

// История запусков рассылок по сегменту
export const botBroadcastRuns = pgTable(
	'bot_broadcast_runs',
	{
		id: bigserial('id', { mode: 'number' }).primaryKey(),
		scenarioId: bigint('scenario_id', { mode: 'number' }).notNull(),
		requireTags: text('require_tags')
			.array()
			.default(sql`'{}'::text[]`)
			.notNull(),
		excludeTags: text('exclude_tags')
			.array()
			.default(sql`'{}'::text[]`)
			.notNull(),
		matchedCount: integer('matched_count').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull()
	},
	(table) => [
		foreignKey({
			columns: [table.scenarioId],
			foreignColumns: [botScenarios.id],
			name: 'bot_broadcast_runs_scenario_id_fkey'
		}).onDelete('cascade')
	]
);

export const botScheduledSteps = pgTable(
	'bot_scheduled_steps',
	{
		id: bigserial('id', { mode: 'number' }).primaryKey(),
		contactId: bigint('contact_id', { mode: 'number' }).notNull(),
		scenarioId: bigint('scenario_id', { mode: 'number' }).notNull(),
		stepId: bigint('step_id', { mode: 'number' }).notNull(),
		// Для продолжений после callback-шлагбаума: связывает задание с исходной
		// кнопкой и сообщением. Тройка contact + sourceStep + sourceMessage
		// не даёт повторной доставке одного callback поставить дублирующий хвост.
		sourceStepId: bigint('source_step_id', { mode: 'number' }),
		sourceMessageId: bigint('source_message_id', { mode: 'number' }),
		// Глубина вложенных запусков «шаг стартует другую цепочку». Живёт в строке,
		// а не в памяти процесса: иначе цикл A → B → A с задержкой сбрасывал бы
		// счётчик на каждом проходе крона и крутился бы вечно мимо MAX_CHAIN_DEPTH.
		chainDepth: integer('chain_depth').default(0).notNull(),
		status: botScheduledStepStatusEnum('status').default('pending').notNull(),
		scheduledAt: timestamp('scheduled_at', { withTimezone: true, mode: 'string' }).notNull(),
		attempts: integer('attempts').default(0).notNull(),
		lastError: text('last_error'),
		cancellationReason: text('cancellation_reason'),
		// Контрольные точки queued-выполнения: повтор после частичной ошибки
		// пропускает уже доставленные в Telegram части шага и применённые эффекты.
		messageTelegramId: bigint('message_telegram_id', { mode: 'number' }),
		fileTelegramMessageId: bigint('file_telegram_message_id', { mode: 'number' }),
		effectsAppliedAt: timestamp('effects_applied_at', { withTimezone: true, mode: 'string' }),
		childScenarioStartedAt: timestamp('child_scenario_started_at', {
			withTimezone: true,
			mode: 'string'
		}),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		processedAt: timestamp('processed_at', { withTimezone: true, mode: 'string' })
	},
	(table) => [
		index('bot_scheduled_steps_status_scheduled_idx').on(table.status, table.scheduledAt),
		index('bot_scheduled_steps_contact_idx').on(table.contactId),
		// Частичный намеренно: обычные шаги очереди приходят с пустым source_step_id,
		// и хотя NULL'ы в уникальном индексе Postgres и так считает различными,
		// полагаться на это неявно не стоит — заодно индекс не хранит всю рассылку.
		uniqueIndex('bot_scheduled_steps_gate_callback_key')
			.on(table.contactId, table.sourceStepId, table.sourceMessageId)
			.where(sql`${table.sourceStepId} is not null`),
		foreignKey({
			columns: [table.contactId],
			foreignColumns: [botContacts.id],
			name: 'bot_scheduled_steps_contact_id_fkey'
		}).onDelete('cascade'),
		foreignKey({
			columns: [table.scenarioId],
			foreignColumns: [botScenarios.id],
			name: 'bot_scheduled_steps_scenario_id_fkey'
		}).onDelete('cascade'),
		foreignKey({
			columns: [table.stepId],
			foreignColumns: [botScenarioSteps.id],
			name: 'bot_scheduled_steps_step_id_fkey'
		}).onDelete('cascade'),
		// set null, а не cascade: удаление шага-шлагбаума не должно уносить уже
		// поставленные хвосты. Побочный эффект — такая запись выпадает из
		// уникального индекса выше и теряет защиту от повторного callback, но
		// нажимать там уже нечего: кнопка жила в сообщении удалённого шага.
		foreignKey({
			columns: [table.sourceStepId],
			foreignColumns: [botScenarioSteps.id],
			name: 'bot_scheduled_steps_source_step_id_fkey'
		}).onDelete('set null')
	]
);

export const botChannelPosts = pgTable(
	'bot_channel_posts',
	{
		id: bigserial('id', { mode: 'number' }).primaryKey(),
		// Подпись для админа, чтобы отличать кнопки в списке
		title: text('title'),
		// '@channelname' для публичных каналов или '-100…' для приватных
		chatId: text('chat_id').notNull(),
		messageId: bigint('message_id', { mode: 'number' }).notNull(),
		buttonText: text('button_text').notNull(),
		scenarioId: bigint('scenario_id', { mode: 'number' }).notNull(),
		requireSubscription: boolean('require_subscription').default(true).notNull(),
		// Текст алерта при клике без подписки (null — дефолтный); лимит Telegram — 200 символов
		subscriptionPrompt: text('subscription_prompt'),
		clicks: integer('clicks').default(0).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull()
	},
	(table) => [
		foreignKey({
			columns: [table.scenarioId],
			foreignColumns: [botScenarios.id],
			name: 'bot_channel_posts_scenario_id_fkey'
		}).onDelete('restrict')
	]
);

// --- Instagram: автоответы по ключевым словам (комментарии и директ), см. docs/instagram.md ---

export const instagramRuleTriggerEnum = pgEnum('instagram_rule_trigger', [
	// Комментарий под постом/рилсом: публичный ответ и/или private reply в директ
	'comment',
	// Входящее сообщение в директ
	'dm'
]);

export const instagramRules = pgTable('instagram_rules', {
	id: bigserial('id', { mode: 'number' }).primaryKey(),
	name: text('name').notNull(),
	triggerType: instagramRuleTriggerEnum('trigger_type').notNull(),
	// Срабатывает, если текст содержит любое из слов (без учёта регистра)
	keywords: text('keywords')
		.array()
		.default(sql`'{}'::text[]`)
		.notNull(),
	// true — текст должен целиком совпадать с ключевым словом, а не содержать его
	matchExact: boolean('match_exact').default(false).notNull(),
	// Ограничить правило одним постом/рилсом (media id из Graph API); null — все посты
	mediaId: text('media_id'),
	// Публичный ответ под комментарием (только для trigger=comment)
	commentReplyText: text('comment_reply_text'),
	// Сообщение в директ: private reply на коммент или ответ в переписке
	dmText: text('dm_text'),
	enabled: boolean('enabled').default(false).notNull(),
	hits: integer('hits').default(0).notNull(),
	lastHitAt: timestamp('last_hit_at', { withTimezone: true, mode: 'string' }),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
});

// Обработанные comment id / message id — идемпотентность (Meta ретраит вебхуки)
// и гарантия «не больше одного private reply на комментарий» (лимит Meta).
export const instagramProcessed = pgTable(
	'instagram_processed',
	{
		id: bigserial('id', { mode: 'number' }).primaryKey(),
		objectId: text('object_id').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull()
	},
	(table) => [uniqueIndex('instagram_processed_object_id_key').on(table.objectId)]
);

// --- Лид-статьи (клип-лендинги) с опросником и разбором результатов в боте, см. docs/clip-articles.md ---

/** Один «экран» клип-статьи; хранится в jsonb-массиве clip_articles.pages */
export type ClipArticlePage = {
	heading?: string;
	text: string;
	buttonText?: string;
	// URL картинки под текстом; путь из static (напр. /lmc/1.webp) или внешний https
	imageUrl?: string;
};

export const clipArticles = pgTable(
	'clip_articles',
	{
		id: bigserial('id', { mode: 'number' }).primaryKey(),
		// Часть URL: /useful/<slug>
		slug: text('slug').notNull(),
		title: text('title').notNull(),
		subtitle: text('subtitle'),
		enabled: boolean('enabled').default(false).notNull(),
		pages: jsonb('pages')
			.$type<ClipArticlePage[]>()
			.default(sql`'[]'::jsonb`)
			.notNull(),
		// Опросник BAT-23 в конце статьи (на сайте показывается только общий результат)
		quizEnabled: boolean('quiz_enabled').default(true).notNull(),
		quizButtonText: text('quiz_button_text'),
		resultHeading: text('result_heading'),
		// Текст под общим результатом — свой для каждой зоны
		resultTextGreen: text('result_text_green'),
		resultTextOrange: text('result_text_orange'),
		resultTextRed: text('result_text_red'),
		// Приглашение получить разбор по сферам в боте
		botCtaText: text('bot_cta_text'),
		botCtaButtonText: text('bot_cta_button_text'),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull()
	},
	(table) => [uniqueIndex('clip_articles_slug_key').on(table.slug)]
);

/** Рекомендации по сферам для бота: { exhaustion: { orange: '…', red: '…' }, … } */
export type QuizSphereRecs = Record<string, Partial<Record<'orange' | 'red', string>>>;

// Настройки выдачи результатов опросника в боте — одна строка (singleton)
export const quizBotSettings = pgTable('quiz_bot_settings', {
	id: bigserial('id', { mode: 'number' }).primaryKey(),
	// Username бота без @ для диплинков; пусто — берётся из getMe()
	botUsername: text('bot_username'),
	// '@channelname' или '-100…' — канал для проверки подписки
	channelChatId: text('channel_chat_id'),
	// Ссылка для кнопки «Подписаться» (https://t.me/…)
	channelUrl: text('channel_url'),
	requireSubscription: boolean('require_subscription').default(true).notNull(),
	subscribeText: text('subscribe_text'),
	subscribeButtonText: text('subscribe_button_text'),
	checkButtonText: text('check_button_text'),
	// Алерт при клике «я подписался» без подписки; лимит Telegram — 200 символов
	notSubscribedAlert: text('not_subscribed_alert'),
	resultsHeaderText: text('results_header_text'),
	resultsFooterText: text('results_footer_text'),
	sphereRecs: jsonb('sphere_recs')
		.$type<QuizSphereRecs>()
		.default(sql`'{}'::jsonb`)
		.notNull(),
	allGreenText: text('all_green_text'),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
});

/** Срез результата по субшкале — хранится в jsonb quiz_results.subscales */
export type QuizSubscaleResult = {
	id: string;
	name: string;
	averageScore: number;
	severity: string;
	color: string;
};

// Результат прохождения опросника на сайте; token — payload диплинка t.me/<бот>?start=qr_<token>
export const quizResults = pgTable(
	'quiz_results',
	{
		id: bigserial('id', { mode: 'number' }).primaryKey(),
		token: text('token').notNull(),
		articleSlug: text('article_slug'),
		totalScore: doublePrecision('total_score').notNull(),
		averageScore: doublePrecision('average_score'),
		severity: text('severity').notNull(),
		color: text('color').notNull(),
		subscales: jsonb('subscales')
			.$type<QuizSubscaleResult[]>()
			.default(sql`'[]'::jsonb`)
			.notNull(),
		// Контакт бота, который забрал результат по диплинку
		contactId: bigint('contact_id', { mode: 'number' }),
		// Момент, когда выдача разбора началась. Отделяет «упало на середине»
		// (есть start, нет delivered — такое надо повторить) от «человек ещё не
		// прошёл шлагбаум подписки» (нет ни того, ни другого — повторять нечего).
		deliveryStartedAt: timestamp('delivery_started_at', { withTimezone: true, mode: 'string' }),
		deliveredAt: timestamp('delivered_at', { withTimezone: true, mode: 'string' }),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull()
	},
	(table) => [
		uniqueIndex('quiz_results_token_key').on(table.token),
		foreignKey({
			columns: [table.contactId],
			foreignColumns: [botContacts.id],
			name: 'quiz_results_contact_id_fkey'
		}).onDelete('set null')
	]
);

export const analyticsEvents = pgTable('analytics_events', {
	id: bigserial('id', { mode: 'number' }).primaryKey(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	goal: text('goal').notNull(),
	sessionId: text('session_id'),
	page: text('page'),
	params: jsonb('params')
});

export const source = pgTable(
	'Source',
	{
		id: bigserial({ mode: 'bigint' }).primaryKey().notNull(),
		createdAt: timestamp({ precision: 3, withTimezone: true, mode: 'string' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, withTimezone: true, mode: 'string' }).notNull(),
		disabled: boolean().default(false).notNull(),
		name: text().notNull()
	},
	(table) => [
		uniqueIndex('Source_name_key').using('btree', table.name.asc().nullsLast().op('text_ops'))
	]
);

export const client = pgTable(
	'Client',
	{
		id: text().primaryKey().notNull(),
		createdAt: timestamp({ precision: 3, withTimezone: true, mode: 'string' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, withTimezone: true, mode: 'string' }).notNull(),
		disabled: boolean().default(false).notNull(),
		name: text().notNull(),
		description: varchar(),
		nick: text(),
		// You can use { mode: "bigint" } if numbers are exceeding js number limitations
		sourceId: bigint({ mode: 'number' }).notNull(),
		invocation: text(),
		gender: text()
	},
	(table) => [
		uniqueIndex('Client_name_key').using('btree', table.name.asc().nullsLast().op('text_ops')),
		uniqueIndex('Client_nick_key').using('btree', table.nick.asc().nullsLast().op('text_ops')),
		foreignKey({
			columns: [table.sourceId],
			foreignColumns: [source.id],
			name: 'Client_sourceId_fkey'
		})
			.onUpdate('cascade')
			.onDelete('restrict')
	]
);

export const activity = pgTable(
	'Activity',
	{
		id: text().primaryKey().notNull(),
		createdAt: timestamp({ precision: 3, withTimezone: true, mode: 'string' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, withTimezone: true, mode: 'string' }).notNull(),
		disabled: boolean().default(false).notNull(),
		scheduledDate: timestamp({ precision: 3, withTimezone: true, mode: 'string' }).notNull(),
		scheduledDay: timestamp({ precision: 3, withTimezone: true, mode: 'string' }).notNull(),
		description: text(),
		rejectReason: text(),
		status: text().notNull(),
		income: numeric({ precision: 65, scale: 30 }),
		clientId: text().notNull()
	},
	(table) => [
		foreignKey({
			columns: [table.clientId],
			foreignColumns: [client.id],
			name: 'Activity_clientId_fkey'
		})
			.onUpdate('cascade')
			.onDelete('restrict')
	]
);

export const contact = pgTable(
	'Contact',
	{
		id: bigserial({ mode: 'bigint' }).primaryKey().notNull(),
		createdAt: timestamp({ precision: 3, withTimezone: true, mode: 'string' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, withTimezone: true, mode: 'string' }).notNull(),
		disabled: boolean().default(false).notNull(),
		value: text().notNull(),
		description: text(),
		clientId: text().notNull(),
		// You can use { mode: "bigint" } if numbers are exceeding js number limitations
		contactTypeId: bigint({ mode: 'number' }).notNull()
	},
	(table) => [
		uniqueIndex('Contact_contactTypeId_value_key').using(
			'btree',
			table.contactTypeId.asc().nullsLast().op('int8_ops'),
			table.value.asc().nullsLast().op('int8_ops')
		),
		index('Contact_value_idx').using('btree', table.value.asc().nullsLast().op('text_ops')),
		foreignKey({
			columns: [table.clientId],
			foreignColumns: [client.id],
			name: 'Contact_clientId_fkey'
		})
			.onUpdate('cascade')
			.onDelete('restrict'),
		foreignKey({
			columns: [table.contactTypeId],
			foreignColumns: [contactType.id],
			name: 'Contact_contactTypeId_fkey'
		})
			.onUpdate('cascade')
			.onDelete('restrict')
	]
);

export const contactType = pgTable(
	'ContactType',
	{
		id: bigserial({ mode: 'bigint' }).primaryKey().notNull(),
		createdAt: timestamp({ precision: 3, withTimezone: true, mode: 'string' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, withTimezone: true, mode: 'string' }).notNull(),
		disabled: boolean().default(false).notNull(),
		name: text().notNull()
	},
	(table) => [
		uniqueIndex('ContactType_name_key').using('btree', table.name.asc().nullsLast().op('text_ops'))
	]
);

export const currentState = pgTable(
	'CurrentState',
	{
		id: text().primaryKey().notNull(),
		createdAt: timestamp({ precision: 3, withTimezone: true, mode: 'string' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, withTimezone: true, mode: 'string' }).notNull(),
		disabled: boolean().default(false).notNull(),
		editable: boolean().default(true).notNull(),
		individual: doublePrecision().notNull(),
		family: doublePrecision().notNull(),
		social: doublePrecision().notNull(),
		generally: doublePrecision().notNull(),
		clientId: text().notNull(),
		smallId: text().notNull(),
		datetime: timestamp({ precision: 3, mode: 'string' }).notNull()
	},
	(table) => [
		index('CurrentState_smallId_idx').using(
			'btree',
			table.smallId.asc().nullsLast().op('text_ops')
		),
		uniqueIndex('CurrentState_smallId_key').using(
			'btree',
			table.smallId.asc().nullsLast().op('text_ops')
		),
		foreignKey({
			columns: [table.clientId],
			foreignColumns: [client.id],
			name: 'CurrentState_clientId_fkey'
		})
			.onUpdate('cascade')
			.onDelete('restrict')
	]
);

export const feedback = pgTable(
	'Feedback',
	{
		id: text().primaryKey().notNull(),
		createdAt: timestamp({ precision: 3, withTimezone: true, mode: 'string' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, withTimezone: true, mode: 'string' }).notNull(),
		disabled: boolean().default(false).notNull(),
		editable: boolean().default(true).notNull(),
		attitude: doublePrecision().notNull(),
		goals: doublePrecision().notNull(),
		method: doublePrecision().notNull(),
		generally: doublePrecision().notNull(),
		clientId: text().notNull(),
		smallId: text().notNull(),
		datetime: timestamp({ precision: 3, mode: 'string' }).notNull()
	},
	(table) => [
		index('Feedback_smallId_idx').using('btree', table.smallId.asc().nullsLast().op('text_ops')),
		uniqueIndex('Feedback_smallId_key').using(
			'btree',
			table.smallId.asc().nullsLast().op('text_ops')
		),
		foreignKey({
			columns: [table.clientId],
			foreignColumns: [client.id],
			name: 'Feedback_clientId_fkey'
		})
			.onUpdate('cascade')
			.onDelete('restrict')
	]
);

export const account = pgTable(
	'Account',
	{
		id: text().primaryKey().notNull(),
		username: text().notNull(),
		password: text().notNull(),
		disabled: boolean().default(false).notNull()
	},
	(table) => [
		uniqueIndex('Account_username_key').using(
			'btree',
			table.username.asc().nullsLast().op('text_ops')
		)
	]
);

export const prismaMigrations = pgTable('_prisma_migrations', {
	id: varchar({ length: 36 }).primaryKey().notNull(),
	checksum: varchar({ length: 64 }).notNull(),
	finishedAt: timestamp('finished_at', { withTimezone: true, mode: 'string' }),
	migrationName: varchar('migration_name', { length: 255 }).notNull(),
	logs: text(),
	rolledBackAt: timestamp('rolled_back_at', { withTimezone: true, mode: 'string' }),
	startedAt: timestamp('started_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	appliedStepsCount: integer('applied_steps_count').default(0).notNull()
});

export const article = pgTable(
	'Article',
	{
		id: text().primaryKey().notNull(),
		title: text().notNull(),
		description: text(),
		content: jsonb().notNull(),
		createdAt: timestamp({ precision: 3, mode: 'string' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
		imageUrl: text(),
		viewCount: integer().default(0).notNull(),
		uri: text().notNull(),
		descriptionMeta: text()
	},
	(table) => [
		uniqueIndex('Article_uri_key').using('btree', table.uri.asc().nullsLast().op('text_ops'))
	]
);

export const emailSubscription = pgTable(
	'EmailSubscription',
	{
		id: text().primaryKey().notNull(),
		createdAt: timestamp({ precision: 3, withTimezone: true, mode: 'string' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, withTimezone: true, mode: 'string' }).notNull(),
		disabled: boolean().default(false).notNull(),
		email: text().notNull(),
		name: text(),
		unsubscribeKey: text().notNull(),
		status: text().default('active').notNull()
	},
	(table) => [
		uniqueIndex('EmailSubscription_email_key').using(
			'btree',
			table.email.asc().nullsLast().op('text_ops')
		),
		uniqueIndex('EmailSubscription_unsubscribeKey_key').using(
			'btree',
			table.unsubscribeKey.asc().nullsLast().op('text_ops')
		),
		index('EmailSubscription_status_idx').using(
			'btree',
			table.status.asc().nullsLast().op('text_ops')
		)
	]
);

export const subscriberStatusEnum = pgEnum('subscriber_status', [
	'pending',
	'active',
	'unsubscribed'
]);

export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid', 'failed']);

export const bookingStatusEnum = pgEnum('booking_status', [
	'pending_payment',
	'confirmed',
	'cancelled',
	'requires_refund'
]);

export const bookingTypeEnum = pgEnum('booking_type', ['consultation', 'acquaintance']);

export const availability = pgTable('Availability', {
	id: bigserial({ mode: 'number' }).primaryKey().notNull(),
	startAt: timestamp('start_at', { withTimezone: true, mode: 'string' }).notNull(),
	endAt: timestamp('end_at', { withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp({ precision: 3, withTimezone: true, mode: 'string' })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull()
});

export const booking = pgTable(
	'Booking',
	{
		id: bigserial({ mode: 'number' }).primaryKey().notNull(),
		availabilityId: bigint('availability_id', { mode: 'number' }).notNull(),
		bookedAt: timestamp('booked_at', { withTimezone: true, mode: 'string' }).notNull(),
		email: text().notNull(),
		clientName: text('client_name').notNull(),
		status: bookingStatusEnum().default('pending_payment').notNull(),
		lockedUntil: timestamp({ precision: 3, withTimezone: true, mode: 'string' }),
		paymentId: bigint('payment_id', { mode: 'number' }),
		type: bookingTypeEnum().default('consultation').notNull(),
		sbClientId: bigint('sb_client_id', { mode: 'number' }),
		createdAt: timestamp({ precision: 3, withTimezone: true, mode: 'string' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, withTimezone: true, mode: 'string' }).notNull()
	},
	(table) => [
		uniqueIndex('unique_active_booking_slot')
			.on(table.availabilityId, table.bookedAt)
			.where(sql`status IN ('confirmed', 'pending_payment')`)
	]
);

export const robokassaPayment = pgTable('RobokassaPayment', {
	id: bigserial({ mode: 'number' }).primaryKey().notNull(),
	createdAt: timestamp({ precision: 3, withTimezone: true, mode: 'string' })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: timestamp({ precision: 3, withTimezone: true, mode: 'string' }).notNull(),
	outSum: numeric({ precision: 10, scale: 2 }).notNull(),
	description: text().notNull(),
	status: paymentStatusEnum().default('pending').notNull(),
	email: text(),
	opKey: text('op_key')
});

export const subscriber = pgTable('Subscriber', {
	id: text().primaryKey().notNull(),
	email: text().notNull().unique(),
	status: subscriberStatusEnum().default('pending').notNull(),
	token: text().unique(),
	createdAt: timestamp({ precision: 3, mode: 'string' })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull()
});

export const leadMagnetEventStatusEnum = pgEnum('lead_magnet_event_status', [
	'pending',
	'sent',
	'failed'
]);

export const leadMagnetEvents = pgTable(
	'lead_magnet_events',
	{
		id: bigserial('id', { mode: 'number' }).primaryKey().notNull(),
		clientId: bigint('client_id', { mode: 'number' }).notNull(),
		leadMagnet: text('lead_magnet').notNull(),
		eventName: text('event_name').notNull(),
		status: leadMagnetEventStatusEnum('status').default('pending').notNull(),
		attempts: integer('attempts').default(0).notNull(),
		lastError: text('last_error'),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		sentAt: timestamp('sent_at', { withTimezone: true, mode: 'string' })
	},
	(table) => [
		uniqueIndex('lead_magnet_events_client_magnet_event_key').on(
			table.clientId,
			table.leadMagnet,
			table.eventName
		)
	]
);

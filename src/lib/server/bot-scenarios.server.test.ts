import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
	type Row = Record<string, any>;
	type Condition =
		| { __testOp: 'and'; conditions: Condition[] }
		| { __testOp: 'eq' | 'ne' | 'gt' | 'lte'; left: any; right: any }
		| { __testSql: true; strings: string[]; values: any[] };

	const tableNameSymbol = Symbol.for('drizzle:Name');
	const baseNameSymbol = Symbol.for('drizzle:BaseName');
	const originalNameSymbol = Symbol.for('drizzle:OriginalName');

	const state = {
		now: new Date('2026-01-01T10:00:00.000Z'),
		contacts: [] as Row[],
		scenarios: [] as Row[],
		steps: [] as Row[],
		scheduled: [] as Row[],
		broadcastRuns: [] as Row[],
		scenarioRuns: [] as Row[],
		channelPosts: [] as Row[],
		nextScheduledId: 1,
		failNextContactUpdate: false,
		failNextScheduledInsert: false
	};

	const sendMessage = vi.fn();
	const logOutboundMessage = vi.fn();
	const setBotBlocked = vi.fn();
	const getChatMember = vi.fn();
	const markGateShown = vi.fn();
	const markGatePassed = vi.fn();

	function reset() {
		state.now = new Date('2026-01-01T10:00:00.000Z');
		state.contacts = [];
		state.scenarios = [];
		state.steps = [];
		state.scheduled = [];
		state.broadcastRuns = [];
		state.scenarioRuns = [];
		state.channelPosts = [];
		state.nextScheduledId = 1;
		state.failNextContactUpdate = false;
		state.failNextScheduledInsert = false;
		sendMessage.mockReset();
		logOutboundMessage.mockReset();
		setBotBlocked.mockReset();
		getChatMember.mockReset();
		getChatMember.mockResolvedValue({ status: 'member' });
		markGateShown.mockReset();
		markGatePassed.mockReset();
	}

	function iso(date: Date) {
		return date.toISOString();
	}

	function tableName(table: any): string | undefined {
		return (
			table?.[tableNameSymbol] ??
			table?.[baseNameSymbol] ??
			table?.[originalNameSymbol] ??
			table?._?.name
		);
	}

	const columnToProp: Record<string, string> = {
		contact_id: 'contactId',
		scenario_id: 'scenarioId',
		step_id: 'stepId',
		source_step_id: 'sourceStepId',
		source_message_id: 'sourceMessageId',
		scheduled_at: 'scheduledAt',
		processed_at: 'processedAt',
		last_error: 'lastError',
		cancellation_reason: 'cancellationReason',
		message_telegram_id: 'messageTelegramId',
		file_telegram_message_id: 'fileTelegramMessageId',
		effects_applied_at: 'effectsAppliedAt',
		child_scenario_started_at: 'childScenarioStartedAt',
		created_at: 'createdAt',
		delay_seconds: 'delaySeconds',
		message_text: 'messageText',
		button_text: 'buttonText',
		button_url: 'buttonUrl',
		start_scenario_id: 'startScenarioId',
		add_tags: 'addTags',
		set_stage: 'setStage',
		bot_blocked: 'botBlocked',
		telegram_user_id: 'telegramUserId',
		first_name: 'firstName',
		trigger_type: 'triggerType',
		trigger_value: 'triggerValue',
		cancels_others: 'cancelsOthers',
		protected_from_cancel: 'protectedFromCancel',
		last_started_at: 'lastStartedAt',
		cooldown_days: 'cooldownDays'
	};

	function columnName(column: any): string | undefined {
		return column?.name ?? column?.config?.name;
	}

	function propName(column: any): string | undefined {
		const name = columnName(column);
		return name ? (columnToProp[name] ?? name) : undefined;
	}

	function valueFor(row: Row, column: any) {
		const prop = propName(column);
		return prop ? row[prop] : undefined;
	}

	function isSql(value: any): value is { __testSql: true; strings: string[]; values: any[] } {
		return Boolean(value?.__testSql);
	}

	function sqlText(value: { strings: string[] }) {
		return value.strings.join('');
	}

	function resolveSql(value: any) {
		if (!isSql(value)) return value;

		const text = sqlText(value);
		if (text.includes('make_interval')) {
			const seconds = Number(value.values.at(-1) ?? 0);
			return iso(new Date(state.now.getTime() + seconds * 1000));
		}
		// Захват шага в processDueScheduledSteps: now() + interval '10 minutes'
		if (text.includes("interval '10 minutes'")) {
			return iso(new Date(state.now.getTime() + 10 * 60 * 1000));
		}
		if (text.includes('now()')) {
			return iso(state.now);
		}
		return value;
	}

	function normalisePatch(data: Row) {
		return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, resolveSql(value)]));
	}

	function asComparable(value: any) {
		if (value instanceof Date) return value.getTime();
		if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
			return new Date(value).getTime();
		}
		return value;
	}

	// Движок передаёт text[] строкой-литералом '{"a","b"}' (pgTextArrayLiteral) —
	// разбираем её обратно в массив для проверок @> и &&
	function parseArrayValue(value: any): string[] | null {
		if (Array.isArray(value)) return value;
		if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
			const inner = value.slice(1, -1);
			if (!inner) return [];
			return inner.split(',').map((item) => item.replace(/^"|"$/g, ''));
		}
		return null;
	}

	function matchesSql(row: Row, condition: { __testSql: true; strings: string[]; values: any[] }) {
		const text = condition.strings.join('');
		const columnNames = condition.values.map(columnName).filter(Boolean);

		// Спец-условие из triggerScenarioForContact:
		// отменять только сценарии, не защищённые protectedFromCancel.
		if (columnNames.includes('protected_from_cancel')) {
			const scenario = state.scenarios.find((item) => item.id === row.scenarioId);
			return scenario?.protectedFromCancel === false;
		}

		// Кулдаун: last_started_at > now() - make_interval(days => N)
		if (text.includes('make_interval') && columnNames.includes('last_started_at')) {
			const days = Number(condition.values.find((v) => typeof v === 'number') ?? 0);
			return asComparable(row.lastStartedAt) > state.now.getTime() - days * 24 * 60 * 60 * 1000;
		}

		// tags @> requireTags — контакт содержит все нужные теги
		if (text.includes('@>')) {
			const required = condition.values.map(parseArrayValue).find(Boolean) ?? [];
			return required.every((t) => (row.tags ?? []).includes(t));
		}

		// not (tags && excludeTags) — контакт не содержит ни один исключённый тег
		if (text.includes('&&')) {
			const excluded = condition.values.map(parseArrayValue).find(Boolean) ?? [];
			return !excluded.some((t) => (row.tags ?? []).includes(t));
		}

		return true;
	}

	function matches(row: Row, condition: Condition | undefined): boolean {
		if (!condition) return true;
		if ('__testSql' in condition) return matchesSql(row, condition);

		switch (condition.__testOp) {
			case 'and':
				return condition.conditions.every((item) => matches(row, item));
			case 'eq':
				return valueFor(row, condition.left) === resolveSql(condition.right);
			case 'ne':
				return valueFor(row, condition.left) !== resolveSql(condition.right);
			case 'gt':
				return (
					asComparable(valueFor(row, condition.left)) > asComparable(resolveSql(condition.right))
				);
			case 'lte':
				return (
					asComparable(valueFor(row, condition.left)) <= asComparable(resolveSql(condition.right))
				);
		}
	}

	function rowsFor(name: string | undefined) {
		switch (name) {
			case 'bot_contacts':
				return state.contacts;
			case 'bot_scenarios':
				return state.scenarios;
			case 'bot_scenario_steps':
				return state.steps;
			case 'bot_scheduled_steps':
				return state.scheduled;
			case 'bot_broadcast_runs':
				return state.broadcastRuns;
			case 'bot_scenario_runs':
				return state.scenarioRuns;
			case 'bot_channel_posts':
				return state.channelPosts;
			default:
				throw new Error(`Unsupported mocked table: ${String(name)}`);
		}
	}

	function sortRows(rows: Row[], orders: any[]) {
		const [order] = orders;
		if (!order?.column) return rows;
		const prop = propName(order.column);
		if (!prop) return rows;
		return [...rows].sort((left, right) => {
			const a = asComparable(left[prop]);
			const b = asComparable(right[prop]);
			return a === b ? 0 : a > b ? 1 : -1;
		});
	}

	class SelectBuilder implements PromiseLike<Row[]> {
		private table: any;
		private condition: Condition | undefined;
		private orders: any[] = [];
		private limitCount: number | undefined;

		constructor(private readonly selection?: any) {}

		from(table: any) {
			this.table = table;
			return this;
		}

		innerJoin() {
			return this;
		}

		where(condition: Condition) {
			this.condition = condition;
			return this;
		}

		orderBy(...orders: any[]) {
			this.orders = orders;
			return this;
		}

		limit(count: number) {
			this.limitCount = count;
			return this;
		}

		private run(): Row[] {
			if (this.selection?.scheduled) {
				const due = state.scheduled
					.filter((item) => matches(item, this.condition))
					.map((scheduled) => ({
						scheduled,
						step: state.steps.find((step) => step.id === scheduled.stepId),
						contact: state.contacts.find((contact) => contact.id === scheduled.contactId),
						scenario: state.scenarios.find((scenario) => scenario.id === scheduled.scenarioId)
					}))
					.filter((item) => item.step && item.contact && item.scenario);

				return this.limitCount ? due.slice(0, this.limitCount) : due;
			}

			let rows = rowsFor(tableName(this.table)).filter((item) => matches(item, this.condition));
			rows = sortRows(rows, this.orders);

			return this.limitCount ? rows.slice(0, this.limitCount) : rows;
		}

		then<TResult1 = Row[], TResult2 = never>(
			onfulfilled?: ((value: Row[]) => TResult1 | PromiseLike<TResult1>) | null,
			onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
		) {
			return Promise.resolve(this.run()).then(onfulfilled, onrejected);
		}
	}

	class UpdateBuilder implements PromiseLike<Row[]> {
		private data: Row = {};
		private condition: Condition | undefined;
		private wantReturning = false;

		constructor(private readonly table: any) {}

		set(data: Row) {
			this.data = data;
			return this;
		}

		where(condition: Condition) {
			this.condition = condition;
			return this;
		}

		returning(_selection?: any) {
			this.wantReturning = true;
			return this;
		}

		private run(): Row[] {
			const patch = normalisePatch(this.data);
			if (tableName(this.table) === 'bot_contacts' && state.failNextContactUpdate) {
				state.failNextContactUpdate = false;
				throw new Error('temporary contact update failure');
			}
			const updated: Row[] = [];
			for (const row of rowsFor(tableName(this.table))) {
				if (matches(row, this.condition)) {
					Object.assign(row, patch);
					updated.push(row);
				}
			}
			return this.wantReturning ? updated : [];
		}

		then<TResult1 = Row[], TResult2 = never>(
			onfulfilled?: ((value: Row[]) => TResult1 | PromiseLike<TResult1>) | null,
			onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
		) {
			return Promise.resolve(this.run()).then(onfulfilled, onrejected);
		}
	}

	// Вставка возвращает thenable с .returning() — движок пользуется обеими формами
	class InsertResult implements PromiseLike<Row[]> {
		constructor(private readonly result: Promise<Row[]>) {}

		returning(_selection?: any) {
			return this.result;
		}

		then<TResult1 = Row[], TResult2 = never>(
			onfulfilled?: ((value: Row[]) => TResult1 | PromiseLike<TResult1>) | null,
			onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
		) {
			return this.result.then(onfulfilled, onrejected);
		}
	}

	class InsertBuilder {
		constructor(private readonly table: any) {}

		values(values: Row | Row[]) {
			const table = tableName(this.table);
			if (table === 'bot_scheduled_steps' && state.failNextScheduledInsert) {
				state.failNextScheduledInsert = false;
				return new InsertResult(Promise.reject(new Error('temporary scheduled insert failure')));
			}
			const rows = Array.isArray(values) ? values : [values];
			const inserted: Row[] = rows.map((row) => {
				const normalised = normalisePatch(row);

				if (table === 'bot_scheduled_steps') {
					return {
						id: state.nextScheduledId++,
						status: 'pending',
						attempts: 0,
						lastError: null,
						cancellationReason: null,
						messageTelegramId: null,
						fileTelegramMessageId: null,
						effectsAppliedAt: null,
						childScenarioStartedAt: null,
						createdAt: iso(state.now),
						processedAt: null,
						...normalised
					};
				}

				return { id: rowsFor(table).length + 1, createdAt: iso(state.now), ...normalised };
			});

			if (table === 'bot_scheduled_steps') {
				const duplicate = inserted.some(
					(row) =>
						row.sourceStepId != null &&
						row.sourceMessageId != null &&
						state.scheduled.some(
							(existing) =>
								existing.contactId === row.contactId &&
								existing.sourceStepId === row.sourceStepId &&
								existing.sourceMessageId === row.sourceMessageId
						)
				);
				if (duplicate) {
					return new InsertResult(
						Promise.reject(
							Object.assign(new Error('duplicate gate callback'), {
								code: '23505',
								constraint: 'bot_scheduled_steps_gate_callback_key'
							})
						)
					);
				}
			}

			rowsFor(table).push(...inserted);
			return new InsertResult(Promise.resolve(inserted));
		}
	}

	class DeleteBuilder {
		constructor(private readonly table: any) {}

		where(condition: Condition) {
			const rows = rowsFor(tableName(this.table));
			for (let index = rows.length - 1; index >= 0; index--) {
				if (matches(rows[index], condition)) rows.splice(index, 1);
			}
			return Promise.resolve([]);
		}
	}

	const db = {
		select: (selection?: any) => new SelectBuilder(selection),
		update: (table: any) => new UpdateBuilder(table),
		insert: (table: any) => new InsertBuilder(table),
		delete: (table: any) => new DeleteBuilder(table),
		// Транзакция с настоящим откатом: без него нельзя проверить, что падение
		// вставки следующего шага не оставляет текущий в терминальном статусе
		transaction: async <T>(fn: (tx: any) => Promise<T>): Promise<T> => {
			const snapshot = {
				contacts: structuredClone(state.contacts),
				scenarios: structuredClone(state.scenarios),
				steps: structuredClone(state.steps),
				scheduled: structuredClone(state.scheduled),
				broadcastRuns: structuredClone(state.broadcastRuns),
				scenarioRuns: structuredClone(state.scenarioRuns),
				channelPosts: structuredClone(state.channelPosts),
				nextScheduledId: state.nextScheduledId
			};
			try {
				return await fn(db);
			} catch (err) {
				Object.assign(state, snapshot);
				throw err;
			}
		}
	};

	return {
		db,
		state,
		reset,
		sendMessage,
		logOutboundMessage,
		setBotBlocked,
		getChatMember,
		markGateShown,
		markGatePassed
	};
});

vi.mock('drizzle-orm', async (importOriginal) => {
	const actual = await importOriginal<typeof import('drizzle-orm')>();
	const sql = Object.assign(
		(strings: TemplateStringsArray, ...values: any[]) => ({
			__testSql: true,
			strings: Array.from(strings),
			values
		}),
		actual.sql
	);

	return {
		...actual,
		sql,
		and: (...conditions: any[]) => ({
			__testOp: 'and',
			conditions: conditions.filter(Boolean)
		}),
		eq: (left: any, right: any) => ({ __testOp: 'eq', left, right }),
		ne: (left: any, right: any) => ({ __testOp: 'ne', left, right }),
		gt: (left: any, right: any) => ({ __testOp: 'gt', left, right }),
		lte: (left: any, right: any) => ({ __testOp: 'lte', left, right }),
		asc: (column: any) => ({ __testOrder: 'asc', column })
	};
});

vi.mock('../..', () => ({ db: mocks.db }));
vi.mock('./telegram-client-bot.server', () => ({
	clientBotApi: { sendMessage: mocks.sendMessage, getChatMember: mocks.getChatMember },
	apiDeadline: () => undefined,
	CALLBACK_SUBSCRIPTION_TIMEOUT_MS: 3_000,
	tgFormat: (text: string) => text
}));
vi.mock('./bot-channel-posts.server', () => ({
	chatIdForApi: (chatId: string) => (chatId.startsWith('@') ? chatId : Number(chatId))
}));
vi.mock('./bot-funnel.server', () => ({
	markGateShown: mocks.markGateShown,
	markGatePassed: mocks.markGatePassed,
	markBotStarted: vi.fn()
}));
vi.mock('./quiz-results.server', () => ({
	getQuizBotSettings: vi.fn(async () => ({
		channelChatId: null,
		checkButtonText: 'Я подписался',
		notSubscribedAlert: 'Подписки пока не вижу'
	}))
}));
vi.mock('./bot-contacts.server', () => ({
	getContact: vi.fn(),
	logOutboundMessage: mocks.logOutboundMessage,
	setBotBlocked: mocks.setBotBlocked,
	// Реальная реализация — литерал разбирается обратно в parseArrayValue мока
	pgTextArrayLiteral: (values: string[]) =>
		`{${values.map((v) => `"${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`).join(',')}}`
}));

vi.mock('grammy', () => {
	class GrammyError extends Error {
		error_code: number;
		constructor(error_code: number, message: string) {
			super(message);
			this.error_code = error_code;
		}
	}
	// HttpError нужен log-error.server.ts для распознавания сетевых сбоев
	class HttpError extends Error {}
	return { GrammyError, HttpError };
});

import { GrammyError } from 'grammy';
import {
	deleteStepAndRepointQueue,
	findTriggeredScenarios,
	handleSubscriptionGateCallback,
	launchScenarioForSegment,
	parseStartPayload,
	processDueScheduledSteps,
	runScheduledStep,
	triggerScenarioByKey,
	triggerScenarioForContact,
	validateTrigger
} from './bot-scenarios.server';
import { getContact } from './bot-contacts.server';

function scenario(overrides: Record<string, any> = {}) {
	return {
		id: 10,
		name: 'Прогрев',
		kind: 'funnel',
		triggerType: 'start_param',
		triggerValue: 'warmup',
		enabled: true,
		cancelsOthers: false,
		protectedFromCancel: false,
		cooldownDays: 0,
		createdAt: mocks.state.now.toISOString(),
		updatedAt: mocks.state.now.toISOString(),
		...overrides
	};
}

function contact(overrides: Record<string, any> = {}) {
	return {
		id: 1,
		publicId: 123456789,
		telegramUserId: 1001,
		username: null,
		firstName: 'Андрей',
		lastName: null,
		stage: 'new',
		tags: [],
		notes: null,
		botBlocked: false,
		createdAt: mocks.state.now.toISOString(),
		updatedAt: mocks.state.now.toISOString(),
		lastInteractionAt: null,
		...overrides
	};
}

function step(overrides: Record<string, any> = {}) {
	return {
		id: 100,
		scenarioId: 10,
		position: 0,
		delaySeconds: 0,
		messageText: 'Сообщение',
		buttonText: null,
		buttonUrl: null,
		condition: null,
		buttonAction: 'url',
		startScenarioId: null,
		addTags: [],
		setStage: null,
		createdAt: mocks.state.now.toISOString(),
		...overrides
	};
}

function scheduled(overrides: Record<string, any> = {}) {
	return {
		id: mocks.state.nextScheduledId++,
		contactId: 1,
		scenarioId: 10,
		stepId: 100,
		status: 'pending',
		scheduledAt: mocks.state.now.toISOString(),
		attempts: 0,
		lastError: null,
		cancellationReason: null,
		sourceStepId: null,
		sourceMessageId: null,
		chainDepth: 0,
		messageTelegramId: null,
		fileTelegramMessageId: null,
		effectsAppliedAt: null,
		childScenarioStartedAt: null,
		createdAt: mocks.state.now.toISOString(),
		processedAt: null,
		...overrides
	};
}

describe('validateTrigger', () => {
	it('accepts valid start_param', () => {
		expect(validateTrigger('start_param', 'valid_param-123')).toBeNull();
	});

	it('rejects start_param with spaces', () => {
		expect(validateTrigger('start_param', 'invalid param')).not.toBeNull();
	});

	it('rejects start_param longer than 64 characters', () => {
		expect(validateTrigger('start_param', 'a'.repeat(65))).not.toBeNull();
	});

	it('accepts valid command', () => {
		expect(validateTrigger('command', '/start')).toBeNull();
	});

	it('rejects command without leading slash', () => {
		expect(validateTrigger('command', 'start')).not.toBeNull();
	});

	it('accepts non-empty text trigger', () => {
		expect(validateTrigger('text', 'привет')).toBeNull();
	});

	it('rejects blank text trigger', () => {
		expect(validateTrigger('text', '   ')).not.toBeNull();
	});

	it('rejects unknown trigger type', () => {
		expect(validateTrigger('unknown', 'value')).not.toBeNull();
	});
});

describe('findTriggeredScenarios', () => {
	beforeEach(() => {
		mocks.reset();
	});

	it('returns empty array for empty text', async () => {
		expect(await findTriggeredScenarios('')).toEqual([]);
		expect(await findTriggeredScenarios(null)).toEqual([]);
	});

	it('returns matching start_param scenario for deep link', async () => {
		mocks.state.scenarios.push(
			scenario({ id: 1, triggerType: 'start_param', triggerValue: 'warmup' })
		);

		const result = await findTriggeredScenarios('/start warmup');
		expect(result.map((s) => s.id)).toEqual([1]);
	});

	it('falls back to /start command scenarios for unknown deep link param', async () => {
		mocks.state.scenarios.push(
			scenario({ id: 1, triggerType: 'start_param', triggerValue: 'warmup' }),
			scenario({ id: 2, triggerType: 'command', triggerValue: '/start' })
		);

		const result = await findTriggeredScenarios('/start unknownparam');
		expect(result.map((s) => s.id)).toEqual([2]);
	});

	it('returns /start command scenarios when no deep link param', async () => {
		mocks.state.scenarios.push(scenario({ id: 2, triggerType: 'command', triggerValue: '/start' }));

		const result = await findTriggeredScenarios('/start');
		expect(result.map((s) => s.id)).toEqual([2]);
	});

	it('returns command scenario for matching command', async () => {
		mocks.state.scenarios.push(scenario({ id: 5, triggerType: 'command', triggerValue: '/help' }));

		const result = await findTriggeredScenarios('/help');
		expect(result.map((s) => s.id)).toEqual([5]);
	});

	it('does not return disabled scenarios', async () => {
		mocks.state.scenarios.push(
			scenario({ id: 1, triggerType: 'start_param', triggerValue: 'warmup', enabled: false })
		);

		expect(await findTriggeredScenarios('/start warmup')).toEqual([]);
	});
});

describe('bot scenario queue mechanics', () => {
	beforeEach(() => {
		mocks.reset();
		mocks.sendMessage.mockResolvedValue({ message_id: 777 });
		mocks.logOutboundMessage.mockResolvedValue(undefined);
		mocks.setBotBlocked.mockResolvedValue(undefined);
	});

	it('cancels previous pending queue records for the same contact and scenario on user action', async () => {
		const warmup = scenario();
		const user = contact();

		mocks.state.scenarios.push(warmup);
		mocks.state.contacts.push(user);
		mocks.state.scheduled.push(
			scheduled({ id: 1, contactId: user.id, scenarioId: warmup.id, status: 'pending' }),
			scheduled({ id: 2, contactId: user.id, scenarioId: warmup.id, status: 'pending' }),
			scheduled({ id: 3, contactId: user.id, scenarioId: warmup.id, status: 'sent' })
		);

		await triggerScenarioForContact(warmup as any, user as any);

		expect(mocks.state.scheduled.find((item) => item.id === 1)?.status).toBe('cancelled');
		expect(mocks.state.scheduled.find((item) => item.id === 2)?.status).toBe('cancelled');
		expect(mocks.state.scheduled.find((item) => item.id === 3)?.status).toBe('sent');
	});

	it('keeps already scheduled execution time immutable when step delay changes', async () => {
		const warmup = scenario();
		const firstContact = contact({ id: 1, telegramUserId: 1001 });
		const secondContact = contact({ id: 2, telegramUserId: 1002 });
		const delayedStep = step({ id: 100, scenarioId: warmup.id, position: 0, delaySeconds: 3600 });

		mocks.state.scenarios.push(warmup);
		mocks.state.contacts.push(firstContact, secondContact);
		mocks.state.steps.push(delayedStep);

		await triggerScenarioForContact(warmup as any, firstContact as any);
		const firstScheduledAt = mocks.state.scheduled[0].scheduledAt;

		delayedStep.delaySeconds = 60;
		await triggerScenarioForContact(warmup as any, secondContact as any);

		expect(firstScheduledAt).toBe('2026-01-01T11:00:00.000Z');
		expect(mocks.state.scheduled[0].scheduledAt).toBe(firstScheduledAt);
		expect(mocks.state.scheduled[1].scheduledAt).toBe('2026-01-01T10:01:00.000Z');
	});

	it('cancels only the current scenario queue and leaves another scenario pending', async () => {
		const warmup = scenario({ id: 10, name: 'Прогрев' });
		const reminder = scenario({ id: 20, name: 'Напоминание о записи', protectedFromCancel: true });
		const user = contact();

		mocks.state.scenarios.push(warmup, reminder);
		mocks.state.contacts.push(user);
		mocks.state.scheduled.push(
			scheduled({ id: 1, contactId: user.id, scenarioId: warmup.id, stepId: 100 }),
			scheduled({ id: 2, contactId: user.id, scenarioId: reminder.id, stepId: 200 })
		);

		await triggerScenarioForContact(warmup as any, user as any);

		expect(mocks.state.scheduled.find((item) => item.id === 1)?.status).toBe('cancelled');
		expect(mocks.state.scheduled.find((item) => item.id === 2)?.status).toBe('pending');
	});

	it('does not process scheduled steps before scheduledAt', async () => {
		const warmup = scenario();
		const user = contact();
		const futureStep = step({ id: 100, scenarioId: warmup.id, position: 0, messageText: 'Рано' });

		mocks.state.scenarios.push(warmup);
		mocks.state.contacts.push(user);
		mocks.state.steps.push(futureStep);
		mocks.state.scheduled.push(
			scheduled({
				id: 1,
				contactId: user.id,
				scenarioId: warmup.id,
				stepId: futureStep.id,
				scheduledAt: '2026-01-01T10:05:00.000Z'
			})
		);

		const result = await processDueScheduledSteps();

		expect(result).toEqual({ processed: 0, sent: 0, errors: 0 });
		expect(mocks.sendMessage).not.toHaveBeenCalled();
		expect(mocks.state.scheduled[0].status).toBe('pending');
	});

	it('sends due scheduled steps, marks them as sent and schedules the next delayed step', async () => {
		const warmup = scenario();
		const user = contact({ telegramUserId: 1001 });
		const current = step({
			id: 100,
			scenarioId: warmup.id,
			position: 0,
			messageText: 'Первый шаг'
		});
		const next = step({
			id: 101,
			scenarioId: warmup.id,
			position: 1,
			delaySeconds: 30,
			messageText: 'Следующий шаг'
		});

		mocks.state.scenarios.push(warmup);
		mocks.state.contacts.push(user);
		mocks.state.steps.push(current, next);
		mocks.state.scheduled.push(
			scheduled({
				id: 1,
				contactId: user.id,
				scenarioId: warmup.id,
				stepId: current.id,
				scheduledAt: '2026-01-01T09:59:59.000Z'
			})
		);

		const result = await processDueScheduledSteps();

		expect(result).toEqual({ processed: 1, sent: 1, errors: 0 });
		expect(mocks.sendMessage).toHaveBeenCalledWith(1001, 'Первый шаг', { parse_mode: 'HTML' });
		expect(mocks.state.scheduled.find((item) => item.id === 1)?.status).toBe('sent');
		expect(mocks.state.scheduled).toContainEqual(
			expect.objectContaining({
				contactId: user.id,
				scenarioId: warmup.id,
				stepId: next.id,
				status: 'pending',
				scheduledAt: '2026-01-01T10:00:30.000Z'
			})
		);
	});

	it('cancels pending queue when deleting the last step in a scenario', async () => {
		const warmup = scenario();
		const onlyStep = step({ id: 100, position: 0 });

		mocks.state.scenarios.push(warmup);
		mocks.state.steps.push(onlyStep);
		mocks.state.scheduled.push(
			scheduled({ id: 1, stepId: onlyStep.id, scheduledAt: '2026-01-01T12:00:00.000Z' })
		);

		await deleteStepAndRepointQueue(onlyStep.id);

		expect(mocks.state.steps).toHaveLength(0);
		expect(mocks.state.scheduled[0].status).toBe('cancelled');
	});

	it('repoints pending queue records to the next step when deleting a step', async () => {
		const warmup = scenario();
		const second = step({ id: 102, scenarioId: warmup.id, position: 2, messageText: 'Шаг 2' });
		const third = step({ id: 103, scenarioId: warmup.id, position: 3, messageText: 'Шаг 3' });

		mocks.state.scenarios.push(warmup);
		mocks.state.steps.push(second, third);
		mocks.state.scheduled.push(
			scheduled({
				id: 1,
				scenarioId: warmup.id,
				stepId: second.id,
				scheduledAt: '2026-01-01T12:00:00.000Z'
			}),
			scheduled({
				id: 2,
				scenarioId: warmup.id,
				stepId: third.id,
				scheduledAt: '2026-01-01T12:30:00.000Z'
			})
		);

		await deleteStepAndRepointQueue(second.id);

		expect(mocks.state.steps.map((item) => item.id)).toEqual([third.id]);
		expect(mocks.state.scheduled.find((item) => item.id === 1)).toEqual(
			expect.objectContaining({
				stepId: third.id,
				status: 'pending',
				scheduledAt: '2026-01-01T12:00:00.000Z'
			})
		);
		expect(mocks.state.scheduled.find((item) => item.id === 2)).toEqual(
			expect.objectContaining({
				stepId: third.id,
				status: 'pending',
				scheduledAt: '2026-01-01T12:30:00.000Z'
			})
		);
	});

	it('when cancelsOthers=true, cancels pending steps of unprotected scenarios', async () => {
		const aggressive = scenario({ id: 10, cancelsOthers: true });
		const unprotected = scenario({ id: 20, protectedFromCancel: false });
		const user = contact();

		mocks.state.scenarios.push(aggressive, unprotected);
		mocks.state.contacts.push(user);
		mocks.state.scheduled.push(
			scheduled({ id: 1, scenarioId: aggressive.id, stepId: 100 }),
			scheduled({ id: 2, scenarioId: unprotected.id, stepId: 200 })
		);

		await triggerScenarioForContact(aggressive as any, user as any);

		expect(mocks.state.scheduled.find((s) => s.id === 1)?.status).toBe('cancelled');
		expect(mocks.state.scheduled.find((s) => s.id === 2)?.status).toBe('cancelled');
	});

	it('when cancelsOthers=true, preserves protected scenarios', async () => {
		const aggressive = scenario({ id: 10, cancelsOthers: true });
		const protectedScenario = scenario({ id: 30, protectedFromCancel: true });
		const user = contact();

		mocks.state.scenarios.push(aggressive, protectedScenario);
		mocks.state.contacts.push(user);
		mocks.state.scheduled.push(
			scheduled({ id: 1, scenarioId: aggressive.id, stepId: 100 }),
			scheduled({ id: 2, scenarioId: protectedScenario.id, stepId: 300 })
		);

		await triggerScenarioForContact(aggressive as any, user as any);

		expect(mocks.state.scheduled.find((s) => s.id === 1)?.status).toBe('cancelled');
		expect(mocks.state.scheduled.find((s) => s.id === 2)?.status).toBe('pending');
	});

	it('deduplicates tags when step adds tags the contact already has', async () => {
		const warmup = scenario();
		const user = contact({ tags: ['existing', 'duplicate'] });
		const tagStep = step({ id: 100, addTags: ['duplicate', 'new'], messageText: null });

		mocks.state.scenarios.push(warmup);
		mocks.state.contacts.push(user);
		mocks.state.steps.push(tagStep);

		await triggerScenarioForContact(warmup as any, user as any);

		expect(mocks.state.contacts[0].tags).toEqual(['existing', 'duplicate', 'new']);
	});

	it('stops recursive scenario chain at MAX_CHAIN_DEPTH', async () => {
		const scenarioA = scenario({ id: 10 });
		const scenarioB = scenario({ id: 20 });
		const stepA = step({ id: 100, scenarioId: 10, startScenarioId: 20, messageText: 'A' });
		const stepB = step({ id: 200, scenarioId: 20, startScenarioId: 10, messageText: 'B' });
		const user = contact();

		mocks.state.scenarios.push(scenarioA, scenarioB);
		mocks.state.steps.push(stepA, stepB);
		mocks.state.contacts.push(user);

		await triggerScenarioForContact(scenarioA as any, user as any);

		// MAX_CHAIN_DEPTH=5: глубины 0–5 успевают отправить, на глубине 6 останавливаемся
		expect(mocks.sendMessage).toHaveBeenCalledTimes(6);
	});

	it('cancels step for disabled scenario without sending', async () => {
		const disabledScenario = scenario({ enabled: false });
		const user = contact();
		const current = step({ id: 100, scenarioId: disabledScenario.id, messageText: 'Привет' });

		mocks.state.scenarios.push(disabledScenario);
		mocks.state.contacts.push(user);
		mocks.state.steps.push(current);
		mocks.state.scheduled.push(scheduled({ id: 1, scheduledAt: '2026-01-01T09:59:00.000Z' }));

		const result = await processDueScheduledSteps();

		expect(result).toEqual({ processed: 1, sent: 0, errors: 0 });
		expect(mocks.sendMessage).not.toHaveBeenCalled();
		expect(mocks.state.scheduled[0].status).toBe('cancelled');
	});

	it('cancels step for botBlocked contact without sending', async () => {
		const warmup = scenario();
		const blockedUser = contact({ botBlocked: true });
		const current = step({ id: 100, messageText: 'Привет' });

		mocks.state.scenarios.push(warmup);
		mocks.state.contacts.push(blockedUser);
		mocks.state.steps.push(current);
		mocks.state.scheduled.push(scheduled({ id: 1, scheduledAt: '2026-01-01T09:59:00.000Z' }));

		const result = await processDueScheduledSteps();

		expect(result).toEqual({ processed: 1, sent: 0, errors: 0 });
		expect(mocks.sendMessage).not.toHaveBeenCalled();
		expect(mocks.state.scheduled[0].status).toBe('cancelled');
	});

	it('calls setBotBlocked and cancels step on Telegram 403 error', async () => {
		const warmup = scenario();
		const user = contact({ telegramUserId: 1001 });
		const current = step({ id: 100, messageText: 'Привет' });

		mocks.state.scenarios.push(warmup);
		mocks.state.contacts.push(user);
		mocks.state.steps.push(current);
		mocks.state.scheduled.push(scheduled({ id: 1, scheduledAt: '2026-01-01T09:59:00.000Z' }));

		// Мок grammy принимает (error_code, message) — сигнатура реального класса другая
		const BlockedError = GrammyError as unknown as new (code: number, message: string) => Error;
		mocks.sendMessage.mockRejectedValue(
			new BlockedError(403, 'Forbidden: bot was blocked by the user')
		);

		const result = await processDueScheduledSteps();

		expect(result).toEqual({ processed: 1, sent: 0, errors: 0 });
		expect(mocks.setBotBlocked).toHaveBeenCalledWith(user.id, true);
		expect(mocks.state.scheduled[0].status).toBe('cancelled');
	});

	it('не отправляет сообщение повторно, если после доставки временно упали эффекты шага', async () => {
		const warmup = scenario();
		const user = contact({ tags: [] });
		const current = step({ id: 100, messageText: 'Материал', addTags: ['received'] });

		mocks.state.scenarios.push(warmup);
		mocks.state.contacts.push(user);
		mocks.state.steps.push(current);
		mocks.state.scheduled.push(scheduled({ id: 1, scheduledAt: '2026-01-01T09:59:00.000Z' }));
		mocks.state.failNextContactUpdate = true;

		await processDueScheduledSteps();

		expect(mocks.sendMessage).toHaveBeenCalledTimes(1);
		expect(mocks.state.scheduled[0]).toEqual(
			expect.objectContaining({ status: 'pending', messageTelegramId: 777 })
		);

		mocks.state.now = new Date(mocks.state.now.getTime() + 11 * 60 * 1000);
		await processDueScheduledSteps();

		expect(mocks.sendMessage).toHaveBeenCalledTimes(1);
		expect(mocks.state.contacts[0].tags).toContain('received');
		expect(mocks.state.scheduled[0].status).toBe('sent');
	});

	it('increments attempts on transient error and marks as failed after MAX_ATTEMPTS', async () => {
		const warmup = scenario();
		const user = contact();
		const current = step({ id: 100, messageText: 'Привет' });

		mocks.state.scenarios.push(warmup);
		mocks.state.contacts.push(user);
		mocks.state.steps.push(current);
		mocks.state.scheduled.push(
			scheduled({ id: 1, attempts: 0, scheduledAt: '2026-01-01T09:59:00.000Z' })
		);

		mocks.sendMessage.mockRejectedValue(new Error('Network error'));

		await processDueScheduledSteps();
		expect(mocks.state.scheduled[0].attempts).toBe(1);
		expect(mocks.state.scheduled[0].status).toBe('pending');

		// Захват сдвигает scheduledAt на +10 минут — ретрай назревает не сразу
		mocks.state.now = new Date(mocks.state.now.getTime() + 11 * 60 * 1000);
		await processDueScheduledSteps();
		expect(mocks.state.scheduled[0].attempts).toBe(2);
		expect(mocks.state.scheduled[0].status).toBe('pending');

		mocks.state.now = new Date(mocks.state.now.getTime() + 11 * 60 * 1000);
		await processDueScheduledSteps();
		expect(mocks.state.scheduled[0].attempts).toBe(3);
		expect(mocks.state.scheduled[0].status).toBe('failed');
	});

	it('падение вставки следующего шага не хоронит цепочку', async () => {
		const warmup = scenario();
		const user = contact();
		mocks.state.scenarios.push(warmup);
		mocks.state.contacts.push(user);
		mocks.state.steps.push(
			step({ id: 100, scenarioId: warmup.id, position: 0, messageText: 'Первое' }),
			step({ id: 101, scenarioId: warmup.id, position: 1, messageText: 'Второе' })
		);
		mocks.state.scheduled.push(
			scheduled({
				id: 1,
				contactId: user.id,
				scenarioId: warmup.id,
				stepId: 100,
				scheduledAt: '2026-01-01T09:59:59.000Z'
			})
		);

		// Первое сообщение доставлено, но постановка следующего шага падает
		mocks.state.failNextScheduledInsert = true;
		await processDueScheduledSteps();

		expect(mocks.sendMessage).toHaveBeenCalledTimes(1);
		// Транзакция откатила пометку 'sent': иначе в очереди не осталось бы
		// ничего, чем продолжить цепочку, и хвост потерялся бы навсегда
		expect(mocks.state.scheduled).toHaveLength(1);
		expect(mocks.state.scheduled[0]).toEqual(
			expect.objectContaining({ status: 'pending', attempts: 1 })
		);
		// Чекпоинт уцелел — на ретрае сообщение не уйдёт повторно
		expect(mocks.state.scheduled[0].messageTelegramId).toBe(777);

		mocks.state.now = new Date(mocks.state.now.getTime() + 11 * 60 * 1000);
		await processDueScheduledSteps();

		expect(mocks.sendMessage.mock.calls.map((call) => call[1])).toEqual(['Первое', 'Второе']);
		expect(mocks.state.scheduled.map((row) => row.status)).toEqual(['sent', 'sent']);
	});

	it('цикл сценариев с задержкой упирается в предохранитель, а не крутится вечно', async () => {
		// A запускает B, B запускает A — и оба шага с задержкой, то есть каждый
		// проход идёт через отдельный тик крона. Пока глубина жила в памяти
		// процесса, она сбрасывалась на каждом тике и цикл был бесконечным.
		const a = scenario({ id: 10, triggerValue: 'a' });
		const b = scenario({ id: 20, triggerValue: 'b' });
		const user = contact();
		mocks.state.scenarios.push(a, b);
		mocks.state.contacts.push(user);
		mocks.state.steps.push(
			step({ id: 100, scenarioId: a.id, position: 0, delaySeconds: 60, startScenarioId: b.id }),
			step({ id: 200, scenarioId: b.id, position: 0, delaySeconds: 60, startScenarioId: a.id })
		);

		await triggerScenarioForContact(a as any, user as any);

		// Крутим цикл заведомо дольше, чем MAX_CHAIN_DEPTH
		for (let tick = 0; tick < 20; tick++) {
			mocks.state.now = new Date(mocks.state.now.getTime() + 61 * 1000);
			await processDueScheduledSteps();
		}

		// Глубина досчитала до предела сквозь тики крона и запуск цепочки прекратился
		expect(mocks.state.scheduled.map((row) => row.chainDepth)).toEqual([0, 1, 2, 3, 4, 5]);
		// Без сохранённой глубины записи плодились бы на каждом тике
		expect(mocks.state.scheduled).toHaveLength(6);
		// Без предохранителя записи плодились бы на каждом тике
		expect(mocks.state.scheduled.length).toBeLessThan(20);
	});

	it('отмену во время отправки не затирает статусом sent и цепочку не продолжает', async () => {
		const warmup = scenario();
		const user = contact();
		const current = step({ id: 100, scenarioId: warmup.id, position: 0, messageText: 'Первое' });
		const next = step({ id: 101, scenarioId: warmup.id, position: 1, messageText: 'Второе' });

		mocks.state.scenarios.push(warmup);
		mocks.state.contacts.push(user);
		mocks.state.steps.push(current, next);
		mocks.state.scheduled.push(
			scheduled({
				id: 1,
				contactId: user.id,
				scenarioId: warmup.id,
				stepId: current.id,
				scheduledAt: '2026-01-01T09:59:59.000Z'
			})
		);

		// Захват шага оставляет запись в pending, поэтому админ успевает её снять
		// ровно в тот момент, когда сообщение уже ушло в Telegram
		mocks.sendMessage.mockImplementation(async () => {
			mocks.state.scheduled[0].status = 'cancelled';
			mocks.state.scheduled[0].cancellationReason = 'cancelled_manually';
			return { message_id: 555 };
		});

		await processDueScheduledSteps();

		expect(mocks.state.scheduled[0].status).toBe('cancelled');
		// Второй шаг в очередь не встал — отменённая цепочка не поехала дальше
		expect(mocks.state.scheduled).toHaveLength(1);
		expect(mocks.sendMessage).toHaveBeenCalledTimes(1);
	});

	it('отмена во время отправки не даёт примениться тегам, этапу и дочерней цепочке', async () => {
		const warmup = scenario();
		const child = scenario({ id: 30, triggerValue: 'child' });
		const user = contact({ stage: 'new', tags: [] });
		// Шаг с обратимыми последствиями: их админ и отменял
		const heavy = step({
			id: 100,
			scenarioId: warmup.id,
			position: 0,
			messageText: 'Первое',
			addTags: ['получил_материал'],
			setStage: 'warm',
			startScenarioId: child.id
		});
		const childStep = step({
			id: 300,
			scenarioId: child.id,
			position: 0,
			messageText: 'Из дочерней цепочки'
		});

		mocks.state.scenarios.push(warmup, child);
		mocks.state.contacts.push(user);
		mocks.state.steps.push(heavy, childStep);
		mocks.state.scheduled.push(
			scheduled({
				id: 1,
				contactId: user.id,
				scenarioId: warmup.id,
				stepId: heavy.id,
				scheduledAt: '2026-01-01T09:59:59.000Z'
			})
		);

		mocks.sendMessage.mockImplementation(async () => {
			mocks.state.scheduled[0].status = 'cancelled';
			mocks.state.scheduled[0].cancellationReason = 'cancelled_manually';
			return { message_id: 555 };
		});

		await processDueScheduledSteps();

		// Отправку не отозвать, а вот всё обратимое применяться не должно
		expect(mocks.sendMessage).toHaveBeenCalledTimes(1);
		expect(mocks.state.contacts[0].tags).toEqual([]);
		expect(mocks.state.contacts[0].stage).toBe('new');
		expect(mocks.state.scheduled[0].effectsAppliedAt).toBeNull();
		expect(mocks.state.scheduled[0].childScenarioStartedAt).toBeNull();
		expect(mocks.state.scheduled).toHaveLength(1);
	});

	it('шаги без задержки уходят сразу, но проходят через очередь', async () => {
		const warmup = scenario();
		const user = contact();
		mocks.state.scenarios.push(warmup);
		mocks.state.contacts.push(user);
		mocks.state.steps.push(
			step({ id: 100, scenarioId: warmup.id, position: 0, messageText: 'Первое' }),
			step({ id: 101, scenarioId: warmup.id, position: 1, messageText: 'Второе' })
		);

		await triggerScenarioForContact(warmup as any, user as any);

		// Для человека ничего не изменилось — оба сообщения ушли в том же вызове
		expect(mocks.sendMessage.mock.calls.map((call) => call[1])).toEqual(['Первое', 'Второе']);
		// А в базе остался след, по которому цепочку можно доиграть после сбоя
		expect(mocks.state.scheduled.map((row) => [row.stepId, row.status])).toEqual([
			[100, 'sent'],
			[101, 'sent']
		]);
	});

	it('обрыв в середине цепочки без задержек доигрывается кроном, а не теряется', async () => {
		const warmup = scenario();
		const user = contact();
		mocks.state.scenarios.push(warmup);
		mocks.state.contacts.push(user);
		mocks.state.steps.push(
			step({ id: 100, scenarioId: warmup.id, position: 0, messageText: 'Первое' }),
			step({ id: 101, scenarioId: warmup.id, position: 1, messageText: 'Второе' })
		);

		// Второй шаг падает на сетевой ошибке уже после доставки первого
		mocks.sendMessage
			.mockResolvedValueOnce({ message_id: 1 })
			.mockRejectedValueOnce(new Error('socks proxy unreachable'))
			.mockResolvedValue({ message_id: 2 });

		await triggerScenarioForContact(warmup as any, user as any);

		expect(mocks.sendMessage).toHaveBeenCalledTimes(2);
		expect(mocks.state.scheduled[0].status).toBe('sent');
		// Раньше здесь цепочка обрывалась молча: inline-путь не имел ни ретраев,
		// ни следа в базе. Теперь упавший шаг ждёт своей очереди.
		expect(mocks.state.scheduled[1]).toEqual(
			expect.objectContaining({ stepId: 101, status: 'pending', attempts: 1 })
		);

		mocks.state.now = new Date(mocks.state.now.getTime() + 11 * 60 * 1000);
		await processDueScheduledSteps();

		expect(mocks.sendMessage.mock.calls.map((call) => call[1])).toEqual([
			'Первое',
			'Второе',
			'Второе'
		]);
		expect(mocks.state.scheduled[1].status).toBe('sent');
	});
});

describe('triggerScenarioByKey', () => {
	beforeEach(() => {
		mocks.reset();
		mocks.sendMessage.mockResolvedValue({ message_id: 777 });
		vi.mocked(getContact).mockReset();
	});

	it('returns false when no scenario matches the key', async () => {
		vi.mocked(getContact).mockResolvedValue(contact() as any);

		const result = await triggerScenarioByKey('unknown_key', 1);

		expect(result).toBe(false);
		expect(mocks.sendMessage).not.toHaveBeenCalled();
	});

	it('returns false when contact does not exist', async () => {
		mocks.state.scenarios.push(scenario({ triggerType: 'start_param', triggerValue: 'lead' }));
		vi.mocked(getContact).mockResolvedValue(null as any);

		const result = await triggerScenarioByKey('lead', 999);

		expect(result).toBe(false);
		expect(mocks.sendMessage).not.toHaveBeenCalled();
	});

	it('returns false when contact has blocked the bot', async () => {
		mocks.state.scenarios.push(scenario({ triggerType: 'start_param', triggerValue: 'lead' }));
		vi.mocked(getContact).mockResolvedValue(contact({ botBlocked: true }) as any);

		const result = await triggerScenarioByKey('lead', 1);

		expect(result).toBe(false);
		expect(mocks.sendMessage).not.toHaveBeenCalled();
	});

	it('returns true and triggers the scenario when key and contact are valid', async () => {
		const sc = scenario({ id: 10, triggerType: 'start_param', triggerValue: 'lead' });
		const user = contact({ id: 1, telegramUserId: 1001 });
		const sc_step = step({ id: 100, scenarioId: 10, messageText: 'Привет с сайта' });

		mocks.state.scenarios.push(sc);
		mocks.state.steps.push(sc_step);
		mocks.state.contacts.push(user);
		vi.mocked(getContact).mockResolvedValue(user as any);

		const result = await triggerScenarioByKey('lead', 1);

		expect(result).toBe(true);
		expect(mocks.sendMessage).toHaveBeenCalledWith(1001, 'Привет с сайта', { parse_mode: 'HTML' });
	});

	it('triggers all matching scenarios when multiple share the same key', async () => {
		const sc1 = scenario({ id: 10, triggerType: 'start_param', triggerValue: 'lead' });
		const sc2 = scenario({ id: 20, triggerType: 'start_param', triggerValue: 'lead' });
		const user = contact({ id: 1, telegramUserId: 1001 });
		const step1 = step({ id: 100, scenarioId: 10, messageText: 'Сообщение 1' });
		const step2 = step({ id: 200, scenarioId: 20, messageText: 'Сообщение 2' });

		mocks.state.scenarios.push(sc1, sc2);
		mocks.state.steps.push(step1, step2);
		mocks.state.contacts.push(user);
		vi.mocked(getContact).mockResolvedValue(user as any);

		const result = await triggerScenarioByKey('lead', 1);

		expect(result).toBe(true);
		expect(mocks.sendMessage).toHaveBeenCalledTimes(2);
	});
});

describe('renderStepText substitutions', () => {
	beforeEach(() => {
		mocks.reset();
		mocks.sendMessage.mockResolvedValue({ message_id: 777 });
	});

	it('substitutes {contact_id} in message text', async () => {
		const sc = scenario();
		// В подстановку идёт публичный id, а не внутренний
		const user = contact({ id: 42, publicId: 987654321, telegramUserId: 1001 });
		const sc_step = step({ id: 100, messageText: 'Ваша ссылка: ?id={contact_id}' });

		mocks.state.scenarios.push(sc);
		mocks.state.steps.push(sc_step);
		mocks.state.contacts.push(user);

		await triggerScenarioForContact(sc as any, user as any);

		expect(mocks.sendMessage).toHaveBeenCalledWith(1001, 'Ваша ссылка: ?id=987654321', {
			parse_mode: 'HTML'
		});
	});

	it('substitutes {first_name} in message text', async () => {
		const sc = scenario();
		const user = contact({ id: 1, telegramUserId: 1001, firstName: 'Мария' });
		const sc_step = step({ id: 100, messageText: 'Привет, {first_name}!' });

		mocks.state.scenarios.push(sc);
		mocks.state.steps.push(sc_step);
		mocks.state.contacts.push(user);

		await triggerScenarioForContact(sc as any, user as any);

		expect(mocks.sendMessage).toHaveBeenCalledWith(1001, 'Привет, Мария!', { parse_mode: 'HTML' });
	});

	it('substitutes {first_name} with empty string when contact has no first name', async () => {
		const sc = scenario();
		const user = contact({ id: 1, telegramUserId: 1001, firstName: null });
		const sc_step = step({ id: 100, messageText: 'Привет, {first_name}!' });

		mocks.state.scenarios.push(sc);
		mocks.state.steps.push(sc_step);
		mocks.state.contacts.push(user);

		await triggerScenarioForContact(sc as any, user as any);

		expect(mocks.sendMessage).toHaveBeenCalledWith(1001, 'Привет, !', { parse_mode: 'HTML' });
	});

	it('substitutes #{client_id} (Salebot alias) with publicId', async () => {
		const sc = scenario();
		const user = contact({ publicId: 555666777, telegramUserId: 1001 });
		const sc_step = step({ id: 100, messageText: 'Ваш id: #{client_id}' });

		mocks.state.scenarios.push(sc);
		mocks.state.steps.push(sc_step);
		mocks.state.contacts.push(user);

		await triggerScenarioForContact(sc as any, user as any);

		expect(mocks.sendMessage).toHaveBeenCalledWith(1001, 'Ваш id: 555666777', {
			parse_mode: 'HTML'
		});
	});

	it('substitutes {contact_id} in button URL', async () => {
		const sc = scenario();
		const user = contact({ id: 7, publicId: 7, telegramUserId: 1001 });
		const sc_step = step({
			id: 100,
			messageText: 'Нажми кнопку',
			buttonText: 'Перейти',
			buttonUrl: 'https://example.com/ref/{contact_id}'
		});

		mocks.state.scenarios.push(sc);
		mocks.state.steps.push(sc_step);
		mocks.state.contacts.push(user);

		await triggerScenarioForContact(sc as any, user as any);

		expect(mocks.sendMessage).toHaveBeenCalledWith(
			1001,
			'Нажми кнопку',
			expect.objectContaining({
				reply_markup: {
					inline_keyboard: [[{ text: 'Перейти', url: 'https://example.com/ref/7' }]]
				}
			})
		);
	});
});

describe('launchScenarioForSegment', () => {
	beforeEach(() => {
		mocks.reset();
		mocks.sendMessage.mockResolvedValue({ message_id: 777 });
	});

	it('returns 0 when scenario has no steps', async () => {
		mocks.state.scenarios.push(scenario({ id: 50 }));

		const count = await launchScenarioForSegment(50, { requireTags: [], excludeTags: [] });

		expect(count).toBe(0);
		expect(mocks.state.scheduled).toHaveLength(0);
	});

	it('schedules first step for all non-blocked contacts', async () => {
		const firstStep = step({ id: 200, scenarioId: 50, position: 0, delaySeconds: 0 });
		const user1 = contact({ id: 1, telegramUserId: 1001, botBlocked: false });
		const user2 = contact({ id: 2, telegramUserId: 1002, botBlocked: false });
		const blocked = contact({ id: 3, telegramUserId: 1003, botBlocked: true });

		mocks.state.scenarios.push(scenario({ id: 50 }));
		mocks.state.steps.push(firstStep);
		mocks.state.contacts.push(user1, user2, blocked);

		const count = await launchScenarioForSegment(50, { requireTags: [], excludeTags: [] });

		expect(count).toBe(2);
		expect(mocks.state.scheduled).toHaveLength(2);
		expect(mocks.state.scheduled.every((s) => s.stepId === firstStep.id)).toBe(true);
		expect(mocks.state.broadcastRuns[0].matchedCount).toBe(2);
	});

	it('cancels previous pending steps for the scenario before scheduling new ones', async () => {
		const firstStep = step({ id: 200, scenarioId: 50, position: 0 });
		const user1 = contact({ id: 1, botBlocked: false });

		mocks.state.scenarios.push(scenario({ id: 50 }));
		mocks.state.steps.push(firstStep);
		mocks.state.contacts.push(user1);
		mocks.state.scheduled.push(
			scheduled({ id: 99, scenarioId: 50, stepId: 200, status: 'pending' })
		);

		await launchScenarioForSegment(50, { requireTags: [], excludeTags: [] });

		expect(mocks.state.scheduled.find((s) => s.id === 99)?.status).toBe('cancelled');
	});

	it('filters contacts by requireTags', async () => {
		const firstStep = step({ id: 200, scenarioId: 50, position: 0 });
		const tagged = contact({ id: 1, tags: ['vip'], botBlocked: false });
		const untagged = contact({ id: 2, tags: [], botBlocked: false });

		mocks.state.scenarios.push(scenario({ id: 50 }));
		mocks.state.steps.push(firstStep);
		mocks.state.contacts.push(tagged, untagged);

		const count = await launchScenarioForSegment(50, { requireTags: ['vip'], excludeTags: [] });

		expect(count).toBe(1);
		expect(mocks.state.scheduled[0].contactId).toBe(tagged.id);
	});

	it('filters contacts by excludeTags', async () => {
		const firstStep = step({ id: 200, scenarioId: 50, position: 0 });
		const clean = contact({ id: 1, tags: [], botBlocked: false });
		const excluded = contact({ id: 2, tags: ['unsubscribed'], botBlocked: false });

		mocks.state.scenarios.push(scenario({ id: 50 }));
		mocks.state.steps.push(firstStep);
		mocks.state.contacts.push(clean, excluded);

		const count = await launchScenarioForSegment(50, {
			requireTags: [],
			excludeTags: ['unsubscribed']
		});

		expect(count).toBe(1);
		expect(mocks.state.scheduled[0].contactId).toBe(clean.id);
	});

	it('records a broadcast run entry regardless of matched contacts count', async () => {
		mocks.state.scenarios.push(scenario({ id: 50 }));
		mocks.state.steps.push(step({ id: 200, scenarioId: 50, position: 0 }));

		await launchScenarioForSegment(50, { requireTags: [], excludeTags: [] });

		expect(mocks.state.broadcastRuns).toHaveLength(1);
		expect(mocks.state.broadcastRuns[0]).toMatchObject({
			scenarioId: 50,
			requireTags: [],
			excludeTags: [],
			matchedCount: 0
		});
	});
});

describe('cooldown «не чаще раза в N дней»', () => {
	beforeEach(() => {
		mocks.reset();
		mocks.sendMessage.mockResolvedValue({ message_id: 777 });
	});

	it('blocks restart within the window, allows after, upserts single run row', async () => {
		const sc = scenario({ cooldownDays: 14 });
		const user = contact();
		const st = step({ id: 100, messageText: 'Прогрев' });

		mocks.state.scenarios.push(sc);
		mocks.state.contacts.push(user);
		mocks.state.steps.push(st);

		await triggerScenarioForContact(sc as any, user as any);
		expect(mocks.sendMessage).toHaveBeenCalledTimes(1);
		expect(mocks.state.scenarioRuns).toHaveLength(1);

		// Повторный запуск внутри окна — молча пропускается
		await triggerScenarioForContact(sc as any, user as any);
		expect(mocks.sendMessage).toHaveBeenCalledTimes(1);

		// Через 15 дней — запускается снова, строка запуска одна (upsert)
		mocks.state.now = new Date(mocks.state.now.getTime() + 15 * 24 * 60 * 60 * 1000);
		await triggerScenarioForContact(sc as any, user as any);
		expect(mocks.sendMessage).toHaveBeenCalledTimes(2);
		expect(mocks.state.scenarioRuns).toHaveLength(1);
	});

	it('cooldown does not affect scenarios with cooldownDays = 0', async () => {
		const sc = scenario({ cooldownDays: 0 });
		const user = contact();
		const st = step({ id: 100, messageText: 'Привет' });

		mocks.state.scenarios.push(sc);
		mocks.state.contacts.push(user);
		mocks.state.steps.push(st);

		await triggerScenarioForContact(sc as any, user as any);
		await triggerScenarioForContact(sc as any, user as any);

		expect(mocks.sendMessage).toHaveBeenCalledTimes(2);
		expect(mocks.state.scenarioRuns).toHaveLength(0);
	});
});

describe('шлагбаум подписки: условия шагов и кнопка «Я подписался»', () => {
	beforeEach(() => {
		mocks.reset();
		mocks.sendMessage.mockResolvedValue({ message_id: 777 });
		mocks.logOutboundMessage.mockResolvedValue(undefined);
		mocks.setBotBlocked.mockResolvedValue(undefined);
	});

	/** Цепочка: шаг-шлагбаум для неподписанных + шаг с материалом. */
	function gatedScenario() {
		const warmup = scenario();
		const user = contact();
		const gate = step({
			id: 100,
			position: 0,
			condition: 'not_subscribed',
			buttonAction: 'check_subscription',
			messageText: 'Материал для подписчиков канала',
			buttonText: 'Подписаться на @kalmykov_psy',
			buttonUrl: 'https://t.me/kalmykov_psy/60'
		});
		const material = step({ id: 101, position: 1, messageText: 'А вот и статья, забирайте!' });

		mocks.state.scenarios.push(warmup);
		mocks.state.contacts.push(user);
		mocks.state.steps.push(gate, material);
		// Канал для проверки подписки берётся из привязанного к цепочке поста
		mocks.state.channelPosts.push({ id: 1, scenarioId: warmup.id, chatId: '@kalmykov_psy' });

		return { warmup, user, gate, material };
	}

	it('подписанный проходит шлагбаум насквозь и сразу получает материал', async () => {
		const { warmup, user } = gatedScenario();
		mocks.getChatMember.mockResolvedValue({ status: 'member' });

		await triggerScenarioForContact(warmup as any, user as any);

		const texts = mocks.sendMessage.mock.calls.map((call) => call[1]);
		expect(texts).toEqual(['А вот и статья, забирайте!']);
	});

	it('неподписанный получает шлагбаум, и цепочка на нём останавливается', async () => {
		const { warmup, user } = gatedScenario();
		mocks.getChatMember.mockResolvedValue({ status: 'left' });

		await triggerScenarioForContact(warmup as any, user as any);

		const texts = mocks.sendMessage.mock.calls.map((call) => call[1]);
		expect(texts).toEqual(['Материал для подписчиков канала']);
	});

	it('под шлагбаумом показываются кнопка-ссылка на канал и кнопка проверки', async () => {
		const { warmup, user, gate } = gatedScenario();
		mocks.getChatMember.mockResolvedValue({ status: 'left' });

		await triggerScenarioForContact(warmup as any, user as any);

		expect(mocks.sendMessage.mock.calls[0][2].reply_markup.inline_keyboard).toEqual([
			[{ text: 'Подписаться на @kalmykov_psy', url: 'https://t.me/kalmykov_psy/60' }],
			[{ text: 'Я подписался', callback_data: `sub:${gate.id}` }]
		]);
	});

	it('«Я подписался» с подтверждённой подпиской продолжает цепочку', async () => {
		const { user, gate } = gatedScenario();
		mocks.getChatMember.mockResolvedValue({ status: 'member' });

		const result = await handleSubscriptionGateCallback(user as any, gate.id, 777);

		expect(result).toEqual({ alert: null, continuationId: expect.any(Number), accepted: true });
		// Callback только ставит хвост в надёжную очередь и не ждёт отправку материала.
		expect(mocks.sendMessage).not.toHaveBeenCalled();
		await runScheduledStep(result.continuationId as number);
		expect(mocks.sendMessage.mock.calls.map((call) => call[1])).toEqual([
			'А вот и статья, забирайте!'
		]);
	});

	it('материал выдаётся адресно, не дожидаясь назревшей рассылки', async () => {
		const { warmup, user, gate } = gatedScenario();
		mocks.getChatMember.mockResolvedValue({ status: 'member' });

		// Впереди в очереди уже стоит назревшая рассылка — раньше материал уезжал
		// в её хвост и человек ждал, пока она разойдётся
		const other = contact({ id: 900, telegramUserId: 9000 });
		mocks.state.contacts.push(other);
		mocks.state.scheduled.push(
			scheduled({
				id: 500,
				contactId: other.id,
				scenarioId: warmup.id,
				stepId: gate.id,
				scheduledAt: '2026-01-01T09:00:00.000Z'
			})
		);

		const { continuationId } = await handleSubscriptionGateCallback(user as any, gate.id, 777);
		await runScheduledStep(continuationId as number);

		expect(mocks.sendMessage.mock.calls.map((call) => call[1])).toEqual([
			'А вот и статья, забирайте!'
		]);
		// Чужое задание не тронуто — его заберёт cron своим чередом
		expect(mocks.state.scheduled.find((row) => row.id === 500)?.status).toBe('pending');
	});

	it('отложенный хвост шлагбаума не выполняется в момент нажатия', async () => {
		const { user, gate, material } = gatedScenario();
		mocks.getChatMember.mockResolvedValue({ status: 'member' });
		material.delaySeconds = 3600;

		const result = await handleSubscriptionGateCallback(user as any, gate.id, 777);

		// Торопить нечего: задание встало в очередь на час вперёд
		expect(result).toEqual({ alert: null, continuationId: null, accepted: true });
		expect(mocks.state.scheduled).toHaveLength(1);
		expect(mocks.state.scheduled[0].scheduledAt).toBe('2026-01-01T11:00:00.000Z');
		expect(mocks.sendMessage).not.toHaveBeenCalled();
	});

	it('«Я подписался» без подписки возвращает алерт и материал не выдаёт', async () => {
		const { user, gate } = gatedScenario();
		mocks.getChatMember.mockResolvedValue({ status: 'left' });

		const result = await handleSubscriptionGateCallback(user as any, gate.id, 777);

		expect(result).toEqual({
			alert: 'Подписки пока не вижу',
			continuationId: null,
			accepted: false
		});
		expect(mocks.sendMessage).not.toHaveBeenCalled();
	});

	it('повтор одного callback не ставит хвост цепочки второй раз', async () => {
		const { user, gate } = gatedScenario();
		mocks.getChatMember.mockResolvedValue({ status: 'member' });

		const first = await handleSubscriptionGateCallback(user as any, gate.id, 777);
		const retry = await handleSubscriptionGateCallback(user as any, gate.id, 777);

		expect(first.continuationId).toEqual(expect.any(Number));
		expect(retry).toEqual({ alert: null, continuationId: null, accepted: true });
		expect(mocks.state.scheduled).toHaveLength(1);
	});

	it('повторная доставка того же callback не снимает уже поставленный хвост', async () => {
		const { user, gate, material } = gatedScenario();
		mocks.getChatMember.mockResolvedValue({ status: 'member' });
		material.delaySeconds = 3600; // хвост ждёт в очереди, его видно

		await handleSubscriptionGateCallback(user as any, gate.id, 777);
		expect(mocks.state.scheduled[0].status).toBe('pending');

		// Telegram переслал тот же update повторно — перезапуск цепочки не должен
		// принять собственную запись этого нажатия за «идущий параллельный прогон»
		await handleSubscriptionGateCallback(user as any, gate.id, 777);

		expect(mocks.state.scheduled).toHaveLength(1);
		expect(mocks.state.scheduled[0].status).toBe('pending');
	});

	it('нажатие по старой кнопке снимает идущий прогон, а не пускает вторую копию', async () => {
		const { warmup, user, gate, material } = gatedScenario();
		mocks.getChatMember.mockResolvedValue({ status: 'member' });

		// Человек уже зашёл заново (по рекламе) — свежий прогон в работе
		mocks.state.scheduled.push(
			scheduled({
				id: 50,
				contactId: user.id,
				scenarioId: warmup.id,
				stepId: material.id,
				scheduledAt: '2026-01-01T12:00:00.000Z'
			})
		);

		// ...и теперь жмёт кнопку под старым сообщением
		const { continuationId } = await handleSubscriptionGateCallback(user as any, gate.id, 777);
		await runScheduledStep(continuationId as number);

		// Старый прогон снят, материал ушёл ровно один раз
		expect(mocks.state.scheduled.find((row) => row.id === 50)).toEqual(
			expect.objectContaining({ status: 'cancelled', cancellationReason: 'gate_restarted' })
		);
		expect(mocks.sendMessage.mock.calls.map((call) => call[1])).toEqual([
			'А вот и статья, забирайте!'
		]);
	});

	it('повтор callback восстанавливает окончательно упавшее продолжение', async () => {
		const { warmup, user, gate, material } = gatedScenario();
		mocks.getChatMember.mockResolvedValue({ status: 'member' });
		mocks.state.scheduled.push(
			scheduled({
				contactId: user.id,
				scenarioId: warmup.id,
				stepId: material.id,
				sourceStepId: gate.id,
				sourceMessageId: 777,
				status: 'failed',
				attempts: 3,
				lastError: 'temporary failure'
			})
		);

		const result = await handleSubscriptionGateCallback(user as any, gate.id, 777);

		expect(result).toEqual({ alert: null, continuationId: expect.any(Number), accepted: true });
		expect(mocks.state.scheduled[0]).toEqual(
			expect.objectContaining({
				status: 'pending',
				attempts: 0,
				lastError: null,
				processedAt: null
			})
		);
	});

	it('повтор callback восстанавливает технически отменённое продолжение', async () => {
		const { warmup, user, gate, material } = gatedScenario();
		mocks.getChatMember.mockResolvedValue({ status: 'member' });
		mocks.state.scheduled.push(
			scheduled({
				contactId: user.id,
				scenarioId: warmup.id,
				stepId: material.id,
				sourceStepId: gate.id,
				sourceMessageId: 777,
				status: 'cancelled',
				cancellationReason: 'scenario_disabled'
			})
		);

		const result = await handleSubscriptionGateCallback(user as any, gate.id, 777);

		expect(result).toEqual({ alert: null, continuationId: expect.any(Number), accepted: true });
		expect(mocks.state.scheduled[0]).toEqual(
			expect.objectContaining({
				status: 'pending',
				attempts: 0,
				cancellationReason: null,
				processedAt: null
			})
		);
	});

	it('ручную отмену не маскирует под успешную выдачу', async () => {
		const { warmup, user, gate, material } = gatedScenario();
		mocks.getChatMember.mockResolvedValue({ status: 'member' });
		mocks.state.scheduled.push(
			scheduled({
				contactId: user.id,
				scenarioId: warmup.id,
				stepId: material.id,
				sourceStepId: gate.id,
				sourceMessageId: 777,
				status: 'cancelled',
				cancellationReason: 'cancelled_manually'
			})
		);

		const result = await handleSubscriptionGateCallback(user as any, gate.id, 777);

		expect(result).toEqual({
			alert: 'Не удалось продолжить отправку. Напишите боту или администратору.',
			continuationId: null,
			accepted: false
		});
		expect(mocks.state.scheduled[0].status).toBe('cancelled');
	});

	it('системную отмену не превращает в тревожный алерт', async () => {
		const { warmup, user, gate, material } = gatedScenario();
		mocks.getChatMember.mockResolvedValue({ status: 'member' });
		// Цепочку перезапустили — старый хвост сняли мы сами, чинить нечего
		mocks.state.scheduled.push(
			scheduled({
				contactId: user.id,
				scenarioId: warmup.id,
				stepId: material.id,
				sourceStepId: gate.id,
				sourceMessageId: 777,
				status: 'cancelled',
				cancellationReason: 'scenario_restarted'
			})
		);

		const result = await handleSubscriptionGateCallback(user as any, gate.id, 777);

		expect(result).toEqual({ alert: null, continuationId: null, accepted: true });
		expect(mocks.state.scheduled[0].status).toBe('cancelled');
	});

	it('сбой getChatMember трактуется в пользу юзера — материал выдаётся', async () => {
		const { warmup, user } = gatedScenario();
		mocks.getChatMember.mockRejectedValue(new Error('bot is not an admin'));

		await triggerScenarioForContact(warmup as any, user as any);

		expect(mocks.sendMessage.mock.calls.map((call) => call[1])).toEqual([
			'А вот и статья, забирайте!'
		]);
	});

	it('условие отложенного шага проверяется при отправке, а не при планировании', async () => {
		const warmup = scenario();
		const user = contact();
		// Шаг ждёт час и уходит только тем, кто к этому моменту всё ещё не подписан
		const reminder = step({
			id: 100,
			position: 0,
			delaySeconds: 3600,
			condition: 'not_subscribed',
			messageText: 'Напоминание: материал ждёт'
		});
		const next = step({ id: 101, position: 1, messageText: 'Следующий шаг' });

		mocks.state.scenarios.push(warmup);
		mocks.state.contacts.push(user);
		mocks.state.steps.push(reminder, next);
		mocks.state.channelPosts.push({ id: 1, scenarioId: warmup.id, chatId: '@kalmykov_psy' });

		// На момент планирования человек не подписан — шаг всё равно просто встаёт в очередь
		mocks.getChatMember.mockResolvedValue({ status: 'left' });
		await triggerScenarioForContact(warmup as any, user as any);
		expect(mocks.state.scheduled).toHaveLength(1);
		expect(mocks.getChatMember).not.toHaveBeenCalled();

		// За время задержки подписался — напоминание пропускается, цепочка идёт дальше
		mocks.getChatMember.mockResolvedValue({ status: 'member' });
		mocks.state.now = new Date('2026-01-01T11:30:00.000Z');
		await processDueScheduledSteps();

		// Именно skipped, а не sent: сообщение не уходило и статистику занижать нельзя
		expect(mocks.state.scheduled[0].status).toBe('skipped');
		expect(mocks.state.scheduled[1].status).toBe('sent');
		expect(mocks.sendMessage.mock.calls.map((call) => call[1])).toEqual(['Следующий шаг']);
	});
});

describe('замер воронки бота', () => {
	beforeEach(() => {
		mocks.reset();
		mocks.sendMessage.mockResolvedValue({ message_id: 777 });
		mocks.logOutboundMessage.mockResolvedValue(undefined);
		mocks.setBotBlocked.mockResolvedValue(undefined);
	});

	function gated() {
		const warmup = scenario();
		const user = contact({ metrikaClientId: '1783340168351969217' });
		const gate = step({
			id: 100,
			position: 0,
			condition: 'not_subscribed',
			buttonAction: 'check_subscription',
			messageText: 'Материал для подписчиков канала',
			buttonText: 'Подписаться',
			buttonUrl: 'https://t.me/kalmykov_psy'
		});
		mocks.state.scenarios.push(warmup);
		mocks.state.contacts.push(user);
		mocks.state.steps.push(gate, step({ id: 101, position: 1, messageText: 'Статья' }));
		mocks.state.channelPosts.push({ id: 1, scenarioId: warmup.id, chatId: '@kalmykov_psy' });
		return { warmup, user, gate };
	}

	it('шлагбаум отмечает на контакте «упёрся в подписку»', async () => {
		const { warmup, user } = gated();
		mocks.getChatMember.mockResolvedValue({ status: 'left' });

		await triggerScenarioForContact(warmup as any, user as any);

		expect(mocks.markGateShown).toHaveBeenCalledWith(user.id);
		expect(mocks.markGatePassed).not.toHaveBeenCalled();
	});

	it('подписанный проходит без отметки «упёрся»', async () => {
		const { warmup, user } = gated();
		mocks.getChatMember.mockResolvedValue({ status: 'member' });

		await triggerScenarioForContact(warmup as any, user as any);

		expect(mocks.markGateShown).not.toHaveBeenCalled();
	});

	it('нажатие «Я подписался» отмечает прохождение', async () => {
		const { user, gate } = gated();
		mocks.getChatMember.mockResolvedValue({ status: 'member' });

		await handleSubscriptionGateCallback(user as any, gate.id, 777);

		expect(mocks.markGatePassed).toHaveBeenCalledWith(user.id);
	});

	it('неудачное «Я подписался» ничего не отмечает', async () => {
		const { user, gate } = gated();
		mocks.getChatMember.mockResolvedValue({ status: 'left' });

		await handleSubscriptionGateCallback(user as any, gate.id, 777);

		expect(mocks.markGatePassed).not.toHaveBeenCalled();
	});
});

describe('parseStartPayload', () => {
	it('обычный ключ остаётся ключом', () => {
		expect(parseStartPayload('otpusk')).toEqual({ key: 'otpusk', metrikaClientId: null });
	});

	it('ключ с подчёркиваниями не ломается', () => {
		expect(parseStartPayload('lm_otpusk_read75')).toEqual({
			key: 'lm_otpusk_read75',
			metrikaClientId: null
		});
	});

	it('двойное подчёркивание отделяет ClientID', () => {
		expect(parseStartPayload('otpusk__1783340168351969217')).toEqual({
			key: 'otpusk',
			metrikaClientId: '1783340168351969217'
		});
	});

	it('нецифровой хвост игнорируется, ключ сохраняется', () => {
		expect(parseStartPayload('otpusk__abc')).toEqual({ key: 'otpusk', metrikaClientId: null });
	});

	it('диплинк с ClientID находит цепочку по ключу', async () => {
		mocks.reset();
		mocks.state.scenarios.push(scenario({ triggerType: 'start_param', triggerValue: 'otpusk' }));

		const found = await findTriggeredScenarios('/start otpusk__1783340168351969217');

		expect(found.map((s) => s.triggerValue)).toEqual(['otpusk']);
	});
});

describe('шлагбаум: повторные нажатия и отложенные шаги', () => {
	beforeEach(() => {
		mocks.reset();
		mocks.sendMessage.mockResolvedValue({ message_id: 777 });
		mocks.logOutboundMessage.mockResolvedValue(undefined);
		mocks.setBotBlocked.mockResolvedValue(undefined);
	});

	function gateAndMaterial(gateOverrides: Record<string, any> = {}) {
		const warmup = scenario();
		const user = contact();
		const gate = step({
			id: 100,
			position: 0,
			condition: 'not_subscribed',
			buttonAction: 'check_subscription',
			messageText: 'Материал для подписчиков',
			buttonText: 'Подписаться',
			buttonUrl: 'https://t.me/kalmykov_psy',
			...gateOverrides
		});
		mocks.state.scenarios.push(warmup);
		mocks.state.contacts.push(user);
		mocks.state.steps.push(gate, step({ id: 101, position: 1, messageText: 'Статья' }));
		mocks.state.channelPosts.push({ id: 1, scenarioId: warmup.id, chatId: '@kalmykov_psy' });
		return { warmup, user, gate };
	}

	it('шлагбаум второй цепочки не блокируется отметкой от первой', async () => {
		// Человек уже проходил шлагбаум в другой воронке — gate_passed_at заполнен.
		// Это метка аналитики, она не должна мешать выдать материал во второй.
		const { user, gate } = gateAndMaterial();
		mocks.getChatMember.mockResolvedValue({ status: 'member' });

		const result = await handleSubscriptionGateCallback(user as any, gate.id, 777);

		expect(result).toEqual({ alert: null, continuationId: expect.any(Number), accepted: true });
		await processDueScheduledSteps();
		expect(mocks.sendMessage.mock.calls.map((c) => c[1])).toEqual(['Статья']);
	});

	it('отложенный шлагбаум тоже отмечается в воронке', async () => {
		const { warmup, user } = gateAndMaterial({ delaySeconds: 3600 });
		mocks.getChatMember.mockResolvedValue({ status: 'left' });

		await triggerScenarioForContact(warmup as any, user as any);
		expect(mocks.state.scheduled).toHaveLength(1);
		expect(mocks.markGateShown).not.toHaveBeenCalled();

		mocks.state.now = new Date('2026-01-01T11:30:00.000Z');
		await processDueScheduledSteps();

		expect(mocks.markGateShown).toHaveBeenCalledWith(user.id);
		// И хвост цепочки не поехал — ждём нажатия кнопки
		expect(mocks.sendMessage.mock.calls.map((c) => c[1])).toEqual(['Материал для подписчиков']);
	});
});

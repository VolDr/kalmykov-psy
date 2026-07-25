import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
	type Row = Record<string, any>;
	type Condition =
		| { __testOp: 'and'; conditions: Condition[] }
		| { __testOp: 'eq' | 'gt' | 'lte'; left: any; right: any }
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
		nextScheduledId: 1
	};

	const sendMessage = vi.fn();
	const logOutboundMessage = vi.fn();
	const setBotBlocked = vi.fn();

	function reset() {
		state.now = new Date('2026-01-01T10:00:00.000Z');
		state.contacts = [];
		state.scenarios = [];
		state.steps = [];
		state.scheduled = [];
		state.broadcastRuns = [];
		state.scenarioRuns = [];
		state.nextScheduledId = 1;
		sendMessage.mockReset();
		logOutboundMessage.mockReset();
		setBotBlocked.mockReset();
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
		scheduled_at: 'scheduledAt',
		processed_at: 'processedAt',
		last_error: 'lastError',
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
			return (
				asComparable(row.lastStartedAt) > state.now.getTime() - days * 24 * 60 * 60 * 1000
			);
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
			case 'gt':
				return asComparable(valueFor(row, condition.left)) > asComparable(resolveSql(condition.right));
			case 'lte':
				return asComparable(valueFor(row, condition.left)) <= asComparable(resolveSql(condition.right));
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

	class InsertBuilder {
		constructor(private readonly table: any) {}

		values(values: Row | Row[]) {
			const table = tableName(this.table);
			const rows = Array.isArray(values) ? values : [values];
			const inserted = rows.map((row) => {
				const normalised = normalisePatch(row);

				if (table === 'bot_scheduled_steps') {
					return {
						id: state.nextScheduledId++,
						status: 'pending',
						attempts: 0,
						lastError: null,
						createdAt: iso(state.now),
						processedAt: null,
						...normalised
					};
				}

				return { id: rowsFor(table).length + 1, createdAt: iso(state.now), ...normalised };
			});

			rowsFor(table).push(...inserted);
			return Promise.resolve(inserted);
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
		// В моке транзакция — просто вызов колбэка с тем же db
		transaction: async <T>(fn: (tx: any) => Promise<T>): Promise<T> => fn(db)
	};

	return { db, state, reset, sendMessage, logOutboundMessage, setBotBlocked };
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
		gt: (left: any, right: any) => ({ __testOp: 'gt', left, right }),
		lte: (left: any, right: any) => ({ __testOp: 'lte', left, right }),
		asc: (column: any) => ({ __testOrder: 'asc', column })
	};
});

vi.mock('../..', () => ({ db: mocks.db }));
vi.mock('./telegram-client-bot.server', () => ({
	clientBotApi: { sendMessage: mocks.sendMessage },
	tgFormat: (text: string) => text
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
	return { GrammyError };
});

import { GrammyError } from 'grammy';
import {
	deleteStepAndRepointQueue,
	findTriggeredScenarios,
	launchScenarioForSegment,
	processDueScheduledSteps,
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
		mocks.state.scenarios.push(
			scenario({ id: 2, triggerType: 'command', triggerValue: '/start' })
		);

		const result = await findTriggeredScenarios('/start');
		expect(result.map((s) => s.id)).toEqual([2]);
	});

	it('returns command scenario for matching command', async () => {
		mocks.state.scenarios.push(
			scenario({ id: 5, triggerType: 'command', triggerValue: '/help' })
		);

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
		const current = step({ id: 100, scenarioId: warmup.id, position: 0, messageText: 'Первый шаг' });
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
		mocks.state.scheduled.push(
			scheduled({ id: 1, scheduledAt: '2026-01-01T09:59:00.000Z' })
		);

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
		mocks.state.scheduled.push(
			scheduled({ id: 1, scheduledAt: '2026-01-01T09:59:00.000Z' })
		);

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
		mocks.state.scheduled.push(
			scheduled({ id: 1, scheduledAt: '2026-01-01T09:59:00.000Z' })
		);

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

		expect(mocks.sendMessage).toHaveBeenCalledWith(
			1001,
			'Ваша ссылка: ?id=987654321',
			{ parse_mode: 'HTML' }
		);
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

		expect(mocks.sendMessage).toHaveBeenCalledWith(
			1001,
			'Ваш id: 555666777',
			{ parse_mode: 'HTML' }
		);
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

		const count = await launchScenarioForSegment(50, { requireTags: [], excludeTags: ['unsubscribed'] });

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

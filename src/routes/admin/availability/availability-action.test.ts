import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';

const mocks = vi.hoisted(() => {
	const operationOrder: string[] = [];
	const deleteConditions: unknown[] = [];
	const deleteResults: Array<Array<{ id: number }>> = [];
	const selectConditions: unknown[] = [];
	const selectResults: Array<Array<{ id: number; startAt: string; endAt: string }>> = [];
	const updateValues: Array<Record<string, unknown>> = [];
	const transaction = vi.fn();

	const tx = {
		execute: vi.fn(async () => undefined),
		select: vi.fn(() => {
			operationOrder.push('select');
			return {
				from: () => ({
					where: (condition: unknown) => {
						selectConditions.push(condition);
						return Promise.resolve(selectResults.shift() ?? []);
					}
				})
			};
		}),
		insert: vi.fn(() => {
			operationOrder.push('insert');
			return {
				values: () => ({ returning: async () => [{ id: 99 }] })
			};
		}),
		delete: vi.fn(() => {
			operationOrder.push('delete');
			return {
				where: (condition: unknown) => {
					deleteConditions.push(condition);
					return { returning: async () => deleteResults.shift() ?? [] };
				}
			};
		}),
		update: vi.fn(() => {
			operationOrder.push('update');
			return {
				set: (values: Record<string, unknown>) => {
					updateValues.push(values);
					return { where: async () => undefined };
				}
			};
		})
	};

	return {
		operationOrder,
		deleteConditions,
		deleteResults,
		selectConditions,
		selectResults,
		updateValues,
		transaction,
		tx
	};
});

vi.mock('../../..', () => ({
	db: {
		transaction: mocks.transaction
	}
}));

import { actions } from './+page.server';

function bulkEvent(text: string, authenticated = true) {
	const form = new FormData();
	form.set('text', text);

	return {
		request: new Request('http://localhost/admin/availability?/bulk', {
			method: 'POST',
			body: form
		}),
		locals: { user: authenticated ? { username: 'admin' } : null }
	};
}

describe('availability bulk action', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.operationOrder.length = 0;
		mocks.deleteConditions.length = 0;
		mocks.deleteResults.length = 0;
		mocks.selectConditions.length = 0;
		mocks.selectResults.length = 0;
		mocks.updateValues.length = 0;
		mocks.transaction.mockImplementation(async (callback) => callback(mocks.tx));
	});

	it('rejects an unauthenticated POST before accessing the database', async () => {
		await expect(
			actions.bulk(bulkEvent('REMOVE\n14.06.2026 10-18', false) as never)
		).rejects.toMatchObject({
			status: 404
		});
		expect(mocks.transaction).not.toHaveBeenCalled();
	});

	it('executes ADD and REMOVE in the written order', async () => {
		mocks.deleteResults.push([{ id: 1 }]);
		mocks.selectResults.push([
			{ id: 2, startAt: '2026-06-14T07:00:00.000Z', endAt: '2026-06-14T14:00:00.000Z' }
		]);
		const result = await actions.bulk(
			bulkEvent(['ADD', '14.06.2026 10-17', 'REMOVE', '14.06.2026 10-18'].join('\n')) as never
		);

		expect(mocks.operationOrder).toEqual(['delete', 'insert', 'select', 'delete']);
		expect(result).toMatchObject({ added: 1, removed: 1, replaced: 1 });
	});

	it('finds intervals that overlap REMOVE', async () => {
		mocks.selectResults.push([]);
		await actions.bulk(bulkEvent('REMOVE\n14.06.2026 19-21') as never);

		const query = new PgDialect().sqlToQuery(mocks.selectConditions[0] as never);
		expect(query.sql).toContain('"Availability"."start_at" < $1');
		expect(query.sql).toContain('"Availability"."end_at" > $2');
	});

	it('cuts the requested tail from a wider interval', async () => {
		mocks.selectResults.push([
			{ id: 1, startAt: '2026-06-14T15:00:00.000Z', endAt: '2026-06-14T18:00:00.000Z' }
		]);

		const result = await actions.bulk(bulkEvent('REMOVE\n14.06.2026 19-21') as never);

		expect(mocks.operationOrder).toEqual(['select', 'update']);
		expect(mocks.updateValues[0]).toEqual({ endAt: '2026-06-14T16:00:00.000Z' });
		expect(result).toMatchObject({ removed: 1 });
	});

	it('splits an interval when REMOVE cuts out its middle', async () => {
		mocks.selectResults.push([
			{ id: 1, startAt: '2026-06-14T15:00:00.000Z', endAt: '2026-06-14T19:00:00.000Z' }
		]);

		const result = await actions.bulk(bulkEvent('REMOVE\n14.06.2026 19-21') as never);

		expect(mocks.operationOrder).toEqual(['select', 'update', 'insert', 'update']);
		expect(mocks.updateValues).toEqual([
			{ endAt: '2026-06-14T16:00:00.000Z' },
			{ availabilityId: 99 }
		]);
		expect(result).toMatchObject({ removed: 1 });
	});

	it('replaces old overlapping intervals when applying ADD', async () => {
		mocks.deleteResults.push([{ id: 1 }, { id: 2 }]);

		const result = await actions.bulk(bulkEvent('ADD\n14.06.2026 10-18') as never);

		expect(mocks.operationOrder).toEqual(['delete', 'insert']);
		expect(result).toMatchObject({ added: 1, removed: 0, replaced: 2 });
	});

	it('does not start a transaction when any input row is invalid', async () => {
		const result = await actions.bulk(
			bulkEvent(['REMOVE', '14.06.2026 10-18', '31.02.2026 10-18'].join('\n')) as never
		);

		expect(result).toMatchObject({ status: 400 });
		expect(mocks.transaction).not.toHaveBeenCalled();
	});
});

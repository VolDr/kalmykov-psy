import { describe, expect, it } from 'vitest';
import { parseTranslationChanges } from './translation';

const change = {
	key: '1',
	field: 'translation',
	value: 'text',
	expectedVersion: 0,
	operationId: '48a34bb5-a988-4ea7-8b50-4b63b9e7e9ee'
};
const parse = (changes: unknown) => parseTranslationChanges({ changes }, new Set(['1']));

describe('translation protocol validation', () => {
	it('accepts a versioned change', () => {
		expect(parse([change])).toEqual({ ok: true, changes: [change] });
	});
	it.each([undefined, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, '0'])(
		'rejects invalid version %s',
		(expectedVersion) => {
			expect(parse([{ ...change, expectedVersion }]).ok).toBe(false);
		}
	);
	it.each([undefined, '', 'not-an-id'])('rejects invalid operation ID %s', (operationId) => {
		expect(parse([{ ...change, operationId }]).ok).toBe(false);
	});
	it('rejects duplicate fields and duplicate operation IDs', () => {
		expect(parse([change, { ...change, operationId: crypto.randomUUID() }]).ok).toBe(false);
		expect(parse([change, { ...change, field: 'comment' }]).ok).toBe(false);
	});
});

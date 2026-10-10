import { describe, expect, it } from 'vitest';
import { parseAvailabilityBulkText } from './availability-bulk';

describe('parseAvailabilityBulkText', () => {
	it('preserves the order of ADD and REMOVE commands', () => {
		const result = parseAvailabilityBulkText(
			['REMOVE', '14.06 10-18', 'ADD', '14.06 10-17'].join('\n'),
			2026
		);

		expect(result.errors).toEqual([]);
		expect(
			result.commands.map(({ mode, date, startHour, endHour }) => ({
				mode,
				date,
				startHour,
				endHour
			}))
		).toEqual([
			{ mode: 'remove', date: '2026-06-14', startHour: 10, endHour: 18 },
			{ mode: 'add', date: '2026-06-14', startHour: 10, endHour: 17 }
		]);
	});

	it('accepts supported date and whole-hour formats', () => {
		const result = parseAvailabilityBulkText(
			['ADD', '1.2 9-17 18:00–20:00', '2027-03-04 10—12'].join('\n'),
			2026
		);

		expect(result.errors).toEqual([]);
		expect(result.commands).toHaveLength(3);
		expect(result.commands[0]).toMatchObject({ date: '2026-02-01', startHour: 9, endHour: 17 });
		expect(result.commands[2]).toMatchObject({ date: '2027-03-04', startHour: 10, endHour: 12 });
	});

	it.each([
		['ADD\n31.02 10-18', 'некорректная дата'],
		['ADD\n14.06 24-25', 'часы должны быть от 0 до 23'],
		['ADD\n14.06 10:30-18:30', 'некорректный интервал'],
		['ADD\n14.06 18-10', 'начало должно быть раньше конца'],
		['14.06 10-18', 'сначала укажите ADD или REMOVE']
	])('rejects invalid input: %s', (text, expectedError) => {
		const result = parseAvailabilityBulkText(text, 2026);

		expect(result.commands).toEqual([]);
		expect(result.errors[0]).toContain(expectedError);
	});

	it('reports every malformed row instead of silently applying a partial batch', () => {
		const result = parseAvailabilityBulkText(
			['REMOVE', '14.06 10-18', '31.02 10-18', '15.06 wrong'].join('\n'),
			2026
		);

		expect(result.commands).toHaveLength(1);
		expect(result.errors).toHaveLength(2);
		expect(result.errors[0]).toContain('Строка 3');
		expect(result.errors[1]).toContain('Строка 4');
	});
});

export type AvailabilityBulkCommand = {
	mode: 'add' | 'remove';
	date: string;
	startHour: number;
	endHour: number;
	line: number;
};

export type AvailabilityBulkParseResult = {
	commands: AvailabilityBulkCommand[];
	errors: string[];
};

function normalizeDate(value: string, defaultYear: number): string | null {
	let year: number;
	let month: number;
	let day: number;

	const dotMatch = value.replace(/\.$/, '').match(/^(\d{1,2})\.(\d{1,2})(?:\.(\d{4}))?$/);
	if (dotMatch) {
		day = Number(dotMatch[1]);
		month = Number(dotMatch[2]);
		year = dotMatch[3] ? Number(dotMatch[3]) : defaultYear;
	} else {
		const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
		if (!isoMatch) return null;
		year = Number(isoMatch[1]);
		month = Number(isoMatch[2]);
		day = Number(isoMatch[3]);
	}

	const date = new Date(Date.UTC(year, month - 1, day));
	if (
		date.getUTCFullYear() !== year ||
		date.getUTCMonth() !== month - 1 ||
		date.getUTCDate() !== day
	) {
		return null;
	}

	return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function parseAvailabilityBulkText(
	text: string,
	defaultYear: number
): AvailabilityBulkParseResult {
	const commands: AvailabilityBulkCommand[] = [];
	const errors: string[] = [];
	let mode: AvailabilityBulkCommand['mode'] | null = null;

	for (const [index, rawLine] of text.split(/\r?\n/).entries()) {
		const lineNumber = index + 1;
		const line = rawLine.trim();
		if (!line) continue;

		const upper = line.toUpperCase();
		if (upper === 'ADD') {
			mode = 'add';
			continue;
		}
		if (upper === 'REMOVE') {
			mode = 'remove';
			continue;
		}

		if (!mode) {
			errors.push(`Строка ${lineNumber}: сначала укажите ADD или REMOVE`);
			continue;
		}

		const parts = line.split(/\s+/);
		if (parts.length < 2) {
			errors.push(`Строка ${lineNumber}: укажите дату и хотя бы один интервал`);
			continue;
		}

		const date = normalizeDate(parts[0], defaultYear);
		if (!date) {
			errors.push(`Строка ${lineNumber}: некорректная дата «${parts[0]}»`);
			continue;
		}

		for (let i = 1; i < parts.length; i++) {
			// The availability model has one-hour precision, so only :00 is accepted.
			const rangeMatch = parts[i].match(/^(\d{1,2})(?::00)?[-–—](\d{1,2})(?::00)?$/);
			if (!rangeMatch) {
				errors.push(`Строка ${lineNumber}: некорректный интервал «${parts[i]}»`);
				continue;
			}

			const startHour = Number(rangeMatch[1]);
			const endHour = Number(rangeMatch[2]);
			if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23) {
				errors.push(`Строка ${lineNumber}: часы должны быть от 0 до 23`);
				continue;
			}
			if (startHour >= endHour) {
				errors.push(`Строка ${lineNumber}: начало должно быть раньше конца`);
				continue;
			}

			commands.push({ mode, date, startHour, endHour, line: lineNumber });
		}
	}

	return { commands, errors };
}

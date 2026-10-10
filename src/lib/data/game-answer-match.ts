/** Сравнение ответа, введённого игроком, с засчитываемыми написаниями. */

export const MAX_TEXT_ANSWER = 100;

/**
 * Регистр, ё/е, обычная пунктуация и повторные пробелы не важны. Знаки, которые меняют
 * смысл, сохраняются: «C++» не равно «C#», а «-5» не равно «5».
 */
export function normalizeAnswer(raw: string): string {
	return raw
		.normalize('NFC')
		.toLowerCase()
		.replace(/ё/g, 'е')
		.replace(/(^|\s)-(?=\d)/g, '$1') // минус перед числом
		.replace(/[.,;:!?"'«»„“”‘’()[\]{}…—–\-/\_*]/g, ' ')
		.replace(//g, '-')
		.replace(/\s+/g, ' ')
		.trim();
}

function withinOneEdit(a: string, b: string): boolean {
	if (Math.abs(a.length - b.length) > 1) return false;
	let i = 0;
	while (i < a.length && i < b.length && a[i] === b[i]) i++;
	if (i === a.length && i === b.length) return true;
	if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1);
	const [long, short] = a.length > b.length ? [a, b] : [b, a];
	return long.slice(i + 1) === short.slice(i);
}

/**
 * Верно ли введённое. Для длинных словесных ответов (от 6 символов, без цифр) прощается одна опечатка:
 * пропущенная, лишняя или заменённая буква. Короткие сравниваются точно, иначе
 * «Рим» и «Крым» стали бы одним и тем же.
 */
export function isAnswerCorrect(input: string, accepted: string[]): boolean {
	const typed = normalizeAnswer(input);
	if (!typed) return false;
	return accepted.some((answer) => {
		const target = normalizeAnswer(answer);
		if (typed === target) return true;
		// В числах и кодах опечатка меняет значение («1000001» — другое число)
		if (/\d/.test(target)) return false;
		return target.length >= 6 && withinOneEdit(typed, target);
	});
}

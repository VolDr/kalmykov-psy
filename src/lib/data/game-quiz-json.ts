import type { GameQuestion } from '../../db/schema';
import { MAX_TEXT_ANSWER, normalizeAnswer } from './game-answer-match';

/**
 * Разбор вопросов викторины: из JSON-импорта и из формы редактора (сервер проверяет
 * тем же кодом при сохранении). Принимает объект викторины или просто массив вопросов.
 */

export const MAX_QUESTIONS = 50;
export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 6;
export const MAX_ANSWERS = 10;

export interface ImportedMeta {
	title?: string;
	description?: string;
	timeLimit?: number;
	published?: boolean;
}

export type QuizJsonResult =
	| { ok: true; meta: ImportedMeta; questions: GameQuestion[] }
	| { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asText(value: unknown): string {
	return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
}

function parseTextQuestion(raw: Record<string, unknown>, text: string, at: string) {
	// Допускаем и "answers": [...], и одиночное "answer": "..."
	const source = Array.isArray(raw.answers)
		? raw.answers
		: raw.answer !== undefined
			? [raw.answer]
			: [];
	const answers: string[] = [];
	for (const item of source) {
		const value = asText(item);
		if (!value) return `${at}пустой вариант написания ответа`;
		if (value.length > MAX_TEXT_ANSWER) return `${at}ответ длиннее ${MAX_TEXT_ANSWER} символов`;
		if (!normalizeAnswer(value)) return `${at}в ответе «${value}» нет ни букв, ни цифр`;
		answers.push(value);
	}
	if (answers.length === 0) return `${at}для вопроса с вводом нужен хотя бы один ответ ("answers")`;
	if (answers.length > MAX_ANSWERS) return `${at}написаний ответа не больше ${MAX_ANSWERS}`;
	return { type: 'text', text, answers } satisfies GameQuestion;
}

function parseOptions(raw: Record<string, unknown>, at: string): string[] | string {
	if (!Array.isArray(raw.options)) return `${at}нет списка "options"`;
	if (raw.options.length < MIN_OPTIONS || raw.options.length > MAX_OPTIONS) {
		return `${at}вариантов должно быть от ${MIN_OPTIONS} до ${MAX_OPTIONS}`;
	}
	const options: string[] = [];
	for (const option of raw.options) {
		const value = asText(option);
		if (!value) return `${at}пустой вариант ответа`;
		if (value.length > 150) return `${at}вариант длиннее 150 символов`;
		if (options.some((o) => o.toLowerCase() === value.toLowerCase())) {
			return `${at}варианты не должны повторяться («${value}»)`;
		}
		options.push(value);
	}
	return options;
}

const NOT_FOUND = -1;
const AMBIGUOUS = -2;

/**
 * Номер варианта с нуля либо точный текст варианта → индекс, NOT_FOUND или AMBIGUOUS.
 * Неоднозначно число, которое одновременно и номер одного варианта, и текст другого
 * (варианты «1», «2», «3» и correct: 2): молча выбрать не тот вариант хуже, чем спросить.
 */
function optionIndex(value: unknown, options: string[]): number {
	if (typeof value === 'number' && Number.isInteger(value)) {
		if (value < 0 || value >= options.length) return NOT_FOUND;
		const sameText = options.indexOf(String(value));
		return sameText !== -1 && sameText !== value ? AMBIGUOUS : value;
	}
	return typeof value === 'string' ? options.indexOf(value.trim()) : NOT_FOUND;
}

const AMBIGUOUS_HINT =
	'число подходит и как номер варианта, и как текст другого варианта — укажите верный вариант его текстом в кавычках';

function parseChoiceQuestion(raw: Record<string, unknown>, text: string, at: string) {
	const options = parseOptions(raw, at);
	if (typeof options === 'string') return options;

	const correct = optionIndex(raw.correct, options);
	if (correct === AMBIGUOUS) return `${at}${AMBIGUOUS_HINT}`;
	if (correct < 0) {
		return `${at}"correct" должен быть номером варианта с нуля (0–${options.length - 1}) или точным текстом верного варианта`;
	}
	return { text, options, correct } satisfies GameQuestion;
}

function parseMultiQuestion(raw: Record<string, unknown>, text: string, at: string) {
	const options = parseOptions(raw, at);
	if (typeof options === 'string') return options;

	if (!Array.isArray(raw.correct)) {
		return `${at}для вопроса с несколькими ответами "correct" должен быть списком, например [0, 2]`;
	}
	if (raw.correct.length === 0) return `${at}не отмечено ни одного верного варианта`;
	const correct: number[] = [];
	for (const item of raw.correct) {
		const index = optionIndex(item, options);
		if (index === AMBIGUOUS) return `${at}${AMBIGUOUS_HINT}`;
		if (index < 0) {
			return `${at}в "correct" есть значение, которого нет среди вариантов (номера 0–${options.length - 1} или точный текст)`;
		}
		if (correct.includes(index)) return `${at}в "correct" вариант указан дважды`;
		correct.push(index);
	}
	return {
		type: 'multi',
		text,
		options,
		correct: correct.sort((a, b) => a - b)
	} satisfies GameQuestion;
}

export const MAX_IMAGE_URL = 500;
export const MAX_EXPLANATION = 600;

/** Пояснение после ответа: обычный текст, пусто — значит нет. */
export function parseExplanation(value: unknown): string | undefined | { error: string } {
	if (value === undefined || value === null) return undefined;
	if (typeof value !== 'string') return { error: '"explanation" должно быть текстом' };
	const text = value.trim();
	if (!text) return undefined;
	if (text.length > MAX_EXPLANATION) {
		return { error: `пояснение длиннее ${MAX_EXPLANATION} символов` };
	}
	return text;
}

/**
 * Ссылка на картинку: https или путь от корня сайта (файл из static). http не берём:
 * на https-странице браузер всё равно заблокирует его как смешанное содержимое.
 * Пусто — значит картинки нет.
 */
export function parseImageUrl(value: unknown): string | undefined | { error: string } {
	if (value === undefined || value === null) return undefined;
	if (typeof value !== 'string') return { error: '"image" должен быть строкой со ссылкой' };
	const url = value.trim();
	if (!url) return undefined;
	if (url.length > MAX_IMAGE_URL)
		return { error: `ссылка на картинку длиннее ${MAX_IMAGE_URL} символов` };
	if (/\s/.test(url)) return { error: 'в ссылке на картинку не должно быть пробелов' };

	if (url.startsWith('/') && !url.startsWith('//')) return url;
	try {
		if (new URL(url).protocol === 'https:') return url;
	} catch {
		// не ссылка — ниже общая ошибка
	}
	return { error: 'ссылка на картинку должна начинаться с https:// или с «/» (файл на сайте)' };
}

function parseQuestion(raw: unknown, n: number): GameQuestion | string {
	const at = `Вопрос ${n}: `;
	if (!isRecord(raw)) return `${at}ожидается объект`;

	const text = asText(raw.text);
	if (!text) return `${at}нет поля "text" (текст вопроса)`;
	if (text.length > 300) return `${at}текст длиннее 300 символов`;

	const image = parseImageUrl(raw.image);
	if (typeof image === 'object') return `${at}${image.error}`;

	const explanation = parseExplanation(raw.explanation);
	if (typeof explanation === 'object') return `${at}${explanation.error}`;

	const question = parseByType(raw, text, at);
	if (typeof question === 'string') return question;
	return { ...question, ...(image && { image }), ...(explanation && { explanation }) };
}

function parseByType(
	raw: Record<string, unknown>,
	text: string,
	at: string
): GameQuestion | string {
	// Тип можно не указывать: "answers"/"answer" без "options" — ввод ответа,
	// "correct" списком — несколько верных
	const type =
		raw.type ??
		(raw.options === undefined && (raw.answers ?? raw.answer) !== undefined
			? 'text'
			: Array.isArray(raw.correct)
				? 'multi'
				: 'choice');
	if (type === 'text') return parseTextQuestion(raw, text, at);
	if (type === 'multi') return parseMultiQuestion(raw, text, at);
	if (type === 'choice') return parseChoiceQuestion(raw, text, at);
	return `${at}"type" может быть "choice", "multi" или "text"`;
}

export function parseQuestions(
	rawQuestions: unknown[]
): { ok: true; questions: GameQuestion[] } | { ok: false; error: string } {
	if (rawQuestions.length > MAX_QUESTIONS) {
		return { ok: false, error: `Вопросов не больше ${MAX_QUESTIONS}` };
	}
	const questions: GameQuestion[] = [];
	for (let i = 0; i < rawQuestions.length; i++) {
		const parsed = parseQuestion(rawQuestions[i], i + 1);
		if (typeof parsed === 'string') return { ok: false, error: parsed };
		questions.push(parsed);
	}
	return { ok: true, questions };
}

export function parseQuizJson(source: string): QuizJsonResult {
	let data: unknown;
	try {
		data = JSON.parse(source);
	} catch (err) {
		return { ok: false, error: `Некорректный JSON: ${err instanceof Error ? err.message : err}` };
	}

	const meta: ImportedMeta = {};
	let rawQuestions: unknown;

	if (Array.isArray(data)) {
		rawQuestions = data;
	} else if (isRecord(data)) {
		rawQuestions = data.questions;
		if (typeof data.title === 'string') meta.title = data.title.trim();
		if (typeof data.description === 'string') meta.description = data.description.trim();
		if (typeof data.timeLimit === 'number') meta.timeLimit = data.timeLimit;
		if (typeof data.published === 'boolean') meta.published = data.published;
	} else {
		return { ok: false, error: 'Ожидается объект викторины или массив вопросов' };
	}

	if (!Array.isArray(rawQuestions)) return { ok: false, error: 'Нет массива "questions"' };
	if (rawQuestions.length === 0) return { ok: false, error: 'Список вопросов пуст' };

	const parsed = parseQuestions(rawQuestions);
	return parsed.ok ? { ok: true, meta, questions: parsed.questions } : parsed;
}

export function quizToJson(quiz: {
	title: string;
	description: string;
	timeLimit: number;
	published: boolean;
	questions: GameQuestion[];
}): string {
	return JSON.stringify(
		{
			title: quiz.title,
			description: quiz.description,
			timeLimit: Number(quiz.timeLimit),
			published: quiz.published,
			questions: quiz.questions
		},
		null,
		2
	);
}

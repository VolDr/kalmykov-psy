import { describe, expect, it } from 'vitest';
import { parseQuizJson } from './game-quiz-json';

const q = { text: 'Столица Австралии?', options: ['Сидней', 'Канберра'], correct: 1 };

describe('parseQuizJson', () => {
	it('читает объект викторины', () => {
		const res = parseQuizJson(
			JSON.stringify({ title: 'Гео', timeLimit: 30, published: true, questions: [q] })
		);
		expect(res).toEqual({
			ok: true,
			meta: { title: 'Гео', timeLimit: 30, published: true },
			questions: [q]
		});
	});

	it('читает просто массив вопросов', () => {
		const res = parseQuizJson(JSON.stringify([q]));
		expect(res.ok && res.questions).toEqual([q]);
		expect(res.ok && res.meta).toEqual({});
	});

	it('принимает верный ответ текстом и числа в вариантах', () => {
		const res = parseQuizJson(JSON.stringify([{ text: '2+2', options: [3, 4, 5], correct: '4' }]));
		expect(res.ok && res.questions[0]).toEqual({
			text: '2+2',
			options: ['3', '4', '5'],
			correct: 1
		});
	});

	it('называет номер вопроса в ошибке', () => {
		const res = parseQuizJson(JSON.stringify([q, { ...q, correct: 5 }]));
		expect(res.ok).toBe(false);
		expect(!res.ok && res.error).toContain('Вопрос 2');
	});

	it('отвергает мусор', () => {
		expect(parseQuizJson('{oops').ok).toBe(false);
		expect(parseQuizJson('42').ok).toBe(false);
		expect(parseQuizJson('{"questions": []}').ok).toBe(false);
		expect(parseQuizJson(JSON.stringify([{ text: 'x', options: ['a'], correct: 0 }])).ok).toBe(
			false
		);
	});

	it('читает вопросы с прямым вводом', () => {
		const res = parseQuizJson(
			JSON.stringify([
				{ type: 'text', text: 'Столица Австралии?', answers: ['Канберра', 'Canberra'] },
				{ text: 'Сколько будет 2+2?', answer: 4 }
			])
		);
		expect(res.ok && res.questions).toEqual([
			{ type: 'text', text: 'Столица Австралии?', answers: ['Канберра', 'Canberra'] },
			{ type: 'text', text: 'Сколько будет 2+2?', answers: ['4'] }
		]);
	});

	it('отвергает вопрос с вводом без ответов', () => {
		const res = parseQuizJson(JSON.stringify([{ type: 'text', text: 'Вопрос?', answers: [] }]));
		expect(!res.ok && res.error).toContain('Вопрос 1');
		expect(
			parseQuizJson(JSON.stringify([{ type: 'x', text: 'Q', options: ['a', 'b'], correct: 0 }])).ok
		).toBe(false);
	});

	it('читает вопросы с несколькими верными ответами', () => {
		const res = parseQuizJson(
			JSON.stringify([
				{ type: 'multi', text: 'Q', options: ['a', 'b', 'c'], correct: [2, 0] },
				// тип можно не указывать: correct списком
				{ text: 'Q2', options: ['x', 'y', 'z'], correct: ['y', 'z'] }
			])
		);
		expect(res.ok && res.questions).toEqual([
			{ type: 'multi', text: 'Q', options: ['a', 'b', 'c'], correct: [0, 2] },
			{ type: 'multi', text: 'Q2', options: ['x', 'y', 'z'], correct: [1, 2] }
		]);
	});

	it('отвергает некорректные списки верных ответов', () => {
		const bad = (correct: unknown) =>
			parseQuizJson(
				JSON.stringify([{ type: 'multi', text: 'Q', options: ['a', 'b', 'c'], correct }])
			);
		expect(bad([]).ok).toBe(false);
		expect(bad(1).ok).toBe(false);
		expect(bad([0, 5]).ok).toBe(false);
		expect(bad(['нет такого']).ok).toBe(false);
		expect(bad([1, 1]).ok).toBe(false);
	});

	it('не даёт молча выбрать не тот вариант, когда число — и номер, и текст другого', () => {
		const q = (correct: unknown, type?: string) =>
			parseQuizJson(
				JSON.stringify([
					{ ...(type ? { type } : {}), text: 'Q', options: ['1', '2', '3'], correct }
				])
			);
		expect(q(2).ok).toBe(false); // номер 2 — это «3», а «2» — другой вариант
		expect(q('2').ok && q('2')).toMatchObject({ questions: [{ correct: 1 }] }); // текст — однозначно
		expect(q([2, 0], 'multi').ok).toBe(false);
		const fine = parseQuizJson(
			JSON.stringify([{ text: 'Q', options: ['a', 'b', 'c'], correct: 2 }])
		);
		expect(fine.ok && fine.questions[0]).toMatchObject({ correct: 2 });
	});

	it('отвергает повторяющиеся варианты и говорит понятно про пустой список верных', () => {
		const dup = parseQuizJson(JSON.stringify([{ text: 'Q', options: ['Да', 'да'], correct: 0 }]));
		expect(!dup.ok && dup.error).toContain('повторяться');
		const empty = parseQuizJson(
			JSON.stringify([{ type: 'multi', text: 'Q', options: ['a', 'b'], correct: [] }])
		);
		expect(!empty.ok && empty.error).toContain('не отмечено ни одного верного варианта');
		const notList = parseQuizJson(
			JSON.stringify([{ type: 'multi', text: 'Q', options: ['a', 'b'], correct: 1 }])
		);
		expect(!notList.ok && notList.error).toContain('списком');
	});

	it('читает необязательную картинку у вопросов любого типа', () => {
		const res = parseQuizJson(
			JSON.stringify([
				{ text: 'A', options: ['x', 'y'], correct: 0, image: '  https://example.com/a.jpg ' },
				{ type: 'multi', text: 'B', options: ['x', 'y'], correct: [0], image: '/lmc/1.webp' },
				{ type: 'text', text: 'C', answers: ['x'], image: 'https://example.com/c.png?v=2' },
				{ text: 'D', options: ['x', 'y'], correct: 0, image: '   ' },
				{ text: 'E', options: ['x', 'y'], correct: 0 }
			])
		);
		const questions = res.ok ? res.questions : [];
		expect(questions.map((q) => q.image)).toEqual([
			'https://example.com/a.jpg',
			'/lmc/1.webp',
			'https://example.com/c.png?v=2',
			undefined,
			undefined
		]);
		// пустая ссылка не оставляет в данных лишнего поля
		expect('image' in questions[3]).toBe(false);
	});

	it('отвергает небезопасные и некорректные ссылки на картинку', () => {
		const bad = (image: unknown) =>
			parseQuizJson(JSON.stringify([{ text: 'Q', options: ['x', 'y'], correct: 0, image }]));
		for (const image of [
			'http://example.com/a.jpg',
			'javascript:alert(1)',
			'data:image/png;base64,AAAA',
			'//example.com/a.jpg',
			'example.com/a.jpg',
			'https://exa mple.com/a b.jpg',
			'https://' + 'a'.repeat(600) + '.com/x.jpg',
			42
		]) {
			const res = bad(image);
			expect(res.ok, String(image)).toBe(false);
			expect(!res.ok && res.error).toContain('Вопрос 1');
		}
	});

	it('читает необязательное пояснение и убирает пустое', () => {
		const res = parseQuizJson(
			JSON.stringify([
				{ text: 'A', options: ['x', 'y'], correct: 0, explanation: '  Потому что так.  ' },
				{ type: 'text', text: 'B', answers: ['x'], explanation: '   ' },
				{
					type: 'multi',
					text: 'C',
					options: ['x', 'y'],
					correct: [0],
					explanation: 'Строка 1\nСтрока 2'
				}
			])
		);
		const questions = res.ok ? res.questions : [];
		expect(questions[0].explanation).toBe('Потому что так.');
		expect('explanation' in questions[1]).toBe(false);
		expect(questions[2].explanation).toBe('Строка 1\nСтрока 2');
	});

	it('отвергает слишком длинное и не текстовое пояснение', () => {
		const bad = (explanation: unknown) =>
			parseQuizJson(JSON.stringify([{ text: 'Q', options: ['x', 'y'], correct: 0, explanation }]));
		const long = bad('я'.repeat(601));
		expect(long.ok).toBe(false);
		expect(!long.ok && long.error).toContain('Вопрос 1');
		expect(bad(42).ok).toBe(false);
		expect(bad('я'.repeat(600)).ok).toBe(true);
	});
});

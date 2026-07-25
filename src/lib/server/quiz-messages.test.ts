import { describe, expect, it } from 'vitest';
import {
	buildQuizResultBlocks,
	packMessages,
	type QuizMessageSettings,
	type QuizResultForMessages
} from './quiz-messages';

const settings: QuizMessageSettings = {
	resultsHeaderText: 'Ваши результаты:',
	resultsFooterText: 'Записаться: https://example.com',
	allGreenText: 'Всё в зелёной зоне.',
	sphereRecs: {
		exhaustion: { orange: 'Истощение: оранжевый текст', red: 'Истощение: красный текст' },
		distancing: { red: 'Дистанцирование: красный текст' }
	}
};

function makeResult(
	subscales: QuizResultForMessages['subscales'],
	color = 'orange'
): QuizResultForMessages {
	return { averageScore: 3.1, severity: 'Есть риск выгорания', color, subscales };
}

describe('buildQuizResultBlocks', () => {
	it('собирает сводку с общим баллом и всеми сферами', () => {
		const result = makeResult([
			{ id: 'exhaustion', name: 'Истощение', averageScore: 3.5, severity: 'Выгорание', color: 'red' },
			{ id: 'distancing', name: 'Дистанцирование', averageScore: 1.5, severity: 'Нет риска', color: 'green' }
		]);
		const [summary] = buildQuizResultBlocks(result, settings);

		expect(summary).toContain('Ваши результаты:');
		expect(summary).toContain('**Общий показатель: 3,10 из 5 — Есть риск выгорания**');
		expect(summary).toContain('🔴 Истощение: 3,50 из 5 — выгорание');
		expect(summary).toContain('🟢 Дистанцирование: 1,50 из 5 — нет риска');
	});

	it('красные сферы идут раньше оранжевых, внутри зоны — по убыванию балла', () => {
		const result = makeResult([
			{ id: 'exhaustion', name: 'Истощение', averageScore: 3.2, severity: 'Риск', color: 'orange' },
			{ id: 'distancing', name: 'Дистанцирование', averageScore: 3.4, severity: 'Выгорание', color: 'red' }
		]);
		const blocks = buildQuizResultBlocks(result, settings);

		// [сводка, красная сфера, оранжевая сфера, футер]
		expect(blocks[1]).toBe('Дистанцирование: красный текст');
		expect(blocks[2]).toBe('Истощение: оранжевый текст');
		expect(blocks[3]).toBe(settings.resultsFooterText);
	});

	it('для оранжевой зоны без своего текста берётся красный', () => {
		const result = makeResult([
			{ id: 'distancing', name: 'Дистанцирование', averageScore: 2.6, severity: 'Риск', color: 'orange' }
		]);
		const blocks = buildQuizResultBlocks(result, settings);
		expect(blocks[1]).toBe('Дистанцирование: красный текст');
	});

	it('сфера без текстов рекомендаций пропускается, а не роняет сборку', () => {
		const result = makeResult([
			{ id: 'cognitive', name: 'Когнитивные', averageScore: 3.3, severity: 'Выгорание', color: 'red' }
		]);
		const blocks = buildQuizResultBlocks(result, settings);
		expect(blocks).toEqual([expect.stringContaining('Общий показатель'), settings.resultsFooterText]);
	});

	it('все сферы зелёные — текст про зелёную зону', () => {
		const result = makeResult(
			[{ id: 'exhaustion', name: 'Истощение', averageScore: 1.2, severity: 'Нет риска', color: 'green' }],
			'green'
		);
		const blocks = buildQuizResultBlocks(result, settings);
		expect(blocks[1]).toBe('Всё в зелёной зоне.');
	});
});

describe('packMessages', () => {
	const byLength = (text: string) => text.length;

	it('склеивает блоки, пока влезают в лимит', () => {
		expect(packMessages(['aaa', 'bbb', 'ccc'], 100, byLength)).toEqual(['aaa\n\nbbb\n\nccc']);
	});

	it('начинает новое сообщение, когда следующий блок не влезает', () => {
		// 'aaa\n\nbbb' = 8 символов > 7 — второй блок уходит в новое сообщение
		expect(packMessages(['aaa', 'bbb', 'cc'], 7, byLength)).toEqual(['aaa', 'bbb\n\ncc']);
	});

	it('блок длиннее лимита остаётся отдельным сообщением', () => {
		expect(packMessages(['x'.repeat(10), 'y'], 5, byLength)).toEqual(['x'.repeat(10), 'y']);
	});

	it('пустой список — пустой результат', () => {
		expect(packMessages([], 100, byLength)).toEqual([]);
	});
});

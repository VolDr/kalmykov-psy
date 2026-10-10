import { describe, expect, it } from 'vitest';
import {
	buildQuizResultBlocks,
	packMessages,
	type QuizMessageSettings,
	type QuizResultForMessages
} from './quiz-messages';

const settings: QuizMessageSettings = {
	resultsHeaderText: 'Ваши результаты:',
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
	const exhaustionRed = {
		id: 'exhaustion',
		name: 'Истощение',
		averageScore: 3.5,
		severity: 'Выгорание',
		color: 'red'
	};
	const distancingRed = {
		id: 'distancing',
		name: 'Дистанцирование',
		averageScore: 3.4,
		severity: 'Выгорание',
		color: 'red'
	};
	const exhaustionOrange = {
		id: 'exhaustion',
		name: 'Истощение',
		averageScore: 3.2,
		severity: 'Риск выгорания',
		color: 'orange'
	};

	it('первое сообщение — вступление и общий показатель, без списка сфер', () => {
		const [summary] = buildQuizResultBlocks(makeResult([exhaustionRed]), settings);

		expect(summary).toBe(
			'Ваши результаты:\n\n🟠 **Общий показатель: 3,10 из 5 — Есть риск выгорания**'
		);
	});

	it('перед рекомендацией сферы — строка с её баллом и зоной', () => {
		const blocks = buildQuizResultBlocks(makeResult([exhaustionRed]), settings);

		expect(blocks[1]).toBe('🔴 **Истощение: 3,50 из 5 — выгорание**\n\nИстощение: красный текст');
	});

	it('красные сферы идут раньше оранжевых, внутри зоны — по убыванию балла', () => {
		const blocks = buildQuizResultBlocks(makeResult([exhaustionOrange, distancingRed]), settings);

		expect(blocks.slice(1)).toEqual([
			'🔴 **Дистанцирование: 3,40 из 5 — выгорание**\n\nДистанцирование: красный текст',
			'🟠 **Истощение: 3,20 из 5 — риск выгорания**\n\nИстощение: оранжевый текст'
		]);
	});

	it('для оранжевой зоны без своего текста берётся красный', () => {
		const blocks = buildQuizResultBlocks(
			makeResult([{ ...distancingRed, averageScore: 2.6, severity: 'Риск', color: 'orange' }]),
			settings
		);
		expect(blocks[1]).toBe(
			'🟠 **Дистанцирование: 2,60 из 5 — риск**\n\nДистанцирование: красный текст'
		);
	});

	it('сфера без текста рекомендации — только строка с баллом, но не пропадает', () => {
		const blocks = buildQuizResultBlocks(
			makeResult([
				{
					id: 'cognitive',
					name: 'Когнитивные',
					averageScore: 3.3,
					severity: 'Выгорание',
					color: 'red'
				}
			]),
			settings
		);
		expect(blocks.slice(1)).toEqual(['🔴 **Когнитивные: 3,30 из 5 — выгорание**']);
	});

	const withGreen: QuizMessageSettings = {
		...settings,
		sphereRecs: {
			exhaustion: { green: 'Истощение: зелёный текст', red: 'Истощение: красный текст' },
			distancing: { green: 'Дистанцирование: зелёный текст', red: 'Дистанцирование: красный текст' }
		}
	};

	it('зелёные сферы идут после проблемных, со своим текстом', () => {
		const blocks = buildQuizResultBlocks(
			makeResult([
				{ ...exhaustionRed, averageScore: 1.4, severity: 'Нет риска', color: 'green' },
				distancingRed
			]),
			withGreen
		);

		expect(blocks.slice(1)).toEqual([
			'🔴 **Дистанцирование: 3,40 из 5 — выгорание**\n\nДистанцирование: красный текст',
			'🟢 **Истощение: 1,40 из 5 — нет риска**\n\nИстощение: зелёный текст'
		]);
	});

	it('зелёная сфера без своего текста — только строка с баллом', () => {
		const blocks = buildQuizResultBlocks(
			makeResult([
				{
					id: 'cognitive',
					name: 'Когнитивные',
					averageScore: 1.1,
					severity: 'Нет риска',
					color: 'green'
				}
			]),
			withGreen
		);
		expect(blocks.slice(1)).toEqual(['🟢 **Когнитивные: 1,10 из 5 — нет риска**']);
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

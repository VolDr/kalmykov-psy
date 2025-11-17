import { describe, it, expect } from 'vitest';
import { formatResultsForClipboard } from './formatResults';
import type { SurveyConfig, Warning } from '$lib/data/surveys/types';
import type { ScoringResult } from './scoringEngine';

describe('formatResultsForClipboard', () => {
	const mockConfig: SurveyConfig = {
		id: 'test-survey',
		title: 'Test Survey',
		description: 'A test survey',
		infoSections: {},
		questions: [],
		scoring: {
			method: 'sum',
			maxScore: 30,
			interpretation: []
		}
	};

	const mockScoringResult: ScoringResult = {
		totalScore: 15,
		interpretation: {
			min: 10,
			max: 20,
			severity: 'Medium',
			recommendation: 'Moderate concern, consider consulting a professional',
			color: 'yellow'
		}
	};

	it('should format basic results for clipboard with sum method', () => {
		const result = formatResultsForClipboard(
			mockConfig,
			mockScoringResult,
			[],
			'https://example.com'
		);

		expect(result).toContain('Test Survey');
		expect(result).toContain('Общий балл: 15 / 30');
		expect(result).toContain('Уровень: Medium');
		expect(result).toContain('Moderate concern, consider consulting a professional');
		expect(result).toContain('https://example.com/surveys/test-survey');
	});

	it('should format results with average score', () => {
		const resultWithAverage: ScoringResult = {
			...mockScoringResult,
			averageScore: 3.75
		};

		const result = formatResultsForClipboard(
			mockConfig,
			resultWithAverage,
			[],
			'https://example.com'
		);

		expect(result).toContain('Общий балл: 3.75 / 5.00');
	});

	it('should include subscale results when present', () => {
		const resultWithSubscales: ScoringResult = {
			...mockScoringResult,
			subscales: [
				{
					id: 'anxiety',
					name: 'Anxiety',
					score: 10,
					averageScore: 2.5,
					interpretation: {
						min: 2,
						max: 3,
						severity: 'Moderate',
						color: 'yellow'
					}
				},
				{
					id: 'depression',
					name: 'Depression',
					score: 8,
					averageScore: 2.0,
					interpretation: {
						min: 1,
						max: 2.5,
						severity: 'Low',
						color: 'green'
					}
				}
			]
		};

		const result = formatResultsForClipboard(
			mockConfig,
			resultWithSubscales,
			[],
			'https://example.com'
		);

		expect(result).toContain('Результаты по шкалам:');
		expect(result).toContain('Anxiety: 2.50 / 5.00 — Moderate');
		expect(result).toContain('Depression: 2.00 / 5.00 — Low');
	});

	it('should include warnings when present', () => {
		const warnings: Warning[] = [
			{
				condition: () => true,
				type: 'critical',
				title: 'Important Warning',
				message: 'This is a critical warning message'
			},
			{
				condition: () => true,
				type: 'warning',
				title: 'Another Warning',
				message: 'This is another warning'
			}
		];

		const result = formatResultsForClipboard(
			mockConfig,
			mockScoringResult,
			warnings,
			'https://example.com'
		);

		expect(result).toContain('Важные предупреждения:');
		expect(result).toContain('Important Warning');
		expect(result).toContain('This is a critical warning message');
		expect(result).toContain('Another Warning');
		expect(result).toContain('This is another warning');
	});

	it('should not include warnings section when no warnings', () => {
		const result = formatResultsForClipboard(
			mockConfig,
			mockScoringResult,
			[],
			'https://example.com'
		);

		expect(result).not.toContain('Важные предупреждения:');
	});

	it('should strip markdown links from recommendations', () => {
		const resultWithLinks: ScoringResult = {
			...mockScoringResult,
			interpretation: {
				...mockScoringResult.interpretation,
				recommendation:
					'Please visit [our website](https://example.com) for more [information](https://info.com)'
			}
		};

		const result = formatResultsForClipboard(
			mockConfig,
			resultWithLinks,
			[],
			'https://example.com'
		);

		expect(result).toContain('Please visit our website for more information');
		expect(result).not.toContain('[our website]');
		expect(result).not.toContain('(https://example.com)');
	});

	it('should handle complex markdown in recommendations', () => {
		const resultWithComplexMarkdown: ScoringResult = {
			...mockScoringResult,
			interpretation: {
				...mockScoringResult.interpretation,
				recommendation: 'Check [link1](url1) and [link2](url2) then read [another](url3) guide'
			}
		};

		const result = formatResultsForClipboard(
			mockConfig,
			resultWithComplexMarkdown,
			[],
			'https://example.com'
		);

		expect(result).toContain('Check link1 and link2 then read another guide');
	});

	it('should correctly format the survey URL', () => {
		const result = formatResultsForClipboard(
			{ ...mockConfig, id: 'phq-9' },
			mockScoringResult,
			[],
			'https://kalmykov-psy.ru'
		);

		expect(result).toContain('Пройти тест: https://kalmykov-psy.ru/surveys/phq-9');
	});

	it('should handle empty subscales array', () => {
		const resultWithEmptySubscales: ScoringResult = {
			...mockScoringResult,
			subscales: []
		};

		const result = formatResultsForClipboard(
			mockConfig,
			resultWithEmptySubscales,
			[],
			'https://example.com'
		);

		expect(result).toContain('Результаты по шкалам:');
		// Should not crash, just show empty subscales section
	});

	it('should trim the final result', () => {
		const result = formatResultsForClipboard(
			mockConfig,
			mockScoringResult,
			[],
			'https://example.com'
		);

		// Should not have leading/trailing whitespace
		expect(result).toBe(result.trim());
	});
});

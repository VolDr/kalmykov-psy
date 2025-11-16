import { describe, it, expect } from 'vitest';
import {
	calculateScore,
	validateAnswers,
	evaluateWarnings,
	shouldDisplayQuestion
} from './scoringEngine';
import type { SurveyConfig } from '$lib/data/surveys/types';

// Mock survey config for testing
const mockConfig: SurveyConfig = {
	id: 'test-survey',
	title: 'Test Survey',
	description: 'A test survey',
	instructions: 'Answer all questions',
	scoring: {
		method: 'sum',
		interpretation: [
			{ min: 0, max: 10, severity: 'Low', recommendation: 'Good', color: 'green' },
			{ min: 11, max: 20, severity: 'Medium', recommendation: 'Moderate', color: 'yellow' },
			{ min: 21, max: 30, severity: 'High', recommendation: 'Seek help', color: 'red' }
		]
	},
	questions: [
		{
			id: 'q1',
			text: 'Question 1',
			type: 'radio',
			required: true,
			options: [
				{ value: 0, label: 'None', points: 0 },
				{ value: 1, label: 'Some', points: 5 },
				{ value: 2, label: 'A lot', points: 10 }
			]
		},
		{
			id: 'q2',
			text: 'Question 2',
			type: 'radio',
			required: true,
			options: [
				{ value: 0, label: 'Never', points: 0 },
				{ value: 1, label: 'Sometimes', points: 5 },
				{ value: 2, label: 'Always', points: 10 }
			]
		},
		{
			id: 'q3',
			text: 'Question 3',
			type: 'radio',
			required: false,
			options: [
				{ value: 0, label: 'No' },
				{ value: 1, label: 'Yes' }
			]
		}
	]
};

describe('calculateScore', () => {
	it('should calculate total score correctly', () => {
		const answers = { q1: 1, q2: 2, q3: 1 };
		const result = calculateScore(answers, mockConfig);

		expect(result.totalScore).toBe(16); // 5 + 10 + 1
		expect(result.interpretation.severity).toBe('Medium');
	});

	it('should handle low score interpretation', () => {
		const answers = { q1: 0, q2: 0, q3: 0 };
		const result = calculateScore(answers, mockConfig);

		expect(result.totalScore).toBe(0);
		expect(result.interpretation.severity).toBe('Low');
		expect(result.interpretation.color).toBe('green');
	});

	it('should handle high score interpretation', () => {
		const answers = { q1: 2, q2: 2, q3: 1 };
		const result = calculateScore(answers, mockConfig);

		expect(result.totalScore).toBe(21); // 10 + 10 + 1
		expect(result.interpretation.severity).toBe('High');
		expect(result.interpretation.color).toBe('red');
	});

	it('should skip subheading questions', () => {
		const configWithSubheading: SurveyConfig = {
			...mockConfig,
			questions: [
				...mockConfig.questions,
				{
					id: 'subhead',
					text: 'Section Header',
					type: 'subheading',
					required: false
				}
			]
		};
		const answers = { q1: 0, q2: 0, q3: 0 };
		const result = calculateScore(answers, configWithSubheading);

		expect(result.totalScore).toBe(0);
	});

	it('should exclude questions marked in excludeFromScore', () => {
		const configWithExclusion: SurveyConfig = {
			...mockConfig,
			scoring: {
				...mockConfig.scoring,
				excludeFromScore: ['q3']
			}
		};
		const answers = { q1: 1, q2: 0, q3: 1 };
		const result = calculateScore(answers, configWithExclusion);

		expect(result.totalScore).toBe(5); // Only q1 counted
	});

	it('should skip questions with countInScore=false', () => {
		const configWithSkip: SurveyConfig = {
			...mockConfig,
			questions: mockConfig.questions.map((q) =>
				q.id === 'q3' ? { ...q, countInScore: false } : q
			)
		};
		const answers = { q1: 1, q2: 1, q3: 1 };
		const result = calculateScore(answers, configWithSkip);

		expect(result.totalScore).toBe(10); // 5 + 5, q3 skipped
	});

	it('should calculate average score when method is average', () => {
		const avgConfig: SurveyConfig = {
			...mockConfig,
			scoring: {
				...mockConfig.scoring,
				method: 'average',
				interpretation: [
					{ min: 0, max: 3, severity: 'Low', recommendation: 'Good', color: 'green' },
					{ min: 3.01, max: 6, severity: 'Medium', recommendation: 'Moderate', color: 'yellow' },
					{ min: 6.01, max: 10, severity: 'High', recommendation: 'Seek help', color: 'red' }
				]
			}
		};
		const answers = { q1: 1, q2: 2 }; // 5 + 10 = 15, avg = 7.5
		const result = calculateScore(answers, avgConfig);

		expect(result.averageScore).toBe(7.5);
		expect(result.interpretation.severity).toBe('High');
	});

	it('should handle missing answers gracefully', () => {
		const answers = { q1: 1 };
		const result = calculateScore(answers, mockConfig);

		expect(result.totalScore).toBe(5);
		expect(result.interpretation.severity).toBe('Low');
	});
});

describe('validateAnswers', () => {
	it('should return valid when all required questions answered', () => {
		const answers = { q1: 0, q2: 1 };
		const result = validateAnswers(answers, mockConfig);

		expect(result.isValid).toBe(true);
		expect(result.missingQuestions).toEqual([]);
	});

	it('should return invalid when required questions missing', () => {
		const answers = { q1: 0 };
		const result = validateAnswers(answers, mockConfig);

		expect(result.isValid).toBe(false);
		expect(result.missingQuestions).toContain('q2');
	});

	it('should not require optional questions', () => {
		const answers = { q1: 0, q2: 1 }; // q3 is optional
		const result = validateAnswers(answers, mockConfig);

		expect(result.isValid).toBe(true);
	});

	it('should skip subheading questions in validation', () => {
		const configWithSubheading: SurveyConfig = {
			...mockConfig,
			questions: [
				...mockConfig.questions,
				{
					id: 'subhead',
					text: 'Section',
					type: 'subheading',
					required: true // Should be ignored
				}
			]
		};
		const answers = { q1: 0, q2: 1 };
		const result = validateAnswers(answers, configWithSubheading);

		expect(result.isValid).toBe(true);
	});
});

describe('evaluateWarnings', () => {
	it('should return empty array when no warnings configured', () => {
		const answers = { q1: 2 };
		const result = evaluateWarnings(answers, mockConfig);

		expect(result).toEqual([]);
	});

	it('should return triggered warnings', () => {
		const configWithWarnings: SurveyConfig = {
			...mockConfig,
			warnings: [
				{
					id: 'high-risk',
					message: 'High risk detected',
					severity: 'critical',
					condition: (ans) => ans['q1'] === 2
				}
			]
		};
		const answers = { q1: 2 };
		const result = evaluateWarnings(answers, configWithWarnings);

		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('high-risk');
	});

	it('should not return non-triggered warnings', () => {
		const configWithWarnings: SurveyConfig = {
			...mockConfig,
			warnings: [
				{
					id: 'high-risk',
					message: 'High risk detected',
					severity: 'critical',
					condition: (ans) => ans['q1'] === 2
				}
			]
		};
		const answers = { q1: 0 };
		const result = evaluateWarnings(answers, configWithWarnings);

		expect(result).toHaveLength(0);
	});
});

describe('shouldDisplayQuestion', () => {
	it('should return true when no conditional display', () => {
		const question = { id: 'q1', text: 'Test', type: 'radio' as const };
		const result = shouldDisplayQuestion(question, {});

		expect(result).toBe(true);
	});

	it('should return true when condition is met', () => {
		const question = {
			id: 'q2',
			conditionalDisplay: {
				condition: (ans: Record<string, number>) => ans['q1'] === 1
			}
		};
		const answers = { q1: 1 };
		const result = shouldDisplayQuestion(question, answers);

		expect(result).toBe(true);
	});

	it('should return false when condition is not met', () => {
		const question = {
			id: 'q2',
			conditionalDisplay: {
				condition: (ans: Record<string, number>) => ans['q1'] === 1
			}
		};
		const answers = { q1: 0 };
		const result = shouldDisplayQuestion(question, answers);

		expect(result).toBe(false);
	});
});

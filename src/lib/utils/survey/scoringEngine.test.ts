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

	it('should use answer value directly for non-radio questions', () => {
		const configWithTextarea: SurveyConfig = {
			...mockConfig,
			questions: [
				{
					id: 'q1',
					text: 'Rate your experience',
					type: 'textarea' as const,
					required: true
				}
			]
		};
		const answers = { q1: 8 };
		const result = calculateScore(answers, configWithTextarea);

		expect(result.totalScore).toBe(8);
	});

	it('should calculate subscales correctly', () => {
		const configWithSubscales: SurveyConfig = {
			...mockConfig,
			scoring: {
				...mockConfig.scoring,
				subscales: [
					{
						id: 'subscale1',
						name: 'Subscale 1',
						description: 'Test subscale',
						questionIds: ['q1', 'q2'],
						interpretation: [
							{ min: 0, max: 3, severity: 'Low', color: 'green' },
							{ min: 3.01, max: 7, severity: 'Medium', color: 'yellow' },
							{ min: 7.01, max: 10, severity: 'High', color: 'red' }
						]
					}
				]
			}
		};
		const answers = { q1: 1, q2: 2 }; // 5 + 10 = 15, avg = 7.5
		const result = calculateScore(answers, configWithSubscales);

		expect(result.subscales).toBeDefined();
		expect(result.subscales).toHaveLength(1);
		expect(result.subscales![0].id).toBe('subscale1');
		expect(result.subscales![0].name).toBe('Subscale 1');
		expect(result.subscales![0].score).toBe(15);
		expect(result.subscales![0].averageScore).toBe(7.5);
		expect(result.subscales![0].interpretation.severity).toBe('High');
	});

	it('should use alternative interpretation for subscales when condition is met', () => {
		const configWithAlternative: SurveyConfig = {
			...mockConfig,
			scoring: {
				...mockConfig.scoring,
				subscales: [
					{
						id: 'subscale1',
						name: 'Subscale 1',
						questionIds: ['q1'],
						interpretation: [
							{ min: 0, max: 5, severity: 'Normal', color: 'green' },
							{ min: 5.01, max: 10, severity: 'Elevated', color: 'yellow' }
						],
						alternativeInterpretation: [
							{ min: 0, max: 5, severity: 'Alternative Low', color: 'green' },
							{ min: 5.01, max: 10, severity: 'Alternative High', color: 'red' }
						],
						interpretationCondition: (ans) => ans['q3'] === 1
					}
				]
			}
		};
		const answers = { q1: 2, q3: 1 }; // q3 = 1 triggers alternative
		const result = calculateScore(answers, configWithAlternative);

		expect(result.subscales![0].interpretation.severity).toBe('Alternative High');
	});

	it('should use normal interpretation when condition is not met', () => {
		const configWithAlternative: SurveyConfig = {
			...mockConfig,
			scoring: {
				...mockConfig.scoring,
				subscales: [
					{
						id: 'subscale1',
						name: 'Subscale 1',
						questionIds: ['q1'],
						interpretation: [
							{ min: 0, max: 5, severity: 'Normal', color: 'green' },
							{ min: 5.01, max: 10, severity: 'Elevated', color: 'yellow' }
						],
						alternativeInterpretation: [
							{ min: 0, max: 5, severity: 'Alternative Low', color: 'green' },
							{ min: 5.01, max: 10, severity: 'Alternative High', color: 'red' }
						],
						interpretationCondition: (ans) => ans['q3'] === 1
					}
				]
			}
		};
		const answers = { q1: 2, q3: 0 }; // q3 = 0, use normal interpretation
		const result = calculateScore(answers, configWithAlternative);

		expect(result.subscales![0].interpretation.severity).toBe('Elevated');
	});

	it('should handle subscales with non-radio questions', () => {
		const configWithSubscales: SurveyConfig = {
			...mockConfig,
			questions: [
				{
					id: 'q1',
					text: 'Question 1',
					type: 'textarea' as const,
					required: true
				}
			],
			scoring: {
				...mockConfig.scoring,
				subscales: [
					{
						id: 'subscale1',
						name: 'Subscale 1',
						questionIds: ['q1'],
						interpretation: [{ min: 0, max: 10, severity: 'Any', color: 'green' }]
					}
				]
			}
		};
		const answers = { q1: 7 };
		const result = calculateScore(answers, configWithSubscales);

		expect(result.subscales![0].score).toBe(7);
		expect(result.subscales![0].averageScore).toBe(7);
	});

	it('should handle subscales with radio questions using points', () => {
		const configWithSubscales: SurveyConfig = {
			...mockConfig,
			scoring: {
				...mockConfig.scoring,
				subscales: [
					{
						id: 'subscale1',
						name: 'Subscale 1',
						questionIds: ['q1'],
						interpretation: [{ min: 0, max: 10, severity: 'Any', color: 'green' }]
					}
				]
			}
		};
		const answers = { q1: 1 }; // Points = 5
		const result = calculateScore(answers, configWithSubscales);

		expect(result.subscales![0].score).toBe(5);
	});

	it('should handle subscales with radio questions without points (fallback to value)', () => {
		const configWithSubscales: SurveyConfig = {
			...mockConfig,
			scoring: {
				...mockConfig.scoring,
				subscales: [
					{
						id: 'subscale1',
						name: 'Subscale 1',
						questionIds: ['q3'],
						interpretation: [{ min: 0, max: 10, severity: 'Any', color: 'green' }]
					}
				]
			}
		};
		const answers = { q3: 1 }; // q3 has no points defined
		const result = calculateScore(answers, configWithSubscales);

		expect(result.subscales![0].score).toBe(1);
	});

	it('should handle empty subscale questionIds', () => {
		const configWithEmptySubscale: SurveyConfig = {
			...mockConfig,
			scoring: {
				...mockConfig.scoring,
				subscales: [
					{
						id: 'subscale1',
						name: 'Empty Subscale',
						questionIds: [],
						interpretation: [{ min: 0, max: 0, severity: 'None', color: 'green' }]
					}
				]
			}
		};
		const answers = { q1: 1 };
		const result = calculateScore(answers, configWithEmptySubscale);

		expect(result.subscales![0].score).toBe(0);
		expect(result.subscales![0].averageScore).toBe(0);
	});

	it('should fall back to last interpretation when no match found', () => {
		const configWithGap: SurveyConfig = {
			...mockConfig,
			scoring: {
				...mockConfig.scoring,
				interpretation: [
					{ min: 0, max: 5, severity: 'Low', recommendation: 'Good', color: 'green' },
					// Gap between 5 and 15
					{ min: 15, max: 30, severity: 'High', recommendation: 'Seek help', color: 'red' }
				]
			}
		};
		const answers = { q1: 0, q2: 1 }; // Score = 5, but let's test edge case
		// Actually, let's make score = 10 which falls in the gap
		const configForGap: SurveyConfig = {
			...mockConfig,
			questions: [
				{
					id: 'q1',
					text: 'Q1',
					type: 'textarea' as const,
					required: true
				}
			],
			scoring: {
				method: 'sum',
				interpretation: [
					{ min: 0, max: 5, severity: 'Low', recommendation: 'Good', color: 'green' },
					{ min: 15, max: 30, severity: 'High', recommendation: 'Seek help', color: 'red' }
				]
			}
		};
		const answersForGap = { q1: 10 }; // Score = 10, falls in gap
		const result = calculateScore(answersForGap, configForGap);

		// Should fall back to last interpretation
		expect(result.interpretation.severity).toBe('High');
	});

	it('should fall back to default interpretation when interpretations array is empty', () => {
		const configWithEmptyInterpretations: SurveyConfig = {
			...mockConfig,
			scoring: {
				method: 'sum',
				interpretation: []
			}
		};
		const answers = { q1: 1 };
		const result = calculateScore(answers, configWithEmptyInterpretations);

		expect(result.interpretation.severity).toBe('Unknown');
		expect(result.interpretation.color).toBe('yellow');
	});

	it('should skip subscale questions that do not exist in questions array', () => {
		const configWithMissingQuestion: SurveyConfig = {
			...mockConfig,
			scoring: {
				...mockConfig.scoring,
				subscales: [
					{
						id: 'subscale1',
						name: 'Subscale 1',
						questionIds: ['q1', 'nonexistent_question'],
						interpretation: [{ min: 0, max: 10, severity: 'Any', color: 'green' }]
					}
				]
			}
		};
		const answers = { q1: 1, nonexistent_question: 5 };
		const result = calculateScore(answers, configWithMissingQuestion);

		// Should only count q1 (5 points), nonexistent_question is skipped
		expect(result.subscales![0].score).toBe(5);
		expect(result.subscales![0].averageScore).toBe(5);
	});

	it('should skip subscale questions with undefined answers', () => {
		const configWithSubscales: SurveyConfig = {
			...mockConfig,
			scoring: {
				...mockConfig.scoring,
				subscales: [
					{
						id: 'subscale1',
						name: 'Subscale 1',
						questionIds: ['q1', 'q2'],
						interpretation: [{ min: 0, max: 10, severity: 'Any', color: 'green' }]
					}
				]
			}
		};
		const answers = { q1: 1 }; // q2 is not answered
		const result = calculateScore(answers, configWithSubscales);

		// Should only count q1 (5 points)
		expect(result.subscales![0].score).toBe(5);
		expect(result.subscales![0].averageScore).toBe(5);
	});

	it('should fall back to last subscale interpretation when no match found', () => {
		const configWithGapInSubscale: SurveyConfig = {
			...mockConfig,
			scoring: {
				...mockConfig.scoring,
				subscales: [
					{
						id: 'subscale1',
						name: 'Subscale 1',
						questionIds: ['q1'],
						interpretation: [
							{ min: 0, max: 2, severity: 'Low', color: 'green' },
							// Gap: 2.01 to 7.99
							{ min: 8, max: 10, severity: 'High', color: 'red' }
						]
					}
				]
			}
		};
		const answers = { q1: 1 }; // Points = 5, which falls in gap
		const result = calculateScore(answers, configWithGapInSubscale);

		// Should fall back to last interpretation (High)
		expect(result.subscales![0].interpretation.severity).toBe('High');
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

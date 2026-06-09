import type { QuestionnaireConfig, ScoringInterpretation } from '$lib/data/questionnaires/types';

export interface SubscaleResult {
	id: string;
	name: string;
	description?: string;
	score: number;
	averageScore: number;
	displayMethod?: 'sum' | 'average'; // How to display the score
	maxScore?: number; // Maximum possible score for this subscale (for sum display)
	interpretation: {
		min: number;
		max: number;
		severity: string;
		color: 'green' | 'yellow' | 'orange' | 'red' | 'darkred';
	};
}

export interface ScoringResult {
	totalScore: number;
	averageScore?: number;
	interpretation: ScoringInterpretation;
	subscales?: SubscaleResult[];
}

/**
 * Calculate total score for a questionnaire based on answers and configuration
 */
export function calculateScore(
	answers: Record<string, number>,
	config: QuestionnaireConfig
): ScoringResult {
	const { scoring, questions } = config;

	// Calculate total score
	let totalScore = 0;
	let countedQuestions = 0;

	questions.forEach((question) => {
		// Skip if question should not be counted in score
		if (question.countInScore === false) {
			return;
		}

		// Skip if question is in the exclude list
		if (scoring.excludeFromScore?.includes(question.id)) {
			return;
		}

		// Skip non-scorable question types
		if (question.type === 'subheading') {
			return;
		}

		const answer = answers[question.id];
		if (answer !== undefined) {
			countedQuestions++;
			// For radio questions, use the points from the selected option
			if (question.type === 'radio' && question.options) {
				const selectedOption = question.options.find((opt) => opt.value === answer);
				if (selectedOption && selectedOption.points !== undefined) {
					totalScore += selectedOption.points;
				} else {
					// Fallback to answer value if points not specified
					totalScore += answer;
				}
			} else {
				// For other question types, use the answer value directly
				totalScore += answer;
			}
		}
	});

	// Calculate average score if method is 'average'
	const averageScore =
		scoring.method === 'average' && countedQuestions > 0
			? totalScore / countedQuestions
			: undefined;

	// Find interpretation (use average score if method is 'average', otherwise use total)
	const scoreForInterpretation =
		scoring.method === 'average' && averageScore !== undefined ? averageScore : totalScore;
	const interpretation = findInterpretation(scoreForInterpretation, scoring.interpretation);

	// Calculate subscales if defined
	const subscales = scoring.subscales
		? calculateSubscales(answers, scoring.subscales, questions)
		: undefined;

	return {
		totalScore,
		averageScore,
		interpretation,
		subscales
	};
}

/**
 * Calculate subscale scores
 */
function calculateSubscales(
	answers: Record<string, number>,
	subscaleConfigs: NonNullable<QuestionnaireConfig['scoring']['subscales']>,
	questions: QuestionnaireConfig['questions']
): SubscaleResult[] {
	return subscaleConfigs.map((subscale) => {
		let subscaleScore = 0;
		let questionCount = 0;

		subscale.questionIds.forEach((qId) => {
			const answer = answers[qId];
			const question = questions.find((q) => q.id === qId);

			if (answer !== undefined && question) {
				questionCount++;
				// For radio questions, use the points from the selected option
				if (question.type === 'radio' && question.options) {
					const selectedOption = question.options.find((opt) => opt.value === answer);
					if (selectedOption && selectedOption.points !== undefined) {
						subscaleScore += selectedOption.points;
					} else {
						subscaleScore += answer;
					}
				} else {
					subscaleScore += answer;
				}
			}
		});

		const averageScore = questionCount > 0 ? subscaleScore / questionCount : 0;

		// Choose interpretation based on condition
		const interpretationArray =
			subscale.alternativeInterpretation && subscale.interpretationCondition?.(answers)
				? subscale.alternativeInterpretation
				: subscale.interpretation;
		const value = subscale.displayMethod === 'sum' ? subscaleScore : averageScore;
		// Use subscaleScore (sum) for interpretation instead of averageScore
		const interpretation =
			interpretationArray.find((interp) => value >= interp.min && value <= interp.max) ||
			interpretationArray[interpretationArray.length - 1];

		return {
			id: subscale.id,
			name: subscale.name,
			description: subscale.description,
			score: subscaleScore,
			averageScore: averageScore,
			displayMethod: subscale.displayMethod || 'average',
			maxScore:
				subscale.displayMethod === 'sum'
					? subscale.interpretation[subscale.interpretation.length - 1].max
					: undefined,
			interpretation
		};
	});
}

/**
 * Find the appropriate interpretation based on score
 */
function findInterpretation(
	score: number,
	interpretations: ScoringInterpretation[]
): ScoringInterpretation {
	const found = interpretations.find((interp) => score >= interp.min && score <= interp.max);

	// Fallback to last interpretation if not found (shouldn't happen with proper config)
	return (
		found ||
		interpretations[interpretations.length - 1] || {
			min: 0,
			max: 0,
			severity: 'Unknown',
			recommendation: 'Unable to determine interpretation',
			color: 'yellow' as const
		}
	);
}

/**
 * Check if all required questions have been answered
 */
export function validateAnswers(
	answers: Record<string, number>,
	config: QuestionnaireConfig
): { isValid: boolean; missingQuestions: string[] } {
	const missingQuestions: string[] = [];

	config.questions.forEach((question) => {
		if (question.required && question.type !== 'subheading') {
			if (answers[question.id] === undefined) {
				missingQuestions.push(question.id);
			}
		}
	});

	return {
		isValid: missingQuestions.length === 0,
		missingQuestions
	};
}

/**
 * Evaluate warnings based on current answers
 */
export function evaluateWarnings(answers: Record<string, number>, config: QuestionnaireConfig) {
	if (!config.warnings) {
		return [];
	}

	return config.warnings.filter((warning) => warning.condition(answers));
}

/**
 * Check if a question should be displayed based on conditional logic
 */
export function shouldDisplayQuestion(
	question: {
		conditionalDisplay?: {
			condition: (answers: Record<string, number>) => boolean;
		};
	},
	answers: Record<string, number>
): boolean {
	if (!question.conditionalDisplay) {
		return true;
	}

	return question.conditionalDisplay.condition(answers);
}

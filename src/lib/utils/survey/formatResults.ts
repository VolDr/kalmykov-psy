import type { SurveyConfig, Warning } from '$lib/data/surveys/types';
import type { ScoringResult } from './scoringEngine';

/**
 * Strip markdown links from text, keeping only the link text
 */
function stripMarkdownLinks(text: string): string {
	return text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
}

/**
 * Format survey results for clipboard copying
 */
export function formatResultsForClipboard(
	config: SurveyConfig,
	currentScore: ScoringResult,
	activeWarnings: Warning[],
	origin: string
): string {
	const scoreText =
		currentScore.averageScore !== undefined
			? `Общий балл: ${currentScore.averageScore.toFixed(2)} / 5.00`
			: `Общий балл: ${currentScore.totalScore} / ${config.scoring.maxScore}`;

	const subscalesText = currentScore.subscales
		? `\n\nРезультаты по шкалам:\n${currentScore.subscales
				.map((subscale) => {
					if (subscale.displayMethod === 'sum') {
						return `${subscale.name}: ${subscale.score} / ${subscale.maxScore} — ${subscale.interpretation.severity}`;
					} else {
						return `${subscale.name}: ${subscale.averageScore.toFixed(2)} / 5.00 — ${subscale.interpretation.severity}`;
					}
				})
				.join('\n')}`
		: '';

	const resultsText = `
Результаты опросника ${config.title}

${scoreText}
Уровень: ${currentScore.interpretation.severity}
${subscalesText}

Рекомендация:
${stripMarkdownLinks(currentScore.interpretation.recommendation)}

${activeWarnings.length > 0 ? `\nВажные предупреждения:\n${activeWarnings.map((w) => `${w.title}\n${w.message}`).join('\n\n')}` : ''}

Пройти тест: ${origin}/surveys/${config.id}
	`.trim();

	return resultsText;
}

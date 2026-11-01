import { bat23Config } from '../../configs/bat23ConfigSoft';
import { calculateScore, validateAnswers } from '../utils/questionnaire/scoringEngine';

/** Only recognised answers influence a server-generated email/result. */
export function scoreBat23(raw: unknown) {
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
	const clean: Record<string, number> = {};
	for (const [id, value] of Object.entries(raw)) {
		const question = bat23Config.questions.find((q) => q.id === id);
		if (!question || question.type !== 'radio') return null;
		if (typeof value !== 'number' || !question.options?.some((o) => o.value === value)) return null;
		clean[id] = value;
	}
	if (!validateAnswers(clean, bat23Config).isValid) return null;
	return calculateScore(clean, bat23Config);
}

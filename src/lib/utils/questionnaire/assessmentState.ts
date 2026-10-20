import { browser } from '$app/environment';

export type AssessmentState = {
	answers: Record<string, number>;
	currentStep: number;
	showResults: boolean;
};

export function loadAssessmentState<T extends AssessmentState>(storageKey: string, fallback: T): T {
	if (!browser) return fallback;

	try {
		const stored = localStorage.getItem(storageKey);
		if (!stored) return fallback;

		const parsed: unknown = JSON.parse(stored);
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return fallback;

		const raw = parsed as Record<string, unknown>;
		const answers =
			raw.answers && typeof raw.answers === 'object' && !Array.isArray(raw.answers)
				? Object.fromEntries(
						Object.entries(raw.answers).filter(
							(entry): entry is [string, number] =>
								typeof entry[1] === 'number' && Number.isFinite(entry[1])
						)
					)
				: fallback.answers;
		const currentStep =
			typeof raw.currentStep === 'number' && Number.isInteger(raw.currentStep)
				? Math.max(0, raw.currentStep)
				: fallback.currentStep;

		return {
			...fallback,
			...raw,
			answers,
			currentStep,
			showResults: raw.showResults === true
		} as T;
	} catch {
		return fallback;
	}
}

export function saveAssessmentState<T extends AssessmentState>(storageKey: string, state: T): void {
	if (!browser) return;

	try {
		localStorage.setItem(storageKey, JSON.stringify(state));
	} catch {
		// The questionnaire remains usable when storage is unavailable or full.
	}
}

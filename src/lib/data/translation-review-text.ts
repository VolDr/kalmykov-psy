// Знак конца фразы, после которого могут идти закрывающие кавычки и скобки
const FINISHED = /[.!?…:;][»"”’')\]]*$/;

/**
 * Текст варианта для показа участникам: если фраза не закончена знаком
 * препинания, в конце показывается точка. Сохранённый текст не меняется.
 */
export function withFinalPeriod(text: string): string {
	const trimmed = text.trimEnd();
	if (!trimmed || FINISHED.test(trimmed)) return text;
	return `${trimmed}.`;
}

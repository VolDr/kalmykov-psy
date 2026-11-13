/** RFQ-8 — пользовательский согласованный русский текст, без перефразирования. */
export const rfq8Questions = [
	{ id: 'q1', text: "Мысли других людей для меня — загадка." },
	{ id: 'q2', text: "Я не всегда понимаю, почему поступаю так, как поступаю." },
	{ id: 'q3', text: "Когда я злюсь, я говорю что-то, толком не понимая, почему я это говорю." },
	{ id: 'q4', text: "Когда я злюсь, я говорю то, о чём потом жалею." },
	{ id: 'q5', text: "Когда я чувствую себя неуверенно, я могу вести себя так, что это вызывает у окружающих раздражение или защитную реакцию." },
	{ id: 'q6', text: "Иногда я делаю что-то, толком не понимая почему." },
	{ id: 'q7', text: "Я всегда знаю, что чувствую." },
	{ id: 'q8', text: "Сильные чувства часто мешают мне ясно мыслить." }
] as const;

// Авторский ключ: RFQ-C = 1–6; RFQ-U = 2, 4, 5, 6, 7 (обратный), 8.
// И в RFQ-C, и в RFQ-U высокие баллы описывают потенциальные трудности.
// См. Fonagy et al. (2016), https://doi.org/10.1371/journal.pone.0158678
const certaintyIds = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'] as const;
const uncertaintyIds = ['q2', 'q4', 'q5', 'q6', 'q7', 'q8'] as const;
const certaintyRecode = (answer: number): number => Math.max(4 - answer, 0);
const uncertaintyRecode = (answer: number): number => Math.max(answer - 4, 0);

/** Средние двух независимых шкал (0–3), без сводного диагностического балла. */
export function scoreRfq8(answers: Record<string, number>) {
	if (rfq8Questions.some(({ id }) => !Number.isInteger(answers[id]) || answers[id] < 1 || answers[id] > 7)) {
		return null;
	}
	const certainty = certaintyIds.reduce((sum, id) => sum + certaintyRecode(answers[id]), 0) / certaintyIds.length;
	const uncertainty = uncertaintyIds.reduce((sum, id) =>
		sum + (id === 'q7' ? certaintyRecode(answers[id]) : uncertaintyRecode(answers[id])), 0
	) / uncertaintyIds.length;
	return { certainty, uncertainty };
}

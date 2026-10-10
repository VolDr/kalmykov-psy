/**
 * Доля баллов за вопрос с несколькими верными ответами:
 * (верно отмеченные − неверно отмеченные) / число верных, но не меньше нуля.
 *
 * 2 из 2 → 1; 1 из 2 → 0.5; 1 из 2 и 1 неверный → 0; 2 из 4 и 1 неверный → 0.25.
 */
export function multiFraction(selected: number[], correct: number[]): number {
	if (selected.length === 0 || correct.length === 0) return 0;
	const right = new Set(correct);
	const picked = new Set(selected);
	let hits = 0;
	for (const option of picked) if (right.has(option)) hits++;
	const misses = picked.size - hits;
	return Math.max(0, (hits - misses) / right.size);
}

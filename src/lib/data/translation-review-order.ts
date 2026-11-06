/** Stable per round and item, shared by both participants and independent of reloads. */
export function reviewOptionOrder(roundId: number, itemKey: string): ('a' | 'b')[] {
	let hash = 2166136261;
	for (const character of `${roundId}:${itemKey}`) {
		hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
	}
	// Mix the low bits so adjacent numeric keys do not just alternate.
	hash ^= hash >>> 16;
	hash = Math.imul(hash, 0x85ebca6b);
	hash ^= hash >>> 13;
	return (hash >>> 0) % 2 ? ['b', 'a'] : ['a', 'b'];
}

/** Number by visible position; stored a/b identities never appear in the label. */
export function reviewChoiceLabel(roundId: number, itemKey: string, value: string): string {
	if (value !== 'a' && value !== 'b') return 'Не выбран';
	return `Вариант ${reviewOptionOrder(roundId, itemKey).indexOf(value) + 1}`;
}

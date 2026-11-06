/** Цвет облачков комментариев: у каждого участника свой. */
const tones = {
	1: { bubble: 'bg-sky-50 text-sky-950', name: 'text-sky-800' },
	2: { bubble: 'bg-violet-50 text-violet-950', name: 'text-violet-800' }
} as const;

export const reviewerTone = (slot: number) => (slot === 2 ? tones[2] : tones[1]);

import { browser } from '$app/environment';
import { reachGoal } from '$lib/metrika';

export function initScrollGoals() {
	if (!browser) return;

	const fired = new Set<string>();

	// Маркеры в HTML: <div data-scroll-goal="lead_scroll_50"></div>
	const markers = document.querySelectorAll<HTMLElement>('[data-scroll-goal]');

	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;

				const goal = (entry.target as HTMLElement).dataset.scrollGoal;
				if (!goal || fired.has(goal)) continue;

				fired.add(goal);
				reachGoal(goal);
				observer.unobserve(entry.target);
			}
		},
		{ threshold: 0.1 }
	);

	markers.forEach((el) => observer.observe(el));
}
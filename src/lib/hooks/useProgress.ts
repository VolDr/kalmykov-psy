import { writable } from 'svelte/store';

export function createProgress() {
	const progress = writable(0);

	function action(node: HTMLElement) {
		let ro: ResizeObserver | null = null;
		let rafId: number | null = null;

		const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v));

		const update = () => {
			const start = node.offsetTop;
			const totalScrollable = node.scrollHeight - window.innerHeight;

			if (totalScrollable <= 0) {
				progress.set(1);
				return;
			}

			const p = (window.scrollY - start) / totalScrollable;
			progress.set(clamp(p));
		};

		// rAF-дебаунс для ResizeObserver: чтение offsetTop/scrollHeight форсирует
		// synchronous layout reflow. Без rAF это происходит прямо в callback ResizeObserver,
		// что прерывает CSS smooth scroll animation в Chrome (main-thread scroll engine).
		const scheduleUpdate = () => {
			if (rafId !== null) return;
			rafId = requestAnimationFrame(() => {
				rafId = null;
				update();
			});
		};

		const onScroll = () => update();
		const onResize = () => update();

		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onResize);

		ro = new ResizeObserver(scheduleUpdate);
		ro.observe(node);

		// первичная инициализация
		update();

		return {
			destroy() {
				window.removeEventListener('scroll', onScroll);
				window.removeEventListener('resize', onResize);
				if (rafId !== null) cancelAnimationFrame(rafId);
				if (ro) ro.disconnect();
			}
		};
	}

	return { progress, action };
}

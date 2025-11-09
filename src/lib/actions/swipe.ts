export interface SwipeOptions {
	threshold?: number;
	onSwipeLeft?: () => void;
	onSwipeRight?: () => void;
}

export function swipe(node: HTMLElement, options: SwipeOptions = {}) {
	const { threshold = 50, onSwipeLeft, onSwipeRight } = options;

	let startX = 0;
	let startY = 0;

	function handleTouchStart(e: TouchEvent) {
		// Проверяем что ширина экрана < 768px (breakpoint md)
		if (window.innerWidth >= 768) return;
		startX = e.touches[0].clientX;
		startY = e.touches[0].clientY;
	}

	function handleTouchEnd(e: TouchEvent) {
		// Проверяем что ширина экрана < 768px (breakpoint md)
		if (window.innerWidth >= 768) return;
		const endX = e.changedTouches[0].clientX;
		const endY = e.changedTouches[0].clientY;
		const diffX = startX - endX;
		const diffY = startY - endY;

		// Проверяем что свайп горизонтальный, а не вертикальный
		if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > threshold) {
			if (diffX > 0 && onSwipeLeft) {
				onSwipeLeft();
			} else if (diffX < 0 && onSwipeRight) {
				onSwipeRight();
			}
		}
	}

	node.addEventListener('touchstart', handleTouchStart, { passive: true });
	node.addEventListener('touchend', handleTouchEnd, { passive: true });

	return {
		destroy() {
			node.removeEventListener('touchstart', handleTouchStart);
			node.removeEventListener('touchend', handleTouchEnd);
		}
	};
}

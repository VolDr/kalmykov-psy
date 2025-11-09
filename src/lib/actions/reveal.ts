interface RevealOptions {
	axis?: 'x' | 'y';
	threshold?: number;
	distance?: number;
	minDuration?: number;
	maxDuration?: number;
	minDelay?: number;
	maxDelay?: number;
	easing?: string;
}

export function reveal(node: HTMLElement, options: RevealOptions = {}) {
	const {
		axis = 'y',
		threshold = 0.1,
		distance = 75,
		minDuration = 1200,
		maxDuration = 2000,
		minDelay = 50,
		maxDelay = 400,
		easing = 'cubic-bezier(0.16, 1, 0.3, 1)'
	} = options;

	const duration = Math.floor(Math.random() * (maxDuration - minDuration) + minDuration);
	const delay = Math.random() * (maxDelay - minDelay) + minDelay;

	const axisValue = axis === 'x' ? 'translateX' : 'translateY';
	const startPos = axis === 'x' ? -distance : distance;

	// Set initial state
	node.style.transform = `${axisValue}(${startPos}px)`;
	node.style.opacity = '0';
	node.style.willChange = 'transform, opacity';
	node.style.transition = 'none';

	const observer = new IntersectionObserver(
		([entry]) => {
			if (entry.isIntersecting) {
				// Force reflow to ensure initial state is applied
				node.offsetHeight;

				// Trigger animation
				node.style.transition = `transform ${duration}ms ${easing} ${delay}ms, opacity ${duration}ms ${easing} ${delay}ms`;
				node.style.transform = `${axisValue}(0px)`;
				node.style.opacity = '1';

				// Cleanup after animation completes
				setTimeout(() => {
					node.style.willChange = 'auto';
				}, duration + delay);

				observer.disconnect();
			}
		},
		{ threshold }
	);

	observer.observe(node);

	return {
		destroy() {
			observer.disconnect();
		}
	};
}

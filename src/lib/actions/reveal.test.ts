import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { reveal } from './reveal';

describe('reveal', () => {
	let mockElement: HTMLElement;
	let mockObserver: IntersectionObserver;
	let observerCallback: IntersectionObserverCallback;

	beforeEach(() => {
		// Create mock element
		mockElement = document.createElement('div');
		Object.defineProperty(mockElement, 'offsetHeight', { value: 100, configurable: true });

		// Mock IntersectionObserver
		mockObserver = {
			observe: vi.fn(),
			disconnect: vi.fn(),
			unobserve: vi.fn(),
			takeRecords: vi.fn(),
			root: null,
			rootMargin: '',
			thresholds: []
		};

		// Create a proper mock class for IntersectionObserver
		class MockIntersectionObserver {
			constructor(callback: IntersectionObserverCallback) {
				observerCallback = callback;
				Object.assign(this, mockObserver);
			}
		}

		vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

		// Mock window properties
		Object.defineProperty(window, 'innerHeight', { value: 768, configurable: true });

		// Mock Math.random for deterministic tests
		vi.spyOn(Math, 'random').mockReturnValue(0.5);
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it('should set initial state when element is not in viewport', () => {
		mockElement.getBoundingClientRect = vi.fn().mockReturnValue({
			top: 1000,
			bottom: 1100
		});

		reveal(mockElement);

		expect(mockElement.style.transform).toBe('translateY(75px)');
		expect(mockElement.style.opacity).toBe('0');
		expect(mockElement.style.willChange).toBe('transform, opacity');
		expect(mockElement.style.transition).toBe('none');
		expect(mockObserver.observe).toHaveBeenCalledWith(mockElement);
	});

	it('should not animate when element is already in viewport', () => {
		mockElement.getBoundingClientRect = vi.fn().mockReturnValue({
			top: 100,
			bottom: 200
		});

		const result = reveal(mockElement);

		expect(mockElement.style.transform).toBe('translateY(0px)');
		expect(mockElement.style.opacity).toBe('1');
		expect(mockObserver.observe).not.toHaveBeenCalled();
		expect(result.destroy).toBeDefined();
	});

	it('should animate when element becomes visible', () => {
		vi.useFakeTimers();

		mockElement.getBoundingClientRect = vi.fn().mockReturnValue({
			top: 1000,
			bottom: 1100
		});

		reveal(mockElement);

		// Simulate intersection
		observerCallback(
			[
				{
					isIntersecting: true,
					boundingClientRect: {} as DOMRectReadOnly,
					intersectionRatio: 0.5,
					intersectionRect: {} as DOMRectReadOnly,
					rootBounds: null,
					target: mockElement,
					time: 0
				}
			],
			mockObserver
		);

		// Should set transition and animate
		expect(mockElement.style.transition).toContain('transform');
		expect(mockElement.style.transition).toContain('opacity');
		expect(mockElement.style.transform).toBe('translateY(0px)');
		expect(mockElement.style.opacity).toBe('1');
		expect(mockObserver.disconnect).toHaveBeenCalled();

		// Cleanup after animation
		vi.runAllTimers();
		expect(mockElement.style.willChange).toBe('auto');

		vi.useRealTimers();
	});

	it('should use x-axis when specified', () => {
		mockElement.getBoundingClientRect = vi.fn().mockReturnValue({
			top: 1000,
			bottom: 1100
		});

		reveal(mockElement, { axis: 'x' });

		expect(mockElement.style.transform).toBe('translateX(-75px)');
	});

	it('should use custom options', () => {
		mockElement.getBoundingClientRect = vi.fn().mockReturnValue({
			top: 1000,
			bottom: 1100
		});

		reveal(mockElement, {
			distance: 100,
			threshold: 0.5
		});

		expect(mockElement.style.transform).toBe('translateY(100px)');
	});

	it('should disconnect observer on destroy', () => {
		mockElement.getBoundingClientRect = vi.fn().mockReturnValue({
			top: 1000,
			bottom: 1100
		});

		const result = reveal(mockElement);
		result.destroy();

		expect(mockObserver.disconnect).toHaveBeenCalled();
	});

	it('should not animate when not intersecting', () => {
		mockElement.getBoundingClientRect = vi.fn().mockReturnValue({
			top: 1000,
			bottom: 1100
		});

		reveal(mockElement);

		// Simulate non-intersection
		observerCallback(
			[
				{
					isIntersecting: false,
					boundingClientRect: {} as DOMRectReadOnly,
					intersectionRatio: 0,
					intersectionRect: {} as DOMRectReadOnly,
					rootBounds: null,
					target: mockElement,
					time: 0
				}
			],
			mockObserver
		);

		// Should not change animation state
		expect(mockElement.style.transform).toBe('translateY(75px)');
		expect(mockObserver.disconnect).not.toHaveBeenCalled();
	});

	it('should calculate duration and delay based on random values', () => {
		mockElement.getBoundingClientRect = vi.fn().mockReturnValue({
			top: 1000,
			bottom: 1100
		});

		// With Math.random returning 0.5:
		// duration = Math.floor(0.5 * (2000 - 1200) + 1200) = Math.floor(400 + 1200) = 1600
		// delay = 0.5 * (400 - 50) + 50 = 175 + 50 = 225

		reveal(mockElement);

		observerCallback(
			[
				{
					isIntersecting: true,
					boundingClientRect: {} as DOMRectReadOnly,
					intersectionRatio: 0.5,
					intersectionRect: {} as DOMRectReadOnly,
					rootBounds: null,
					target: mockElement,
					time: 0
				}
			],
			mockObserver
		);

		expect(mockElement.style.transition).toContain('1600ms');
		expect(mockElement.style.transition).toContain('225ms');
	});

	it('should handle custom easing function', () => {
		mockElement.getBoundingClientRect = vi.fn().mockReturnValue({
			top: 1000,
			bottom: 1100
		});

		const customEasing = 'ease-in-out';
		reveal(mockElement, { easing: customEasing });

		observerCallback(
			[
				{
					isIntersecting: true,
					boundingClientRect: {} as DOMRectReadOnly,
					intersectionRatio: 0.5,
					intersectionRect: {} as DOMRectReadOnly,
					rootBounds: null,
					target: mockElement,
					time: 0
				}
			],
			mockObserver
		);

		expect(mockElement.style.transition).toContain(customEasing);
	});
});

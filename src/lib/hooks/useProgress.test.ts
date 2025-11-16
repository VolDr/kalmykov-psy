import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';
import { createProgress } from './useProgress';

describe('createProgress', () => {
	let mockElement: HTMLElement;
	let mockResizeObserver: ResizeObserver;
	let resizeObserverCallback: ResizeObserverCallback;

	beforeEach(() => {
		mockElement = document.createElement('div');

		// Mock element properties
		Object.defineProperty(mockElement, 'offsetTop', { value: 0, configurable: true });
		Object.defineProperty(mockElement, 'scrollHeight', { value: 2000, configurable: true });

		// Mock window properties
		Object.defineProperty(window, 'innerHeight', { value: 1000, configurable: true });
		Object.defineProperty(window, 'scrollY', { value: 0, configurable: true, writable: true });

		// Mock ResizeObserver
		mockResizeObserver = {
			observe: vi.fn(),
			disconnect: vi.fn(),
			unobserve: vi.fn()
		};

		// Create a proper mock class for ResizeObserver
		class MockResizeObserver {
			constructor(callback: ResizeObserverCallback) {
				resizeObserverCallback = callback;
				Object.assign(this, mockResizeObserver);
			}
		}

		vi.stubGlobal('ResizeObserver', MockResizeObserver);
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it('should return a progress store and action', () => {
		const { progress, action } = createProgress();

		expect(progress).toBeDefined();
		expect(action).toBeDefined();
		expect(typeof action).toBe('function');
	});

	it('should initialize progress to 0', () => {
		const { progress } = createProgress();

		expect(get(progress)).toBe(0);
	});

	it('should add event listeners when action is called', () => {
		const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
		const { action } = createProgress();

		action(mockElement);

		expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), {
			passive: true
		});
		expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
		expect(mockResizeObserver.observe).toHaveBeenCalledWith(mockElement);
	});

	it('should remove event listeners on destroy', () => {
		const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
		const { action } = createProgress();

		const result = action(mockElement);
		result.destroy();

		expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
		expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
		expect(mockResizeObserver.disconnect).toHaveBeenCalled();
	});

	it('should update progress on scroll', () => {
		const { progress, action } = createProgress();
		action(mockElement);

		// Simulate scrolling to middle (500px out of 1000px scrollable)
		Object.defineProperty(window, 'scrollY', { value: 500, configurable: true });

		// Trigger scroll event
		window.dispatchEvent(new Event('scroll'));

		// Progress should be 0.5 (500 / 1000)
		expect(get(progress)).toBe(0.5);
	});

	it('should clamp progress between 0 and 1', () => {
		const { progress, action } = createProgress();
		action(mockElement);

		// Simulate negative scroll (clamped to 0)
		Object.defineProperty(window, 'scrollY', { value: -100, configurable: true });
		window.dispatchEvent(new Event('scroll'));
		expect(get(progress)).toBe(0);

		// Simulate over-scroll (clamped to 1)
		Object.defineProperty(window, 'scrollY', { value: 2000, configurable: true });
		window.dispatchEvent(new Event('scroll'));
		expect(get(progress)).toBe(1);
	});

	it('should set progress to 1 when content fits in viewport', () => {
		// Make scrollHeight equal to innerHeight (no scrollable content)
		Object.defineProperty(mockElement, 'scrollHeight', { value: 1000, configurable: true });

		const { progress, action } = createProgress();
		action(mockElement);

		expect(get(progress)).toBe(1);
	});

	it('should update progress on resize', () => {
		const { progress, action } = createProgress();
		action(mockElement);

		// Initial state
		Object.defineProperty(window, 'scrollY', { value: 250, configurable: true });
		window.dispatchEvent(new Event('resize'));

		// Progress should be 0.25 (250 / 1000)
		expect(get(progress)).toBe(0.25);
	});

	it('should handle ResizeObserver updates', () => {
		const { progress, action } = createProgress();
		action(mockElement);

		Object.defineProperty(window, 'scrollY', { value: 300, configurable: true });

		// Trigger ResizeObserver callback
		resizeObserverCallback([], mockResizeObserver);

		expect(get(progress)).toBe(0.3);
	});

	it('should account for element offsetTop in calculations', () => {
		Object.defineProperty(mockElement, 'offsetTop', { value: 100, configurable: true });

		const { progress, action } = createProgress();
		action(mockElement);

		// scrollY = 200, offsetTop = 100, totalScrollable = 1000
		// progress = (200 - 100) / 1000 = 0.1
		Object.defineProperty(window, 'scrollY', { value: 200, configurable: true });
		window.dispatchEvent(new Event('scroll'));

		expect(get(progress)).toBe(0.1);
	});

	it('should handle edge case when scrollHeight equals innerHeight', () => {
		Object.defineProperty(mockElement, 'scrollHeight', { value: 1000, configurable: true });
		Object.defineProperty(window, 'innerHeight', { value: 1000, configurable: true });

		const { progress, action } = createProgress();
		action(mockElement);

		// totalScrollable = 1000 - 1000 = 0, should set progress to 1
		expect(get(progress)).toBe(1);
	});

	it('should handle scrollHeight less than innerHeight', () => {
		Object.defineProperty(mockElement, 'scrollHeight', { value: 500, configurable: true });
		Object.defineProperty(window, 'innerHeight', { value: 1000, configurable: true });

		const { progress, action } = createProgress();
		action(mockElement);

		// totalScrollable = 500 - 1000 = -500 (negative), should set progress to 1
		expect(get(progress)).toBe(1);
	});
});

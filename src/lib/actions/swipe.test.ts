import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { swipe } from './swipe';

describe('swipe', () => {
	let mockElement: HTMLElement;
	let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
	let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		mockElement = document.createElement('div');
		addEventListenerSpy = vi.spyOn(mockElement, 'addEventListener');
		removeEventListenerSpy = vi.spyOn(mockElement, 'removeEventListener');
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it('should add touch event listeners', () => {
		swipe(mockElement);

		expect(addEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function), {
			passive: true
		});
		expect(addEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function), {
			passive: true
		});
	});

	it('should remove event listeners on destroy', () => {
		const result = swipe(mockElement);
		result.destroy();

		expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
		expect(removeEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function));
	});

	it('should call onSwipeLeft when swiping left on mobile', () => {
		Object.defineProperty(window, 'innerWidth', { value: 500, configurable: true });

		const onSwipeLeft = vi.fn();
		swipe(mockElement, { onSwipeLeft });

		const touchStartHandler = addEventListenerSpy.mock.calls.find(
			(call) => call[0] === 'touchstart'
		)?.[1] as EventListener;
		const touchEndHandler = addEventListenerSpy.mock.calls.find(
			(call) => call[0] === 'touchend'
		)?.[1] as EventListener;

		// Simulate swipe left (startX > endX)
		touchStartHandler({
			touches: [{ clientX: 200, clientY: 100 }]
		} as unknown as TouchEvent);

		touchEndHandler({
			changedTouches: [{ clientX: 100, clientY: 100 }]
		} as unknown as TouchEvent);

		expect(onSwipeLeft).toHaveBeenCalled();
	});

	it('should call onSwipeRight when swiping right on mobile', () => {
		Object.defineProperty(window, 'innerWidth', { value: 500, configurable: true });

		const onSwipeRight = vi.fn();
		swipe(mockElement, { onSwipeRight });

		const touchStartHandler = addEventListenerSpy.mock.calls.find(
			(call) => call[0] === 'touchstart'
		)?.[1] as EventListener;
		const touchEndHandler = addEventListenerSpy.mock.calls.find(
			(call) => call[0] === 'touchend'
		)?.[1] as EventListener;

		// Simulate swipe right (startX < endX)
		touchStartHandler({
			touches: [{ clientX: 100, clientY: 100 }]
		} as unknown as TouchEvent);

		touchEndHandler({
			changedTouches: [{ clientX: 200, clientY: 100 }]
		} as unknown as TouchEvent);

		expect(onSwipeRight).toHaveBeenCalled();
	});

	it('should not trigger swipe on desktop (width >= 768)', () => {
		Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true });

		const onSwipeLeft = vi.fn();
		const onSwipeRight = vi.fn();
		swipe(mockElement, { onSwipeLeft, onSwipeRight });

		const touchStartHandler = addEventListenerSpy.mock.calls.find(
			(call) => call[0] === 'touchstart'
		)?.[1] as EventListener;
		const touchEndHandler = addEventListenerSpy.mock.calls.find(
			(call) => call[0] === 'touchend'
		)?.[1] as EventListener;

		touchStartHandler({
			touches: [{ clientX: 200, clientY: 100 }]
		} as unknown as TouchEvent);

		touchEndHandler({
			changedTouches: [{ clientX: 100, clientY: 100 }]
		} as unknown as TouchEvent);

		expect(onSwipeLeft).not.toHaveBeenCalled();
		expect(onSwipeRight).not.toHaveBeenCalled();
	});

	it('should not trigger swipe when horizontal distance is below threshold', () => {
		Object.defineProperty(window, 'innerWidth', { value: 500, configurable: true });

		const onSwipeLeft = vi.fn();
		swipe(mockElement, { onSwipeLeft, threshold: 50 });

		const touchStartHandler = addEventListenerSpy.mock.calls.find(
			(call) => call[0] === 'touchstart'
		)?.[1] as EventListener;
		const touchEndHandler = addEventListenerSpy.mock.calls.find(
			(call) => call[0] === 'touchend'
		)?.[1] as EventListener;

		// Swipe only 30px (below threshold of 50)
		touchStartHandler({
			touches: [{ clientX: 130, clientY: 100 }]
		} as unknown as TouchEvent);

		touchEndHandler({
			changedTouches: [{ clientX: 100, clientY: 100 }]
		} as unknown as TouchEvent);

		expect(onSwipeLeft).not.toHaveBeenCalled();
	});

	it('should not trigger swipe when vertical movement is greater than horizontal', () => {
		Object.defineProperty(window, 'innerWidth', { value: 500, configurable: true });

		const onSwipeLeft = vi.fn();
		swipe(mockElement, { onSwipeLeft });

		const touchStartHandler = addEventListenerSpy.mock.calls.find(
			(call) => call[0] === 'touchstart'
		)?.[1] as EventListener;
		const touchEndHandler = addEventListenerSpy.mock.calls.find(
			(call) => call[0] === 'touchend'
		)?.[1] as EventListener;

		// Vertical swipe (larger Y difference)
		touchStartHandler({
			touches: [{ clientX: 200, clientY: 100 }]
		} as unknown as TouchEvent);

		touchEndHandler({
			changedTouches: [{ clientX: 150, clientY: 300 }]
		} as unknown as TouchEvent);

		expect(onSwipeLeft).not.toHaveBeenCalled();
	});

	it('should use custom threshold', () => {
		Object.defineProperty(window, 'innerWidth', { value: 500, configurable: true });

		const onSwipeLeft = vi.fn();
		swipe(mockElement, { onSwipeLeft, threshold: 100 });

		const touchStartHandler = addEventListenerSpy.mock.calls.find(
			(call) => call[0] === 'touchstart'
		)?.[1] as EventListener;
		const touchEndHandler = addEventListenerSpy.mock.calls.find(
			(call) => call[0] === 'touchend'
		)?.[1] as EventListener;

		// Swipe 120px (above threshold of 100)
		touchStartHandler({
			touches: [{ clientX: 220, clientY: 100 }]
		} as unknown as TouchEvent);

		touchEndHandler({
			changedTouches: [{ clientX: 100, clientY: 100 }]
		} as unknown as TouchEvent);

		expect(onSwipeLeft).toHaveBeenCalled();
	});

	it('should handle missing callbacks gracefully', () => {
		Object.defineProperty(window, 'innerWidth', { value: 500, configurable: true });

		// No callbacks provided
		swipe(mockElement);

		const touchStartHandler = addEventListenerSpy.mock.calls.find(
			(call) => call[0] === 'touchstart'
		)?.[1] as EventListener;
		const touchEndHandler = addEventListenerSpy.mock.calls.find(
			(call) => call[0] === 'touchend'
		)?.[1] as EventListener;

		// Should not throw when swiping without callbacks
		expect(() => {
			touchStartHandler({
				touches: [{ clientX: 200, clientY: 100 }]
			} as unknown as TouchEvent);

			touchEndHandler({
				changedTouches: [{ clientX: 100, clientY: 100 }]
			} as unknown as TouchEvent);
		}).not.toThrow();
	});

	it('should handle swipe right without callback', () => {
		Object.defineProperty(window, 'innerWidth', { value: 500, configurable: true });

		const onSwipeLeft = vi.fn();
		swipe(mockElement, { onSwipeLeft }); // only onSwipeLeft, no onSwipeRight

		const touchStartHandler = addEventListenerSpy.mock.calls.find(
			(call) => call[0] === 'touchstart'
		)?.[1] as EventListener;
		const touchEndHandler = addEventListenerSpy.mock.calls.find(
			(call) => call[0] === 'touchend'
		)?.[1] as EventListener;

		// Should not throw when swiping right without onSwipeRight callback
		expect(() => {
			touchStartHandler({
				touches: [{ clientX: 100, clientY: 100 }]
			} as unknown as TouchEvent);

			touchEndHandler({
				changedTouches: [{ clientX: 200, clientY: 100 }]
			} as unknown as TouchEvent);
		}).not.toThrow();

		expect(onSwipeLeft).not.toHaveBeenCalled();
	});
});

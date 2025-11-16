import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
	it('should merge class names', () => {
		const result = cn('text-red-500', 'bg-blue-200');
		expect(result).toBe('text-red-500 bg-blue-200');
	});

	it('should handle conditional classes', () => {
		const isActive = true;
		const result = cn('base', isActive && 'active');
		expect(result).toBe('base active');
	});

	it('should filter out falsy values', () => {
		const result = cn('base', false && 'hidden', null, undefined, 'visible');
		expect(result).toBe('base visible');
	});

	it('should handle array of classes', () => {
		const result = cn(['text-sm', 'font-bold']);
		expect(result).toBe('text-sm font-bold');
	});

	it('should handle object syntax', () => {
		const result = cn({
			base: true,
			hidden: false,
			active: true
		});
		expect(result).toBe('base active');
	});

	it('should merge conflicting tailwind classes', () => {
		const result = cn('p-4', 'p-2');
		expect(result).toBe('p-2');
	});

	it('should merge conflicting color classes', () => {
		const result = cn('text-red-500', 'text-blue-500');
		expect(result).toBe('text-blue-500');
	});

	it('should handle empty input', () => {
		const result = cn();
		expect(result).toBe('');
	});

	it('should handle complex mixed input', () => {
		const isDisabled = true;
		const result = cn('btn', ['rounded', 'shadow'], { disabled: isDisabled }, 'bg-primary');
		expect(result).toBe('btn rounded shadow disabled bg-primary');
	});
});

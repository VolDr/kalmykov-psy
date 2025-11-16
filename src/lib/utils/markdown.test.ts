import { describe, it, expect } from 'vitest';
import { parseMarkdownLinks, isExternalUrl } from './markdown';

describe('parseMarkdownLinks', () => {
	it('should return original text when no markdown syntax', () => {
		const text = 'Plain text without any markdown';
		const result = parseMarkdownLinks(text);
		expect(result).toEqual([text]);
	});

	it('should parse single link', () => {
		const text = 'Check out [Google](https://google.com) for more info';
		const result = parseMarkdownLinks(text);
		expect(result).toEqual([
			'Check out ',
			{ text: 'Google', href: 'https://google.com' },
			' for more info'
		]);
	});

	it('should parse multiple links', () => {
		const text = 'Visit [Site A](https://a.com) and [Site B](https://b.com)';
		const result = parseMarkdownLinks(text);
		expect(result).toEqual([
			'Visit ',
			{ text: 'Site A', href: 'https://a.com' },
			' and ',
			{ text: 'Site B', href: 'https://b.com' }
		]);
	});

	it('should parse bold text', () => {
		const text = 'This is **important** text';
		const result = parseMarkdownLinks(text);
		expect(result).toEqual(['This is ', { text: 'important', bold: true }, ' text']);
	});

	it('should parse mixed links and bold text', () => {
		const text = '**Important**: Visit [docs](https://docs.com) now';
		const result = parseMarkdownLinks(text);
		expect(result).toEqual([
			{ text: 'Important', bold: true },
			': Visit ',
			{ text: 'docs', href: 'https://docs.com' },
			' now'
		]);
	});

	it('should handle text starting with link', () => {
		const text = '[Home](/) is the main page';
		const result = parseMarkdownLinks(text);
		expect(result).toEqual([{ text: 'Home', href: '/' }, ' is the main page']);
	});

	it('should handle text ending with link', () => {
		const text = 'Go to [Home](/)';
		const result = parseMarkdownLinks(text);
		expect(result).toEqual(['Go to ', { text: 'Home', href: '/' }]);
	});

	it('should handle only link', () => {
		const text = '[Contact](/contact)';
		const result = parseMarkdownLinks(text);
		expect(result).toEqual([{ text: 'Contact', href: '/contact' }]);
	});

	it('should handle only bold', () => {
		const text = '**Warning**';
		const result = parseMarkdownLinks(text);
		expect(result).toEqual([{ text: 'Warning', bold: true }]);
	});

	it('should handle empty string', () => {
		const text = '';
		const result = parseMarkdownLinks(text);
		expect(result).toEqual(['']);
	});
});

describe('isExternalUrl', () => {
	it('should return true for https URLs', () => {
		expect(isExternalUrl('https://example.com')).toBe(true);
		expect(isExternalUrl('https://google.com/path')).toBe(true);
	});

	it('should return true for http URLs', () => {
		expect(isExternalUrl('http://example.com')).toBe(true);
		expect(isExternalUrl('http://test.org/page')).toBe(true);
	});

	it('should return false for relative URLs', () => {
		expect(isExternalUrl('/about')).toBe(false);
		expect(isExternalUrl('/contact/form')).toBe(false);
	});

	it('should return false for anchor links', () => {
		expect(isExternalUrl('#section')).toBe(false);
	});

	it('should return false for mail links', () => {
		expect(isExternalUrl('mailto:test@example.com')).toBe(false);
	});

	it('should return false for tel links', () => {
		expect(isExternalUrl('tel:+1234567890')).toBe(false);
	});
});

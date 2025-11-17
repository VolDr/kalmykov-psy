import { describe, it, expect } from 'vitest';
import { getPageContentWithDefaults, defaultPageContents } from './page-content.server';

describe('getPageContentWithDefaults', () => {
	describe('home page', () => {
		it('should return defaults when DB content is empty', () => {
			const result = getPageContentWithDefaults('home', {});

			expect(result.seo).toBeDefined();
			expect(result.seo.title).toBe(defaultPageContents.home.seo.title);
			expect(result.seo.description).toBe(defaultPageContents.home.seo.description);
			expect(result.hero).toBeDefined();
			expect(result.consultationInfo).toBeDefined();
		});

		it('should override defaults with DB content', () => {
			const customSeo = {
				title: 'Custom Title',
				description: 'Custom Description',
				ogImage: '/custom.webp'
			};

			const result = getPageContentWithDefaults('home', {
				seo: customSeo
			});

			expect(result.seo.title).toBe('Custom Title');
			expect(result.seo.description).toBe('Custom Description');
			expect(result.seo.ogImage).toBe('/custom.webp');
			// Other defaults should still be present
			expect(result.hero).toEqual(defaultPageContents.home.hero);
		});

		it('should merge partial DB content with defaults', () => {
			const partialHero = {
				title: 'New Hero Title',
				subtitle: 'New subtitle'
			};

			const result = getPageContentWithDefaults('home', {
				hero: partialHero
			});

			expect(result.hero.title).toBe('New Hero Title');
			expect(result.hero.subtitle).toBe('New subtitle');
			expect(result.seo).toEqual(defaultPageContents.home.seo);
		});

		it('should include additional DB content not in defaults', () => {
			const result = getPageContentWithDefaults('home', {
				customSection: { data: 'custom' }
			});

			expect(result.customSection).toEqual({ data: 'custom' });
			expect(result.seo).toEqual(defaultPageContents.home.seo);
		});
	});

	describe('online-therapy page', () => {
		it('should return all therapy blocks by default', () => {
			const result = getPageContentWithDefaults('online-therapy', {});

			expect(result.blocks).toBeDefined();
			expect(Array.isArray(result.blocks)).toBe(true);
			expect(result.blocks.length).toBeGreaterThan(0);
			expect(result.blocks[0].title).toBeDefined();
			expect(result.blocks[0].data).toBeDefined();
		});

		it('should override blocks with DB content', () => {
			const customBlocks = [
				{ title: 'Custom Block', data: ['Custom data'] }
			];

			const result = getPageContentWithDefaults('online-therapy', {
				blocks: customBlocks
			});

			expect(result.blocks).toEqual(customBlocks);
			expect(result.seo).toEqual(defaultPageContents['online-therapy'].seo);
		});

		it('should allow custom booking link', () => {
			const result = getPageContentWithDefaults('online-therapy', {
				bookingLink: 'https://custom.link'
			});

			expect(result.bookingLink).toBe('https://custom.link');
		});
	});

	describe('for-doctors page', () => {
		it('should return defaults for doctors page', () => {
			const result = getPageContentWithDefaults('for-doctors', {});

			expect(result.seo).toBeDefined();
			expect(result.hero).toBeDefined();
			expect(result.aboutText).toBeDefined();
			expect(Array.isArray(result.aboutText)).toBe(true);
			expect(result.problemsSection).toBeDefined();
			expect(result.requestsSection).toBeDefined();
			expect(result.exclusions).toBeDefined();
			expect(result.contact).toBeDefined();
		});

		it('should override contact information', () => {
			const customContact = {
				text: 'Custom text',
				subtext: 'Custom subtext',
				phone: '+7 999 999-99-99',
				phoneLink: 'tel:+79999999999',
				telegram: 't.me/custom',
				telegramLink: 'https://t.me/custom',
				conditionsLink: '/custom'
			};

			const result = getPageContentWithDefaults('for-doctors', {
				contact: customContact
			});

			expect(result.contact).toEqual(customContact);
		});

		it('should override exclusions list', () => {
			const customExclusions = ['Item 1', 'Item 2'];

			const result = getPageContentWithDefaults('for-doctors', {
				exclusions: customExclusions
			});

			expect(result.exclusions).toEqual(customExclusions);
		});
	});

	describe('sos page', () => {
		it('should return emergency contacts by default', () => {
			const result = getPageContentWithDefaults('sos', {});

			expect(result.contacts).toBeDefined();
			expect(Array.isArray(result.contacts)).toBe(true);
			expect(result.contacts.length).toBeGreaterThan(0);
			expect(result.contacts[0].title).toBeDefined();
			expect(result.contacts[0].phone).toBeDefined();
			expect(result.contacts[0].link).toBeDefined();
		});

		it('should allow adding new contacts', () => {
			const customContacts = [
				{
					title: 'Custom Emergency Line',
					phone: '+7 000 000-00-00',
					link: 'tel:+70000000000'
				}
			];

			const result = getPageContentWithDefaults('sos', {
				contacts: customContacts
			});

			expect(result.contacts).toEqual(customContacts);
		});
	});

	describe('articles page', () => {
		it('should return articles page defaults', () => {
			const result = getPageContentWithDefaults('articles', {});

			expect(result.seo.title).toContain('Статьи');
			expect(result.hero.title).toBe('Статьи');
			expect(result.hero.subtitle).toBeDefined();
		});
	});

	describe('surveys page', () => {
		it('should return surveys page defaults', () => {
			const result = getPageContentWithDefaults('surveys', {});

			expect(result.seo.title.toLowerCase()).toContain('опросник');
			expect(result.hero.title).toBe('Опросники');
			expect(result.hero.subtitle).toBeDefined();
		});
	});

	describe('edge cases', () => {
		it('should handle undefined DB values gracefully', () => {
			const result = getPageContentWithDefaults('home', {
				seo: undefined as any
			});

			// undefined should use the default value
			expect(result.seo).toEqual(defaultPageContents.home.seo);
		});

		it('should handle null DB values', () => {
			const result = getPageContentWithDefaults('home', {
				hero: null as any
			});

			expect(result.hero).toBeNull();
		});

		it('should handle empty arrays in DB content', () => {
			const result = getPageContentWithDefaults('sos', {
				contacts: []
			});

			expect(result.contacts).toEqual([]);
		});

		it('should preserve deeply nested objects from DB', () => {
			const nestedContent = {
				level1: {
					level2: {
						level3: 'deep value'
					}
				}
			};

			const result = getPageContentWithDefaults('home', {
				customNested: nestedContent
			});

			expect(result.customNested).toEqual(nestedContent);
		});

		it('should handle all page slugs', () => {
			const slugs: Array<keyof typeof defaultPageContents> = [
				'home',
				'online-therapy',
				'for-doctors',
				'sos',
				'articles',
				'surveys'
			];

			for (const slug of slugs) {
				const result = getPageContentWithDefaults(slug, {});
				expect(result.seo).toBeDefined();
				expect(result.hero).toBeDefined();
			}
		});
	});

	describe('SEO content validation', () => {
		it('should have all required SEO fields in defaults', () => {
			const pages: Array<keyof typeof defaultPageContents> = [
				'home',
				'online-therapy',
				'for-doctors',
				'sos',
				'articles',
				'surveys'
			];

			for (const page of pages) {
				const result = getPageContentWithDefaults(page, {});
				expect(result.seo.title).toBeTruthy();
				expect(result.seo.description).toBeTruthy();
				expect(result.seo.ogImage).toBeTruthy();
			}
		});

		it('should have non-empty hero content', () => {
			const pages: Array<keyof typeof defaultPageContents> = [
				'home',
				'online-therapy',
				'for-doctors',
				'sos',
				'articles',
				'surveys'
			];

			for (const page of pages) {
				const result = getPageContentWithDefaults(page, {});
				expect(result.hero.title).toBeTruthy();
				expect(typeof result.hero.title).toBe('string');
			}
		});
	});
});

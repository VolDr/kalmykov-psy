import { describe, it, expect } from 'vitest';
import {
	createEmptyBlock,
	blockMetadataRegistry,
	type BlockType,
	type PageHeroBlock,
	type ImageTextBlock,
	type CardGridBlock
} from './page-blocks';

describe('blockMetadataRegistry', () => {
	it('should contain all expected block types', () => {
		const expectedTypes: BlockType[] = [
			'page-hero',
			'image-text',
			'section-container',
			'card-grid',
			'text-block-section',
			'home-hero',
			'education',
			'faq',
			'consultation-info',
			'about-section',
			'issues-list'
		];

		const registeredTypes = blockMetadataRegistry.map((b) => b.type);

		expectedTypes.forEach((type) => {
			expect(registeredTypes).toContain(type);
		});
	});

	it('should have valid metadata for each block', () => {
		blockMetadataRegistry.forEach((meta) => {
			expect(meta.type).toBeTruthy();
			expect(meta.name).toBeTruthy();
			expect(meta.description).toBeTruthy();
			expect(['universal', 'unique']).toContain(meta.category);
			expect(meta.icon).toBeTruthy();
		});
	});

	it('should categorize blocks correctly', () => {
		const universalBlocks = blockMetadataRegistry.filter((b) => b.category === 'universal');
		const uniqueBlocks = blockMetadataRegistry.filter((b) => b.category === 'unique');

		expect(universalBlocks.length).toBeGreaterThan(0);
		expect(uniqueBlocks.length).toBeGreaterThan(0);

		// Universal blocks should include page-hero, image-text, etc.
		const universalTypes = universalBlocks.map((b) => b.type);
		expect(universalTypes).toContain('page-hero');
		expect(universalTypes).toContain('image-text');
		expect(universalTypes).toContain('card-grid');

		// Unique blocks should include home-hero, education, etc.
		const uniqueTypes = uniqueBlocks.map((b) => b.type);
		expect(uniqueTypes).toContain('home-hero');
		expect(uniqueTypes).toContain('education');
		expect(uniqueTypes).toContain('faq');
	});
});

describe('createEmptyBlock', () => {
	it('should create page-hero block with valid structure', () => {
		const block = createEmptyBlock('page-hero') as PageHeroBlock;

		expect(block.type).toBe('page-hero');
		expect(block.id).toBeTruthy();
		expect(block.sortOrder).toBe(0);
		expect(block.isActive).toBe(true);
		expect(block.config.title).toBeTruthy();
		expect(block.config.subtitle).toBeTruthy();
	});

	it('should create image-text block with valid structure', () => {
		const block = createEmptyBlock('image-text') as ImageTextBlock;

		expect(block.type).toBe('image-text');
		expect(block.config.image).toBeDefined();
		expect(block.config.image.src).toBeTruthy();
		expect(block.config.image.alt).toBeTruthy();
		expect(['image-left', 'image-right']).toContain(block.config.layout);
		expect(Array.isArray(block.config.paragraphs)).toBe(true);
	});

	it('should create card-grid block with valid structure', () => {
		const block = createEmptyBlock('card-grid') as CardGridBlock;

		expect(block.type).toBe('card-grid');
		expect(['1', '2', '3', '24']).toContain(block.config.cols);
		expect(Array.isArray(block.config.cards)).toBe(true);
	});

	it('should create consultation-info block with valid structure', () => {
		const block = createEmptyBlock('consultation-info');

		expect(block.type).toBe('consultation-info');
		if (block.type === 'consultation-info') {
			expect(block.config.price).toBeTruthy();
			expect(block.config.format).toBeTruthy();
			expect(block.config.duration).toBeTruthy();
		}
	});

	it('should generate unique IDs for each block', () => {
		const block1 = createEmptyBlock('page-hero');
		const block2 = createEmptyBlock('page-hero');

		expect(block1.id).not.toBe(block2.id);
	});

	it('should throw error for unknown block type', () => {
		expect(() => createEmptyBlock('unknown-type' as BlockType)).toThrow();
	});

	it('should create all block types without errors', () => {
		const allTypes: BlockType[] = [
			'page-hero',
			'image-text',
			'section-container',
			'card-grid',
			'text-block-section',
			'home-hero',
			'education',
			'faq',
			'consultation-info',
			'about-section',
			'issues-list'
		];

		allTypes.forEach((type) => {
			expect(() => createEmptyBlock(type)).not.toThrow();
			const block = createEmptyBlock(type);
			expect(block.type).toBe(type);
			expect(block.id).toBeTruthy();
			expect(typeof block.sortOrder).toBe('number');
			expect(typeof block.isActive).toBe('boolean');
		});
	});
});

describe('PageConfiguration structure', () => {
	it('should validate page configuration', () => {
		const pageConfig = {
			slug: 'test-page',
			name: 'Test Page',
			seo: {
				title: 'Test Title',
				description: 'Test Description',
				ogImage: '/test.webp'
			},
			blocks: [createEmptyBlock('page-hero'), createEmptyBlock('card-grid')]
		};

		expect(pageConfig.slug).toBeTruthy();
		expect(pageConfig.name).toBeTruthy();
		expect(pageConfig.seo.title).toBeTruthy();
		expect(pageConfig.seo.description).toBeTruthy();
		expect(Array.isArray(pageConfig.blocks)).toBe(true);
		expect(pageConfig.blocks.length).toBe(2);
	});
});

describe('Block sorting', () => {
	it('should maintain sortOrder for blocks', () => {
		const block1 = createEmptyBlock('page-hero');
		block1.sortOrder = 10;

		const block2 = createEmptyBlock('card-grid');
		block2.sortOrder = 20;

		const block3 = createEmptyBlock('text-block-section');
		block3.sortOrder = 5;

		const blocks = [block1, block2, block3];
		const sorted = [...blocks].sort((a, b) => a.sortOrder - b.sortOrder);

		expect(sorted[0].sortOrder).toBe(5);
		expect(sorted[1].sortOrder).toBe(10);
		expect(sorted[2].sortOrder).toBe(20);
	});
});

describe('Block active state', () => {
	it('should filter inactive blocks', () => {
		const block1 = createEmptyBlock('page-hero');
		block1.isActive = true;

		const block2 = createEmptyBlock('card-grid');
		block2.isActive = false;

		const block3 = createEmptyBlock('text-block-section');
		block3.isActive = true;

		const blocks = [block1, block2, block3];
		const activeBlocks = blocks.filter((b) => b.isActive);

		expect(activeBlocks.length).toBe(2);
		expect(activeBlocks.find((b) => b.type === 'card-grid')).toBeUndefined();
	});
});

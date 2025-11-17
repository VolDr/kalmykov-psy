// src/lib/canvas/clipboard.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
	clipboard,
	copySelectedShapes,
	cutSelectedShapes,
	pasteShapes,
	hasClipboardContent,
	clearClipboard,
	getClipboardCount,
	duplicateSelectedShapes
} from './clipboard';
import { shapesHistory, selection, setSelection } from './stores';
import type { RectShape, EllipseShape, ArrowShape, GroupShape } from './model/shapes';

describe('clipboard', () => {
	const createRect = (id: string, x = 100, y = 100): RectShape => ({
		id,
		type: 'rect',
		x,
		y,
		rotation: 0,
		scaleX: 1,
		scaleY: 1,
		stroke: '#000000',
		strokeWidth: 2,
		width: 100,
		height: 50,
		fill: '#ffffff'
	});

	const createEllipse = (id: string, x = 200, y = 200): EllipseShape => ({
		id,
		type: 'ellipse',
		x,
		y,
		rotation: 0,
		scaleX: 1,
		scaleY: 1,
		stroke: '#ff0000',
		strokeWidth: 3,
		rx: 50,
		ry: 30
	});

	const createArrow = (id: string, fromId?: string, toId?: string): ArrowShape => ({
		id,
		type: 'arrow',
		x: 0,
		y: 0,
		rotation: 0,
		scaleX: 1,
		scaleY: 1,
		stroke: '#000000',
		strokeWidth: 2,
		points: [
			[0, 0],
			[100, 100]
		],
		from: fromId ? { shapeId: fromId, anchor: 'right' } : undefined,
		to: toId ? { shapeId: toId, anchor: 'left' } : undefined
	});

	const createGroup = (id: string, children: string[]): GroupShape => ({
		id,
		type: 'group',
		x: 0,
		y: 0,
		rotation: 0,
		scaleX: 1,
		scaleY: 1,
		stroke: '#000000',
		strokeWidth: 0,
		children
	});

	beforeEach(() => {
		// Reset stores
		shapesHistory.setAllShapes([]);
		setSelection([]);
		clearClipboard();
	});

	describe('copySelectedShapes', () => {
		it('copies single selected shape', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);
			setSelection(['rect-1']);

			const count = copySelectedShapes();

			expect(count).toBe(1);
			expect(getClipboardCount()).toBe(1);

			const clipboardContent = get(clipboard);
			expect(clipboardContent[0].id).toBe('rect-1');
			expect(clipboardContent[0].type).toBe('rect');
		});

		it('copies multiple selected shapes', () => {
			const rect = createRect('rect-1');
			const ellipse = createEllipse('ellipse-1');
			shapesHistory.addShapes([rect, ellipse]);
			setSelection(['rect-1', 'ellipse-1']);

			const count = copySelectedShapes();

			expect(count).toBe(2);
			expect(getClipboardCount()).toBe(2);
		});

		it('returns 0 when nothing is selected', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);
			setSelection([]);

			const count = copySelectedShapes();

			expect(count).toBe(0);
			expect(getClipboardCount()).toBe(0);
		});

		it('overwrites previous clipboard content', () => {
			const rect1 = createRect('rect-1');
			const rect2 = createRect('rect-2', 200, 200);
			shapesHistory.addShapes([rect1, rect2]);

			setSelection(['rect-1']);
			copySelectedShapes();
			expect(getClipboardCount()).toBe(1);

			setSelection(['rect-2']);
			copySelectedShapes();
			expect(getClipboardCount()).toBe(1);

			const clipboardContent = get(clipboard);
			expect(clipboardContent[0].id).toBe('rect-2');
		});

		it('preserves shape properties when copying', () => {
			const rect = createRect('rect-1');
			rect.rotation = 45;
			rect.scaleX = 2;
			rect.fill = '#ff0000';
			shapesHistory.addShapes([rect]);
			setSelection(['rect-1']);

			copySelectedShapes();

			const clipboardContent = get(clipboard);
			const copied = clipboardContent[0] as RectShape;
			expect(copied.rotation).toBe(45);
			expect(copied.scaleX).toBe(2);
			expect(copied.fill).toBe('#ff0000');
		});
	});

	describe('pasteShapes', () => {
		it('pastes shapes with new IDs', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);
			setSelection(['rect-1']);
			copySelectedShapes();

			const newIds = pasteShapes();

			expect(newIds.length).toBe(1);
			expect(newIds[0]).not.toBe('rect-1');

			const state = get(shapesHistory);
			expect(state.shapes.length).toBe(2);
		});

		it('offsets pasted shapes by 20px', () => {
			const rect = createRect('rect-1', 100, 100);
			shapesHistory.addShapes([rect]);
			setSelection(['rect-1']);
			copySelectedShapes();

			pasteShapes();

			const state = get(shapesHistory);
			const pasted = state.shapes.find((s) => s.id !== 'rect-1');
			expect(pasted?.x).toBe(120);
			expect(pasted?.y).toBe(120);
		});

		it('increments offset for multiple pastes', () => {
			const rect = createRect('rect-1', 100, 100);
			shapesHistory.addShapes([rect]);
			setSelection(['rect-1']);
			copySelectedShapes();

			// First paste - offset 20
			pasteShapes();
			// Second paste - offset 40
			const secondPaste = pasteShapes();

			const state = get(shapesHistory);
			const secondPasted = state.shapes.find((s) => s.id === secondPaste[0]);
			expect(secondPasted?.x).toBe(140);
			expect(secondPasted?.y).toBe(140);
		});

		it('selects pasted shapes', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);
			setSelection(['rect-1']);
			copySelectedShapes();

			const newIds = pasteShapes();

			const sel = get(selection);
			expect(sel.ids.size).toBe(1);
			expect(sel.ids.has(newIds[0])).toBe(true);
		});

		it('returns empty array when clipboard is empty', () => {
			const newIds = pasteShapes();

			expect(newIds).toEqual([]);
			expect(get(shapesHistory).shapes.length).toBe(0);
		});

		it('pastes multiple shapes', () => {
			const rect = createRect('rect-1');
			const ellipse = createEllipse('ellipse-1');
			shapesHistory.addShapes([rect, ellipse]);
			setSelection(['rect-1', 'ellipse-1']);
			copySelectedShapes();

			const newIds = pasteShapes();

			expect(newIds.length).toBe(2);

			const state = get(shapesHistory);
			expect(state.shapes.length).toBe(4);
		});

		it('remaps arrow endpoints when source shapes are copied', () => {
			const rect = createRect('rect-1', 100, 100);
			const ellipse = createEllipse('ellipse-1', 300, 100);
			const arrow = createArrow('arrow-1', 'rect-1', 'ellipse-1');

			shapesHistory.addShapes([rect, ellipse, arrow]);
			setSelection(['rect-1', 'ellipse-1', 'arrow-1']);
			copySelectedShapes();

			const newIds = pasteShapes();

			const state = get(shapesHistory);
			const pastedArrow = state.shapes.find(
				(s) => s.type === 'arrow' && newIds.includes(s.id)
			) as ArrowShape;

			expect(pastedArrow.from).toBeDefined();
			expect(pastedArrow.to).toBeDefined();
			expect(pastedArrow.from?.shapeId).not.toBe('rect-1');
			expect(pastedArrow.to?.shapeId).not.toBe('ellipse-1');

			// Verify the remapped IDs are in the pasted set
			expect(newIds).toContain(pastedArrow.from?.shapeId);
			expect(newIds).toContain(pastedArrow.to?.shapeId);
		});

		it('removes arrow endpoints when source shapes are not copied', () => {
			const rect = createRect('rect-1', 100, 100);
			const arrow = createArrow('arrow-1', 'rect-1', undefined);

			shapesHistory.addShapes([rect, arrow]);
			setSelection(['arrow-1']); // Only copy arrow, not rect
			copySelectedShapes();

			const newIds = pasteShapes();

			const state = get(shapesHistory);
			const pastedArrow = state.shapes.find(
				(s) => s.type === 'arrow' && newIds.includes(s.id)
			) as ArrowShape;

			expect(pastedArrow.from).toBeUndefined();
		});

		it('remaps group children when they are copied', () => {
			const rect = createRect('rect-1');
			const ellipse = createEllipse('ellipse-1');
			const group = createGroup('group-1', ['rect-1', 'ellipse-1']);

			shapesHistory.addShapes([rect, ellipse, group]);
			setSelection(['rect-1', 'ellipse-1', 'group-1']);
			copySelectedShapes();

			const newIds = pasteShapes();

			const state = get(shapesHistory);
			const pastedGroup = state.shapes.find(
				(s) => s.type === 'group' && newIds.includes(s.id)
			) as GroupShape;

			expect(pastedGroup.children.length).toBe(2);
			expect(pastedGroup.children).not.toContain('rect-1');
			expect(pastedGroup.children).not.toContain('ellipse-1');

			// Verify children are in pasted set
			for (const childId of pastedGroup.children) {
				expect(newIds).toContain(childId);
			}
		});

		it('filters out non-copied group children', () => {
			const rect = createRect('rect-1');
			const group = createGroup('group-1', ['rect-1', 'non-existent-id']);

			shapesHistory.addShapes([rect, group]);
			setSelection(['rect-1', 'group-1']);
			copySelectedShapes();

			const newIds = pasteShapes();

			const state = get(shapesHistory);
			const pastedGroup = state.shapes.find(
				(s) => s.type === 'group' && newIds.includes(s.id)
			) as GroupShape;

			expect(pastedGroup.children.length).toBe(1);
		});
	});

	describe('cutSelectedShapes', () => {
		it('copies shapes to clipboard', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);
			setSelection(['rect-1']);

			const count = cutSelectedShapes();

			expect(count).toBe(1);
			expect(getClipboardCount()).toBe(1);
		});

		it('deletes shapes from scene', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);
			setSelection(['rect-1']);

			cutSelectedShapes();

			const state = get(shapesHistory);
			expect(state.shapes.length).toBe(0);
		});

		it('clears selection after cut', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);
			setSelection(['rect-1']);

			cutSelectedShapes();

			const sel = get(selection);
			expect(sel.ids.size).toBe(0);
		});

		it('returns 0 when nothing is selected', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);

			const count = cutSelectedShapes();

			expect(count).toBe(0);
			expect(get(shapesHistory).shapes.length).toBe(1);
		});

		it('cuts multiple shapes', () => {
			const rect = createRect('rect-1');
			const ellipse = createEllipse('ellipse-1');
			shapesHistory.addShapes([rect, ellipse]);
			setSelection(['rect-1', 'ellipse-1']);

			const count = cutSelectedShapes();

			expect(count).toBe(2);
			expect(get(shapesHistory).shapes.length).toBe(0);
		});
	});

	describe('duplicateSelectedShapes', () => {
		it('duplicates selected shapes', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);
			setSelection(['rect-1']);

			const newIds = duplicateSelectedShapes();

			expect(newIds.length).toBe(1);
			expect(get(shapesHistory).shapes.length).toBe(2);
		});

		it('selects duplicated shapes', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);
			setSelection(['rect-1']);

			const newIds = duplicateSelectedShapes();

			const sel = get(selection);
			expect(sel.ids.has(newIds[0])).toBe(true);
		});

		it('returns empty array when nothing selected', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);
			setSelection([]);

			const newIds = duplicateSelectedShapes();

			expect(newIds).toEqual([]);
		});

		it('offsets duplicated shapes', () => {
			const rect = createRect('rect-1', 100, 100);
			shapesHistory.addShapes([rect]);
			setSelection(['rect-1']);

			duplicateSelectedShapes();

			const state = get(shapesHistory);
			const duplicated = state.shapes.find((s) => s.id !== 'rect-1');
			expect(duplicated?.x).toBe(120);
			expect(duplicated?.y).toBe(120);
		});
	});

	describe('hasClipboardContent', () => {
		it('returns false when clipboard is empty', () => {
			expect(hasClipboardContent()).toBe(false);
		});

		it('returns true when clipboard has content', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);
			setSelection(['rect-1']);
			copySelectedShapes();

			expect(hasClipboardContent()).toBe(true);
		});

		it('returns false after clearing clipboard', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);
			setSelection(['rect-1']);
			copySelectedShapes();
			clearClipboard();

			expect(hasClipboardContent()).toBe(false);
		});
	});

	describe('clearClipboard', () => {
		it('clears clipboard content', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);
			setSelection(['rect-1']);
			copySelectedShapes();

			clearClipboard();

			expect(getClipboardCount()).toBe(0);
		});

		it('resets paste offset counter', () => {
			const rect = createRect('rect-1', 100, 100);
			shapesHistory.addShapes([rect]);
			setSelection(['rect-1']);
			copySelectedShapes();
			pasteShapes(); // First paste at offset 20
			pasteShapes(); // Second paste at offset 40

			clearClipboard();

			// Copy again
			setSelection(['rect-1']);
			copySelectedShapes();

			// Should start at offset 20 again
			const newIds = pasteShapes();
			const state = get(shapesHistory);
			const pasted = state.shapes.find((s) => s.id === newIds[0]);
			expect(pasted?.x).toBe(120); // 100 + 20
		});
	});

	describe('getClipboardCount', () => {
		it('returns 0 for empty clipboard', () => {
			expect(getClipboardCount()).toBe(0);
		});

		it('returns count of copied shapes', () => {
			const rect = createRect('rect-1');
			const ellipse = createEllipse('ellipse-1');
			shapesHistory.addShapes([rect, ellipse]);
			setSelection(['rect-1', 'ellipse-1']);
			copySelectedShapes();

			expect(getClipboardCount()).toBe(2);
		});
	});

	describe('edge cases', () => {
		it('handles pasting after scene is cleared', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);
			setSelection(['rect-1']);
			copySelectedShapes();

			shapesHistory.setAllShapes([]);

			const newIds = pasteShapes();
			expect(newIds.length).toBe(1);
			expect(get(shapesHistory).shapes.length).toBe(1);
		});

		it('preserves all shape types when copying', () => {
			const rect = createRect('rect-1');
			const ellipse = createEllipse('ellipse-1');
			const arrow = createArrow('arrow-1');
			const group = createGroup('group-1', []);

			shapesHistory.addShapes([rect, ellipse, arrow, group]);
			setSelection(['rect-1', 'ellipse-1', 'arrow-1', 'group-1']);
			copySelectedShapes();

			const clipboardContent = get(clipboard);
			const types = clipboardContent.map((s) => s.type);

			expect(types).toContain('rect');
			expect(types).toContain('ellipse');
			expect(types).toContain('arrow');
			expect(types).toContain('group');
		});

		it('can paste same content multiple times', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);
			setSelection(['rect-1']);
			copySelectedShapes();

			pasteShapes();
			pasteShapes();
			pasteShapes();

			const state = get(shapesHistory);
			expect(state.shapes.length).toBe(4);

			// All should have unique IDs
			const ids = state.shapes.map((s) => s.id);
			const uniqueIds = new Set(ids);
			expect(uniqueIds.size).toBe(4);
		});
	});
});

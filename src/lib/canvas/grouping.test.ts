// src/lib/canvas/grouping.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
	groupSelectedShapes,
	ungroupSelectedShapes,
	selectionContainsGroups,
	canGroupSelection,
	getGroupChildren,
	isShapeInGroup,
	getAllGroups
} from './grouping';
import { shapesHistory, selection, setSelection } from './stores';
import type { RectShape, EllipseShape, GroupShape, ArrowShape, TextShape } from './model/shapes';

describe('grouping', () => {
	const createRect = (id: string, x = 100, y = 100, width = 100, height = 50): RectShape => ({
		id,
		type: 'rect',
		x,
		y,
		rotation: 0,
		scaleX: 1,
		scaleY: 1,
		stroke: '#000000',
		strokeWidth: 2,
		width,
		height,
		fill: '#ffffff'
	});

	const createEllipse = (id: string, x = 200, y = 200, rx = 50, ry = 30): EllipseShape => ({
		id,
		type: 'ellipse',
		x,
		y,
		rotation: 0,
		scaleX: 1,
		scaleY: 1,
		stroke: '#ff0000',
		strokeWidth: 3,
		rx,
		ry
	});

	const createText = (id: string, x = 150, y = 150): TextShape => ({
		id,
		type: 'text',
		x,
		y,
		rotation: 0,
		scaleX: 1,
		scaleY: 1,
		stroke: '#000000',
		strokeWidth: 0,
		text: 'Hello',
		fontSize: 16,
		fontFamily: 'Arial',
		align: 'left'
	});

	const createArrow = (id: string): ArrowShape => ({
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
			[50, 50],
			[150, 100]
		]
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
		shapesHistory.setAllShapes([]);
		setSelection([]);
	});

	describe('groupSelectedShapes', () => {
		it('creates a group from two selected shapes', () => {
			const rect = createRect('rect-1');
			const ellipse = createEllipse('ellipse-1');
			shapesHistory.addShapes([rect, ellipse]);
			setSelection(['rect-1', 'ellipse-1']);

			const groupId = groupSelectedShapes();

			expect(groupId).toBeTruthy();

			const state = get(shapesHistory);
			const group = state.shapes.find((s) => s.id === groupId) as GroupShape;

			expect(group).toBeDefined();
			expect(group.type).toBe('group');
			expect(group.children).toContain('rect-1');
			expect(group.children).toContain('ellipse-1');
		});

		it('calculates bounds for the group', () => {
			const rect = createRect('rect-1', 100, 100, 100, 50);
			const ellipse = createEllipse('ellipse-1', 300, 200, 50, 30); // center at 300,200, size 100x60

			shapesHistory.addShapes([rect, ellipse]);
			setSelection(['rect-1', 'ellipse-1']);

			const groupId = groupSelectedShapes();
			const state = get(shapesHistory);
			const group = state.shapes.find((s) => s.id === groupId) as GroupShape;

			// Rect: x=100, width=100
			// Ellipse: center x=300, rx=50, so x from 250 to 350
			// Expected minX = 100, maxX = 350
			expect(group.x).toBe(100); // min x
			// Rect: y=100, height=50
			// Ellipse: center y=200, ry=30, so y from 170 to 230
			// Expected minY = 100, maxY = 230
			expect(group.y).toBe(100); // min y
		});

		it('selects the new group after creation', () => {
			const rect = createRect('rect-1');
			const ellipse = createEllipse('ellipse-1');
			shapesHistory.addShapes([rect, ellipse]);
			setSelection(['rect-1', 'ellipse-1']);

			const groupId = groupSelectedShapes();

			const sel = get(selection);
			expect(sel.ids.size).toBe(1);
			expect(sel.ids.has(groupId!)).toBe(true);
		});

		it('returns null when less than 2 shapes selected', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);
			setSelection(['rect-1']);

			const groupId = groupSelectedShapes();

			expect(groupId).toBeNull();
		});

		it('returns null when no shapes selected', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);
			setSelection([]);

			const groupId = groupSelectedShapes();

			expect(groupId).toBeNull();
		});

		it('handles grouping three or more shapes', () => {
			const rect = createRect('rect-1');
			const ellipse = createEllipse('ellipse-1');
			const text = createText('text-1');
			shapesHistory.addShapes([rect, ellipse, text]);
			setSelection(['rect-1', 'ellipse-1', 'text-1']);

			const groupId = groupSelectedShapes();

			const state = get(shapesHistory);
			const group = state.shapes.find((s) => s.id === groupId) as GroupShape;

			expect(group.children.length).toBe(3);
		});

		it('handles arrow shapes in bounds calculation', () => {
			const arrow = createArrow('arrow-1');
			const rect = createRect('rect-1', 200, 200);
			shapesHistory.addShapes([arrow, rect]);
			setSelection(['arrow-1', 'rect-1']);

			const groupId = groupSelectedShapes();

			const state = get(shapesHistory);
			const group = state.shapes.find((s) => s.id === groupId) as GroupShape;

			expect(group).toBeDefined();
			// Arrow points are [50,50] and [150,100], so bounds include those
			expect(group.x).toBeLessThanOrEqual(50);
		});

		it('handles shapes with scale', () => {
			const rect = createRect('rect-1', 100, 100, 100, 50);
			rect.scaleX = 2;
			rect.scaleY = 2;
			const ellipse = createEllipse('ellipse-1', 300, 200);

			shapesHistory.addShapes([rect, ellipse]);
			setSelection(['rect-1', 'ellipse-1']);

			const groupId = groupSelectedShapes();
			const state = get(shapesHistory);
			const group = state.shapes.find((s) => s.id === groupId) as GroupShape;

			// Rect with scale 2: width=200, height=100
			// x=100, so maxX = 300
			expect(group).toBeDefined();
		});
	});

	describe('ungroupSelectedShapes', () => {
		it('ungroups a selected group', () => {
			const rect = createRect('rect-1');
			const ellipse = createEllipse('ellipse-1');
			const group = createGroup('group-1', ['rect-1', 'ellipse-1']);
			shapesHistory.addShapes([rect, ellipse, group]);
			setSelection(['group-1']);

			const childIds = ungroupSelectedShapes();

			expect(childIds).toContain('rect-1');
			expect(childIds).toContain('ellipse-1');

			const state = get(shapesHistory);
			const groupExists = state.shapes.some((s) => s.id === 'group-1');
			expect(groupExists).toBe(false);
		});

		it('selects the children after ungrouping', () => {
			const rect = createRect('rect-1');
			const ellipse = createEllipse('ellipse-1');
			const group = createGroup('group-1', ['rect-1', 'ellipse-1']);
			shapesHistory.addShapes([rect, ellipse, group]);
			setSelection(['group-1']);

			ungroupSelectedShapes();

			const sel = get(selection);
			expect(sel.ids.has('rect-1')).toBe(true);
			expect(sel.ids.has('ellipse-1')).toBe(true);
			expect(sel.ids.has('group-1')).toBe(false);
		});

		it('returns empty array when no groups selected', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);
			setSelection(['rect-1']);

			const childIds = ungroupSelectedShapes();

			expect(childIds).toEqual([]);
		});

		it('handles ungrouping multiple groups at once', () => {
			const rect1 = createRect('rect-1');
			const rect2 = createRect('rect-2', 200, 200);
			const ellipse1 = createEllipse('ellipse-1');
			const ellipse2 = createEllipse('ellipse-2', 400, 400);
			const group1 = createGroup('group-1', ['rect-1', 'rect-2']);
			const group2 = createGroup('group-2', ['ellipse-1', 'ellipse-2']);

			shapesHistory.addShapes([rect1, rect2, ellipse1, ellipse2, group1, group2]);
			setSelection(['group-1', 'group-2']);

			const childIds = ungroupSelectedShapes();

			expect(childIds.length).toBe(4);
			expect(childIds).toContain('rect-1');
			expect(childIds).toContain('rect-2');
			expect(childIds).toContain('ellipse-1');
			expect(childIds).toContain('ellipse-2');

			const state = get(shapesHistory);
			expect(state.shapes.some((s) => s.id === 'group-1')).toBe(false);
			expect(state.shapes.some((s) => s.id === 'group-2')).toBe(false);
		});

		it('ignores non-group shapes in selection', () => {
			const rect = createRect('rect-1');
			const ellipse = createEllipse('ellipse-1');
			const group = createGroup('group-1', ['rect-1', 'ellipse-1']);
			const rect2 = createRect('rect-2', 300, 300);

			shapesHistory.addShapes([rect, ellipse, group, rect2]);
			setSelection(['group-1', 'rect-2']); // Select both group and non-group

			const childIds = ungroupSelectedShapes();

			expect(childIds).toContain('rect-1');
			expect(childIds).toContain('ellipse-1');
			expect(childIds.length).toBe(2); // Only group's children, not rect-2
		});
	});

	describe('selectionContainsGroups', () => {
		it('returns true when selection contains a group', () => {
			const group = createGroup('group-1', []);
			shapesHistory.addShapes([group]);
			setSelection(['group-1']);

			expect(selectionContainsGroups()).toBe(true);
		});

		it('returns false when selection has no groups', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);
			setSelection(['rect-1']);

			expect(selectionContainsGroups()).toBe(false);
		});

		it('returns false when nothing is selected', () => {
			const group = createGroup('group-1', []);
			shapesHistory.addShapes([group]);
			setSelection([]);

			expect(selectionContainsGroups()).toBe(false);
		});

		it('returns true when selection contains both groups and other shapes', () => {
			const rect = createRect('rect-1');
			const group = createGroup('group-1', []);
			shapesHistory.addShapes([rect, group]);
			setSelection(['rect-1', 'group-1']);

			expect(selectionContainsGroups()).toBe(true);
		});
	});

	describe('canGroupSelection', () => {
		it('returns true when 2 or more shapes are selected', () => {
			setSelection(['rect-1', 'ellipse-1']);
			expect(canGroupSelection()).toBe(true);
		});

		it('returns false when only 1 shape is selected', () => {
			setSelection(['rect-1']);
			expect(canGroupSelection()).toBe(false);
		});

		it('returns false when nothing is selected', () => {
			setSelection([]);
			expect(canGroupSelection()).toBe(false);
		});

		it('returns true for 3 selected shapes', () => {
			setSelection(['rect-1', 'ellipse-1', 'text-1']);
			expect(canGroupSelection()).toBe(true);
		});
	});

	describe('getGroupChildren', () => {
		it('returns children of a group', () => {
			const rect = createRect('rect-1');
			const ellipse = createEllipse('ellipse-1');
			const group = createGroup('group-1', ['rect-1', 'ellipse-1']);
			shapesHistory.addShapes([rect, ellipse, group]);

			const children = getGroupChildren('group-1');

			expect(children.length).toBe(2);
			expect(children.some((s) => s.id === 'rect-1')).toBe(true);
			expect(children.some((s) => s.id === 'ellipse-1')).toBe(true);
		});

		it('returns empty array for non-existent group', () => {
			const children = getGroupChildren('non-existent');
			expect(children).toEqual([]);
		});

		it('returns empty array for non-group shape', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);

			const children = getGroupChildren('rect-1');
			expect(children).toEqual([]);
		});

		it('returns empty array for group with no children', () => {
			const group = createGroup('group-1', []);
			shapesHistory.addShapes([group]);

			const children = getGroupChildren('group-1');
			expect(children).toEqual([]);
		});

		it('filters out missing children', () => {
			const rect = createRect('rect-1');
			const group = createGroup('group-1', ['rect-1', 'missing-shape']);
			shapesHistory.addShapes([rect, group]);

			const children = getGroupChildren('group-1');
			expect(children.length).toBe(1);
			expect(children[0].id).toBe('rect-1');
		});
	});

	describe('isShapeInGroup', () => {
		it('returns group ID if shape is in a group', () => {
			const rect = createRect('rect-1');
			const group = createGroup('group-1', ['rect-1']);
			shapesHistory.addShapes([rect, group]);

			const groupId = isShapeInGroup('rect-1');
			expect(groupId).toBe('group-1');
		});

		it('returns null if shape is not in any group', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);

			const groupId = isShapeInGroup('rect-1');
			expect(groupId).toBeNull();
		});

		it('returns null for non-existent shape', () => {
			const groupId = isShapeInGroup('non-existent');
			expect(groupId).toBeNull();
		});

		it('returns first matching group if shape is in multiple groups', () => {
			const rect = createRect('rect-1');
			const group1 = createGroup('group-1', ['rect-1']);
			const group2 = createGroup('group-2', ['rect-1']);
			shapesHistory.addShapes([rect, group1, group2]);

			const groupId = isShapeInGroup('rect-1');
			// Should return the first one found
			expect(groupId).toBeTruthy();
			expect(['group-1', 'group-2']).toContain(groupId);
		});
	});

	describe('getAllGroups', () => {
		it('returns all groups in the scene', () => {
			const rect = createRect('rect-1');
			const group1 = createGroup('group-1', ['rect-1']);
			const group2 = createGroup('group-2', []);
			shapesHistory.addShapes([rect, group1, group2]);

			const groups = getAllGroups();

			expect(groups.length).toBe(2);
			expect(groups.some((g) => g.id === 'group-1')).toBe(true);
			expect(groups.some((g) => g.id === 'group-2')).toBe(true);
		});

		it('returns empty array when no groups exist', () => {
			const rect = createRect('rect-1');
			shapesHistory.addShapes([rect]);

			const groups = getAllGroups();
			expect(groups).toEqual([]);
		});

		it('returns empty array for empty scene', () => {
			const groups = getAllGroups();
			expect(groups).toEqual([]);
		});
	});

	describe('integration', () => {
		it('group and ungroup round-trip', () => {
			const rect = createRect('rect-1');
			const ellipse = createEllipse('ellipse-1');
			shapesHistory.addShapes([rect, ellipse]);
			setSelection(['rect-1', 'ellipse-1']);

			// Group
			const groupId = groupSelectedShapes();
			expect(groupId).toBeTruthy();

			let state = get(shapesHistory);
			expect(state.shapes.length).toBe(3); // rect, ellipse, group

			// Ungroup
			setSelection([groupId!]);
			const childIds = ungroupSelectedShapes();

			expect(childIds).toContain('rect-1');
			expect(childIds).toContain('ellipse-1');

			state = get(shapesHistory);
			expect(state.shapes.length).toBe(2); // back to rect and ellipse only
		});

		it('nested grouping', () => {
			const rect = createRect('rect-1');
			const ellipse = createEllipse('ellipse-1');
			const text = createText('text-1');
			shapesHistory.addShapes([rect, ellipse, text]);

			// First group: rect + ellipse
			setSelection(['rect-1', 'ellipse-1']);
			const group1Id = groupSelectedShapes();

			// Second group: group1 + text
			setSelection([group1Id!, 'text-1']);
			const group2Id = groupSelectedShapes();

			const state = get(shapesHistory);
			const group2 = state.shapes.find((s) => s.id === group2Id) as GroupShape;

			expect(group2.children).toContain(group1Id);
			expect(group2.children).toContain('text-1');
		});
	});
});

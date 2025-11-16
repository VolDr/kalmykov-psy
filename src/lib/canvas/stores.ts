// src/lib/canvas/stores.ts
import { writable } from 'svelte/store';
import { createHistoryStore } from './model/history';
import type { Camera } from './model/shapes';

export const shapesHistory = createHistoryStore(50);

export const selection = writable<{
	ids: Set<string>;
}>({ ids: new Set() });

export const camera = writable<Camera>({
	x: 0,
	y: 0,
	scale: 1
});

// Tool modes for canvas operations
export type ToolMode = 'select' | 'rect' | 'ellipse' | 'arrow' | 'text' | 'pan';

export const currentTool = writable<ToolMode>('select');

export function setTool(tool: ToolMode) {
	currentTool.set(tool);
}

export function getToolCursor(tool: ToolMode): string {
	switch (tool) {
		case 'select':
			return 'default';
		case 'rect':
		case 'ellipse':
		case 'text':
			return 'crosshair';
		case 'arrow':
			return 'crosshair';
		case 'pan':
			return 'grab';
		default:
			return 'default';
	}
}

export function setSelection(ids: string[]) {
	selection.set({ ids: new Set(ids) });
}

export function toggleSelection(id: string, multi = false) {
	selection.update((s) => {
		const ids = new Set(s.ids);
		if (!multi) {
			if (ids.has(id) && ids.size === 1) {
				return { ids: new Set() };
			}
			return { ids: new Set([id]) };
		}
		if (ids.has(id)) ids.delete(id);
		else ids.add(id);
		return { ids };
	});
}

export function clearSelection() {
	selection.set({ ids: new Set() });
}

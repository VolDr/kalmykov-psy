// src/lib/canvas/model/history.ts
import { writable } from 'svelte/store';
import type { Shape } from './shapes';

export type HistoryActionType = 'add' | 'update' | 'delete' | 'set-all' | 'group' | 'ungroup';

export interface HistoryEntry {
	type: HistoryActionType;
	before: Shape[];
	after: Shape[];
}

interface HistoryState {
	shapes: Shape[];
	undoStack: HistoryEntry[];
	redoStack: HistoryEntry[];
}

export function createHistoryStore(maxHistory = 50) {
	const { subscribe, update } = writable<HistoryState>({
		shapes: [],
		undoStack: [],
		redoStack: []
	});

	function setAllShapes(shapes: Shape[]) {
		update((state) => ({
			...state,
			shapes
		}));
	}

	function addShapes(newShapes: Shape[]) {
		update((state) => {
			const entry: HistoryEntry = {
				type: 'add',
				before: [],
				after: newShapes
			};

			const shapes = [...state.shapes, ...newShapes];
			const undoStack = [...state.undoStack, entry].slice(-maxHistory);

			return {
				shapes,
				undoStack,
				redoStack: []
			};
		});
	}

	function updateShapes(updatedShapes: Shape[]) {
		update((state) => {
			const before: Shape[] = [];
			const after: Shape[] = [];

			const shapes = state.shapes.map((s) => {
				const found = updatedShapes.find((u) => u.id === s.id);
				if (!found) return s;
				before.push(s);
				after.push(found);
				return found;
			});

			if (!before.length) return state;

			const entry: HistoryEntry = {
				type: 'update',
				before,
				after
			};

			const undoStack = [...state.undoStack, entry].slice(-maxHistory);

			return {
				shapes,
				undoStack,
				redoStack: []
			};
		});
	}

	function deleteShapes(ids: string[]) {
		update((state) => {
			const before = state.shapes.filter((s) => ids.includes(s.id));
			if (!before.length) return state;

			const shapes = state.shapes.filter((s) => !ids.includes(s.id));

			const entry: HistoryEntry = {
				type: 'delete',
				before,
				after: []
			};

			const undoStack = [...state.undoStack, entry].slice(-maxHistory);

			return {
				shapes,
				undoStack,
				redoStack: []
			};
		});
	}

	function undo() {
		update((state) => {
			const last = state.undoStack[state.undoStack.length - 1];
			if (!last) return state;

			let shapes = [...state.shapes];

			switch (last.type) {
				case 'add':
					shapes = shapes.filter((s) => !last.after.some((a) => a.id === s.id));
					break;
				case 'delete':
					shapes = [...shapes, ...last.before];
					break;
				default:
					shapes = shapes.map((s) => {
						const before = last.before.find((b) => b.id === s.id);
						return before ?? s;
					});
					break;
			}

			const undoStack = state.undoStack.slice(0, -1);
			const redoStack = [...state.redoStack, last];

			return { shapes, undoStack, redoStack };
		});
	}

	function redo() {
		update((state) => {
			const last = state.redoStack[state.redoStack.length - 1];
			if (!last) return state;

			let shapes = [...state.shapes];

			switch (last.type) {
				case 'add':
					shapes = [...shapes, ...last.after];
					break;
				case 'delete':
					shapes = shapes.filter((s) => !last.before.some((b) => b.id === s.id));
					break;
				default:
					shapes = shapes.map((s) => {
						const after = last.after.find((a) => a.id === s.id);
						return after ?? s;
					});
					break;
			}

			const redoStack = state.redoStack.slice(0, -1);
			const undoStack = [...state.undoStack, last];

			return { shapes, undoStack, redoStack };
		});
	}

	return {
		subscribe,
		setAllShapes,
		addShapes,
		updateShapes,
		deleteShapes,
		undo,
		redo
	};
}

export type HistoryStore = ReturnType<typeof createHistoryStore>;

// src/lib/canvas/keyboard.ts
import { get } from 'svelte/store';
import { shapesHistory, selection, setSelection, clearSelection, setTool } from './stores';
import {
	copySelectedShapes,
	cutSelectedShapes,
	pasteShapes,
	duplicateSelectedShapes
} from './clipboard';
import {
	groupSelectedShapes,
	ungroupSelectedShapes,
	canGroupSelection,
	selectionContainsGroups
} from './grouping';
import { bringToFront, sendToBack, bringForward, sendBackward, selectAll } from './layers';
import { isEditingText, cancelTextEditing, commitTextEditing } from './text-editing';
import type { ToolMode } from './stores';

/**
 * Keyboard shortcut definition
 */
export interface KeyboardShortcut {
	key: string; // KeyboardEvent.code
	ctrl?: boolean;
	shift?: boolean;
	alt?: boolean;
	meta?: boolean;
	action: () => void;
	description: string;
	category: string;
	enabled?: () => boolean;
}

/**
 * Default keyboard shortcuts for the canvas
 */
export const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
	// Clipboard operations
	{
		key: 'KeyC',
		ctrl: true,
		action: copySelectedShapes,
		description: 'Copy selected shapes',
		category: 'clipboard'
	},
	{
		key: 'KeyX',
		ctrl: true,
		action: cutSelectedShapes,
		description: 'Cut selected shapes',
		category: 'clipboard'
	},
	{
		key: 'KeyV',
		ctrl: true,
		action: pasteShapes,
		description: 'Paste shapes',
		category: 'clipboard'
	},
	{
		key: 'KeyD',
		ctrl: true,
		action: duplicateSelectedShapes,
		description: 'Duplicate selected shapes',
		category: 'clipboard'
	},

	// History operations
	{
		key: 'KeyZ',
		ctrl: true,
		action: () => shapesHistory.undo(),
		description: 'Undo',
		category: 'history'
	},
	{
		key: 'KeyZ',
		ctrl: true,
		shift: true,
		action: () => shapesHistory.redo(),
		description: 'Redo',
		category: 'history'
	},
	{
		key: 'KeyY',
		ctrl: true,
		action: () => shapesHistory.redo(),
		description: 'Redo (alternative)',
		category: 'history'
	},

	// Selection operations
	{
		key: 'KeyA',
		ctrl: true,
		action: selectAll,
		description: 'Select all shapes',
		category: 'selection'
	},
	{
		key: 'Escape',
		action: () => {
			if (isEditingText()) {
				cancelTextEditing();
			} else {
				clearSelection();
			}
		},
		description: 'Clear selection / Cancel text editing',
		category: 'selection'
	},
	{
		key: 'Delete',
		action: () => {
			const sel = get(selection);
			if (sel.ids.size > 0) {
				shapesHistory.deleteShapes(Array.from(sel.ids));
				clearSelection();
			}
		},
		description: 'Delete selected shapes',
		category: 'selection',
		enabled: () => !isEditingText()
	},
	{
		key: 'Backspace',
		action: () => {
			const sel = get(selection);
			if (sel.ids.size > 0) {
				shapesHistory.deleteShapes(Array.from(sel.ids));
				clearSelection();
			}
		},
		description: 'Delete selected shapes',
		category: 'selection',
		enabled: () => !isEditingText()
	},

	// Grouping operations
	{
		key: 'KeyG',
		ctrl: true,
		action: () => {
			if (canGroupSelection()) {
				groupSelectedShapes();
			}
		},
		description: 'Group selected shapes',
		category: 'grouping'
	},
	{
		key: 'KeyG',
		ctrl: true,
		shift: true,
		action: () => {
			if (selectionContainsGroups()) {
				ungroupSelectedShapes();
			}
		},
		description: 'Ungroup selected shapes',
		category: 'grouping'
	},

	// Layer operations
	{
		key: 'BracketRight',
		ctrl: true,
		action: bringToFront,
		description: 'Bring to front',
		category: 'layers'
	},
	{
		key: 'BracketLeft',
		ctrl: true,
		action: sendToBack,
		description: 'Send to back',
		category: 'layers'
	},
	{
		key: 'BracketRight',
		action: bringForward,
		description: 'Bring forward',
		category: 'layers'
	},
	{
		key: 'BracketLeft',
		action: sendBackward,
		description: 'Send backward',
		category: 'layers'
	},

	// Tool switching
	{
		key: 'KeyV',
		action: () => setTool('select'),
		description: 'Select tool',
		category: 'tools',
		enabled: () => !isEditingText()
	},
	{
		key: 'KeyR',
		action: () => setTool('rect'),
		description: 'Rectangle tool',
		category: 'tools',
		enabled: () => !isEditingText()
	},
	{
		key: 'KeyE',
		action: () => setTool('ellipse'),
		description: 'Ellipse tool',
		category: 'tools',
		enabled: () => !isEditingText()
	},
	{
		key: 'KeyA',
		action: () => setTool('arrow'),
		description: 'Arrow tool',
		category: 'tools',
		enabled: () => !isEditingText()
	},
	{
		key: 'KeyT',
		action: () => setTool('text'),
		description: 'Text tool',
		category: 'tools',
		enabled: () => !isEditingText()
	},
	{
		key: 'KeyH',
		action: () => setTool('pan'),
		description: 'Pan tool',
		category: 'tools',
		enabled: () => !isEditingText()
	},

	// Text editing
	{
		key: 'Enter',
		action: () => {
			if (isEditingText()) {
				commitTextEditing();
			}
		},
		description: 'Commit text editing',
		category: 'text'
	}
];

/**
 * Check if a keyboard event matches a shortcut
 */
export function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
	// Check key code
	if (event.code !== shortcut.key) {
		return false;
	}

	// Check modifiers
	const ctrlOrMeta = event.ctrlKey || event.metaKey;
	const requiresCtrl = shortcut.ctrl || shortcut.meta;

	if (requiresCtrl && !ctrlOrMeta) {
		return false;
	}
	if (!requiresCtrl && ctrlOrMeta) {
		return false;
	}

	if (shortcut.shift && !event.shiftKey) {
		return false;
	}
	if (!shortcut.shift && event.shiftKey && shortcut.ctrl) {
		// If ctrl is required but shift is not, and shift is pressed, it's a different shortcut
		return false;
	}

	if (shortcut.alt && !event.altKey) {
		return false;
	}
	if (!shortcut.alt && event.altKey) {
		return false;
	}

	return true;
}

/**
 * Find matching shortcut for an event
 */
export function findShortcut(
	event: KeyboardEvent,
	shortcuts: KeyboardShortcut[] = DEFAULT_SHORTCUTS
): KeyboardShortcut | null {
	// Check shortcuts with more modifiers first (more specific)
	const sorted = [...shortcuts].sort((a, b) => {
		const aModifiers = (a.ctrl ? 1 : 0) + (a.shift ? 1 : 0) + (a.alt ? 1 : 0) + (a.meta ? 1 : 0);
		const bModifiers = (b.ctrl ? 1 : 0) + (b.shift ? 1 : 0) + (b.alt ? 1 : 0) + (b.meta ? 1 : 0);
		return bModifiers - aModifiers;
	});

	for (const shortcut of sorted) {
		if (matchesShortcut(event, shortcut)) {
			// Check if shortcut is enabled
			if (shortcut.enabled && !shortcut.enabled()) {
				continue;
			}
			return shortcut;
		}
	}

	return null;
}

/**
 * Handle a keyboard event and execute matching shortcut
 * Returns true if a shortcut was executed, false otherwise
 */
export function handleKeyboardEvent(
	event: KeyboardEvent,
	shortcuts: KeyboardShortcut[] = DEFAULT_SHORTCUTS
): boolean {
	const shortcut = findShortcut(event, shortcuts);

	if (shortcut) {
		event.preventDefault();
		shortcut.action();
		return true;
	}

	return false;
}

/**
 * Get all shortcuts grouped by category
 */
export function getShortcutsByCategory(
	shortcuts: KeyboardShortcut[] = DEFAULT_SHORTCUTS
): Map<string, KeyboardShortcut[]> {
	const grouped = new Map<string, KeyboardShortcut[]>();

	for (const shortcut of shortcuts) {
		const category = shortcut.category;
		if (!grouped.has(category)) {
			grouped.set(category, []);
		}
		grouped.get(category)!.push(shortcut);
	}

	return grouped;
}

/**
 * Format shortcut key combination for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
	const parts: string[] = [];

	if (shortcut.ctrl || shortcut.meta) {
		parts.push('Ctrl');
	}
	if (shortcut.shift) {
		parts.push('Shift');
	}
	if (shortcut.alt) {
		parts.push('Alt');
	}

	// Format key name
	let keyName = shortcut.key;
	if (keyName.startsWith('Key')) {
		keyName = keyName.substring(3);
	} else if (keyName === 'BracketLeft') {
		keyName = '[';
	} else if (keyName === 'BracketRight') {
		keyName = ']';
	}

	parts.push(keyName);

	return parts.join('+');
}

/**
 * Get shortcuts for a specific category
 */
export function getShortcutsForCategory(
	category: string,
	shortcuts: KeyboardShortcut[] = DEFAULT_SHORTCUTS
): KeyboardShortcut[] {
	return shortcuts.filter((s) => s.category === category);
}

/**
 * Create a custom shortcut
 */
export function createShortcut(
	key: string,
	action: () => void,
	description: string,
	category: string,
	options: {
		ctrl?: boolean;
		shift?: boolean;
		alt?: boolean;
		meta?: boolean;
		enabled?: () => boolean;
	} = {}
): KeyboardShortcut {
	return {
		key,
		action,
		description,
		category,
		...options
	};
}

/**
 * Merge custom shortcuts with defaults
 * Custom shortcuts override defaults with same key combination
 */
export function mergeShortcuts(
	customShortcuts: KeyboardShortcut[],
	baseShortcuts: KeyboardShortcut[] = DEFAULT_SHORTCUTS
): KeyboardShortcut[] {
	const merged = [...baseShortcuts];

	for (const custom of customShortcuts) {
		// Find and replace matching shortcut
		const index = merged.findIndex(
			(s) =>
				s.key === custom.key &&
				s.ctrl === custom.ctrl &&
				s.shift === custom.shift &&
				s.alt === custom.alt &&
				s.meta === custom.meta
		);

		if (index !== -1) {
			merged[index] = custom;
		} else {
			merged.push(custom);
		}
	}

	return merged;
}

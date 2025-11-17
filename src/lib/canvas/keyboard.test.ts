// src/lib/canvas/keyboard.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	matchesShortcut,
	findShortcut,
	handleKeyboardEvent,
	getShortcutsByCategory,
	formatShortcut,
	getShortcutsForCategory,
	createShortcut,
	mergeShortcuts,
	DEFAULT_SHORTCUTS,
	type KeyboardShortcut
} from './keyboard';
import { shapesHistory, setSelection } from './stores';

describe('keyboard', () => {
	const createKeyboardEvent = (
		code: string,
		options: {
			ctrlKey?: boolean;
			shiftKey?: boolean;
			altKey?: boolean;
			metaKey?: boolean;
		} = {}
	): KeyboardEvent => {
		return {
			code,
			ctrlKey: options.ctrlKey || false,
			shiftKey: options.shiftKey || false,
			altKey: options.altKey || false,
			metaKey: options.metaKey || false,
			preventDefault: vi.fn()
		} as unknown as KeyboardEvent;
	};

	beforeEach(() => {
		shapesHistory.setAllShapes([]);
		setSelection([]);
	});

	describe('matchesShortcut', () => {
		it('matches simple key', () => {
			const shortcut: KeyboardShortcut = {
				key: 'KeyV',
				action: vi.fn(),
				description: 'Test',
				category: 'test'
			};

			const event = createKeyboardEvent('KeyV');
			expect(matchesShortcut(event, shortcut)).toBe(true);
		});

		it('matches key with ctrl', () => {
			const shortcut: KeyboardShortcut = {
				key: 'KeyC',
				ctrl: true,
				action: vi.fn(),
				description: 'Copy',
				category: 'clipboard'
			};

			const event = createKeyboardEvent('KeyC', { ctrlKey: true });
			expect(matchesShortcut(event, shortcut)).toBe(true);
		});

		it('matches key with meta (Cmd on Mac)', () => {
			const shortcut: KeyboardShortcut = {
				key: 'KeyC',
				ctrl: true,
				action: vi.fn(),
				description: 'Copy',
				category: 'clipboard'
			};

			const event = createKeyboardEvent('KeyC', { metaKey: true });
			expect(matchesShortcut(event, shortcut)).toBe(true);
		});

		it('matches key with ctrl+shift', () => {
			const shortcut: KeyboardShortcut = {
				key: 'KeyZ',
				ctrl: true,
				shift: true,
				action: vi.fn(),
				description: 'Redo',
				category: 'history'
			};

			const event = createKeyboardEvent('KeyZ', { ctrlKey: true, shiftKey: true });
			expect(matchesShortcut(event, shortcut)).toBe(true);
		});

		it('does not match wrong key', () => {
			const shortcut: KeyboardShortcut = {
				key: 'KeyV',
				action: vi.fn(),
				description: 'Test',
				category: 'test'
			};

			const event = createKeyboardEvent('KeyC');
			expect(matchesShortcut(event, shortcut)).toBe(false);
		});

		it('does not match without required ctrl', () => {
			const shortcut: KeyboardShortcut = {
				key: 'KeyC',
				ctrl: true,
				action: vi.fn(),
				description: 'Copy',
				category: 'clipboard'
			};

			const event = createKeyboardEvent('KeyC');
			expect(matchesShortcut(event, shortcut)).toBe(false);
		});

		it('does not match with extra ctrl', () => {
			const shortcut: KeyboardShortcut = {
				key: 'KeyV',
				action: vi.fn(),
				description: 'Select tool',
				category: 'tools'
			};

			const event = createKeyboardEvent('KeyV', { ctrlKey: true });
			expect(matchesShortcut(event, shortcut)).toBe(false);
		});

		it('does not match without required shift', () => {
			const shortcut: KeyboardShortcut = {
				key: 'KeyZ',
				ctrl: true,
				shift: true,
				action: vi.fn(),
				description: 'Redo',
				category: 'history'
			};

			const event = createKeyboardEvent('KeyZ', { ctrlKey: true });
			expect(matchesShortcut(event, shortcut)).toBe(false);
		});

		it('matches key with alt', () => {
			const shortcut: KeyboardShortcut = {
				key: 'KeyA',
				alt: true,
				action: vi.fn(),
				description: 'Test',
				category: 'test'
			};

			const event = createKeyboardEvent('KeyA', { altKey: true });
			expect(matchesShortcut(event, shortcut)).toBe(true);
		});

		it('does not match with extra alt', () => {
			const shortcut: KeyboardShortcut = {
				key: 'KeyA',
				action: vi.fn(),
				description: 'Test',
				category: 'test'
			};

			const event = createKeyboardEvent('KeyA', { altKey: true });
			expect(matchesShortcut(event, shortcut)).toBe(false);
		});
	});

	describe('findShortcut', () => {
		const testShortcuts: KeyboardShortcut[] = [
			{
				key: 'KeyC',
				ctrl: true,
				action: vi.fn(),
				description: 'Copy',
				category: 'clipboard'
			},
			{
				key: 'KeyV',
				action: vi.fn(),
				description: 'Select tool',
				category: 'tools'
			},
			{
				key: 'KeyV',
				ctrl: true,
				action: vi.fn(),
				description: 'Paste',
				category: 'clipboard'
			},
			{
				key: 'KeyZ',
				ctrl: true,
				action: vi.fn(),
				description: 'Undo',
				category: 'history'
			},
			{
				key: 'KeyZ',
				ctrl: true,
				shift: true,
				action: vi.fn(),
				description: 'Redo',
				category: 'history'
			}
		];

		it('finds simple shortcut', () => {
			const event = createKeyboardEvent('KeyV');
			const shortcut = findShortcut(event, testShortcuts);

			expect(shortcut?.description).toBe('Select tool');
		});

		it('finds ctrl shortcut', () => {
			const event = createKeyboardEvent('KeyC', { ctrlKey: true });
			const shortcut = findShortcut(event, testShortcuts);

			expect(shortcut?.description).toBe('Copy');
		});

		it('prefers more specific shortcut (ctrl+shift over ctrl)', () => {
			const event = createKeyboardEvent('KeyZ', { ctrlKey: true, shiftKey: true });
			const shortcut = findShortcut(event, testShortcuts);

			expect(shortcut?.description).toBe('Redo');
		});

		it('returns null for unmatched shortcut', () => {
			const event = createKeyboardEvent('KeyX');
			const shortcut = findShortcut(event, testShortcuts);

			expect(shortcut).toBeNull();
		});

		it('respects enabled function', () => {
			const shortcuts: KeyboardShortcut[] = [
				{
					key: 'KeyV',
					action: vi.fn(),
					description: 'Disabled',
					category: 'test',
					enabled: () => false
				},
				{
					key: 'KeyV',
					action: vi.fn(),
					description: 'Enabled',
					category: 'test'
				}
			];

			const event = createKeyboardEvent('KeyV');
			const shortcut = findShortcut(event, shortcuts);

			expect(shortcut?.description).toBe('Enabled');
		});

		it('returns null if all matching shortcuts are disabled', () => {
			const shortcuts: KeyboardShortcut[] = [
				{
					key: 'KeyV',
					action: vi.fn(),
					description: 'Disabled',
					category: 'test',
					enabled: () => false
				}
			];

			const event = createKeyboardEvent('KeyV');
			const shortcut = findShortcut(event, shortcuts);

			expect(shortcut).toBeNull();
		});
	});

	describe('handleKeyboardEvent', () => {
		it('executes matching shortcut action', () => {
			const action = vi.fn();
			const shortcuts: KeyboardShortcut[] = [
				{
					key: 'KeyT',
					action,
					description: 'Test',
					category: 'test'
				}
			];

			const event = createKeyboardEvent('KeyT');
			const result = handleKeyboardEvent(event, shortcuts);

			expect(result).toBe(true);
			expect(action).toHaveBeenCalledOnce();
		});

		it('prevents default on matched shortcut', () => {
			const shortcuts: KeyboardShortcut[] = [
				{
					key: 'KeyC',
					ctrl: true,
					action: vi.fn(),
					description: 'Copy',
					category: 'clipboard'
				}
			];

			const event = createKeyboardEvent('KeyC', { ctrlKey: true });
			handleKeyboardEvent(event, shortcuts);

			expect(event.preventDefault).toHaveBeenCalled();
		});

		it('returns false for unmatched event', () => {
			const shortcuts: KeyboardShortcut[] = [
				{
					key: 'KeyT',
					action: vi.fn(),
					description: 'Test',
					category: 'test'
				}
			];

			const event = createKeyboardEvent('KeyX');
			const result = handleKeyboardEvent(event, shortcuts);

			expect(result).toBe(false);
		});

		it('does not prevent default for unmatched event', () => {
			const shortcuts: KeyboardShortcut[] = [
				{
					key: 'KeyT',
					action: vi.fn(),
					description: 'Test',
					category: 'test'
				}
			];

			const event = createKeyboardEvent('KeyX');
			handleKeyboardEvent(event, shortcuts);

			expect(event.preventDefault).not.toHaveBeenCalled();
		});
	});

	describe('getShortcutsByCategory', () => {
		it('groups shortcuts by category', () => {
			const shortcuts: KeyboardShortcut[] = [
				{
					key: 'KeyC',
					ctrl: true,
					action: vi.fn(),
					description: 'Copy',
					category: 'clipboard'
				},
				{
					key: 'KeyV',
					ctrl: true,
					action: vi.fn(),
					description: 'Paste',
					category: 'clipboard'
				},
				{
					key: 'KeyZ',
					ctrl: true,
					action: vi.fn(),
					description: 'Undo',
					category: 'history'
				}
			];

			const grouped = getShortcutsByCategory(shortcuts);

			expect(grouped.get('clipboard')?.length).toBe(2);
			expect(grouped.get('history')?.length).toBe(1);
		});

		it('returns empty map for no shortcuts', () => {
			const grouped = getShortcutsByCategory([]);
			expect(grouped.size).toBe(0);
		});
	});

	describe('formatShortcut', () => {
		it('formats simple key', () => {
			const shortcut: KeyboardShortcut = {
				key: 'KeyV',
				action: vi.fn(),
				description: 'Test',
				category: 'test'
			};

			expect(formatShortcut(shortcut)).toBe('V');
		});

		it('formats ctrl+key', () => {
			const shortcut: KeyboardShortcut = {
				key: 'KeyC',
				ctrl: true,
				action: vi.fn(),
				description: 'Copy',
				category: 'clipboard'
			};

			expect(formatShortcut(shortcut)).toBe('Ctrl+C');
		});

		it('formats ctrl+shift+key', () => {
			const shortcut: KeyboardShortcut = {
				key: 'KeyZ',
				ctrl: true,
				shift: true,
				action: vi.fn(),
				description: 'Redo',
				category: 'history'
			};

			expect(formatShortcut(shortcut)).toBe('Ctrl+Shift+Z');
		});

		it('formats alt+key', () => {
			const shortcut: KeyboardShortcut = {
				key: 'KeyA',
				alt: true,
				action: vi.fn(),
				description: 'Test',
				category: 'test'
			};

			expect(formatShortcut(shortcut)).toBe('Alt+A');
		});

		it('formats special keys', () => {
			const shortcut1: KeyboardShortcut = {
				key: 'BracketLeft',
				action: vi.fn(),
				description: 'Test',
				category: 'test'
			};

			const shortcut2: KeyboardShortcut = {
				key: 'BracketRight',
				action: vi.fn(),
				description: 'Test',
				category: 'test'
			};

			expect(formatShortcut(shortcut1)).toBe('[');
			expect(formatShortcut(shortcut2)).toBe(']');
		});

		it('formats Delete key', () => {
			const shortcut: KeyboardShortcut = {
				key: 'Delete',
				action: vi.fn(),
				description: 'Delete',
				category: 'selection'
			};

			expect(formatShortcut(shortcut)).toBe('Delete');
		});
	});

	describe('getShortcutsForCategory', () => {
		it('returns shortcuts for specific category', () => {
			const shortcuts: KeyboardShortcut[] = [
				{
					key: 'KeyC',
					ctrl: true,
					action: vi.fn(),
					description: 'Copy',
					category: 'clipboard'
				},
				{
					key: 'KeyZ',
					ctrl: true,
					action: vi.fn(),
					description: 'Undo',
					category: 'history'
				}
			];

			const clipboardShortcuts = getShortcutsForCategory('clipboard', shortcuts);

			expect(clipboardShortcuts.length).toBe(1);
			expect(clipboardShortcuts[0].description).toBe('Copy');
		});

		it('returns empty array for unknown category', () => {
			const shortcuts = getShortcutsForCategory('unknown');
			expect(shortcuts).toEqual([]);
		});
	});

	describe('createShortcut', () => {
		it('creates basic shortcut', () => {
			const action = vi.fn();
			const shortcut = createShortcut('KeyT', action, 'Test action', 'test');

			expect(shortcut.key).toBe('KeyT');
			expect(shortcut.action).toBe(action);
			expect(shortcut.description).toBe('Test action');
			expect(shortcut.category).toBe('test');
			expect(shortcut.ctrl).toBeUndefined();
		});

		it('creates shortcut with modifiers', () => {
			const action = vi.fn();
			const shortcut = createShortcut('KeyS', action, 'Save', 'file', {
				ctrl: true,
				shift: true
			});

			expect(shortcut.ctrl).toBe(true);
			expect(shortcut.shift).toBe(true);
		});

		it('creates shortcut with enabled function', () => {
			const action = vi.fn();
			const enabled = () => false;
			const shortcut = createShortcut('KeyT', action, 'Test', 'test', { enabled });

			expect(shortcut.enabled).toBe(enabled);
		});
	});

	describe('mergeShortcuts', () => {
		it('adds new shortcuts to base', () => {
			const base: KeyboardShortcut[] = [
				{
					key: 'KeyC',
					ctrl: true,
					action: vi.fn(),
					description: 'Copy',
					category: 'clipboard'
				}
			];

			const custom: KeyboardShortcut[] = [
				{
					key: 'KeyS',
					ctrl: true,
					action: vi.fn(),
					description: 'Save',
					category: 'file'
				}
			];

			const merged = mergeShortcuts(custom, base);

			expect(merged.length).toBe(2);
		});

		it('overrides existing shortcut with same key combination', () => {
			const base: KeyboardShortcut[] = [
				{
					key: 'KeyC',
					ctrl: true,
					action: vi.fn(),
					description: 'Original Copy',
					category: 'clipboard'
				}
			];

			const customAction = vi.fn();
			const custom: KeyboardShortcut[] = [
				{
					key: 'KeyC',
					ctrl: true,
					action: customAction,
					description: 'Custom Copy',
					category: 'clipboard'
				}
			];

			const merged = mergeShortcuts(custom, base);

			expect(merged.length).toBe(1);
			expect(merged[0].description).toBe('Custom Copy');
			expect(merged[0].action).toBe(customAction);
		});

		it('preserves base shortcuts not overridden', () => {
			const base: KeyboardShortcut[] = [
				{
					key: 'KeyC',
					ctrl: true,
					action: vi.fn(),
					description: 'Copy',
					category: 'clipboard'
				},
				{
					key: 'KeyV',
					ctrl: true,
					action: vi.fn(),
					description: 'Paste',
					category: 'clipboard'
				}
			];

			const custom: KeyboardShortcut[] = [
				{
					key: 'KeyC',
					ctrl: true,
					action: vi.fn(),
					description: 'Custom Copy',
					category: 'clipboard'
				}
			];

			const merged = mergeShortcuts(custom, base);

			expect(merged.length).toBe(2);
			expect(merged.find((s) => s.description === 'Paste')).toBeDefined();
		});
	});

	describe('DEFAULT_SHORTCUTS', () => {
		it('contains clipboard shortcuts', () => {
			const copy = DEFAULT_SHORTCUTS.find((s) => s.description === 'Copy selected shapes');
			const paste = DEFAULT_SHORTCUTS.find((s) => s.description === 'Paste shapes');
			const cut = DEFAULT_SHORTCUTS.find((s) => s.description === 'Cut selected shapes');

			expect(copy).toBeDefined();
			expect(paste).toBeDefined();
			expect(cut).toBeDefined();
		});

		it('contains history shortcuts', () => {
			const undo = DEFAULT_SHORTCUTS.find((s) => s.description === 'Undo');
			const redo = DEFAULT_SHORTCUTS.find((s) => s.description === 'Redo');

			expect(undo).toBeDefined();
			expect(redo).toBeDefined();
		});

		it('contains tool shortcuts', () => {
			const selectTool = DEFAULT_SHORTCUTS.find((s) => s.description === 'Select tool');
			const rectTool = DEFAULT_SHORTCUTS.find((s) => s.description === 'Rectangle tool');
			const ellipseTool = DEFAULT_SHORTCUTS.find((s) => s.description === 'Ellipse tool');

			expect(selectTool).toBeDefined();
			expect(rectTool).toBeDefined();
			expect(ellipseTool).toBeDefined();
		});

		it('contains grouping shortcuts', () => {
			const group = DEFAULT_SHORTCUTS.find((s) => s.description === 'Group selected shapes');
			const ungroup = DEFAULT_SHORTCUTS.find((s) => s.description === 'Ungroup selected shapes');

			expect(group).toBeDefined();
			expect(ungroup).toBeDefined();
		});

		it('contains layer shortcuts', () => {
			const bringToFront = DEFAULT_SHORTCUTS.find((s) => s.description === 'Bring to front');
			const sendToBack = DEFAULT_SHORTCUTS.find((s) => s.description === 'Send to back');

			expect(bringToFront).toBeDefined();
			expect(sendToBack).toBeDefined();
		});
	});
});

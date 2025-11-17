<script lang="ts">
	import { onDestroy } from 'svelte';
	import { currentTool, setTool, selection, shapesHistory, type ToolMode } from '../stores';
	import {
		groupSelectedShapes,
		ungroupSelectedShapes,
		canGroupSelection,
		selectionContainsGroups
	} from '../grouping';
	import {
		alignLeft,
		alignRight,
		alignCenterHorizontal,
		alignTop,
		alignBottom,
		alignCenterVertical,
		distributeHorizontally,
		distributeVertically,
		canAlign,
		canDistribute
	} from '../alignment';
	import { bringToFront, sendToBack, bringForward, sendBackward } from '../layers';
	import {
		copySelectedShapes,
		pasteShapes,
		cutSelectedShapes,
		duplicateSelectedShapes
	} from '../clipboard';
	import { icons } from './icons';

	const tools: { mode: ToolMode; icon: string; svg?: string; label: string; hotkey: string }[] = [
		{
			mode: 'select',
			icon: '',
			svg: icons.select,
			label: 'Select',
			hotkey: 'V'
		},
		{ mode: 'rect', icon: '▭', label: 'Rectangle', hotkey: 'R' },
		{ mode: 'ellipse', icon: '◯', label: 'Ellipse', hotkey: 'E' },
		{ mode: 'arrow', icon: '→', label: 'Arrow', hotkey: 'A' },
		{ mode: 'doubleArrow', icon: '↔', label: 'Double Arrow', hotkey: 'D' },
		{ mode: 'curvedArrow', icon: '⤴', label: 'Curved Arrow', hotkey: 'C' },
		{ mode: 'text', icon: 'T', label: 'Text', hotkey: 'T' },
		{ mode: 'pan', icon: '✋', label: 'Pan', hotkey: 'H' }
	];

	let activeTool: ToolMode = $state('select');
	let hasSelection = $state(false);
	let canGroup = $state(false);
	let hasGroups = $state(false);
	let canAlignShapes = $state(false);
	let canDistributeShapes = $state(false);

	const unsubscribeTool = currentTool.subscribe((tool) => {
		activeTool = tool;
	});

	const unsubscribeSelection = selection.subscribe((sel) => {
		hasSelection = sel.ids.size > 0;
		canGroup = canGroupSelection();
		hasGroups = selectionContainsGroups();
		canAlignShapes = canAlign();
		canDistributeShapes = canDistribute();
	});

	function handleToolClick(mode: ToolMode) {
		setTool(mode);
	}

	// Cleanup on destroy
	onDestroy(() => {
		unsubscribeTool();
		unsubscribeSelection();
	});
</script>

<div class="toolbar">
	<!-- Tool selection -->
	<div class="toolbar-section">
		{#each tools as tool}
			<button
				class="tool-button"
				class:active={activeTool === tool.mode}
				onclick={() => handleToolClick(tool.mode)}
				title="{tool.label} ({tool.hotkey})"
				aria-label="{tool.label} tool"
				aria-pressed={activeTool === tool.mode}
			>
				{#if tool.svg}
					<span class="tool-icon">{@html tool.svg}</span>
				{:else}
					<span class="tool-icon">{tool.icon}</span>
				{/if}
				<span class="tool-hotkey">{tool.hotkey}</span>
			</button>
		{/each}
	</div>

	<!-- Clipboard operations -->
	<div class="toolbar-section">
		<div class="section-label">Clipboard</div>
		<button
			class="action-button"
			onclick={() => copySelectedShapes()}
			disabled={!hasSelection}
			title="Copy (Ctrl+C)"
			aria-label="Copy selected shapes"
		>
			<span class="action-icon">📋</span>
		</button>
		<button
			class="action-button"
			onclick={() => cutSelectedShapes()}
			disabled={!hasSelection}
			title="Cut (Ctrl+X)"
			aria-label="Cut selected shapes"
		>
			<span class="action-icon">✂️</span>
		</button>
		<button
			class="action-button"
			onclick={() => pasteShapes()}
			title="Paste (Ctrl+V)"
			aria-label="Paste shapes"
		>
			<span class="action-icon">📄</span>
		</button>
		<button
			class="action-button"
			onclick={() => duplicateSelectedShapes()}
			disabled={!hasSelection}
			title="Duplicate (Ctrl+D)"
			aria-label="Duplicate selected shapes"
		>
			<span class="action-icon">⧉</span>
		</button>
	</div>

	<!-- Grouping operations -->
	<div class="toolbar-section">
		<div class="section-label">Group</div>
		<button
			class="action-button"
			onclick={() => groupSelectedShapes()}
			disabled={!canGroup}
			title="Group (Ctrl+G)"
			aria-label="Group selected shapes"
		>
			<span class="action-icon">⬚</span>
		</button>
		<button
			class="action-button"
			onclick={() => ungroupSelectedShapes()}
			disabled={!hasGroups}
			title="Ungroup (Ctrl+Shift+G)"
			aria-label="Ungroup selected shapes"
		>
			<span class="action-icon">⊟</span>
		</button>
	</div>

	<!-- Layer operations -->
	<div class="toolbar-section">
		<div class="section-label">Layers</div>
		<button
			class="action-button"
			onclick={() => bringToFront()}
			disabled={!hasSelection}
			title="Bring to Front"
			aria-label="Bring selected shapes to front"
		>
			<span class="action-icon">⬆⬆</span>
		</button>
		<button
			class="action-button"
			onclick={() => bringForward()}
			disabled={!hasSelection}
			title="Bring Forward"
			aria-label="Bring selected shapes forward"
		>
			<span class="action-icon">⬆</span>
		</button>
		<button
			class="action-button"
			onclick={() => sendBackward()}
			disabled={!hasSelection}
			title="Send Backward"
			aria-label="Send selected shapes backward"
		>
			<span class="action-icon">⬇</span>
		</button>
		<button
			class="action-button"
			onclick={() => sendToBack()}
			disabled={!hasSelection}
			title="Send to Back"
			aria-label="Send selected shapes to back"
		>
			<span class="action-icon">⬇⬇</span>
		</button>
	</div>
</div>

<style>
	.toolbar {
		position: absolute;
		top: 50%;
		left: 16px;
		transform: translateY(-50%);
		display: flex;
		flex-direction: column;
		gap: 4px;
		background: white;
		padding: 8px;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		z-index: 50;
		max-height: 90vh;
		overflow-y: auto;
	}

	.toolbar-section {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding-bottom: 8px;
		border-bottom: 1px solid #e0e0e0;
	}

	.toolbar-section:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.section-label {
		font-size: 10px;
		font-weight: 600;
		color: #666;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		padding: 2px 0;
	}

	.button-row {
		display: flex;
		gap: 4px;
	}

	.tool-button {
		position: relative;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid #e0e0e0;
		border-radius: 6px;
		background: white;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.tool-button:hover {
		background: #f5f5f5;
		border-color: #ccc;
	}

	.tool-button.active {
		background: #e3f2fd;
		border-color: #2196f3;
		color: #1976d2;
	}

	.tool-icon {
		font-size: 18px;
		line-height: 1;
	}

	.tool-hotkey {
		position: absolute;
		bottom: 2px;
		right: 3px;
		font-size: 9px;
		color: #999;
		font-weight: 500;
	}

	.tool-button.active .tool-hotkey {
		color: #1976d2;
	}

	.tool-button:focus {
		outline: 2px solid #2196f3;
		outline-offset: 2px;
	}

	.action-button {
		width: 40px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid #e0e0e0;
		border-radius: 4px;
		background: white;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.action-button.small {
		width: 32px;
		height: 28px;
	}

	.action-button:hover:not(:disabled) {
		background: #f5f5f5;
		border-color: #ccc;
	}

	.action-button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.action-button:focus {
		outline: 2px solid #2196f3;
		outline-offset: 1px;
	}

	.action-icon {
		font-size: 14px;
		line-height: 1;
	}

	.action-button.small .action-icon {
		font-size: 12px;
	}
</style>

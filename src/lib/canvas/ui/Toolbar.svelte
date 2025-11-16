<script lang="ts">
	import { currentTool, setTool, type ToolMode } from '../stores';

	const tools: { mode: ToolMode; icon: string; label: string; hotkey: string }[] = [
		{ mode: 'select', icon: '↖', label: 'Select', hotkey: 'V' },
		{ mode: 'rect', icon: '▭', label: 'Rectangle', hotkey: 'R' },
		{ mode: 'ellipse', icon: '◯', label: 'Ellipse', hotkey: 'E' },
		{ mode: 'arrow', icon: '→', label: 'Arrow', hotkey: 'A' },
		{ mode: 'text', icon: 'T', label: 'Text', hotkey: 'T' },
		{ mode: 'pan', icon: '✋', label: 'Pan', hotkey: 'H' }
	];

	let activeTool: ToolMode = $state('select');

	const unsubscribe = currentTool.subscribe((tool) => {
		activeTool = tool;
	});

	function handleToolClick(mode: ToolMode) {
		setTool(mode);
	}

	// Cleanup on destroy
	import { onDestroy } from 'svelte';
	onDestroy(() => {
		unsubscribe();
	});
</script>

<div class="toolbar">
	{#each tools as tool}
		<button
			class="tool-button"
			class:active={activeTool === tool.mode}
			onclick={() => handleToolClick(tool.mode)}
			title="{tool.label} ({tool.hotkey})"
			aria-label="{tool.label} tool"
			aria-pressed={activeTool === tool.mode}
		>
			<span class="tool-icon">{tool.icon}</span>
			<span class="tool-hotkey">{tool.hotkey}</span>
		</button>
	{/each}
</div>

<style>
	.toolbar {
		position: absolute;
		top: 50%;
		left: 16px;
		transform: translateY(-50%);
		display: flex;
		flex-direction: column;
		gap: 8px;
		background: white;
		padding: 8px;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		z-index: 50;
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
</style>

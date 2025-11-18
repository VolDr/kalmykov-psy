<script lang="ts">
	import { selection, shapesHistory } from '../stores';
	import { clearRoughCache } from '../engine/rough';
	import type { Shape } from '../model/shapes';

	// Color presets - основные цвета + черный
	const STROKE_COLORS = [
		'#000000', // Black
		'#e03131', // Red
		'#2f9e44', // Green
		'#1971c2', // Blue
		'#f59f00', // Orange
		'#7950f2', // Purple
		'#495057' // Dark gray
	];

	const FILL_COLORS = [
		'#ffe3e3', // Light red
		'#d3f9d8', // Light green
		'#d0ebff', // Light blue
		'#fff3bf', // Light yellow
		'#e5dbff', // Light purple
		'#f1f3f5' // Light gray
	];

	let selectedShapes = $derived.by(() => {
		return $shapesHistory.shapes.filter((s) => $selection.ids.has(s.id));
	});

	let hasSelection = $derived(selectedShapes.length > 0);

	// Get current stroke color from first selected shape
	let currentStroke = $derived(selectedShapes[0]?.stroke || '#000000');

	// Get current fill color from first selected shape
	let currentFill = $derived(selectedShapes[0]?.fill || null);

	// Get current fill style from first selected shape
	let currentFillStyle = $derived.by(() => {
		const shape = selectedShapes[0];
		if (!shape || shape.type === 'arrow' || shape.type === 'text' || shape.type === 'group') {
			return 'none';
		}
		if (!shape.fill) return 'none';
		return (shape.roughOptions?.fillStyle as string) || 'solid';
	});

	function updateShapesStyle(updates: {
		stroke?: string;
		fill?: string | null;
		fillStyle?: 'solid' | 'none';
	}) {
		if (selectedShapes.length === 0) return;

		const updatedShapes = selectedShapes.map((shape) => {
			const updated = { ...shape };

			if (updates.stroke !== undefined) {
				updated.stroke = updates.stroke;
			}

			if (updates.fillStyle !== undefined) {
				if (updates.fillStyle === 'none') {
					// Remove fill
					updated.fill = null;
				} else if (updates.fillStyle === 'solid') {
					// Set solid fill - use current fill color or default
					if (!updated.fill) {
						updated.fill = FILL_COLORS[0]; // Default to first fill color
					}
					// Update roughOptions for shapes that support it
					if (updated.type === 'rect' || updated.type === 'ellipse') {
						if (!updated.roughOptions) {
							updated.roughOptions = {
								roughness: 1,
								bowing: 1,
								seed: Math.floor(Math.random() * 2147483647),
								fillStyle: 'solid'
							};
						} else {
							updated.roughOptions = { ...updated.roughOptions, fillStyle: 'solid' };
						}
					}
				}
			}

			if (updates.fill !== undefined && updates.fill !== null) {
				updated.fill = updates.fill;
				// Ensure fillStyle is set to solid when setting fill color
				if (updated.type === 'rect' || updated.type === 'ellipse') {
					if (!updated.roughOptions) {
						updated.roughOptions = {
							roughness: 1,
							bowing: 1,
							seed: Math.floor(Math.random() * 2147483647),
							fillStyle: 'solid'
						};
					} else {
						updated.roughOptions = { ...updated.roughOptions, fillStyle: 'solid' };
					}
				}
			}

			// Invalidate cache for rough shapes
			if (updated.type === 'rect' || updated.type === 'ellipse' || updated.type === 'arrow') {
				clearRoughCache();
			}

			return updated;
		});

		shapesHistory.updateShapes(updatedShapes);
	}

	function handleStrokeColorClick(color: string) {
		updateShapesStyle({ stroke: color });
	}

	function handleFillColorClick(color: string) {
		updateShapesStyle({ fill: color, fillStyle: 'solid' });
	}

	function handleFillStyleChange(style: 'solid' | 'none') {
		updateShapesStyle({ fillStyle: style });
	}

	// Check if shape supports fill (rect and ellipse only)
	let supportsFill = $derived.by(() => {
		if (selectedShapes.length === 0) return false;
		return selectedShapes.some((s) => s.type === 'rect' || s.type === 'ellipse');
	});
</script>

{#if hasSelection}
	<div class="style-panel">
		<!-- Stroke color section -->
		<div class="panel-section">
			<div class="section-label">Цвет линии</div>
			<div class="color-grid">
				{#each STROKE_COLORS as color}
					<button
						class="color-button"
						class:selected={currentStroke === color}
						style="background-color: {color};"
						onclick={() => handleStrokeColorClick(color)}
						title="Stroke color: {color}"
						aria-label="Set stroke color to {color}"
					>
						{#if currentStroke === color}
							<span class="checkmark">✓</span>
						{/if}
					</button>
				{/each}
			</div>
		</div>

		<!-- Fill section (only for rect and ellipse) -->
		{#if supportsFill}
			<div class="panel-section">
				<div class="section-label">Заливка</div>

				<!-- Fill style toggle -->
				<div class="fill-style-toggle">
					<button
						class="toggle-button"
						class:active={currentFillStyle === 'none'}
						onclick={() => handleFillStyleChange('none')}
						title="No fill"
						aria-label="No fill"
					>
						Нет
					</button>
					<button
						class="toggle-button"
						class:active={currentFillStyle === 'solid'}
						onclick={() => handleFillStyleChange('solid')}
						title="Solid fill"
						aria-label="Solid fill"
					>
						Сплошная
					</button>
				</div>

				<!-- Fill colors (only shown when fill is enabled) -->
				{#if currentFillStyle !== 'none'}
					<div class="color-grid">
						{#each FILL_COLORS as color}
							<button
								class="color-button"
								class:selected={currentFill === color}
								style="background-color: {color}; border: 1px solid #ddd;"
								onclick={() => handleFillColorClick(color)}
								title="Fill color: {color}"
								aria-label="Set fill color to {color}"
							>
								{#if currentFill === color}
									<span class="checkmark">✓</span>
								{/if}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}

<style>
	.style-panel {
		position: absolute;
		top: 16px;
		right: 16px;
		background: white;
		padding: 12px;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		z-index: 50;
		min-width: 200px;
	}

	.panel-section {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding-bottom: 12px;
		border-bottom: 1px solid #e0e0e0;
	}

	.panel-section:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.section-label {
		font-size: 11px;
		font-weight: 600;
		color: #666;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.color-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 6px;
	}

	.color-button {
		position: relative;
		width: 36px;
		height: 36px;
		border-radius: 6px;
		border: 2px solid transparent;
		cursor: pointer;
		transition: all 0.15s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.color-button:hover {
		transform: scale(1.1);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.color-button.selected {
		border-color: #2196f3;
		box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
	}

	.checkmark {
		color: white;
		font-size: 16px;
		font-weight: bold;
		text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
	}

	/* For light colors, use dark checkmark */
	.color-button[style*='#fff'],
	.color-button[style*='#f1f3f5'],
	.color-button[style*='#ffe3e3'],
	.color-button[style*='#d3f9d8'],
	.color-button[style*='#d0ebff'],
	.color-button[style*='#fff3bf'],
	.color-button[style*='#e5dbff'] {
		.checkmark {
			color: #000;
			text-shadow: none;
		}
	}

	.fill-style-toggle {
		display: flex;
		gap: 4px;
	}

	.toggle-button {
		flex: 1;
		padding: 6px 12px;
		font-size: 12px;
		border: 1px solid #e0e0e0;
		border-radius: 4px;
		background: white;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.toggle-button:hover {
		background: #f5f5f5;
		border-color: #ccc;
	}

	.toggle-button.active {
		background: #e3f2fd;
		border-color: #2196f3;
		color: #1976d2;
		font-weight: 600;
	}

	.toggle-button:focus {
		outline: 2px solid #2196f3;
		outline-offset: 1px;
	}
</style>

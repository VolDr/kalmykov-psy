<script lang="ts">
	import { onMount } from 'svelte';
	import type { Shape, TextShape, RectShape, EllipseShape } from '../model/shapes';
	import { camera } from '../stores';
	import { CANVAS_FONT_FAMILY, DEFAULT_FONT_SIZE } from '../constants';

	interface Props {
		shape: Shape;
		text: string;
		onSubmit: (text: string) => void;
		onCancel: () => void;
	}

	let { shape, text = '', onSubmit, onCancel }: Props = $props();

	let textareaElement: HTMLTextAreaElement | null = $state(null);
	let currentText = $state(text);
	let cam = $state({ x: 0, y: 0, scale: 1 });

	// Update currentText when text prop changes
	$effect(() => {
		currentText = text;
	});

	// Subscribe to camera changes
	const unsubscribeCamera = camera.subscribe((c) => {
		cam = c;
	});

	// Calculate textarea position and size based on shape
	const editorStyle = $derived(() => {
		const bounds = getShapeBounds(shape);

		// Convert world coordinates to screen coordinates
		const screenX = bounds.x * cam.scale + cam.x;
		const screenY = bounds.y * cam.scale + cam.y;
		const screenWidth = bounds.width * cam.scale;
		const screenHeight = bounds.height * cam.scale;

		// Calculate transform origin (center of the shape)
		const centerX = screenX + screenWidth / 2;
		const centerY = screenY + screenHeight / 2;

		// Get font size scaled by camera
		const fontSize =
			shape.type === 'text' ? shape.fontSize * cam.scale : DEFAULT_FONT_SIZE * cam.scale;

		// Build transform string
		const rotation = shape.rotation || 0;
		const transform = `translate(${screenX}px, ${screenY}px) rotate(${rotation}deg)`;

		return {
			transform,
			width: `${Math.max(screenWidth, 100)}px`,
			minHeight: `${Math.max(screenHeight, 30)}px`,
			fontSize: `${fontSize}px`,
			fontFamily: shape.type === 'text' ? shape.fontFamily : CANVAS_FONT_FAMILY,
			textAlign: shape.type === 'text' ? shape.align : 'center'
		};
	});

	function getShapeBounds(shape: Shape): { x: number; y: number; width: number; height: number } {
		if (shape.type === 'rect') {
			const rect = shape as RectShape;
			return {
				x: rect.x - rect.width / 2,
				y: rect.y - rect.height / 2,
				width: rect.width,
				height: rect.height
			};
		} else if (shape.type === 'ellipse') {
			const ellipse = shape as EllipseShape;
			return {
				x: ellipse.x - ellipse.rx,
				y: ellipse.y - ellipse.ry,
				width: ellipse.rx * 2,
				height: ellipse.ry * 2
			};
		} else if (shape.type === 'text') {
			const textShape = shape as TextShape;
			const width = textShape.width ?? textShape.text.length * textShape.fontSize * 0.6;
			const height = textShape.height ?? textShape.fontSize * 1.2;
			return {
				x: textShape.x - width / 2,
				y: textShape.y - height / 2,
				width,
				height
			};
		}
		return { x: shape.x, y: shape.y, width: 100, height: 30 };
	}

	function handleInput(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		currentText = target.value;
	}

	function handleKeyDown(e: KeyboardEvent) {
		// Prevent event propagation to canvas
		e.stopPropagation();

		if (e.key === 'Escape') {
			e.preventDefault();
			onCancel();
		} else if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			onSubmit(currentText);
		}
		// Shift+Enter allows new line
	}

	function handleBlur() {
		// Submit on blur
		onSubmit(currentText);
	}

	onMount(() => {
		// Focus and select all text when mounted
		if (textareaElement) {
			textareaElement.focus();
			textareaElement.select();
		}

		return () => {
			unsubscribeCamera();
		};
	});
</script>

<!-- Container with pointer-events: none to allow canvas interactions -->
<div class="text-editor-container" style="pointer-events: none;">
	<!-- Textarea with pointer-events: auto to capture input -->
	<textarea
		bind:this={textareaElement}
		class="text-editor-textarea"
		style="
      {editorStyle().transform};
      width: {editorStyle().width};
      min-height: {editorStyle().minHeight};
      font-size: {editorStyle().fontSize};
      font-family: {editorStyle().fontFamily};
      text-align: {editorStyle().textAlign};
      pointer-events: auto;
    "
		value={currentText}
		oninput={handleInput}
		onkeydown={handleKeyDown}
		onblur={handleBlur}
		onfocus={(e) => {
			// Select all on focus
			const target = e.target as HTMLTextAreaElement;
			target.select();
		}}
	></textarea>
</div>

<style>
	.text-editor-container {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 1000;
		pointer-events: none;
	}

	.text-editor-textarea {
		position: absolute;
		top: 0;
		left: 0;
		resize: none;
		border: 2px solid #9333ea;
		border-radius: 4px;
		background: rgba(255, 255, 255, 0.95);
		padding: 4px 8px;
		outline: none;
		overflow: hidden;
		line-height: 1.4;
		transform-origin: top left;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	.text-editor-textarea:focus {
		border-color: #7c3aed;
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 0 0 3px rgba(147, 51, 234, 0.1);
	}
</style>

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	interface Props {
		editable: boolean;
		name: string;
		value: number;
	}

	let { editable, name, value }: Props = $props();

	let currValue = $state(value);
	let sliderRef: HTMLDivElement | null = $state(null);
	let thumbRef: HTMLDivElement | null = $state(null);
	let trackFillRef: HTMLDivElement | null = $state(null);
	let isDragging = $state(false);
	let animationFrameId: number | null = null;

	// Update value and dispatch input event with debounce for smoother visuals
	const updateValue = (newValue: number) => {
		if (!browser) return;

		// Cancel any pending animation frame
		if (animationFrameId !== null) {
			cancelAnimationFrame(animationFrameId);
		}

		// Schedule the update using requestAnimationFrame for smoother rendering
		animationFrameId = requestAnimationFrame(() => {
			currValue = newValue;

			// Apply direct style changes for even smoother updates
			if (thumbRef && sliderRef) {
				const percentage = (newValue / 10) * 100;

				if (trackFillRef) {
					trackFillRef.style.width = `${percentage}%`;
				}

				thumbRef.style.left = `calc(${percentage}% - 0.5rem)`;
			}

			// Update hidden form input
			const hiddenInput = document.querySelector(`input[name="${name}"]`) as HTMLInputElement;
			if (hiddenInput) {
				hiddenInput.value = newValue.toString();
				hiddenInput.dispatchEvent(new Event('input', { bubbles: true }));
			}

			animationFrameId = null;
		});
	};

	// Calculate value based on pointer position with improved precision
	const calculateValue = (clientX: number): number => {
		if (!sliderRef) return currValue;

		const slider = sliderRef;
		const rect = slider.getBoundingClientRect();
		const offsetX = clientX - rect.left;
		const percentage = Math.min(Math.max(offsetX / rect.width, 0), 1);

		// Enhanced precision with step: 0.005
		return Math.round(percentage * 10 * 200) / 200;
	};

	// Handle slider track click/tap
	const handleTrackInteraction = (clientX: number) => {
		if (!editable) return;
		updateValue(calculateValue(clientX));
	};

	// Mouse event handlers
	const handleTrackClick = (e: MouseEvent) => {
		handleTrackInteraction(e.clientX);
	};

	const handleThumbMouseDown = (e: MouseEvent) => {
		e.stopPropagation();
		if (!editable || !browser) return;

		// Prevent text selection during dragging
		document.body.style.userSelect = 'none';
		document.body.style.webkitUserSelect = 'none';
		// @ts-ignore - msUserSelect exists
		document.body.style.msUserSelect = 'none';
		document.body.style.cursor = 'grabbing';

		// Apply GPU acceleration for smoother movement
		if (thumbRef) {
			thumbRef.style.willChange = 'left';
		}

		isDragging = true;
		document.addEventListener('mousemove', handleMouseMove, {
			passive: true
		} as AddEventListenerOptions);
		document.addEventListener('mouseup', handleMouseUp);
	};

	const handleMouseMove = (e: MouseEvent) => {
		if (!isDragging) return;
		updateValue(calculateValue(e.clientX));
	};

	const handleMouseUp = () => {
		if (!browser) return;

		isDragging = false;

		// Re-enable text selection
		document.body.style.userSelect = '';
		document.body.style.webkitUserSelect = '';
		// @ts-ignore - msUserSelect exists
		document.body.style.msUserSelect = '';
		document.body.style.cursor = '';

		// Reset GPU acceleration hints
		if (thumbRef) {
			thumbRef.style.willChange = 'auto';
		}

		document.removeEventListener('mousemove', handleMouseMove);
		document.removeEventListener('mouseup', handleMouseUp);
	};

	// Touch event handlers with improved performance
	const handleThumbTouchStart = (e: TouchEvent) => {
		e.stopPropagation();
		if (!editable || !browser) return;

		// Prevent text selection during dragging
		document.body.style.userSelect = 'none';
		document.body.style.webkitUserSelect = 'none';
		// @ts-ignore - msUserSelect exists
		document.body.style.msUserSelect = 'none';

		// Apply GPU acceleration for smoother movement
		if (thumbRef) {
			thumbRef.style.willChange = 'left';
		}

		isDragging = true;
		document.addEventListener('touchmove', handleTouchMove, { passive: false });
		document.addEventListener('touchend', handleTouchEnd);
		document.addEventListener('touchcancel', handleTouchEnd);
	};

	const handleTrackTouch = (e: TouchEvent) => {
		if (e.touches.length > 0) {
			handleTrackInteraction(e.touches[0].clientX);
		}
	};

	const handleTouchMove = (e: TouchEvent) => {
		if (!isDragging) return;

		// Prevent scrolling while dragging the slider
		e.preventDefault();

		if (e.touches.length > 0) {
			updateValue(calculateValue(e.touches[0].clientX));
		}
	};

	const handleTouchEnd = () => {
		if (!browser) return;

		isDragging = false;

		// Re-enable text selection
		document.body.style.userSelect = '';
		document.body.style.webkitUserSelect = '';
		// @ts-ignore - msUserSelect exists
		document.body.style.msUserSelect = '';

		// Reset GPU acceleration hints
		if (thumbRef) {
			thumbRef.style.willChange = 'auto';
		}

		document.removeEventListener('touchmove', handleTouchMove);
		document.removeEventListener('touchend', handleTouchEnd);
		document.removeEventListener('touchcancel', handleTouchEnd);
	};

	// Prevent text selection on the slider itself
	const preventSelection = (e: MouseEvent | TouchEvent) => {
		if (editable) {
			e.preventDefault();
		}
	};

	// Clean up event listeners and animation frames
	onDestroy(() => {
		if (!browser) return;

		// Cancel any pending animation frames
		if (animationFrameId !== null) {
			cancelAnimationFrame(animationFrameId);
		}

		// Reset user selection styles if component unmounts during dragging
		document.body.style.userSelect = '';
		document.body.style.webkitUserSelect = '';
		// @ts-ignore - msUserSelect exists
		document.body.style.msUserSelect = '';
		document.body.style.cursor = '';

		document.removeEventListener('mousemove', handleMouseMove);
		document.removeEventListener('mouseup', handleMouseUp);
		document.removeEventListener('touchmove', handleTouchMove);
		document.removeEventListener('touchend', handleTouchEnd);
		document.removeEventListener('touchcancel', handleTouchEnd);
	});
</script>

<div class="w-full max-w-lg select-none">
	<input type="hidden" {name} value={currValue} />

	<!-- Slider track container with optimized styles for GPU acceleration -->
	<div
		bind:this={sliderRef}
		class={`relative h-1.5 w-full rounded bg-gray-200 ${editable ? 'cursor-pointer' : 'cursor-default'}`}
		style="transform: translateZ(0)"
		onclick={handleTrackClick}
		ontouchstart={handleTrackTouch}
		onmousedown={preventSelection}
	>
		<!-- Filled track with will-change for better performance -->
		<div
			bind:this={trackFillRef}
			class={`absolute h-full rounded ${editable ? 'bg-[#cfc1a3]' : 'bg-[#e8e1d3]'}`}
			style="width: {(currValue / 10) * 100}%; transform: translateZ(0); will-change: width;"
		></div>

		<!-- Thumb with hardware acceleration optimizations -->
		{#if editable}
			<div
				bind:this={thumbRef}
				class="absolute top-1/2 h-4 w-4 cursor-grab touch-none rounded-full border-2 border-[#cfc1a3] bg-white shadow active:cursor-grabbing"
				style="left: calc({(currValue / 10) *
					100}% - 0.5rem); transform: translateZ(0) translateY(-50%); transition: {isDragging
					? 'none'
					: 'left 0.05s linear'};"
				onmousedown={handleThumbMouseDown}
				ontouchstart={handleThumbTouchStart}
			></div>
		{/if}
	</div>
</div>

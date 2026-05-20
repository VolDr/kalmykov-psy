<script lang="ts">
	import { run } from 'svelte/legacy';

	interface Props {
		progress?: number; // 0..1
	}

	let { progress = 0 }: Props = $props();

	let fading = $state(false);
	run(() => {
		fading = true;
		const t = setTimeout(() => (fading = false), 100);
	});
</script>

<div
	class="fixed inset-x-0 top-0 z-[202] h-[5px] origin-[0%] bg-primary-light transition-[transform,opacity] duration-100 ease-out"
	class:opacity-80={fading}
	style="transform: scaleX({progress});"
></div>

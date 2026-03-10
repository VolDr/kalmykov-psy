<script lang="ts">
	import { run } from 'svelte/legacy';

	import { onMount } from 'svelte';
	import { fly, fade } from 'svelte/transition';

	let smallUI = $state(false);
	let mediumUI = $state(false);
	let standardUI = $state(false);
	let scrollY = $state(0);
	let show = $state(false);

	let threshold = $derived(smallUI ? 500 : mediumUI ? 750 : standardUI ? 800 : 900);
	run(() => {
		show = scrollY > threshold - 20;
	});

	function setupMql(query: string, setter: (v: boolean) => void) {
		const mql = window.matchMedia(query);
		const update = () => setter(mql.matches);
		mql.addEventListener('change', update);
		update();
		return () => mql.removeEventListener('change', update);
	}

	onMount(() => {
		const cleanups = [
			setupMql('(max-width: 48em)', (v) => (smallUI = v)),
			setupMql('(max-width: 62em)', (v) => (mediumUI = v && !smallUI)),
			setupMql('(max-width: 1921px)', (v) => (standardUI = v && !smallUI && !mediumUI))
		];

		const handleScroll = () => {
			scrollY = window.scrollY || window.pageYOffset || 0;
		};
		window.addEventListener('scroll', handleScroll, { passive: true });
		handleScroll();

		return () => {
			cleanups.forEach((fn) => fn());
			window.removeEventListener('scroll', handleScroll);
		};
	});

	function scrollToTop() {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}
</script>

{#if show}
	<div
		class="fixed right-1 bottom-[25px] z-[200] w-[3em] text-center lg:right-[50px] lg:bottom-[50px]"
		in:fly={{ y: 40, duration: 300 }}
		out:fade={{ duration: 300 }}
	>
		<button
			class="m-0 cursor-pointer border-none bg-transparent p-0 transition-all duration-300 focus:outline-none"
			onclick={scrollToTop}
			aria-label="Scroll to top"
		>
			<i class="icon-[lucide--arrow-up] h-5 w-5 text-[#191919] lg:h-6 lg:w-6"></i>
		</button>
	</div>
{/if}

<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<link rel="icon" href="/favicon.ico" sizes="any" type="image/svg+xml" />
	<link rel="mask-icon" href="/logo.svg" color="#ffffff" />
	<meta name="theme-color" content="#ffffff" />
</svelte:head>

{@render children()}

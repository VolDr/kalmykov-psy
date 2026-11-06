<script lang="ts">
	import type { ReconciliationProfile } from '#lib/data/translation-reconciliation.js';
	import { cn } from '#lib/utils.js';
	let {
		profile,
		size = 'normal'
	}: { profile: ReconciliationProfile; size?: 'small' | 'normal' | 'large' } = $props();
</script>

<span
	class={cn(
		'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 font-semibold text-foreground',
		size === 'large' && 'size-12 text-lg',
		size === 'normal' && 'size-9 text-sm',
		size === 'small' && 'size-7 text-xs'
	)}
>
	{#if profile.avatar}
		<img src={profile.avatar} alt="" class="size-full object-cover" />
	{:else}
		<span aria-hidden="true"
			>{profile.name.trim().slice(0, 1).toLocaleUpperCase('ru-RU') || '?'}</span
		>
	{/if}
</span>

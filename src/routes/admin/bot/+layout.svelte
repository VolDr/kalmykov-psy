<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { cn } from '$lib/utils';

	let { children }: { children: Snippet } = $props();

	const tabs = [
		{ href: '/admin/bot/contacts', label: 'Контакты' },
		{ href: '/admin/bot/scenarios', label: 'Сценарии' },
		{ href: '/admin/bot/posts', label: 'Кнопки на постах' }
	];
</script>

<div class="border-b bg-white px-6 pt-4">
	<nav class="flex gap-4">
		{#each tabs as tab (tab.href)}
			<a
				href={tab.href}
				class={cn(
					'border-b-2 px-1 pb-2 text-sm font-medium',
					page.url.pathname.startsWith(tab.href)
						? 'border-primary text-primary'
						: 'border-transparent text-stone-500 hover:text-stone-800'
				)}
			>
				{tab.label}
			</a>
		{/each}
	</nav>
</div>

{@render children()}

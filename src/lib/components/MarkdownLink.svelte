<script lang="ts">
	import { parseMarkdownLinks, isExternalUrl } from '$lib/utils/markdown';

	type Props = { text: string; class?: string; onLinkClick?: () => void };
	let { text, class: className = '', onLinkClick }: Props = $props();

	let parts = $derived(parseMarkdownLinks(text));
</script>

{#each parts as part}
	{#if typeof part === 'string'}
		{part}
	{:else if 'href' in part && isExternalUrl(part.href)}
		<a
			href={part.href}
			target="_blank"
			rel="noopener noreferrer"
			onclick={onLinkClick}
			class="nav-link relative inline-flex items-start font-semibold text-foreground/80 no-underline  hover:text-foreground/60 {className}"
		>
			{part.text}
			<span class="ml-[1px] icon-[lucide--external-link] text-[10px] -mr-[2px]"></span>
		</a>
	{:else if 'href' in part}
		<a
			href={part.href}
			onclick={onLinkClick}
			class="nav-link relative font-semibold text-foreground/80 no-underline  hover:text-foreground/60 {className}"
		>
			{part.text}
			<span class="mb-0.5 ml-0 icon-[lucide--external-link] text-xs"></span>
		</a>
	{:else if 'bold' in part}
		<strong class="font-semibold">{part.text}</strong>
	{/if}
{/each}

<script lang="ts">
    import { parseMarkdownLinks, isExternalUrl } from '$lib/utils/markdown';

    type Props = { text: string; class?: string };
    let { text, class: className = '' }: Props = $props();

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
            class="nav-link no-underline  relative text-[#443d3d] font-semibold hover:text-[#191919]/60 inline-flex items-start {className}"
        >
            {part.text}
            <span class="icon-[lucide--external-link] ml-1 text-xs"></span>
        </a>
    {:else if 'href' in part}
        <a href={part.href} class="nav-link no-underline  relative text-[#443d3d] font-semibold hover:text-[#191919]/60 {className}">
            {part.text}
			<span class="icon-[lucide--external-link] ml-0 text-xs mb-0.5"></span>
        </a>
    {:else if 'bold' in part}
        <strong class="font-semibold">{part.text}</strong>
    {/if}
{/each}
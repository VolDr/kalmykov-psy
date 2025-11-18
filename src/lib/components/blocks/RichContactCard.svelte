<script lang="ts">
	import { cn } from '$lib/utils';
	import MarkdownLink from '$lib/components/MarkdownLink.svelte';

	interface Props {
		title: string;
		introText?: string[];
		contacts: Array<{
			icon: string;
			text: string;
		}>;
		additionalLinks?: string[];
		gridClass?: string;
		minHeight?: string;
		class?: string;
	}

	let {
		title,
		introText = [],
		contacts = [],
		additionalLinks = [],
		gridClass = '',
		minHeight = '220px',
		class: className = ''
	}: Props = $props();
</script>

<div class={cn(`min-h-[${minHeight}]`, gridClass, className)}>
	<div
		class="mx-auto flex w-full max-w-[600px] flex-col gap-4 rounded-lg bg-[#F2F0EF] px-6 py-6 md:px-8 md:py-8"
	>
		{#if introText.length > 0}
			<div class="flex flex-col gap-3">
				{#each introText as text}
					<p><MarkdownLink {text} /></p>
				{/each}
			</div>
		{/if}

		<ul class="flex flex-col gap-3">
			{#each contacts as contact}
				<li class="flex items-center gap-3">
					<span class="icon-[lucide--{contact.icon}] h-5 w-5 text-[#B8A98A]"></span>
					<span>
						<MarkdownLink text={contact.text} />
					</span>
				</li>
			{/each}

			{#each additionalLinks as link}
				<li>
					<MarkdownLink text={link} />
				</li>
			{/each}
		</ul>
	</div>
</div>

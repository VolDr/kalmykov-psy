<script lang="ts">
	import MarkdownLink from '$lib/components/MarkdownLink.svelte';

	interface TextBlock {
		title: string;
		data: string[];
	}

	interface Props {
		blocks: TextBlock[];
	}

	let { blocks }: Props = $props();
</script>

<div class="grid grid-cols-1 gap-10 leading-relaxed">
	{#each blocks as block}
		<div class="col-span-full">
			<section class="flex flex-col items-start gap-2">
				<div class="subtitle">{block.title.toLowerCase()}</div>
				<div class="flex flex-col items-start gap-1">
					{#each block.data as item}
						<p>
							<MarkdownLink text={item} />
						</p>
					{/each}
				</div>
			</section>
		</div>
	{/each}
</div>

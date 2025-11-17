<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import type { PageBlock } from '$lib/types/page-blocks';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/Button.svelte';
	import BlockSelector from '../pages/BlockSelector.svelte';
	import BlockEditor from '../pages/editors/BlockEditor.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let blocks = $state<PageBlock[]>(data.blocks || []);
	let showBlockSelector = $state(false);
	let hasUnsavedChanges = $state(false);

	function selectPage(pageSlug: string) {
		if (hasUnsavedChanges && !confirm('Есть несохранённые изменения. Продолжить?')) {
			return;
		}
		goto(`/admin/constructor?page=${pageSlug}`);
	}

	function addBlock(block: PageBlock) {
		block.sortOrder = blocks.length * 10;
		blocks = [...blocks, block];
		hasUnsavedChanges = true;
	}

	function updateBlock(index: number, updatedBlock: PageBlock) {
		blocks = blocks.map((b, i) => (i === index ? updatedBlock : b));
		hasUnsavedChanges = true;
	}

	function deleteBlock(index: number) {
		if (confirm('Удалить этот блок?')) {
			blocks = blocks.filter((_, i) => i !== index);
			hasUnsavedChanges = true;
		}
	}

	function duplicateBlock(index: number) {
		const original = blocks[index];
		const duplicate: PageBlock = {
			...original,
			id: crypto.randomUUID(),
			sortOrder: original.sortOrder + 5
		};
		blocks = [...blocks.slice(0, index + 1), duplicate, ...blocks.slice(index + 1)];
		hasUnsavedChanges = true;
	}

	function moveBlockUp(index: number) {
		if (index === 0) return;
		const newBlocks = [...blocks];
		const temp = newBlocks[index - 1].sortOrder;
		newBlocks[index - 1].sortOrder = newBlocks[index].sortOrder;
		newBlocks[index].sortOrder = temp;
		[newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
		blocks = newBlocks;
		hasUnsavedChanges = true;
	}

	function moveBlockDown(index: number) {
		if (index === blocks.length - 1) return;
		const newBlocks = [...blocks];
		const temp = newBlocks[index + 1].sortOrder;
		newBlocks[index + 1].sortOrder = newBlocks[index].sortOrder;
		newBlocks[index].sortOrder = temp;
		[newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
		blocks = newBlocks;
		hasUnsavedChanges = true;
	}

	// Sync blocks when page changes
	$effect(() => {
		blocks = data.blocks || [];
		hasUnsavedChanges = false;
	});
</script>

<div class="container mx-auto px-4 py-8">
	<div class="mb-8">
		<h1 class="mb-4 text-3xl font-bold text-gray-800">Конструктор страниц</h1>

		<!-- Page selector -->
		<div class="mb-6 flex flex-wrap gap-2">
			{#each data.pageOptions as page (page.slug)}
				<button
					onclick={() => selectPage(page.slug)}
					class="rounded-lg px-4 py-2 text-sm font-medium transition-colors {data.selectedPage ===
					page.slug
						? 'bg-blue-600 text-white'
						: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
				>
					{page.name}
				</button>
			{/each}
		</div>
	</div>

	{#if form?.error}
		<div class="mb-4 rounded-lg bg-red-50 p-4 text-red-600">{form.error}</div>
	{/if}

	{#if form?.success}
		<div class="mb-4 rounded-lg bg-green-50 p-4 text-green-600">Сохранено успешно</div>
	{/if}

	<!-- Toolbar -->
	<div class="mb-6 flex items-center justify-between rounded-lg border bg-white p-4 shadow-sm">
		<div class="flex items-center gap-4">
			<Button onclick={() => (showBlockSelector = true)}>
				<span class="icon-[lucide--plus] mr-2 h-4 w-4"></span>
				<span>Добавить блок</span>
			</Button>

			{#if hasUnsavedChanges}
				<span class="flex items-center gap-1 text-sm text-orange-600">
					<span class="icon-[lucide--alert-circle] h-4 w-4"></span>
					Есть несохранённые изменения
				</span>
			{/if}
		</div>

		<form
			method="POST"
			action="?/saveBlocks"
			use:enhance={() => {
				return async ({ update }) => {
					await update();
					hasUnsavedChanges = false;
				};
			}}
		>
			<input type="hidden" name="pageSlug" value={data.selectedPage} />
			<input type="hidden" name="blocks" value={JSON.stringify(blocks)} />
			<Button type="submit" disabled={!hasUnsavedChanges}>
				<span class="icon-[lucide--save] mr-2 h-4 w-4"></span>
				<span>Сохранить</span>
			</Button>
		</form>
	</div>

	<!-- Blocks list -->
	<div class="space-y-4">
		{#if blocks.length === 0}
			<div class="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
				<span class="icon-[lucide--layout-grid] mx-auto mb-4 h-12 w-12 text-gray-400"></span>
				<p class="mb-4 text-gray-600">Нет блоков на этой странице</p>
				<Button onclick={() => (showBlockSelector = true)}>
					<span class="icon-[lucide--plus] mr-2 h-4 w-4"></span>
					<span>Добавить первый блок</span>
				</Button>
			</div>
		{:else}
			{#each blocks as block, index (block.id)}
				<BlockEditor
					{block}
					onUpdate={(b) => updateBlock(index, b)}
					onDelete={() => deleteBlock(index)}
					onDuplicate={() => duplicateBlock(index)}
					onMoveUp={() => moveBlockUp(index)}
					onMoveDown={() => moveBlockDown(index)}
					isFirst={index === 0}
					isLast={index === blocks.length - 1}
				/>
			{/each}
		{/if}
	</div>

	{#if data.lastUpdated}
		<div class="mt-6 text-right text-xs text-gray-500">
			Последнее обновление: {new Date(data.lastUpdated).toLocaleString('ru-RU')}
		</div>
	{/if}
</div>

<!-- Block selector modal -->
{#if showBlockSelector}
	<BlockSelector onSelect={addBlock} onClose={() => (showBlockSelector = false)} />
{/if}

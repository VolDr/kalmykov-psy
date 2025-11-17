<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import type { PageBlock, PageLayoutSettings } from '$lib/types/page-blocks';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/Button.svelte';
	import BlockSelector from '../pages/BlockSelector.svelte';
	import BlockEditor from '../pages/editors/BlockEditor.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let blocks = $state<PageBlock[]>(Array.isArray(data.blocks) ? data.blocks : []);
	let layout = $state<PageLayoutSettings>(data.layout || { maxWidth: 'lg', withContainer: true });
	let showBlockSelector = $state(false);
	let showCreatePageModal = $state(false);
	let showLayoutSettings = $state(false);
	let hasUnsavedChanges = $state(false);
	let hasLayoutChanges = $state(false);
	let newPageSlug = $state('');
	let newPageName = $state('');

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

	function openCreatePageModal() {
		newPageSlug = '';
		newPageName = '';
		showCreatePageModal = true;
	}

	function closeCreatePageModal() {
		showCreatePageModal = false;
		newPageSlug = '';
		newPageName = '';
	}

	// Sync blocks when page changes
	$effect(() => {
		blocks = Array.isArray(data.blocks) ? data.blocks : [];
		layout = data.layout || { maxWidth: 'lg', withContainer: true };
		hasUnsavedChanges = false;
		hasLayoutChanges = false;
	});

	// Handle form response for page creation
	$effect(() => {
		if (form?.newPageSlug) {
			closeCreatePageModal();
			goto(`/admin/constructor?page=${form.newPageSlug}`);
		}
		if (form?.layoutSaved) {
			hasLayoutChanges = false;
		}
	});

	function updateLayout(key: keyof PageLayoutSettings, value: string | boolean) {
		layout = { ...layout, [key]: value };
		hasLayoutChanges = true;
	}
</script>

<div class="container mx-auto px-4 py-8">
	<div class="mb-8">
		<h1 class="mb-4 text-3xl font-bold text-gray-800">Конструктор страниц</h1>

		<!-- Page selector -->
		<div class="mb-6 flex flex-wrap items-center gap-2">
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
			<button
				onclick={openCreatePageModal}
				class="flex items-center gap-1 rounded-lg border-2 border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:border-blue-400 hover:text-blue-600"
				aria-label="Создать новую страницу"
			>
				<span class="icon-[lucide--plus] h-4 w-4"></span>
				<span>Новая страница</span>
			</button>
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
				<span class="mr-2 icon-[lucide--plus] h-4 w-4"></span>
				<span>Добавить блок</span>
			</Button>

			<Button onclick={() => (showLayoutSettings = !showLayoutSettings)}>
				<span class="mr-2 icon-[lucide--settings] h-4 w-4"></span>
				<span>Настройки макета</span>
			</Button>

			{#if hasUnsavedChanges}
				<span class="flex items-center gap-1 text-sm text-orange-600">
					<span class="icon-[lucide--alert-circle] h-4 w-4"></span>
					Есть несохранённые изменения
				</span>
			{/if}

			{#if hasLayoutChanges}
				<span class="flex items-center gap-1 text-sm text-purple-600">
					<span class="icon-[lucide--alert-circle] h-4 w-4"></span>
					Настройки макета изменены
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
				<span class="mr-2 icon-[lucide--save] h-4 w-4"></span>
				<span>Сохранить</span>
			</Button>
		</form>
	</div>

	<!-- Layout Settings Panel -->
	{#if showLayoutSettings}
		<div class="mb-6 rounded-lg border bg-white p-4 shadow-sm">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold text-gray-800">Настройки макета страницы</h2>
				<button
					onclick={() => (showLayoutSettings = false)}
					class="text-gray-400 hover:text-gray-600"
					aria-label="Закрыть"
				>
					<span class="icon-[lucide--x] h-5 w-5"></span>
				</button>
			</div>

			<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
				<div>
					<label for="maxWidth" class="mb-1 block text-sm font-medium text-gray-700">
						Максимальная ширина
					</label>
					<select
						id="maxWidth"
						value={layout.maxWidth || 'lg'}
						onchange={(e) => updateLayout('maxWidth', e.currentTarget.value)}
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
					>
						<option value="sm">Узкая (720px)</option>
						<option value="md">Средняя (960px)</option>
						<option value="lg">Широкая (1200px)</option>
						<option value="xl">Очень широкая (1440px)</option>
						<option value="full">Во всю ширину</option>
					</select>
					<p class="mt-1 text-xs text-gray-500">Определяет максимальную ширину контента</p>
				</div>

				<div>
					<label for="containerClass" class="mb-1 block text-sm font-medium text-gray-700">
						Дополнительные классы
					</label>
					<input
						type="text"
						id="containerClass"
						value={layout.containerClass || ''}
						oninput={(e) => updateLayout('containerClass', e.currentTarget.value)}
						placeholder="px-4 py-8..."
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
					/>
					<p class="mt-1 text-xs text-gray-500">Tailwind классы для контейнера</p>
				</div>

				<div>
					<span class="mb-1 block text-sm font-medium text-gray-700">Использовать контейнер</span>
					<div class="mt-2 flex items-center gap-2">
						<input
							type="checkbox"
							id="withContainer"
							checked={layout.withContainer !== false}
							onchange={(e) => updateLayout('withContainer', e.currentTarget.checked)}
							class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
						/>
						<label for="withContainer" class="text-sm text-gray-600">
							Обернуть блоки в контейнер
						</label>
					</div>
				</div>
			</div>

			<div class="mt-4 flex justify-end">
				<form
					method="POST"
					action="?/saveLayout"
					use:enhance={() => {
						return async ({ update }) => {
							await update();
						};
					}}
				>
					<input type="hidden" name="pageSlug" value={data.selectedPage} />
					<input type="hidden" name="layout" value={JSON.stringify(layout)} />
					<Button type="submit" disabled={!hasLayoutChanges}>
						<span class="mr-2 icon-[lucide--save] h-4 w-4"></span>
						<span>Сохранить настройки макета</span>
					</Button>
				</form>
			</div>
		</div>
	{/if}

	<!-- Blocks list -->
	<div class="space-y-4">
		{#if blocks.length === 0}
			<div class="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
				<span class="mx-auto mb-4 icon-[lucide--layout-grid] h-12 w-12 text-gray-400"></span>
				<p class="mb-4 text-gray-600">Нет блоков на этой странице</p>
				<Button onclick={() => (showBlockSelector = true)}>
					<span class="mr-2 icon-[lucide--plus] h-4 w-4"></span>
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

<!-- Create page modal -->
{#if showCreatePageModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
		role="dialog"
		aria-modal="true"
		aria-labelledby="create-page-title"
	>
		<div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
			<div class="mb-4 flex items-center justify-between">
				<h2 id="create-page-title" class="text-xl font-semibold text-gray-800">
					Создать новую страницу
				</h2>
				<button
					onclick={closeCreatePageModal}
					class="text-gray-400 transition-colors hover:text-gray-600"
					aria-label="Закрыть"
				>
					<span class="icon-[lucide--x] h-5 w-5"></span>
				</button>
			</div>

			<form
				method="POST"
				action="?/createPage"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
					};
				}}
			>
				<div class="space-y-4">
					<div>
						<label for="pageName" class="mb-1 block text-sm font-medium text-gray-700">
							Название страницы
						</label>
						<input
							type="text"
							id="pageName"
							name="pageName"
							bind:value={newPageName}
							placeholder="Например: О компании"
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
						/>
						<p class="mt-1 text-xs text-gray-500">Отображаемое название в списке страниц</p>
					</div>

					<div>
						<label for="pageSlug" class="mb-1 block text-sm font-medium text-gray-700">
							Slug страницы <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							id="pageSlug"
							name="pageSlug"
							bind:value={newPageSlug}
							placeholder="Например: about-company"
							required
							pattern="[a-z0-9-]+"
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
						/>
						<p class="mt-1 text-xs text-gray-500">
							URL страницы (только латинские буквы в нижнем регистре, цифры и дефисы)
						</p>
					</div>
				</div>

				<div class="mt-6 flex justify-end gap-3">
					<button
						type="button"
						onclick={closeCreatePageModal}
						class="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
					>
						Отмена
					</button>
					<Button type="submit" disabled={!newPageSlug}>
						<span class="mr-2 icon-[lucide--plus] h-4 w-4"></span>
						<span>Создать</span>
					</Button>
				</div>
			</form>
		</div>
	</div>
{/if}

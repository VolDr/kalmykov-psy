<script lang="ts">
	import { blockMetadataRegistry, createEmptyBlock } from '$lib/types/page-blocks';
	import type { BlockType, PageBlock } from '$lib/types/page-blocks';

	interface Props {
		onSelect: (block: PageBlock) => void;
		onClose: () => void;
	}

	let { onSelect, onClose }: Props = $props();

	let selectedCategory = $state<'all' | 'universal' | 'unique'>('all');
	let searchQuery = $state('');

	const filteredBlocks = $derived(() => {
		let blocks = blockMetadataRegistry;

		if (selectedCategory !== 'all') {
			blocks = blocks.filter((b) => b.category === selectedCategory);
		}

		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			blocks = blocks.filter(
				(b) => b.name.toLowerCase().includes(query) || b.description.toLowerCase().includes(query)
			);
		}

		return blocks;
	});

	function handleSelect(type: BlockType) {
		const block = createEmptyBlock(type);
		onSelect(block);
		onClose();
	}

	const iconMap: Record<string, string> = {
		'layout-template': 'icon-[lucide--layout-template]',
		'layout-sidebar': 'icon-[lucide--layout-panel-left]',
		box: 'icon-[lucide--box]',
		'grid-3x3': 'icon-[lucide--grid-3x3]',
		text: 'icon-[lucide--text]',
		home: 'icon-[lucide--home]',
		'graduation-cap': 'icon-[lucide--graduation-cap]',
		'circle-help': 'icon-[lucide--circle-help]',
		info: 'icon-[lucide--info]',
		user: 'icon-[lucide--user]',
		'list-checks': 'icon-[lucide--list-checks]'
	};
</script>

<div
	class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black"
	onclick={onClose}
	role="dialog"
	aria-modal="true"
	tabindex="-1"
	onkeydown={(e) => e.key === 'Escape' && onClose()}
>
	<div
		class="max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl"
		onclick={(e) => e.stopPropagation()}
		role="document"
	>
		<!-- Header -->
		<div class="border-b bg-gray-50 px-6 py-4">
			<div class="flex items-center justify-between">
				<h2 class="text-xl font-bold text-gray-800">Добавить блок</h2>
				<button
					onclick={onClose}
					class="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
					aria-label="Закрыть"
				>
					<span class="icon-[lucide--x] h-5 w-5"></span>
				</button>
			</div>

			<!-- Search and filters -->
			<div class="mt-4 flex gap-4">
				<div class="relative flex-1">
					<span
						class="absolute top-1/2 left-3 icon-[lucide--search] h-4 w-4 -translate-y-1/2 text-gray-400"
					></span>
					<input
						type="text"
						placeholder="Поиск блоков..."
						bind:value={searchQuery}
						class="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 text-sm focus:border-blue-500 focus:outline-none"
					/>
				</div>
				<div class="flex gap-1 rounded-lg bg-gray-100 p-1">
					<button
						onclick={() => (selectedCategory = 'all')}
						class="rounded-md px-3 py-1 text-sm transition-colors {selectedCategory === 'all'
							? 'bg-white font-medium text-gray-900 shadow-sm'
							: 'text-gray-600 hover:text-gray-900'}"
					>
						Все
					</button>
					<button
						onclick={() => (selectedCategory = 'universal')}
						class="rounded-md px-3 py-1 text-sm transition-colors {selectedCategory === 'universal'
							? 'bg-white font-medium text-gray-900 shadow-sm'
							: 'text-gray-600 hover:text-gray-900'}"
					>
						Универсальные
					</button>
					<button
						onclick={() => (selectedCategory = 'unique')}
						class="rounded-md px-3 py-1 text-sm transition-colors {selectedCategory === 'unique'
							? 'bg-white font-medium text-gray-900 shadow-sm'
							: 'text-gray-600 hover:text-gray-900'}"
					>
						Уникальные
					</button>
				</div>
			</div>
		</div>

		<!-- Block grid -->
		<div class="max-h-[60vh] overflow-y-auto p-6">
			{#if filteredBlocks().length === 0}
				<div class="py-12 text-center text-gray-500">
					<span class="mx-auto mb-2 icon-[lucide--search-x] h-12 w-12 text-gray-300"></span>
					<p>Блоки не найдены</p>
				</div>
			{:else}
				<div class="grid grid-cols-2 gap-4 md:grid-cols-3">
					{#each filteredBlocks() as block (block.type)}
						<button
							onclick={() => handleSelect(block.type)}
							class="group flex flex-col items-start rounded-lg border border-gray-200 p-4 text-left transition-all hover:border-blue-300 hover:bg-blue-50 hover:shadow-md"
						>
							<div class="mb-3 flex items-center gap-3">
								<div
									class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 group-hover:bg-blue-100"
								>
									<span
										class="{iconMap[block.icon] ||
											'icon-[lucide--box]'} h-5 w-5 text-gray-600 group-hover:text-blue-600"
									></span>
								</div>
								<span
									class="rounded-full px-2 py-0.5 text-xs {block.category === 'universal'
										? 'bg-green-100 text-green-700'
										: 'bg-purple-100 text-purple-700'}"
								>
									{block.category === 'universal' ? 'Универсальный' : 'Уникальный'}
								</span>
							</div>
							<h3 class="mb-1 font-semibold text-gray-900">{block.name}</h3>
							<p class="text-sm leading-relaxed text-gray-600">{block.description}</p>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>

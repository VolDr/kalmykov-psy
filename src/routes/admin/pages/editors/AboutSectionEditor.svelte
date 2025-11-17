<script lang="ts">
	import type { AboutSectionBlock } from '$lib/types/page-blocks';

	interface Props {
		block: AboutSectionBlock;
		onUpdate: (block: AboutSectionBlock) => void;
	}

	let { block, onUpdate }: Props = $props();

	function updateConfig<K extends keyof AboutSectionBlock['config']>(
		key: K,
		value: AboutSectionBlock['config'][K]
	) {
		const updated = {
			...block,
			config: { ...block.config, [key]: value }
		};
		onUpdate(updated);
	}

	function addItem() {
		const items = [
			...block.config.items,
			{ icon: 'circle', highlight: '', text: '', gridClass: '' }
		];
		updateConfig('items', items);
	}

	function updateItem(index: number, field: keyof (typeof block.config.items)[0], value: string) {
		const items = [...block.config.items];
		items[index] = { ...items[index], [field]: value };
		updateConfig('items', items);
	}

	function removeItem(index: number) {
		const items = block.config.items.filter((_, i) => i !== index);
		updateConfig('items', items);
	}
</script>

<div class="space-y-4">
	<div>
		<label for="about-title" class="mb-1 block text-sm font-medium text-gray-700">
			Заголовок секции
		</label>
		<input
			id="about-title"
			type="text"
			value={block.config.title || ''}
			oninput={(e) => updateConfig('title', e.currentTarget.value || undefined)}
			class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
			placeholder="обо мне"
		/>
	</div>

	<div>
		<div class="mb-2 flex items-center justify-between">
			<label class="block text-sm font-medium text-gray-700">Карточки</label>
			<button
				onclick={addItem}
				class="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
				type="button"
			>
				+ Добавить карточку
			</button>
		</div>

		<div class="space-y-3">
			{#each block.config.items as item, i (i)}
				<div class="rounded border border-gray-200 p-3">
					<div class="mb-2 flex items-center justify-between">
						<span class="text-xs font-medium text-gray-500">Карточка {i + 1}</span>
						<button
							onclick={() => removeItem(i)}
							class="rounded p-1 text-red-600 hover:bg-red-50"
							type="button"
							disabled={block.config.items.length === 1}
							aria-label="Удалить карточку"
						>
							<span class="icon-[lucide--trash-2] h-4 w-4"></span>
						</button>
					</div>

					<div class="space-y-2">
						<div>
							<label class="mb-1 block text-xs font-medium text-gray-700">Иконка</label>
							<input
								type="text"
								value={item.icon}
								oninput={(e) => updateItem(i, 'icon', e.currentTarget.value)}
								class="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
								placeholder="circle, user, heart"
							/>
						</div>

						<div>
							<label class="mb-1 block text-xs font-medium text-gray-700">Выделенный текст</label
							>
							<input
								type="text"
								value={item.highlight}
								oninput={(e) => updateItem(i, 'highlight', e.currentTarget.value)}
								class="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
								placeholder="Ключевое слово"
							/>
						</div>

						<div>
							<label class="mb-1 block text-xs font-medium text-gray-700">Текст</label>
							<textarea
								value={item.text}
								oninput={(e) => updateItem(i, 'text', e.currentTarget.value)}
								rows="2"
								class="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
								placeholder="Основной текст карточки"
							></textarea>
						</div>

						<div>
							<label class="mb-1 block text-xs font-medium text-gray-700">
								Grid классы (опц.)
							</label>
							<input
								type="text"
								value={item.gridClass || ''}
								oninput={(e) => updateItem(i, 'gridClass', e.currentTarget.value)}
								class="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
								placeholder="col-span-2 row-span-3"
							/>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>

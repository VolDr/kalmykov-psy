<script lang="ts">
	import type { IssuesListBlock } from '$lib/types/page-blocks';

	interface Props {
		block: IssuesListBlock;
		onUpdate: (block: IssuesListBlock) => void;
	}

	let { block, onUpdate }: Props = $props();

	function updateConfig<K extends keyof IssuesListBlock['config']>(
		key: K,
		value: IssuesListBlock['config'][K]
	) {
		const updated = {
			...block,
			config: { ...block.config, [key]: value }
		};
		onUpdate(updated);
	}

	function addItem() {
		const items = [...block.config.items, { theme: '', points: [''], gridClass: '' }];
		updateConfig('items', items);
	}

	function updateItemField(index: number, field: 'theme' | 'icon' | 'gridClass', value: string) {
		const items = [...block.config.items];
		items[index] = { ...items[index], [field]: value };
		updateConfig('items', items);
	}

	function updatePoint(itemIndex: number, pointIndex: number, value: string) {
		const items = [...block.config.items];
		const points = [...items[itemIndex].points];
		points[pointIndex] = value;
		items[itemIndex] = { ...items[itemIndex], points };
		updateConfig('items', items);
	}

	function addPoint(itemIndex: number) {
		const items = [...block.config.items];
		items[itemIndex] = {
			...items[itemIndex],
			points: [...items[itemIndex].points, '']
		};
		updateConfig('items', items);
	}

	function removePoint(itemIndex: number, pointIndex: number) {
		const items = [...block.config.items];
		items[itemIndex] = {
			...items[itemIndex],
			points: items[itemIndex].points.filter((_, i) => i !== pointIndex)
		};
		updateConfig('items', items);
	}

	function removeItem(index: number) {
		const items = block.config.items.filter((_, i) => i !== index);
		updateConfig('items', items);
	}
</script>

<div class="space-y-4">
	<div>
		<label for="issues-intro" class="mb-1 block text-sm font-medium text-gray-700">
			Вводный текст
		</label>
		<textarea
			id="issues-intro"
			value={block.config.introText || ''}
			oninput={(e) => updateConfig('introText', e.currentTarget.value || undefined)}
			rows="2"
			class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
			placeholder="Вводный текст (опционально)"
		></textarea>
	</div>

	<div>
		<label for="issues-subtitle" class="mb-1 block text-sm font-medium text-gray-700">
			Подзаголовок
		</label>
		<input
			id="issues-subtitle"
			type="text"
			value={block.config.subtitle || ''}
			oninput={(e) => updateConfig('subtitle', e.currentTarget.value || undefined)}
			class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
			placeholder="c чем ко мне обращаются"
		/>
	</div>

	<div>
		<div class="mb-2 flex items-center justify-between">
			<label class="block text-sm font-medium text-gray-700">Темы запросов</label>
			<button
				onclick={addItem}
				class="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
				type="button"
			>
				+ Добавить тему
			</button>
		</div>

		<div class="space-y-3">
			{#each block.config.items as item, itemIndex (itemIndex)}
				<div class="rounded border border-gray-200 p-3">
					<div class="mb-3 flex items-center justify-between">
						<span class="text-xs font-medium text-gray-500">Тема {itemIndex + 1}</span>
						<button
							onclick={() => removeItem(itemIndex)}
							class="rounded p-1 text-red-600 hover:bg-red-50"
							type="button"
							disabled={block.config.items.length === 1}
							aria-label="Удалить тему"
						>
							<span class="icon-[lucide--trash-2] h-4 w-4"></span>
						</button>
					</div>

					<div class="space-y-3">
						<div>
							<label class="mb-1 block text-xs font-medium text-gray-700">Название темы</label>
							<input
								type="text"
								value={item.theme}
								oninput={(e) => updateItemField(itemIndex, 'theme', e.currentTarget.value)}
								class="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
								placeholder="Название темы"
							/>
						</div>

						<div>
							<label class="mb-1 block text-xs font-medium text-gray-700">Иконка (опц.)</label>
							<input
								type="text"
								value={item.icon || ''}
								oninput={(e) => updateItemField(itemIndex, 'icon', e.currentTarget.value)}
								class="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
								placeholder="circle, heart, star"
							/>
						</div>

						<div>
							<label class="mb-1 block text-xs font-medium text-gray-700">
								Grid классы (опц.)
							</label>
							<input
								type="text"
								value={item.gridClass || ''}
								oninput={(e) => updateItemField(itemIndex, 'gridClass', e.currentTarget.value)}
								class="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
								placeholder="col-span-2"
							/>
						</div>

						<div>
							<div class="mb-2 flex items-center justify-between">
								<label class="block text-xs font-medium text-gray-700">Пункты</label>
								<button
									onclick={() => addPoint(itemIndex)}
									class="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700 hover:bg-gray-200"
									type="button"
								>
									+ Пункт
								</button>
							</div>

							<div class="space-y-2">
								{#each item.points as point, pointIndex (pointIndex)}
									<div class="flex gap-2">
										<input
											type="text"
											value={point}
											oninput={(e) => updatePoint(itemIndex, pointIndex, e.currentTarget.value)}
											class="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
											placeholder="Пункт списка"
										/>
										<button
											onclick={() => removePoint(itemIndex, pointIndex)}
											class="rounded p-1.5 text-red-600 hover:bg-red-50"
											type="button"
											disabled={item.points.length === 1}
											aria-label="Удалить пункт"
										>
											<span class="icon-[lucide--x] h-4 w-4"></span>
										</button>
									</div>
								{/each}
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>

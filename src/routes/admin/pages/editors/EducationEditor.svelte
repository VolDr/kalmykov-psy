<script lang="ts">
	import type { EducationBlock } from '$lib/types/page-blocks';
	import { educationGroups } from '$lib/data/education';

	interface Props {
		block: EducationBlock;
		onUpdate: (block: EducationBlock) => void;
	}

	let { block, onUpdate }: Props = $props();

	// Use default data if no custom data is provided
	const groups = $derived(block.config.groups || educationGroups);
	const isUsingDefaults = $derived(!block.config.groups || block.config.groups.length === 0);

	function updateConfig<K extends keyof EducationBlock['config']>(
		key: K,
		value: EducationBlock['config'][K]
	) {
		const updated = {
			...block,
			config: { ...block.config, [key]: value }
		};
		onUpdate(updated);
	}

	function loadDefaults() {
		updateConfig('groups', JSON.parse(JSON.stringify(educationGroups)));
	}

	function clearCustomData() {
		updateConfig('groups', []);
	}

	function addGroup() {
		const newGroups = [
			...(block.config.groups || []),
			{
				category: 'Новая категория',
				items: []
			}
		];
		updateConfig('groups', newGroups);
	}

	function updateGroup(index: number, field: 'category', value: string) {
		const newGroups = [...(block.config.groups || [])];
		newGroups[index] = { ...newGroups[index], [field]: value };
		updateConfig('groups', newGroups);
	}

	function removeGroup(index: number) {
		const newGroups = (block.config.groups || []).filter((_, i) => i !== index);
		updateConfig('groups', newGroups.length > 0 ? newGroups : []);
	}

	function addItem(groupIndex: number) {
		const newGroups = [...(block.config.groups || [])];
		newGroups[groupIndex] = {
			...newGroups[groupIndex],
			items: [
				...newGroups[groupIndex].items,
				{
					title: '',
					details: '',
					diploma: '',
					completed: false
				}
			]
		};
		updateConfig('groups', newGroups);
	}

	function updateItem(
		groupIndex: number,
		itemIndex: number,
		field: 'title' | 'details' | 'diploma' | 'completed',
		value: string | boolean
	) {
		const newGroups = [...(block.config.groups || [])];
		const items = [...newGroups[groupIndex].items];
		items[itemIndex] = { ...items[itemIndex], [field]: value };
		newGroups[groupIndex] = { ...newGroups[groupIndex], items };
		updateConfig('groups', newGroups);
	}

	function removeItem(groupIndex: number, itemIndex: number) {
		const newGroups = [...(block.config.groups || [])];
		const items = newGroups[groupIndex].items.filter((_, i) => i !== itemIndex);
		newGroups[groupIndex] = { ...newGroups[groupIndex], items };
		updateConfig('groups', newGroups);
	}
</script>

<div class="space-y-4">
	<div class="rounded bg-blue-50 p-3 text-sm text-blue-700">
		{#if isUsingDefaults}
			Используются данные по умолчанию из файла src/lib/data/education.ts. Нажмите "Загрузить данные
			по умолчанию" для редактирования.
		{:else}
			Используются пользовательские данные. Нажмите "Сбросить" для возврата к данным по умолчанию.
		{/if}
	</div>

	<div>
		<label class="flex cursor-pointer items-center gap-2">
			<input
				type="checkbox"
				checked={block.config.isOpen ?? false}
				onchange={(e) => updateConfig('isOpen', e.currentTarget.checked)}
				class="h-4 w-4 rounded border-gray-300"
			/>
			<span class="text-sm font-medium text-gray-700">Открыта по умолчанию</span>
		</label>
		<p class="mt-1 ml-6 text-xs text-gray-500">Секция будет раскрыта при загрузке страницы</p>
	</div>

	<div class="flex gap-2">
		{#if isUsingDefaults}
			<button
				onclick={loadDefaults}
				class="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
				type="button"
			>
				Загрузить данные по умолчанию
			</button>
		{:else}
			<button
				onclick={clearCustomData}
				class="rounded bg-gray-600 px-3 py-1.5 text-sm text-white hover:bg-gray-700"
				type="button"
			>
				Сбросить
			</button>
		{/if}
	</div>

	{#if !isUsingDefaults}
		<div>
			<div class="mb-3 flex items-center justify-between">
				<label class="block text-sm font-medium text-gray-700">Группы образования</label>
				<button
					onclick={addGroup}
					class="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
					type="button"
				>
					+ Добавить группу
				</button>
			</div>

			<div class="space-y-4">
				{#each block.config.groups || [] as group, groupIndex (groupIndex)}
					<div class="rounded border-2 border-gray-300 bg-gray-50 p-4">
						<div class="mb-3 flex items-center justify-between">
							<input
								type="text"
								value={group.category}
								oninput={(e) => updateGroup(groupIndex, 'category', e.currentTarget.value)}
								class="flex-1 rounded border border-gray-300 px-3 py-2 text-sm font-medium focus:border-blue-500 focus:outline-none"
								placeholder="Название категории"
							/>
							<button
								onclick={() => removeGroup(groupIndex)}
								class="ml-2 rounded p-2 text-red-600 hover:bg-red-50"
								type="button"
								aria-label="Удалить группу"
							>
								<span class="icon-[lucide--trash-2] h-4 w-4"></span>
							</button>
						</div>

						<div class="mb-2 flex items-center justify-between">
							<span class="text-xs font-medium text-gray-600">Элементы образования</span>
							<button
								onclick={() => addItem(groupIndex)}
								class="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700"
								type="button"
							>
								+ Добавить элемент
							</button>
						</div>

						<div class="space-y-3">
							{#each group.items as item, itemIndex (itemIndex)}
								<div class="rounded border border-gray-200 bg-white p-3">
									<div class="mb-2 flex items-center justify-between">
										<span class="text-xs font-medium text-gray-500">Элемент {itemIndex + 1}</span>
										<button
											onclick={() => removeItem(groupIndex, itemIndex)}
											class="rounded p-1 text-red-600 hover:bg-red-50"
											type="button"
											aria-label="Удалить элемент"
										>
											<span class="icon-[lucide--trash-2] h-4 w-4"></span>
										</button>
									</div>
									<div class="space-y-2">
										<input
											type="text"
											value={item.title}
											oninput={(e) =>
												updateItem(groupIndex, itemIndex, 'title', e.currentTarget.value)}
											class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
											placeholder="Название"
										/>
										<input
											type="text"
											value={item.details}
											oninput={(e) =>
												updateItem(groupIndex, itemIndex, 'details', e.currentTarget.value)}
											class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
											placeholder="Детали"
										/>
										<input
											type="text"
											value={item.diploma || ''}
											oninput={(e) =>
												updateItem(groupIndex, itemIndex, 'diploma', e.currentTarget.value)}
											class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
											placeholder="URL диплома (необязательно)"
										/>
										<label class="flex cursor-pointer items-center gap-2">
											<input
												type="checkbox"
												checked={item.completed}
												onchange={(e) =>
													updateItem(groupIndex, itemIndex, 'completed', e.currentTarget.checked)}
												class="h-4 w-4 rounded border-gray-300"
											/>
											<span class="text-xs text-gray-600">Завершено</span>
										</label>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<script lang="ts">
	import type { TextBlockSectionBlock } from '$lib/types/page-blocks';

	interface Props {
		block: TextBlockSectionBlock;
		onUpdate: (block: TextBlockSectionBlock) => void;
	}

	let { block, onUpdate }: Props = $props();

	function updateConfig<K extends keyof TextBlockSectionBlock['config']>(
		key: K,
		value: TextBlockSectionBlock['config'][K]
	) {
		const updated = {
			...block,
			config: { ...block.config, [key]: value }
		};
		onUpdate(updated);
	}

	function addBlock() {
		const blocks = [...block.config.blocks, { title: '', data: [''] }];
		updateConfig('blocks', blocks);
	}

	function updateBlockTitle(index: number, value: string) {
		const blocks = [...block.config.blocks];
		blocks[index] = { ...blocks[index], title: value };
		updateConfig('blocks', blocks);
	}

	function updateBlockData(blockIndex: number, dataIndex: number, value: string) {
		const blocks = [...block.config.blocks];
		const data = [...blocks[blockIndex].data];
		data[dataIndex] = value;
		blocks[blockIndex] = { ...blocks[blockIndex], data };
		updateConfig('blocks', blocks);
	}

	function addDataItem(blockIndex: number) {
		const blocks = [...block.config.blocks];
		blocks[blockIndex] = {
			...blocks[blockIndex],
			data: [...blocks[blockIndex].data, '']
		};
		updateConfig('blocks', blocks);
	}

	function removeDataItem(blockIndex: number, dataIndex: number) {
		const blocks = [...block.config.blocks];
		blocks[blockIndex] = {
			...blocks[blockIndex],
			data: blocks[blockIndex].data.filter((_, i) => i !== dataIndex)
		};
		updateConfig('blocks', blocks);
	}

	function removeBlock(index: number) {
		const blocks = block.config.blocks.filter((_, i) => i !== index);
		updateConfig('blocks', blocks);
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<label class="block text-sm font-medium text-gray-700">Текстовые блоки</label>
		<button
			onclick={addBlock}
			class="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
			type="button"
		>
			+ Добавить блок
		</button>
	</div>

	<div class="space-y-4">
		{#each block.config.blocks as textBlock, blockIndex (blockIndex)}
			<div class="rounded border border-gray-200 p-4">
				<div class="mb-3 flex items-center justify-between">
					<span class="text-xs font-medium text-gray-500">Блок {blockIndex + 1}</span>
					<button
						onclick={() => removeBlock(blockIndex)}
						class="rounded p-1 text-red-600 hover:bg-red-50"
						type="button"
						disabled={block.config.blocks.length === 1}
						aria-label="Удалить блок"
					>
						<span class="icon-[lucide--trash-2] h-4 w-4"></span>
					</button>
				</div>

				<div class="space-y-3">
					<div>
						<label class="mb-1 block text-sm font-medium text-gray-700">Заголовок блока</label>
						<input
							type="text"
							value={textBlock.title}
							oninput={(e) => updateBlockTitle(blockIndex, e.currentTarget.value)}
							class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
							placeholder="Заголовок"
						/>
					</div>

					<div>
						<div class="mb-2 flex items-center justify-between">
							<label class="block text-sm font-medium text-gray-700">Параграфы</label>
							<button
								onclick={() => addDataItem(blockIndex)}
								class="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200"
								type="button"
							>
								+ Параграф
							</button>
						</div>

						<div class="space-y-2">
							{#each textBlock.data as dataItem, dataIndex (dataIndex)}
								<div class="flex gap-2">
									<textarea
										value={dataItem}
										oninput={(e) =>
											updateBlockData(blockIndex, dataIndex, e.currentTarget.value)}
										rows="2"
										class="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
										placeholder="Текст параграфа"
									></textarea>
									<button
										onclick={() => removeDataItem(blockIndex, dataIndex)}
										class="rounded p-2 text-red-600 hover:bg-red-50"
										type="button"
										disabled={textBlock.data.length === 1}
										aria-label="Удалить параграф"
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

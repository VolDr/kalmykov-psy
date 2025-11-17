<script lang="ts">
	import type { FaqBlock } from '$lib/types/page-blocks';

	interface Props {
		block: FaqBlock;
		onUpdate: (block: FaqBlock) => void;
	}

	let { block, onUpdate }: Props = $props();

	function updateConfig<K extends keyof FaqBlock['config']>(
		key: K,
		value: FaqBlock['config'][K]
	) {
		const updated = {
			...block,
			config: { ...block.config, [key]: value }
		};
		onUpdate(updated);
	}

	function addItem() {
		const items = [...(block.config.items || []), { question: '', answer: '' }];
		updateConfig('items', items);
	}

	function updateItem(
		index: number,
		field: 'question' | 'answer',
		value: string
	) {
		const items = [...(block.config.items || [])];
		items[index] = { ...items[index], [field]: value };
		updateConfig('items', items);
	}

	function removeItem(index: number) {
		const items = (block.config.items || []).filter((_, i) => i !== index);
		updateConfig('items', items.length > 0 ? items : undefined);
	}
</script>

<div class="space-y-4">
	<div class="rounded bg-blue-50 p-3 text-sm text-blue-700">
		{#if !block.config.items || block.config.items.length === 0}
			Данные по умолчанию берутся из файла src/lib/data/faq.ts. Добавьте вопросы ниже для
			переопределения.
		{:else}
			Используются пользовательские вопросы. Удалите все вопросы для использования данных по
			умолчанию.
		{/if}
	</div>

	<div>
		<div class="mb-2 flex items-center justify-between">
			<label class="block text-sm font-medium text-gray-700">Вопросы и ответы</label>
			<button
				onclick={addItem}
				class="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
				type="button"
			>
				+ Добавить вопрос
			</button>
		</div>

		{#if block.config.items && block.config.items.length > 0}
			<div class="space-y-3">
				{#each block.config.items as item, i (i)}
					<div class="rounded border border-gray-200 p-3">
						<div class="mb-2 flex items-center justify-between">
							<span class="text-xs font-medium text-gray-500">Вопрос {i + 1}</span>
							<button
								onclick={() => removeItem(i)}
								class="rounded p-1 text-red-600 hover:bg-red-50"
								type="button"
								aria-label="Удалить вопрос"
							>
								<span class="icon-[lucide--trash-2] h-4 w-4"></span>
							</button>
						</div>
						<div class="space-y-2">
							<input
								type="text"
								value={item.question}
								oninput={(e) => updateItem(i, 'question', e.currentTarget.value)}
								class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
								placeholder="Вопрос"
							/>
							<textarea
								value={item.answer}
								oninput={(e) => updateItem(i, 'answer', e.currentTarget.value)}
								rows="3"
								class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
								placeholder="Ответ (поддерживается markdown)"
							></textarea>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

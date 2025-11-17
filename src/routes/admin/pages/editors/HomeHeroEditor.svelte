<script lang="ts">
	import type { HomeHeroBlock } from '$lib/types/page-blocks';

	interface Props {
		block: HomeHeroBlock;
		onUpdate: (block: HomeHeroBlock) => void;
	}

	let { block, onUpdate }: Props = $props();

	function updateConfig<K extends keyof HomeHeroBlock['config']>(
		key: K,
		value: HomeHeroBlock['config'][K]
	) {
		const updated = {
			...block,
			config: { ...block.config, [key]: value }
		};
		onUpdate(updated);
	}
</script>

<div class="space-y-4">
	<div class="rounded bg-blue-50 p-3 text-sm text-blue-700">
		Этот блок использует фиксированную структуру. Оставьте поля пустыми для использования
		значений по умолчанию.
	</div>

	<div>
		<label for="title-line-1" class="mb-1 block text-sm font-medium text-gray-700">
			Заголовок (строка 1)
		</label>
		<input
			id="title-line-1"
			type="text"
			value={block.config.titleLine1 || ''}
			oninput={(e) => updateConfig('titleLine1', e.currentTarget.value || undefined)}
			class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
			placeholder="Психолог (значение по умолчанию)"
		/>
	</div>

	<div>
		<label for="title-line-2" class="mb-1 block text-sm font-medium text-gray-700">
			Заголовок (строка 2)
		</label>
		<input
			id="title-line-2"
			type="text"
			value={block.config.titleLine2 || ''}
			oninput={(e) => updateConfig('titleLine2', e.currentTarget.value || undefined)}
			class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
			placeholder="Калмыков Владимир (значение по умолчанию)"
		/>
	</div>

	<div>
		<label for="subtitle" class="mb-1 block text-sm font-medium text-gray-700">
			Подзаголовок
		</label>
		<textarea
			id="subtitle"
			value={block.config.subtitle || ''}
			oninput={(e) => updateConfig('subtitle', e.currentTarget.value || undefined)}
			rows="3"
			class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
			placeholder="Описание (значение по умолчанию)"
		></textarea>
	</div>

	<div>
		<label for="subtitle-secondary" class="mb-1 block text-sm font-medium text-gray-700">
			Дополнительный подзаголовок
		</label>
		<textarea
			id="subtitle-secondary"
			value={block.config.subtitleSecondary || ''}
			oninput={(e) => updateConfig('subtitleSecondary', e.currentTarget.value || undefined)}
			rows="2"
			class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
			placeholder="Дополнительное описание (опционально)"
		></textarea>
	</div>
</div>

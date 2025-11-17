<script lang="ts">
	import type { ConsultationInfoBlock } from '$lib/types/page-blocks';

	interface Props {
		block: ConsultationInfoBlock;
		onUpdate: (block: ConsultationInfoBlock) => void;
	}

	let { block, onUpdate }: Props = $props();

	function updateConfig<K extends keyof ConsultationInfoBlock['config']>(
		key: K,
		value: ConsultationInfoBlock['config'][K]
	) {
		const updated = {
			...block,
			config: { ...block.config, [key]: value }
		};
		onUpdate(updated);
	}
</script>

<div class="space-y-4">
	<div>
		<label for="price" class="mb-1 block text-sm font-medium text-gray-700"> Цена * </label>
		<input
			id="price"
			type="text"
			value={block.config.price}
			oninput={(e) => updateConfig('price', e.currentTarget.value)}
			class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
			placeholder="5000 рублей за сессию"
		/>
	</div>

	<div>
		<label for="format" class="mb-1 block text-sm font-medium text-gray-700"> Формат * </label>
		<input
			id="format"
			type="text"
			value={block.config.format}
			oninput={(e) => updateConfig('format', e.currentTarget.value)}
			class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
			placeholder="Встречи проходят онлайн"
		/>
	</div>

	<div>
		<label for="duration" class="mb-1 block text-sm font-medium text-gray-700">
			Длительность *
		</label>
		<input
			id="duration"
			type="text"
			value={block.config.duration}
			oninput={(e) => updateConfig('duration', e.currentTarget.value)}
			class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
			placeholder="Одна сессия — 50 минут"
		/>
	</div>
</div>

<script lang="ts">
	import type { EducationBlock } from '$lib/types/page-blocks';

	interface Props {
		block: EducationBlock;
		onUpdate: (block: EducationBlock) => void;
	}

	let { block, onUpdate }: Props = $props();

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
</script>

<div class="space-y-4">
	<div class="rounded bg-blue-50 p-3 text-sm text-blue-700">
		Данные для этого блока берутся из файла src/lib/data/education.ts
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
		<p class="ml-6 mt-1 text-xs text-gray-500">
			Секция будет раскрыта при загрузке страницы
		</p>
	</div>
</div>

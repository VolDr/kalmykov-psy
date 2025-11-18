<script lang="ts">
	import type { SectionContainerBlock } from '$lib/types/page-blocks';

	interface Props {
		block: SectionContainerBlock;
		onUpdate: (block: SectionContainerBlock) => void;
	}

	let { block, onUpdate }: Props = $props();

	function updateConfig<K extends keyof SectionContainerBlock['config']>(
		key: K,
		value: SectionContainerBlock['config'][K]
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
		Этот блок является контейнером для вложенных блоков. Используйте JSON редактор для управления
		дочерними блоками.
	</div>

	<div>
		<label for="container-title" class="mb-1 block text-sm font-medium text-gray-700">
			Заголовок секции
		</label>
		<input
			id="container-title"
			type="text"
			value={block.config.title || ''}
			oninput={(e) => updateConfig('title', e.currentTarget.value || undefined)}
			class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
			placeholder="Заголовок (опционально)"
		/>
	</div>

	<div>
		<label for="container-subtitle" class="mb-1 block text-sm font-medium text-gray-700">
			Подзаголовок
		</label>
		<input
			id="container-subtitle"
			type="text"
			value={block.config.subtitle || ''}
			oninput={(e) => updateConfig('subtitle', e.currentTarget.value || undefined)}
			class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
			placeholder="Подзаголовок (опционально)"
		/>
	</div>

	<div class="grid grid-cols-3 gap-4">
		<div>
			<label for="container-max-width" class="mb-1 block text-sm font-medium text-gray-700">
				Макс. ширина
			</label>
			<select
				id="container-max-width"
				value={block.config.maxWidth || 'lg'}
				onchange={(e) =>
					updateConfig('maxWidth', e.currentTarget.value as 'sm' | 'md' | 'lg' | undefined)}
				class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
			>
				<option value="sm">Узкая (960px)</option>
				<option value="md">Средняя (1200px)</option>
				<option value="lg">Широкая (1200px+)</option>
			</select>
		</div>

		<div>
			<label for="container-gap" class="mb-1 block text-sm font-medium text-gray-700">
				Отступы
			</label>
			<select
				id="container-gap"
				value={block.config.gap || 'md'}
				onchange={(e) =>
					updateConfig('gap', e.currentTarget.value as 'sm' | 'md' | 'lg' | undefined)}
				class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
			>
				<option value="sm">Малые</option>
				<option value="md">Средние</option>
				<option value="lg">Большие</option>
			</select>
		</div>

		<div>
			<label for="container-align" class="mb-1 block text-sm font-medium text-gray-700">
				Выравнивание
			</label>
			<select
				id="container-align"
				value={block.config.titleAlign || 'left'}
				onchange={(e) =>
					updateConfig('titleAlign', e.currentTarget.value as 'left' | 'center' | undefined)}
				class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
			>
				<option value="left">Слева</option>
				<option value="center">По центру</option>
			</select>
		</div>
	</div>

	<div>
		<label for="container-class" class="mb-1 block text-sm font-medium text-gray-700">
			Дополнительные CSS классы
		</label>
		<input
			id="container-class"
			type="text"
			value={block.config.className || ''}
			oninput={(e) => updateConfig('className', e.currentTarget.value || undefined)}
			class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
			placeholder="bg-gray-50 py-12"
		/>
	</div>

	<div class="rounded border border-gray-200 bg-gray-50 p-3">
		<p class="text-xs text-gray-600">
			Вложенные блоки ({block.config.children.length}): Используйте JSON редактор для добавления и
			настройки дочерних блоков
		</p>
	</div>
</div>

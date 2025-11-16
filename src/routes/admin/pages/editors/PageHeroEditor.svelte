<script lang="ts">
	import type { PageHeroBlock } from '$lib/types/page-blocks';

	interface Props {
		block: PageHeroBlock;
		onUpdate: (block: PageHeroBlock) => void;
	}

	let { block, onUpdate }: Props = $props();

	function updateConfig<K extends keyof PageHeroBlock['config']>(
		key: K,
		value: PageHeroBlock['config'][K]
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
		<label for="hero-title" class="mb-1 block text-sm font-medium text-gray-700">
			Заголовок *
		</label>
		<input
			id="hero-title"
			type="text"
			value={block.config.title}
			oninput={(e) => updateConfig('title', e.currentTarget.value)}
			class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
			placeholder="Заголовок страницы"
		/>
	</div>

	<div>
		<label for="hero-subtitle" class="mb-1 block text-sm font-medium text-gray-700">
			Подзаголовок *
		</label>
		<textarea
			id="hero-subtitle"
			value={block.config.subtitle}
			oninput={(e) => updateConfig('subtitle', e.currentTarget.value)}
			rows="3"
			class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
			placeholder="Описание страницы"
		></textarea>
	</div>

	<div>
		<label for="hero-subtitle-secondary" class="mb-1 block text-sm font-medium text-gray-700">
			Дополнительный подзаголовок
		</label>
		<textarea
			id="hero-subtitle-secondary"
			value={block.config.subtitleSecondary || ''}
			oninput={(e) => updateConfig('subtitleSecondary', e.currentTarget.value || undefined)}
			rows="2"
			class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
			placeholder="Опционально"
		></textarea>
	</div>

	<div class="grid grid-cols-3 gap-4">
		<div>
			<label for="hero-max-width" class="mb-1 block text-sm font-medium text-gray-700">
				Макс. ширина
			</label>
			<select
				id="hero-max-width"
				value={block.config.maxWidth || 'lg'}
				onchange={(e) => updateConfig('maxWidth', e.currentTarget.value as 'sm' | 'md' | 'lg')}
				class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
			>
				<option value="sm">960px (узкий)</option>
				<option value="md">1200px</option>
				<option value="lg">1200px (стандарт)</option>
			</select>
		</div>

		<div>
			<label for="hero-line-height" class="mb-1 block text-sm font-medium text-gray-700">
				Межстрочный интервал
			</label>
			<select
				id="hero-line-height"
				value={block.config.titleLineHeight || 'relaxed'}
				onchange={(e) =>
					updateConfig('titleLineHeight', e.currentTarget.value as 'tight' | 'relaxed')}
				class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
			>
				<option value="relaxed">Свободный</option>
				<option value="tight">Плотный</option>
			</select>
		</div>

		<div>
			<label for="hero-row-start" class="mb-1 block text-sm font-medium text-gray-700">
				Позиция текста
			</label>
			<select
				id="hero-row-start"
				value={block.config.subtitleRowStart || '8'}
				onchange={(e) => updateConfig('subtitleRowStart', e.currentTarget.value as '8' | '9')}
				class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
			>
				<option value="8">Стандартная (row-8)</option>
				<option value="9">Ниже (row-9)</option>
			</select>
		</div>
	</div>
</div>

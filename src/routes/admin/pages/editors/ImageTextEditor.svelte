<script lang="ts">
	import type { ImageTextBlock } from '$lib/types/page-blocks';

	interface Props {
		block: ImageTextBlock;
		onUpdate: (block: ImageTextBlock) => void;
	}

	let { block, onUpdate }: Props = $props();

	function updateConfig<K extends keyof ImageTextBlock['config']>(
		key: K,
		value: ImageTextBlock['config'][K]
	) {
		const updated = {
			...block,
			config: { ...block.config, [key]: value }
		};
		onUpdate(updated);
	}

	function updateImage<K extends keyof ImageTextBlock['config']['image']>(
		key: K,
		value: ImageTextBlock['config']['image'][K]
	) {
		const updated = {
			...block,
			config: {
				...block.config,
				image: { ...block.config.image, [key]: value }
			}
		};
		onUpdate(updated);
	}

	function updateParagraph(index: number, value: string) {
		const paragraphs = [...block.config.paragraphs];
		paragraphs[index] = value;
		updateConfig('paragraphs', paragraphs);
	}

	function addParagraph() {
		const paragraphs = [...block.config.paragraphs, ''];
		updateConfig('paragraphs', paragraphs);
	}

	function removeParagraph(index: number) {
		const paragraphs = block.config.paragraphs.filter((_, i) => i !== index);
		updateConfig('paragraphs', paragraphs);
	}
</script>

<div class="space-y-4">
	<!-- Image Settings -->
	<div class="rounded border border-gray-200 p-4">
		<h4 class="mb-3 font-semibold text-gray-700">Изображение</h4>
		<div class="space-y-3">
			<div>
				<label for="image-src" class="mb-1 block text-sm font-medium text-gray-700">
					Путь к изображению *
				</label>
				<input
					id="image-src"
					type="text"
					value={block.config.image.src}
					oninput={(e) => updateImage('src', e.currentTarget.value)}
					class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
					placeholder="/image.webp"
				/>
			</div>

			<div>
				<label for="image-src-small" class="mb-1 block text-sm font-medium text-gray-700">
					Путь к изображению (маленькое)
				</label>
				<input
					id="image-src-small"
					type="text"
					value={block.config.image.srcSmall || ''}
					oninput={(e) => updateImage('srcSmall', e.currentTarget.value || undefined)}
					class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
					placeholder="/image-small.webp"
				/>
			</div>

			<div>
				<label for="image-alt" class="mb-1 block text-sm font-medium text-gray-700">
					Alt текст *
				</label>
				<input
					id="image-alt"
					type="text"
					value={block.config.image.alt}
					oninput={(e) => updateImage('alt', e.currentTarget.value)}
					class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
					placeholder="Описание изображения"
				/>
			</div>

			<div>
				<label for="image-class" class="mb-1 block text-sm font-medium text-gray-700">
					CSS классы изображения
				</label>
				<input
					id="image-class"
					type="text"
					value={block.config.image.imgClass || ''}
					oninput={(e) => updateImage('imgClass', e.currentTarget.value || undefined)}
					class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
					placeholder="rounded-lg shadow-md"
				/>
			</div>
		</div>
	</div>

	<!-- Layout -->
	<div>
		<label for="layout" class="mb-1 block text-sm font-medium text-gray-700">
			Расположение изображения *
		</label>
		<select
			id="layout"
			value={block.config.layout}
			onchange={(e) =>
				updateConfig('layout', e.currentTarget.value as 'image-left' | 'image-right')}
			class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
		>
			<option value="image-left">Изображение слева</option>
			<option value="image-right">Изображение справа</option>
		</select>
	</div>

	<!-- Paragraphs -->
	<div>
		<div class="mb-2 flex items-center justify-between">
			<label class="block text-sm font-medium text-gray-700">Параграфы текста *</label>
			<button
				onclick={addParagraph}
				class="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
				type="button"
			>
				+ Добавить параграф
			</button>
		</div>
		<div class="space-y-2">
			{#each block.config.paragraphs as paragraph, i (i)}
				<div class="flex gap-2">
					<textarea
						value={paragraph}
						oninput={(e) => updateParagraph(i, e.currentTarget.value)}
						rows="3"
						class="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
						placeholder="Текст параграфа (поддерживается markdown для ссылок и жирного текста)"
					></textarea>
					<button
						onclick={() => removeParagraph(i)}
						class="rounded p-2 text-red-600 hover:bg-red-50"
						type="button"
						disabled={block.config.paragraphs.length === 1}
						aria-label="Удалить параграф"
					>
						<span class="icon-[lucide--trash-2] h-4 w-4"></span>
					</button>
				</div>
			{/each}
		</div>
	</div>
</div>

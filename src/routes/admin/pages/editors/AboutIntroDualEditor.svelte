<script lang="ts">
	import type { AboutIntroDualBlock } from '$lib/types/page-blocks';

	interface Props {
		block: AboutIntroDualBlock;
		onUpdate: (block: AboutIntroDualBlock) => void;
	}

	let { block, onUpdate }: Props = $props();

	function updateConfig<K extends keyof AboutIntroDualBlock['config']>(
		key: K,
		value: AboutIntroDualBlock['config'][K]
	) {
		const updated = {
			...block,
			config: { ...block.config, [key]: value }
		};
		onUpdate(updated);
	}

	function updateLeftImage<K extends keyof AboutIntroDualBlock['config']['leftImage']>(
		key: K,
		value: AboutIntroDualBlock['config']['leftImage'][K]
	) {
		const updated = {
			...block,
			config: {
				...block.config,
				leftImage: { ...block.config.leftImage, [key]: value }
			}
		};
		onUpdate(updated);
	}

	function updateRightImage<K extends keyof AboutIntroDualBlock['config']['rightImage']>(
		key: K,
		value: AboutIntroDualBlock['config']['rightImage'][K]
	) {
		const updated = {
			...block,
			config: {
				...block.config,
				rightImage: { ...block.config.rightImage, [key]: value }
			}
		};
		onUpdate(updated);
	}

	function updateLeftText(index: number, value: string) {
		const leftTexts = [...block.config.leftTexts];
		leftTexts[index] = value;
		updateConfig('leftTexts', leftTexts);
	}

	function updateRightText(index: number, value: string) {
		const rightTexts = [...block.config.rightTexts];
		rightTexts[index] = value;
		updateConfig('rightTexts', rightTexts);
	}

	function addLeftText() {
		const leftTexts = [...block.config.leftTexts, ''];
		updateConfig('leftTexts', leftTexts);
	}

	function addRightText() {
		const rightTexts = [...block.config.rightTexts, ''];
		updateConfig('rightTexts', rightTexts);
	}

	function removeLeftText(index: number) {
		const leftTexts = block.config.leftTexts.filter((_, i) => i !== index);
		updateConfig('leftTexts', leftTexts);
	}

	function removeRightText(index: number) {
		const rightTexts = block.config.rightTexts.filter((_, i) => i !== index);
		updateConfig('rightTexts', rightTexts);
	}
</script>

<div class="space-y-6">
	<!-- Left Side -->
	<div class="rounded border border-gray-200 p-4">
		<h4 class="mb-3 font-semibold text-gray-700">Левая сторона</h4>

		<div class="space-y-3">
			<div>
				<label class="mb-1 block text-sm font-medium text-gray-700">Изображение *</label>
				<input
					type="text"
					value={block.config.leftImage.src}
					oninput={(e) => updateLeftImage('src', e.currentTarget.value)}
					class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
					placeholder="/image.webp"
				/>
			</div>

			<div>
				<label class="mb-1 block text-sm font-medium text-gray-700">Alt текст *</label>
				<input
					type="text"
					value={block.config.leftImage.alt}
					oninput={(e) => updateLeftImage('alt', e.currentTarget.value)}
					class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
					placeholder="Описание изображения"
				/>
			</div>

			<div>
				<div class="mb-2 flex items-center justify-between">
					<label class="block text-sm font-medium text-gray-700">Текстовые параграфы *</label>
					<button
						onclick={addLeftText}
						class="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
						type="button"
					>
						+ Параграф
					</button>
				</div>
				<div class="space-y-2">
					{#each block.config.leftTexts as text, i (i)}
						<div class="flex gap-2">
							<textarea
								value={text}
								oninput={(e) => updateLeftText(i, e.currentTarget.value)}
								rows="2"
								class="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
								placeholder="Текст"
							></textarea>
							<button
								onclick={() => removeLeftText(i)}
								class="rounded p-2 text-red-600 hover:bg-red-50"
								type="button"
								disabled={block.config.leftTexts.length === 1}
								aria-label="Удалить"
							>
								<span class="icon-[lucide--x] h-4 w-4"></span>
							</button>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>

	<!-- Right Side -->
	<div class="rounded border border-gray-200 p-4">
		<h4 class="mb-3 font-semibold text-gray-700">Правая сторона</h4>

		<div class="space-y-3">
			<div>
				<label class="mb-1 block text-sm font-medium text-gray-700">Изображение *</label>
				<input
					type="text"
					value={block.config.rightImage.src}
					oninput={(e) => updateRightImage('src', e.currentTarget.value)}
					class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
					placeholder="/image.webp"
				/>
			</div>

			<div>
				<label class="mb-1 block text-sm font-medium text-gray-700">Alt текст *</label>
				<input
					type="text"
					value={block.config.rightImage.alt}
					oninput={(e) => updateRightImage('alt', e.currentTarget.value)}
					class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
					placeholder="Описание изображения"
				/>
			</div>

			<div>
				<div class="mb-2 flex items-center justify-between">
					<label class="block text-sm font-medium text-gray-700">Текстовые параграфы *</label>
					<button
						onclick={addRightText}
						class="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
						type="button"
					>
						+ Параграф
					</button>
				</div>
				<div class="space-y-2">
					{#each block.config.rightTexts as text, i (i)}
						<div class="flex gap-2">
							<textarea
								value={text}
								oninput={(e) => updateRightText(i, e.currentTarget.value)}
								rows="2"
								class="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
								placeholder="Текст"
							></textarea>
							<button
								onclick={() => removeRightText(i)}
								class="rounded p-2 text-red-600 hover:bg-red-50"
								type="button"
								disabled={block.config.rightTexts.length === 1}
								aria-label="Удалить"
							>
								<span class="icon-[lucide--x] h-4 w-4"></span>
							</button>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>

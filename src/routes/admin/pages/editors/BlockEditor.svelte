<script lang="ts">
	import type { PageBlock } from '$lib/types/page-blocks';
	import { blockMetadataRegistry } from '$lib/types/page-blocks';
	import PageHeroEditor from './PageHeroEditor.svelte';

	interface Props {
		block: PageBlock;
		onUpdate: (block: PageBlock) => void;
		onDelete: () => void;
		onDuplicate: () => void;
		onMoveUp: () => void;
		onMoveDown: () => void;
		isFirst: boolean;
		isLast: boolean;
	}

	let { block, onUpdate, onDelete, onDuplicate, onMoveUp, onMoveDown, isFirst, isLast }: Props =
		$props();

	let isExpanded = $state(true);
	let showJsonEditor = $state(false);
	let jsonContent = $state(JSON.stringify(block.config, null, 2));
	let jsonError = $state('');

	const blockMeta = $derived(blockMetadataRegistry.find((b) => b.type === block.type));

	// Block types that support withReveal animation
	const blocksWithRevealSupport = [
		'image-text',
		'issues-list',
		'about-section',
		'education',
		'about-intro-dual'
	];

	const supportsReveal = $derived(blocksWithRevealSupport.includes(block.type));
	const hasReveal = $derived(
		supportsReveal && 'withReveal' in (block.config as Record<string, unknown>)
			? (block.config as Record<string, unknown>).withReveal
			: false
	);

	function toggleActive() {
		onUpdate({ ...block, isActive: !block.isActive });
	}

	function toggleReveal() {
		if (!supportsReveal) return;
		const config = block.config as Record<string, unknown>;
		const newConfig = { ...config, withReveal: !config.withReveal };
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		onUpdate({ ...block, config: newConfig as any });
	}

	function updateFromJson() {
		try {
			const parsed = JSON.parse(jsonContent);
			jsonError = '';
			onUpdate({ ...block, config: parsed });
			showJsonEditor = false;
		} catch {
			jsonError = 'Неверный JSON формат';
		}
	}

	function formatJson() {
		try {
			const parsed = JSON.parse(jsonContent);
			jsonContent = JSON.stringify(parsed, null, 2);
			jsonError = '';
		} catch {
			jsonError = 'Неверный JSON формат';
		}
	}

	// Sync JSON when block changes
	$effect(() => {
		jsonContent = JSON.stringify(block.config, null, 2);
	});

	const iconMap: Record<string, string> = {
		'layout-template': 'icon-[lucide--layout-template]',
		'layout-sidebar': 'icon-[lucide--layout-panel-left]',
		box: 'icon-[lucide--box]',
		'grid-3x3': 'icon-[lucide--grid-3x3]',
		text: 'icon-[lucide--text]',
		home: 'icon-[lucide--home]',
		'graduation-cap': 'icon-[lucide--graduation-cap]',
		'circle-help': 'icon-[lucide--circle-help]',
		info: 'icon-[lucide--info]',
		user: 'icon-[lucide--user]',
		'list-checks': 'icon-[lucide--list-checks]',
		'layout-grid': 'icon-[lucide--layout-grid]'
	};
</script>

<div
	class="rounded-lg border bg-white shadow-sm transition-all {block.isActive
		? 'border-gray-200'
		: 'border-gray-300 bg-gray-50 opacity-75'}"
>
	<!-- Header -->
	<div class="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
		<div class="flex items-center gap-3">
			<button
				onclick={() => (isExpanded = !isExpanded)}
				class="rounded p-1 text-gray-500 hover:bg-gray-200"
				aria-label={isExpanded ? 'Свернуть' : 'Развернуть'}
			>
				<span
					class="h-4 w-4 transition-transform {isExpanded
						? 'icon-[lucide--chevron-down]'
						: 'icon-[lucide--chevron-right]'}"
				></span>
			</button>

			<div class="flex items-center gap-2">
				<span
					class="{iconMap[blockMeta?.icon || 'box'] || 'icon-[lucide--box]'} h-5 w-5 text-gray-600"
				></span>
				<h3 class="font-semibold text-gray-800">{blockMeta?.name || block.type}</h3>
			</div>

			{#if !block.isActive}
				<span class="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-600">Неактивен</span>
			{/if}

			<span class="text-xs text-gray-400">#{block.sortOrder}</span>
		</div>

		<!-- Actions -->
		<div class="flex items-center gap-1">
			<button
				onclick={onMoveUp}
				disabled={isFirst}
				class="rounded p-1.5 text-gray-500 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-30"
				aria-label="Переместить вверх"
			>
				<span class="icon-[lucide--chevron-up] h-4 w-4"></span>
			</button>
			<button
				onclick={onMoveDown}
				disabled={isLast}
				class="rounded p-1.5 text-gray-500 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-30"
				aria-label="Переместить вниз"
			>
				<span class="icon-[lucide--chevron-down] h-4 w-4"></span>
			</button>
			<div class="mx-1 h-4 w-px bg-gray-300"></div>
			{#if supportsReveal}
				<button
					onclick={toggleReveal}
					class="rounded p-1.5 {hasReveal
						? 'text-amber-600 hover:text-amber-700'
						: 'text-gray-500 hover:text-amber-600'} hover:bg-gray-200"
					aria-label={hasReveal ? 'Отключить анимацию' : 'Включить анимацию'}
					title={hasReveal ? 'Анимация включена' : 'Анимация выключена'}
				>
					<span class="icon-[lucide--sparkles] h-4 w-4"></span>
				</button>
			{/if}
			<button
				onclick={onDuplicate}
				class="rounded p-1.5 text-gray-500 hover:bg-gray-200 hover:text-blue-600"
				aria-label="Дублировать"
			>
				<span class="icon-[lucide--copy] h-4 w-4"></span>
			</button>
			<button
				onclick={toggleActive}
				class="rounded p-1.5 text-gray-500 hover:bg-gray-200 {block.isActive
					? 'hover:text-yellow-600'
					: 'hover:text-green-600'}"
				aria-label={block.isActive ? 'Деактивировать' : 'Активировать'}
			>
				<span class="h-4 w-4 {block.isActive ? 'icon-[lucide--eye-off]' : 'icon-[lucide--eye]'}"
				></span>
			</button>
			<button
				onclick={() => (showJsonEditor = !showJsonEditor)}
				class="rounded p-1.5 text-gray-500 hover:bg-gray-200 hover:text-purple-600"
				aria-label="JSON редактор"
			>
				<span class="icon-[lucide--code] h-4 w-4"></span>
			</button>
			<button
				onclick={onDelete}
				class="rounded p-1.5 text-gray-500 hover:bg-gray-200 hover:text-red-600"
				aria-label="Удалить"
			>
				<span class="icon-[lucide--trash-2] h-4 w-4"></span>
			</button>
		</div>
	</div>

	<!-- Content -->
	{#if isExpanded}
		<div class="p-4">
			{#if showJsonEditor}
				<!-- JSON Editor -->
				<div class="space-y-3">
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium text-gray-700">Редактор JSON</span>
						<button onclick={formatJson} class="text-xs text-blue-600 hover:text-blue-800">
							Форматировать
						</button>
					</div>
					{#if jsonError}
						<div class="rounded bg-red-50 p-2 text-xs text-red-600">{jsonError}</div>
					{/if}
					<textarea
						bind:value={jsonContent}
						rows="15"
						class="w-full rounded border border-gray-300 px-3 py-2 font-mono text-xs focus:border-blue-500 focus:outline-none"
					></textarea>
					<div class="flex justify-end gap-2">
						<button
							onclick={() => {
								jsonContent = JSON.stringify(block.config, null, 2);
								showJsonEditor = false;
							}}
							class="rounded bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
						>
							Отмена
						</button>
						<button
							onclick={updateFromJson}
							class="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
						>
							Применить
						</button>
					</div>
				</div>
			{:else}
				<!-- Type-specific editors -->
				{#if block.type === 'page-hero'}
					<PageHeroEditor {block} onUpdate={(b) => onUpdate(b)} />
				{:else}
					<!-- Fallback to JSON for blocks without visual editor -->
					<div class="rounded border border-dashed border-gray-300 bg-gray-50 p-4 text-center">
						<span class="mx-auto mb-2 icon-[lucide--code] h-8 w-8 text-gray-400"></span>
						<p class="mb-2 text-sm text-gray-600">
							Визуальный редактор для этого блока в разработке
						</p>
						<button
							onclick={() => (showJsonEditor = true)}
							class="rounded bg-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-300"
						>
							Редактировать JSON
						</button>
					</div>
				{/if}
			{/if}
		</div>
	{/if}
</div>

<script lang="ts">
	import ChannelTab from './ChannelTab.svelte';
	import ExpertiseTab from './ExpertiseTab.svelte';
	import StructureTab from './StructureTab.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let activeTab = $state<'channel' | 'structures' | 'expertise'>('channel');

	const tabs = [
		{ id: 'channel' as const, label: 'Аналитика канала' },
		{ id: 'structures' as const, label: 'Структуры постов' },
		{ id: 'expertise' as const, label: 'Карта экспертизы' }
	];
</script>

<svelte:head>
	<title>Аналитика постов — админ</title>
</svelte:head>

<div class="min-w-0 p-6 lg:p-8">
	<div class="mb-6 flex flex-wrap items-end justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold">Аналитика постов</h1>
			<p class="mt-1 text-sm text-gray-500">
				@{data.channel.meta.handle} · {data.channel.meta.period}
			</p>
		</div>
		<p class="text-xs text-gray-400">Снимок данных: {data.generatedAt ?? 'не указан'}</p>
	</div>

	<div class="mb-8 border-b" role="tablist" aria-label="Разделы аналитики постов">
		<div class="flex gap-6 overflow-x-auto">
			{#each tabs as tab (tab.id)}
				<button
					type="button"
					role="tab"
					id="tab-{tab.id}"
					aria-controls="panel-{tab.id}"
					aria-selected={activeTab === tab.id}
					class="relative min-h-11 shrink-0 text-sm font-medium {activeTab === tab.id
						? 'text-gray-900 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary'
						: 'text-gray-500 hover:text-gray-900'}"
					onclick={() => (activeTab = tab.id)}
				>
					{tab.label}
				</button>
			{/each}
		</div>
	</div>

	<div>
		{#if activeTab === 'channel'}
			<div id="panel-channel" role="tabpanel" aria-labelledby="tab-channel">
				<ChannelTab channel={data.channel} posts={data.posts} />
			</div>
		{:else if activeTab === 'structures'}
			<div id="panel-structures" role="tabpanel" aria-labelledby="tab-structures">
				<StructureTab structures={data.structures} />
			</div>
		{:else}
			<div id="panel-expertise" role="tabpanel" aria-labelledby="tab-expertise">
				<ExpertiseTab expertise={data.expertise} />
			</div>
		{/if}
	</div>
</div>

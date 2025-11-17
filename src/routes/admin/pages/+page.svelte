<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/card/card.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showSEOEditor = $state(false);
	let editingSEO = $state<{ pageSlug: string; content: any } | null>(null);

	let seoContent = $state({
		pageSlug: data.selectedPage,
		title: '',
		description: '',
		ogImage: ''
	});

	let jsonError = $state('');

	function selectPage(pageSlug: string) {
		goto(`/admin/pages?page=${pageSlug}`);
	}

	function openSEOEditor() {
		// Find existing SEO section for this page
		const seoSection = data.pageContent.find(
			(s) => s.pageSlug === data.selectedPage && s.sectionKey === 'seo'
		);

		if (seoSection) {
			editingSEO = seoSection;
			const content = seoSection.content as any;
			seoContent = {
				pageSlug: data.selectedPage,
				title: content.title || '',
				description: content.description || '',
				ogImage: content.ogImage || ''
			};
		} else {
			editingSEO = null;
			seoContent = {
				pageSlug: data.selectedPage,
				title: '',
				description: '',
				ogImage: ''
			};
		}
		showSEOEditor = true;
	}

	function closeSEOEditor() {
		showSEOEditor = false;
		editingSEO = null;
	}
</script>

<div class="container mx-auto px-4 py-8">
	<div class="mb-8">
		<h1 class="mb-4 text-3xl font-bold text-gray-800">SEO настройки страниц</h1>

		<!-- Page selector -->
		<div class="mb-6 flex flex-wrap gap-2">
			{#each data.pageOptions as page (page.slug)}
				<button
					onclick={() => selectPage(page.slug)}
					class="rounded-lg px-4 py-2 text-sm font-medium transition-colors {data.selectedPage ===
					page.slug
						? 'bg-blue-600 text-white'
						: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
				>
					{page.name}
				</button>
			{/each}
		</div>
	</div>

	{#if form?.error}
		<div class="mb-4 rounded-lg bg-red-50 p-4 text-red-600">{form.error}</div>
	{/if}

	{#if form?.success}
		<div class="mb-4 rounded-lg bg-green-50 p-4 text-green-600">Сохранено успешно</div>
	{/if}

	<!-- SEO Settings for selected page -->
	<div class="mb-8">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-xl font-semibold text-gray-700">
				SEO для страницы: {data.pageOptions.find((p) => p.slug === data.selectedPage)?.name}
			</h2>
			<Button onclick={() => openSEOEditor()}>
				<span>Редактировать SEO</span>
			</Button>
		</div>

		{#each data.pageContent.filter(
			(s) => s.pageSlug === data.selectedPage && s.sectionKey === 'seo'
		) as seoSection}
			<Card class="rounded-lg border bg-white p-6 shadow-sm">
				<div class="space-y-3">
					<div>
						<h3 class="text-sm font-medium text-gray-500">Заголовок</h3>
						<p class="mt-1 text-gray-900">{seoSection.content.title}</p>
					</div>
					<div>
						<h3 class="text-sm font-medium text-gray-500">Описание</h3>
						<p class="mt-1 text-gray-900">{seoSection.content.description}</p>
					</div>
					{#if seoSection.content.ogImage}
						<div>
							<h3 class="text-sm font-medium text-gray-500">OG Image</h3>
							<p class="mt-1 text-gray-900">{seoSection.content.ogImage}</p>
						</div>
					{/if}
				</div>
			</Card>
		{:else}
			<Card class="rounded-lg border bg-white p-8 text-center shadow-sm">
				<p class="mb-4 text-gray-600">SEO настройки не заданы</p>
				<Button onclick={() => openSEOEditor()}>
					<span>Добавить SEO настройки</span>
				</Button>
			</Card>
		{/each}
	</div>
</div>

<!-- SEO Editor Modal -->
{#if showSEOEditor}
	<div
		class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black"
		onclick={closeSEOEditor}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		onkeydown={(e) => e.key === 'Escape' && closeSEOEditor()}
	>
		<div
			class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-8 shadow-xl"
			onclick={(e) => e.stopPropagation()}
			role="document"
		>
			<div class="mb-6 flex items-center justify-between">
				<h2 class="text-2xl font-bold text-gray-800">SEO настройки</h2>
				<button onclick={closeSEOEditor} class="text-gray-500 hover:text-gray-700">
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<form
				method="POST"
				action="?/saveSEO"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						closeSEOEditor();
					};
				}}
			>
				<input type="hidden" name="pageSlug" value={seoContent.pageSlug} />

				<div class="space-y-4">
					<div>
						<label for="seoTitle" class="mb-1 block text-sm font-medium text-gray-700">
							Заголовок (title) *
						</label>
						<input
							type="text"
							id="seoTitle"
							name="title"
							bind:value={seoContent.title}
							required
							class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
							placeholder="Психолог Андрей Калмыков | Онлайн-консультации"
						/>
						<p class="mt-1 text-xs text-gray-500">Рекомендуемая длина: 50-60 символов</p>
					</div>

					<div>
						<label for="seoDescription" class="mb-1 block text-sm font-medium text-gray-700">
							Описание (description) *
						</label>
						<textarea
							id="seoDescription"
							name="description"
							bind:value={seoContent.description}
							required
							rows="3"
							class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
							placeholder="Краткое описание страницы для поисковых систем"
						></textarea>
						<p class="mt-1 text-xs text-gray-500">Рекомендуемая длина: 150-160 символов</p>
					</div>

					<div>
						<label for="seoOgImage" class="mb-1 block text-sm font-medium text-gray-700">
							OG Image (опционально)
						</label>
						<input
							type="text"
							id="seoOgImage"
							name="ogImage"
							bind:value={seoContent.ogImage}
							class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
							placeholder="/header.webp"
						/>
						<p class="mt-1 text-xs text-gray-500">
							Изображение для социальных сетей (путь относительно корня сайта)
						</p>
					</div>

					<div class="flex justify-end gap-3 border-t pt-4">
						<Button type="button" variant="secondary" onclick={closeSEOEditor}>
							<span>Отмена</span>
						</Button>
						<Button type="submit">
							<span>Сохранить</span>
						</Button>
					</div>
				</div>
			</form>
		</div>
	</div>
{/if}

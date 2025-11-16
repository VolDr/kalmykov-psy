<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/card/card.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showSectionEditor = $state(false);
	let showSettingEditor = $state(false);
	let editingSection = $state<(typeof data.pageContent)[0] | null>(null);
	let editingSetting = $state<(typeof data.siteSettings)[0] | null>(null);

	let sectionContent = $state({
		pageSlug: data.selectedPage,
		sectionKey: '',
		content: '{}',
		sortOrder: 0,
		isActive: true
	});

	let settingContent = $state({
		key: '',
		value: '{}',
		description: ''
	});

	let jsonError = $state('');

	function selectPage(pageSlug: string) {
		goto(`/admin/pages?page=${pageSlug}`);
	}

	function openSectionEditor(section?: (typeof data.pageContent)[0]) {
		if (section) {
			editingSection = section;
			sectionContent = {
				pageSlug: section.pageSlug,
				sectionKey: section.sectionKey,
				content: JSON.stringify(section.content, null, 2),
				sortOrder: section.sortOrder,
				isActive: section.isActive
			};
		} else {
			editingSection = null;
			sectionContent = {
				pageSlug: data.selectedPage,
				sectionKey: '',
				content: '{}',
				sortOrder: data.pageContent.length * 10,
				isActive: true
			};
		}
		jsonError = '';
		showSectionEditor = true;
	}

	function openSettingEditor(setting?: (typeof data.siteSettings)[0]) {
		if (setting) {
			editingSetting = setting;
			settingContent = {
				key: setting.key,
				value: JSON.stringify(setting.value, null, 2),
				description: setting.description || ''
			};
		} else {
			editingSetting = null;
			settingContent = {
				key: '',
				value: '{}',
				description: ''
			};
		}
		jsonError = '';
		showSettingEditor = true;
	}

	function closeSectionEditor() {
		showSectionEditor = false;
		editingSection = null;
		jsonError = '';
	}

	function closeSettingEditor() {
		showSettingEditor = false;
		editingSetting = null;
		jsonError = '';
	}

	function validateJson(json: string): boolean {
		try {
			JSON.parse(json);
			jsonError = '';
			return true;
		} catch {
			jsonError = 'Неверный JSON формат';
			return false;
		}
	}

	function formatJson(field: 'section' | 'setting') {
		try {
			if (field === 'section') {
				const parsed = JSON.parse(sectionContent.content);
				sectionContent.content = JSON.stringify(parsed, null, 2);
			} else {
				const parsed = JSON.parse(settingContent.value);
				settingContent.value = JSON.stringify(parsed, null, 2);
			}
			jsonError = '';
		} catch {
			jsonError = 'Неверный JSON формат';
		}
	}

	function handleDeleteSection(pageSlug: string, sectionKey: string) {
		if (confirm(`Удалить секцию "${sectionKey}"?`)) {
			const form = document.getElementById(`delete-section-${sectionKey}`) as HTMLFormElement;
			form.requestSubmit();
		}
	}
</script>

<div class="container mx-auto px-4 py-8">
	<div class="mb-8">
		<h1 class="mb-4 text-3xl font-bold text-gray-800">Управление контентом страниц</h1>

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

	<!-- Sections for selected page -->
	<div class="mb-8">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-xl font-semibold text-gray-700">
				Секции страницы: {data.pageOptions.find((p) => p.slug === data.selectedPage)?.name}
			</h2>
			<Button onclick={() => openSectionEditor()}>
				<span>+ Добавить секцию</span>
			</Button>
		</div>

		{#if data.pageContent.length === 0}
			<Card class="rounded-lg border bg-white p-8 text-center shadow-sm">
				<p class="mb-4 text-gray-600">Нет секций для этой страницы</p>
				<Button onclick={() => openSectionEditor()}>
					<span>Создать первую секцию</span>
				</Button>
			</Card>
		{:else}
			<div class="space-y-3">
				{#each data.pageContent as section (section.id)}
					<Card class="rounded-lg border bg-white p-4 shadow-sm">
						<div class="flex items-center justify-between">
							<div class="flex-1">
								<div class="flex items-center gap-3">
									<h3 class="font-semibold text-gray-800">{section.sectionKey}</h3>
									{#if !section.isActive}
										<span class="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
											Неактивна
										</span>
									{/if}
									<span class="text-xs text-gray-400">Порядок: {section.sortOrder}</span>
								</div>
								<p class="mt-1 text-xs text-gray-500">
									{JSON.stringify(section.content).substring(0, 100)}...
								</p>
							</div>
							<div class="flex gap-2">
								<button
									onclick={() => openSectionEditor(section)}
									class="rounded p-2 text-gray-600 hover:bg-gray-100 hover:text-blue-600"
									aria-label="Редактировать"
								>
									<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
										<path
											d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
										/>
									</svg>
								</button>
								<form
									id="delete-section-{section.sectionKey}"
									method="POST"
									action="?/deleteSection"
									use:enhance
								>
									<input type="hidden" name="pageSlug" value={section.pageSlug} />
									<input type="hidden" name="sectionKey" value={section.sectionKey} />
									<button
										type="button"
										onclick={() => handleDeleteSection(section.pageSlug, section.sectionKey)}
										class="rounded p-2 text-gray-600 hover:bg-gray-100 hover:text-red-600"
										aria-label="Удалить"
									>
										<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
											<path
												fill-rule="evenodd"
												d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
												clip-rule="evenodd"
											/>
										</svg>
									</button>
								</form>
							</div>
						</div>
					</Card>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Site Settings -->
	<div>
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-xl font-semibold text-gray-700">Глобальные настройки</h2>
			<Button variant="secondary" onclick={() => openSettingEditor()}>
				<span>+ Добавить настройку</span>
			</Button>
		</div>

		<div class="space-y-3">
			{#each data.siteSettings as setting (setting.id)}
				<Card class="rounded-lg border bg-white p-4 shadow-sm">
					<div class="flex items-center justify-between">
						<div class="flex-1">
							<h3 class="font-semibold text-gray-800">{setting.key}</h3>
							{#if setting.description}
								<p class="text-sm text-gray-600">{setting.description}</p>
							{/if}
							<p class="mt-1 text-xs text-gray-500">
								{JSON.stringify(setting.value).substring(0, 100)}...
							</p>
						</div>
						<button
							onclick={() => openSettingEditor(setting)}
							class="rounded p-2 text-gray-600 hover:bg-gray-100 hover:text-blue-600"
							aria-label="Редактировать"
						>
							<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
								<path
									d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
								/>
							</svg>
						</button>
					</div>
				</Card>
			{/each}
		</div>
	</div>
</div>

<!-- Section Editor Modal -->
{#if showSectionEditor}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
		onclick={closeSectionEditor}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		onkeydown={(e) => e.key === 'Escape' && closeSectionEditor()}
	>
		<div
			class="max-h-[95vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
			onclick={(e) => e.stopPropagation()}
			role="document"
		>
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-xl font-bold text-gray-800">
					{editingSection ? 'Редактировать секцию' : 'Новая секция'}
				</h2>
				<button onclick={closeSectionEditor} class="text-gray-500 hover:text-gray-700">
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
				action="?/saveSection"
				use:enhance={() => {
					if (!validateJson(sectionContent.content)) {
						return ({ cancel }) => cancel();
					}
					return async ({ update }) => {
						await update();
						closeSectionEditor();
					};
				}}
			>
				<input type="hidden" name="pageSlug" value={sectionContent.pageSlug} />

				<div class="space-y-4">
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="sectionKey" class="mb-1 block text-sm font-medium text-gray-700">
								Ключ секции *
							</label>
							<input
								type="text"
								id="sectionKey"
								name="sectionKey"
								bind:value={sectionContent.sectionKey}
								required
								disabled={!!editingSection}
								placeholder="seo, hero, aboutSection..."
								class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
							/>
						</div>
						<div class="flex gap-4">
							<div class="flex-1">
								<label for="sortOrder" class="mb-1 block text-sm font-medium text-gray-700">
									Порядок
								</label>
								<input
									type="number"
									id="sortOrder"
									name="sortOrder"
									bind:value={sectionContent.sortOrder}
									class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
								/>
							</div>
							<div class="flex items-end">
								<label class="flex cursor-pointer items-center gap-2">
									<input
										type="checkbox"
										bind:checked={sectionContent.isActive}
										class="h-4 w-4 rounded border-gray-300"
									/>
									<span class="text-sm">Активна</span>
								</label>
							</div>
						</div>
					</div>

					<input type="hidden" name="isActive" value={sectionContent.isActive.toString()} />

					<div>
						<div class="mb-1 flex items-center justify-between">
							<label for="content" class="block text-sm font-medium text-gray-700">
								Контент (JSON) *
							</label>
							<button
								type="button"
								onclick={() => formatJson('section')}
								class="text-xs text-blue-600 hover:text-blue-800"
							>
								Форматировать
							</button>
						</div>
						{#if jsonError}
							<div class="mb-2 rounded bg-red-50 p-2 text-xs text-red-600">{jsonError}</div>
						{/if}
						<textarea
							id="content"
							name="content"
							bind:value={sectionContent.content}
							required
							rows="20"
							class="font-mono w-full rounded border border-gray-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
							onblur={() => validateJson(sectionContent.content)}
						></textarea>
						<p class="mt-1 text-xs text-gray-500">
							Поддерживаются Tailwind классы в полях gridClass, containerClass. Markdown в
							текстовых полях.
						</p>
					</div>

					<div class="flex justify-end gap-3 border-t pt-4">
						<Button type="button" variant="secondary" onclick={closeSectionEditor}>
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

<!-- Setting Editor Modal -->
{#if showSettingEditor}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
		onclick={closeSettingEditor}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		onkeydown={(e) => e.key === 'Escape' && closeSettingEditor()}
	>
		<div
			class="max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
			onclick={(e) => e.stopPropagation()}
			role="document"
		>
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-xl font-bold text-gray-800">
					{editingSetting ? 'Редактировать настройку' : 'Новая настройка'}
				</h2>
				<button onclick={closeSettingEditor} class="text-gray-500 hover:text-gray-700">
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
				action="?/saveSiteSetting"
				use:enhance={() => {
					if (!validateJson(settingContent.value)) {
						return ({ cancel }) => cancel();
					}
					return async ({ update }) => {
						await update();
						closeSettingEditor();
					};
				}}
			>
				<div class="space-y-4">
					<div>
						<label for="settingKey" class="mb-1 block text-sm font-medium text-gray-700">
							Ключ *
						</label>
						<input
							type="text"
							id="settingKey"
							name="key"
							bind:value={settingContent.key}
							required
							disabled={!!editingSetting}
							placeholder="footer, contacts..."
							class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
						/>
					</div>

					<div>
						<label for="settingDescription" class="mb-1 block text-sm font-medium text-gray-700">
							Описание
						</label>
						<input
							type="text"
							id="settingDescription"
							name="description"
							bind:value={settingContent.description}
							class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
						/>
					</div>

					<div>
						<div class="mb-1 flex items-center justify-between">
							<label for="settingValue" class="block text-sm font-medium text-gray-700">
								Значение (JSON) *
							</label>
							<button
								type="button"
								onclick={() => formatJson('setting')}
								class="text-xs text-blue-600 hover:text-blue-800"
							>
								Форматировать
							</button>
						</div>
						{#if jsonError}
							<div class="mb-2 rounded bg-red-50 p-2 text-xs text-red-600">{jsonError}</div>
						{/if}
						<textarea
							id="settingValue"
							name="value"
							bind:value={settingContent.value}
							required
							rows="12"
							class="font-mono w-full rounded border border-gray-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
							onblur={() => validateJson(settingContent.value)}
						></textarea>
					</div>

					<div class="flex justify-end gap-3 border-t pt-4">
						<Button type="button" variant="secondary" onclick={closeSettingEditor}>
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

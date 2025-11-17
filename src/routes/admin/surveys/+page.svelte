<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/card/card.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showEditor = $state(false);
	let showCategoryEditor = $state(false);
	let editingSurvey = $state<(typeof data.surveys)[0] | null>(null);
	let editingCategory = $state<(typeof data.categories)[0] | null>(null);

	let surveyContent = $state({
		id: '',
		title: '',
		slug: '',
		description: '',
		categoryId: '',
		config: '',
		isPublished: false,
		sortOrder: 0
	});

	let categoryContent = $state({
		id: '',
		name: '',
		slug: '',
		description: '',
		sortOrder: 0
	});

	let configError = $state('');

	// Group surveys by category
	let surveysByCategory = $derived(() => {
		const grouped: Record<
			string,
			{ category: (typeof data.categories)[0] | null; surveys: typeof data.surveys }
		> = {};

		// First add uncategorized
		const uncategorized = data.surveys.filter((s) => !s.categoryId);
		if (uncategorized.length > 0) {
			grouped['uncategorized'] = { category: null, surveys: uncategorized };
		}

		// Then add by category
		for (const category of data.categories) {
			const categorySurveys = data.surveys.filter((s) => s.categoryId === category.id);
			if (categorySurveys.length > 0) {
				grouped[category.id] = { category, surveys: categorySurveys };
			}
		}

		return grouped;
	});

	let hasCategories = $derived(data.categories.length > 0);

	function openEditor(survey?: (typeof data.surveys)[0]) {
		if (survey) {
			editingSurvey = survey;
			window.location.href = `/admin/surveys?edit=${survey.id}`;
		} else {
			editingSurvey = null;
			surveyContent = {
				id: '',
				title: '',
				slug: '',
				description: '',
				categoryId: '',
				config: getDefaultConfig(),
				isPublished: false,
				sortOrder: 0
			};
			configError = '';
			showEditor = true;
		}
	}

	function openCategoryEditor(category?: (typeof data.categories)[0]) {
		if (category) {
			editingCategory = category;
			categoryContent = {
				id: category.id,
				name: category.name,
				slug: category.slug,
				description: category.description || '',
				sortOrder: category.sortOrder
			};
		} else {
			editingCategory = null;
			categoryContent = {
				id: '',
				name: '',
				slug: '',
				description: '',
				sortOrder: 0
			};
		}
		showCategoryEditor = true;
	}

	$effect(() => {
		if (data.fullSurvey) {
			editingSurvey = data.fullSurvey as any;

			surveyContent = {
				id: data.fullSurvey.id,
				title: data.fullSurvey.title,
				slug: data.fullSurvey.slug,
				description: data.fullSurvey.description || '',
				categoryId: data.fullSurvey.categoryId || '',
				config: JSON.stringify(data.fullSurvey.config, null, 2),
				isPublished: data.fullSurvey.isPublished,
				sortOrder: data.fullSurvey.sortOrder
			};
			configError = '';
			showEditor = true;
		}
	});

	function closeEditor() {
		showEditor = false;
		editingSurvey = null;
		configError = '';
		if (data.fullSurvey) {
			window.location.href = '/admin/surveys';
		}
	}

	function closeCategoryEditor() {
		showCategoryEditor = false;
		editingCategory = null;
	}

	function handleDelete(id: string, title: string) {
		if (confirm(`Вы действительно хотите удалить опросник "${title}"?`)) {
			const form = document.getElementById(`delete-form-${id}`) as HTMLFormElement;
			form.requestSubmit();
		}
	}

	function handleDeleteCategory(id: string, name: string) {
		if (confirm(`Вы действительно хотите удалить категорию "${name}"?`)) {
			const form = document.getElementById(`delete-category-form-${id}`) as HTMLFormElement;
			form.requestSubmit();
		}
	}

	function generateSlug(name: string): string {
		return name
			.toLowerCase()
			.replace(/[а-яё]/g, (char) => {
				const map: Record<string, string> = {
					а: 'a',
					б: 'b',
					в: 'v',
					г: 'g',
					д: 'd',
					е: 'e',
					ё: 'yo',
					ж: 'zh',
					з: 'z',
					и: 'i',
					й: 'y',
					к: 'k',
					л: 'l',
					м: 'm',
					н: 'n',
					о: 'o',
					п: 'p',
					р: 'r',
					с: 's',
					т: 't',
					у: 'u',
					ф: 'f',
					х: 'h',
					ц: 'ts',
					ч: 'ch',
					ш: 'sh',
					щ: 'sch',
					ъ: '',
					ы: 'y',
					ь: '',
					э: 'e',
					ю: 'yu',
					я: 'ya'
				};
				return map[char] || char;
			})
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');
	}

	function getDefaultConfig(): string {
		const defaultConfig = {
			id: 'new-survey',
			title: 'Новый опросник',
			description: 'Описание опросника',
			infoSections: {
				about: {
					title: 'О тесте',
					type: 'info',
					content: 'Информация о тесте'
				}
			},
			questions: [
				{
					id: 'q1',
					text: 'Пример вопроса',
					type: 'radio',
					required: true,
					options: [
						{ label: 'Никогда', value: 0 },
						{ label: 'Редко', value: 1 },
						{ label: 'Иногда', value: 2 },
						{ label: 'Часто', value: 3 }
					]
				}
			],
			scoring: {
				method: 'sum',
				maxScore: 3,
				interpretation: [
					{
						min: 0,
						max: 1,
						severity: 'Норма',
						recommendation: 'Результат в пределах нормы',
						color: 'green'
					},
					{
						min: 2,
						max: 3,
						severity: 'Повышенный',
						recommendation: 'Рекомендуется консультация',
						color: 'yellow'
					}
				]
			}
		};
		return JSON.stringify(defaultConfig, null, 2);
	}

	function validateConfig() {
		try {
			const config = JSON.parse(surveyContent.config);
			if (!config.id || !config.title || !config.questions || !config.scoring) {
				configError = 'Конфигурация должна содержать: id, title, questions, scoring';
				return false;
			}
			configError = '';
			return true;
		} catch (e) {
			configError = 'Неверный JSON формат';
			return false;
		}
	}

	function formatConfig() {
		try {
			const config = JSON.parse(surveyContent.config);
			surveyContent.config = JSON.stringify(config, null, 2);
			configError = '';
		} catch (e) {
			configError = 'Неверный JSON формат';
		}
	}
</script>

<div class="container mx-auto px-4 py-8">
	<div class="mb-8 flex items-center justify-between">
		<h1 class="text-3xl font-bold text-gray-800">Управление опросниками</h1>
		<div class="flex gap-2">
			<Button variant="secondary" onclick={() => openCategoryEditor()}>
				<span>+ Категория</span>
			</Button>
			<Button onclick={() => openEditor()}>
				<span>+ Добавить опросник</span>
			</Button>
		</div>
	</div>

	{#if form?.error}
		<div class="mb-4 rounded-lg bg-red-50 p-4 text-red-600">{form.error}</div>
	{/if}

	{#if form?.success}
		<div class="mb-4 rounded-lg bg-green-50 p-4 text-green-600">Операция выполнена успешно</div>
	{/if}

	<!-- Categories Management -->
	{#if data.categories.length > 0}
		<div class="mb-8">
			<h2 class="mb-4 text-xl font-semibold text-gray-700">Категории</h2>
			<div class="flex flex-wrap gap-2">
				{#each data.categories as category (category.id)}
					<div
						class="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700"
					>
						<span class="font-medium">{category.name}</span>
						<span class="text-gray-400">/{category.slug}</span>
						<button
							onclick={() => openCategoryEditor(category)}
							class="ml-1 text-gray-500 hover:text-blue-600"
							aria-label="Редактировать категорию"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-4 w-4"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
								/>
							</svg>
						</button>
						<form
							id="delete-category-form-{category.id}"
							method="POST"
							action="?/deleteCategory"
							use:enhance
						>
							<input type="hidden" name="id" value={category.id} />
							<button
								type="button"
								onclick={() => handleDeleteCategory(category.id, category.name)}
								class="text-gray-500 hover:text-red-600"
								aria-label="Удалить категорию"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fill-rule="evenodd"
										d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
										clip-rule="evenodd"
									/>
								</svg>
							</button>
						</form>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	{#if data.surveys.length === 0}
		<Card class="rounded-lg border bg-white p-8 text-center shadow-sm">
			<p class="mb-4 text-lg text-gray-600">Нет опросников</p>
			<Button onclick={() => openEditor()}>
				<span>Создать первый опросник</span>
			</Button>
		</Card>
	{:else if hasCategories}
		<!-- Display surveys grouped by category -->
		{#each Object.entries(surveysByCategory()) as [key, group] (key)}
			<div class="mb-8">
				<h2 class="mb-4 text-xl font-semibold text-gray-700">
					{group.category ? group.category.name : 'Без категории'}
				</h2>
				<div class="space-y-4">
					{#each group.surveys as survey (survey.id)}
						<Card
							class="rounded-lg border bg-white shadow-sm transition-shadow duration-200 hover:shadow-lg"
						>
							<div class="flex items-start justify-between p-6">
								<div class="flex-1">
									<div class="mb-2 flex items-center gap-3">
										<h3 class="text-xl font-semibold text-gray-800">{survey.title}</h3>
										{#if survey.isPublished}
											<span
												class="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700"
											>
												Опубликован
											</span>
										{:else}
											<span
												class="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600"
											>
												Черновик
											</span>
										{/if}
									</div>
									{#if survey.description}
										<p class="mb-3 text-gray-600">{survey.description}</p>
									{/if}
									<div class="flex items-center gap-4 text-sm text-gray-500">
										<span>Slug: /{survey.slug}</span>
										<span>•</span>
										<span>{new Date(survey.createdAt).toLocaleDateString('ru-RU')}</span>
									</div>
								</div>
								<div class="ml-4 flex gap-2">
									<form method="POST" action="?/togglePublish" use:enhance>
										<input type="hidden" name="id" value={survey.id} />
										<input type="hidden" name="isPublished" value={survey.isPublished.toString()} />
										<button
											type="submit"
											class="rounded p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-green-600"
											aria-label={survey.isPublished ? 'Снять с публикации' : 'Опубликовать'}
											title={survey.isPublished ? 'Снять с публикации' : 'Опубликовать'}
										>
											{#if survey.isPublished}
												<svg
													xmlns="http://www.w3.org/2000/svg"
													class="h-5 w-5"
													viewBox="0 0 20 20"
													fill="currentColor"
												>
													<path
														fill-rule="evenodd"
														d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
														clip-rule="evenodd"
													/>
													<path
														d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"
													/>
												</svg>
											{:else}
												<svg
													xmlns="http://www.w3.org/2000/svg"
													class="h-5 w-5"
													viewBox="0 0 20 20"
													fill="currentColor"
												>
													<path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
													<path
														fill-rule="evenodd"
														d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
														clip-rule="evenodd"
													/>
												</svg>
											{/if}
										</button>
									</form>
									<button
										onclick={() => openEditor(survey)}
										class="rounded p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-blue-600"
										aria-label="Редактировать"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-5 w-5"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path
												d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
											/>
										</svg>
									</button>
									<form
										id="delete-form-{survey.id}"
										method="POST"
										action="?/delete"
										use:enhance={() => {
											return async ({ update }) => {
												await update();
											};
										}}
									>
										<input type="hidden" name="id" value={survey.id} />
										<button
											type="button"
											onclick={() => handleDelete(survey.id, survey.title)}
											class="rounded p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-red-600"
											aria-label="Удалить"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="h-5 w-5"
												viewBox="0 0 20 20"
												fill="currentColor"
											>
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
			</div>
		{/each}
	{:else}
		<!-- Display surveys as flat list -->
		<div class="space-y-4">
			{#each data.surveys as survey (survey.id)}
				<Card
					class="rounded-lg border bg-white shadow-sm transition-shadow duration-200 hover:shadow-lg"
				>
					<div class="flex items-start justify-between p-6">
						<div class="flex-1">
							<div class="mb-2 flex items-center gap-3">
								<h2 class="text-xl font-semibold text-gray-800">{survey.title}</h2>
								{#if survey.isPublished}
									<span
										class="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700"
									>
										Опубликован
									</span>
								{:else}
									<span
										class="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600"
									>
										Черновик
									</span>
								{/if}
							</div>
							{#if survey.description}
								<p class="mb-3 text-gray-600">{survey.description}</p>
							{/if}
							<div class="flex items-center gap-4 text-sm text-gray-500">
								<span>Slug: /{survey.slug}</span>
								<span>•</span>
								<span>{new Date(survey.createdAt).toLocaleDateString('ru-RU')}</span>
							</div>
						</div>
						<div class="ml-4 flex gap-2">
							<form method="POST" action="?/togglePublish" use:enhance>
								<input type="hidden" name="id" value={survey.id} />
								<input type="hidden" name="isPublished" value={survey.isPublished.toString()} />
								<button
									type="submit"
									class="rounded p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-green-600"
									aria-label={survey.isPublished ? 'Снять с публикации' : 'Опубликовать'}
									title={survey.isPublished ? 'Снять с публикации' : 'Опубликовать'}
								>
									{#if survey.isPublished}
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-5 w-5"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path
												fill-rule="evenodd"
												d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
												clip-rule="evenodd"
											/>
											<path
												d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"
											/>
										</svg>
									{:else}
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-5 w-5"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
											<path
												fill-rule="evenodd"
												d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
												clip-rule="evenodd"
											/>
										</svg>
									{/if}
								</button>
							</form>
							<button
								onclick={() => openEditor(survey)}
								class="rounded p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-blue-600"
								aria-label="Редактировать"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
									/>
								</svg>
							</button>
							<form
								id="delete-form-{survey.id}"
								method="POST"
								action="?/delete"
								use:enhance={() => {
									return async ({ update }) => {
										await update();
									};
								}}
							>
								<input type="hidden" name="id" value={survey.id} />
								<button
									type="button"
									onclick={() => handleDelete(survey.id, survey.title)}
									class="rounded p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-red-600"
									aria-label="Удалить"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-5 w-5"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
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

<!-- Survey Editor Modal -->
{#if showEditor}
	<div
		class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black"
		onclick={closeEditor}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		onkeydown={(e) => e.key === 'Escape' && closeEditor()}
	>
		<div
			class="max-h-[95vh] w-full max-w-6xl overflow-y-auto rounded-lg bg-white p-8 shadow-xl"
			onclick={(e) => e.stopPropagation()}
			role="document"
		>
			<div class="mb-6 flex items-center justify-between">
				<h2 class="text-2xl font-bold text-gray-800">
					{editingSurvey ? 'Редактировать опросник' : 'Новый опросник'}
				</h2>
				<button
					onclick={closeEditor}
					class="text-gray-500 hover:text-gray-700"
					aria-label="Закрыть"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
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
				action="?/save"
				use:enhance={() => {
					if (!validateConfig()) {
						return ({ cancel }) => cancel();
					}
					return async ({ update }) => {
						await update();
						closeEditor();
					};
				}}
			>
				{#if editingSurvey}
					<input type="hidden" name="id" value={editingSurvey.id} />
				{/if}

				<div class="grid grid-cols-2 gap-6">
					<!-- Left column: Basic info -->
					<div class="space-y-4">
						<div>
							<label for="title" class="mb-1 block text-sm font-medium text-gray-700">
								Название *
							</label>
							<input
								type="text"
								id="title"
								name="title"
								bind:value={surveyContent.title}
								required
								class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
							/>
						</div>

						<div>
							<label for="slug" class="mb-1 block text-sm font-medium text-gray-700">
								Slug *
							</label>
							<input
								type="text"
								id="slug"
								name="slug"
								bind:value={surveyContent.slug}
								required
								placeholder="my-survey"
								class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
							/>
							<p class="mt-1 text-xs text-gray-500">
								Используется в URL: /surveys/{surveyContent.slug || 'your-slug'}
							</p>
						</div>

						{#if data.categories.length > 0}
							<div>
								<label for="categoryId" class="mb-1 block text-sm font-medium text-gray-700">
									Категория
								</label>
								<select
									id="categoryId"
									name="categoryId"
									bind:value={surveyContent.categoryId}
									class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
								>
									<option value="">Без категории</option>
									{#each data.categories as category (category.id)}
										<option value={category.id}>{category.name}</option>
									{/each}
								</select>
							</div>
						{/if}

						<div>
							<label for="description" class="mb-1 block text-sm font-medium text-gray-700">
								Описание
							</label>
							<textarea
								id="description"
								name="description"
								bind:value={surveyContent.description}
								rows="3"
								class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
							></textarea>
						</div>

						<div class="flex gap-4">
							<div class="flex-1">
								<label for="sortOrder" class="mb-1 block text-sm font-medium text-gray-700">
									Порядок сортировки
								</label>
								<input
									type="number"
									id="sortOrder"
									name="sortOrder"
									bind:value={surveyContent.sortOrder}
									class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
								/>
							</div>

							<div class="flex items-end">
								<label class="flex cursor-pointer items-center gap-2">
									<input
										type="checkbox"
										bind:checked={surveyContent.isPublished}
										class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
									/>
									<span class="text-sm font-medium text-gray-700">Опубликован</span>
								</label>
							</div>
						</div>

						<input type="hidden" name="isPublished" value={surveyContent.isPublished.toString()} />
					</div>

					<!-- Right column: Config JSON -->
					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<label for="config" class="block text-sm font-medium text-gray-700">
								Конфигурация опросника (JSON) *
							</label>
							<button
								type="button"
								onclick={formatConfig}
								class="text-xs text-blue-600 hover:text-blue-800"
							>
								Форматировать JSON
							</button>
						</div>

						{#if configError}
							<div class="rounded bg-red-50 p-2 text-sm text-red-600">{configError}</div>
						{/if}

						<textarea
							id="config"
							name="config"
							bind:value={surveyContent.config}
							required
							rows="25"
							class="w-full rounded-lg border border-gray-300 px-4 py-2 font-mono text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
							onblur={validateConfig}
						></textarea>
						<p class="text-xs text-gray-500">
							Структура: id, title, description, infoSections, questions, scoring, warnings?,
							nextSteps?
						</p>
					</div>
				</div>

				<div class="mt-6 flex justify-end gap-3 border-t pt-4">
					<Button type="button" variant="secondary" onclick={closeEditor}>
						<span>Отмена</span>
					</Button>
					<Button type="submit">
						<span>Сохранить</span>
					</Button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Category Editor Modal -->
{#if showCategoryEditor}
	<div
		class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black"
		onclick={closeCategoryEditor}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		onkeydown={(e) => e.key === 'Escape' && closeCategoryEditor()}
	>
		<div
			class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-8 shadow-xl"
			onclick={(e) => e.stopPropagation()}
			role="document"
		>
			<div class="mb-6 flex items-center justify-between">
				<h2 class="text-2xl font-bold text-gray-800">
					{editingCategory ? 'Редактировать категорию' : 'Новая категория'}
				</h2>
				<button
					onclick={closeCategoryEditor}
					class="text-gray-500 hover:text-gray-700"
					aria-label="Закрыть"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
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
				action="?/saveCategory"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						closeCategoryEditor();
					};
				}}
			>
				{#if editingCategory}
					<input type="hidden" name="id" value={editingCategory.id} />
				{/if}

				<div class="space-y-4">
					<div>
						<label for="categoryName" class="mb-1 block text-sm font-medium text-gray-700">
							Название *
						</label>
						<input
							type="text"
							id="categoryName"
							name="name"
							bind:value={categoryContent.name}
							oninput={() => {
								if (!editingCategory) {
									categoryContent.slug = generateSlug(categoryContent.name);
								}
							}}
							required
							class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
						/>
					</div>

					<div>
						<label for="categorySlug" class="mb-1 block text-sm font-medium text-gray-700">
							Slug *
						</label>
						<input
							type="text"
							id="categorySlug"
							name="slug"
							bind:value={categoryContent.slug}
							required
							placeholder="category-slug"
							class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
						/>
						<p class="mt-1 text-xs text-gray-500">Используется для URL и идентификации</p>
					</div>

					<div>
						<label for="categoryDescription" class="mb-1 block text-sm font-medium text-gray-700">
							Описание
						</label>
						<textarea
							id="categoryDescription"
							name="description"
							bind:value={categoryContent.description}
							rows="2"
							class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
						></textarea>
					</div>

					<div>
						<label for="categorySortOrder" class="mb-1 block text-sm font-medium text-gray-700">
							Порядок сортировки
						</label>
						<input
							type="number"
							id="categorySortOrder"
							name="sortOrder"
							bind:value={categoryContent.sortOrder}
							class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
						/>
						<p class="mt-1 text-xs text-gray-500">Меньшее число = выше в списке</p>
					</div>

					<div class="flex justify-end gap-3 border-t pt-4">
						<Button type="button" variant="secondary" onclick={closeCategoryEditor}>
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

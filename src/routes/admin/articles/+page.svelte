<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/card/card.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showEditor = $state(false);
	let showCategoryEditor = $state(false);
	let editingArticle = $state<(typeof data.articles)[0] | null>(null);
	let editingCategory = $state<(typeof data.categories)[0] | null>(null);

	let articleContent = $state({
		id: '',
		title: '',
		description: '',
		uri: '',
		content: '',
		imageUrl: '',
		descriptionMeta: '',
		categoryId: ''
	});

	let categoryContent = $state({
		id: '',
		name: '',
		slug: '',
		description: '',
		sortOrder: 0
	});

	// Group articles by category
	let articlesByCategory = $derived(() => {
		const grouped: Record<
			string,
			{ category: (typeof data.categories)[0] | null; articles: (typeof data.articles) }
		> = {};

		// First add uncategorized
		const uncategorized = data.articles.filter((a) => !a.categoryId);
		if (uncategorized.length > 0) {
			grouped['uncategorized'] = { category: null, articles: uncategorized };
		}

		// Then add by category
		for (const category of data.categories) {
			const categoryArticles = data.articles.filter((a) => a.categoryId === category.id);
			if (categoryArticles.length > 0) {
				grouped[category.id] = { category, articles: categoryArticles };
			}
		}

		return grouped;
	});

	let hasCategories = $derived(data.categories.length > 0);

	function openEditor(article?: (typeof data.articles)[0]) {
		if (article) {
			editingArticle = article;
			window.location.href = `/admin/articles?edit=${article.id}`;
		} else {
			editingArticle = null;
			articleContent = {
				id: '',
				title: '',
				description: '',
				uri: '',
				content: '',
				imageUrl: '',
				descriptionMeta: '',
				categoryId: ''
			};
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
		if (data.fullArticle) {
			editingArticle = data.fullArticle as any;
			const content =
				typeof data.fullArticle.content === 'object'
					? (data.fullArticle.content as any).markdown || ''
					: data.fullArticle.content || '';

			articleContent = {
				id: data.fullArticle.id,
				title: data.fullArticle.title,
				description: data.fullArticle.description || '',
				uri: data.fullArticle.uri,
				content,
				imageUrl: data.fullArticle.imageUrl || '',
				descriptionMeta: data.fullArticle.descriptionMeta || '',
				categoryId: data.fullArticle.categoryId || ''
			};
			showEditor = true;
		}
	});

	function closeEditor() {
		showEditor = false;
		editingArticle = null;
		if (data.fullArticle) {
			window.location.href = '/admin/articles';
		}
	}

	function closeCategoryEditor() {
		showCategoryEditor = false;
		editingCategory = null;
	}

	function handleDelete(id: string, title: string) {
		if (confirm(`Вы действительно хотите удалить статью "${title}"?`)) {
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
</script>

<div class="container mx-auto px-4 py-8">
	<div class="mb-8 flex items-center justify-between">
		<h1 class="text-3xl font-bold text-gray-800">Управление статьями</h1>
		<div class="flex gap-2">
			<Button variant="secondary" onclick={() => openCategoryEditor()}>
				<span>+ Категория</span>
			</Button>
			<Button onclick={() => openEditor()}>
				<span>+ Добавить статью</span>
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

	{#if data.articles.length === 0}
		<Card class="rounded-lg border bg-white p-8 text-center shadow-sm">
			<p class="mb-4 text-lg text-gray-600">Нет статей</p>
			<Button onclick={() => openEditor()}>
				<span>Создать первую статью</span>
			</Button>
		</Card>
	{:else if hasCategories}
		<!-- Display articles grouped by category -->
		{#each Object.entries(articlesByCategory()) as [key, group] (key)}
			<div class="mb-8">
				<h2 class="mb-4 text-xl font-semibold text-gray-700">
					{group.category ? group.category.name : 'Без категории'}
				</h2>
				<div class="space-y-4">
					{#each group.articles as article (article.id)}
						<Card
							class="rounded-lg border bg-white shadow-sm transition-shadow duration-200 hover:shadow-lg"
						>
							<div class="flex items-start justify-between p-6">
								<div class="flex-1">
									<h3 class="mb-2 text-xl font-semibold text-gray-800">{article.title}</h3>
									{#if article.description}
										<p class="mb-3 text-gray-600">{article.description}</p>
									{/if}
									<div class="flex items-center gap-4 text-sm text-gray-500">
										<span>URI: /{article.uri}</span>
										<span>•</span>
										<span>{new Date(article.createdAt).toLocaleDateString('ru-RU')}</span>
										<span>•</span>
										<span>{article.viewCount} просмотров</span>
									</div>
								</div>
								<div class="ml-4 flex gap-2">
									<button
										onclick={() => openEditor(article)}
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
										id="delete-form-{article.id}"
										method="POST"
										action="?/delete"
										use:enhance={() => {
											return async ({ update }) => {
												await update();
											};
										}}
									>
										<input type="hidden" name="id" value={article.id} />
										<button
											type="button"
											onclick={() => handleDelete(article.id, article.title)}
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
		<!-- Display articles as flat list -->
		<div class="space-y-4">
			{#each data.articles as article (article.id)}
				<Card
					class="rounded-lg border bg-white shadow-sm transition-shadow duration-200 hover:shadow-lg"
				>
					<div class="flex items-start justify-between p-6">
						<div class="flex-1">
							<h2 class="mb-2 text-xl font-semibold text-gray-800">{article.title}</h2>
							{#if article.description}
								<p class="mb-3 text-gray-600">{article.description}</p>
							{/if}
							<div class="flex items-center gap-4 text-sm text-gray-500">
								<span>URI: /{article.uri}</span>
								<span>•</span>
								<span>{new Date(article.createdAt).toLocaleDateString('ru-RU')}</span>
								<span>•</span>
								<span>{article.viewCount} просмотров</span>
							</div>
						</div>
						<div class="ml-4 flex gap-2">
							<button
								onclick={() => openEditor(article)}
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
								id="delete-form-{article.id}"
								method="POST"
								action="?/delete"
								use:enhance={() => {
									return async ({ update }) => {
										await update();
									};
								}}
							>
								<input type="hidden" name="id" value={article.id} />
								<button
									type="button"
									onclick={() => handleDelete(article.id, article.title)}
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

<!-- Article Editor Modal -->
{#if showEditor}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
		onclick={closeEditor}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		onkeydown={(e) => e.key === 'Escape' && closeEditor()}
	>
		<div
			class="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-8 shadow-xl"
			onclick={(e) => e.stopPropagation()}
			role="document"
		>
			<div class="mb-6 flex items-center justify-between">
				<h2 class="text-2xl font-bold text-gray-800">
					{editingArticle ? 'Редактировать статью' : 'Новая статья'}
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
					return async ({ update }) => {
						await update();
						closeEditor();
					};
				}}
			>
				{#if editingArticle}
					<input type="hidden" name="id" value={editingArticle.id} />
				{/if}

				<div class="space-y-4">
					<div>
						<label for="title" class="mb-1 block text-sm font-medium text-gray-700">
							Заголовок *
						</label>
						<input
							type="text"
							id="title"
							name="title"
							bind:value={articleContent.title}
							required
							class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label for="uri" class="mb-1 block text-sm font-medium text-gray-700"> URI * </label>
						<input
							type="text"
							id="uri"
							name="uri"
							bind:value={articleContent.uri}
							required
							placeholder="my-article"
							class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
						<p class="mt-1 text-xs text-gray-500">
							Используется в URL: /articles/{articleContent.uri || 'your-uri'}
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
								bind:value={articleContent.categoryId}
								class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
							bind:value={articleContent.description}
							rows="2"
							class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
						></textarea>
					</div>

					<div>
						<label for="imageUrl" class="mb-1 block text-sm font-medium text-gray-700">
							URL изображения
						</label>
						<input
							type="url"
							id="imageUrl"
							name="imageUrl"
							bind:value={articleContent.imageUrl}
							placeholder="https://example.com/image.jpg"
							class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label for="descriptionMeta" class="mb-1 block text-sm font-medium text-gray-700">
							Meta описание (для SEO)
						</label>
						<textarea
							id="descriptionMeta"
							name="descriptionMeta"
							bind:value={articleContent.descriptionMeta}
							rows="2"
							class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="Краткое описание для поисковых систем"
						></textarea>
					</div>

					<div>
						<label for="content" class="mb-1 block text-sm font-medium text-gray-700">
							Контент (Markdown) *
						</label>
						<textarea
							id="content"
							name="content"
							bind:value={articleContent.content}
							required
							rows="15"
							class="font-mono w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="# Заголовок&#10;&#10;Ваш текст здесь..."
						></textarea>
						<p class="mt-1 text-xs text-gray-500">
							Поддерживается markdown: **жирный**, *курсив*, # заголовки, - списки, [ссылки](url)
						</p>
					</div>

					<div class="flex justify-end gap-3 border-t pt-4">
						<Button type="button" variant="secondary" onclick={closeEditor}>
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

<!-- Category Editor Modal -->
{#if showCategoryEditor}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
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
							class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
							class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
							class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
							class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/card/card.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showEditor = $state(false);
	let editingArticle = $state<(typeof data.articles)[0] | null>(null);
	let articleContent = $state({
		id: '',
		title: '',
		description: '',
		uri: '',
		content: '',
		imageUrl: '',
		descriptionMeta: ''
	});

	function openEditor(article?: (typeof data.articles)[0]) {
		if (article) {
			editingArticle = article;
			// Redirect to load full article
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
				descriptionMeta: ''
			};
			showEditor = true;
		}
	}

	// Check if we need to open editor for editing
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
				descriptionMeta: data.fullArticle.descriptionMeta || ''
			};
			showEditor = true;
		}
	});

	function closeEditor() {
		showEditor = false;
		editingArticle = null;
		// Clear query params if we were editing
		if (data.fullArticle) {
			window.location.href = '/admin/articles';
		}
	}

	function handleDelete(id: string, title: string) {
		if (confirm(`Вы действительно хотите удалить статью "${title}"?`)) {
			const form = document.getElementById(`delete-form-${id}`) as HTMLFormElement;
			form.requestSubmit();
		}
	}
</script>

<div class="container mx-auto px-4 py-8">
	<div class="mb-8 flex items-center justify-between">
		<h1 class="text-3xl font-bold text-gray-800">Управление статьями</h1>
		<Button onclick={() => openEditor()}>
			<span>+ Добавить статью</span>
		</Button>
	</div>

	{#if form?.error}
		<div class="mb-4 rounded-lg bg-red-50 p-4 text-red-600">{form.error}</div>
	{/if}

	{#if form?.success}
		<div class="mb-4 rounded-lg bg-green-50 p-4 text-green-600">Операция выполнена успешно</div>
	{/if}

	{#if data.articles.length === 0}
		<Card class="rounded-lg border bg-white p-8 text-center shadow-sm">
			<p class="mb-4 text-lg text-gray-600">Нет статей</p>
			<Button onclick={() => openEditor()}>
				<span>Создать первую статью</span>
			</Button>
		</Card>
	{:else}
		<div class="space-y-4">
			{#each data.articles as article (article.id)}
				<Card class="rounded-lg border bg-white shadow-sm transition-shadow duration-200 hover:shadow-lg">
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

{#if showEditor}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
		onclick={closeEditor}
		role="dialog"
		aria-modal="true"
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

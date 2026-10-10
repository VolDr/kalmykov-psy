<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import QuizEditor from './QuizEditor.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const editParam = $derived(page.url.searchParams.get('edit'));
	const isNew = $derived(page.url.searchParams.has('new'));
	const saved = $derived(page.url.searchParams.has('saved'));

	const draft = $derived.by(() => {
		if (isNew) {
			return {
				id: null,
				title: '',
				description: '',
				timeLimit: 20,
				published: false,
				questions: [{ text: '', options: ['', ''], correct: 0 }]
			};
		}
		const quiz = data.quizzes.find((q) => String(q.id) === editParam);
		return quiz
			? {
					id: quiz.id,
					title: quiz.title,
					description: quiz.description ?? '',
					timeLimit: quiz.timeLimit,
					published: quiz.published,
					questions: quiz.questions
				}
			: null;
	});
</script>

<svelte:head>
	<title>Викторины | Админка</title>
</svelte:head>

<div class="mx-auto max-w-3xl space-y-8 p-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-semibold">Викторины для игры с друзьями</h1>
		<a
			href="/admin/quizzes?new"
			class="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
		>
			Новая викторина
		</a>
	</div>

	<p class="text-sm text-gray-600">
		Страница для игроков — <a href="/play" class="text-blue-600 hover:underline">/play</a>
		(закрыта от поисковиков). Комнату создаёт тот, кто выбрал викторину, и делится ссылкой.
	</p>

	<ul class="divide-y rounded-lg border bg-white">
		{#each data.quizzes as quiz (quiz.id)}
			<li class="flex items-center gap-3 px-4 py-3">
				<div class="flex-1">
					<a href="/admin/quizzes?edit={quiz.id}" class="font-medium hover:underline">
						{quiz.title}
					</a>
					<p class="text-sm text-gray-500">
						{quiz.questions.length} вопр. · {quiz.published ? 'опубликована' : 'черновик'}
					</p>
				</div>
				<form
					method="POST"
					action="?/delete"
					use:enhance={({ cancel }) => {
						if (!confirm(`Удалить «${quiz.title}»?`)) cancel();
					}}
				>
					<input type="hidden" name="id" value={quiz.id} />
					<button type="submit" class="cursor-pointer text-sm text-red-600 hover:underline">
						Удалить
					</button>
				</form>
			</li>
		{:else}
			<li class="px-4 py-6 text-center text-gray-500">Пока нет ни одной викторины</li>
		{/each}
	</ul>

	{#if draft}
		{#key `${draft.id ?? 'new'}`}
			<section class="rounded-lg border bg-gray-50 p-5">
				<h2 class="mb-4 text-lg font-semibold">
					{draft.id ? 'Редактирование' : 'Новая викторина'}
				</h2>
				<QuizEditor initial={draft} error={form?.error} {saved} />
			</section>
		{/key}
	{/if}
</div>

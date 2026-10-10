<script lang="ts">
	import { enhance } from '$app/forms';
	import type { GameQuestion } from '../../../db/schema';
	import { quizToJson, type ImportedMeta } from '$lib/data/game-quiz-json';
	import QuestionCard from './QuestionCard.svelte';
	import QuizJsonPanel from './QuizJsonPanel.svelte';

	type QuizDraft = {
		id: number | null;
		title: string;
		description: string;
		timeLimit: number;
		published: boolean;
		questions: GameQuestion[];
	};

	type Props = {
		initial: QuizDraft;
		error?: string;
		saved?: boolean;
	};

	let { initial, error, saved }: Props = $props();

	// Редактор всегда пересоздаётся при смене викторины ({#key} в странице), поэтому
	// начальное значение берём один раз
	let draft = $state<QuizDraft>(structuredClone($state.snapshot(initial)));
	let submitting = $state(false);

	const payload = $derived(
		JSON.stringify({
			title: draft.title,
			description: draft.description,
			timeLimit: Number(draft.timeLimit),
			published: draft.published,
			questions: draft.questions
		})
	);

	function importQuiz(meta: ImportedMeta, questions: GameQuestion[], mode: 'replace' | 'append') {
		if (mode === 'append') {
			draft.questions.push(...questions);
			return;
		}
		if (meta.title !== undefined) draft.title = meta.title;
		if (meta.description !== undefined) draft.description = meta.description;
		if (meta.timeLimit !== undefined) draft.timeLimit = meta.timeLimit;
		if (meta.published !== undefined) draft.published = meta.published;
		draft.questions = questions;
	}

	function addQuestion() {
		draft.questions.push({ text: '', options: ['', ''], correct: 0 });
	}

	function removeQuestion(i: number) {
		draft.questions.splice(i, 1);
	}

	function moveQuestion(i: number, delta: number) {
		const j = i + delta;
		if (j < 0 || j >= draft.questions.length) return;
		[draft.questions[i], draft.questions[j]] = [draft.questions[j], draft.questions[i]];
	}
</script>

<div class="mb-6">
	<QuizJsonPanel currentJson={quizToJson(draft)} onimport={importQuiz} />
</div>

<form
	method="POST"
	action="?/save"
	class="space-y-6"
	use:enhance={() => {
		submitting = true;
		return async ({ update }) => {
			await update({ reset: false });
			submitting = false;
		};
	}}
>
	<input type="hidden" name="id" value={draft.id ?? ''} />
	<input type="hidden" name="payload" value={payload} />

	<div class="grid gap-4">
		<label class="block">
			<span class="mb-1 block text-sm font-medium">Название</span>
			<input
				type="text"
				bind:value={draft.title}
				maxlength="120"
				class="w-full rounded-md border-gray-300"
			/>
		</label>
		<label class="block">
			<span class="mb-1 block text-sm font-medium">Описание</span>
			<input
				type="text"
				bind:value={draft.description}
				maxlength="300"
				class="w-full rounded-md border-gray-300"
			/>
		</label>
		<div class="flex flex-wrap items-center gap-6">
			<label class="block">
				<span class="mb-1 block text-sm font-medium">Секунд на вопрос</span>
				<input
					type="number"
					bind:value={draft.timeLimit}
					min="5"
					max="120"
					class="w-28 rounded-md border-gray-300"
				/>
			</label>
			<label class="flex items-center gap-2">
				<input type="checkbox" bind:checked={draft.published} class="rounded" />
				<span class="text-sm">Опубликована (видна на /play)</span>
			</label>
		</div>
	</div>

	<div class="space-y-4">
		<h2 class="text-lg font-semibold">Вопросы ({draft.questions.length})</h2>

		{#each draft.questions as _, i (i)}
			<QuestionCard
				bind:question={draft.questions[i]}
				index={i}
				onmove={(delta) => moveQuestion(i, delta)}
				onremove={() => removeQuestion(i)}
			/>
		{/each}

		<button
			type="button"
			onclick={addQuestion}
			class="cursor-pointer rounded-md border border-dashed border-gray-400 px-4 py-2 text-sm hover:bg-gray-50"
		>
			+ Добавить вопрос
		</button>
	</div>

	{#if error}
		<p class="text-sm text-red-600" role="alert">{error}</p>
	{:else if saved}
		<p class="text-sm text-green-700" role="status">Сохранено</p>
	{/if}

	<button
		type="submit"
		disabled={submitting}
		class="cursor-pointer rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
	>
		Сохранить
	</button>
</form>

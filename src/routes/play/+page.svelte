<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let name = $state('');
	let submitting = $state(false);

	function plural(n: number): string {
		const mod10 = n % 10;
		const mod100 = n % 100;
		if (mod10 === 1 && mod100 !== 11) return 'вопрос';
		if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'вопроса';
		return 'вопросов';
	}
</script>

<svelte:head>
	<title>Викторины с друзьями</title>
	<meta name="robots" content="noindex, nofollow" />
	<meta name="referrer" content="no-referrer" />
</svelte:head>

<div class="mx-auto max-w-xl px-4 py-10">
	<h1 class="text-3xl font-semibold">Викторины с друзьями</h1>
	<p class="mt-2 text-muted-foreground">
		Выберите викторину, создайте комнату и отправьте друзьям ссылку. Отвечаете одновременно, чем
		быстрее верный ответ, тем больше очков.
	</p>

	<form
		method="POST"
		action="?/create"
		class="mt-8 space-y-6"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update({ reset: false });
				submitting = false;
			};
		}}
	>
		<label class="block">
			<span class="mb-1 block text-sm font-medium">Ваше имя</span>
			<input
				type="text"
				name="name"
				bind:value={name}
				maxlength="20"
				required
				autocomplete="nickname"
				placeholder="Как вас зовут друзья"
				class="w-full rounded-lg border-border bg-card px-4 py-3 focus:border-primary focus:ring-primary"
			/>
		</label>

		{#if form?.error}
			<p class="text-sm text-destructive" role="alert">{form.error}</p>
		{/if}

		{#if data.quizzes.length === 0}
			<p class="rounded-xl border border-border bg-card p-4 text-muted-foreground">
				Пока нет опубликованных викторин.
			</p>
		{:else}
			<ul class="space-y-3">
				{#each data.quizzes as quiz (quiz.id)}
					<li>
						<button
							type="submit"
							name="quizId"
							value={quiz.id}
							disabled={submitting || !name.trim()}
							class="w-full cursor-pointer rounded-xl border-2 border-border bg-card p-4 text-left transition-colors duration-150 hover:border-primary disabled:cursor-not-allowed disabled:opacity-60"
						>
							<span class="block text-lg font-semibold">{quiz.title}</span>
							{#if quiz.description}
								<span class="mt-1 block text-muted-foreground">{quiz.description}</span>
							{/if}
							<span class="mt-2 block text-sm text-muted-foreground">
								{quiz.questionCount}
								{plural(quiz.questionCount)} · {quiz.timeLimit} сек. на ответ
							</span>
						</button>
					</li>
				{/each}
			</ul>
			<p class="text-sm text-muted-foreground">
				Введите имя, затем нажмите на викторину — комната создастся сразу.
			</p>
		{/if}
	</form>
</div>

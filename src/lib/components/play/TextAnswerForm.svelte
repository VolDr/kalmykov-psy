<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import { MAX_TEXT_ANSWER } from '$lib/data/game-answer-match';

	type Props = {
		/** Что игрок уже отправил; null — ещё не отвечал */
		submitted: string | null;
		/** Время вышло или вопрос закрыт */
		locked: boolean;
		onsubmit: (text: string) => void;
	};

	let { submitted, locked, onsubmit }: Props = $props();

	let draft = $state('');

	const done = $derived(submitted !== null || locked);

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!done && draft.trim()) onsubmit(draft);
	}
</script>

<form onsubmit={handleSubmit} class="space-y-3">
	<input
		type="text"
		value={submitted ?? draft}
		oninput={(e) => (draft = e.currentTarget.value)}
		disabled={done}
		maxlength={MAX_TEXT_ANSWER}
		autocomplete="off"
		autocapitalize="off"
		spellcheck="false"
		placeholder="Введите ответ"
		aria-label="Ваш ответ"
		class="w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-lg focus:border-primary focus:ring-primary disabled:opacity-70"
	/>
	{#if !done}
		<Button type="submit" disabled={!draft.trim()} class="w-full">Ответить</Button>
	{/if}
</form>

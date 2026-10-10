<script lang="ts">
	import ChoiceAnswer from './ChoiceAnswer.svelte';
	import MultiChoiceAnswer from './MultiChoiceAnswer.svelte';
	import PauseButton from './PauseButton.svelte';
	import QuestionImage from './QuestionImage.svelte';
	import Scoreboard from './Scoreboard.svelte';
	import TextAnswerForm from './TextAnswerForm.svelte';
	import type { RoomView } from '$lib/data/game-room-types';

	type Props = {
		view: RoomView;
		remainingMs: number;
		onanswer: (answer: { option?: number; options?: number[]; text?: string }) => void;
		onpause: () => void;
		busy: boolean;
	};

	let { view, remainingMs, onanswer, onpause, busy }: Props = $props();

	const revealed = $derived(view.phase === 'reveal');
	const isLast = $derived(view.index + 1 >= view.total);
	const seconds = $derived(Math.ceil(remainingMs / 1000));
	// Одна и та же полоса: на вопросе отсчитывает время ответа, после него — паузу до следующего
	const share = $derived(Math.min(1, remainingMs / (revealed ? view.revealMs : view.timeLimitMs)));

	const isText = $derived(view.question?.kind === 'text');
	const isMulti = $derived(view.question?.kind === 'multi');
	const answered = $derived(
		view.you.answer !== null || view.you.answers !== null || view.you.answerText !== null
	);

	// Выбрал вариант, но не нажал «Подтвердить» — для такого вердикта другой текст.
	// Запоминаем номер вопроса, чтобы на следующем вопросе признак сбрасывался сам
	let choiceMadeAt = $state<number | null>(null);
	const hadUnconfirmedChoice = $derived(choiceMadeAt === view.index);

	const verdict = $derived(
		answered
			? view.you.correct
				? 'Верно!'
				: (view.you.fraction ?? 0) > 0
					? 'Частично верно'
					: 'Не угадали'
			: hadUnconfirmedChoice
				? 'Вы не подтвердили ответ'
				: 'Вы не успели ответить'
	);
</script>

<!-- inert: под оверлеем паузы нельзя ни табом дойти до полей, ни ответить -->
<div class="space-y-6" inert={view.paused}>
	<div class="flex items-center justify-between gap-3 text-sm text-muted-foreground">
		<span>Вопрос {view.index + 1} из {view.total}</span>
		<div class="flex items-center gap-4">
			{#if view.you.isHost}
				<PauseButton {onpause} {busy} />
			{/if}
			{#if revealed}
				<span aria-live="off">
					{isLast ? 'Итоги' : 'Дальше'} через
					<span class="font-semibold text-foreground tabular-nums">{seconds}</span>
				</span>
			{:else}
				<span class="font-semibold text-foreground tabular-nums" aria-label="Осталось секунд">
					{seconds}
				</span>
			{/if}
		</div>
	</div>

	<div class="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
		<div
			class="h-full bg-primary transition-[width] duration-200"
			style:width="{share * 100}%"
		></div>
	</div>

	<h1 class="text-2xl leading-snug font-semibold">{view.question?.text}</h1>

	{#if view.question?.image}
		{#key view.index}
			<QuestionImage src={view.question.image} />
		{/key}
	{/if}

	{#key view.index}
		{#if isText}
			<TextAnswerForm
				submitted={view.you.answerText}
				locked={revealed}
				onsubmit={(text) => onanswer({ text })}
			/>
			{#if revealed && view.correctAnswers}
				<p class="rounded-xl border-2 border-green-600 bg-green-50 px-4 py-3">
					<span class="block text-sm text-muted-foreground">Правильный ответ</span>
					{view.correctAnswers.join(' / ')}
				</p>
			{/if}
		{:else if isMulti}
			<MultiChoiceAnswer
				options={view.question?.options ?? []}
				answers={view.you.answers}
				correctOptions={view.correctOptions}
				counts={view.counts}
				{revealed}
				{busy}
				onconfirm={(options) => onanswer({ options })}
				onselect={(hasSelection) => (choiceMadeAt = hasSelection ? view.index : null)}
			/>
		{:else}
			<ChoiceAnswer
				options={view.question?.options ?? []}
				answer={view.you.answer}
				correct={view.correct}
				counts={view.counts}
				{revealed}
				{busy}
				onconfirm={(option) => onanswer({ option })}
				onselect={() => (choiceMadeAt = view.index)}
			/>
		{/if}
	{/key}

	<p class="min-h-6 text-center text-muted-foreground" aria-live="polite">
		{#if revealed}
			{verdict}
		{:else if answered}
			Ответ принят. Ждём остальных…
		{/if}
	</p>

	{#if revealed && view.explanation}
		<div class="rounded-xl bg-muted px-4 py-3">
			<p class="text-sm font-medium text-muted-foreground">Пояснение</p>
			<p class="mt-1 whitespace-pre-line">{view.explanation}</p>
		</div>
	{/if}

	<Scoreboard players={view.players} youId={view.you.id} phase={view.phase} />
</div>

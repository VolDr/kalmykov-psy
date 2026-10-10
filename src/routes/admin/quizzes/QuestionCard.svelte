<script lang="ts">
	import type { GameQuestion } from '../../../db/schema';
	import {
		MAX_ANSWERS,
		MAX_EXPLANATION,
		MAX_IMAGE_URL,
		MAX_OPTIONS,
		MIN_OPTIONS,
		parseImageUrl
	} from '$lib/data/game-quiz-json';

	type Kind = 'choice' | 'multi' | 'text';

	type Props = {
		question: GameQuestion;
		index: number;
		onmove: (delta: number) => void;
		onremove: () => void;
	};

	let { question = $bindable(), index, onmove, onremove }: Props = $props();

	const kind = $derived<Kind>(
		question.type === 'text' ? 'text' : question.type === 'multi' ? 'multi' : 'choice'
	);

	// Предпросмотр показываем, только если ссылка подходит (иначе сохранение всё равно откажет)
	const previewUrl = $derived.by(() => {
		const url = parseImageUrl(question.image);
		return typeof url === 'string' ? url : null;
	});

	const KINDS: { value: Kind; label: string }[] = [
		{ value: 'choice', label: 'Один верный' },
		{ value: 'multi', label: 'Несколько верных' },
		{ value: 'text', label: 'Ввод ответа' }
	];

	/** Переключает тип вопроса, сохраняя текст, варианты и, где можно, верный ответ. */
	function setKind(next: Kind) {
		const q = question;
		if (kind === next) return;
		const options = q.type === 'text' ? ['', ''] : q.options;
		const firstRight = q.type === 'multi' ? (q.correct[0] ?? 0) : q.type === 'text' ? 0 : q.correct;

		// Картинка и пояснение принадлежат вопросу, а не его типу — при смене типа остаются
		const { image, explanation } = q;

		if (next === 'text') {
			const right = q.type === 'text' ? '' : options[firstRight]?.trim();
			question = { type: 'text', text: q.text, answers: [right || ''], image, explanation };
		} else if (next === 'multi') {
			question = {
				type: 'multi',
				text: q.text,
				options,
				correct: [firstRight],
				image,
				explanation
			};
		} else {
			question = { text: q.text, options, correct: firstRight, image, explanation };
		}
	}

	function addOption() {
		if (question.type !== 'text' && question.options.length < MAX_OPTIONS) {
			question.options.push('');
		}
	}

	function removeOption(k: number) {
		if (question.type === 'text' || question.options.length <= MIN_OPTIONS) return;
		question.options.splice(k, 1);
		if (question.type === 'multi') {
			const left = question.correct.filter((c) => c !== k).map((c) => (c > k ? c - 1 : c));
			question.correct = left.length > 0 ? left : [0];
		} else if (question.correct === k) {
			question.correct = 0;
		} else if (question.correct > k) {
			question.correct -= 1;
		}
	}

	function toggleCorrect(k: number) {
		if (question.type !== 'multi') return;
		question.correct = question.correct.includes(k)
			? question.correct.filter((c) => c !== k)
			: [...question.correct, k].sort((a, b) => a - b);
	}

	function addAnswer() {
		if (question.type === 'text' && question.answers.length < MAX_ANSWERS) {
			question.answers.push('');
		}
	}

	function removeAnswer(k: number) {
		if (question.type === 'text' && question.answers.length > 1) question.answers.splice(k, 1);
	}
</script>

<fieldset class="space-y-3 rounded-lg border bg-white p-4">
	<legend class="px-2 text-sm font-medium">Вопрос {index + 1}</legend>
	<textarea
		bind:value={question.text}
		rows="2"
		maxlength="300"
		placeholder="Текст вопроса"
		aria-label="Текст вопроса {index + 1}"
		class="w-full rounded-md border-gray-300"
	></textarea>

	<div class="space-y-2">
		<input
			type="url"
			bind:value={question.image}
			maxlength={MAX_IMAGE_URL}
			placeholder="Ссылка на картинку (необязательно): https://… или /путь/к/файлу.webp"
			aria-label="Ссылка на картинку к вопросу {index + 1}"
			class="w-full rounded-md border-gray-300 text-sm"
		/>
		{#if previewUrl}
			<img
				src={previewUrl}
				alt="Предпросмотр картинки к вопросу {index + 1}"
				referrerpolicy="no-referrer"
				class="max-h-32 rounded-md border bg-gray-50 object-contain"
			/>
		{/if}
	</div>

	<div
		class="flex flex-wrap gap-x-4 gap-y-1 text-sm"
		role="radiogroup"
		aria-label="Тип вопроса {index + 1}"
	>
		{#each KINDS as { value, label } (value)}
			<label class="flex items-center gap-1.5">
				<input
					type="radio"
					name="type-{index}"
					checked={kind === value}
					onchange={() => setKind(value)}
				/>
				{label}
			</label>
		{/each}
	</div>

	{#if question.type === 'text'}
		<div class="space-y-2">
			<p class="text-xs text-gray-500">
				Игрок печатает ответ сам. Регистр, «ё/е» и знаки препинания не важны, в длинных словах без
				цифр прощается одна опечатка. Добавьте другие написания, которые тоже верны.
			</p>
			{#each question.answers as _, k (k)}
				<div class="flex items-center gap-2">
					<input
						type="text"
						bind:value={question.answers[k]}
						maxlength="100"
						placeholder={k === 0 ? 'Верный ответ' : 'Другое верное написание'}
						aria-label="Ответ {k + 1} вопроса {index + 1}"
						class="flex-1 rounded-md border-gray-300"
					/>
					<button
						type="button"
						onclick={() => removeAnswer(k)}
						disabled={question.answers.length <= 1}
						aria-label="Удалить ответ {k + 1}"
						class="cursor-pointer px-2 text-gray-500 hover:text-red-600 disabled:cursor-default disabled:opacity-30"
					>
						×
					</button>
				</div>
			{/each}
		</div>
	{:else}
		<div class="space-y-2">
			{#if question.type === 'multi'}
				<p class="text-xs text-gray-500">
					Отметьте флажками все верные варианты. Очки: (верно отмеченные − неверно отмеченные) ÷
					число верных, не ниже нуля.
				</p>
			{/if}
			{#each question.options as _, k (k)}
				<div class="flex items-center gap-2">
					{#if question.type === 'multi'}
						<input
							type="checkbox"
							checked={question.correct.includes(k)}
							onchange={() => toggleCorrect(k)}
							aria-label="Верный ответ: вариант {k + 1}"
						/>
					{:else}
						<input
							type="radio"
							name="correct-{index}"
							checked={question.correct === k}
							onchange={() => question.type !== 'text' && (question.correct = k)}
							aria-label="Верный ответ: вариант {k + 1}"
						/>
					{/if}
					<input
						type="text"
						bind:value={question.options[k]}
						maxlength="150"
						placeholder="Вариант {k + 1}"
						aria-label="Вариант {k + 1} вопроса {index + 1}"
						class="flex-1 rounded-md border-gray-300"
					/>
					<button
						type="button"
						onclick={() => removeOption(k)}
						disabled={question.options.length <= MIN_OPTIONS}
						aria-label="Удалить вариант {k + 1}"
						class="cursor-pointer px-2 text-gray-500 hover:text-red-600 disabled:cursor-default disabled:opacity-30"
					>
						×
					</button>
				</div>
			{/each}
		</div>
	{/if}

	<label class="block">
		<span class="mb-1 block text-xs text-gray-500">
			Пояснение после ответа (необязательно): появляется у всех, когда вопрос закрыт. Показ ответа
			становится дольше, чтобы его успели прочитать.
		</span>
		<textarea
			bind:value={question.explanation}
			rows="2"
			maxlength={MAX_EXPLANATION}
			placeholder="Например: Канберра стала столицей как компромисс между Сиднеем и Мельбурном"
			aria-label="Пояснение к вопросу {index + 1}"
			class="w-full rounded-md border-gray-300 text-sm"
		></textarea>
	</label>

	<div class="flex flex-wrap gap-4 text-sm">
		{#if question.type === 'text'}
			<button
				type="button"
				onclick={addAnswer}
				disabled={question.answers.length >= MAX_ANSWERS}
				class="cursor-pointer text-blue-600 hover:underline disabled:opacity-40"
			>
				+ другое написание
			</button>
		{:else}
			<button
				type="button"
				onclick={addOption}
				disabled={question.options.length >= MAX_OPTIONS}
				class="cursor-pointer text-blue-600 hover:underline disabled:opacity-40"
			>
				+ вариант
			</button>
		{/if}
		<button
			type="button"
			onclick={() => onmove(-1)}
			class="cursor-pointer text-gray-600 hover:underline"
		>
			выше
		</button>
		<button
			type="button"
			onclick={() => onmove(1)}
			class="cursor-pointer text-gray-600 hover:underline"
		>
			ниже
		</button>
		<button type="button" onclick={onremove} class="cursor-pointer text-red-600 hover:underline">
			удалить вопрос
		</button>
	</div>
</fieldset>

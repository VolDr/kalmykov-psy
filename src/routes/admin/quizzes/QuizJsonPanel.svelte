<script lang="ts">
	import { parseQuizJson, type ImportedMeta } from '$lib/data/game-quiz-json';
	import type { GameQuestion } from '../../../db/schema';

	type Props = {
		/** Текущая викторина из редактора в виде JSON — для копирования и правки */
		currentJson: string;
		onimport: (meta: ImportedMeta, questions: GameQuestion[], mode: 'replace' | 'append') => void;
	};

	let { currentJson, onimport }: Props = $props();

	const EXAMPLE = JSON.stringify(
		{
			title: 'География',
			description: 'Проверьте себя и друзей',
			timeLimit: 20,
			published: false,
			questions: [
				{
					text: 'Столица Австралии?',
					options: ['Сидней', 'Канберра', 'Мельбурн'],
					correct: 1,
					image: 'https://example.com/australia-map.jpg',
					explanation: 'Канберра стала столицей как компромисс между Сиднеем и Мельбурном.'
				},
				{ text: 'Самая длинная река?', options: ['Нил', 'Амазонка'], correct: 'Нил' },
				{
					type: 'multi',
					text: 'Какие из этих городов — столицы?',
					options: ['Рим', 'Милан', 'Мадрид', 'Барселона'],
					correct: [0, 2]
				},
				{ type: 'text', text: 'Столица Франции?', answers: ['Париж', 'Paris'] }
			]
		},
		null,
		2
	);

	let open = $state(false);
	let text = $state('');
	let message = $state<{ kind: 'ok' | 'error'; text: string } | null>(null);

	function run(mode: 'replace' | 'append') {
		const result = parseQuizJson(text);
		if (!result.ok) {
			message = { kind: 'error', text: result.error };
			return;
		}
		onimport(result.meta, result.questions, mode);
		message = {
			kind: 'ok',
			text:
				(mode === 'replace' ? 'Вопросы заменены' : 'Вопросы добавлены в конец') +
				`: ${result.questions.length}. Не забудьте нажать «Сохранить».`
		};
	}

	function loadCurrent() {
		text = currentJson;
		message = null;
	}

	function loadExample() {
		text = EXAMPLE;
		message = null;
	}
</script>

<details bind:open class="rounded-lg border bg-white p-4">
	<summary class="cursor-pointer text-sm font-medium">Импорт и экспорт в JSON</summary>

	<div class="mt-4 space-y-3 text-sm">
		<p class="text-gray-600">
			Вставьте JSON — целой викториной или просто списком вопросов. Верный ответ в
			<code>correct</code>: номер варианта с нуля (<code>1</code> — второй вариант) или точный текст
			варианта. Несколько верных: <code>"type": "multi"</code> и <code>"correct"</code> списком (<code
				>[0, 2]</code
			>
			или тексты вариантов); очки — (верно отмеченные − неверно отмеченные) ÷ число верных, не ниже нуля.
			Ввод ответа:
			<code>"type": "text"</code> и список засчитываемых написаний <code>"answers"</code> вместо
			<code>options</code> и <code>correct</code>. Картинка к вопросу — необязательное поле
			<code>"image"</code>: ссылка
			<code>https://…</code> или путь от корня сайта (<code>/папка/файл.webp</code>). Остальные поля
			необязательны. Пояснение после ответа — необязательное поле <code>"explanation"</code> (до 600
			символов): показывается всем после закрытия вопроса, показ ответа при этом становится дольше.
		</p>

		<textarea
			bind:value={text}
			rows="12"
			spellcheck="false"
			aria-label="JSON викторины"
			placeholder={EXAMPLE}
			class="w-full rounded-md border-gray-300 font-mono text-xs"
		></textarea>

		<div class="flex flex-wrap gap-3">
			<button
				type="button"
				onclick={() => run('replace')}
				disabled={!text.trim()}
				class="cursor-pointer rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
			>
				Заменить вопросы
			</button>
			<button
				type="button"
				onclick={() => run('append')}
				disabled={!text.trim()}
				class="cursor-pointer rounded-md border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
			>
				Добавить в конец
			</button>
			<button
				type="button"
				onclick={loadCurrent}
				class="cursor-pointer text-blue-600 hover:underline"
			>
				Показать текущую викторину
			</button>
			<button
				type="button"
				onclick={loadExample}
				class="cursor-pointer text-blue-600 hover:underline"
			>
				Вставить пример
			</button>
		</div>

		{#if message}
			<p
				class={message.kind === 'error' ? 'text-red-600' : 'text-green-700'}
				role={message.kind === 'error' ? 'alert' : 'status'}
			>
				{message.text}
			</p>
		{/if}
	</div>
</details>

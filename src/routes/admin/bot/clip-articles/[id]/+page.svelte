<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	// _key — стабильный id строки в UI (для {#each}, чтобы bind:value не путался
	// при перестановке/удалении). На сервер не влияет: parsePagesJson читает только
	// heading/text/buttonText/imageUrl.
	type EditablePage = {
		_key: number;
		heading: string;
		text: string;
		buttonText: string;
		imageUrl: string;
	};

	let nextKey = 0;
	function makePage(p?: {
		heading?: string;
		text?: string;
		buttonText?: string;
		imageUrl?: string;
	}): EditablePage {
		return {
			_key: nextKey++,
			heading: p?.heading ?? '',
			text: p?.text ?? '',
			buttonText: p?.buttonText ?? '',
			imageUrl: p?.imageUrl ?? ''
		};
	}

	// Экраны редактируются в локальном стейте и уходят на сервер JSON-строкой
	let pages = $state<EditablePage[]>(data.article.pages.map((p) => makePage(p)));

	let pagesJson = $derived(JSON.stringify(pages));

	function addPage() {
		pages.push(makePage());
	}

	function removePage(index: number) {
		pages.splice(index, 1);
	}

	function movePage(index: number, direction: -1 | 1) {
		const target = index + direction;
		if (target < 0 || target >= pages.length) return;
		[pages[index], pages[target]] = [pages[target], pages[index]];
	}
</script>

<svelte:head>
	<title>{data.article.title} — Лид-статья</title>
</svelte:head>

<div class="p-6">
	<a
		href="/admin/bot/clip-articles"
		class="mb-4 inline-block text-sm text-blue-600 hover:underline"
	>
		← Все лид-статьи
	</a>
	<h1 class="mb-1 text-2xl font-semibold">{data.article.title}</h1>
	<p class="mb-6 text-sm text-stone-500">
		Страница:
		<a
			href="/useful/{data.article.slug}"
			target="_blank"
			rel="noopener noreferrer"
			class="text-blue-600 hover:underline"
		>
			/useful/{data.article.slug}
		</a>
		{#if !data.article.enabled}
			· <span class="text-orange-600">выключена — открывается только после включения</span>
		{/if}
	</p>

	<form
		method="POST"
		action="?/update"
		use:enhance={() =>
			async ({ update }) => {
				await update({ reset: false });
			}}
		class="max-w-3xl space-y-6"
	>
		<input type="hidden" name="pages" value={pagesJson} />

		<section class="space-y-4 rounded-xl border bg-white p-4">
			<h2 class="text-sm font-semibold text-stone-700">Основное</h2>

			<div class="grid gap-4 sm:grid-cols-2">
				<label class="block text-xs font-medium text-stone-500">
					Название (заголовок первого экрана)
					<input
						type="text"
						name="title"
						value={data.article.title}
						class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
					/>
				</label>
				<label class="block text-xs font-medium text-stone-500">
					Slug (URL: /useful/…)
					<input
						type="text"
						name="slug"
						value={data.article.slug}
						class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
					/>
				</label>
			</div>

			<label class="block text-xs font-medium text-stone-500">
				Подзаголовок (под заголовком на первом экране)
				<textarea
					name="subtitle"
					rows="2"
					class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
					value={data.article.subtitle ?? ''}
				></textarea>
			</label>

			<label class="flex items-center gap-2 text-sm text-stone-600">
				<input type="checkbox" name="enabled" checked={data.article.enabled} class="rounded" />
				Статья включена (доступна по ссылке)
			</label>
		</section>

		<section class="space-y-4 rounded-xl border bg-white p-4">
			<div class="flex items-center justify-between">
				<h2 class="text-sm font-semibold text-stone-700">Экраны статьи</h2>
				<button
					type="button"
					onclick={addPage}
					class="rounded-lg border px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-50"
				>
					+ Добавить экран
				</button>
			</div>
			<p class="text-xs text-stone-400">
				Каждый экран — короткий кусок статьи с кнопкой на следующий шаг. Абзацы разделяются пустой
				строкой, поддерживаются **жирный** и [ссылки](https://…).
			</p>

			{#if pages.length === 0}
				<p class="text-sm text-stone-500">Экранов пока нет — добавьте первый.</p>
			{/if}

			{#each pages as page, i (page._key)}
				<div class="space-y-3 rounded-lg border bg-stone-50/60 p-3">
					<div class="flex items-center justify-between">
						<span class="text-xs font-semibold text-stone-500">Экран {i + 1}</span>
						<div class="flex gap-1">
							<button
								type="button"
								onclick={() => movePage(i, -1)}
								disabled={i === 0}
								class="rounded border px-2 py-1 text-xs text-stone-500 hover:bg-white disabled:opacity-40"
								aria-label="Выше"
							>
								↑
							</button>
							<button
								type="button"
								onclick={() => movePage(i, 1)}
								disabled={i === pages.length - 1}
								class="rounded border px-2 py-1 text-xs text-stone-500 hover:bg-white disabled:opacity-40"
								aria-label="Ниже"
							>
								↓
							</button>
							<button
								type="button"
								onclick={() => removePage(i)}
								class="rounded border border-red-200 px-2 py-1 text-xs text-red-500 hover:bg-red-50"
							>
								Удалить
							</button>
						</div>
					</div>

					<label class="block text-xs font-medium text-stone-500">
						Заголовок экрана (необязательно)
						<input
							type="text"
							bind:value={page.heading}
							class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
						/>
					</label>

					<label class="block text-xs font-medium text-stone-500">
						Текст экрана
						<textarea
							bind:value={page.text}
							rows="6"
							class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
						></textarea>
					</label>

					<label class="block text-xs font-medium text-stone-500">
						Текст кнопки «дальше» (пусто — «Дальше»; на последнем экране — кнопка опросника)
						<input
							type="text"
							bind:value={page.buttonText}
							class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
						/>
					</label>

					<label class="block text-xs font-medium text-stone-500">
						URL картинки под текстом (необязательно)
						<input
							type="text"
							bind:value={page.imageUrl}
							placeholder="/lmc/1.webp или https://…"
							class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
						/>
						{#if page.imageUrl}
							<img
								src={page.imageUrl}
								alt="Превью"
								class="mt-2 max-h-40 rounded-lg border object-contain"
							/>
						{/if}
					</label>
				</div>
			{/each}
		</section>

		<section class="space-y-4 rounded-xl border bg-white p-4">
			<h2 class="text-sm font-semibold text-stone-700">Опросник в конце</h2>

			<label class="flex items-center gap-2 text-sm text-stone-600">
				<input
					type="checkbox"
					name="quizEnabled"
					checked={data.article.quizEnabled}
					class="rounded"
				/>
				Показывать опросник BAT-23 после последнего экрана
			</label>

			<div class="grid gap-4 sm:grid-cols-2">
				<label class="block text-xs font-medium text-stone-500">
					Кнопка перехода к опроснику (пусто — «Пройти опросник»)
					<input
						type="text"
						name="quizButtonText"
						value={data.article.quizButtonText ?? ''}
						class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
					/>
				</label>
				<label class="block text-xs font-medium text-stone-500">
					Заголовок экрана результата (пусто — «Ваш общий результат»)
					<input
						type="text"
						name="resultHeading"
						value={data.article.resultHeading ?? ''}
						class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
					/>
				</label>
			</div>

			<p class="text-xs text-stone-400">
				На сайте показывается только общий балл и уровень. Тексты ниже — пояснение под результатом
				для каждой зоны (пусто — без пояснения).
			</p>

			<label class="block text-xs font-medium text-stone-500">
				Текст для зелёной зоны
				<textarea
					name="resultTextGreen"
					rows="3"
					class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
					value={data.article.resultTextGreen ?? ''}
				></textarea>
			</label>
			<label class="block text-xs font-medium text-stone-500">
				Текст для оранжевой зоны
				<textarea
					name="resultTextOrange"
					rows="3"
					class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
					value={data.article.resultTextOrange ?? ''}
				></textarea>
			</label>
			<label class="block text-xs font-medium text-stone-500">
				Текст для красной зоны
				<textarea
					name="resultTextRed"
					rows="3"
					class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
					value={data.article.resultTextRed ?? ''}
				></textarea>
			</label>

			<label class="block text-xs font-medium text-stone-500">
				Приглашение получить разбор в боте (под результатом)
				<textarea
					name="botCtaText"
					rows="3"
					placeholder="Подробный разбор по четырём сферам выгорания и рекомендации, что делать дальше, я отправлю в телеграм-боте. Это бесплатно."
					class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
					value={data.article.botCtaText ?? ''}
				></textarea>
			</label>
			<label class="block text-xs font-medium text-stone-500">
				Кнопка перехода в бота (пусто — «Получить разбор в боте»)
				<input
					type="text"
					name="botCtaButtonText"
					value={data.article.botCtaButtonText ?? ''}
					class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
				/>
			</label>
		</section>

		{#if form?.error}
			<p class="text-sm text-red-500">{form.error}</p>
		{/if}
		{#if form?.success}
			<p class="text-sm text-green-600">Сохранено</p>
		{/if}

		<button
			type="submit"
			class="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
		>
			Сохранить
		</button>
	</form>

	<form method="POST" action="?/delete" use:enhance class="mt-4 max-w-3xl">
		<button type="submit" class="text-sm text-red-500 hover:underline">Удалить статью</button>
	</form>
</div>

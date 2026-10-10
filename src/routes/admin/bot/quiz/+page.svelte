<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	const zoneLabels = {
		green: 'Зелёная зона',
		orange: 'Оранжевая зона',
		red: 'Красная зона'
	} as const;
</script>

<svelte:head>
	<title>Опросник в боте — Админка</title>
</svelte:head>

<div class="p-6">
	<h1 class="mb-1 text-2xl font-semibold">Опросник: выдача результатов в боте</h1>
	<p class="mb-6 max-w-2xl text-sm text-stone-500">
		Что бот отправляет по диплинку с лид-статьи: просьба подписаться на канал, проверка подписки и
		разбор результатов по сферам. Пустые поля работают на дефолтных текстах — здесь показаны
		значения, которые реально уйдут. Разметка как в шагах сценариев: **жирный**,
		[ссылка](https://…).
	</p>

	<form
		method="POST"
		action="?/save"
		use:enhance={() =>
			async ({ update }) => {
				await update({ reset: false });
			}}
		class="max-w-3xl space-y-6"
	>
		<section class="space-y-4 rounded-xl border bg-white p-4">
			<h2 class="text-sm font-semibold text-stone-700">Бот и канал</h2>

			<div class="grid gap-4 sm:grid-cols-3">
				<label class="block text-xs font-medium text-stone-500">
					Username бота (без @)
					<input
						type="text"
						name="botUsername"
						value={data.settings.botUsername ?? ''}
						placeholder="пусто — из getMe()"
						class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
					/>
				</label>
				<label class="block text-xs font-medium text-stone-500">
					Канал для проверки подписки
					<input
						type="text"
						name="channelChatId"
						value={data.settings.channelChatId ?? ''}
						placeholder="@kalmykov_psy или -100…"
						class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
					/>
				</label>
				<label class="block text-xs font-medium text-stone-500">
					Ссылка для кнопки «Подписаться»
					<input
						type="text"
						name="channelUrl"
						value={data.settings.channelUrl ?? ''}
						placeholder="https://t.me/kalmykov_psy"
						class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
					/>
				</label>
			</div>

			<label class="flex items-center gap-2 text-sm text-stone-600">
				<input
					type="checkbox"
					name="requireSubscription"
					checked={data.settings.requireSubscription}
					class="rounded"
				/>
				Требовать подписку на канал перед выдачей разбора
			</label>
			<p class="text-xs text-stone-400">
				Бот должен быть админом канала, иначе проверить подписку не получится (в этом случае разбор
				выдаётся без проверки). Без канала или с выключенной галкой разбор выдаётся сразу.
			</p>
		</section>

		<section class="space-y-4 rounded-xl border bg-white p-4">
			<h2 class="text-sm font-semibold text-stone-700">Просьба подписаться</h2>

			<label class="block text-xs font-medium text-stone-500">
				Сообщение с просьбой подписаться
				<textarea
					name="subscribeText"
					rows="4"
					class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
					value={data.settings.subscribeText}
				></textarea>
			</label>

			<div class="grid gap-4 sm:grid-cols-2">
				<label class="block text-xs font-medium text-stone-500">
					Кнопка «Подписаться»
					<input
						type="text"
						name="subscribeButtonText"
						value={data.settings.subscribeButtonText}
						class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
					/>
				</label>
				<label class="block text-xs font-medium text-stone-500">
					Кнопка «Я подписался»
					<input
						type="text"
						name="checkButtonText"
						value={data.settings.checkButtonText}
						class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
					/>
				</label>
			</div>

			<label class="block text-xs font-medium text-stone-500">
				Алерт при клике «Я подписался» без подписки (до 200 символов)
				<textarea
					name="notSubscribedAlert"
					rows="2"
					class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
					value={data.settings.notSubscribedAlert}
				></textarea>
			</label>
		</section>

		<section class="space-y-4 rounded-xl border bg-white p-4">
			<h2 class="text-sm font-semibold text-stone-700">Разбор результатов</h2>

			<label class="block text-xs font-medium text-stone-500">
				Вступление (перед общим показателем)
				<textarea
					name="resultsHeaderText"
					rows="2"
					class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
					value={data.settings.resultsHeaderText}
				></textarea>
			</label>

			<p class="text-xs text-stone-400">
				После вступления бот шлёт общий показатель. Затем по каждой сфере: строка с её баллом и
				зоной (🟢🟠🔴), под ней рекомендация из текстов ниже. Сначала красные сферы, потом
				оранжевые, потом зелёные. Для оранжевой зоны пустой текст заменяется красным, для зелёной —
				не отправляется ничего. На этом разбор заканчивается: завершения с призывом записаться в нём
				нет.
			</p>

			{#each data.spheres as sphere (sphere.id)}
				<div class="space-y-3 rounded-lg border bg-stone-50/60 p-3">
					<span class="text-xs font-semibold text-stone-500">{sphere.name}</span>
					{#each ['green', 'orange', 'red'] as const as zone (zone)}
						<label class="block text-xs font-medium text-stone-500">
							{zoneLabels[zone]}
							<textarea
								name="rec_{sphere.id}_{zone}"
								rows="3"
								class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
								value={data.settings.sphereRecs[sphere.id]?.[zone] ?? ''}
							></textarea>
						</label>
					{/each}
				</div>
			{/each}
		</section>

		<p class="text-xs text-stone-400">
			После выдачи разбора контакт получает теги <code>quiz_burnout</code> и
			<code>quiz_burnout_&lt;зона&gt;</code>, а если есть включённая цепочка с триггером «Диплинк
			/start=» и значением <code>quiz_results_delivered</code> — она запускается (для прогрева).
			Запуск идёт при каждой выдаче, в том числе когда человек открыл разбор повторно, — поставьте
			цепочке кулдаун, иначе повторный заход начнёт её сначала. Призыв записаться ставьте шагом этой
			цепочки — со своей задержкой, например ссылкой
			<code>https://kalmykov-psy.ru/go/r/&#123;contact_id&#125;</code>.
		</p>

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
</div>

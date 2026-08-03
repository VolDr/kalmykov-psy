<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';

	let { data, form } = $props();

	// Раскладываем секунды в удобную пару значение+единица для формы
	function delayParts(seconds: number): { value: number; unit: string } {
		if (seconds > 0 && seconds % 86400 === 0) return { value: seconds / 86400, unit: 'days' };
		if (seconds > 0 && seconds % 3600 === 0) return { value: seconds / 3600, unit: 'hours' };
		if (seconds % 60 === 0) return { value: seconds / 60, unit: 'minutes' };
		return { value: seconds, unit: 'seconds' };
	}

	const isBroadcast = $derived(data.scenario.kind === 'broadcast');
	const backHref = $derived(isBroadcast ? '/admin/bot/broadcasts' : '/admin/bot/scenarios');

	function formatRunDate(iso: string) {
		return new Date(iso).toLocaleString('ru-RU', {
			timeZone: 'Europe/Moscow',
			day: '2-digit',
			month: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>{data.scenario.name} — сценарий бота</title>
</svelte:head>

<div class="p-6">
	<a href={backHref} class="mb-4 inline-block text-sm text-blue-600 hover:underline">
		← {isBroadcast ? 'Все рассылки' : 'Все сценарии'}
	</a>
	<h1 class="mb-6 text-2xl font-semibold">{data.scenario.name}</h1>

	<div class="grid gap-6 lg:grid-cols-3">
		<div class="lg:col-span-2">
			<h2 class="mb-3 text-sm font-semibold text-stone-600">Шаги</h2>

			{#if data.steps.length === 0}
				<p class="mb-4 text-sm text-stone-400">Шагов пока нет — добавьте первый ниже.</p>
			{/if}

			<div class="space-y-3">
				{#each data.steps as step, i (step.id)}
					{@const delay = delayParts(step.delaySeconds)}
					<div class="rounded-xl border bg-white p-4">
						<div class="mb-2 flex items-center justify-between">
							<span class="text-xs font-medium uppercase text-stone-400">Шаг {i + 1}</span>
							<div class="flex items-center gap-2">
								<form method="POST" action="?/moveStep" use:enhance>
									<input type="hidden" name="stepId" value={step.id} />
									<input type="hidden" name="direction" value="up" />
									<button
										type="submit"
										disabled={i === 0}
										aria-label="Переместить шаг выше"
										class="rounded border px-2 py-0.5 text-xs text-stone-500 hover:bg-stone-50 disabled:opacity-30"
									>
										↑
									</button>
								</form>
								<form method="POST" action="?/moveStep" use:enhance>
									<input type="hidden" name="stepId" value={step.id} />
									<input type="hidden" name="direction" value="down" />
									<button
										type="submit"
										disabled={i === data.steps.length - 1}
										aria-label="Переместить шаг ниже"
										class="rounded border px-2 py-0.5 text-xs text-stone-500 hover:bg-stone-50 disabled:opacity-30"
									>
										↓
									</button>
								</form>
								<form method="POST" action="?/deleteStep" use:enhance>
									<input type="hidden" name="stepId" value={step.id} />
									<button type="submit" class="text-xs text-red-500 hover:underline">Удалить</button>
								</form>
							</div>
						</div>

						<form
							method="POST"
							action="?/updateStep"
							enctype="multipart/form-data"
							use:enhance={() =>
								async ({ update }) => {
									// reset: false — иначе enhance сбрасывает поля к значениям на момент загрузки
									await update({ reset: false });
								}}
							class="space-y-3"
						>
							<input type="hidden" name="stepId" value={step.id} />
							<div class="flex flex-wrap items-end gap-2">
								<label class="block text-xs font-medium text-stone-500">
									Задержка перед шагом
									<input
										type="number"
										name="delayValue"
										min="0"
										value={delay.value}
										class="mt-1 w-24 rounded-lg border px-3 py-2 text-sm"
									/>
								</label>
								<select name="delayUnit" value={delay.unit} class="rounded-lg border px-3 py-2 text-sm">
									<option value="seconds">секунд</option>
									<option value="minutes">минут</option>
									<option value="hours">часов</option>
									<option value="days">дней</option>
								</select>
								<label class="block text-xs font-medium text-stone-500">
									Добавить теги (через запятую)
									<input
										type="text"
										name="addTags"
										value={step.addTags.join(', ')}
										class="mt-1 w-48 rounded-lg border px-3 py-2 text-sm"
									/>
								</label>
								<label class="block text-xs font-medium text-stone-500">
									Установить этап
									<input
										type="text"
										name="setStage"
										value={step.setStage ?? ''}
										class="mt-1 w-36 rounded-lg border px-3 py-2 text-sm"
									/>
								</label>
								<label class="block text-xs font-medium text-stone-500">
									Выполнять шаг
									<select
										name="condition"
										value={step.condition ?? ''}
										class="mt-1 w-56 rounded-lg border px-3 py-2 text-sm"
									>
										<option value="">всегда</option>
										<option value="subscribed">только если подписан на канал</option>
										<option value="not_subscribed">только если НЕ подписан на канал</option>
									</select>
								</label>
							</div>
							<label class="block text-xs font-medium text-stone-500">
								Сообщение
								<textarea
									name="messageText"
									rows="3"
									class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
									>{step.messageText ?? ''}</textarea
								>
							</label>
							<div class="flex flex-wrap gap-2">
								<label class="block text-xs font-medium text-stone-500">
									Текст кнопки (необязательно)
									<input
										type="text"
										name="buttonText"
										value={step.buttonText ?? ''}
										class="mt-1 w-44 rounded-lg border px-3 py-2 text-sm"
									/>
								</label>
								<label class="block text-xs font-medium text-stone-500">
									Ссылка кнопки
									<input
										type="text"
										name="buttonUrl"
										value={step.buttonUrl ?? ''}
										placeholder="https://…"
										class="mt-1 w-72 rounded-lg border px-3 py-2 text-sm"
									/>
								</label>
								<label class="block text-xs font-medium text-stone-500">
									Действие кнопки
									<select
										name="buttonAction"
										value={step.buttonAction}
										class="mt-1 w-64 rounded-lg border px-3 py-2 text-sm"
									>
										<option value="url">просто ссылка</option>
										<option value="check_subscription">проверить подписку и продолжить</option>
									</select>
								</label>
								<label class="block text-xs font-medium text-stone-500">
									Запустить цепочку после шага
									<select
										name="startScenarioId"
										value={step.startScenarioId != null ? String(step.startScenarioId) : ''}
										class="mt-1 w-56 rounded-lg border px-3 py-2 text-sm"
									>
										<option value="">— нет</option>
										{#each data.chainScenarios as chain (chain.id)}
											<option value={String(chain.id)}>
												{chain.name}{chain.kind === 'broadcast' ? ' (рассылка)' : ''}
											</option>
										{/each}
									</select>
								</label>
							</div>
							{#if step.buttonAction === 'check_subscription'}
								<p class="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
									Шаг-шлагбаум: бот покажет кнопку со ссылкой выше плюс кнопку «Я подписался» и
									остановит цепочку. Дальше она пойдёт, только когда подписка подтвердится. Текст
									кнопки проверки и алерта — в
									<a href={resolve('/admin/bot/quiz')} class="underline">настройках бота</a>.
								</p>
							{/if}
							<div class="space-y-1">
								{#if step.fileName}
									<p class="text-sm text-stone-600">
										📎 <span class="font-medium">{step.fileName}</span>
									</p>
									<label class="flex items-center gap-2 text-xs text-stone-500">
										<input type="checkbox" name="removeFile" class="rounded" />
										Удалить файл при сохранении
									</label>
								{/if}
								<label class="block text-xs font-medium text-stone-500">
									{step.fileName ? 'Заменить файл' : 'Файл-вложение (бот отправит документом)'}
									<input type="file" name="file" class="mt-1 block text-sm" />
								</label>
							</div>
							<button
								type="submit"
								class="rounded-lg border bg-white px-4 py-1.5 text-sm hover:bg-stone-50"
							>
								Сохранить шаг
							</button>
						</form>
					</div>
				{/each}
			</div>

			<h2 class="mb-3 mt-8 text-sm font-semibold text-stone-600">Добавить шаг</h2>
			<form
				method="POST"
				action="?/addStep"
				enctype="multipart/form-data"
				use:enhance
				class="space-y-3 rounded-xl border bg-white p-4"
			>
				<div class="flex flex-wrap items-end gap-2">
					<label class="block text-xs font-medium text-stone-500">
						Задержка перед шагом
						<input
							type="number"
							name="delayValue"
							min="0"
							value="0"
							class="mt-1 w-24 rounded-lg border px-3 py-2 text-sm"
						/>
					</label>
					<select name="delayUnit" class="rounded-lg border px-3 py-2 text-sm">
						<option value="seconds">секунд</option>
						<option value="minutes">минут</option>
						<option value="hours">часов</option>
						<option value="days">дней</option>
					</select>
					<label class="block text-xs font-medium text-stone-500">
						Добавить теги (через запятую)
						<input type="text" name="addTags" class="mt-1 w-48 rounded-lg border px-3 py-2 text-sm" />
					</label>
					<label class="block text-xs font-medium text-stone-500">
						Установить этап
						<input type="text" name="setStage" class="mt-1 w-36 rounded-lg border px-3 py-2 text-sm" />
					</label>
					<label class="block text-xs font-medium text-stone-500">
						Выполнять шаг
						<select name="condition" class="mt-1 w-56 rounded-lg border px-3 py-2 text-sm">
							<option value="">всегда</option>
							<option value="subscribed">только если подписан на канал</option>
							<option value="not_subscribed">только если НЕ подписан на канал</option>
						</select>
					</label>
				</div>
				<label class="block text-xs font-medium text-stone-500">
					Сообщение
					<textarea
						name="messageText"
						rows="3"
						placeholder="Текст, который бот отправит на этом шаге"
						class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
					></textarea>
				</label>
				<div class="flex flex-wrap gap-2">
					<label class="block text-xs font-medium text-stone-500">
						Текст кнопки (необязательно)
						<input type="text" name="buttonText" class="mt-1 w-44 rounded-lg border px-3 py-2 text-sm" />
					</label>
					<label class="block text-xs font-medium text-stone-500">
						Ссылка кнопки
						<input
							type="text"
							name="buttonUrl"
							placeholder="https://…"
							class="mt-1 w-72 rounded-lg border px-3 py-2 text-sm"
						/>
					</label>
					<label class="block text-xs font-medium text-stone-500">
						Действие кнопки
						<select name="buttonAction" class="mt-1 w-64 rounded-lg border px-3 py-2 text-sm">
							<option value="url">просто ссылка</option>
							<option value="check_subscription">проверить подписку и продолжить</option>
						</select>
					</label>
					<label class="block text-xs font-medium text-stone-500">
						Запустить цепочку после шага
						<select name="startScenarioId" class="mt-1 w-56 rounded-lg border px-3 py-2 text-sm">
							<option value="">— нет</option>
							{#each data.chainScenarios as chain (chain.id)}
								<option value={String(chain.id)}>
									{chain.name}{chain.kind === 'broadcast' ? ' (рассылка)' : ''}
								</option>
							{/each}
						</select>
					</label>
				</div>
				<label class="block text-xs font-medium text-stone-500">
					Файл-вложение (бот отправит документом после текста, до 50 МБ)
					<input type="file" name="file" class="mt-1 block text-sm" />
				</label>
				<button
					type="submit"
					class="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
				>
					Добавить шаг
				</button>
			</form>
			{#if form?.stepError}
				<p class="mt-2 text-sm text-red-500">{form.stepError}</p>
			{/if}
		</div>

		<div>
			<div class="rounded-xl border bg-white p-4">
				<h2 class="mb-3 text-sm font-semibold text-stone-600">
					{isBroadcast ? 'Настройки рассылки' : 'Настройки сценария'}
				</h2>
				<form
					method="POST"
					action="?/updateScenario"
					use:enhance={() =>
						async ({ update }) => {
							await update({ reset: false });
						}}
					class="space-y-3"
				>
					<label class="block text-xs font-medium text-stone-500">
						Название
						<input
							type="text"
							name="name"
							value={data.scenario.name}
							class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
						/>
					</label>
					<label class="block text-xs font-medium text-stone-500">
						Триггер
						<select
							name="triggerType"
							value={data.scenario.triggerType ?? ''}
							class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
						>
							{#if isBroadcast}
								<option value="">— без триггера (запуск вручную)</option>
							{/if}
							<option value="start_param">Диплинк /start=</option>
							<option value="command">Команда</option>
							<option value="text">Текст</option>
						</select>
					</label>
					<label class="block text-xs font-medium text-stone-500">
						Значение триггера
						<input
							type="text"
							name="triggerValue"
							value={data.scenario.triggerValue ?? ''}
							class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
						/>
					</label>
					<label class="flex items-center gap-2 text-sm">
						<input type="checkbox" name="enabled" checked={data.scenario.enabled} class="rounded" />
						{isBroadcast ? 'Рассылка включена' : 'Сценарий включён'}
					</label>
					<label class="flex items-start gap-2 text-sm">
						<input
							type="checkbox"
							name="cancelsOthers"
							checked={data.scenario.cancelsOthers}
							class="mt-0.5 rounded"
						/>
						<span>
							При запуске отменяет другие цепочки
							<span class="block text-xs text-stone-400"
								>Снимает ожидающие сообщения всех незащищённых цепочек контакта (например, прогрев
								после брони)</span
							>
						</span>
					</label>
					<label class="flex items-start gap-2 text-sm">
						<input
							type="checkbox"
							name="protectedFromCancel"
							checked={data.scenario.protectedFromCancel}
							class="mt-0.5 rounded"
						/>
						<span>
							Не отменять
							<span class="block text-xs text-stone-400"
								>Цепочка переживает отмену со стороны других цепочек</span
							>
						</span>
					</label>
					<label class="block text-xs font-medium text-stone-500">
						Не запускать чаще раза в N дней (0 — без ограничений)
						<input
							type="number"
							name="cooldownDays"
							min="0"
							value={data.scenario.cooldownDays}
							class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
						/>
					</label>
					<button
						type="submit"
						class="w-full rounded-lg border bg-white px-4 py-2 text-sm hover:bg-stone-50"
					>
						Сохранить
					</button>
					{#if form?.scenarioSuccess}
						<p class="text-xs text-green-600">Сохранено</p>
					{/if}
					{#if form?.scenarioError}
						<p class="text-xs text-red-500">{form.scenarioError}</p>
					{/if}
				</form>
			</div>

			<div class="mt-4 rounded-xl border bg-white p-4">
				<h2 class="mb-3 text-sm font-semibold text-stone-600">Запустить по сегменту</h2>
				<form method="POST" action="?/launch" use:enhance class="space-y-3">
					<label class="block text-xs font-medium text-stone-500">
						Есть все теги (через запятую; пусто — все контакты)
						<input
							type="text"
							name="requireTags"
							placeholder="lm_focus_read75"
							class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
						/>
					</label>
					<label class="block text-xs font-medium text-stone-500">
						Нет ни одного из тегов
						<input
							type="text"
							name="excludeTags"
							placeholder="intro_booked, digest_2026_07"
							class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
						/>
					</label>
					<button
						type="submit"
						class="w-full rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
					>
						Запустить сейчас
					</button>
					{#if form?.launchCount}
						<p class="text-xs text-green-600">Поставлено в очередь: {form.launchCount} контактов</p>
					{/if}
					{#if form?.launchError}
						<p class="text-xs text-red-500">{form.launchError}</p>
					{/if}
					<p class="text-xs text-stone-400">
						Заблокировавшие бота исключаются автоматически. Отправка идёт порциями (~200/мин).
					</p>
				</form>
			</div>

			<div class="mt-4 rounded-xl border bg-white p-4 text-sm text-stone-600">
				<p>В очереди на отправку: <strong>{data.pendingCount}</strong></p>
				{#if data.scenario.triggerType === 'start_param'}
					<p class="mt-2 break-all text-xs text-stone-400">
						Диплинк: t.me/&lt;бот&gt;?start={data.scenario.triggerValue}
					</p>
				{/if}
			</div>

			{#if data.runs.length > 0}
				<div class="mt-4 rounded-xl border bg-white p-4">
					<h2 class="mb-2 text-sm font-semibold text-stone-600">Последние запуски</h2>
					<ul class="space-y-1 text-xs text-stone-500">
						{#each data.runs as run (run.id)}
							<li>
								{formatRunDate(run.createdAt)} — {run.matchedCount} конт.
								{#if run.requireTags.length}· есть: {run.requireTags.join(', ')}{/if}
								{#if run.excludeTags.length}· нет: {run.excludeTags.join(', ')}{/if}
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			<div class="mt-4 rounded-xl border bg-white p-4 text-xs text-stone-500">
				<p class="mb-1 font-semibold text-stone-600">Форматирование сообщений</p>
				<p>
					**текст** — <b>жирный</b>, [текст](https://ссылка) — ссылка. Переносы строк и пустые
					строки между абзацами сохраняются как есть. Кнопка (текст + ссылка) появится под
					сообщением; в ссылке кнопки тоже работает &#123;contact_id&#125;.
				</p>
				<p class="mb-1 mt-3 font-semibold text-stone-600">Подстановки в сообщениях</p>
				<p>
					&#123;contact_id&#125; — id контакта (для персональных ссылок вида
					/go/f/a/&#123;contact_id&#125;), &#123;first_name&#125; — имя. Салеботовский
					#&#123;client_id&#125; тоже распознаётся. Работает и в тексте, и в ссылке кнопки.
				</p>
				<p class="mb-1 mt-3 font-semibold text-stone-600">Событийные ключи с сайта</p>
				<p>
					Сценарий с триггером «Диплинк» запускается и событиями сайта, если значение совпадает с
					ключом: lm_&lt;магнит&gt;_opened, lm_&lt;магнит&gt;_read75 (магниты: otpusk, focus,
					burnout), intro_booked, consultation_booked.
				</p>
			</div>
		</div>
	</div>
</div>

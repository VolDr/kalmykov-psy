<script lang="ts">
	import type { PageData, ActionData } from './$types';
	let { data, form }: { data: PageData; form: ActionData | null } = $props();
</script>

<svelte:head>
	<title>Тарифы — админка</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="max-w-2xl p-6">
	<h1 class="mb-2 text-2xl font-semibold">Стоимость консультаций</h1>
	<p class="mb-6 text-sm text-gray-600">
		Эти тарифы используются на сайте, в форме записи и при создании платежей Робокассы.
		Изменения действуют для новых платежей; ранее созданные счета сохраняют свою сумму.
	</p>
	<form method="POST" action="?/save" class="space-y-5 rounded-xl border bg-white p-6">
		<div>
			<label for="single" class="mb-2 block text-sm font-medium">Разовая консультация, ₽</label>
			<input id="single" name="single" type="number" min="1" max="1000000" step="1"
				required value={form?.values?.single ?? data.prices.single}
				class="w-full rounded-lg border border-gray-300 px-3 py-2" />
		</div>
		<div>
			<label for="package" class="mb-2 block text-sm font-medium">Пакет из 4 консультаций, ₽</label>
			<input id="package" name="package" type="number" min="1" max="1000000" step="1"
				required value={form?.values?.package ?? data.prices.package}
				class="w-full rounded-lg border border-gray-300 px-3 py-2" />
		</div>
		{#if form?.error}
			<p role="alert" class="text-sm text-red-600">{form.error}</p>
		{:else if form?.success}
			<p role="status" class="text-sm text-green-700">Цены сохранены.</p>
		{/if}
		<button type="submit" class="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-700">
			Сохранить тарифы
		</button>
	</form>
</div>

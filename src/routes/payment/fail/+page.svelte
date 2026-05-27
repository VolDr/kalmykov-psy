<svelte:head>
	<title>Оплата не прошла</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-stone-50 px-4">
	<div class="w-full max-w-md text-center">
		<div class="mb-6 flex justify-center">
			<div class="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
				<svg class="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</div>
		</div>
		<h1 class="font-display text-2xl font-medium text-stone-800">Оплата не прошла</h1>
		<p class="mt-4 text-stone-600">
			Попробуйте ещё раз или свяжитесь со мной 
			<a href="https://t.me/m/HK_tu_dOMDli" class="text-stone-800 underline underline-offset-2 hover:text-stone-600">
				напрямую
			</a>.
		</p>
		<div class="mt-8 flex justify-center gap-3">
			<a
				href="/payment"
				class="rounded-lg bg-stone-800 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700"
			>
				Попробовать снова
			</a>
			<a
				href="/"
				class="rounded-lg border border-stone-200 px-6 py-2.5 text-sm font-medium text-stone-600 transition hover:bg-stone-100"
			>
				На главную
			</a>
		</div>
	</div>
</div>

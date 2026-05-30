<svelte:head>
	<title>Оплата не прошла</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-stone-50 px-4">
	<div class="w-full max-w-md text-center">
		<div class="mb-6 flex justify-center">
			<div class="flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
				<svg class="h-8 w-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</div>
		</div>
		<h1 class="font-display text-2xl font-medium text-stone-800">Оплата не прошла</h1>
		<p class="mt-4 text-stone-600">
			Время записи освободилось — попробуйте выбрать снова.
		</p>
		<div class="mt-8 flex justify-center gap-3">
			<a
				href="/booking"
				class="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
			>
				Попробовать снова
			</a>
			<a
				href="/"
				class="rounded-lg border border-primary px-6 py-2.5 text-sm font-medium text-primary transition hover:bg-primary hover:text-primary-foreground"
			>
				На главную
			</a>
		</div>
	</div>
</div>

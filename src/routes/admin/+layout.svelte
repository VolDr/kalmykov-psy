<script lang="ts">
	import type { LayoutData } from './$types';
	import Button from '$lib/components/ui/Button.svelte';

	let { data, children }: { data: LayoutData; children: any } = $props();

	async function handleLogout() {
		await fetch('/logout', { method: 'POST' });
		window.location.href = '/login';
	}
</script>

<div class="flex min-h-screen flex-col">
	<!-- Header with navigation and logout -->
	<header class="flex items-center justify-between border-b bg-white px-6 py-3">
		<div class="flex items-center gap-6">
			<nav class="flex gap-6">
				<a
					href="/admin/manage-records"
					class="text-sm font-medium text-gray-700 hover:text-gray-900"
				>
					Записи
				</a>
				<a href="/admin/articles" class="text-sm font-medium text-gray-700 hover:text-gray-900">
					Статьи
				</a>
				<a href="/admin/availability" class="text-sm font-medium text-gray-700 hover:text-gray-900">
					Расписание
				</a>
				<a href="/admin/bookings" class="text-sm font-medium text-gray-700 hover:text-gray-900">
					Бронирования
				</a>
				<a href="/admin/payments" class="text-sm font-medium text-gray-700 hover:text-gray-900">
					Платежи
				</a>
				<a href="/admin/analytics" class="text-sm font-medium text-gray-700 hover:text-gray-900">
					Воронки
				</a>
				<a href="/admin/quizzes" class="text-sm font-medium text-gray-700 hover:text-gray-900">
					Викторины
				</a>
				<a href="/admin/bot/contacts" class="text-sm font-medium text-gray-700 hover:text-gray-900">
					Бот
				</a>
			</nav>
			<a
				href="/admin/record"
				class="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M5 12h14" />
					<path d="M12 5v14" />
				</svg>
				Добавить запись
			</a>
		</div>
		<Button onclick={handleLogout} variant="outline">Выйти</Button>
	</header>

	<div class="flex flex-1">
		<!-- Sidebar with clients list -->
		<aside class="w-64 border-r bg-gray-50 p-4">
			<div class="mb-6">
				<h2 class="mb-2 text-lg font-semibold">Управление</h2>
				<nav class="space-y-1">
					<a href="/admin/articles" class="block rounded-lg px-3 py-2 text-sm hover:bg-gray-100">
						Статьи
					</a>
					<a href="/admin/availability" class="block rounded-lg px-3 py-2 text-sm hover:bg-gray-100">
						Расписание
					</a>
					<a href="/admin/bookings" class="block rounded-lg px-3 py-2 text-sm hover:bg-gray-100">
						Бронирования
					</a>
					<a href="/admin/payments" class="block rounded-lg px-3 py-2 text-sm hover:bg-gray-100">
						Платежи
					</a>
					<a href="/admin/analytics" class="block rounded-lg px-3 py-2 text-sm hover:bg-gray-100">
						Воронки
					</a>
					<a href="/admin/quizzes" class="block rounded-lg px-3 py-2 text-sm hover:bg-gray-100">
						Викторины
					</a>
					<a href="/admin/bot/contacts" class="block rounded-lg px-3 py-2 text-sm hover:bg-gray-100">
						Бот
					</a>
				</nav>
			</div>

			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold">Клиенты</h2>
				<a href="/admin/manage-records" class="text-sm text-blue-600 hover:underline">Всё</a>
			</div>
			<nav class="space-y-1">
				{#each data.clients as client}
					<a
						href="/admin/profile?clientId={client.id}"
						class="block rounded-lg px-3 py-2 text-sm hover:bg-gray-100"
					>
						{client.nick || client.name}
					</a>
				{/each}
			</nav>
		</aside>

		<!-- Main content -->
		<main class="flex-1">
			{@render children()}
		</main>
	</div>
</div>

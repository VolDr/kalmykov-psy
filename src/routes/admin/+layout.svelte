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
		<nav class="flex gap-6">
			<a href="/admin/manage-records" class="text-sm font-medium text-gray-700 hover:text-gray-900">
				Записи
			</a>
			<a href="/admin/articles" class="text-sm font-medium text-gray-700 hover:text-gray-900">
				Статьи
			</a>
			<a href="/admin/surveys" class="text-sm font-medium text-gray-700 hover:text-gray-900">
				Опросники
			</a>
			<a href="/admin/pages" class="text-sm font-medium text-gray-700 hover:text-gray-900">
				Страницы
			</a>
		</nav>
		<Button onclick={handleLogout} variant="outline">Выйти</Button>
	</header>

	<div class="flex flex-1">
		<!-- Sidebar with clients list -->
		<aside class="w-64 border-r bg-gray-50 p-4">
			<div class="mb-6">
				<h2 class="mb-2 text-lg font-semibold">Управление</h2>
				<nav class="space-y-1">
					<a
						href="/admin/articles"
						class="block rounded-lg px-3 py-2 text-sm hover:bg-gray-100"
					>
						Статьи
					</a>
					<a
						href="/admin/surveys"
						class="block rounded-lg px-3 py-2 text-sm hover:bg-gray-100"
					>
						Опросники
					</a>
					<a
						href="/admin/pages"
						class="block rounded-lg px-3 py-2 text-sm hover:bg-gray-100"
					>
						Страницы
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
						{client.name}
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

<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import UsernameInput from './UsernameInput.svelte';
	import PasswordInput from './PasswordInput.svelte';
	import Submit from './Submit.svelte';

	import Button from '$lib/components/ui/Button.svelte';

	let { form }: { form: ActionData } = $props();
	let isSubmitting = $state(false);
	let clickCount = $state(0);
	let isActivated = $state(false);

	function handleIconClick() {
		clickCount++;
		if (clickCount === 3) {
			isActivated = true;
		}
	}
</script>

<svelte:head>
	<title>Страница не найдена</title>
	<meta name="robots" content="noindex" />
</svelte:head>

{#if !isActivated}
	<div class="flex min-h-screen flex-col items-center justify-center gap-10 px-4 text-center">
		<button
			type="button"
			onclick={handleIconClick}
			class="outline-none"
			aria-label="Иконка компаса"
		>
			<span class="icon-[lucide--compass] h-8 w-8 text-[#B8A98A]"></span>
		</button>

		<h1 class="select-none">Страница не найдена</h1>

		<p class="max-w-md text-lg leading-relaxed">Такой страницы нет!</p>

		<div class="flex items-center gap-3">
			<Button href="/" rel="noopener noreferrer" class="max-w-[250px]">На главную</Button>
		</div>
	</div>
{:else}
	<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
		<div class="w-full max-w-md">
			<form
				method="POST"
				use:enhance={() => {
					isSubmitting = true;
					return async ({ update }) => {
						await update();
						isSubmitting = false;
					};
				}}
				class="flex flex-col gap-4 rounded-lg bg-white p-8 shadow-sm"
			>
				<UsernameInput error={form?.errors?.username} value={form?.username} {isSubmitting} />
				<PasswordInput error={form?.errors?.password} {isSubmitting} />
				<Submit {isSubmitting} />
			</form>
		</div>
	</div>
{/if}

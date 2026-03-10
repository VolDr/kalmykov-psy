<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { toast } from 'svelte-sonner';
	import NameInput from './NameInput.svelte';
	import NickInput from './NickInput.svelte';
	import SourceInput from './SourceInput.svelte';
	import GenderInput from './GenderInput.svelte';
	import InvocationInput from './InvocationInput.svelte';
	import DescriptionInput from './DescriptionInput.svelte';
	import ContactsManager from './ContactsManager.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let formData = $state({
		name: data.client.name,
		nick: data.client.nick ?? '',
		source: data.client.source ?? '',
		gender: data.client.gender ?? '',
		invocation: data.client.invocation ?? '',
		description: data.client.description ?? ''
	});

	let isSubmitting = $state(false);
	let errors = $state<Record<string, string>>({});
</script>

<svelte:head>
	<title>Редактирование профиля</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="mx-auto max-w-5xl p-6">
	<form
		method="POST"
		action="?/updateProfile"
		use:enhance={() => {
			isSubmitting = true;
			return async ({ result, update }) => {
				isSubmitting = false;
				if (result.type === 'success') {
					toast.success(`Профиль ${formData.nick || formData.name} обновлен`);
					await update();
					// Close the page and navigate back to profile
					const clientId = result.data?.clientId || data.client.id;
					goto(`/admin/profile?clientId=${clientId}`);
				} else if (result.type === 'failure') {
					toast.error(result.data?.error || 'Ошибка при сохранении');
					errors = result.data?.errors || {};
				}
			};
		}}
	>
		<Card.Root>
			<Card.Header>
				<div class="flex items-start justify-between">
					<div>
						<Card.Title class="text-xl">Редактирование профиля</Card.Title>
						<Card.Description>{data.client.nick ?? data.client.name}</Card.Description>
					</div>
					<div class="flex gap-3">
						<Button
							type="button"
							variant="outline"
							onclick={() => goto(`/admin/profile?clientId=${data.client.id}`)}
						>
							Отмена
						</Button>
						<Button type="submit" disabled={isSubmitting}>
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
								class="mr-2"
							>
								<polyline points="20 6 9 17 4 12" />
							</svg>
							{isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
						</Button>
					</div>
				</div>
			</Card.Header>

			<Card.Content>
				<input type="hidden" name="clientId" value={data.client.id} />

				<div class="space-y-6">
					<div>
						<h3 class="mb-4 text-lg font-semibold">Основная информация</h3>
						<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
							<NameInput bind:name={formData.name} error={errors.name} />
							<NickInput bind:nick={formData.nick} error={errors.nick} />
						</div>
						<div class="mt-4">
							<DescriptionInput
								bind:description={formData.description}
								error={errors.description}
							/>
						</div>
					</div>

					<div>
						<h3 class="mb-4 text-lg font-semibold">Дополнительно</h3>
						<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
							<SourceInput
								bind:source={formData.source}
								sources={data.sources}
								error={errors.source}
							/>
							<InvocationInput bind:invocation={formData.invocation} error={errors.invocation} />
							<GenderInput bind:gender={formData.gender} error={errors.gender} />
						</div>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</form>

	<Card.Root class="mt-4">
		<Card.Content class="pt-6">
			<ContactsManager
				contacts={data.contacts}
				clientId={data.client.id}
				contactTypes={data.contactTypes}
			/>
		</Card.Content>
	</Card.Root>
</div>

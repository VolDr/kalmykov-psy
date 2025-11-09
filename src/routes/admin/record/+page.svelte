<script lang="ts">
	import type { PageData } from './$types';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Switch } from '$lib/components/ui/switch';
	import { Label } from '$lib/components/ui/label';
	import { enhance } from '$app/forms';
	import SourceInput from './SourceInput.svelte';
	import InvocationInput from './InvocationInput.svelte';
	import GenderInput from './GenderInput.svelte';
	import DateTimePicker from './DateTimePicker.svelte';

	let { data }: { data: PageData } = $props();

	let isNewClient = $state(data.initialClientId === undefined);
	let notPhone = $state(false);
	let isSubmitting = $state(false);

	const {
		suggestedNames,
		suggestedSources,
		initialDate,
		initialClientId,
		description,
		editActivityId,
		contact,
		gender: initialGender,
		invocation: initialInvocation
	} = data;

	let source = $state('');
	let invocation = $state(initialInvocation || '');
	let gender = $state(initialGender || '');

	let dateTimeValue = $state(
		initialDate
			? initialDate.replace(/(\d{2})-(\d{2})-(\d{4})-(\d{2})-(\d{2})/, '$3-$2-$1T$4:$5')
			: ''
	);
</script>

<div class="container mx-auto p-4 max-w-2xl">
	<Card class="p-6 mb-4">
		<form
			method="POST"
			use:enhance={() => {
				isSubmitting = true;
				return async ({ update }) => {
					await update();
					isSubmitting = false;
				};
			}}
		>
			{#if initialClientId === undefined}
				<div class="mb-4 flex items-center space-x-2">
					<Switch id="isNewClient" name="isNewClient" bind:checked={isNewClient} />
					<Label for="isNewClient" class="cursor-pointer">Новый пользователь</Label>
				</div>
			{/if}

			<div class="mb-4">
				<label for="name" class="block mb-2">Имя *</label>
				{#if isNewClient}
					<input
						type="text"
						id="name"
						name="name"
						class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
						required
					/>
				{:else}
					<select id="name" name="clientId" class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" required>
						<option value="">Выберите клиента</option>
						{#each suggestedNames as client}
							<option value={client.id} selected={client.id === initialClientId}>
								{client.value}
							</option>
						{/each}
					</select>
					{#if initialClientId && contact}
						<p class="mt-2 text-sm text-gray-600">
							{suggestedNames.find((n) => n.id === initialClientId)?.nick ||
								suggestedNames.find((n) => n.id === initialClientId)?.value}
							{contact}
						</p>
					{/if}
				{/if}
			</div>

			<div class="mb-4">
				<label for="timestamp" class="block mb-2">Дата и время *</label>
				<DateTimePicker bind:value={dateTimeValue} />
				<input type="hidden" name="timestamp" value={dateTimeValue} required />
			</div>

			{#if isNewClient}
				<div class="mb-4">
					<SourceInput bind:source sources={suggestedSources} />
				</div>

				<div class="mb-4 flex items-center space-x-2">
					<Switch id="notPhone" bind:checked={notPhone} />
					<Label for="notPhone" class="cursor-pointer">Не знаю номер</Label>
				</div>

				<div class="mb-4">
					<label for="phone" class="block mb-2">{notPhone ? 'Телеграм' : 'Номер телефона'} *</label>
					<input
						type="text"
						id="phone"
						name="phone"
						placeholder={notPhone ? 'Телеграм' : '+7 (900) 000-0000'}
						class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
						required
					/>
				</div>

				<div class="mb-4">
					<InvocationInput bind:invocation />
				</div>

				<div class="mb-4">
					<GenderInput bind:gender />
				</div>
			{/if}

			<div class="mb-4">
				<label for="description" class="block mb-2">Информация</label>
				<textarea
					id="description"
					name="description"
					value={description || ''}
					class="w-full border rounded px-3 py-2 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
				></textarea>
			</div>

			{#if editActivityId}
				<input type="hidden" name="editActivityId" value={editActivityId} />
			{/if}

			<div class="flex gap-3">
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting
						? 'Подождите...'
						: editActivityId
							? 'Обновить запись'
							: 'Добавить запись'}
				</Button>

				{#if editActivityId}
					<Button
						type="submit"
						name="intent"
						value="delete"
						variant="destructive"
						disabled={isSubmitting}
						onclick={(e) => {
							if (!confirm('Вы уверены, что хотите удалить эту запись?')) {
								e.preventDefault();
							}
						}}
					>
						Удалить
					</Button>
				{/if}
			</div>
		</form>
	</Card>

	<Card class="p-6">
		<Button onclick={() => (window.location.href = '/admin/manage-records')}>Назад</Button>
	</Card>
</div>

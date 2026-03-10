<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Button } from '$lib/components/ui/button';
	import AdminFeedback from '$lib/components/AdminFeedback.svelte';
	import Feedback from '$lib/components/Feedback.svelte';
	import CurrentState from '$lib/components/CurrentState.svelte';

	let { data, form } = $props();

	const client = data?.feedback?.client ?? data.currentState?.client;
	const datetime = data?.currentState?.datetime ?? data?.feedback?.datetime;
	let clientData = data?.feedback?.smallClientData ?? data.currentState?.smallClientData;

	const feedback = data.feedback;
	const currentState = data?.currentState;

	let checked = $state(false);
	let submitting = $state(false);

	if (client) {
		clientData = client;
	}

	const appeal =
		clientData?.invocation !== undefined
			? clientData.invocation === 'ты'
				? 'singular'
				: 'plural'
			: 'plural';
	const gender =
		clientData?.gender !== undefined ? (clientData.gender === 'ж' ? 'female' : 'male') : 'male';

	$effect(() => {
		if (form?.success && form?.message) {
			toast(form.message);
		}
	});
</script>

<svelte:head>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

{#if feedback}
	<div class="mx-auto text-base sm:text-lg md:text-xl lg:text-2xl">
		{#if client && datetime}
			<AdminFeedback {client} {datetime} />
		{/if}

		<form
			method="post"
			action="?/send_feedback"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update({ reset: false });
					await invalidateAll();
				};
			}}
		>
			<input type="hidden" name="smallId" value={feedback?.smallId ?? currentState?.smallId} />
			<input type="hidden" name="sendingType" value="feedback" />

			<Feedback
				{appeal}
				{gender}
				editable={feedback.editable && !client && !submitting}
				data={feedback}
			/>

			{#if client}
				<div class="flex items-center justify-center">
					<div class="flex flex-col flex-nowrap items-center justify-center gap-6">
						<Checkbox bind:checked aria-label="Подтверждение действия" />
						<Button
							name="actionType"
							value={feedback?.editable || currentState?.editable ? 'disable' : 'enable'}
							type="submit"
							disabled={!checked}
						>
							{#snippet children()}
								{feedback?.editable || currentState?.editable
									? 'Отключить редактирование'
									: 'Включить редактирование'}
							{/snippet}
						</Button>

						<Button
							name="actionType"
							value={feedback?.disabled || currentState?.disabled ? 'on' : 'off'}
							type="submit"
							disabled={!checked}
						>
							{#snippet children()}
								{feedback?.disabled || currentState?.disabled ? 'Открыть форму' : 'Скрыть форму'}
							{/snippet}
						</Button>
					</div>
				</div>
			{/if}
		</form>
	</div>
{:else if currentState}
	<div class="mx-auto text-base sm:text-lg md:text-xl lg:text-2xl">
		{#if client && datetime}
			<AdminFeedback {client} {datetime} />
		{/if}

		<form
			method="post"
			action="?/send_current_state"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update({ reset: false });
					await invalidateAll();
				};
			}}
		>
			<input type="hidden" name="smallId" value={currentState.smallId} />
			<input type="hidden" name="sendingType" value="currentState" />

			<CurrentState
				editable={currentState.editable && !client && !submitting}
				data={currentState}
				{appeal}
			/>

			{#if client}
				<div class="flex items-center justify-center">
					<div class="flex flex-col flex-nowrap items-center justify-center gap-6">
						<Checkbox bind:checked aria-label="Подтверждение действия" />
						<Button
							name="actionType"
							value={currentState.editable ? 'disable' : 'enable'}
							type="submit"
							disabled={!checked}
						>
							{#snippet children()}
								{currentState.editable ? 'Отключить редактирование' : 'Включить редактирование'}
							{/snippet}
						</Button>

						<Button
							name="actionType"
							value={currentState.disabled ? 'on' : 'off'}
							type="submit"
							disabled={!checked}
						>
							{#snippet children()}
								{currentState.disabled ? 'Открыть форму' : 'Скрыть форму'}
							{/snippet}
						</Button>
					</div>
				</div>
			{/if}
		</form>
	</div>
{/if}

<script lang="ts">
	import type { PageData } from './$types';
	import { Card } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import CurrentStateChart from './CurrentStateChart.svelte';
	import CurrentStateTable from './CurrentStateTable.svelte';
	import FeedbackChart from './FeedbackChart.svelte';
	import FeedbackTable from './FeedbackTable.svelte';
	import RecordTable from '../manage-records/RecordTable.svelte';

	let { data }: { data: PageData } = $props();
	console.log(data);
</script>

<svelte:head>
	<title>Профиль клиента - Административная панель</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="container mx-auto max-w-7xl p-4">
	<div class="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Header Card -->
		<Card class="p-6 shadow-sm lg:col-span-1">
			<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div class="flex-1">
					<h1 class="mb-2 text-2xl font-semibold">
						{data.clientData?.nick ?? data.clientData?.name}
					</h1>
					{#if data.clientData?.nick}
						<p class="text-sm text-muted-foreground">{data.clientData?.name}</p>
					{/if}
				</div>
				<a href="/admin/edit-profile?clientId={data.clientData?.id}">
					<Button variant="outline">
						<span class="icon-[lucide--edit] h-4 w-4"></span>
						Редактировать
					</Button>
				</a>
			</div>

			<div class="mt-6 space-y-4">
				<h2 class="text-sm font-medium tracking-wide text-muted-foreground uppercase">
					Основная информация
				</h2>

				<div class="flex flex-wrap gap-2">
					{#if data.clientData?.gender}
						<Badge variant="outline" class="border-primary/20 bg-primary/10">
							Пол: {data.clientData.gender}
						</Badge>
					{/if}
					{#if data.clientData?.invocation}
						<Badge variant="outline" class="border-primary/20 bg-primary/10">
							{data.clientData.invocation}
						</Badge>
					{/if}
				</div>

				{#if data.contacts && data.contacts.length > 0}
					<div class="space-y-2">
						<p class="text-sm font-medium text-muted-foreground">Контакты</p>
						<div class="flex flex-wrap gap-2">
							{#each data.contacts as contact}
								{@const isTelegram = contact.contactType?.name?.toLowerCase().includes('telegram')}
								{@const cleanUsername = isTelegram
									? contact.value.replace(/^@/, '')
									: contact.value}
								{@const isHttpsLink = !isTelegram && contact.value.startsWith('https://')}
								{#if isTelegram}
									<a href="https://t.me/{cleanUsername}" target="_blank" rel="noopener noreferrer">
										<Badge
											variant="outline"
											class="cursor-pointer border-primary/20 bg-primary/10 transition-colors hover:bg-primary/20"
										>
											{contact.contactType?.name}: @{cleanUsername}
										</Badge>
									</a>
								{:else if isHttpsLink}
									<a href={contact.value} target="_blank" rel="noopener noreferrer">
										<Badge
											variant="outline"
											class="cursor-pointer border-primary/20 bg-primary/10 transition-colors hover:bg-primary/20"
										>
											{contact.contactType?.name}: {contact.value}
										</Badge>
									</a>
								{:else}
									<Badge variant="outline" class="border-primary/20 bg-primary/10">
										{contact.contactType?.name}: {contact.value}
									</Badge>
								{/if}
							{/each}
						</div>
					</div>
				{/if}

				{#if data.clientData?.source}
					<div class="space-y-1">
						<p class="text-sm font-medium text-muted-foreground">Источник</p>
						<p class="text-sm font-medium">{data.clientData.source.name}</p>
					</div>
				{/if}
			</div>
		</Card>

		<!-- Records Table -->
		<Card class="max-h-[500px] p-6 shadow-sm lg:col-span-2">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold">Все записи</h2>
				<a href="/admin/record?clientId={data.clientData?.id}">
					<Button>
						<span class="icon-[lucide--plus] h-4 w-4"></span>
						Добавить запись
					</Button>
				</a>
			</div>
			<div class="max-h-[600px] overflow-y-auto">
				<RecordTable
					currentDate={undefined}
					activities={data.activities}
					showProfileButton={false}
					showName={false}
				/>
			</div>
		</Card>
	</div>

	<!-- Charts Grid -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<Card class="p-6 shadow-sm">
			<h2 class="mb-6 text-lg font-semibold">Самочувствие</h2>
			<CurrentStateChart currentState={data.currentState} />
			<CurrentStateTable currentState={data.currentState} />
		</Card>

		<Card class="p-6 shadow-sm">
			<h2 class="mb-6 text-lg font-semibold">Обратная связь</h2>
			<FeedbackChart feedback={data.feedback} />
			<FeedbackTable feedback={data.feedback} />
		</Card>
	</div>
</div>

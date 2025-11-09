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
	console.log(data)
</script>

<svelte:head>
	<title>Профиль клиента - Административная панель</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="container mx-auto p-4 max-w-7xl ">
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 ">
		<!-- Header Card -->
		<Card class="p-6 shadow-sm lg:col-span-1">
			<div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
				<div class="flex-1">
					<h1 class="text-2xl font-semibold mb-2">
						{data.clientData?.nick ?? data.clientData?.name}
					</h1>
					{#if data.clientData?.nick}
						<p class="text-sm text-muted-foreground">{data.clientData?.name}</p>
					{/if}
				</div>
				<a href="/admin/edit-profile?clientId={data.clientData?.id}">
					<Button variant="outline">
						<span class="icon-[lucide--edit] w-4 h-4"></span>
						Редактировать
					</Button>
				</a>
			</div>

			<div class="mt-6 space-y-4">
				<h2 class="text-sm font-medium text-muted-foreground uppercase tracking-wide">
					Основная информация
				</h2>

				<div class="flex gap-2 flex-wrap">
					{#if data.clientData?.gender}
						<Badge variant="outline" class="bg-primary/10 border-primary/20">
							Пол: {data.clientData.gender}
						</Badge>
					{/if}
					{#if data.clientData?.invocation}
						<Badge variant="outline" class="bg-primary/10 border-primary/20">
							{data.clientData.invocation}
						</Badge>
					{/if}
				</div>

				{#if data.contacts && data.contacts.length > 0}
					<div class="space-y-2">
						<p class="text-sm font-medium text-muted-foreground">Контакты</p>
						<div class="flex gap-2 flex-wrap">
							{#each data.contacts as contact}
								{@const isTelegram = contact.contactType?.name?.toLowerCase().includes('telegram')}
								{@const cleanUsername = isTelegram ? contact.value.replace(/^@/, '') : contact.value}
								{@const isHttpsLink = !isTelegram && contact.value.startsWith('https://')}
								{#if isTelegram}
									<a href="https://t.me/{cleanUsername}" target="_blank" rel="noopener noreferrer">
										<Badge variant="outline" class="bg-primary/10 border-primary/20 hover:bg-primary/20 transition-colors cursor-pointer">
											{contact.contactType?.name}: @{cleanUsername}
										</Badge>
									</a>
								{:else if isHttpsLink}
									<a href={contact.value} target="_blank" rel="noopener noreferrer">
										<Badge variant="outline" class="bg-primary/10 border-primary/20 hover:bg-primary/20 transition-colors cursor-pointer">
											{contact.contactType?.name}: {contact.value}
										</Badge>
									</a>
								{:else}
									<Badge variant="outline" class="bg-primary/10 border-primary/20">
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
		<Card class="p-6 shadow-sm lg:col-span-2 max-h-[500px]">
			<div class="flex justify-between items-center mb-4">
				<h2 class="text-lg font-semibold">Все записи</h2>
				<a href="/admin/record?clientId={data.clientData?.id}">
					<Button>
						<span class="icon-[lucide--plus] w-4 h-4"></span>
						Добавить запись
					</Button>
				</a>
			</div>
			<div class="max-h-[600px] overflow-y-auto">
				<RecordTable currentDate={undefined} activities={data.activities} showProfileButton={false} showName={false} />
			</div>
		</Card>
	</div>

	<!-- Charts Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<Card class="p-6 shadow-sm">
			<h2 class="text-lg font-semibold mb-6">Самочувствие</h2>
			<CurrentStateChart currentState={data.currentState} />
			<CurrentStateTable currentState={data.currentState} />
		</Card>

		<Card class="p-6 shadow-sm">
			<h2 class="text-lg font-semibold mb-6">Обратная связь</h2>
			<FeedbackChart feedback={data.feedback} />
			<FeedbackTable feedback={data.feedback} />
		</Card>
	</div>
</div>

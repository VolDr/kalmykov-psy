<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';

	interface Contact {
		id: string;
		value: string;
		contactType?: {
			name: string;
		};
	}

	let {
		contacts = [],
		clientId,
		contactTypes = []
	}: {
		contacts: Contact[];
		clientId: string;
		contactTypes: string[];
	} = $props();

	let editingContacts = $state<
		Array<{
			id?: string;
			value: string;
			type: string;
			isNew?: boolean;
			isDirty?: boolean;
		}>
	>(
		contacts.map((c) => ({
			id: c.id,
			value: c.value,
			type: c.contactType?.name || '',
			isNew: false,
			isDirty: false
		}))
	);

	let deleteModalOpen = $state(false);
	let contactToDelete = $state<{ id?: string; index: number } | null>(null);
	let isSubmitting = $state(false);
	let activeTypeIndex = $state<number | null>(null);

	const suggestedTypes = ['phone', 'telegram', 'email', 'whatsapp', 'viber'];

	function handleAddContact() {
		editingContacts = [...editingContacts, { value: '', type: '', isNew: true, isDirty: true }];
	}

	function handleRemoveContact(index: number) {
		const contact = editingContacts[index];
		if (contact.id) {
			contactToDelete = { id: contact.id, index };
			deleteModalOpen = true;
		} else {
			editingContacts = editingContacts.filter((_, i) => i !== index);
		}
	}

	function confirmDelete() {
		if (contactToDelete?.id) {
			const form = document.createElement('form');
			form.method = 'POST';
			form.action = '?/deleteContact';

			const contactIdInput = document.createElement('input');
			contactIdInput.type = 'hidden';
			contactIdInput.name = 'contactId';
			contactIdInput.value = contactToDelete.id;
			form.appendChild(contactIdInput);

			document.body.appendChild(form);
			form.submit();
		} else if (contactToDelete) {
			editingContacts = editingContacts.filter((_, i) => i !== contactToDelete.index);
		}
		deleteModalOpen = false;
		contactToDelete = null;
	}

	function handleContactChange(index: number, field: 'value' | 'type', value: string) {
		editingContacts[index] = { ...editingContacts[index], [field]: value, isDirty: true };
	}

	function getFilteredTypes(typeValue: string) {
		const allTypes = [...new Set([...suggestedTypes, ...contactTypes])];
		return allTypes.filter((t) => t.toLowerCase().includes(typeValue.toLowerCase()));
	}

	function selectType(index: number, type: string) {
		handleContactChange(index, 'type', type);
		activeTypeIndex = null;
	}
</script>

<div class="space-y-6">
	<div class="flex items-start justify-between">
		<div>
			<h3 class="text-lg font-semibold">Контакты</h3>
			<p class="text-sm text-muted-foreground">Управление контактами клиента</p>
		</div>
		<Button type="button" variant="outline" onclick={handleAddContact}>
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
				<path d="M5 12h14" />
				<path d="M12 5v14" />
			</svg>
			Добавить контакт
		</Button>
	</div>

	<Separator />

	{#if editingContacts.length === 0}
		<p class="py-12 text-center text-muted-foreground">
			Контакты отсутствуют. Добавьте новый контакт.
		</p>
	{:else}
		<div class="space-y-4">
			{#each editingContacts as contact, index (contact.id || index)}
				<div class="flex items-end gap-3">
					<div class="relative w-40 space-y-2">
						<label for="type-{index}" class="text-sm font-medium">Тип</label>
						<Input
							id="type-{index}"
							bind:value={contact.type}
							placeholder="Тип контакта"
							oninput={(e) => handleContactChange(index, 'type', e.currentTarget.value)}
							onfocus={() => (activeTypeIndex = index)}
							onblur={() => setTimeout(() => (activeTypeIndex = null), 200)}
						/>
						{#if activeTypeIndex === index && contact.type && getFilteredTypes(contact.type).length > 0}
							<div
								class="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md"
							>
								{#each getFilteredTypes(contact.type) as typeOption}
									<button
										type="button"
										class="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
										onclick={() => selectType(index, typeOption)}
									>
										{typeOption}
									</button>
								{/each}
							</div>
						{/if}
					</div>

					<div class="flex-1 space-y-2">
						<label for="value-{index}" class="text-sm font-medium">Значение</label>
						<div class="relative">
							<Input
								id="value-{index}"
								bind:value={contact.value}
								placeholder="Введите контакт"
								oninput={(e) => handleContactChange(index, 'value', e.currentTarget.value)}
							/>
							<div class="absolute top-1/2 right-3 -translate-y-1/2">
								{#if contact.isDirty}
									<Badge variant="outline" class="bg-yellow-50 text-yellow-700">Не сохранено</Badge>
								{:else if !contact.isNew}
									<Badge variant="outline" class="bg-green-50 text-green-700">Сохранено</Badge>
								{/if}
							</div>
						</div>
					</div>

					<form
						method="POST"
						action={contact.isNew ? '?/addContact' : '?/updateContact'}
						use:enhance={() => {
							isSubmitting = true;
							return async ({ result, update }) => {
								isSubmitting = false;
								if (result.type === 'success') {
									toast.success('Контакт сохранен');
									editingContacts[index].isDirty = false;
									await update();
								} else {
									toast.error('Ошибка при сохранении контакта');
								}
							};
						}}
					>
						<input type="hidden" name="clientId" value={clientId} />
						{#if !contact.isNew && contact.id}
							<input type="hidden" name="contactId" value={contact.id} />
						{/if}
						<input type="hidden" name="value" value={contact.value} />
						<input type="hidden" name="type" value={contact.type} />

						<Button
							type="submit"
							variant={contact.isDirty ? 'default' : 'outline'}
							disabled={!contact.value.trim() || isSubmitting}
						>
							Сохранить
						</Button>
					</form>

					<Button
						type="button"
						variant="outline"
						size="icon"
						onclick={() => handleRemoveContact(index)}
						disabled={isSubmitting}
						class="hover:text-destructive-foreground text-destructive hover:bg-destructive"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M3 6h18" />
							<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
							<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
						</svg>
					</Button>
				</div>
			{/each}
		</div>
	{/if}
</div>

<Dialog.Root bind:open={deleteModalOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Подтверждение удаления</Dialog.Title>
			<Dialog.Description>Вы уверены, что хотите удалить этот контакт?</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (deleteModalOpen = false)}>Отмена</Button>
			<Button variant="destructive" onclick={confirmDelete}>Удалить</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

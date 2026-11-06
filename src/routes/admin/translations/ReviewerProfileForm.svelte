<script lang="ts">
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';
	import ReviewerAvatar from '#lib/components/translate/ReviewerAvatar.svelte';
	import type { ReconciliationProfile } from '#lib/data/translation-reconciliation.js';
	let {
		sourceId,
		reviewId,
		slot,
		profile
	}: { sourceId: number; reviewId: number; slot: number; profile: ReconciliationProfile } =
		$props();
	let name = $state(untrack(() => profile.name));
	let avatar = $state(untrack(() => profile.avatar));
	let problem = $state('');
	let busy = $state(false);
	let saving = $state(false);
	let saved = $state(false);
	const dirty = $derived(name !== profile.name || avatar !== profile.avatar);
	async function upload(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		problem = '';
		busy = true;
		saved = false;
		let image: ImageBitmap | undefined;
		try {
			if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 10_000_000)
				throw new Error('Выберите PNG, JPEG или WebP до 10 МБ');
			image = await createImageBitmap(file);
			const canvas = document.createElement('canvas');
			canvas.width = 192;
			canvas.height = 192;
			const context = canvas.getContext('2d');
			if (!context) throw new Error('Браузер не смог обработать картинку');
			const side = Math.min(image.width, image.height);
			context.drawImage(
				image,
				(image.width - side) / 2,
				(image.height - side) / 2,
				side,
				side,
				0,
				0,
				192,
				192
			);
			const resized = canvas.toDataURL('image/webp', 0.85);
			if (resized.length > 240_000) throw new Error('Изображение слишком большое');
			avatar = resized;
		} catch (error) {
			problem = (error as Error).message;
		} finally {
			image?.close();
			busy = false;
			input.value = '';
		}
	}
</script>

<form
	method="POST"
	action={`?id=${sourceId}&review=${reviewId}&/profile`}
	use:enhance={() => {
		saving = true;
		saved = false;
		return async ({ result, update }) => {
			saving = false;
			saved = result.type === 'success';
			await update({ reset: false });
		};
	}}
	class="space-y-3"
>
	<input type="hidden" name="sourceId" value={sourceId} /><input
		type="hidden"
		name="reviewId"
		value={reviewId}
	/><input type="hidden" name="slot" value={slot} /><input
		type="hidden"
		name="avatar"
		value={avatar}
	/>
	<div class="flex items-center gap-3">
		<ReviewerAvatar profile={{ name, avatar }} size="large" /><label class="min-w-0 flex-1 text-sm"
			>Имя участника<input
				name="profileName"
				bind:value={name}
				required
				maxlength="80"
				class="mt-1 block min-h-11 w-full rounded-lg border border-border bg-card px-3 py-2"
			/></label
		>
	</div>
	<label class="block text-sm"
		>Аватарка<input
			type="file"
			accept="image/png,image/jpeg,image/webp"
			onchange={upload}
			disabled={busy || saving}
			class="mt-1 block w-full text-sm file:mr-3 file:min-h-11 file:rounded-lg file:border file:border-border file:bg-card file:px-3"
		/></label
	>
	<div class="flex flex-wrap items-center gap-3">
		<button
			type="submit"
			disabled={busy || saving}
			class="min-h-11 rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-50"
			>{saving ? 'Сохраняем…' : 'Сохранить участника'}</button
		>{#if avatar}<button
				type="button"
				onclick={() => {
					avatar = '';
					saved = false;
				}}
				class="min-h-11 text-sm underline">Убрать аватарку</button
			>{/if}{#if saved && !dirty}<span role="status" class="text-sm text-muted-foreground">Сохранено</span
			>{/if}
	</div>
	{#if problem}<p role="alert" class="text-sm text-destructive">{problem}</p>{/if}
	{#if dirty && !saving}<p role="status" class="text-sm text-muted-foreground">Изменения участника ещё не сохранены. Нажмите «Сохранить участника».</p>{/if}
</form>

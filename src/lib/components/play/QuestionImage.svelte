<script lang="ts">
	type Props = {
		src: string;
	};

	let { src }: Props = $props();

	// Не загрузилась (удалили файл, недоступный сервер) — вопрос остаётся без картинки
	let failed = $state(false);
</script>

<!-- Место зарезервировано заранее: пока картинка грузится, кнопки ответов не должны «уезжать» -->
{#if !failed}
	<div class="aspect-video max-h-[min(16rem,35vh)] w-full overflow-hidden rounded-xl bg-muted">
		<img
			{src}
			alt="Иллюстрация к вопросу"
			referrerpolicy="no-referrer"
			decoding="async"
			onerror={() => (failed = true)}
			class="h-full w-full object-contain"
		/>
	</div>
{/if}

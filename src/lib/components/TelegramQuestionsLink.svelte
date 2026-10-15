<script lang="ts">
	import { cn } from '$lib/utils';

	let { class: className = '' }: { class?: string } = $props();
</script>

<p class={cn('text-[14px] leading-relaxed text-foreground/60', className)}>
	Остались вопросы?
	<a
		href="https://t.me/m/jyiUHHmIMzYy"
		target="_blank"
		rel="noopener noreferrer"
		class="font-semibold text-navy underline decoration-primary decoration-2 underline-offset-2 transition-colors hover:text-primary"
	>
		Напишите мне в телеграм
	</a>
</p>

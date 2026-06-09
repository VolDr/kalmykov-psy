<!--
  Заменяет: src/lib/components/questionnaire/WarningBox.svelte
  Дизайн: тёплая карточка (bg-card), иконка в кружке, navy-заголовок.
  critical — акцент destructive, warning — золотой, info — navy. Логика/пропсы не изменены.
-->
<script lang="ts">
	import MarkdownLink from '$lib/components/MarkdownLink.svelte';
	import type { Warning } from '$lib/data/questionnaires/types';
	import { cn } from '$lib/utils';

	type Props = {
		warning: Warning;
	};

	let { warning }: Props = $props();

	const warningStyles = {
		critical: {
			iconClass: 'icon-[lucide--alert-triangle]',
			iconColor: 'text-destructive',
			iconBg: 'bg-destructive/10'
		},
		warning: {
			iconClass: 'icon-[lucide--alert-circle]',
			iconColor: 'text-primary',
			iconBg: 'bg-primary/12'
		},
		info: {
			iconClass: 'icon-[lucide--info]',
			iconColor: 'text-navy',
			iconBg: 'bg-card'
		}
	};

	const style = warningStyles[warning.type];
</script>

<div
	class="flex gap-4 rounded-2xl bg-card px-5 py-5 md:gap-5 md:px-6"
	role="alert"
>
	<span
		class={cn(
			'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
			style.iconBg
		)}
	>
		<span class={cn(style.iconClass, 'h-5 w-5', style.iconColor)}></span>
	</span>
	<div class="flex-1 space-y-1.5">
		<h3 class="text-[17px] font-bold text-navy md:text-[18px]">
			{warning.title}
		</h3>
		<div
			class="text-[15px] leading-relaxed whitespace-pre-line text-foreground/80 md:text-[16px]"
		>
			<MarkdownLink text={warning.message} />
		</div>
	</div>
</div>

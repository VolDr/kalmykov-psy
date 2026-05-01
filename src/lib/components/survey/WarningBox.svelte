<script lang="ts">
	import MarkdownLink from '$lib/components/MarkdownLink.svelte';
	import type { Warning } from '$lib/data/surveys/types';
	import { cn } from '$lib/utils';

	type Props = {
		warning: Warning;
	};

	let { warning }: Props = $props();

	const warningStyles = {
		critical: {
			iconClass: 'icon-[lucide--alert-triangle]',
			className: 'border-none bg-[#f7f5f0]'
		},
		warning: {
			iconClass: 'icon-[lucide--alert-circle]',
			className: 'border-none bg-yellow-50'
		},
		info: {
			iconClass: 'icon-[lucide--info]',
			className: 'border-none bg-[#f7f5f0]'
		}
	};

	const style = warningStyles[warning.type];
</script>

<div class={cn('rounded-lg p-4 shadow-md', style.className)} role="alert">
	<div class="flex gap-3">
		<span class={cn(style.iconClass, 'h-5 w-5 flex-shrink-0 translate-y-[2px]')}></span>
		<div class="flex-1 space-y-2">
			<h3 class="text-base font-bold text-black md:text-lg">
				{warning.title}
			</h3>
			<div class="text-sm leading-relaxed whitespace-pre-line text-black opacity-80 md:text-base">
				<MarkdownLink text={warning.message} />
			</div>
		</div>
	</div>
</div>

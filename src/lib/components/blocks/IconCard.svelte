<script lang="ts">
	import { cn } from '$lib/utils';
	import Reveal from '$lib/components/Reveal.svelte';

	interface Props {
		icon?: string;
		highlight: string;
		text: string;
		gridClass?: string;
		minHeight?: string;
		withReveal?: boolean;
		showIcon?: boolean;
	}

	let {
		icon = '',
		highlight,
		text,
		gridClass = '',
		minHeight = '180px',
		withReveal = false,
		showIcon = true
	}: Props = $props();

	const iconMap: Record<string, string> = {
		briefcase: 'icon-[lucide--briefcase]',
		'book-open': 'icon-[lucide--book-open]',
		flask: 'icon-[lucide--flask-conical]',
		compass: 'icon-[lucide--compass]',
		'trending-up': 'icon-[lucide--trending-up]',
		clock: 'icon-[lucide--clock]',
		lightbulb: 'icon-[lucide--lightbulb]'
	};

	const iconClass = icon && iconMap[icon] ? iconMap[icon] : '';
</script>

<div class={gridClass}>
	{#if withReveal}
		<Reveal axis="x" class="h-full">
			<div
				class={cn(
					'flex h-full flex-col justify-between rounded-lg bg-[#F2F0EF] p-6',
					`min-h-[${minHeight}]`
				)}
			>
				<div>
					{#if showIcon && iconClass}
						<span class="{iconClass} mb-4 h-6 w-6 text-right text-[#B8A98A]"></span>
					{/if}
					<h4 class="text-lg font-semibold text-[#191919]">{highlight}</h4>
				</div>
				<p class="leading-relaxed text-[#191919]">{text}</p>
			</div>
		</Reveal>
	{:else}
		<div
			class={cn(
				'flex h-full flex-col justify-start rounded-lg bg-[#F2F0EF] p-6',
				`min-h-[${minHeight}]`
			)}
		>
			<div>
				{#if showIcon && iconClass}
					<span class="{iconClass} mb-4 h-6 w-6 text-right text-[#B8A98A]"></span>
				{/if}
				<h4 class="text-lg font-semibold text-[#191919]">{highlight}</h4>
			</div>
			<p class="leading-relaxed text-[#191919]">{text}</p>
		</div>
	{/if}
</div>

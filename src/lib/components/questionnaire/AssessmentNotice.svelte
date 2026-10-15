<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		title: string;
		tone?: 'info' | 'warning' | 'critical';
		children: Snippet;
	};

	let { title, tone = 'info', children }: Props = $props();

	const toneClasses = {
		info: 'border-primary/60 bg-card text-foreground',
		warning: 'border-primary bg-card text-foreground',
		critical: 'border-red-300 bg-red-50 text-red-950'
	};
</script>

<section
	class={`rounded-[22px] border px-5 py-5 sm:px-7 sm:py-6 ${toneClasses[tone]}`}
	role={tone === 'critical' ? 'alert' : 'note'}
>
	<div class="flex items-start gap-4">
		<span
			class={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tone === 'critical' ? 'bg-red-100 text-red-700' : 'bg-primary/15 text-primary'}`}
			aria-hidden="true"
		>
			<span
				class={tone === 'critical'
					? 'icon-[lucide--triangle-alert] h-5 w-5'
					: 'icon-[lucide--info] h-5 w-5'}
			></span>
		</span>
		<div class="min-w-0">
			<h2 class="mb-2 text-[17px] font-bold text-current">{title}</h2>
			<div class="space-y-3 text-[15px] leading-[1.65] text-current/80 sm:text-[16px]">
				{@render children()}
			</div>
		</div>
	</div>
</section>

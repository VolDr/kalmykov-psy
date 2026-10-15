<script lang="ts">
	import { tick, type Snippet } from 'svelte';
	import Button from '$lib/components/ui/Button.svelte';

	type Props = {
		step: number;
		total: number;
		children: Snippet;
		instruction?: string;
		stepLabel?: string;
		canGoBack?: boolean;
		canGoNext?: boolean;
		onback?: () => void;
		onnext: () => void;
		nextLabel?: string;
	};

	let {
		step,
		total,
		children,
		instruction,
		stepLabel = 'Вопрос',
		canGoBack = false,
		canGoNext = false,
		onback,
		onnext,
		nextLabel = 'Далее'
	}: Props = $props();

	const progress = $derived(Math.min(100, Math.max(0, (step / Math.max(total, 1)) * 100)));
	let section = $state<HTMLElement>();
	let previousStep = $state<number>();

	$effect(() => {
		const activeStep = step;
		if (previousStep === undefined) {
			previousStep = activeStep;
			return;
		}
		if (activeStep === previousStep) return;

		previousStep = activeStep;
		void tick().then(() => {
			section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		});
	});
</script>

<section
	bind:this={section}
	class="flex scroll-mt-[72px] flex-col py-4 md:scroll-mt-[96px] md:py-6"
	aria-label={`${stepLabel} ${step} из ${total}`}
>
	<div class="mb-3 md:mb-5">
		<div
			class="mb-1.5 flex items-center justify-between text-[12px] font-semibold text-foreground/55 md:text-[13px]"
		>
			<span>{stepLabel} {step} из {total}</span>
			<span>{Math.round(progress)}%</span>
		</div>
		<div
			class="h-1.5 w-full overflow-hidden rounded-full bg-border"
			role="progressbar"
			aria-valuemin="0"
			aria-valuemax="100"
			aria-valuenow={Math.round(progress)}
		>
			<div
				class="h-full rounded-full bg-primary transition-[width] duration-300 ease-out-quart"
				style={`width: ${progress}%`}
			></div>
		</div>
	</div>

	{#if instruction}
		<p class="mb-3 text-[13px] leading-snug font-medium text-foreground/60 md:mb-4 md:text-[14px]">
			{instruction}
		</p>
	{/if}

	<div
		class="rounded-2xl border border-border bg-[#fdfcf9] p-4 shadow-[0_10px_30px_rgba(43,42,78,0.05)] md:p-7"
	>
		{@render children()}

		<div
			class="sticky bottom-0 z-10 -mx-4 mt-4 -mb-4 flex gap-3 rounded-b-2xl border-t border-border bg-[#fdfcf9] px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] md:static md:mx-0 md:mt-6 md:mb-0 md:rounded-none md:border-0 md:bg-transparent md:p-0"
		>
			<div class="flex-1">
				{#if canGoBack}
					<Button
						type="button"
						variant="secondary"
						onclick={onback}
						class="w-full justify-center border-transparent bg-card text-foreground hover:bg-[#ebe7dc]"
						>Назад</Button
					>
				{/if}
			</div>
			<Button type="button" onclick={onnext} disabled={!canGoNext} class="flex-1 justify-center"
				>{nextLabel}</Button
			>
		</div>
	</div>
</section>

<script lang="ts">
	import { tick, type Snippet } from 'svelte';
	import Button from '$lib/components/ui/Button.svelte';

	export type ResultTone = 'neutral' | 'green' | 'yellow' | 'orange' | 'red';
	export type ResultSubscale = {
		name: string;
		value: number;
		max: number;
		severity?: string;
		tone: ResultTone;
		description?: string;
		thresholds?: number[];
	};

	type Props = {
		title?: string;
		value: number;
		max: number;
		decimals?: number;
		severity: string;
		tone: ResultTone;
		recommendation: string;
		note?: string;
		thresholds?: number[];
		subscales?: ResultSubscale[];
		actions?: Snippet;
	};

	let {
		title = 'Ваш результат',
		value,
		max,
		decimals = 0,
		severity,
		tone,
		recommendation,
		note,
		thresholds = [],
		subscales = [],
		actions
	}: Props = $props();

	const colors = {
		neutral: { text: 'text-navy', bar: 'oklch(0.719 0.048 81)' },
		green: { text: 'text-[#5e824d]', bar: 'oklch(0.62 0.09 132)' },
		yellow: { text: 'text-[#a97516]', bar: 'oklch(0.72 0.12 78)' },
		orange: { text: 'text-[#b45d32]', bar: 'oklch(0.65 0.13 48)' },
		red: { text: 'text-[#a64235]', bar: 'oklch(0.58 0.16 30)' }
	} as const;

	const copyText = $derived.by(() => {
		const lines = [title, `${value.toFixed(decimals)} / ${max.toFixed(decimals)}`, severity];
		if (subscales.length > 0) {
			lines.push(
				'',
				'Подробно по шкалам:',
				...subscales.map(
					(subscale) =>
						`${subscale.name}: ${subscale.value.toFixed(2)} / ${subscale.max.toFixed(2)}${subscale.severity ? `, ${subscale.severity}` : ''}`
				)
			);
		}
		lines.push('', recommendation);
		return lines.join('\n');
	});
	let copied = $state(false);
	async function copyResult() {
		const questionnaireUrl = new URL(window.location.href);
		questionnaireUrl.search = '';
		questionnaireUrl.hash = '';

		await navigator.clipboard.writeText(
			`${copyText}\n\nПройти опросник: ${questionnaireUrl.toString()}`
		);

		// Re-arm the confirmation even when the button is clicked again before it resets.
		copied = false;
		await tick();
		copied = true;
	}

	$effect(() => {
		if (!copied) return;

		const timer = window.setTimeout(() => {
			copied = false;
		}, 1800);

		return () => window.clearTimeout(timer);
	});
</script>

{#snippet scaleBar(
	barValue: number,
	barMax: number,
	barTone: ResultTone,
	marks: number[],
	heightClass: string
)}
	<div class={`relative w-full ${heightClass}`}>
		<div class="h-full w-full overflow-hidden rounded-full bg-[#e4dccb]">
			<div
				class="h-full rounded-full transition-[width] duration-500 ease-out-quart"
				style={`width: ${Math.min(100, Math.max(0, (barValue / barMax) * 100))}%; background: ${colors[barTone].bar};`}
			></div>
		</div>
		{#each marks as mark (mark)}
			<span
				class="pointer-events-none absolute -top-1 -bottom-1 w-0.5 -translate-x-1/2 rounded-full bg-navy/70"
				style={`left: ${Math.min(100, Math.max(0, (mark / barMax) * 100))}%;`}
				aria-hidden="true"
			></span>
		{/each}
	</div>
{/snippet}

<section class="scroll-mt-20 space-y-7" aria-live="polite">
	<div>
		<h2 class="text-[30px] leading-tight font-extrabold tracking-[-0.5px] text-navy md:text-[36px]">
			{title}
		</h2>
	</div>

	<div class="rounded-[22px] bg-card p-6 sm:p-8">
		<div class="mb-4">
			{@render scaleBar(value, max, tone, thresholds, 'h-2.5')}
		</div>

		<div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
			<p class={`text-[38px] leading-none font-extrabold md:text-[46px] ${colors[tone].text}`}>
				{value.toFixed(decimals)}
				<span class="text-[18px] font-semibold text-foreground/45 md:text-[22px]"
					>/ {max.toFixed(decimals)}</span
				>
			</p>
			<p
				class={`max-w-[380px] text-[17px] leading-snug font-bold sm:text-right ${colors[tone].text}`}
			>
				{severity}
			</p>
		</div>
	</div>

	{#if subscales.length > 0}
		<div>
			<h3 class="mb-4 font-caveat text-[28px] font-bold text-navy md:text-[32px]">
				Подробно по шкалам
			</h3>
			<div class="space-y-3">
				{#each subscales as subscale}
					<article class="rounded-2xl border border-border bg-background p-5 sm:p-6">
						<div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-5">
							<h4 class="font-bold text-navy">{subscale.name}</h4>
							<p class={`text-[14px] font-bold sm:text-right ${colors[subscale.tone].text}`}>
								{subscale.value.toFixed(2)} / {subscale.max.toFixed(2)}{#if subscale.severity}
									· {subscale.severity}{/if}
							</p>
						</div>
						<div class="mt-3">
							{@render scaleBar(
								subscale.value,
								subscale.max,
								subscale.tone,
								subscale.thresholds ?? [],
								'h-2'
							)}
						</div>
						{#if subscale.description}
							<p class="mt-3 text-[14px] leading-relaxed text-foreground/70">
								{subscale.description}
							</p>
						{/if}
					</article>
				{/each}
			</div>
		</div>
	{/if}

	<div>
		<h3 class="mb-3 font-caveat text-[28px] font-bold text-navy md:text-[32px]">
			Как понимать результат
		</h3>
		<p class="text-[16px] leading-[1.75] whitespace-pre-line text-foreground/85">
			{recommendation}
		</p>
		{#if note}
			<p class="mt-4 rounded-xl bg-card px-4 py-3 text-[14px] leading-relaxed text-foreground/65">
				{note}
			</p>
		{/if}
	</div>

	<div class="flex flex-wrap gap-3 border-t border-border pt-6">
		<Button
			type="button"
			variant="primary"
			onclick={copyResult}
			class="min-w-[228px] justify-center bg-primary text-primary-foreground outline-none hover:bg-primary-light hover:text-primary-foreground"
		>
			{copied ? 'Результат скопирован' : 'Скопировать результат'}
		</Button>
		{#if actions}
			{@render actions()}
		{/if}
	</div>
</section>

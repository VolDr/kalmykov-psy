<script lang="ts">
	export type AssessmentOption = {
		label: string;
		value: number;
	};

	type Props = {
		id: string;
		number?: number;
		text: string;
		options: AssessmentOption[];
		value?: number;
		onchange: (value: number) => void;
		disabled?: boolean;
		error?: boolean;
		hint?: string;
	};

	let {
		id,
		number,
		text,
		options,
		value,
		onchange,
		disabled = false,
		error = false,
		hint
	}: Props = $props();
</script>

<fieldset
	id={`question-${id}`}
	class="scroll-mt-24"
	aria-describedby={error ? `${id}-error` : undefined}
>
	<legend
		class="mb-3 flex min-h-24 w-full items-start gap-3 text-[16px] leading-[1.45] font-semibold text-navy md:mb-4 md:min-h-20 md:gap-4 md:text-[18px]"
	>
		{#if number !== undefined}
			<span
				class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card font-caveat text-[20px] font-bold text-primary md:h-9 md:w-9 md:text-[22px]"
				aria-hidden="true"
			>
				{number}
			</span>
		{/if}
		<span class="pt-0.5 md:pt-1">{text}</span>
	</legend>

	{#if hint}
		<p class="mb-3 text-[13px] leading-relaxed text-muted-foreground md:ml-[52px] md:text-[14px]">
			{hint}
		</p>
	{/if}

	<div class="grid gap-2 md:ml-[52px] md:grid-cols-2">
		{#each options as option}
			<label
				class={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 text-[14px] leading-snug transition-[border-color,background-color,color] duration-200 ease-out-quart md:min-h-12 md:px-4 md:py-3 md:text-[15px] ${
					value === option.value
						? 'border-primary text-primary-foreground'
						: 'border-border bg-background text-foreground/80 hover:border-primary/60 hover:bg-card'
				} ${disabled ? 'cursor-default opacity-70' : ''}`}
				style:background-color={value === option.value ? 'var(--primary)' : undefined}
			>
				<input
					type="radio"
					name={id}
					value={option.value}
					checked={value === option.value}
					{disabled}
					onchange={() => onchange(option.value)}
					class="peer sr-only"
				/>
				<span
					class={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-[border-color,box-shadow] duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-primary/35 peer-focus-visible:ring-offset-2 ${
						value === option.value ? 'border-primary-foreground' : 'border-foreground/35'
					}`}
					aria-hidden="true"
				>
					{#if value === option.value}
						<span class="h-2.5 w-2.5 rounded-full bg-primary-foreground"></span>
					{/if}
				</span>
				<span>{option.label}</span>
			</label>
		{/each}
	</div>

	{#if error}
		<p id={`${id}-error`} class="mt-3 text-[14px] font-medium text-red-700 md:ml-[52px]">
			Ответьте на этот вопрос
		</p>
	{/if}
</fieldset>

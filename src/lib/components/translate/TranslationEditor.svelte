<script lang="ts">
	import { cn } from '#lib/utils.js';
	import {
		TRANSLATION_MAX_LENGTH,
		type TranslationField,
		type TranslationItem
	} from '#lib/data/translation.js';

	let {
		item,
		position,
		total,
		translation,
		comment,
		onchange,
		hasPrev,
		hasNext,
		onprev,
		onnext
	}: {
		item: TranslationItem;
		position: number;
		total: number;
		translation: string;
		comment: string;
		onchange: (field: TranslationField, value: string) => void;
		hasPrev: boolean;
		hasNext: boolean;
		onprev: () => void;
		onnext: () => void;
	} = $props();

	const fieldClass =
		'block w-full select-text rounded-xl border border-navy/15 bg-white px-4 py-3 text-base leading-relaxed text-navy shadow-xs [field-sizing:content] placeholder:text-navy/35 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none';
	const navClass =
		'inline-flex items-center gap-2 rounded-full border border-navy/15 bg-white px-5 py-2.5 text-sm font-medium text-navy transition-colors duration-150 hover:border-navy/40 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40';
</script>

<article aria-labelledby="tr-item-label" class="space-y-6">
	<div>
		<p class="mb-3 flex items-baseline justify-between gap-4 text-sm text-muted-foreground">
			<span id="tr-item-label" class="font-medium text-navy">{item.label}</span>
			<span class="tabular-nums">{position} из {total}</span>
		</p>
		<!-- Оригинал нельзя выделить и скопировать: select-none + обработчики на странице -->
		<p
			lang="en"
			class="rounded-2xl bg-[#f6f4ef] px-5 py-5 text-md leading-relaxed text-navy select-none [-webkit-touch-callout:none] sm:px-6 sm:text-lg"
			oncontextmenu={(event) => event.preventDefault()}
		>
			{item.source}
		</p>
	</div>

	<label class="block">
		<span class="mb-2 block text-sm font-medium text-navy">Перевод</span>
		<textarea
			id="tr-translation"
			lang="ru"
			class={cn(fieldClass, 'min-h-28')}
			maxlength={TRANSLATION_MAX_LENGTH}
			value={translation}
			oninput={(event) => onchange('translation', event.currentTarget.value)}
			placeholder="Ваш вариант перевода"
		></textarea>
	</label>

	<label class="block">
		<span class="mb-2 block text-sm font-medium text-navy">
			Комментарий <span class="font-normal text-muted-foreground">— необязательно</span>
		</span>
		<textarea
			id="tr-comment"
			lang="ru"
			class={cn(fieldClass, 'min-h-20')}
			maxlength={TRANSLATION_MAX_LENGTH}
			value={comment}
			oninput={(event) => onchange('comment', event.currentTarget.value)}
			placeholder="Сомнения, альтернативные варианты, пояснения"
		></textarea>
	</label>

	<div class="flex items-center justify-between gap-3">
		<button type="button" class={navClass} onclick={onprev} disabled={!hasPrev}>
			<span aria-hidden="true">←</span> Назад
		</button>
		<span class="hidden text-xs text-muted-foreground sm:inline">
			Ctrl + Enter — следующий пункт
		</span>
		<button type="button" class={navClass} onclick={onnext} disabled={!hasNext}>
			Дальше <span aria-hidden="true">→</span>
		</button>
	</div>
</article>

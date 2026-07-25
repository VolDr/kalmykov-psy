<script lang="ts">
	import { browser } from '$app/environment';
	import { fly } from 'svelte/transition';
	import { reachGoal } from '$lib/metrika';
	import MarkdownLink from '$lib/components/MarkdownLink.svelte';
	import ButtonSvg from '$lib/components/ui/ButtonSvg.svelte';
	import ClipQuiz from '$lib/components/questionnaire/ClipQuiz.svelte';
	import { bat23Config } from '../../../configs/bat23ConfigSoft';

	let { data } = $props();

	const article = $derived(data.article);
	const storageKey = $derived(`clip-${data.article.slug}-state`);

	function loadState() {
		const initial = { pageIndex: 0, stage: 'article' as 'article' | 'quiz' };
		if (!browser) return initial;
		try {
			const saved = localStorage.getItem(storageKey);
			if (saved) {
				const parsed = JSON.parse(saved);
				return {
					pageIndex: Math.min(Math.max(0, parsed.pageIndex ?? 0), data.article.pages.length - 1),
					stage:
						parsed.stage === 'quiz' && data.article.quizEnabled
							? ('quiz' as const)
							: ('article' as const)
				};
			}
		} catch (err) {
			console.error(err);
		}
		return initial;
	}

	let pageState = $state(loadState());
	let isMounted = $state(false);
	const firedMilestones = new Set<number>();

	$effect(() => {
		isMounted = true;
		if (browser) {
			localStorage.setItem(
				storageKey,
				JSON.stringify({ pageIndex: pageState.pageIndex, stage: pageState.stage })
			);
		}
	});

	$effect(() => {
		reachGoal('clip_opened', { article: article.slug });
	});

	const totalSteps = $derived(article.pages.length + (article.quizEnabled ? 1 : 0));
	const currentPage = $derived(article.pages[pageState.pageIndex]);
	const isLastPage = $derived(pageState.pageIndex === article.pages.length - 1);

	function fireProgressMilestones(pageIndex: number) {
		const progress = Math.round(((pageIndex + 1) / article.pages.length) * 100);
		for (const milestone of [25, 50, 75]) {
			if (progress >= milestone && !firedMilestones.has(milestone)) {
				firedMilestones.add(milestone);
				reachGoal(`clip_progress_${milestone}`, { article: article.slug });
			}
		}
	}

	function nextPage() {
		if (isLastPage) {
			if (!article.quizEnabled) return;
			pageState.stage = 'quiz';
			reachGoal('clip_quiz_started', { article: article.slug });
		} else {
			pageState.pageIndex += 1;
			fireProgressMilestones(pageState.pageIndex);
		}
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function prevPage() {
		if (pageState.stage === 'quiz') {
			pageState.stage = 'article';
		} else if (pageState.pageIndex > 0) {
			pageState.pageIndex -= 1;
		}
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}
</script>

<svelte:head>
	<title>{article.title} | Андрей Калмыков</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="min-h-screen bg-background text-foreground">
	<div class="mx-auto flex min-h-screen max-w-[680px] flex-col px-5 py-6 md:py-10">
		{#if !isMounted}
			<div class="flex flex-1 items-center justify-center">
				<div
					class="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"
				></div>
			</div>
		{:else if pageState.stage === 'article' && currentPage}
			<!-- Прогресс по экранам -->
			<div class="mb-8 flex items-center gap-3">
				<div class="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
					<div
						class="t-resize h-full rounded-full bg-primary"
						style="width: {((pageState.pageIndex + 1) / totalSteps) * 100}%"
					></div>
				</div>
				<span class="text-xs font-medium whitespace-nowrap text-gray-500">
					{pageState.pageIndex + 1} / {totalSteps}
				</span>
			</div>

			{#key pageState.pageIndex}
				<article class="flex flex-1 flex-col" in:fly={{ y: 14, duration: 350 }}>
					{#if pageState.pageIndex === 0}
						<h1
							class="mb-3 font-caveat text-[clamp(28px,4.5vw,42px)] leading-[1.2] font-semibold tracking-[-0.02em]"
						>
							{article.title}
						</h1>
						{#if article.subtitle}
							<p class="mb-7 text-[clamp(16px,1.8vw,19px)] text-muted-foreground">
								{article.subtitle}
							</p>
						{/if}
					{/if}

					{#if currentPage.heading}
						<h2
							class="mb-[22px] font-caveat text-[clamp(26px,2.5vw,32px)] leading-[1.25] font-semibold tracking-[-0.01em]"
						>
							{currentPage.heading}
						</h2>
					{/if}

					{#if currentPage.text}
						<div class="flex flex-col gap-[18px] text-[clamp(16px,1.8vw,18px)] leading-[1.75]">
							{#each currentPage.text.split('\n\n') as paragraph}
								<p><MarkdownLink text={paragraph} /></p>
							{/each}
						</div>
					{/if}

					{#if currentPage.imageUrl}
						<figure class="m-0 mt-7">
							<img
								src={currentPage.imageUrl}
								alt={currentPage.heading || article.title}
								loading="lazy"
								class="block h-auto w-full rounded-[14px]"
							/>
						</figure>
					{/if}

					<div class="mt-auto flex flex-col items-center gap-3 pt-10 pb-4">
						{#if !isLastPage || article.quizEnabled}
							<ButtonSvg
								mode="button"
								onclick={nextPage}
								variant="3"
								mobileWidth="280px"
								mobileHeight="80px"
								width="330px"
							>
								{isLastPage
									? article.quizButtonText || 'Пройти опросник'
									: currentPage.buttonText || 'Дальше'}
							</ButtonSvg>
						{/if}
						{#if pageState.pageIndex > 0}
							<button
								type="button"
								onclick={prevPage}
								class="cursor-pointer text-sm font-medium text-muted-foreground underline underline-offset-[3px] transition-colors hover:text-navy"
							>
								Назад
							</button>
						{/if}
					</div>
				</article>
			{/key}
		{:else if pageState.stage === 'quiz'}
			<div in:fly={{ y: 14, duration: 350 }}>
				<ClipQuiz
					config={bat23Config}
					articleSlug={article.slug}
					resultHeading={article.resultHeading || 'Ваш общий результат'}
					resultTextGreen={article.resultTextGreen || ''}
					resultTextOrange={article.resultTextOrange || ''}
					resultTextRed={article.resultTextRed || ''}
					botCtaText={article.botCtaText ||
						'Подробный разбор по четырём сферам выгорания и рекомендации, что делать дальше, я отправлю в телеграм-боте. Это бесплатно.'}
					botCtaButtonText={article.botCtaButtonText || 'Получить разбор в боте'}
				/>
				<div class="mt-6 flex justify-center pb-4">
					<button
						type="button"
						onclick={prevPage}
						class="cursor-pointer text-sm font-medium text-muted-foreground underline underline-offset-[3px] transition-colors hover:text-navy"
					>
						← Вернуться к статье
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>

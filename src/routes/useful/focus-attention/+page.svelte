<script lang="ts">
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { initScrollGoals } from '$lib/useScrollGoals';
	import { reachGoal } from '$lib/metrika';
	import { setupLeadMagnetTracking } from '$lib/client/leadMagnetTracking';
	import { lmLog } from '$lib/client/lmDebug';
	import { landOnHashTarget } from '$lib/hashLanding';
	import ButtonSvg from '$lib/components/ui/ButtonSvg.svelte';
	import FocusAttentionArticle from '$lib/components/leadmagnet/FocusAttentionArticle.svelte';

	let { data } = $props();

	let ctaSection: HTMLElement;

	const sbClientId = data.sbClientId;

	const introHref = sbClientId
		? `/booking?acquaintance&sb_client_id=${sbClientId}`
		: '/booking?acquaintance';
	const therapyHref = sbClientId ? `/booking?sb_client_id=${sbClientId}` : '/booking';

	onMount(() => {
		reachGoal('lm_opened');
		initScrollGoals();

		if (!sbClientId)
			lmLog('статусы не отправляются: нет sb_client_id — страницу открыли не по ссылке из бота');
		const cleanupTracking = sbClientId
			? setupLeadMagnetTracking({
					leadMagnet: 'focus',
					readThreshold: 75,
					minimumReadingTimeMs: 30_000
				})
			: undefined;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry.isIntersecting) return;
				reachGoal('lead_cta_seen');
				observer.disconnect();
			},
			{ threshold: 0.5 }
		);
		if (ctaSection) observer.observe(ctaSection);

		return () => {
			cleanupTracking?.();
			observer.disconnect();
		};
	});

	afterNavigate(({ to }) => {
		if (to?.url.hash === '#acquaintance' && ctaSection) {
			landOnHashTarget(ctaSection);
		}
	});
</script>

<svelte:head>
	<title>Вы отдохнули, а легче не стало | Андрей Калмыков</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<FocusAttentionArticle>
	{#snippet cta()}
		<!-- Где заканчивается техника -->
		<section class="mx-auto mb-10 max-w-[680px] px-5 sm:mb-[60px]" data-reveal>
			<h2
				class="mb-[22px] font-caveat text-[clamp(26px,2.5vw,32px)] leading-[1.25] font-semibold tracking-[-0.01em]"
			>
				Где заканчивается техника и начинается более сложная работа
			</h2>
			<div class="flex flex-col gap-[18px] text-[clamp(16px,1.8vw,18px)] leading-[1.75]">
				<p>
					Техника помогает возвращать внимание. Но если его снова и снова тянет к работе — обычно
					его что-то туда возвращает. Чаще всего это те самые два убеждения, с которых мы начали, и
					убеждения, которые из них вырастают:
				</p>
				<ul class="flex flex-col gap-2 pl-1">
					<li>«я должен быть всегда на связи»;</li>
					<li>«если я не проверю, всё развалится»;</li>
					<li>«ошибка — это катастрофа»;</li>
					<li>«отдых нужно заслужить»;</li>
					<li>«если я остановлюсь, я отстану».</li>
				</ul>
				<p>
					Пока эти убеждения управляют поведением, внимание будет уходить к работе — <strong
						>никакое упражнение в одиночку их не перевесит.</strong
					> С ними имеет смысл разбираться отдельно: откуда они взялись, в каких ситуациях включаются,
					как поддерживают перегрузку и какие новые способы действовать можно постепенно проверять. Именно
					этим мы занимаемся на консультациях.
				</p>
			</div>
			<!-- Image 4: облачка — темы, с которыми работает психолог при выгорании -->
			<div class="mx-auto max-w-[680px] px-5" data-reveal>
				<figure class="m-0">
					<img
						src="/lmc/4.webp"
						width="1448"
						height="1086"
						alt="Облачка с темами, с которыми психолог помогает при выгорании: тревога, самокритика, сон, отношения, ресурсы и поддержка"
						loading="lazy"
						class="block h-auto w-full rounded-[14px]"
					/>
				</figure>
			</div>
		</section>

		<!-- CTA -->
		<section
			id="acquaintance"
			class="mx-auto mb-14 max-w-[680px] scroll-mt-8 px-5 sm:mb-20"
			data-reveal
			bind:this={ctaSection}
		>
			<div class="rounded-2xl bg-card px-6 py-8 text-center sm:px-12 sm:py-[44px]">
				<h2
					class="mb-[22px] font-caveat text-[clamp(26px,2.5vw,32px)] leading-[1.25] font-semibold tracking-[-0.01em]"
				>
					С чего можно начать
				</h2>
				<div
					class="mx-auto flex max-w-[520px] flex-col gap-4 text-left text-[clamp(16px,1.8vw,18px)] leading-[1.75]"
				>
					<p>
						Если вы отдыхаете, но мысли всё равно возвращаются к работе, проблема может быть не
						только в количестве отдыха. Иногда важно разобраться с тем, что удерживает вас в режиме
						постоянного контроля: с тревогой, чувством ответственности, страхом ошибиться, привычкой
						быть на связи и ощущением, что остановиться нельзя.
					</p>
					<p>
						Начать можно со встречи-знакомства — короткой встречи, чтобы проверить, подходим ли мы
						друг другу:
					</p>
					<ul class="flex flex-col gap-1 text-left text-[clamp(15px,1.7vw,17px)]">
						<li>— вы расскажете, что вас беспокоит;</li>
						<li>— я расскажу, что мы можем с этим сделать;</li>
						<li>— встреча длится 20–25 минут;</li>
						<li>— бесплатно и ни к чему не обязывает.</li>
					</ul>
				</div>
				<div class="mx-auto mt-6 flex flex-col items-center">
					<ButtonSvg
						href={introHref}
						onclick={() => reachGoal('modal_intro_click')}
						variant="3"
						mobileWidth="280px"
						mobileHeight="80px"
						width="350px"
						class="mb-3"
					>
						Записаться на встречу-знакомство
					</ButtonSvg>
					<div class="flex justify-center">
						<a
							href={therapyHref}
							onclick={() => reachGoal('lead_booking_click')}
							class="block w-full cursor-pointer text-center text-[14px] font-semibold text-muted-foreground underline underline-offset-[3px] transition-colors hover:text-navy lg:text-[16px]"
						>
							Вопросов нет, хочу на терапию
						</a>
					</div>
				</div>
			</div>
		</section>
	{/snippet}
</FocusAttentionArticle>

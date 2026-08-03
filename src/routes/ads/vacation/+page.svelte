<script lang="ts">
	import { reachGoal } from '$lib/metrika';
	import { botDeepLink, requestMetrikaClientId } from '$lib/tg-handoff';

	// Ссылка готова сразу — без ClientID, если счётчик не ответит. Как только он
	// ответит, href обновится. Ничего не ждём в момент клика: асинхронный переход
	// браузер считает незапрошенным и блокирует.
	let href = $state(botDeepLink('otpusk_ad', null));

	$effect(() => {
		requestMetrikaClientId().then((id) => {
			if (id) href = botDeepLink('otpusk_ad', id);
		});
	});

	function handleCta() {
		reachGoal('ad_cta_click', { ad: 'vacation' });
	}
</script>

<svelte:head>
	<title>Отпуск не помог от выгорания | Андрей Калмыков</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<!-- фон и центровка -->
<div class="relative min-h-screen bg-background">


	<!-- основной контент -->
	<div class="mx-auto flex min-h-screen max-w-[680px] flex-col items-center justify-center px-5 pb-16 pt-4 text-center">

		<!-- SVG-дудл: звёздочка -->
		<img src="/star_2.webp" class="pointer-events-none mb-6 h-8 w-8 -rotate-12 opacity-80" alt="" aria-hidden="true" />

		<!-- заголовок -->
		<h1 class="mb-[22px] font-caveat text-[clamp(26px,2.5vw,32px)] leading-[1.25] font-semibold tracking-[-0.01em]">
			Отпуск не помог — и дело не в том, что вы плохо отдохнули
		</h1>

		<!-- разделитель-волна -->
		<svg width="120" height="16" viewBox="0 0 120 16" fill="none" aria-hidden="true" class="mb-7 opacity-40">
			<path d="M3 10 C16 2 24 14 37 8 C50 2 58 14 71 8 C84 2 92 14 105 8 C111 5 114 6 117 8" stroke="var(--color-primary)" stroke-width="2.5" stroke-linecap="round"/>
		</svg>

		<!-- карточка с текстом -->
		<div class="mb-9 w-full rounded-[24px] bg-card px-7 py-8 text-left shadow-sm md:px-10 md:py-10">

			<!-- аватар + имя -->
			<div class="mb-6 flex items-center gap-3.5">
				<img
					src="/2_small_1x.webp"
					alt="Андрей Калмыков"
					class="h-16 w-16 rounded-full object-cover ring-primary/30"
				/>
				<div>
					<p class="text-[16px] font-extrabold text-navy">Андрей Калмыков</p>
					<p class="text-[14px] text-foreground/55">клинический психолог с опытом в IT</p>
				</div>
			</div>

			<p class="mb-4 text-[16px] leading-relaxed text-foreground/80 md:text-[18px]">
				Здравствуйте!
			</p>
			<p class="mb-4 text-[16px] leading-relaxed text-foreground/80 md:text-[18px]">
				Если вы взяли нормальный отпуск, а через несколько дней после возвращения снова чувствуете себя выжатым — причина не в качестве отдыха. </p>
			<p class="mb-4 text-[16px] leading-relaxed text-foreground/80 md:text-[18px]">
				<strong class="font-semibold text-navy">Отпуск просто убирает не то, что выматывает вас на самом деле.</strong>
			</p>
			<p class="text-[16px] leading-relaxed text-foreground/80 md:text-[18px]">
				Что именно отнимает силы, почему привычные способы справляться делают только хуже и что менять, чтобы выходные и отпуск снова восстанавливали, — я разобрал в статье.
			</p>
				<p class="text-[16px] leading-relaxed text-foreground/80 md:text-[18px]">
				Получите статью в моём Telegram-канале — по кнопке ниже.
			</p>
		</div>

		<!-- CTA-кнопка. Ссылка внешняя (t.me), resolve() к ней неприменим -->
		<!-- eslint-disable svelte/no-navigation-without-resolve -->
		<a
			{href}
			target="_blank"
			rel="noopener noreferrer"
			onclick={handleCta}
			class="group relative inline-flex items-center gap-3 rounded-2xl bg-navy px-8 py-4 text-[17px] font-extrabold text-white shadow-lg transition-all duration-200 hover:shadow-xl  md:text-[18px]"
		>
			<svg class="h-5 w-5 shrink-0 text-primary" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
				<path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
			</svg>
			Забрать статью в Telegram
			<svg class="h-4 w-4 shrink-0 opacity-60 transition-transform duration-200 " viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<polyline points="9 18 15 12 9 6"/>
			</svg>
		</a>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->



		<!-- дудл снизу -->
		<img src="/heart_1.webp" class="pointer-events-none mt-10 h-6 w-6 rotate-6 opacity-50" alt="" aria-hidden="true" />
	</div>
</div>

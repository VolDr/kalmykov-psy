<script lang="ts">
	import '../app.css';
	import Header from '$lib/components/layout/Header.svelte';
	import Affix from '$lib/components/ui/Affix.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import { onNavigate, afterNavigate } from '$app/navigation';
	import { createProgress } from '$lib/hooks/useProgress.js';
	import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import TelegramBanner from '$lib/components/TelegramBanner.svelte';
	import { telegramChannel } from '$lib/data/navigation.js';
	import { page } from '$app/state';
	let { children, data } = $props();
	let { progress, action } = createProgress();

	let isAdminRoute = $derived(data.pathname?.startsWith('/admin'));
	let isSurveys = $derived(data.pathname == '/surveys');
	let isArticles = $derived(data.pathname == '/articles');
	let isLoginRoute = $derived(data.pathname === '/login');
	let isUsefulRoute = $derived(data.pathname?.startsWith('/useful'))
	let burnoutSurveyRoute = $derived(data.pathname === '/useful/burnout-survey');

	let isPaymentResult = $derived(
		data.pathname?.startsWith('/payment/success') ||
		data.pathname?.startsWith('/payment/fail') ||
		data.pathname?.startsWith('/booking/success') ||
		data.pathname?.startsWith('/booking/fail')
	);
	// Only hide header/footer for special code pages (like /ABC123), not regular pages
	let isCodeRoute = $derived(
		data.pathname &&
			/^\/[a-zA-Z0-9]+$/.test(data.pathname) &&
			!data.pathname.match(/^\/(articles|surveys|online-therapy|sos|boom|login|logout|lma)$/)
	);

	// Управление overflow для body на странице login
	$effect(() => {
		if (isLoginRoute) {
			document.body.classList.add('overflow-hidden');
		} else {
			document.body.classList.remove('overflow-hidden');
		}

		return () => {
			document.body.classList.remove('overflow-hidden');
		};
	});

	afterNavigate(() => {
		if (typeof window.ym === 'function') {
			window.ym(105424317, 'hit', window.location.href);
		}
	});

	onNavigate((navigation) => {
		if (!document.startViewTransition) {
			return;
		}

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

<svelte:head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<link rel="canonical" href={data.canonicalUrl} />
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="icon" href="/favicon.ico" sizes="any" type="image/svg+xml" />
	<link rel="mask-icon" href="/logo.svg" color="#B8A98A" />
	<meta name="theme-color" content="#f7f5f0" />

	<link rel="preload" href="/_Caveat.woff2" as="font" type="font/woff2" crossorigin="anonymous" />
	<link rel="preload" href="/Aeonik.woff2" as="font" type="font/woff2" crossorigin="anonymous" />
	<script type="text/javascript">
		(function (m, e, t, r, i, k, a) {
			m[i] =
				m[i] ||
				function () {
					(m[i].a = m[i].a || []).push(arguments);
				};
			m[i].l = 1 * new Date();
			for (var j = 0; j < document.scripts.length; j++) {
				if (document.scripts[j].src === r) {
					return;
				}
			}
			((k = e.createElement(t)),
				(a = e.getElementsByTagName(t)[0]),
				(k.async = 1),
				(k.src = r),
				a.parentNode.insertBefore(k, a));
		})(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js?id=105424317', 'ym');

		ym(105424317, 'init', {
			ssr: true,
			webvisor: true,
			clickmap: true,
			ecommerce: 'dataLayer',
			accurateTrackBounce: true,
			trackLinks: true
		});
	</script>
	<noscript
		><div>
			<img
				src="https://mc.yandex.ru/watch/105424317"
				style="position:absolute; left:-9999px;"
				alt="Yandex.Metrika counter"
			/>
		</div></noscript
	>
	<!-- Google tag (gtag.js) -->
	<script async src="https://www.googletagmanager.com/gtag/js?id=G-05C2YFPR6B"></script>
	<script>
		window.dataLayer = window.dataLayer || [];
		function gtag() {
			dataLayer.push(arguments);
		}
		gtag('js', new Date());

		gtag('config', 'G-05C2YFPR6B');
	</script>
</svelte:head>

{#if !isAdminRoute && !isCodeRoute && !isLoginRoute && !burnoutSurveyRoute && !isUsefulRoute && !isPaymentResult}
	{#if page.url.pathname !== '/test-landing'}
		<Header initialMenuColor="white" />
	{/if}

	<Affix />
{/if}
{#if !isAdminRoute && !isCodeRoute && !isLoginRoute && !isSurveys && !isArticles && !burnoutSurveyRoute && !isPaymentResult}
	<ProgressBar progress={$progress} />
{/if}
<Toaster position="top-right" />

<main use:action class={isLoginRoute ? 'overflow-hidden' : ''}>
	{@render children()}
</main>

{#if !isAdminRoute && !isCodeRoute && !isLoginRoute && !burnoutSurveyRoute && !isPaymentResult && !isUsefulRoute}
	<TelegramBanner link={telegramChannel.link} text={telegramChannel.text} />
{/if}
{#if !isAdminRoute && !isCodeRoute && !isLoginRoute && !isPaymentResult}
	<Footer />
{/if}
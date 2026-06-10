<script lang="ts">
	import '../app.css';
	import Header from '$lib/components/layout/Header.svelte';
	import Affix from '$lib/components/ui/Affix.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import FooterMini from '$lib/components/layout/FooterMini.svelte';
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
	let isquestionnaires = $derived(data.pathname == '/questionnaires');
	let isArticles = $derived(data.pathname == '/articles');
	let isLoginRoute = $derived(data.pathname === '/login');
	let isUsefulRoute = $derived(data.pathname?.startsWith('/useful'))
	let isAdRoute = $derived(data.pathname?.startsWith('/ads'))
	let isLegalRoute = $derived(data.pathname === '/oferta' || data.pathname === '/privacy')
	let burnoutQuestionnaireRoute = $derived(data.pathname === '/useful/burnout-questionnaire');

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
			!data.pathname.match(/^\/(articles|questionnaires|online-therapy|sos|boom|login|logout|lma)$/)
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
	<link rel="icon" href="/favicon.ico" sizes="any" type="image/svg+xml" />
	<link rel="mask-icon" href="/logo.svg" color="#B8A98A" />
	<meta name="theme-color" content="#f7f5f0" />

	<link rel="preload" href="/Caveat.woff2" as="font" type="font/woff2" crossorigin="anonymous" />
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

</svelte:head>

{#if !isAdminRoute && !isCodeRoute && !isLoginRoute && !burnoutQuestionnaireRoute && !isUsefulRoute && !isAdRoute && !isPaymentResult}
	{#if page.url.pathname !== '/test-landing'}
		<Header initialMenuColor="white" />
	{/if}

	<Affix />
{/if}
{#if !isAdminRoute && !isCodeRoute && !isLoginRoute && !isquestionnaires && !isArticles && !burnoutQuestionnaireRoute && !isPaymentResult}
	<ProgressBar progress={$progress} />
{/if}
<Toaster position="top-right" />

<main use:action class={isLoginRoute ? 'overflow-hidden' : ''}>
	{@render children()}
</main>

{#if !isAdminRoute && !isCodeRoute && !isLoginRoute && !burnoutQuestionnaireRoute && !isPaymentResult && !isUsefulRoute && !isAdRoute}
	<TelegramBanner link={telegramChannel.link} text={telegramChannel.text} />
{/if}
{#if !isAdminRoute && !isCodeRoute && !isLoginRoute && !isPaymentResult && !isAdRoute && !isLegalRoute}
	<Footer />
{/if}
{#if isAdRoute || isLegalRoute}
	<FooterMini />
{/if}
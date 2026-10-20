<script lang="ts">
	import MainGridNew from '$lib/components/layout/MainGridNew.svelte';
	import { page } from '$app/state';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
	const siteOrigin = $derived(new URL(page.data.canonicalUrl).origin);
</script>

<svelte:head>
	<title>Консультации для выгорающих профессионалов | Андрей Калмыков</title>

	<meta
		name="description"
		content="Помогаю IT-специалистам и руководителям выйти из профессионального выгорания. Индивидуальные онлайн-консультации психолога. Запишитесь на первую сессию."
	/>
	<meta
		property="og:title"
		content="Консультации для выгорающих профессионалов | Андрей Калмыков"
	/>
	<meta
		property="og:description"
		content="Помогаю IT-специалистам и руководителям выйти из профессионального выгорания. Индивидуальные онлайн-консультации психолога. Запишитесь на первую сессию."
	/>
	<meta property="og:type" content="website" />
	<meta property="og:url" content="{siteOrigin}/" />
	<meta property="og:site_name" content="Андрей Калмыков — Психолог" />
	<meta property="og:image" content="{siteOrigin}/header.webp" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta
		name="twitter:title"
		content="Консультации для выгорающих профессионалов | Андрей Калмыков"
	/>
	<meta
		name="twitter:description"
		content="Помогаю IT-специалистам и руководителям выйти из профессионального выгорания. Индивидуальные онлайн-консультации психолога. Запишитесь на первую сессию."
	/>
	<meta name="twitter:image" content="{siteOrigin}/header.webp" />

	{@html `<script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "ProfessionalService",
        "name": "Консультации для выгорающих профессионалов",
        "description": "Индивидуальные онлайн-консультации психолога для преодоления профессионального выгорания и кризисов.",
        "url": "${siteOrigin}/",
        "image": "${siteOrigin}/header.webp",
        "priceRange": "$$",
        "areaServed": {
            "@type": "Country",
            "name": "Россия"
        },
        "serviceType": [
            "Психологическое консультирование",
            "Онлайн-терапия",
            "Когнитивно-поведенческая терапия",
            "ACT-терапия"
        ],
        "provider": {
            "@type": "Person",
            "name": "Андрей Калмыков",
            "jobTitle": "Психолог",
            "description": "Психолог с опытом работы в IT, эксперт по терапии выгорания",
            "url": "${siteOrigin}/info",
            "sameAs": [
                "https://www.b17.ru/kalmykov_andrei/",
                "https://t.me/kalmykov_psy"
            ]
        }
    }
    </script>`}
</svelte:head>

<MainGridNew prices={data.prices} />

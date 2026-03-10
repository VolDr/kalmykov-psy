<script lang="ts">
	import MainGrid from '$lib/components/layout/MainGrid.svelte';
</script>

<svelte:head>
	<title>Психолог Андрей Калмыков | Консультации для выгорающих</title>
	<meta
		name="description"
		content="Психолог с опытом работы в IT. Помогаю людям справиться с выгоранием, тревогой и найти баланс между работой и личной жизнью. Онлайн-консультации."
	/>
	<meta property="og:title" content="Психолог Андрей Калмыков |  Консультации для выгорающих" />
	<meta
		property="og:description"
		content="Психолог с опытом работы в IT. Помогаю людям справиться с выгоранием, тревогой и найти баланс между работой и личной жизнью. Онлайн-консультации."
	/>
	<meta property="og:type" content="website" />
	<meta property="og:url" content="{import.meta.env.VITE_URL}/" />
	<meta property="og:site_name" content="Андрей Калмыков — Психолог" />
	<meta property="og:image" content="{import.meta.env.VITE_URL}/header.webp" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Психолог Андрей Калмыков | Консультации для выгорающих" />
	<meta
		name="twitter:description"
		content="Психолог с опытом работы в IT. Помогаю людям справиться с выгоранием, тревогой и найти баланс между работой и личной жизнью. Онлайн-консультации."
	/>
	<meta name="twitter:image" content="{import.meta.env.VITE_URL}/header.webp" />

	<!-- Schema.org structured data -->
	{@html `<script type="application/ld+json">
	{
		"@context": "https://schema.org",
		"@type": "ProfessionalService",
		"name": "Андрей Калмыков — Психолог",
		"description": "Психолог с опытом работы в IT. Помогаю людям справиться с выгоранием, тревогой и найти баланс между работой и личной жизнью.",
		"url": "${import.meta.env.VITE_URL}",
		"image": "${import.meta.env.VITE_URL}/header.webp",
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
			"description": "Психолог, специализирующийся на работе с IT-специалистами и проблемах выгорания"
		}
	}
	</script>`}
</svelte:head>

<MainGrid />

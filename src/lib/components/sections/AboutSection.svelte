<script lang="ts">
	import Reveal from '$lib/components/Reveal.svelte';


export const items = [
	{
		icon: 'briefcase',
		highlight: 'опыт в IT',
		text: 'Знаю специфику цифровых профессий изнутри: сам проходил через выгорание и перфекционизм и говорю с вами на одном языке.',
		gridClass: 'col-span-1 md:col-span-14'
	},
	{
		icon: 'flask',
		highlight: 'научный подход',
		text: 'Применяю методы с доказанной эффективностью (ACT и КПТ), которые фокусируются на реальных действиях, а не только на симптомах.',
		gridClass: 'col-span-1 md:col-span-10 '
	},
	{
		icon: 'lightbulb',
		highlight: 'практика',
		text: 'Постоянно учусь у коллег на практических курсах, чтобы применять живые, современные подходы, а не застревать в теории.',
		gridClass: 'col-span-1 md:col-span-10'
	},

	{
		icon: 'trending-up',
		highlight: 'измеримый результат',
		text: 'Использую систему трекинга прогресса и обратной связи, чтобы наша работа приводила к конкретным результатам и можно было вовремя корректировать курс.',
		gridClass: 'col-span-1 md:col-span-14'
	}
];

	const iconMap: Record<string, string> = {
		briefcase: 'icon-[lucide--briefcase]',
		'book-open': 'icon-[lucide--book-open]',
		flask: 'icon-[lucide--flask-conical]',
		compass: 'icon-[lucide--compass]',
		'trending-up': 'icon-[lucide--trending-up]',
		clock: 'icon-[lucide--clock]',
		lightbulb: 'icon-[lucide--lightbulb]'
	};
</script>

<div
	class="mx-auto flex max-w-[720px] flex-col items-center gap-10 md:max-w-[960px] lg:max-w-[1200px]"
>
	<Reveal>
		<h3 class="subtitle">обо мне</h3>
	</Reveal>

	<div class="grid w-full grid-cols-1 gap-4 px-5 md:grid-cols-24 md:px-0 lg:grid-cols-24">
		{#each items as item}
			<div class={item.gridClass}>
				<Reveal axis="x" class="h-full">
					<div
						class="flex h-full min-h-[180px] flex-col justify-between rounded-lg bg-[#F2F0EF] p-6"
					>
						<div>
							<span class="{iconMap[item.icon]} mb-4 h-6 w-6 text-right text-[#B8A98A]"></span>
							<h4 class="text-lg font-semibold text-[#191919]">{item.highlight}</h4>
						</div>
						<p class="leading-relaxed text-[#191919]">{item.text}</p>
					</div>
				</Reveal>
			</div>
		{/each}
	</div>
</div>

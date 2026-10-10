<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * Облачко со стрелкой у кнопки — в стиле подсказки «Доступно расписание
	 * на следующий месяц» на /booking: тот же цвет, наклон и покачивание раз в
	 * несколько секунд.
	 *
	 * От md и шире облачко в две строки стоит справа от кнопки, стрелка
	 * заходит на её правый край. На узких экранах справа места нет, поэтому
	 * облачко в одну строку встаёт под кнопкой, а стрелка заходит на неё снизу.
	 * Кнопка на телефоне растягивается на всю ширину карточки.
	 */
	type Props = {
		/** Первая строка облачка. */
		line1: string;
		/** Вторая строка; на узких экранах идёт через пробел после первой. */
		line2: string;
		/** Кнопка, на которую указывает стрелка. */
		children: Snippet;
	};

	let { line1, line2, children }: Props = $props();
</script>

<!-- до sm кнопка на всю ширину, дальше обёртка по ширине кнопки -->
<div class="relative w-full pt-[30px] pb-[96px] sm:w-auto md:pb-0">
	<!-- md+: облачко справа, стрелка влево на правый край кнопки -->
	<svg
		viewBox="0 0 190 120"
		aria-hidden="true"
		class="hint-wiggle pointer-events-none absolute top-[-14px] left-[calc(100%-2px)] z-10 hidden w-[190px] origin-[4.2%_78.3%] text-navy md:block"
	>
		<g transform="rotate(-3.5 112 35)">
			<path
				d="M 58 6 C 90 3, 140 4, 168 8 C 182 10, 186 22, 185 35 C 184 48, 181 62, 166 64 C 132 67, 88 66, 60 63 C 44 61, 38 48, 39 35 C 40 22, 43 8, 58 6 Z"
				fill="#ded5f4"
			/>
			<text
				x="112"
				y="30"
				text-anchor="middle"
				font-family="inherit"
				font-size="15"
				font-weight="700"
				letter-spacing="-0.4"
				fill="#322d43">{line1}</text
			>
			<text
				x="112"
				y="50"
				text-anchor="middle"
				font-family="inherit"
				font-size="15"
				font-weight="700"
				letter-spacing="-0.4"
				fill="#322d43">{line2}</text
			>
		</g>
		<g
			fill="none"
			stroke="currentColor"
			stroke-width="2.4"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="M 62 70 C 50 88, 30 96, 8 94" />
			<path d="M 8 94 L 14.9 99.8" />
			<path d="M 8 94 L 15.8 89.5" />
		</g>
	</svg>

	<!-- до md: облачко под кнопкой, стрелка дугой вверх на её низ -->
	<svg
		viewBox="0 0 240 110"
		aria-hidden="true"
		class="hint-wiggle pointer-events-none absolute top-[calc(100%-110px)] right-0 z-10 w-[240px] origin-[12.5%_16.4%] text-navy md:hidden"
	>
		<g transform="rotate(-3.5 124 80)">
			<path
				d="M 34 58 C 90 54, 170 55, 214 59 C 230 61, 234 70, 233 80 C 232 90, 230 100, 214 101 C 168 104, 88 103, 34 101 C 20 100, 14 90, 15 80 C 16 70, 20 60, 34 58 Z"
				fill="#ded5f4"
			/>
			<text
				x="124"
				y="85"
				text-anchor="middle"
				font-family="inherit"
				font-size="16"
				font-weight="700"
				letter-spacing="-0.4"
				fill="#322d43">{line1} {line2}</text
			>
		</g>
		<g
			fill="none"
			stroke="currentColor"
			stroke-width="2.4"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="M 58 54 C 30 52, 18 34, 30 18" />
			<path d="M 30 18 L 29.7 28" />
			<path d="M 30 18 L 20.5 21.1" />
		</g>
	</svg>

	{@render children()}
</div>

<style>
	/* лёгкое покачивание раз в несколько секунд; центр вращения — у острия
	   стрелки (origin-[…] на каждом svg), поэтому она не уходит с кнопки */
	.hint-wiggle {
		animation: hint-wiggle 6s ease-in-out infinite;
	}

	@keyframes hint-wiggle {
		0%,
		82%,
		100% {
			transform: rotate(0deg);
		}
		86% {
			transform: rotate(-4deg);
		}
		90% {
			transform: rotate(3deg);
		}
		94% {
			transform: rotate(-2deg);
		}
		97% {
			transform: rotate(1deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.hint-wiggle {
			animation: none;
		}
	}
</style>

<script lang="ts">
	import ButtonSvg from '#lib/components/ui/ButtonSvg.svelte';
	import { reachGoal } from '#lib/metrika.js';

	type Props = {
		/** Ключ опросника — уходит параметром в цели Метрики. */
		questionnaire: string;
	};

	let { questionnaire }: Props = $props();
</script>

<section class="mt-10 rounded-[22px] bg-card p-6 sm:p-8" aria-labelledby="questionnaire-author">
	<div class="flex items-start gap-4 sm:gap-5">
		<img
			src="/2_small_1x.webp"
			alt="Андрей Калмыков"
			width="64"
			height="64"
			loading="lazy"
			class="h-16 w-16 shrink-0 rounded-full object-cover"
		/>
		<div>
			<p class="text-[13px] font-medium text-foreground/55">Об авторе</p>
			<h2 id="questionnaire-author" class="text-[20px] leading-tight font-extrabold text-navy">
				<a href="/info" class="transition-colors hover:text-primary">Андрей Калмыков</a>
			</h2>
			<p class="text-[14px] text-foreground/70">психолог-консультант</p>
		</div>
	</div>

	<div class="mt-5 space-y-3 text-[15px] leading-relaxed text-foreground/80">
		<p>
			Помогаю людям справиться с выгоранием, тревогой, прокрастинацией и перфекционизмом. Работаю в
			научно обоснованных подходах с доказанной эффективностью — когнитивно-поведенческой терапии и
			ACT.
		</p>
		<p>
			<a
				href="/info"
				class="font-semibold text-navy underline decoration-primary decoration-2 underline-offset-2 transition-colors hover:text-primary"
				>Подробнее обо мне и документы об образовании →</a
			>
		</p>
	</div>

	<div class="mt-7 border-t border-border pt-6">
		<h3 class="font-caveat text-[28px] font-bold text-navy md:text-[32px]">Обсудить результат</h3>
		<p class="mt-2 text-[15px] leading-relaxed text-foreground/80">
			Хотите понять, что стоит за этими баллами и что с ними делать? Обсудим на встрече-знакомстве:
			20–25 минут, бесплатно и ни к чему не обязывает.
		</p>
		<div class="mt-6 flex flex-col items-center">
			<ButtonSvg
				href="/booking?acquaintance"
				onclick={() => reachGoal('questionnaire_intro_click', { questionnaire })}
				variant="3"
				mobileWidth="280px"
				mobileHeight="80px"
				width="350px"
				class="mb-3"
			>
				Записаться на встречу-знакомство
			</ButtonSvg>
			<a
				href="/booking"
				onclick={() => reachGoal('questionnaire_booking_click', { questionnaire })}
				class="block text-center text-[14px] font-semibold text-muted-foreground underline underline-offset-[3px] transition-colors hover:text-navy lg:text-[16px]"
			>
				Вопросов нет, хочу на консультацию
			</a>
		</div>
	</div>
</section>

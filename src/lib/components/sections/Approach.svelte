<script lang="ts">
	import Reveal from '$lib/components/Reveal.svelte';
</script>

<div
	id="approach"
	class="mx-auto flex max-w-[720px] scroll-mt-24 flex-col items-center gap-10 md:max-w-[760px] lg:max-w-[960px]"
>
	<Reveal>
		<h2 class="subtitle">подход к работе</h2>
	</Reveal>

	<div class="grid w-full grid-cols-1 gap-4 px-5 md:grid-cols-24 lg:grid-cols-24 xl:px-0">
		<div class="col-span-1 md:col-span-14">
			<Reveal class="h-full w-full">
				<div
					class="flex h-full min-h-[180px] flex-col justify-between rounded-lg bg-background p-6"
				>
					<div>
						<span class="mb-4 icon-[lucide--route] h-6 w-6 text-right text-primary"></span>
						<h3 class="text-lg font-semibold text-foreground">последовательная работа</h3>
					</div>
					<p class="leading-relaxed text-foreground">
						Не прыгаю от темы к теме — сначала разбираемся в вашей ситуации, потом выстраиваем план
						работы и двигаемся к изменениям. Не держу в терапии годами — работаем столько, сколько
						нужно для реальных изменений.
					</p>
				</div>
			</Reveal>
		</div>

		<div class="col-span-1 md:col-span-10">
			<Reveal class="h-full w-full">
				<div
					class="flex h-full min-h-[180px] flex-col justify-between rounded-lg bg-background p-6"
				>
					<div>
						<span class="mb-4 icon-[lucide--signpost] h-6 w-6 text-right text-primary"></span>
						<h3 class="text-lg font-semibold text-foreground">понятная структура</h3>
					</div>
					<p class="leading-relaxed text-foreground">
						Вы всегда будете понимать, что происходит: объясняю логику наших действий на каждом
						этапе работы.
					</p>
				</div>
			</Reveal>
		</div>

		<div class="col-span-1 md:col-span-10">
			<Reveal class="h-full w-full">
				<div
					class="flex h-full min-h-[180px] flex-col justify-between rounded-lg bg-background p-6"
				>
					<div>
						<span class="mb-4 icon-[lucide--flask-conical] h-6 w-6 text-right text-primary"></span>
						<h3 class="text-lg font-semibold text-foreground">научный подход</h3>
					</div>
					<p class="leading-relaxed text-foreground">
						Применяю методы с доказанной эффективностью (ACT и КПТ), которые фокусируются на
						реальных действиях, а не только на симптомах.
					</p>
				</div>
			</Reveal>
		</div>

		<div class="col-span-1 md:col-span-14">
			<Reveal class="h-full w-full">
				<div
					class="flex h-full min-h-[180px] flex-col justify-between rounded-lg bg-background p-6"
				>
					<div>
						<span class="mb-4 icon-[lucide--trending-up] h-6 w-6 text-right text-primary"></span>
						<h3 class="text-lg font-semibold text-foreground">измеримый результат</h3>
					</div>
					<p class="leading-relaxed text-foreground">
						Использую систему трекинга прогресса и обратной связи, чтобы наша работа приводила к
						конкретным результатам и можно было вовремя корректировать курс.
					</p>
				</div>
			</Reveal>
		</div>

		<div class="col-span-1 md:col-span-12">
			<Reveal class="h-full w-full">
				<div
					class="flex h-full min-h-[180px] flex-col justify-between rounded-lg bg-background p-6"
				>
					<div>
						<span class="mb-4 icon-[lucide--lightbulb] h-6 w-6 text-right text-primary"></span>
						<h3 class="text-lg font-semibold text-foreground">практика</h3>
					</div>
					<p class="leading-relaxed text-foreground">
						Постоянно учусь у коллег на практических курсах, чтобы применять живые, современные
						подходы, а не застревать в теории.
					</p>
				</div>
			</Reveal>
		</div>

		<div class="col-span-1 md:col-span-12">
			<Reveal class="h-full w-full">
				<div
					class="flex h-full min-h-[180px] flex-col justify-between rounded-lg bg-background p-6"
				>
					<div>
						<span class="mb-4 icon-[lucide--briefcase] h-6 w-6 text-right text-primary"></span>
						<h3 class="text-lg font-semibold text-foreground">опыт в IT</h3>
					</div>
				</div>
			</Reveal>
		</div>
	</div>
</div>

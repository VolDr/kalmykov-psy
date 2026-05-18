<script lang="ts">
	import { onMount } from 'svelte';
	import Hero from '$lib/components/sections/Hero.svelte';
	import Faq from '$lib/components/sections/Faq.svelte';
	import Education from '$lib/components/sections/Education.svelte';
	import Media from '$lib/components/sections/Media.svelte';
	import IssuesList from '$lib/components/sections/IssuesList.svelte';
	import AboutSection from '$lib/components/sections/AboutSection.svelte';
	import Approach from '$lib/components/sections/Approach.svelte';
	import ConsultationInfo from '$lib/components/sections/ConsultationInfo.svelte';
	import ImageWithShadow from '$lib/components/ImageWithShadow.svelte';
	import Reveal from '$lib/components/Reveal.svelte';
	import { issueGroups, aboutItems, consultationInfo } from '$lib/data/content';

	let hash = $state('');
	// Состояние для блока образования
	let isEducationOpen = $state(false);

	onMount(() => {
		const getHash = () => {
			if (typeof window !== 'undefined') {
				return window.location.hash.substring(1);
			}
			return '';
		};

		hash = getHash();

		const handleHashChange = () => {
			hash = getHash();
		};

		window.addEventListener('hashchange', handleHashChange);

		return () => {
			window.removeEventListener('hashchange', handleHashChange);
		};
	});

	// Открываем образование, если перешли по ссылке #education.
	// Но НЕ закрываем, если ушли на другой хеш (например #media),
	// чтобы страница не прыгала.
	$effect(() => {
		if (hash === 'education') {
			isEducationOpen = true;
		}
	});
</script>

<Hero />

<div class="relative mt-8 flex w-full flex-col gap-14.5 overflow-x-hidden md:gap-24.5 lg:mt-0">
	<div
		class="mx-auto grid max-w-[720px] grid-cols-1 items-center gap-y-8.5 md:max-w-[760px] md:grid-cols-12 lg:my-10 lg:max-w-[960px] lg:gap-y-0"
	>
		<div class="col-span-1 mx-5 md:col-span-6 lg:col-span-6 lg:mx-0">
			<ImageWithShadow
				src="/1.webp"
				srcSmall="/1_small.webp"
				alt="Андрей"
				shadowPosition="bottom-left"
				imgClass="h-[320px] w-[285px] lg:w-[505px] lg:h-[720px]"
				width={505}
				height={720}
			/>
		</div>

		<div class="col-span-1 mx-5 md:col-span-6 lg:col-span-6 lg:mx-0">
			<div class="flex min-h-[50px] flex-col flex-nowrap items-center justify-start gap-4 lg:gap-8">
				<Reveal>
					<div
						class="container mx-auto flex flex-col flex-nowrap items-start justify-start gap-2 lg:gap-4"
					>
						<p>Я Андрей — практикующий психолог с опытом в IT.</p>
						<p>
							Я помогаю разглядеть привычные способы мышления, которые незаметно уводят от того, чего вы на самом деле хотите и найти способы жить так, как хочется, а не так, как получается.
						</p>
						<p>
						Универсальных алгоритмов помощи не существует — каждый случай индивидуален. Мы работаем исходя из ваших возможностей, потребностей и желаний, двигаясь в том темпе, который подходит именно вам.
						</p><p>
							Психотерапия для меня — это не избавление от трудностей, а умение использовать их как указатели на то, что действительно для вас важно.
						</p>
					</div>
				</Reveal>
				<!-- <Reveal>
					<div
						class="container mx-auto flex flex-col flex-nowrap items-start justify-start gap-2 lg:gap-4"
					>
						<p>Я Андрей — практикующий психолог с опытом в IT.</p>
						<p>
							Имея за плечами годы работы в IT-сфере, я хорошо понимаю проблемы тех, кто балансирует
							между профессиональным ростом и личным благополучием.
						</p>
						<p>
							Моя работа — создать пространство, где вы сможете разглядеть привычные способы
							мышления, которые превращают профессиональную самоотдачу в истощение, а желание
							соответствовать — в тревогу.
						</p>
						<p>
							Через анализ связей между вашими мыслями, чувствами и поведением я помогаю увидеть,
							что ваше беспокойство — не просто помеха эффективности, а сигнал о том, что что-то в
							вашей жизни требует пересмотра.
						</p>
					</div>
				</Reveal> -->
			</div>
		</div>

		<!-- <div
			class="col-span-1 mx-5 flex flex-col gap-2.5 md:col-span-6 md:gap-3.5 lg:col-span-6 lg:mx-0"
		>
			<div
				class="container mx-auto flex flex-col flex-nowrap items-center justify-start gap-2 lg:gap-4"
			>
				<Reveal>
					<p>
						Я не даю универсальных алгоритмов счастья — что толку в советах, если ваше мышление
						продолжает работать по прежним шаблонам?
					</p>
				</Reveal>
				<Reveal>
					<p>
						Вместо этого я настраиваю инструменты помощи под особенности именно вашего восприятия и
						мышления, исследуя, как различные ситуации запускают цепочки реакций и какие функции
						выполняет ваше поведение.
					</p>
				</Reveal>
				<Reveal>
					<p>
						Моя задача — не просто снять симптом, а помочь вам научиться замечать те процессы,
						которые этот симптом создают и поддерживают.
					</p>
				</Reveal>
				<Reveal>
					<p>
						Психотерапия, которую я практикую, — это не избавление от трудностей, а искусство
						использовать их как указатели на то, что действительно важно для вас.
					</p>
				</Reveal>
			</div>
		</div>

		<div class="col-span-1 mx-5 md:col-span-6 lg:col-span-6 lg:mx-0">
			<ImageWithShadow
				src="/2.webp"
				srcSmall="/2_small.webp"
				alt="Психолог"
				shadowPosition="bottom-right"
				imgClass="h-[320px] lg:h-[720px] w-[285px] lg:w-[544px]"
				width={544}
				height={720}
			/>
		</div> -->
	</div>

	<section>
		<IssuesList items={issueGroups} />
	</section>
	
	<section>
		<Approach />
	</section>

	<ConsultationInfo
		format={consultationInfo.format}
		duration={consultationInfo.duration}
		price={consultationInfo.price}
	/>

	<div
		class="col-span-1 mx-auto flex w-full max-w-[720px] flex-col items-stretch gap-14.5 px-5 md:col-span-1 md:max-w-[760px] md:gap-3.5 lg:max-w-[960px]"
	>
		<Education isOpen={isEducationOpen} />
	</div>
	
	<div
		class="col-span-1 mx-auto flex w-full max-w-[720px] flex-col items-stretch gap-14.5 px-5 md:col-span-1 md:max-w-[760px] md:gap-3.5 lg:max-w-[960px]"
	>
		<Media />
	</div>
	
	<div
		class="col-span-1 mx-auto flex w-full max-w-[720px] flex-col items-stretch gap-14.5 px-5 md:col-span-1 md:max-w-[760px] md:gap-3.5 lg:max-w-[960px]"
	>
		<Faq />
	</div>
</div>
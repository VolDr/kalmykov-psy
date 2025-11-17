<script lang="ts">
	import { onMount } from 'svelte';
	import Hero from '$lib/components/sections/Hero.svelte';
	import Faq from '$lib/components/sections/Faq.svelte';
	import Education from '$lib/components/sections/Education.svelte';
	import IssuesList from '$lib/components/sections/IssuesList.svelte';
	import AboutSection from '$lib/components/sections/AboutSection.svelte';
	import ConsultationInfo from '$lib/components/sections/ConsultationInfo.svelte';
	import ImageWithShadow from '$lib/components/ImageWithShadow.svelte';
	import Reveal from '$lib/components/Reveal.svelte';
	import { issueGroups, aboutItems, consultationInfo } from '$lib/data/content';

	let hash = $state('');

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
</script>

<Hero />

<div class="relative mt-8 flex w-full flex-col gap-8.5 overflow-x-hidden md:gap-10.5 lg:mt-0">
	<!-- Hero Section -->
	<div
		class="mx-auto grid max-w-[720px] grid-cols-1 items-center gap-y-8.5 md:max-w-[960px] md:grid-cols-12 lg:my-10 lg:max-w-[1200px] lg:gap-y-0"
	>
		<!-- Image 1 -->
		<div class="col-span-1 mx-5 md:col-span-6 lg:col-span-6 lg:mx-0">
			<ImageWithShadow
				src="/1.webp"
				srcSmall="/1_small.webp"
				alt="Андрей"
				shadowPosition="bottom-left"
				imgClass="h-[320px] w-[285px] lg:w-[505px] lg:h-[720px]"
			/>
		</div>

		<!-- Text 1 -->
		<div class="col-span-1 mx-5 md:col-span-6 lg:col-span-6 lg:mx-0">
			<div class="flex min-h-[50px] flex-col flex-nowrap items-center justify-start gap-4 lg:gap-8">
				<Reveal>
					<div
						class="container mx-auto flex flex-col flex-nowrap items-start justify-start gap-2 lg:gap-4"
					>
						<p>Я Андрей — практикующий психолог.</p>
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
				</Reveal>
			</div>
		</div>

		<!-- Text 2 -->
		<div
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

		<!-- Image 2 -->
		<div class="col-span-1 mx-5 md:col-span-6 lg:col-span-6 lg:mx-0">
			<ImageWithShadow
				src="/2.webp"
				srcSmall="/2_small.webp"
				alt="Психолог"
				shadowPosition="bottom-right"
				imgClass="h-[320px] lg:h-[720px] w-[285px] lg:w-[544px]"
			/>
		</div>
	</div>

	<!-- What I Help With Section -->
	<IssuesList items={issueGroups} />

	<!-- About Me Section -->
	<AboutSection items={aboutItems} />

	<!-- Consultation Info Section -->
	<ConsultationInfo
		format={consultationInfo.format}
		duration={consultationInfo.duration}
		price={consultationInfo.price}
	/>

	<!-- Education & FAQ Section -->
	<div
		class="col-span-1 mx-auto flex w-full max-w-[720px] flex-col items-stretch gap-2.5 px-5 md:col-span-1 md:max-w-[960px] md:gap-3.5 lg:max-w-[1200px]"
	>
		<Education isOpen={hash === 'education'} />
		<Faq />
	</div>
</div>

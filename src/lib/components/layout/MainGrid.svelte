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

<div class="w-full flex flex-col gap-8.5 md:gap-10.5 relative mt-8 lg:mt-0 overflow-x-hidden">
	<!-- Hero Section -->
	<div
		class="max-w-[720px] md:max-w-[960px] lg:max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-y-8.5 lg:gap-y-0 items-center lg:my-10"
	>
		<!-- Image 1 -->
		<div class="col-span-1 mx-5 lg:mx-0 md:col-span-6 lg:col-span-6">
			<ImageWithShadow
				src="/1.webp"
				srcSmall="/1_small.webp"
				alt="Андрей"
				shadowPosition="bottom-left"
				imgClass="h-[320px] w-[285px] lg:w-[505px] lg:h-[720px]"
			/>
		</div>

		<!-- Text 1 -->
		<div class="col-span-1 mx-5 lg:mx-0 md:col-span-6 lg:col-span-6">
			<div class="min-h-[50px] flex flex-col flex-nowrap gap-4 lg:gap-8 items-center justify-start">
				<Reveal>
					<div
						class="container mx-auto flex flex-col flex-nowrap gap-2 lg:gap-4 items-start justify-start"
					>
				    	<p>
							Я Андрей — практикующий психолог.
						</p>
						<p>
							Имея за плечами годы работы в IT-сфере, я хорошо понимаю проблемы тех, кто балансирует
							между профессиональным ростом и личным благополучием.
						</p>
						<p>
							Моя работа — создать пространство, где вы сможете разглядеть привычные способы мышления,
							которые превращают профессиональную самоотдачу в истощение, а желание соответствовать — в
							тревогу.
						</p>
						<p>
							Через анализ связей между вашими мыслями, чувствами и поведением я помогаю увидеть, что
							ваше беспокойство — не просто помеха эффективности, а сигнал о том, что что-то в вашей
							жизни требует пересмотра.
						</p>
					</div>
				</Reveal>
			</div>
		</div>

		<!-- Text 2 -->
		<div class="col-span-1 mx-5 lg:mx-0 md:col-span-6 lg:col-span-6 flex gap-2.5 md:gap-3.5 flex-col">
			<div
				class="container mx-auto flex flex-col flex-nowrap gap-2 lg:gap-4 items-center justify-start"
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
						Моя задача — не просто снять симптом, а помочь вам научиться замечать те процессы, которые
						этот симптом создают и поддерживают.
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
		<div class="col-span-1 mx-5 lg:mx-0 md:col-span-6 lg:col-span-6">
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
	<div class="col-span-1 md:col-span-1 flex-col max-w-[720px] md:max-w-[960px] lg:max-w-[1200px] mx-auto flex gap-2.5 md:gap-3.5 items-stretch w-full px-5">
		<Education isOpen={hash === 'education'} />
		<Faq />
	</div>
</div>

<script lang="ts">
	import Slider from '$lib/components/ui/Slider.svelte';

	interface CurrentStateData {
		individual: number;
		family: number;
		generally: number;
		social: number;
	}

	interface Props {
		editable: boolean;
		appeal: 'plural' | 'singular';
		data: CurrentStateData;
	}

	let { editable, data, appeal }: Props = $props();
</script>

<div class="container mx-auto select-none">
	<div class="mx-10 flex flex-col items-center justify-center gap-8 pt-10">
		<div class="flex w-full max-w-[640px] flex-col items-center gap-2">
			<div class="flex w-full flex-col items-center justify-center gap-1">
				<p class="text-center">Личное самочувствие</p>
				<div class="text-center text-sm text-gray-500 md:text-base lg:text-lg">
					{appeal === 'plural'
						? 'Как вы себя чувствуете внутренне?'
						: 'Как ты себя чувствуешь внутренне?'}
				</div>
				<div class="text-center text-sm text-gray-500 md:text-base lg:text-lg">
					{appeal === 'plural' ? 'Ваше настроение, эмоции, мысли' : 'Твое настроение, эмоции, мысли'}
				</div>
			</div>
			<Slider name="individual" {editable} value={data.individual} />
		</div>

		<div class="flex w-full max-w-[640px] flex-col items-center gap-2">
			<div class="flex w-full flex-col items-center justify-center gap-1">
				<p class="text-center">В личных отношениях</p>
				<div class="text-center text-sm text-gray-500 md:text-base lg:text-lg">
					{appeal === 'plural'
						? 'Как обстоят дела в семье, с партнером, с людьми, которые вам особенно важны?'
						: 'Как обстоят дела в семье, с партнером, с людьми, которые тебе особенно важны?'}
				</div>
			</div>
			<Slider name="family" {editable} value={data.family} />
		</div>

		<div class="flex w-full max-w-[640px] flex-col items-center gap-2">
			<div class="flex w-full flex-col items-center justify-center gap-1">
				<p class="text-center">Повседневная жизнь</p>
				<div class="text-center text-sm text-gray-500 md:text-base lg:text-lg">
					Как обстоят дела на работе/учебе, с друзьями, в повседневных делах?
				</div>
			</div>
			<Slider name="social" {editable} value={data.social} />
		</div>

		<div class="flex w-full max-w-[640px] flex-col items-center gap-2">
			<div class="flex w-full flex-col items-center justify-center gap-1">
				<p class="text-center">Общая оценка</p>
				<div class="text-center text-sm text-gray-500 md:text-base lg:text-lg">
					{appeal === 'plural'
						? 'В целом, как вы оцениваете свою жизнь за последнюю неделю, включая сегодняшний день?'
						: 'В целом, как ты оцениваешь свою жизнь за последнюю неделю, включая сегодняшний день?'}
				</div>
			</div>
			<Slider name="generally" {editable} value={data.generally} />
		</div>

		<div class="container mx-auto flex justify-center">
			<button
				class={`cursor-pointer mb-10 rounded-[10px] border border-solid border-black bg-opacity-0 px-[30px] py-[10px] text-center font-light tracking-wide transition-all duration-200 ease-out hover:border-[#cfc1a3] hover:bg-[#cfc1a3] hover:text-white hover:shadow-md active:scale-95 active:transform ${!editable ? 'cursor-default opacity-50' : ''}`}
				name="_action"
				value="SEND_HOWRU"
				type="submit"
				disabled={!editable}>
				Отправить
			</button>
		</div>
	</div>
</div>

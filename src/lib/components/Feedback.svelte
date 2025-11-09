<script lang="ts">
	import Slider from '$lib/components/ui/Slider.svelte';

	interface FeedbackData {
		attitude: number;
		goals: number;
		generally: number;
		method: number;
	}

	interface Props {
		gender: 'male' | 'female';
		appeal: 'plural' | 'singular';
		editable: boolean;
		data: FeedbackData;
	}

	let { gender, appeal, editable, data }: Props = $props();
</script>

<div class="container mx-auto select-none">
	<div class="mx-10 flex flex-col items-center justify-center gap-8 pt-10">
		<div class="flex w-full max-w-[640px] flex-col items-center gap-2">
			<div class="flex w-full flex-col items-center justify-center gap-1">
				<p class="text-center">Контакт с психологом</p>
				<div class="text-center text-sm text-gray-500 md:text-base lg:text-lg">
					{appeal === 'plural'
						? 'Чувствовали ли вы, что вас внимательно слушали, понимали и уважали?'
						: `Чувствовал${gender === 'female' ? 'a' : ''} ли ты, что тебя внимательно слушали, понимали и уважали?`}
				</div>
			</div>
			<Slider name="attitude" {editable} value={data.attitude} />
		</div>

		<div class="flex w-full max-w-[640px] flex-col items-center gap-2">
			<div class="flex w-full flex-col items-center justify-center gap-1">
				<p class="text-center">
					{appeal === 'plural' ? 'Важные для вас темы' : 'Важные для тебя темы'}
				</p>
				<div class="text-center text-sm text-gray-500 md:text-base lg:text-lg">
					{appeal === 'plural'
						? 'Говорили ли мы о том, что для вас действительно важно?'
						: 'Говорили ли мы о том, что для тебя действительно важно?'}
				</div>
			</div>
			<Slider name="goals" {editable} value={data.goals} />
		</div>

		<div class="flex w-full max-w-[640px] flex-col items-center gap-2">
			<div class="flex w-full flex-col items-center justify-center gap-1">
				<p class="text-center">Подход к работе</p>
				<div class="text-center text-sm text-gray-500 md:text-base lg:text-lg">
					{appeal === 'plural'
						? 'Подходил ли вам способ нашего общения и работы сегодня?'
						: 'Подходил ли тебе способ нашего общения и работы сегодня?'}
				</div>
			</div>
			<Slider name="method" {editable} value={data.method} />
		</div>

		<input type="hidden" name="_action" value="feedback" />

		<div class="flex w-full max-w-[640px] flex-col items-center gap-2">
			<div class="flex w-full flex-col items-center justify-center gap-1">
				<p class="text-center">Общее впечатление</p>
				<div class="text-center text-sm text-gray-500 md:text-base lg:text-lg">
					{appeal === 'plural'
						? 'Как вы оцениваете нашу встречу в целом?'
						: 'Как ты оцениваешь нашу встречу в целом?'}
				</div>
			</div>
			<Slider name="generally" {editable} value={data.generally} />
		</div>

		<div class="container mx-auto flex justify-center">
			<button
				class={`cursor-pointer  mb-10 rounded-[10px] border border-solid border-black bg-opacity-0 px-[30px] py-[10px] text-center font-light tracking-wide transition-all duration-200 ease-out hover:border-[#cfc1a3] hover:bg-[#cfc1a3] hover:text-white hover:shadow-md active:scale-95 active:transform ${!editable ? 'cursor-default opacity-50' : ''}`}
				name="_action"
				value="SEND_FEEDBACK"
				type="submit"
				disabled={!editable}>
				Отправить
			</button>
		</div>
	</div>
</div>

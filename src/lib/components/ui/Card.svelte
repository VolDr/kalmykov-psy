<script lang="ts">
	interface Props {
		title: string;
		link: string;
		description: string;
		icon?: string;
		todo: string;
	}

	let { title, link, description, icon = 'arrow-right', todo = 'Заполнить' }: Props = $props();
</script>

<a href={link} class="group block h-full rounded-lg transition-all duration-200">
	<div
		class="flex h-full flex-col justify-between rounded-lg bg-[#f7f5f0] p-6 transition-all duration-200 group-hover:brightness-95"
	>
		<div>
			<h3 class="mb-2 text-xl font-semibold text-[#191919]">{title}</h3>
			<p class="leading-relaxed text-gray-600">{description}</p>
		</div>

		<div class="mt-4 flex items-center gap-2 font-medium text-[#B8A98A]">
			<span>{todo}</span>
			<span
				class="icon-[lucide--arrow-up] h-4 w-4 rotate-90 transition-transform duration-200 group-hover:rotate-90 md:rotate-45"
			></span>
		</div>
	</div>
</a>

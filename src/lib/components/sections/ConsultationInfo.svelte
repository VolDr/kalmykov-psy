<script lang="ts">
    import BookButton from '$lib/components/BookButton.svelte';
    import Reveal from '$lib/components/Reveal.svelte';
    

    // Пропсы остаются теми же
    const { format, duration, price }: { format: string; duration: string; price: string } = $props();
</script>

<div class="col-span-1 mx-5 lg:mx-0 md:col-span-12 flex flex-col items-center gap-8">
    <Reveal>
        <span class="subtitle">приходите за поддержкой</span>
		
    </Reveal>
       
    <Reveal class="w-full max-w-[600px] flex-col items-center flex">
		 <h3 class="subtitle">стоимость и формат консультаций</h3>

        <div class=" p-8 text-center flex flex-col items-center">

<ul class="flex flex-col gap-3 mb-8">
	    <li class="flex items-center gap-3 text-gray-700">
       	  <span class="icon-[lucide--piggy-bank] text-[#B8A98A] w-5 h-5"></span>
        <span>{price}</span>
    </li>
    <li class="flex items-center gap-3 text-gray-700">
        <span class="icon-[lucide--video] text-[#B8A98A] w-5 h-5"></span>
        <span>{format}</span>
    </li>
    <li class="flex items-center gap-3 text-gray-700">
        <span class="icon-[lucide--clock] text-[#B8A98A] w-5 h-5"></span>
        <span>{duration}</span>
    </li>
</ul>


            <!-- 3. Кнопка CTA -->
            <BookButton />
        </div>
    </Reveal>
</div>

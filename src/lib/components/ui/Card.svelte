<script lang="ts">
    interface Props {
        title: string;
        link: string;
        description: string;
        icon?: string;
        todo: string;
    }

    let {
        title,
        link,
        description,
        icon = 'arrow-right',
        todo = 'Заполнить'
    }: Props = $props();
</script>

<a href={link} class="group block h-full rounded-lg transition-all duration-200 ">

    <div class="h-full flex flex-col justify-between p-6 bg-[#F2F0EF] rounded-lg  transition-all duration-200  group-hover:brightness-95">
        

        <div>
            <h3 class="text-xl font-semibold text-[#191919] mb-2">{title}</h3>
            <p class="text-gray-600 leading-relaxed">{description}</p>
        </div>


        <div class="flex items-center gap-2 text-[#B8A98A] font-medium mt-4">
            <span>{todo}</span>
            <span 
                class="icon-[lucide--arrow-up] w-4 h-4 transition-transform duration-200 rotate-90 md:rotate-45 group-hover:rotate-90"
            ></span>
        </div>
    </div>
</a>
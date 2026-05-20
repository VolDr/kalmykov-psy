<script lang="ts">
    let {
        src,
        srcSmall,
        alt,
        shadowPosition = 'bottom-left',
        imgClass = '',
        width,
        height,
        shadowClass = ""
    }: {
        src: string;
        srcSmall?: string;
        alt: string;
        shadowPosition?: 'bottom-left' | 'bottom-right';
        imgClass?: string;
        shadowClass?: string;
        width?: number;
        height?: number;
    } = $props();

    const shadowClasses =
        shadowPosition === 'bottom-left' ? 'h-[80%] -bottom-3 left-3' : 'h-[73%] -bottom-3 right-3';

    const imgPositionClasses =
        shadowPosition === 'bottom-left' ? '-top-3 -left-4' : '-top-5 -right-3';
</script>

<div class="mx-5 flex h-[360px] max-h-[80svh] items-center justify-center overflow-hidden lg:mx-0 lg:h-auto lg:max-h-none lg:overflow-visible">
    <!-- Общий контейнер для картинки и тени -->
    <div class="relative">
        <!-- Тень теперь живет здесь, снаружи тега picture -->
        <div class="absolute z-0 w-full rounded-xl bg-background {shadowClasses} {shadowClass}"></div>

        <picture>
            {#if srcSmall}
                <!-- Если есть маленькая картинка, принудительно показываем её до 1024px -->
                <!-- Мы используем srcset без w-дескрипторов, чтобы браузер не умничал, а просто взял файл -->
                <source 
                    media="(max-width: 1023px)" 
                    srcset={srcSmall} 
                />
            {/if}
            
            <img
                loading="lazy"
                {src}
                {alt}
                {width}
                {height}
                class="pointer-events-none relative z-10 my-0 rounded-xl object-cover select-none {imgPositionClasses} {imgClass}"
            />
        </picture>
    </div>
</div>
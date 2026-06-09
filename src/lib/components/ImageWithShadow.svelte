<script lang="ts">
    let {
        src,
        srcSmall,
        srcSmall1x,
        alt,
        shadowPosition = 'bottom-left',
        imgClass = '',
        width,
        height,
        shadowClass = ""
    }: {
        src: string;
        srcSmall?: string;
        srcSmall1x?: string;
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

<div class="mx-5 flex items-center justify-center lg:mx-0">
    <!-- Общий контейнер для картинки и тени -->
    <div class="relative">
        <!-- Тень теперь живет здесь, снаружи тега picture -->
        <div class="absolute z-0 w-full rounded-xl bg-background {shadowClasses} {shadowClass}"></div>

        <picture>
            {#if srcSmall}
                <source
                    media="(max-width: 1023px)"
                    srcset={srcSmall1x ? `${srcSmall1x} 1x, ${srcSmall} 2x` : srcSmall}
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
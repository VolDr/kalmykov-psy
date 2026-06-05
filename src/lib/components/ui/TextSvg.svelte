<script lang="ts">
  import type { Snippet } from 'svelte';

  type BlobVariant = '1' | '2' | '3' | '4';

  type Props = {
    children?: Snippet;

    text?: string;
    variant?: BlobVariant;

    width?: string;
    height?: string;
    textSize?: string;

    mobileWidth?: string;
    mobileHeight?: string;
    mobileTextSize?: string;

    fullWidth?: boolean;

    fill?: string;
    textColor?: string;

    class?: string;
    style?: string;

    [key: string]: any;
  };

  let {
    children,

    text = 'Записаться',
    variant = '1',

    width = '340px',
    height = '74px',
    textSize = '18px',

    mobileWidth = width,
    mobileHeight = height,
    mobileTextSize = textSize,

    fullWidth = false,

    fill = '#F3C55A',
    textColor = '#25221f',

    class: className = '',
    style: styleProp = '',

    ...restProps
  }: Props = $props();

  const variants = {
    '1': {
      rotate: 'rotate-[0.8deg]',
      path: `
        M 42 10
        C 82 7, 121 8, 162 8
        C 204 8, 248 7, 296 8
        C 320 9, 334 23, 334 39
        C 334 56, 320 68, 294 70
        C 246 71, 201 69, 156 70
        C 111 71, 74 72, 40 70
        C 18 69, 7 55, 7 39
        C 7 23, 20 12, 42 10
        Z
      `
    },

    '2': {
      rotate: 'rotate-[0.7deg]',
      path: `
        M 42 10
        C 78 7, 116 10, 156 8
        C 196 6, 237 9, 296 8
        C 321 8, 334 23, 334 39
        C 334 56, 319 68, 294 70
        C 247 71, 202 69, 157 70
        C 112 71, 75 73, 40 70
        C 18 68, 7 55, 7 39
        C 7 24, 20 13, 42 10
        Z
      `
    },

    '3': {
      rotate: '-rotate-[0.9deg]',
      path: `
        M 42 10
        C 82 7, 122 8, 162 8
        C 205 8, 248 7, 296 8
        C 320 9, 334 23, 334 39
        C 334 56, 320 68, 294 70
        C 248 72, 210 68, 164 70
        C 118 72, 78 73, 40 70
        C 18 68, 7 55, 7 39
        C 7 23, 20 12, 42 10
        Z
      `
    },

    '4': {
      rotate: '-rotate-[0.8deg]',
      path: `
        M 42 10
        C 81 7, 121 8, 162 8
        C 205 8, 248 7, 294 8
        C 322 9, 337 23, 336 40
        C 335 57, 319 69, 291 70
        C 245 71, 202 69, 156 70
        C 111 71, 74 72, 40 70
        C 18 68, 7 55, 7 39
        C 7 23, 20 12, 42 10
        Z
      `
    }
  } satisfies Record<BlobVariant, { rotate: string; path: string }>;

  const cn = (...classes: Array<string | false | null | undefined>) =>
    classes.filter(Boolean).join(' ');

  const current = $derived(variants[variant] ?? variants['1']);

  const rootStyle = $derived(
    `
      --text-svg-width-desktop: ${width};
      --text-svg-height-desktop: ${height};
      --text-svg-size-desktop: ${textSize};

      --text-svg-width-mobile: ${mobileWidth};
      --text-svg-height-mobile: ${mobileHeight};
      --text-svg-size-mobile: ${mobileTextSize};

      --text-svg-color: ${textColor};

      ${styleProp}
    `
  );

  const rootClass = $derived(
    cn(
      'text-svg relative inline-grid place-items-center',
      fullWidth ? 'w-full' : '',
      'border-0 bg-transparent p-0',
      current.rotate,
      className
    )
  );
</script>

<div {...restProps} class={rootClass} style={rootStyle}>
  <svg
    viewBox="0 0 340 78"
    preserveAspectRatio="none"
    aria-hidden="true"
    class="absolute inset-0 h-full w-full overflow-visible drop-shadow-[0_8px_10px_rgba(214,155,46,0.18)]"
  >
    <path fill={fill} d={current.path} />
  </svg>

  <span class="text-svg__text">
    {#if children}
      {@render children()}
    {:else}
      {text}
    {/if}
  </span>
</div>

<style>
  .text-svg {
    --text-svg-width: var(--text-svg-width-desktop);
    --text-svg-height: var(--text-svg-height-desktop);
    --text-svg-size: var(--text-svg-size-desktop);

    width: var(--text-svg-width);
    height: var(--text-svg-height);
    max-width: 100%;
  }

  .text-svg__text {
    position: relative;
    z-index: 10;

    padding-inline: 32px;

    color: var(--text-svg-color);
    font-size: var(--text-svg-size);
    font-weight: 700;
    line-height: 1;
    letter-spacing: -0.03em;
    text-align: center;

    transform: rotate(0.25deg);
  }

  @media (max-width: 640px) {
    .text-svg {
      --text-svg-width: var(--text-svg-width-mobile);
      --text-svg-height: var(--text-svg-height-mobile);
      --text-svg-size: var(--text-svg-size-mobile);
    }

    .text-svg__text {
      padding-inline: 20px;
    }
  }
</style>
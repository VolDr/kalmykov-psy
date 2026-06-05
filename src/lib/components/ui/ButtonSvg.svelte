<script lang="ts">
  type BlobVariant = '1' | '2' | '3' | '4';
  type OpenMode = 'self' | 'blank';
  type Mode = 'link' | 'button';
  type ButtonType = 'button' | 'submit' | 'reset';

  type Props = {
    href?: string;
    mode?: Mode;
    open?: OpenMode;
    target?: string;
    rel?: string;

    variant?: BlobVariant;

    ariaLabel?: string;
    buttonType?: ButtonType;

    width?: string;
    height?: string;
    fullWidth?: boolean;

    mobileWidth?: string;
    mobileHeight?: string;

    fill?: string;
    textColor?: string;
    textSize?: string;

    class?: string;
    style?: string;

    [key: string]: any;
  };

  let {
    href,
    mode,
    open = 'self',
    target,
    rel,

    variant = '1',

    ariaLabel,
    buttonType = 'button',

    width = '340px',
    height = '74px',
    fullWidth = false,

    mobileWidth = width,
    mobileHeight = height,

    fill = '#F3C55A',
    textColor = '#25221f',
    textSize = '18px',

    class: className = '',
    style: styleProp = '',

    ...restProps
  }: Props = $props();

  const variants = {
    // 1 — самый близкий к рефу: почти ровная мягкая плашка
    '1': {
      rotate: 'rotate-[0.8deg] hover:rotate-[0.3deg]',
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

    // 2 — почти то же, но верхняя линия чуть живее
    '2': {
      rotate: 'rotate-[0.7deg] hover:rotate-[0.2deg]',
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

    // 3 — почти то же, но нижняя линия чуть гуляет
    '3': {
      rotate: '-rotate-[0.9deg] hover:-rotate-[0.4deg]',
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

    // 4 — чуть пухлее справа, но всё ещё как капсула
    '4': {
      rotate: '-rotate-[0.8deg] hover:-rotate-[0.3deg]',
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

  // Если href есть — по умолчанию это ссылка.
  // Если mode="button" — будет button даже без href.
  const isLink = $derived(mode ? mode === 'link' : Boolean(href));

  const computedTarget = $derived(target ?? (open === 'blank' ? '_blank' : undefined));
  const computedRel = $derived(rel ?? (open === 'blank' ? 'noopener noreferrer' : undefined));

  const rootStyle = $derived(
    `--button-svg-width-desktop: ${width}; --button-svg-height-desktop: ${height}; --button-svg-width-mobile: ${mobileWidth}; --button-svg-height-mobile: ${mobileHeight}; --button-svg-text-color: ${textColor}; --button-svg-text-size: ${textSize}; ${styleProp}`
  );

  const rootClass = $derived(
    cn(
      'button-svg group relative inline-grid h-[var(--button-svg-height)] place-items-center',
      fullWidth ? 'w-full' : 'w-[var(--button-svg-width)] max-w-full',
      'border-0 bg-transparent p-0 no-underline',
      'transition-transform duration-200',
      current.rotate,
      className
    )
  );

  const textClass = cn(
    'relative z-10 rotate-[0.25deg]',
    'text-[length:var(--button-svg-text-size)] font-bold tracking-[-0.03em]',
    'text-[var(--button-svg-text-color)]'
  );

</script>

<style>
  .button-svg {
    --button-svg-width: var(--button-svg-width-desktop);
    --button-svg-height: var(--button-svg-height-desktop);
  }

  @media (max-width: 640px) {
    .button-svg {
      --button-svg-width: var(--button-svg-width-mobile);
      --button-svg-height: var(--button-svg-height-mobile);
    }
  }
</style>

{#if isLink}
  <a
    {...restProps}
    {href}
    target={computedTarget}
    rel={computedRel}
    aria-label={ariaLabel || undefined}

    class={rootClass}
    style={rootStyle}
  >
    <svg
      viewBox="0 0 340 78"
      aria-hidden="true"
      preserveAspectRatio="none"
      class="absolute inset-0 h-full w-full overflow-visible drop-shadow-[0_8px_10px_rgba(214,155,46,0.18)]"
    >
      <path fill={fill} d={current.path} />
    </svg>

    <span class={textClass}>
      <slot>Записаться</slot>
    </span>
  </a>
{:else}
  <button
    {...restProps}
    type={buttonType}
    aria-label={ariaLabel || undefined}

    class={rootClass}
    style={rootStyle}
  >
    <svg
      viewBox="0 0 340 78"
      aria-hidden="true"
      preserveAspectRatio="none"
      class="absolute inset-0 h-full w-full overflow-visible drop-shadow-[0_8px_10px_rgba(214,155,46,0.18)]"
    >
      <path fill={fill} d={current.path} />
    </svg>

    <span class={textClass}>
      <slot>Записаться</slot>
    </span>
  </button>
{/if}
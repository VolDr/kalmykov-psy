# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a SvelteKit application (`kalmykov-psy`) using Svelte 5 with TypeScript, Tailwind CSS 4, and shadcn-svelte components. The project uses `adapter-auto` for deployment flexibility.

## Development Commands

```bash
# Start development server
npm run dev

# Type checking (single run)
npm run check

# Type checking (watch mode)
npm run check:watch

# Build for production
npm run build

# Preview production build
npm run preview

# Format code
npm run format

# Lint code (runs prettier check + eslint)
npm run lint
```

## Code Architecture

### SvelteKit Structure
- Routes in `src/routes/` follow SvelteKit file-based routing conventions
- `+layout.svelte` handles global layout and imports `app.css`
- `+page.svelte` files define page components

### Component System
- Using shadcn-svelte component library configured in `components.json`
- UI components go in `src/lib/components/ui/`
- Path aliases configured:
  - `$lib` → `src/lib`
  - `$lib/components` → components
  - `$lib/components/ui` → ui components
  - `$lib/hooks` → custom hooks
  - `$lib/utils` → utilities

### Styling
- Tailwind CSS 4 with `@tailwindcss/vite` plugin
- Global styles in `src/app.css`
- Tailwind plugins: `@tailwindcss/forms`, `@tailwindcss/typography`, `tw-animate-css`
- Helper utility `cn()` in `src/lib/utils.ts` for conditional class merging (clsx + tailwind-merge)

### TypeScript
- Strict mode enabled
- Path aliases handled by SvelteKit configuration
- Extended config from `.svelte-kit/tsconfig.json`

## Code Style

### Prettier Configuration
- Uses tabs for indentation
- Single quotes
- No trailing commas
- 100 character print width
- Automatically formats Tailwind classes via `prettier-plugin-tailwindcss`

### ESLint Configuration
- TypeScript ESLint recommended rules
- Svelte plugin with recommended rules
- `no-undef` disabled (TypeScript handles this)
- Browser and Node globals available

## Type Utilities

The project includes utility types in `src/lib/utils.ts`:
- `WithoutChild<T>` - Remove child prop from type
- `WithoutChildren<T>` - Remove children prop from type
- `WithoutChildrenOrChild<T>` - Remove both child/children props
- `WithElementRef<T, U>` - Add optional ref prop for HTML elements
- `cn()` - Utility for conditional class merging (clsx + tailwind-merge)

## Best Practices

### Component Architecture
1. **Separation of Concerns**
   - Extract data into separate files (`src/lib/data/`)
   - Keep components focused on presentation
   - Break large components (>150 lines) into smaller, reusable pieces

2. **Type Safety with Svelte 5**
   - Use `Snippet` type from `svelte` for snippet props instead of `any`
   - Use `{@render snippet()}` to render snippets, not `{snippet}`
   - Avoid `!` non-null assertions - use conditional checks instead

3. **Styling**
   - Use `cn()` utility for conditional classes instead of ternary operators
   - Prefer Tailwind utilities over inline styles
   - Use `duration-{value}` instead of `style="transition-duration: ..."`

4. **Accessibility**
   - Add proper ARIA attributes (`aria-label`, `aria-modal`, `role`)
   - Include keyboard event handlers (`onkeydown`) for interactive elements
   - Use semantic HTML (`<button>` instead of `<div onclick>`)
   - Add `tabindex` for focusable elements
   - NEVER use `svelte-ignore` for a11y warnings - fix them properly

5. **Data Management**
   - Store content data in `src/lib/data/` directory
   - Use TypeScript interfaces for data structures
   - Separate configuration from implementation

### Component Creation Checklist
- [ ] Component has single responsibility
- [ ] Props are properly typed (use `Snippet` for snippets)
- [ ] Uses `cn()` for conditional classes
- [ ] No hardcoded data (moved to separate files)
- [ ] Accessibility: proper ARIA, keyboard support, semantic HTML
- [ ] No `{@html}` without sanitization (split into safe elements instead)
- [ ] Responsive design implemented
- [ ] Loading states handled

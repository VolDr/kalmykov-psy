---
name: "Андрей Калмыков — Психолог"
description: "A psychology practice landing page for burnt-out professionals. Grounded, rigorous, human."
colors:
  burnished-ochre: "oklch(0.719 0.048 81)"
  burnished-ochre-light: "oklch(0.798 0.033 81)"
  warm-parchment: "oklch(0.969 0.007 81)"
  warm-canvas: "oklch(0.984 0.004 81)"
  practitioner-ink: "oklch(0.143 0.005 81)"
  mid-warm-gray: "oklch(0.366 0.003 81)"
  warm-stone: "oklch(0.906 0.003 81)"
  warm-mist: "oklch(0.945 0.005 81)"
typography:
  display:
    fontFamily: "Circe, system-ui, sans-serif"
    fontSize: "clamp(1.875rem, 4vw, 3rem)"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "normal"
  headline:
    fontFamily: "Circe, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 3vw, 2.25rem)"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Tilda-Sans, system-ui, sans-serif"
    fontSize: "clamp(1.125rem, 1.5vw, 1.375rem)"
    fontWeight: 400
    lineHeight: 1.75
  label:
    fontFamily: "Tilda-Sans, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.01em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
  2xl: "16px"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "32px"
  section: "96px"
components:
  button-primary:
    backgroundColor: "{colors.burnished-ochre}"
    textColor: "{colors.warm-canvas}"
    rounded: "{rounded.lg}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.burnished-ochre-light}"
    textColor: "{colors.warm-canvas}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.burnished-ochre}"
    rounded: "{rounded.lg}"
    padding: "12px 24px"
  button-outline-hover:
    backgroundColor: "{colors.burnished-ochre}"
    textColor: "{colors.warm-canvas}"
  card-default:
    backgroundColor: "{colors.warm-canvas}"
    rounded: "{rounded.2xl}"
    padding: "24px"
---

# Design System: Андрей Калмыков — Психолог

## 1. Overview

**Creative North Star: "The Practice"**

This is a design system for a practitioner — one specific person who has done this work for years, knows what the evidence says, and has no interest in performing credentials. The aesthetic is the professional's office before the client arrives: ordered, warm, unhurried. Every surface tinted to the same warm ochre hue. Typography that speaks directly rather than presenting. Motion that orients rather than entertains.

The system explicitly rejects four failure modes. It is not the generic therapy site with stock meditation photos and pastel blues — that palette signals category, not person. It is not the corporate wellness app (Headspace-purple, mindfulness-as-subscription). It is not a startup landing page with hero metrics, gradient CTAs, and SaaS-cream backgrounds. And it is not old-school clinical: no dark navy, no serif body text, no cold white surfaces or formal distance. Each of these anti-references converges on the same problem: they replace the specific person with a category. This system refuses that.

**Key Characteristics:**
- Every neutral carries hue 81 at minimum chroma — the warmth runs through the whole system
- Burnished Ochre appears sparingly: buttons, active states, blockquote tints; never decoratively
- Typography authority comes from the Circe/TildaSans division, not from size alone
- Depth through tonal layering (Warm Parchment background, Warm Canvas card); shadows emerge only from interaction state
- Motion acknowledges interaction; it does not celebrate itself

## 2. Colors: The Burnished Ochre Palette

A restrained warm palette built entirely at hue 81, the OKLCH zone between yellow-ochre and amber. Every token — background, border, muted text — shares this hue at different lightness and chroma levels. The system has one voice; it just varies in volume.

### Primary
- **Burnished Ochre** (`oklch(0.719 0.048 81)` / approx. `#B8A98A`): The system's single accent. Buttons, active navigation states, focus rings, blockquote background tints (`bg-primary/10`). Appears on no more than 15% of any screen; its rarity is the signal.
- **Burnished Ochre Light** (`oklch(0.798 0.033 81)` / approx. `#CFC1A3`): A desaturated lift of the primary. Used for progress bars, active indicator pills, hover states on outline buttons, and scroll-reveal indicators. Never substitutes for Burnished Ochre in primary actions.

### Neutral
- **Warm Parchment** (`oklch(0.969 0.007 81)` / approx. `#F7F5F0`): The page background. Every section that needs to "disappear" uses this. The warmth is imperceptible from a distance; it reads as white to the eye but never feels cold.
- **Warm Canvas** (`oklch(0.984 0.004 81)` / approx. `#FCFBF8`): Card surfaces, modal backgrounds, form field fills. Slightly lighter than Warm Parchment — the 1.5% lightness difference is the primary depth mechanism.
- **Practitioner's Ink** (`oklch(0.143 0.005 81)` / approx. `#191919`): All body text, headings, labels. Never pure black.
- **Mid-Warm Gray** (`oklch(0.366 0.003 81)` / approx. `#4A4A4A`): Muted text, descriptive labels below slider controls, secondary metadata. The color of pencil on warm paper.
- **Warm Stone** (`oklch(0.906 0.003 81)` / approx. `#E5E5E5`): Borders, dividers, inactive indicator dots. Light enough to be structural without being visible.
- **Warm Mist** (`oklch(0.945 0.005 81)` / approx. `#F0EDE8`): Secondary surfaces, hover backgrounds on navigation items, muted fill areas. Between Warm Parchment and Warm Stone.

### Named Rules

**The Warmth Rule.** Every neutral in this system carries hue 81 at minimum chroma (0.003–0.007). Zero-chroma grays (`oklch(L 0 0)`) are prohibited. If you pick up a color that looks like pure gray, it is wrong; run it through the warmth filter before committing.

**The Rarity Rule.** Burnished Ochre appears on ≤15% of any screen. A CTA button, an active breadcrumb indicator, a blockquote tint. Not a section background. Not decorative stripes. Not multiple elements per section. Its scarcity is what makes a button feel like a decision worth clicking.

## 3. Typography

**Display Font:** Circe (custom, loaded via `@font-face`; falls back to `system-ui, sans-serif`)
**Body Font:** Tilda-Sans (custom, loaded via `@font-face`; falls back to `system-ui, sans-serif`)

**Character:** The pairing is a register division, not a style choice. Circe carries architectural authority — it is for claims. TildaSans is for evidence, explanation, and navigation. When Circe appears, a statement is being made. When TildaSans appears, something is being shown or explained. Readers feel this distinction before they consciously notice it.

### Hierarchy

- **Display** (600 weight, `clamp(1.875rem, 4vw, 3rem)`, 1.25 line-height): Section headings ("узнаёте себя?", "почему не работает"). Typically lowercase by convention — the therapist speaking directly.
- **Headline** (600 weight, `clamp(1.5rem, 3vw, 2.25rem)`, 1.3 line-height): Hero h1, card titles, pricing headings. The largest typographic presence on any given section.
- **Body** (400 weight, `clamp(1.125rem, 1.5vw, 1.375rem)` — scales from 18px to 22px, 1.75 line-height): All running copy. Maximum line length: 65–75 characters. Cyrillic text benefits from the generous line-height; compound words run long.
- **Label** (500 weight, `0.9375rem` / 15px, 1.4 line-height, `0.01em` letter-spacing): Buttons, navigation links, captions, slider descriptors. TildaSans semi-bold. Never Circe.

### Named Rules

**The Circe Rule.** Circe is headings only — Display and Headline roles. Body, labels, navigation, buttons: TildaSans exclusively. This is structural, not aesthetic. Mixing the fonts at body size collapses the register distinction that makes Circe feel authoritative when it appears.

**The Lowercase Convention.** Section headings use lowercase sentence case by convention ("узнаёте себя?" not "УЗНАЁТЕ СЕБЯ?"). This is the practitioner's voice: direct, peer-level, not presenting. Subheadings and UI labels follow standard capitalization.

## 4. Elevation

This system is near-flat. Surfaces at rest carry no perceptible shadow. Depth is expressed through tonal layering: a Warm Canvas card (lightness 0.984) sitting on a Warm Parchment section (lightness 0.969) creates approximately 1.5% lightness contrast — enough to structure the layout, invisible enough that the page feels continuous.

Shadows are reserved for interaction state. They do not decorate rest states; they respond to them.

### Shadow Vocabulary

- **Ambient Rest** (`0 2px 10px rgba(0, 0, 0, 0.02)`): Present on most cards at rest. Effectively invisible; acts as a structural hint rather than visible depth. If it looks like a shadow, it's too heavy.
- **Interaction Lift** (`0 8px 30px rgba(0, 0, 0, 0.06)`): Appears on hover. A gentle rise acknowledging that the element is now in play. Still diffuse; not dramatic.
- **Modal Backdrop** (`background: rgba(0, 0, 0, 0.67)`): Dark overlay for full-screen modals and lightboxes. Deliberate contrast with the light system.

### Named Rules

**The Flat-by-Default Rule.** Surfaces are flat at rest. If a card looks lifted when nobody is hovering, the shadow is too dark. Shadow here is a state-response signal, not decoration. Tonal layering carries the structural load; shadows only communicate "this is interactive."

## 5. Components

### Buttons

Warm and responsive: hover states introduce a gentle shadow and color lift, never scale. The button doesn't bounce. It acknowledges.

- **Shape:** Gently curved, 10px radius (`rounded-lg`). Not pill-shaped — that reads as a wellness product. Not square — that reads as clinical software.
- **Primary:** Burnished Ochre background, Warm Canvas text. 12px vertical / 24px horizontal padding. Hover: background shifts to Burnished Ochre Light, shadow lifts to `0 4px 16px rgba(0,0,0,0.12)`. Transition: 200ms ease-out-quart.
- **Outline:** Transparent background, 1px Burnished Ochre border, Burnished Ochre text. Hover: fills to full Burnished Ochre with Warm Canvas text — same hover state as primary. Used for secondary CTAs alongside a primary.
- **Ghost/Link:** No background, no border. TildaSans label weight. Navigation, inline text links, secondary actions where the visual weight of a button would be wrong.
- **Disabled:** `opacity-50`, `cursor-default`. No hover state change.

### Cards / Containers

- **Corner Style:** Gently rounded, 16px radius (`rounded-2xl`). Standard across all card types.
- **Background Strategy:** Cards on Warm Parchment sections use Warm Canvas (`bg-card`). Cards on Warm Canvas sections use Warm Parchment (`bg-background`). Tonal contrast reverses at each layer — depth without shadows.
- **Shadow:** Ambient Rest at default; Interaction Lift on hover for interactive cards.
- **Border:** Warm Stone (1px) on cards where additional structural definition is needed (pricing cards, bordered quiz options). Omit on content cards where tonal contrast provides definition.
- **Padding:** 24px (`p-6`) standard; 32px (`p-8`) for feature cards and pricing panels.

### Inputs / Fields

Understated. The form should not compete with the content it surrounds.

- **Style:** Warm Canvas background, Warm Stone/foreground (20% opacity) border, 10px radius.
- **Focus:** Border shifts to Burnished Ochre. No glow, no shadow — a clean structural shift.
- **Error:** Border shifts to destructive red (`oklch(0.577 0.245 27.325)`). Error copy stays calm in tone.
- **Disabled:** `opacity-50`. No interactive feedback.

### Navigation

- **Desktop header:** Transparent on the hero section. Transitions to Warm Parchment/Warm Canvas on scroll. TildaSans, 500 weight, 15px labels. Active link: Burnished Ochre. Hover: color shift, no underline bars.
- **Mobile:** Full-width drawer at `max-width: 300px`, Warm Canvas background, `shadow-xl`. Slides in from the right. Submenus use indentation and spacing — no decorative side-stripe borders.
- **Affix/scroll-to-top:** Fixed position, appears after scrolling. Warm Canvas background, Burnished Ochre icon. 48px minimum touch target.

### Scroll Reveal (Signature Component)

Content enters on IntersectionObserver trigger with `translateY(20px → 0)` and `opacity(0 → 1)`. Duration: 600ms ease-out-expo. Grid children stagger at 100ms delay per item. On `prefers-reduced-motion`: no transform, opacity snaps directly to 1. This component appears on every major content section — it is the primary motion vocabulary of the system.

### Progress Indicator Pills

Used in carousels and modal image galleries. Inactive: Warm Stone fill, 8px diameter (`h-2 w-2`). Active: Burnished Ochre Light fill, stretched to 32px width (`h-2 w-8`). Transition: 200ms ease-out-quart. The stretch is the signal; the color alone is not enough.

## 6. Do's and Don'ts

### Do:

- **Do** use Burnished Ochre only on interactive actions (buttons, active indicators, tints at 10% opacity for callouts). Its restraint is what makes it meaningful.
- **Do** tint every neutral: minimum `chroma 0.003` at hue 81. Before committing any gray value, verify it is warm.
- **Do** let Circe carry heading authority and TildaSans carry everything else. The register distinction is structural.
- **Do** use section background alternation (Warm Parchment/Warm Canvas) to create page rhythm before reaching for dividers, shadows, or decorative elements.
- **Do** keep Cyrillic body text at generous line-height (1.75 minimum) and column widths under 75ch. Russian compound words run long; the text needs room.
- **Do** honor `prefers-reduced-motion`: the Scroll Reveal action must check `matchMedia` and skip transforms when the preference is set.
- **Do** replace any side-stripe border accent (`border-left > 1px` as color) with a background tint (`bg-primary/10 rounded-lg px-5 py-3`).
- **Do** make all interactive touch targets 44×44px minimum on mobile.

### Don't:

- **Don't** use pastel blues, greens, teals, or purples. These are the generic therapy site palette and directly undermine the brand register. If a color reads as "healthcare" or "wellness app," it is wrong.
- **Don't** use Headspace/Calm aesthetics: soothing blob shapes, purple gradients, mindfulness-subscription polish. This is a practice, not a product category.
- **Don't** use startup landing page patterns: hero metric callouts, social-proof carousels, gradient CTAs, testimonial sliders. The audience has learned to distrust these.
- **Don't** use old-school clinical aesthetics: dark navy, cold white, formal serif body text, sterile distance. The design should feel like a peer, not an institution.
- **Don't** use zero-chroma neutrals (`oklch(L 0 0)`, pure CSS gray values). They break the warmth that runs through the whole system.
- **Don't** use gradient text (`background-clip: text` with gradient fill). Ever.
- **Don't** use decorative `border-left` or `border-right` stripes greater than 1px as colored accents on cards, callouts, or list items. Rewrite with background tints.
- **Don't** add motion that exists to entertain rather than orient. Scroll animations here have a functional purpose (progressive disclosure); adding choreography for its own sake violates "evidence over aesthetics."
- **Don't** add components that perform expertise — badges, trust seals, "verified" chips. The content earns trust; the design should not try to shortcut it.

# Hardcoded Pages and Block Structure Analysis Report

## Executive Summary

This SvelteKit application has a **hybrid content management approach** with:
- **Frontend-hardcoded section components** for static page layouts
- **Dynamic database-driven content** via PageContentService
- **Reusable block/section components** that combine static structure with dynamic content
- **Data files** that provide fallback content and configuration

---

## 1. MAIN PAGES FOUND

### Public Pages (User-Facing)

1. **Home Page** (`/`)
   - Route: `/src/routes/+page.svelte`
   - Uses: `MainGrid.svelte` component
   - Layout: Complex multi-section layout

2. **SOS/Crisis Page** (`/sos`)
   - Route: `/src/routes/sos/+page.svelte`
   - Hero + Contact cards grid
   - Emergency contact information

3. **Online Therapy/How We Work Page** (`/online-therapy`)
   - Route: `/src/routes/online-therapy/+page.svelte`
   - Hero + Text blocks with FAQ-style layout
   - Terms and conditions for therapy

4. **For Doctors Page** (`/for-doctors`)
   - Route: `/src/routes/for-doctors/+page.svelte`
   - Hero + About section + Problems cards + Requests cards + Exclusions list + Contact info

5. **Surveys Page** (`/surveys`)
   - Route: `/src/routes/surveys/+page.svelte`
   - Hero + Categorized survey cards
   - Links to individual surveys

6. **Articles Page** (`/articles`)
   - Route: `/src/routes/articles/+page.svelte`
   - Hero + Article card grid
   - Pulls from database

7. **Dynamic Code Page** (`/[code]`)
   - Route: `/src/routes/[code]/+page.svelte`
   - Feedback/Current State forms
   - Used for client-specific URLs

### Admin Pages
- `/admin` - Admin dashboard
- `/admin/profile` - Profile management
- `/admin/edit-profile` - Edit profile
- `/admin/manage-records` - Records management
- `/admin/articles` - Manage articles
- `/admin/surveys` - Manage surveys
- `/admin/pages` - Manage page content
- `/admin/record` - Create/edit records

### Other Pages
- `/login` - Authentication
- `/canvas` - Canvas/whiteboard feature
- `/articles/[uri]` - Individual article pages
- `/surveys/*` - Individual survey pages (phq9, gad7, bat4, bat12, bat23, cpq, psi, ips)

---

## 2. BLOCK/SECTION STRUCTURE BY PAGE

### A. HOME PAGE (`/`)

**Components Used:**
- `Hero.svelte` - Fixed hardcoded hero section
- `IssuesList.svelte` - "What I help with" card grid
- `AboutSection.svelte` - About me section with cards
- `ConsultationInfo.svelte` - Consultation details box
- `Education.svelte` - Expandable education accordion
- `Faq.svelte` - FAQ accordion

**Block Structure:**
```
1. HERO (Fixed)
   - Title: "Психолог Андрей Калмыков"
   - Subtitle: Dynamic text from content
   - Layout: Grid with mobile/desktop variants

2. IMAGE + TEXT HERO (Alternating)
   - Two columns: Image | Text (mobile responsive)
   - Image 1 + Text paragraphs + Image 2 pattern
   - Reveal animations

3. ISSUES LIST (Grid Cards)
   - 4 cards in responsive grid (1-2 cols)
   - Card structure: Icon + Title + Bullet points
   - Cards: Emotional difficulties, Work, Self-relations, Relations with others

4. ABOUT SECTION (Asymmetric Grid)
   - Grid: 1, 10, 10, 14 col spans
   - Card structure: Icon + Highlight text + Description
   - Alternating card sizes

5. CONSULTATION INFO
   - Centered box with 3 items:
     - Price (icon + text)
     - Format (icon + text)
     - Duration (icon + text)
   - Book button CTA

6. EDUCATION (Collapsible)
   - Categories (Main education, Approaches, Specializations, Conferences, Other courses)
   - Timeline-style layout
   - Diploma modal popups

7. FAQ (Collapsible)
   - Accordion items with questions/answers
   - Markdown link support
```

**Data Management:**
- Content data from: `/src/lib/data/content.ts`
- Fallback defaults from: PageContentService defaults
- Database override: `pageSlug: 'home'`

---

### B. SOS PAGE (`/sos`)

**Components Used:**
- `HeroBackground.svelte` - Background overlay
- Native HTML grid for contact cards

**Block Structure:**
```
1. HERO SECTION
   - Title: "Экстренная помощь" (Emergency Help)
   - Subtitle: Crisis instruction text
   - Dark overlay with text in white

2. CONTACT CARDS GRID
   - Responsive grid: 1 col (mobile) → 3 cols (desktop)
   - Card structure: Title | Phone link
   - 6 emergency contact cards
   - Layout classes: gap-4, min-h-[220px], bg-[#F2F0EF]
```

**Data Source:**
- Hard-coded in: `defaultPageContents.sos.contacts`
- Can be overridden in database with `pageSlug: 'sos'`

---

### C. ONLINE THERAPY PAGE (`/online-therapy`)

**Components Used:**
- `HeroBackground.svelte` - Background
- Native HTML sections for blocks

**Block Structure:**
```
1. HERO SECTION
   - Title: "Как мы будем работать"
   - Subtitle: Therapy description (with optional secondary subtitle)

2. TEXT BLOCKS (Sequential)
   - 15 titled blocks total:
     1. "С чего начать" (Getting started)
     2. "Где проходит сессия" (Where sessions happen)
     3. "Что происходит на сессии" (What happens)
     4. "Продолжительность сессии" (Duration)
     5. "Частота встреч" (Frequency)
     6. "Запись на сессию" (Booking)
     7. "Оплата и стоимость" (Payment)
     8. "Опоздания и переносы" (Tardiness)
     9. "Конфиденциальность" (Confidentiality)
     10. "Нейтральность и принятие" (Neutrality)
     11. "Этические принципы" (Ethics)
     12. "Длительность работы" (Duration of work)
     13. "Отпуск" (Vacation)
     14. "Завершение работы" (Ending therapy)
     15. "Обратная связь" (Feedback)
   
   - Each block: `.subtitle` title + multi-paragraph content
   - Content supports markdown links
```

**Data Source:**
- Hardcoded in: `/src/lib/data/online-therapy.ts`
- Type: `BlockProps[]` with `title` and `data: string[]`
- Database fallback with `pageSlug: 'online-therapy'`

---

### D. FOR-DOCTORS PAGE (`/for-doctors`)

**Components Used:**
- `HeroBackground.svelte`
- `ImageWithShadow.svelte` - Profile image
- `Education.svelte` - Education section
- `MarkdownLink.svelte` - Formatted text links

**Block Structure:**
```
1. HERO SECTION
   - Title: "Эффективное взаимодействие психолога с врачом"
   - Subtitle: Professional collaboration description
   - Mobile/desktop layout variants

2. IMAGE + TEXT SECTION
   - 2-column grid (image | text) alternating pattern
   - Mobile stacks vertically
   - Responsive image sizes (320x285px mobile, 505x720px desktop)

3. ABOUT TEXT
   - Multiple paragraphs
   - Can have custom formatting

4. PROBLEMS SECTION
   - Title: "какие проблемы психологи помогают решить врачам"
   - Cards grid with irregular col-spans
   - Card structure: Icon + Highlight text + Description
   - 5 problem cards with varied widths (col-span-24, col-span-10, col-span-14)

5. REQUESTS SECTION
   - Title: "основные группы запросов..."
   - 2-column responsive grid
   - Card structure: Theme (title) + Bullet point list
   - 4 request groups

6. EXCLUSIONS SECTION
   - Title: "с чем я не работаю"
   - Single box container
   - Bullet point list
   - Styling: max-w-[600px], rounded, bg-[#F2F0EF]

7. CONTACT SECTION
   - Explanation text
   - Phone + icons
   - Telegram link
   - Conditions link
```

**Data Source:**
- Default content in: PageContentService defaults
- Database override with `pageSlug: 'for-doctors'`

---

### E. SURVEYS PAGE (`/surveys`)

**Components Used:**
- `HeroBackground.svelte`
- `Card.svelte` UI component (reusable)

**Block Structure:**
```
1. HERO SECTION
   - Title: "Опросники" (Questionnaires)
   - Subtitle: Self-diagnostic description

2. SURVEY CATEGORIES SECTION
   - Multiple category groups:
     - "Депрессия и тревожность" (2 surveys)
     - "Перфекционизм" (1 survey)
     - "Прокрастинация" (2 surveys)
     - "Профессиональное выгорание" (3 surveys)
   
   - Per category: 
     - Category title (h2)
     - Card grid (1 col mobile → 2 cols desktop)
     - Each card: Title + Description + "Читать" link

   - Card structure (reusable Card component):
     - Title (h3)
     - Description text
     - Link with icon
     - Hover effects
```

**Data Source:**
- Hardcoded in: `/src/lib/data/content.ts` - `surveyCategories`
- Type: `Category[]` with `category` name and `surveys: Survey[]`

---

### F. ARTICLES PAGE (`/articles`)

**Components Used:**
- `HeroBackground.svelte`
- `Card.svelte` UI component
- Database fetching via server

**Block Structure:**
```
1. HERO SECTION
   - Title: "Статьи" (Articles)
   - Subtitle: Psychology articles description

2. ARTICLES GRID
   - Responsive grid (1 col mobile → 2 cols desktop)
   - Gap: sm:gap-6 lg:gap-8
   - Cards sourced from database
   - Per article card:
     - Title
     - Description
     - Link to /articles/[uri]
     - CTA button: "Читать"
```

**Data Source:**
- Fetched from database (not hardcoded)
- Via `+page.server.ts` → PageContentService

---

## 3. COMMON UI PATTERNS & REUSABLE COMPONENTS

### A. Card Component Patterns

**Pattern 1: Title + List Cards (Issues, About)**
```svelte
<div class="rounded-lg bg-[#F2F0EF] p-6">
  <h4 class="text-lg font-semibold text-[#191919] mb-4">{title}</h4>
  <ul class="flex flex-col gap-2.5 lg:gap-3.5">
    {#each items as item}
      <li class="flex items-center gap-3">
        <span>—</span>
        <p>{item}</p>
      </li>
    {/each}
  </ul>
</div>
```

**Pattern 2: Icon + Highlight + Text Cards (About, Problems)**
```svelte
<div class="rounded-lg bg-[#F2F0EF] p-6 flex flex-col justify-between h-full">
  <div>
    <span class="icon-[lucide--{icon}] h-6 w-6 mb-4"></span>
    <h4 class="text-lg font-semibold text-[#191919]">{highlight}</h4>
  </div>
  <p class="leading-relaxed text-[#191919]">{text}</p>
</div>
```

**Pattern 3: Link Cards (Surveys, Articles)**
```svelte
<a href={link} class="group block h-full rounded-lg">
  <div class="h-full flex flex-col justify-between p-6 bg-[#F2F0EF] rounded-lg">
    <div>
      <h3 class="text-xl font-semibold mb-2">{title}</h3>
      <p class="text-gray-600 leading-relaxed">{description}</p>
    </div>
    <div class="flex items-center gap-2 text-[#B8A98A] font-medium mt-4">
      <span>{todo}</span>
      <span class="icon-[lucide--arrow-up]"></span>
    </div>
  </a>
</a>
```

### B. Grid Layout Patterns

**Pattern 1: Responsive Simple Grid**
```css
grid-cols-1 gap-4 
sm:grid-cols-2 
md:grid-cols-2 
lg:grid-cols-2
lg:gap-8
```

**Pattern 2: Asymmetric Grid (About Section)**
```css
md:grid-cols-24 
/* Cards use irregular col-spans:
   col-span-1 md:col-span-14  (full width)
   col-span-1 md:col-span-10  (half width)
   col-span-1 md:col-span-10  (half width)
   col-span-1 md:col-span-14  (full width)
*/
```

**Pattern 3: Flexible Grid**
```css
grid-cols-1 gap-4 
px-5 
md:grid-cols-2 
md:px-0
```

### C. Section Container Pattern

All main page sections follow this pattern:
```svelte
<div class="mx-auto flex max-w-[720px] flex-col items-center gap-10 md:max-w-[960px] lg:max-w-[1200px]">
  <!-- Optional title -->
  <h3 class="subtitle">{title}</h3>
  
  <!-- Content grid/cards -->
  <div class="grid w-full grid-cols-1 gap-4 px-5 md:grid-cols-X md:px-0">
    <!-- Cards/Items -->
  </div>
</div>
```

### D. Hero Section Pattern

All pages with hero use:
```svelte
<section data-hero class="relative min-h-[30vh] overflow-hidden bg-cover bg-center text-gray-100">
  <HeroBackground />
  <div class="absolute z-0 h-full w-full bg-gradient-to-b from-black/25 from-0% via-black/65 via-40% to-black/65"></div>
  
  <!-- Mobile layout (lg:hidden) -->
  <div class="container mx-auto mt-10 max-w-[720px] px-5 lg:hidden">
    <!-- Mobile grid layout -->
  </div>
  
  <!-- Desktop layout (hidden lg:grid) -->
  <div class="hidden lg:grid grid-cols-12 grid-rows-12 gap-4">
    <!-- Desktop grid layout -->
  </div>
</section>
```

### E. Common Styling Classes

**Color Palette:**
- Background cards: `bg-[#F2F0EF]` (light beige)
- Icon/accent: `text-[#B8A98A]` (tan)
- Text: `text-[#191919]` (dark gray)
- Links: Default/primary

**Typography:**
- Titles: `.subtitle` class (custom defined)
- Main title: `font-[family-name:var(--font-circe)]` (Circe font)
- Text sizing: text-base/lg/xl/2xl with responsive variants

**Spacing:**
- Container padding: `px-5` (mobile) → removed (desktop)
- Gap patterns: `gap-4`, `gap-2.5 lg:gap-3.5`, `gap-10`
- Section margin: `mt-10`, `my-10`

### F. Reveal Component (Animation)

Used throughout for scroll-in animations:
```svelte
<Reveal>
  <div>Content with fade-in animation</div>
</Reveal>

<Reveal axis="x">
  <div>Content with slide animation</div>
</Reveal>
```

---

## 4. SHARED COMPONENTS IDENTIFIED

### Layout Components
- `Header.svelte` - Top navigation
- `Footer.svelte` - Bottom footer
- `MainGrid.svelte` - Main page layout orchestrator
- `Affix.svelte` - Floating element

### Section Components (Reusable across pages)
- `Hero.svelte` - Hero section with gradient overlay
- `IssuesList.svelte` - Card grid for issue/problem lists
- `AboutSection.svelte` - About section with asymmetric cards
- `ConsultationInfo.svelte` - Consultation details box
- `Education.svelte` - Expandable education timeline
- `Faq.svelte` - FAQ accordion
- `MarkdownLink.svelte` - Formatted text with markdown link support

### UI Components (shadcn-svelte)
- `Card.svelte` - Generic card component
- `Button.svelte` - Button component
- `Checkbox.svelte` - Checkbox input
- Various form components

### Utility Components
- `HeroBackground.svelte` - Hero background image
- `ImageWithShadow.svelte` - Image with drop shadow
- `Reveal.svelte` - Scroll reveal animation wrapper
- `TelegramBanner.svelte` - Telegram CTA banner
- `DiplomaModal.svelte` - Modal for diploma images
- `AccordionItem.svelte` - Accordion item wrapper

---

## 5. DATA STRUCTURE & CONTENT MANAGEMENT

### PageContent Service Architecture

**Database Table: `PageContent`**
```sql
- id: UUID (primary key)
- pageSlug: string (e.g., 'home', 'sos', 'for-doctors')
- sectionKey: string (e.g., 'seo', 'hero', 'blocks', 'contacts')
- content: JSONB (flexible content storage)
- sortOrder: integer (for ordering sections)
- isActive: boolean (enable/disable)
- createdAt, updatedAt: timestamps
```

**Unique Index:** `(pageSlug, sectionKey)` - ensures one content block per section per page

### Content Interfaces (TypeScript)

Key interfaces defined in `page-content.server.ts`:

```typescript
- SeoContent { title, description, ogImage }
- HeroContent { title, subtitle, subtitleSecondary, backgroundImage }
- TextBlockContent { text, gridClass }
- CardContent { theme, highlight, text, icon, points, gridClass }
- SectionContent { title, subtitle, items[], containerClass, gridClass }
- OnlineTherapyBlockContent { title, data: string[] }
```

### Data Loading Pattern

All pages use the same pattern:

```typescript
// +page.server.ts
export const load: PageServerLoad = async () => {
  const dbContent = await pageContentService.getPageContent('page-slug');
  const content = getPageContentWithDefaults('page-slug', dbContent);
  return { content };
};
```

**Merging Strategy:**
1. Database content overrides defaults
2. Defaults filled for missing keys
3. Additional DB content included
4. Result passed to page component as `data.content`

### Default Content Files

**Location:** `page-content.server.ts` - `defaultPageContents` object

**Pages with defaults:**
- `home` - Comprehensive defaults for all sections
- `online-therapy` - All 15 block defaults
- `for-doctors` - Problems, requests, exclusions
- `sos` - Contact list defaults
- `articles` - SEO + hero defaults
- `surveys` - SEO + hero defaults

### Static Data Files

**Location:** `/src/lib/data/`

- `content.ts` - Issue groups, about items, consultation info, survey categories, contacts
- `faq.ts` - FAQ items for home page
- `education.ts` - Education groups, timeline items, diploma images
- `online-therapy.ts` - Block definitions (imported but not used since data comes from defaults)
- `navigation.ts` - Navigation links, social links

---

## 6. SIMILARITIES & DIFFERENCES BETWEEN PAGES

### Similarities Across ALL Pages

1. **Hero Section**
   - All pages have: `data-hero` section
   - Background overlay: `bg-gradient-to-b from-black/25... to-black/65`
   - Mobile/desktop layout split (lg breakpoint)
   - Grid-based positioning

2. **Container Pattern**
   - `container mx-auto` with max-width tiers
   - Mobile: `max-w-[720px] px-5`
   - Desktop: `max-w-[960px/1200px] px-0`

3. **Content Loading**
   - All use `+page.server.ts` with PageContentService
   - All merge defaults with DB content
   - All pass content via `data` prop

4. **Card Styling**
   - Consistent: `bg-[#F2F0EF]`, `rounded-lg`, `p-6`
   - Consistent gap patterns

### Differences by Page Type

| Aspect | Home | SOS | Online Therapy | For-Doctors | Surveys | Articles |
|--------|------|-----|-----------------|------------|---------|----------|
| **Sections** | 7+ | 2 | 2 | 6+ | 2 | 2 |
| **Content Type** | Mixed static/component | Lists | Text blocks | Mixed cards/text | Card grid | Card grid |
| **Data Source** | Component + content.ts | Defaults | File + defaults | Defaults | content.ts | Database |
| **Complexity** | High | Low | Medium | High | Medium | Low |
| **Dynamic Content** | Partial | No | Rarely | No | Yes* | Yes |
| **Card Styles** | Multiple | Basic | N/A | Multiple | Uniform | Uniform |
| **Animations** | Reveal enabled | None | None | Reveal enabled | None | None |

*Hardcoded data, but editable via database

---

## 7. ABSTRACTION OPPORTUNITIES & PATTERNS

### Currently Hardcoded but Could Be Component Props

1. **Section Title Classes**
   - Currently: Direct HTML with `.subtitle` class
   - Could abstract: `<SectionTitle {title} />`

2. **Container Wrappers**
   - Currently: Repeated max-width/padding patterns
   - Could abstract: `<Container {maxWidth} {children} />`

3. **Card Grid Layouts**
   - Currently: Multiple inline grid patterns
   - Could abstract: `<CardGrid {cols} {gap} {children} />`

4. **Hero Section**
   - Currently: Repeated structure across pages
   - Could abstract: `<PageHero {title} {subtitle} {backgroundImage} />`

### Block Structure for Pages

All pages follow a pattern that could be generalized:

```svelte
<!-- Generic page structure -->
<PageHero {heroContent} />

{#each sections as section}
  <Section {section}>
    {#each section.blocks as block}
      <Block {block} />
    {/each}
  </Section>
{/each}
```

This would allow fully dynamic pages where sections and blocks are defined in the database.

---

## 8. CURRENT HARDCODED ELEMENTS

### Pages with Hardcoded Components
- **Home** - Component structure (IssuesList, AboutSection, etc.) is hardcoded
- **Online Therapy** - Uses component structure but could use dynamic blocks
- **For-Doctors** - Specific sections hardcoded

### Pages with Hardcoded Data
- **Surveys** - Categories and survey list (from `content.ts`)
- **Articles** - Titles/descriptions (from database, but structure is fixed)
- **FAQ** - All items (from `faq.ts`)
- **Education** - All items (from `education.ts`)

### Pages with Content Service
- **SOS** - Contacts (defaults in page-content.server.ts)
- **Home** - All content can be overridden
- **Online Therapy** - All blocks can be overridden
- **For-Doctors** - All sections can be overridden

---

## 9. ADMINISTRATION/MANAGEMENT INTERFACE

### Page Management (`/admin/pages`)
- Shows all pages managed via PageContentService
- Likely allows editing `sectionKey` content for each page
- Uses database to override defaults

### Content Management Pattern
- Admin interface edits database pageContent table
- Frontend loads from database first
- Falls back to hardcoded defaults if not in database
- No need to redeploy for content changes (for managed sections)

---

## 10. RECOMMENDATIONS FOR EXPANSION

### If More Pages Are Needed
1. Create new `/src/routes/new-page/+page.svelte`
2. Create `/src/routes/new-page/+page.server.ts` with PageContentService
3. Add defaults to `defaultPageContents` object
4. Sections will be editable via admin interface

### For Fully Dynamic Pages
1. Create a generic page handler that queries PageContent by slug
2. Dynamically render sections based on `sectionKey` and block types
3. Add block type registry in database (hero, cards, text, etc.)
4. Map block types to components

### For Better Reusability
1. Extract section wrappers into proper components
2. Create block component registry
3. Define page composition in database instead of hardcoding

---

## Summary Table

| Page | Primary Block Type | Sections | Data Source | Editable |
|------|--------------------|----------|-------------|----------|
| / | Components | 7 | Mixed | Partial |
| /sos | Contact cards | 2 | Defaults | Yes |
| /online-therapy | Text blocks | 2 | Defaults | Yes |
| /for-doctors | Mixed cards | 6+ | Defaults | Yes |
| /surveys | Card grid | 2 | Static file | No |
| /articles | Card grid | 2 | Database | Yes |


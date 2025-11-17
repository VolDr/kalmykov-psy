# Уникальные компоненты, которые НЕ выносятся

Эти компоненты имеют специфическую логику или контент, который делает их уникальными и не подходящими для переиспользования.

---

## 1. Hero.svelte (Главная страница)

**Путь:** `src/lib/components/sections/Hero.svelte`

**Причина невыноса:**
- Захардкоженный текст "Психолог Андрей Калмыков"
- Уникальная двухстрочная структура заголовка с разным позиционированием
- Специфичный grid layout (grid-cols-5 grid-rows-2 для мобильной версии)
- Текст hero специфичен для главной страницы и не параметризуется

**Что делает его уникальным:**
```svelte
<h1 class="row-start-3 col-start-1 col-end-4">Психолог</h1>
<h1 class="row-start-4 col-start-1 col-end-6">Андрей Калмыков</h1>
```

---

## 2. Education.svelte

**Путь:** `src/lib/components/sections/Education.svelte`

**Причина невыноса:**
- Сложная логика аккордеона с управлением состоянием открытия/закрытия
- Интеграция с DiplomaModal для просмотра дипломов
- Специфическая структура данных (категории образования, timeline)
- Уникальная визуализация временной шкалы
- Состояние `isOpen` передается извне

**Что делает его уникальным:**
- Группировка по категориям (Основное образование, Подходы, Специализации и т.д.)
- Timeline-визуализация с точками и линиями
- Модальное окно для дипломов
- Сложная логика раскрытия/скрытия

---

## 3. Faq.svelte

**Путь:** `src/lib/components/sections/Faq.svelte`

**Причина невыноса:**
- Специфическая структура FAQ (вопрос-ответ)
- Интеграция с AccordionItem компонентом
- Данные импортируются из `faq.ts`
- Уникальная логика аккордеона с одним открытым элементом
- Поддержка markdown ссылок в ответах

**Что делает его уникальным:**
- AccordionItem wrapper для каждого вопроса
- Markdown поддержка в ответах через MarkdownLink
- Специфичная структура данных faqItems

---

## 4. ConsultationInfo.svelte

**Путь:** `src/lib/components/sections/ConsultationInfo.svelte`

**Причина невыноса:**
- Уникальный layout с тремя элементами (цена, формат, длительность)
- Специфичные иконки для каждого элемента
- Интеграция с BookButton
- Фиксированная структура контента

**Что делает его уникальным:**
- Три конкретных поля: price, format, duration
- Специфические иконки: banknote, video, clock
- CTA кнопка записи

---

## 5. AboutSection.svelte

**Путь:** `src/lib/components/sections/AboutSection.svelte`

**Причина невыноса:**
- **БАГ:** Данные дублированы внутри компонента (`export const items = [...]`), хотя должны приходить из PageContentService
- Специфический grid с 24 колонками и асимметричными col-span
- Уникальная иконка маппинг логика внутри компонента
- Жёстко заданный заголовок "обо мне"

**Что делает его уникальным:**
```javascript
// БАГ: Эти данные дублируют defaultPageContents.home.aboutSection в page-content.server.ts
export const items = [
  { icon: 'briefcase', highlight: 'опыт в IT', text: '...', gridClass: 'col-span-1 md:col-span-14' },
  // ...
];
```

**Рекомендация:**
1. Удалить захардкоженные данные из компонента
2. MainGrid должен получать данные из PageContentService через props (как другие страницы)
3. Компонент должен только рендерить переданные данные

---

## 6. IssuesList.svelte

**Путь:** `src/lib/components/sections/IssuesList.svelte`

**Причина ЧАСТИЧНОГО невыноса:**
- Захардкоженный заголовок внутри компонента
- Специфический Reveal wrapper
- Фиксированный текст вступления

**Можно вынести:** Карточки (уже создан ListCard)
**Нельзя вынести:** Заголовки и вступительный текст

---

## 7. Специфичные SEO блоки

**Страницы:** surveys, articles

**Причина невыноса:**
- Уникальные keywords для каждой страницы
- Canonical URLs
- Twitter Card специфика
- Open Graph теги с уникальными значениями

---

## 8. Контактная секция (for-doctors)

**Путь:** В `src/routes/for-doctors/+page.svelte`

**Причина невыноса:**
- Комбинация телефона, Telegram и условий работы
- Специфические иконки и MarkdownLink интеграция
- Уникальный layout с несколькими типами контактов

---

## ⚠️ ВАЖНО: MainGrid.svelte требует рефакторинга

**Путь:** `src/lib/components/layout/MainGrid.svelte`

**Проблема:**
MainGrid использует **устаревшие данные** из `src/lib/data/content.ts`:
```javascript
import { issueGroups, aboutItems, consultationInfo } from '$lib/data/content';

<IssuesList items={issueGroups} />
<AboutSection items={aboutItems} />
<ConsultationInfo {...consultationInfo} />
```

**Но должен использовать данные из PageContentService:**
В `defaultPageContents.home` уже есть:
- `issuesSection.items` - для IssuesList
- `aboutSection.items` - для AboutSection
- `consultationInfo` - для ConsultationInfo
- `aboutIntro` - для блоков фото+текст

**Рекомендация:**
1. MainGrid должен принимать `content` как prop из `+page.svelte`
2. Передавать данные из `content` в дочерние компоненты
3. Удалить импорты из `content.ts`
4. Это позволит редактировать главную страницу через админку

---

## Общие причины невыноса:

1. **Захардкоженный контент** - текст/данные внутри компонента
2. **Сложная состоянийная логика** - аккордеоны, модалки
3. **Специфические интеграции** - DiplomaModal, BookButton
4. **Уникальный layout** - grid с 24 колонками, асимметричные spans
5. **Специфическая бизнес-логика** - FAQ, Education timeline

---

## Рекомендации по улучшению:

1. **AboutSection** - вынести данные в `content.ts`, сделать компонент параметризованным
2. **IssuesList** - вынести заголовки в props
3. **Education** - создать универсальный AccordionSection компонент
4. **FAQ** - сделать generic Accordion компонент
5. **ConsultationInfo** - можно параметризовать, но специфичен для сайта психолога

---

## Что МОЖНО вынести (уже сделано):

✅ PageHero - универсальный hero для всех страниц кроме главной
✅ ImageTextBlock - блок фото+текст (left/right)
✅ SectionContainer - обертка секции с заголовком
✅ CardGrid - настраиваемая сетка карточек
✅ ListCard - карточка со списком пунктов
✅ IconCard - карточка с иконкой и текстом
✅ ContactCard - карточка контакта (SOS)
✅ TextBlockSection - секция текстовых блоков (online-therapy)

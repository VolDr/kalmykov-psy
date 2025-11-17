# Переиспользуемые блоки страниц

Библиотека компонентов для построения страниц сайта. Каждый компонент сохраняет точную стилизацию оригинальных страниц.

## Импорт

```svelte
<script>
	import {
		PageHero,
		ImageTextBlock,
		SectionContainer,
		CardGrid,
		TextBlockSection,
		ListCard,
		IconCard,
		ContactCard
	} from '$lib/components/blocks';
</script>
```

---

## PageHero

Hero секция с фоновым изображением и градиентом. Используется на всех страницах кроме главной.

### Props

| Prop                | Тип                    | По умолчанию | Описание                                              |
| ------------------- | ---------------------- | ------------ | ----------------------------------------------------- |
| `title`             | `string`               | required     | Заголовок страницы                                    |
| `subtitle`          | `string`               | required     | Подзаголовок                                          |
| `subtitleSecondary` | `string`               | `''`         | Дополнительный подзаголовок                           |
| `maxWidth`          | `'sm' \| 'md' \| 'lg'` | `'lg'`       | Максимальная ширина (960px / 1200px)                  |
| `titleLineHeight`   | `'tight' \| 'relaxed'` | `'relaxed'`  | Межстрочный интервал заголовка                        |
| `subtitleRowStart`  | `'8' \| '9'`           | `'8'`        | Позиция subtitle в grid (row-start-8 или row-start-9) |

### Пример использования

```svelte
<PageHero
	title="Как мы будем работать"
	subtitle="Здесь собрана важная информация о консультациях"
	subtitleSecondary="Пожалуйста, прочитайте внимательно"
	maxWidth="sm"
	titleLineHeight="tight"
/>
```

### Заменяет код в

- `/sos/+page.svelte` - строки 25-61
- `/online-therapy/+page.svelte` - строки 24-71
- `/for-doctors/+page.svelte` - строки 25-63
- `/surveys/+page.svelte` - строки 40-79
- `/articles/+page.svelte` - строки 37-76

---

## ImageTextBlock

Блок с изображением и текстом. Поддерживает расположение фото слева или справа.

### Props

| Prop          | Тип                             | По умолчанию   | Описание                    |
| ------------- | ------------------------------- | -------------- | --------------------------- |
| `image`       | `ImageProps`                    | required       | Данные изображения          |
| `layout`      | `'image-left' \| 'image-right'` | `'image-left'` | Расположение изображения    |
| `paragraphs`  | `string[]`                      | `[]`           | Массив параграфов текста    |
| `textContent` | `Snippet`                       | `undefined`    | Кастомный контент (snippet) |
| `withReveal`  | `boolean`                       | `false`        | Анимация появления          |

### ImageProps

```typescript
interface ImageProps {
	src: string;
	srcSmall?: string;
	alt: string;
	imgClass?: string;
}
```

### Примеры использования

**Простой вариант с массивом параграфов:**

```svelte
<ImageTextBlock
	image={{
		src: '/1.webp',
		srcSmall: '/1_small.webp',
		alt: 'Андрей',
		imgClass: 'h-[320px] w-[285px] lg:h-[720px] lg:w-[505px]'
	}}
	layout="image-left"
	paragraphs={['Первый параграф текста.', 'Второй параграф текста.', 'Третий параграф текста.']}
/>
```

**С Reveal анимацией:**

```svelte
<ImageTextBlock
	image={{
		src: '/2.webp',
		srcSmall: '/2_small.webp',
		alt: 'Психолог'
	}}
	layout="image-right"
	paragraphs={content.aboutText}
	withReveal={true}
/>
```

**С кастомным контентом:**

```svelte
<ImageTextBlock image={{ src: '/1.webp', alt: 'Андрей' }} layout="image-left">
	{#snippet textContent()}
		<Reveal>
			<div class="container mx-auto flex flex-col gap-4">
				<p>Кастомный контент с особой разметкой.</p>
				<a href="/link">Ссылка</a>
			</div>
		</Reveal>
	{/snippet}
</ImageTextBlock>
```

### Заменяет код в

- `MainGrid.svelte` - строки 41-127 (два блока фото+текст)
- `/for-doctors/+page.svelte` - строки 67-93

---

## SectionContainer

Обертка для секций с заголовком и настраиваемой шириной.

### Props

| Prop         | Тип                    | По умолчанию | Описание                |
| ------------ | ---------------------- | ------------ | ----------------------- |
| `title`      | `string`               | `''`         | Заголовок секции        |
| `subtitle`   | `string`               | `''`         | Подзаголовок            |
| `maxWidth`   | `'sm' \| 'md' \| 'lg'` | `'lg'`       | Максимальная ширина     |
| `gap`        | `'sm' \| 'md' \| 'lg'` | `'lg'`       | Отступ между элементами |
| `titleAlign` | `'left' \| 'center'`   | `'center'`   | Выравнивание заголовка  |
| `class`      | `string`               | `''`         | Дополнительные классы   |
| `children`   | `Snippet`              | required     | Содержимое секции       |

### Пример использования

```svelte
<SectionContainer
	title="какие проблемы психологи помогают решить врачам"
	titleAlign="left"
	maxWidth="lg"
	gap="lg"
>
	<CardGrid cols="24">
		{#each items as item}
			<IconCard {...item} />
		{/each}
	</CardGrid>
</SectionContainer>
```

### Заменяет код в

- `/for-doctors/+page.svelte` - строки 95-114, 116-148
- `IssuesList.svelte` - строки 10-12

---

## CardGrid

Настраиваемая сетка для карточек.

### Props

| Prop         | Тип                         | По умолчанию | Описание              |
| ------------ | --------------------------- | ------------ | --------------------- |
| `cols`       | `'1' \| '2' \| '3' \| '24'` | `'2'`        | Количество колонок    |
| `gap`        | `'sm' \| 'md' \| 'lg'`      | `'md'`       | Размер отступов       |
| `responsive` | `boolean`                   | `true`       | Адаптивность колонок  |
| `class`      | `string`                    | `''`         | Дополнительные классы |
| `children`   | `Snippet`                   | required     | Содержимое сетки      |

### Варианты колонок

- `'1'` → `grid-cols-1`
- `'2'` → `grid-cols-1 md:grid-cols-2`
- `'3'` → `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- `'24'` → `grid-cols-1 md:grid-cols-24 lg:grid-cols-24` (для асимметричных layouts)

### Пример использования

```svelte
<CardGrid cols="2" gap="lg">
	{#each items as item}
		<ListCard title={item.theme} points={item.points} />
	{/each}
</CardGrid>

<!-- Асимметричная сетка -->
<CardGrid cols="24">
	{#each items as item}
		<IconCard highlight={item.highlight} text={item.text} gridClass={item.gridClass} />
	{/each}
</CardGrid>
```

### Заменяет код в

- `IssuesList.svelte` - строка 21
- `AboutSection.svelte` - строка 51
- `/for-doctors/+page.svelte` - строки 102, 122
- `/sos/+page.svelte` - строка 64

---

## ListCard

Карточка со списком пунктов.

### Props

| Prop         | Тип                    | По умолчанию | Описание                      |
| ------------ | ---------------------- | ------------ | ----------------------------- |
| `title`      | `string`               | required     | Заголовок карточки            |
| `points`     | `string[]`             | required     | Список пунктов                |
| `gridClass`  | `string`               | `''`         | CSS класс для grid (col-span) |
| `minHeight`  | `string`               | `'220px'`    | Минимальная высота            |
| `withReveal` | `boolean`              | `false`      | Анимация появления            |
| `justify`    | `'between' \| 'start'` | `'between'`  | Выравнивание контента         |

### Пример использования

```svelte
<ListCard
	title="Эмоциональные трудности"
	points={['тревога и беспокойство', 'апатия и потеря интереса', 'перепады настроения']}
	gridClass="col-span-1"
	withReveal={true}
/>
```

### Заменяет код в

- `IssuesList.svelte` - строки 23-44
- `/for-doctors/+page.svelte` - строки 124-145

---

## IconCard

Карточка с иконкой, заголовком и описанием.

### Props

| Prop         | Тип       | По умолчанию | Описание                                  |
| ------------ | --------- | ------------ | ----------------------------------------- |
| `icon`       | `string`  | `''`         | Название иконки (briefcase, flask и т.д.) |
| `highlight`  | `string`  | required     | Заголовок                                 |
| `text`       | `string`  | required     | Описание                                  |
| `gridClass`  | `string`  | `''`         | CSS класс для grid                        |
| `minHeight`  | `string`  | `'180px'`    | Минимальная высота                        |
| `withReveal` | `boolean` | `false`      | Анимация появления                        |
| `showIcon`   | `boolean` | `true`       | Показывать иконку                         |

### Доступные иконки

- `briefcase` - портфель
- `book-open` - открытая книга
- `flask` - колба
- `compass` - компас
- `trending-up` - рост
- `clock` - часы
- `lightbulb` - лампочка

### Пример использования

```svelte
<IconCard
	icon="briefcase"
	highlight="опыт в IT"
	text="Знаю специфику цифровых профессий изнутри"
	gridClass="col-span-1 md:col-span-14"
	withReveal={true}
/>

<!-- Без иконки -->
<IconCard
	highlight="Отрицание проблемы"
	text="Пациент не признает наличие психологических трудностей"
	showIcon={false}
	gridClass="col-span-24"
/>
```

### Заменяет код в

- `AboutSection.svelte` - строки 52-66
- `/for-doctors/+page.svelte` - строки 103-112

---

## ContactCard

Карточка контакта для экстренной помощи.

### Props

| Prop        | Тип      | По умолчанию | Описание              |
| ----------- | -------- | ------------ | --------------------- |
| `title`     | `string` | required     | Название службы       |
| `phone`     | `string` | required     | Номер телефона        |
| `link`      | `string` | required     | Ссылка (tel:)         |
| `minHeight` | `string` | `'220px'`    | Минимальная высота    |
| `class`     | `string` | `''`         | Дополнительные классы |

### Пример использования

```svelte
<ContactCard title="Телефон доверия" phone="8-800-2000-122" link="tel:88002000122" />
```

### Заменяет код в

- `/sos/+page.svelte` - строки 65-77

---

## TextBlockSection

Секция текстовых блоков с заголовками (для страницы условий работы).

### Props

| Prop     | Тип           | По умолчанию | Описание      |
| -------- | ------------- | ------------ | ------------- |
| `blocks` | `TextBlock[]` | required     | Массив блоков |

### TextBlock interface

```typescript
interface TextBlock {
	title: string;
	data: string[];
}
```

### Пример использования

```svelte
<TextBlockSection
	blocks={[
		{
			title: 'С чего начать',
			data: ['Напишите мне в Telegram.', 'Мы договоримся о времени первой встречи.']
		},
		{
			title: 'Где проходит сессия',
			data: ['Консультации проходят онлайн через видеосвязь.']
		}
	]}
/>
```

### Заменяет код в

- `/online-therapy/+page.svelte` - строки 75-88

---

## Полный пример страницы

```svelte
<script lang="ts">
	import {
		PageHero,
		ImageTextBlock,
		SectionContainer,
		CardGrid,
		ListCard,
		IconCard
	} from '$lib/components/blocks';

	const heroData = {
		title: 'Заголовок страницы',
		subtitle: 'Описание страницы'
	};

	const aboutText = ['Параграф 1', 'Параграф 2'];

	const issues = [
		{ theme: 'Тема 1', points: ['пункт 1', 'пункт 2'], gridClass: '' },
		{ theme: 'Тема 2', points: ['пункт 3', 'пункт 4'], gridClass: '' }
	];
</script>

<PageHero title={heroData.title} subtitle={heroData.subtitle} />

<div class="flex flex-col gap-10">
	<ImageTextBlock image={{ src: '/1.webp', alt: 'Фото' }} paragraphs={aboutText} />

	<SectionContainer title="С чем я работаю">
		<CardGrid cols="2">
			{#each issues as issue}
				<ListCard title={issue.theme} points={issue.points} withReveal={true} />
			{/each}
		</CardGrid>
	</SectionContainer>
</div>
```

---

## Нюансы и детали

### Сохранение точной стилизации

Все компоненты сохраняют:

- Цвета: `bg-[#F2F0EF]`, `text-[#B8A98A]`, `text-[#191919]`
- Скругления: `rounded-lg`, `rounded-xl`
- Отступы: `p-6`, `gap-4`, `gap-2.5 lg:gap-3.5`
- Типографика: `font-circe`, `text-lg font-semibold`
- Адаптивность: mobile-first подход

### gridClass для асимметричных layouts

При использовании `cols="24"` в CardGrid, каждая карточка должна иметь `gridClass`:

- `col-span-1 md:col-span-14` - широкая карточка
- `col-span-1 md:col-span-10` - узкая карточка
- `col-span-24` - на всю ширину

### Reveal анимации

Компоненты поддерживают `withReveal={true}` для scroll-in анимаций. Это сохраняет точное поведение оригинальных страниц.

### Snippet для кастомного контента

ImageTextBlock поддерживает snippet для случаев, когда нужен сложный контент с особой разметкой (множественные Reveal обертки, специальные ссылки и т.д.).

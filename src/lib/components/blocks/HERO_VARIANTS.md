# Варианты Hero секций

## Сводная таблица отличий

| Страница           | max-width (desktop) | leading | subtitle2 | Структура заголовка    | row-start текста |
| ------------------ | ------------------- | ------- | --------- | ---------------------- | ---------------- |
| **Главная**        | 1400px              | relaxed | Да        | Двухстрочный, grid 5x2 | row-start-8      |
| **SOS**            | 1200px              | relaxed | Нет       | Однострочный           | row-start-8      |
| **For-Doctors**    | 1200px              | relaxed | Нет       | Однострочный           | row-start-9      |
| **Online-Therapy** | 960px               | tight   | Да        | Однострочный           | row-start-8      |
| **Surveys**        | 1200px              | relaxed | Нет       | Однострочный           | row-start-8      |
| **Articles**       | 960px               | tight   | Нет       | Однострочный           | row-start-8      |

---

## 1. ГЛАВНАЯ СТРАНИЦА (Hero.svelte) - **УНИКАЛЬНАЯ**

**Причина уникальности:** Двухстрочный заголовок с особым позиционированием

```svelte
<!-- Mobile: сетка 5x2 -->
<div class="grid min-h-[100px] grid-cols-5 grid-rows-2">
	<h1 class="col-start-1 col-end-4 row-start-3">Психолог</h1>
	<h1 class="col-start-1 col-end-6 row-start-4">Андрей Калмыков</h1>
</div>

<!-- Desktop -->
<div class="max-w-[1400px] grid-cols-12 grid-rows-12">
	<div class="col-start-2 col-end-8 row-start-5">
		<h1>Психолог<br />Андрей Калмыков</h1>
	</div>
	<div class="col-start-2 col-end-7 row-start-8">
		<!-- subtitle -->
	</div>
</div>
```

**Нельзя вынести потому что:**

- Заголовок занимает 2 H1 тега на мобильном
- Уникальная сетка grid-cols-5 grid-rows-2
- Позиционирование col-start-2 (не с 1)
- Максимальная ширина 1400px (больше других)

---

## 2. SOS, SURVEYS - **СТАНДАРТНЫЙ ВАРИАНТ**

```svelte
<div
	class="relative z-10 mx-auto hidden aspect-[1.51] max-w-[720px]
            grid-cols-12 grid-rows-12 gap-4 gap-x-0 pt-14
            leading-relaxed lg:grid lg:max-w-[1200px]"
>
	<div class="col-start-1 col-end-12 row-start-5 row-end-12">
		<h1 class="font-circe text-3xl leading-relaxed lg:text-5xl">
			{content.hero.title}
		</h1>
	</div>

	<div
		class="lg:text-md col-start-1 col-end-12 row-start-8 row-end-11
              flex flex-col gap-4 text-base"
	>
		<p>{content.hero.subtitle}</p>
	</div>
</div>
```

**Особенности:**

- max-width: 1200px
- leading-relaxed на заголовке
- row-start-8 для subtitle
- Без subtitleSecondary

---

## 3. FOR-DOCTORS - **ВАРИАНТ С row-start-9**

```svelte
<div class="lg:max-w-[1200px]">
	<div class="col-start-1 col-end-12 row-start-5 row-end-12">
		<h1 class="leading-relaxed">{content.hero.title}</h1>
	</div>

	<!-- ОТЛИЧИЕ: row-start-9, а не 8! -->
	<div class="col-start-1 col-end-12 row-start-9 row-end-11">
		<p>{content.hero.subtitle}</p>
	</div>
</div>
```

**Особенности:**

- max-width: 1200px
- leading-relaxed
- **row-start-9** (текст ниже)
- Без subtitleSecondary

---

## 4. ONLINE-THERAPY - **ВАРИАНТ С УЗКОЙ ШИРИНОЙ**

```svelte
<div class="lg:max-w-[960px]">
	<!-- Узкий! -->
	<div class="col-start-1 col-end-12 row-start-5 row-end-12">
		<h1 class="leading-tight lg:text-5xl">
			<!-- tight! -->
			{content.hero.title}
		</h1>
	</div>

	<div class="row-start-8 row-end-11 leading-relaxed">
		<p>{content.hero.subtitle}</p>
		{#if content.hero.subtitleSecondary}
			<p>{content.hero.subtitleSecondary}</p>
		{/if}
	</div>
</div>
```

**Особенности:**

- max-width: **960px** (меньше!)
- **leading-tight** на заголовке
- row-start-8
- **С subtitleSecondary**

---

## 5. ARTICLES - **ВАРИАНТ С УЗКОЙ ШИРИНОЙ (без subtitle2)**

```svelte
<div class="lg:max-w-[960px]">
	<!-- Узкий! -->
	<div class="col-start-1 col-end-12 row-start-5 row-end-12">
		<h1 class="leading-tight lg:text-5xl">
			<!-- tight! -->
			{content.hero.title}
		</h1>
	</div>

	<div class="lg:text-md row-start-8 row-end-11 leading-relaxed">
		<p>{content.hero.subtitle}</p>
	</div>
</div>
```

**Особенности:**

- max-width: **960px** (меньше!)
- **leading-tight** на заголовке
- row-start-8
- Без subtitleSecondary

---

## УНИВЕРСАЛЬНЫЙ PageHero КОМПОНЕНТ

Созданный компонент `PageHero.svelte` покрывает варианты 2-5:

```typescript
interface Props {
	title: string;
	subtitle: string;
	subtitleSecondary?: string; // Для online-therapy
	maxWidth?: 'sm' | 'md' | 'lg'; // sm=960px (articles, online-therapy), lg=1200px (sos, surveys, for-doctors)
	titleLineHeight?: 'tight' | 'relaxed'; // tight для articles/online-therapy
}
```

### Примеры использования:

**SOS/Surveys (стандартный):**

```svelte
<PageHero
	title={content.hero.title}
	subtitle={content.hero.subtitle}
	maxWidth="lg"
	titleLineHeight="relaxed"
/>
```

**Online-Therapy (узкий с subtitle2):**

```svelte
<PageHero
	title={content.hero.title}
	subtitle={content.hero.subtitle}
	subtitleSecondary={content.hero.subtitleSecondary}
	maxWidth="sm"
	titleLineHeight="tight"
/>
```

**Articles (узкий без subtitle2):**

```svelte
<PageHero
	title={content.hero.title}
	subtitle={content.hero.subtitle}
	maxWidth="sm"
	titleLineHeight="tight"
/>
```

---

## НЮАНС: row-start-9 в for-doctors

В текущей версии PageHero использует row-start-8. Если нужен row-start-9, можно добавить prop:

```typescript
subtitleRowStart?: '8' | '9';  // default '8'
```

Но это минорное отличие - визуально разница в 1 ряд grid (примерно 20-30px).

---

## ГЛАВНАЯ СТРАНИЦА - НЕ ПОКРЫВАЕТСЯ

Hero.svelte для главной страницы **невозможно** объединить с PageHero из-за:

1. Двухстрочный заголовок (2 отдельных H1 на мобильном)
2. Уникальная grid сетка 5x2
3. Позиционирование col-start-2 (не с 1)
4. Максимальная ширина 1400px

Это уникальный компонент специфичный для главной страницы сайта.

-- Совместный перевод опросников по закрытой ссылке /translate/<token>.
-- Документ хранит пункты оригинала, переводчик заполняет перевод и комментарий,
-- каждый заход и каждая правка пишутся в журнал с IP.
CREATE TABLE IF NOT EXISTS "translation_docs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"title" text NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	-- Указания переводчику: абзацы через пустую строку, **жирный** поддерживается
	"guide" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "translation_docs_token_key" ON "translation_docs" ("token");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "translation_entries" (
	"doc_id" bigint NOT NULL REFERENCES "translation_docs"("id") ON DELETE CASCADE,
	"item_key" text NOT NULL,
	"translation" text DEFAULT '' NOT NULL,
	"comment" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	PRIMARY KEY ("doc_id", "item_key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "translation_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"doc_id" bigint NOT NULL REFERENCES "translation_docs"("id") ON DELETE CASCADE,
	"kind" text NOT NULL CHECK ("kind" IN ('visit', 'edit')),
	"ip" text NOT NULL,
	"user_agent" text,
	"item_key" text,
	"field" text CHECK ("field" IN ('translation', 'comment')),
	"old_value" text,
	"new_value" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "translation_events_doc_idx" ON "translation_events" ("doc_id", "id");
--> statement-breakpoint
-- Первый документ — опросник из «Перевод опросника для переводчика.docx».
-- Токен случайный: 24 hex-символа из двух gen_random_uuid (криптостойкий ГСЧ, ~94 бита,
-- версия uuid в позиции 13 пропущена);
-- посмотреть ссылку: /admin/translations или SELECT token FROM translation_docs.
INSERT INTO "translation_docs" ("token", "title", "items", "guide")
SELECT substr(replace(gen_random_uuid()::text, '-', ''), 1, 12) || substr(replace(gen_random_uuid()::text, '-', ''), 14, 12),
	'Перевод опросника',
	$tr$[
	{
		"key": "instruction",
		"label": "Инструкция",
		"short": "И",
		"group": "Инструкция",
		"source": "Please indicate the extent to which you agree or disagree with each of the following statements"
	},
	{
		"key": "1",
		"label": "Пункт 1",
		"short": "1",
		"group": "Утверждения",
		"source": "I won't do something if I think it will make me uncomfortable"
	},
	{
		"key": "2",
		"label": "Пункт 2",
		"short": "2",
		"group": "Утверждения",
		"source": "If I could magically remove all of my painful memories, I would"
	},
	{
		"key": "3",
		"label": "Пункт 3",
		"short": "3",
		"group": "Утверждения",
		"source": "I tend to put off unpleasant things that need to get done"
	},
	{
		"key": "4",
		"label": "Пункт 4",
		"short": "4",
		"group": "Утверждения",
		"source": "When negative thoughts come up, I try to fill my head with something else"
	},
	{
		"key": "5",
		"label": "Пункт 5",
		"short": "5",
		"group": "Утверждения",
		"source": "Others have told me that I suppress my feelings"
	},
	{
		"key": "6",
		"label": "Пункт 6",
		"short": "6",
		"group": "Утверждения",
		"source": "Even when I feel uncomfortable, I don't give up working toward things I value"
	},
	{
		"key": "7",
		"label": "Пункт 7",
		"short": "7",
		"group": "Утверждения",
		"source": "I avoid activities if there is even a small possibility of getting hurt"
	},
	{
		"key": "8",
		"label": "Пункт 8",
		"short": "8",
		"group": "Утверждения",
		"source": "Happiness means never feeling any pain or disappointment"
	},
	{
		"key": "9",
		"label": "Пункт 9",
		"short": "9",
		"group": "Утверждения",
		"source": "When I have something important to do I find myself doing a lot of other things instead"
	},
	{
		"key": "10",
		"label": "Пункт 10",
		"short": "10",
		"group": "Утверждения",
		"source": "When upsetting memories come up, I try to focus on other things"
	},
	{
		"key": "11",
		"label": "Пункт 11",
		"short": "11",
		"group": "Утверждения",
		"source": "It's hard for me to know what I'm feeling"
	},
	{
		"key": "12",
		"label": "Пункт 12",
		"short": "12",
		"group": "Утверждения",
		"source": "When I am hurting, I still do what needs to be done"
	},
	{
		"key": "13",
		"label": "Пункт 13",
		"short": "13",
		"group": "Утверждения",
		"source": "If I am starting to feel trapped, I leave the situation immediately"
	},
	{
		"key": "14",
		"label": "Пункт 14",
		"short": "14",
		"group": "Утверждения",
		"source": "One of my big goals is to be free from painful emotions"
	},
	{
		"key": "15",
		"label": "Пункт 15",
		"short": "15",
		"group": "Утверждения",
		"source": "I try to put off unpleasant tasks for as long as possible"
	},
	{
		"key": "16",
		"label": "Пункт 16",
		"short": "16",
		"group": "Утверждения",
		"source": "I work hard to keep out upsetting feelings"
	},
	{
		"key": "17",
		"label": "Пункт 17",
		"short": "17",
		"group": "Утверждения",
		"source": "It takes me awhile to realize when I'm feeling bad"
	},
	{
		"key": "18",
		"label": "Пункт 18",
		"short": "18",
		"group": "Утверждения",
		"source": "I don't let pain and discomfort stop me from getting what I want"
	},
	{
		"key": "19",
		"label": "Пункт 19",
		"short": "19",
		"group": "Утверждения",
		"source": "If I am in a slightly uncomfortable situation, I try to leave right away"
	},
	{
		"key": "20",
		"label": "Пункт 20",
		"short": "20",
		"group": "Утверждения",
		"source": "I'd do anything to feel less stressed"
	},
	{
		"key": "21",
		"label": "Пункт 21",
		"short": "21",
		"group": "Утверждения",
		"source": "I won't do something until I absolutely have to"
	},
	{
		"key": "22",
		"label": "Пункт 22",
		"short": "22",
		"group": "Утверждения",
		"source": "When unpleasant memories come to me, I try to put them out of my mind"
	},
	{
		"key": "23",
		"label": "Пункт 23",
		"short": "23",
		"group": "Утверждения",
		"source": "I feel disconnected from my emotions"
	},
	{
		"key": "24",
		"label": "Пункт 24",
		"short": "24",
		"group": "Утверждения",
		"source": "I don't let gloomy thoughts stop me from doing what I want"
	},
	{
		"key": "25",
		"label": "Пункт 25",
		"short": "25",
		"group": "Утверждения",
		"source": "I avoid situations if there is a chance that I'll feel nervous"
	},
	{
		"key": "26",
		"label": "Пункт 26",
		"short": "26",
		"group": "Утверждения",
		"source": "I would give up a lot not to feel bad"
	},
	{
		"key": "27",
		"label": "Пункт 27",
		"short": "27",
		"group": "Утверждения",
		"source": "I try to deal with problems right away"
	},
	{
		"key": "28",
		"label": "Пункт 28",
		"short": "28",
		"group": "Утверждения",
		"source": "When a negative thought comes up, I immediately try to think of something else"
	},
	{
		"key": "29",
		"label": "Пункт 29",
		"short": "29",
		"group": "Утверждения",
		"source": "People have told me that I'm not aware of my problems"
	},
	{
		"key": "30",
		"label": "Пункт 30",
		"short": "30",
		"group": "Утверждения",
		"source": "When working on something important, I won't quit even if things get difficult"
	},
	{
		"key": "option1",
		"label": "Вариант ответа 1",
		"short": "О1",
		"group": "Варианты ответа",
		"source": "Strongly disagree"
	},
	{
		"key": "option2",
		"label": "Вариант ответа 2",
		"short": "О2",
		"group": "Варианты ответа",
		"source": "Moderately disagree"
	},
	{
		"key": "option3",
		"label": "Вариант ответа 3",
		"short": "О3",
		"group": "Варианты ответа",
		"source": "Slightly disagree"
	},
	{
		"key": "option4",
		"label": "Вариант ответа 4",
		"short": "О4",
		"group": "Варианты ответа",
		"source": "Slightly agree"
	},
	{
		"key": "option5",
		"label": "Вариант ответа 5",
		"short": "О5",
		"group": "Варианты ответа",
		"source": "Moderately agree"
	},
	{
		"key": "option6",
		"label": "Вариант ответа 6",
		"short": "О6",
		"group": "Варианты ответа",
		"source": "Strongly agree"
	}
]$tr$::jsonb,
	$guide$Задача — перевести на русский язык инструкцию, 30 утверждений и варианты ответа. Опросник предназначен для взрослых и посвящён тому, как люди обычно обходятся с неприятными мыслями и чувствами.

1. **Переводится смысл, а не слова.** Утверждение должно звучать так, как его сказал бы о себе обычный взрослый человек. Если дословный перевод звучит коряво, нужен естественный вариант.

2. **Простой язык.** Опросник будут заполнять самые разные люди. Каждое утверждение должно быть понятно с первого прочтения, без сложных и книжных слов.

3. **"Маленькие" слова сохраняются.** "Часто", "обычно", "иногда", "очень", "когда", "если", "не" имеют смысл.

4. **Ничего не добавляется и не теряется.** Перестраивать фразу, чтобы она звучала по-русски, можно и нужно. Но смысл должен остаться тем же: без новых деталей и без потерянных. Утверждения остаются от первого лица ("я…"), как в оригинале.

5. **При сомнениях — несколько вариантов.** Можно дать два-три варианта и коротко пояснить разницу в комментарии. Если что-то в оригинале непонятно, это стоит отметить и перевести так, как понятно.

6. **Своими силами.** Без полного машинного перевода. Опросник будут заполнять живые люди, поэтому мне нужен человеческий вариант.$guide$
WHERE NOT EXISTS (SELECT 1 FROM "translation_docs" WHERE "title" = 'Перевод опросника');

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const sourceRoot = process.argv[2] ?? 'C:/Users/Андрей/Documents/посты';
const migrationPath = process.argv[3] ?? 'drizzle/0017_post_analytics_dashboard.sql';
const marker =
	'-- GENERATED POST ANALYTICS SEED. Re-run scripts/generate-post-analytics-seed.mjs to refresh.';

function readWindowValue(fileName) {
	const context = { window: {} };
	vm.createContext(context);
	vm.runInContext(fs.readFileSync(path.join(sourceRoot, 'three', fileName), 'utf8'), context);
	const keys = Object.keys(context.window);
	if (keys.length !== 1)
		throw new Error(`${fileName}: expected one window export, got ${keys.length}`);
	return context.window[keys[0]];
}

function jsonSql(value, tag) {
	const json = JSON.stringify(value);
	const delimiter = `$${tag}$`;
	if (json.includes(delimiter)) throw new Error(`JSON contains SQL delimiter ${delimiter}`);
	return `${delimiter}${json}${delimiter}::jsonb`;
}

const channel = readWindowValue('channel-data.js');
const structures = readWindowValue('structures-data.js');
const expertise = JSON.parse(
	fs.readFileSync(
		path.join(sourceRoot, 'analytics-dashboard', 'src', 'data', 'expertise_plan.json'),
		'utf8'
	)
);
const posts = channel.posts;
delete channel.posts;
channel.recommendations = [
	{
		group: 'Время публикаций',
		items: [
			{
				prio: 'high',
				title: 'Публикуйте в 9:00–11:00',
				body: 'Посты, опубликованные в 9:00, набирают в среднем 4027 просмотров — на 281% выше среднего по каналу. Топ-3 часа: 9:00, 11:00, 8:00.',
				basis: 'avg_views по часам, n=223'
			},
			{
				prio: 'high',
				title: 'Лучшие дни — Пн, Сб, Вт',
				body: 'Понедельник лидирует (1739 просмотров в среднем). Худший день — пятница (637). Перенесите важные посты с Пт на Пн.',
				basis: 'avg_views по дням недели'
			},
			{
				prio: 'med',
				title: 'Не публикуйте ночью',
				body: 'Посты в 0–5 часов дают 1041 просмотров против 876 в прайм-тайм (18–21). Разница −19% в пользу вечерних публикаций.',
				basis: 'ночные посты vs вечерние'
			}
		]
	},
	{
		group: 'Контент',
		items: [
			{
				prio: 'high',
				title: 'Фокус на теме «Выгорание и восстановление»',
				body: 'Самая просматриваемая тема: 1881 просмотров на пост (34 поста), +78% к среднему. Самая слабая — «ИИ и технологии» (565).',
				basis: 'avg_views по темам'
			},
			{
				prio: 'high',
				title: '«Отношения и одиночество» — двигатель вовлечённости',
				body: 'Самый высокий ER — 4.9% против среднего 4.6%. Подписчики охотно репостят и комментируют такие посты.',
				basis: 'avg_engagement_rate по темам'
			},
			{
				prio: 'med',
				title: 'Что общего у вирусных постов',
				body: 'У 11 вирусных постов самая частая тема — «Выгорание». Формула: конкретная проблема + личный опыт + практический совет.',
				basis: 'composite_score топ-5%, n=11'
			},
			{
				prio: 'low',
				title: 'Дайджесты снижают охват',
				body: 'Посты-дайджесты («Личное и юмор») имеют просмотры ниже среднего. Ограничьте до 1 раза в месяц, замените контентом по топовым темам.',
				basis: 'avg_views категории «Личное и юмор»'
			}
		]
	},
	{
		group: 'Формат',
		items: [
			{
				prio: 'high',
				title: 'Текст работает лучше всего',
				body: 'Посты-тексты набирают 1140 просмотров (ER 12.6%). Видео — лишь 706. Сократите долю видео, делайте больше текстовых лонгридов.',
				basis: 'avg_views по media_type'
			},
			{
				prio: 'med',
				title: 'Серии удерживают аудиторию',
				body: 'Посты-сериалы (выгорание в 3–4 частях, сон, прокрастинация) на 20–35% превышают одиночные. Используйте «часть 1/3» для сложных тем.',
				basis: 'связанные посты одной темы'
			}
		]
	},
	{
		group: 'Вовлечённость',
		items: [
			{
				prio: 'high',
				title: 'Задавайте вопросы в конце поста',
				body: 'Посты с вопросом подписчикам получают replies и реакции значительно чаще. Рубрика «вопрос от подписчика» создаёт высокий ER — аудитория узнаёт себя.',
				basis: 'анализ discussion_score'
			},
			{
				prio: 'med',
				title: 'Просадка просмотров: −79.7% за период',
				body: 'Средние просмотры за первые месяцы 2070, за последние — 421. Признак выгорания контент-плана — нужен эксперимент с форматами.',
				basis: 'avg_views по месяцам'
			}
		]
	}
];

const seed = `${marker}
WITH source AS (
	SELECT * FROM jsonb_to_recordset(${jsonSql(posts, 'posts')}) AS row(
		id integer,
		date text,
		text text,
		theme text,
		format text,
		views integer,
		er double precision,
		score double precision,
		tier text
	)
)
INSERT INTO "post_analytics_posts" (
	"telegram_message_id", "published_at", "text", "theme", "format", "views",
	"engagement_rate", "score", "tier"
)
SELECT id, date::date, text, theme, format, views, er, score, tier
FROM source
ON CONFLICT ("telegram_message_id") DO UPDATE SET
	"published_at" = EXCLUDED."published_at",
	"text" = EXCLUDED."text",
	"theme" = EXCLUDED."theme",
	"format" = EXCLUDED."format",
	"views" = EXCLUDED."views",
	"engagement_rate" = EXCLUDED."engagement_rate",
	"score" = EXCLUDED."score",
	"tier" = EXCLUDED."tier";
--> statement-breakpoint
INSERT INTO "post_analytics_datasets" (
	"key", "label", "version", "payload", "source_generated_at"
)
VALUES
	('channel', 'Анализ канала', 1, ${jsonSql(channel, 'channel')}, '2026-05-26'),
	('structures', 'Структура и шаблоны', 1, ${jsonSql(structures, 'structures')}, '2026-05-26'),
	('expertise', 'Экспертиза', 1, ${jsonSql(expertise, 'expertise')}, '2026-05-26')
ON CONFLICT ("key") DO UPDATE SET
	"label" = EXCLUDED."label",
	"version" = EXCLUDED."version",
	"payload" = EXCLUDED."payload",
	"source_generated_at" = EXCLUDED."source_generated_at",
	"updated_at" = now();
`;

const migration = fs.readFileSync(migrationPath, 'utf8');
const schemaOnly = migration.includes(marker)
	? migration.slice(0, migration.indexOf(marker)).trimEnd()
	: migration.trimEnd();
fs.writeFileSync(migrationPath, `${schemaOnly}\n--> statement-breakpoint\n${seed}`, 'utf8');
console.log(`Seeded ${posts.length} posts and 3 datasets into ${migrationPath}`);

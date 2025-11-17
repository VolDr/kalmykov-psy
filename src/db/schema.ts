import {
	pgTable,
	uniqueIndex,
	bigserial,
	timestamp,
	boolean,
	text,
	foreignKey,
	varchar,
	bigint,
	numeric,
	index,
	doublePrecision,
	integer,
	jsonb,
	uuid
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const source = pgTable(
	'Source',
	{
		id: bigserial({ mode: 'number' }).primaryKey().notNull(),
		createdAt: timestamp({ precision: 3, withTimezone: true, mode: 'string' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, withTimezone: true, mode: 'string' }).notNull(),
		disabled: boolean().default(false).notNull(),
		name: text().notNull()
	},
	(table) => [
		uniqueIndex('Source_name_key').using('btree', table.name.asc().nullsLast().op('text_ops'))
	]
);

export const client = pgTable(
	'Client',
	{
		id: text().primaryKey().notNull(),
		createdAt: timestamp({ precision: 3, withTimezone: true, mode: 'string' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, withTimezone: true, mode: 'string' }).notNull(),
		disabled: boolean().default(false).notNull(),
		name: text().notNull(),
		description: varchar(),
		nick: text(),
		// You can use { mode: "bigint" } if numbers are exceeding js number limitations
		sourceId: bigint({ mode: 'number' }).notNull(),
		invocation: text(),
		gender: text()
	},
	(table) => [
		uniqueIndex('Client_name_key').using('btree', table.name.asc().nullsLast().op('text_ops')),
		uniqueIndex('Client_nick_key').using('btree', table.nick.asc().nullsLast().op('text_ops')),
		foreignKey({
			columns: [table.sourceId],
			foreignColumns: [source.id],
			name: 'Client_sourceId_fkey'
		})
			.onUpdate('cascade')
			.onDelete('restrict')
	]
);

export const activity = pgTable(
	'Activity',
	{
		id: text().primaryKey().notNull(),
		createdAt: timestamp({ precision: 3, withTimezone: true, mode: 'string' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, withTimezone: true, mode: 'string' }).notNull(),
		disabled: boolean().default(false).notNull(),
		scheduledDate: timestamp({ precision: 3, withTimezone: true, mode: 'string' }).notNull(),
		scheduledDay: timestamp({ precision: 3, withTimezone: true, mode: 'string' }).notNull(),
		description: text(),
		rejectReason: text(),
		status: text().notNull(),
		income: numeric({ precision: 65, scale: 30 }),
		clientId: text().notNull()
	},
	(table) => [
		foreignKey({
			columns: [table.clientId],
			foreignColumns: [client.id],
			name: 'Activity_clientId_fkey'
		})
			.onUpdate('cascade')
			.onDelete('restrict')
	]
);

export const contact = pgTable(
	'Contact',
	{
		id: bigserial({ mode: 'number' }).primaryKey().notNull(),
		createdAt: timestamp({ precision: 3, withTimezone: true, mode: 'string' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, withTimezone: true, mode: 'string' }).notNull(),
		disabled: boolean().default(false).notNull(),
		value: text().notNull(),
		description: text(),
		clientId: text().notNull(),
		// You can use { mode: "bigint" } if numbers are exceeding js number limitations
		contactTypeId: bigint({ mode: 'number' }).notNull()
	},
	(table) => [
		uniqueIndex('Contact_contactTypeId_value_key').using(
			'btree',
			table.contactTypeId.asc().nullsLast().op('int8_ops'),
			table.value.asc().nullsLast().op('int8_ops')
		),
		index('Contact_value_idx').using('btree', table.value.asc().nullsLast().op('text_ops')),
		foreignKey({
			columns: [table.clientId],
			foreignColumns: [client.id],
			name: 'Contact_clientId_fkey'
		})
			.onUpdate('cascade')
			.onDelete('restrict'),
		foreignKey({
			columns: [table.contactTypeId],
			foreignColumns: [contactType.id],
			name: 'Contact_contactTypeId_fkey'
		})
			.onUpdate('cascade')
			.onDelete('restrict')
	]
);

export const contactType = pgTable(
	'ContactType',
	{
		id: bigserial({ mode: 'number' }).primaryKey().notNull(),
		createdAt: timestamp({ precision: 3, withTimezone: true, mode: 'string' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, withTimezone: true, mode: 'string' }).notNull(),
		disabled: boolean().default(false).notNull(),
		name: text().notNull()
	},
	(table) => [
		uniqueIndex('ContactType_name_key').using('btree', table.name.asc().nullsLast().op('text_ops'))
	]
);

export const currentState = pgTable(
	'CurrentState',
	{
		id: text().primaryKey().notNull(),
		createdAt: timestamp({ precision: 3, withTimezone: true, mode: 'string' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, withTimezone: true, mode: 'string' }).notNull(),
		disabled: boolean().default(false).notNull(),
		editable: boolean().default(true).notNull(),
		individual: doublePrecision().notNull(),
		family: doublePrecision().notNull(),
		social: doublePrecision().notNull(),
		generally: doublePrecision().notNull(),
		clientId: text().notNull(),
		smallId: text().notNull(),
		datetime: timestamp({ precision: 3, mode: 'string' }).notNull()
	},
	(table) => [
		index('CurrentState_smallId_idx').using(
			'btree',
			table.smallId.asc().nullsLast().op('text_ops')
		),
		uniqueIndex('CurrentState_smallId_key').using(
			'btree',
			table.smallId.asc().nullsLast().op('text_ops')
		),
		foreignKey({
			columns: [table.clientId],
			foreignColumns: [client.id],
			name: 'CurrentState_clientId_fkey'
		})
			.onUpdate('cascade')
			.onDelete('restrict')
	]
);

export const feedback = pgTable(
	'Feedback',
	{
		id: text().primaryKey().notNull(),
		createdAt: timestamp({ precision: 3, withTimezone: true, mode: 'string' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, withTimezone: true, mode: 'string' }).notNull(),
		disabled: boolean().default(false).notNull(),
		editable: boolean().default(true).notNull(),
		attitude: doublePrecision().notNull(),
		goals: doublePrecision().notNull(),
		method: doublePrecision().notNull(),
		generally: doublePrecision().notNull(),
		clientId: text().notNull(),
		smallId: text().notNull(),
		datetime: timestamp({ precision: 3, mode: 'string' }).notNull()
	},
	(table) => [
		index('Feedback_smallId_idx').using('btree', table.smallId.asc().nullsLast().op('text_ops')),
		uniqueIndex('Feedback_smallId_key').using(
			'btree',
			table.smallId.asc().nullsLast().op('text_ops')
		),
		foreignKey({
			columns: [table.clientId],
			foreignColumns: [client.id],
			name: 'Feedback_clientId_fkey'
		})
			.onUpdate('cascade')
			.onDelete('restrict')
	]
);

export const account = pgTable(
	'Account',
	{
		id: text().primaryKey().notNull(),
		username: text().notNull(),
		password: text().notNull(),
		disabled: boolean().default(false).notNull()
	},
	(table) => [
		uniqueIndex('Account_username_key').using(
			'btree',
			table.username.asc().nullsLast().op('text_ops')
		)
	]
);

export const prismaMigrations = pgTable('_prisma_migrations', {
	id: varchar({ length: 36 }).primaryKey().notNull(),
	checksum: varchar({ length: 64 }).notNull(),
	finishedAt: timestamp('finished_at', { withTimezone: true, mode: 'string' }),
	migrationName: varchar('migration_name', { length: 255 }).notNull(),
	logs: text(),
	rolledBackAt: timestamp('rolled_back_at', { withTimezone: true, mode: 'string' }),
	startedAt: timestamp('started_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	appliedStepsCount: integer('applied_steps_count').default(0).notNull()
});

export const articleCategory = pgTable(
	'ArticleCategory',
	{
		id: text().primaryKey().notNull(),
		name: text().notNull(),
		slug: text().notNull(),
		description: text(),
		sortOrder: integer().default(0).notNull(),
		disabled: boolean().default(false).notNull(),
		createdAt: timestamp({ precision: 3, mode: 'string' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull()
	},
	(table) => [
		uniqueIndex('ArticleCategory_slug_key').using(
			'btree',
			table.slug.asc().nullsLast().op('text_ops')
		),
		index('ArticleCategory_sortOrder_idx').using(
			'btree',
			table.sortOrder.asc().nullsLast().op('int4_ops')
		)
	]
);

export const article = pgTable(
	'Article',
	{
		id: text().primaryKey().notNull(),
		title: text().notNull(),
		description: text(),
		content: jsonb().notNull(),
		createdAt: timestamp({ precision: 3, mode: 'string' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
		imageUrl: text(),
		viewCount: integer().default(0).notNull(),
		uri: text().notNull(),
		descriptionMeta: text(),
		categoryId: text()
	},
	(table) => [
		uniqueIndex('Article_uri_key').using('btree', table.uri.asc().nullsLast().op('text_ops')),
		index('Article_categoryId_idx').using(
			'btree',
			table.categoryId.asc().nullsLast().op('text_ops')
		),
		foreignKey({
			columns: [table.categoryId],
			foreignColumns: [articleCategory.id],
			name: 'Article_categoryId_fkey'
		})
			.onUpdate('cascade')
			.onDelete('set null')
	]
);

export const surveyCategory = pgTable(
	'SurveyCategory',
	{
		id: text().primaryKey().notNull(),
		name: text().notNull(),
		slug: text().notNull(),
		description: text(),
		sortOrder: integer().default(0).notNull(),
		disabled: boolean().default(false).notNull(),
		createdAt: timestamp({ precision: 3, mode: 'string' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull()
	},
	(table) => [
		uniqueIndex('SurveyCategory_slug_key').using(
			'btree',
			table.slug.asc().nullsLast().op('text_ops')
		),
		index('SurveyCategory_sortOrder_idx').using(
			'btree',
			table.sortOrder.asc().nullsLast().op('int4_ops')
		)
	]
);

export const survey = pgTable(
	'Survey',
	{
		id: text().primaryKey().notNull(),
		title: text().notNull(),
		slug: text().notNull(),
		description: text(),
		categoryId: text(),
		config: jsonb().notNull(),
		isPublished: boolean().default(false).notNull(),
		sortOrder: integer().default(0).notNull(),
		disabled: boolean().default(false).notNull(),
		createdAt: timestamp({ precision: 3, mode: 'string' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull()
	},
	(table) => [
		uniqueIndex('Survey_slug_key').using('btree', table.slug.asc().nullsLast().op('text_ops')),
		index('Survey_categoryId_idx').using(
			'btree',
			table.categoryId.asc().nullsLast().op('text_ops')
		),
		index('Survey_isPublished_idx').using(
			'btree',
			table.isPublished.asc().nullsLast().op('bool_ops')
		),
		index('Survey_sortOrder_idx').using('btree', table.sortOrder.asc().nullsLast().op('int4_ops')),
		foreignKey({
			columns: [table.categoryId],
			foreignColumns: [surveyCategory.id],
			name: 'Survey_categoryId_fkey'
		})
			.onUpdate('cascade')
			.onDelete('set null')
	]
);

export const surveyResult = pgTable(
	'SurveyResult',
	{
		id: text().primaryKey().notNull(),
		surveyId: text().notNull(),
		clientId: text(),
		sessionId: text(),
		answers: jsonb().notNull(),
		totalScore: doublePrecision().notNull(),
		maxScore: doublePrecision().notNull(),
		interpretation: text(),
		interpretationSeverity: text(),
		interpretationColor: text(),
		subscaleResults: jsonb(),
		warnings: jsonb(),
		completedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
		disabled: boolean().default(false).notNull(),
		createdAt: timestamp({ precision: 3, mode: 'string' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull()
	},
	(table) => [
		index('SurveyResult_surveyId_idx').using(
			'btree',
			table.surveyId.asc().nullsLast().op('text_ops')
		),
		index('SurveyResult_clientId_idx').using(
			'btree',
			table.clientId.asc().nullsLast().op('text_ops')
		),
		index('SurveyResult_completedAt_idx').using(
			'btree',
			table.completedAt.desc().nullsLast().op('timestamp_ops')
		),
		index('SurveyResult_sessionId_idx').using(
			'btree',
			table.sessionId.asc().nullsLast().op('text_ops')
		),
		foreignKey({
			columns: [table.surveyId],
			foreignColumns: [survey.id],
			name: 'SurveyResult_surveyId_fkey'
		})
			.onUpdate('cascade')
			.onDelete('restrict'),
		foreignKey({
			columns: [table.clientId],
			foreignColumns: [client.id],
			name: 'SurveyResult_clientId_fkey'
		})
			.onUpdate('cascade')
			.onDelete('set null')
	]
);

export const pageContent = pgTable(
	'PageContent',
	{
		id: text().primaryKey().notNull(),
		pageSlug: text().notNull(),
		sectionKey: text().notNull(),
		content: jsonb().notNull(),
		sortOrder: integer().default(0).notNull(),
		isActive: boolean().default(true).notNull(),
		createdAt: timestamp({ precision: 3, mode: 'string' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull()
	},
	(table) => [
		uniqueIndex('PageContent_pageSlug_sectionKey_key').using(
			'btree',
			table.pageSlug.asc().nullsLast().op('text_ops'),
			table.sectionKey.asc().nullsLast().op('text_ops')
		),
		index('PageContent_pageSlug_idx').using(
			'btree',
			table.pageSlug.asc().nullsLast().op('text_ops')
		),
		index('PageContent_isActive_idx').using(
			'btree',
			table.isActive.asc().nullsLast().op('bool_ops')
		),
		index('PageContent_sortOrder_idx').using(
			'btree',
			table.sortOrder.asc().nullsLast().op('int4_ops')
		)
	]
);

export const siteSettings = pgTable(
	'SiteSettings',
	{
		id: text().primaryKey().notNull(),
		key: text().notNull(),
		value: jsonb().notNull(),
		description: text(),
		updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull()
	},
	(table) => [
		uniqueIndex('SiteSettings_key_key').using('btree', table.key.asc().nullsLast().op('text_ops'))
	]
);

// Canvas scenes for Excalidraw-like whiteboard
export const scenes = pgTable(
	'scenes',
	{
		id: uuid().primaryKey().notNull(),
		data: jsonb().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
			.default(sql`now()`)
			.notNull()
	},
	(table) => [index('idx_scenes_updated_at').using('btree', table.updatedAt.desc())]
);

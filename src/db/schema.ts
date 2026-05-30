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
	pgEnum
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';


export const analyticsEvents = pgTable('analytics_events', {
  id:         bigserial('id', { mode: 'number' }).primaryKey(),
  createdAt:  timestamp('created_at').defaultNow().notNull(),
  goal:       text('goal').notNull(),
  sessionId:  text('session_id'),
  page:       text('page'),
  params:     jsonb('params')
});

export const source = pgTable(
	'Source',
	{
		id: bigserial({ mode: 'bigint' }).primaryKey().notNull(),
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
		id: bigserial({ mode: 'bigint' }).primaryKey().notNull(),
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
		id: bigserial({ mode: 'bigint' }).primaryKey().notNull(),
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
		descriptionMeta: text()
	},
	(table) => [
		uniqueIndex('Article_uri_key').using('btree', table.uri.asc().nullsLast().op('text_ops'))
	]
);





export const emailSubscription = pgTable(
	'EmailSubscription',
	{
		id: text().primaryKey().notNull(),
		createdAt: timestamp({ precision: 3, withTimezone: true, mode: 'string' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, withTimezone: true, mode: 'string' }).notNull(),
		disabled: boolean().default(false).notNull(),
		email: text().notNull(),
		name: text(),
		unsubscribeKey: text().notNull(),
		status: text().default('active').notNull()
	},
	(table) => [
		uniqueIndex('EmailSubscription_email_key').using(
			'btree',
			table.email.asc().nullsLast().op('text_ops')
		),
		uniqueIndex('EmailSubscription_unsubscribeKey_key').using(
			'btree',
			table.unsubscribeKey.asc().nullsLast().op('text_ops')
		),
		index('EmailSubscription_status_idx').using(
			'btree',
			table.status.asc().nullsLast().op('text_ops')
		)
	]
);



export const subscriberStatusEnum = pgEnum('subscriber_status', ['pending', 'active', 'unsubscribed']);

export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid', 'failed']);

export const bookingStatusEnum = pgEnum('booking_status', ['pending_payment', 'confirmed', 'cancelled', 'requires_refund']);

export const availability = pgTable('Availability', {
	id: bigserial({ mode: 'number' }).primaryKey().notNull(),
	startAt: timestamp('start_at', { withTimezone: true, mode: 'string' }).notNull(),
	endAt: timestamp('end_at', { withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp({ precision: 3, withTimezone: true, mode: 'string' })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull()
});

export const booking = pgTable(
	'Booking',
	{
		id: bigserial({ mode: 'number' }).primaryKey().notNull(),
		availabilityId: bigint('availability_id', { mode: 'number' }).notNull(),
		bookedAt: timestamp('booked_at', { withTimezone: true, mode: 'string' }).notNull(),
		email: text().notNull(),
		clientName: text('client_name').notNull(),
		status: bookingStatusEnum().default('pending_payment').notNull(),
		lockedUntil: timestamp({ precision: 3, withTimezone: true, mode: 'string' }),
		paymentId: bigint('payment_id', { mode: 'number' }),
		createdAt: timestamp({ precision: 3, withTimezone: true, mode: 'string' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, withTimezone: true, mode: 'string' }).notNull()
	},
	(table) => [
		uniqueIndex('unique_active_booking_slot')
			.on(table.availabilityId, table.bookedAt)
			.where(sql`status IN ('confirmed', 'pending_payment')`)
	]
);

export const robokassaPayment = pgTable('RobokassaPayment', {
	id: bigserial({ mode: 'number' }).primaryKey().notNull(),
	createdAt: timestamp({ precision: 3, withTimezone: true, mode: 'string' })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: timestamp({ precision: 3, withTimezone: true, mode: 'string' }).notNull(),
	outSum: numeric({ precision: 10, scale: 2 }).notNull(),
	description: text().notNull(),
	status: paymentStatusEnum().default('pending').notNull(),
	email: text(),
	opKey: text('op_key')
});

export const subscriber = pgTable('Subscriber', {
    id: text().primaryKey().notNull(),
    email: text().notNull().unique(),
    status: subscriberStatusEnum().default('pending').notNull(),
    token: text().unique(),
    createdAt: timestamp({ precision: 3, mode: 'string' })
        .default(sql`CURRENT_TIMESTAMP`)
        .notNull(),
    updatedAt: timestamp({ precision: 3, mode: 'string' })
        .default(sql`CURRENT_TIMESTAMP`)
        .notNull()
});
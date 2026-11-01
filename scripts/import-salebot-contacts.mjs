import 'dotenv/config';

import fs from 'node:fs/promises';
import process from 'node:process';
import pg from 'pg';

const REQUIRED_HEADERS = [
	'ID',
	'Имя',
	'Мессенджер',
	'С каким ботом было общение',
	'Идентификатор внутри мессенджера',
	'Дата первого контакта',
	'Дата последнего контакта',
	'clientBlocked',
	'notSubscribed'
];

function usage() {
	console.log(`Usage:
  npm run contacts:import-salebot -- --source <report.xls> --analyze
  npm run contacts:import-salebot -- --source <report.xls>
  npm run contacts:import-salebot -- --source <report.xls> --apply

Options:
  --source <path>       SaleBot XML Spreadsheet export (.xls)
  --bot <username>      Import only this bot (default: kalmykov_psy_bot)
  --analyze             Validate and summarize the export without connecting to PostgreSQL
  --apply               Commit the import. Without this flag the database run is a dry-run
  --database-url-env    Environment variable containing the database URL (default: DATABASE_URL)
`);
}

function parseArgs(argv) {
	const args = {
		source: '',
		bot: 'kalmykov_psy_bot',
		analyze: false,
		apply: false,
		databaseUrlEnv: 'DATABASE_URL'
	};

	for (let i = 0; i < argv.length; i += 1) {
		const arg = argv[i];
		if (arg === '--source') args.source = argv[++i] ?? '';
		else if (arg === '--bot') args.bot = argv[++i] ?? '';
		else if (arg === '--database-url-env') args.databaseUrlEnv = argv[++i] ?? '';
		else if (arg === '--analyze') args.analyze = true;
		else if (arg === '--apply') args.apply = true;
		else if (arg === '--help' || arg === '-h') {
			usage();
			process.exit(0);
		} else {
			throw new Error(`Unknown argument: ${arg}`);
		}
	}

	if (!args.source) throw new Error('--source is required');
	if (!args.bot) throw new Error('--bot cannot be empty');
	if (!args.databaseUrlEnv) throw new Error('--database-url-env cannot be empty');
	return args;
}

function decodeXml(value) {
	return value
		.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
		.replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)))
		.replace(/&quot;/g, '"')
		.replace(/&apos;/g, "'")
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&amp;/g, '&');
}

function parseXmlSpreadsheet(xml) {
	const rows = [];
	for (const rowMatch of xml.matchAll(/<Row\b[^>]*>([\s\S]*?)<\/Row>/gi)) {
		const row = [];
		for (const cellMatch of rowMatch[1].matchAll(/<Cell\b([^>]*)>([\s\S]*?)<\/Cell>/gi)) {
			const indexMatch = cellMatch[1].match(/\bss:Index="(\d+)"/i);
			if (indexMatch) {
				const targetIndex = Number.parseInt(indexMatch[1], 10) - 1;
				while (row.length < targetIndex) row.push('');
			}

			const dataMatch = cellMatch[2].match(/<Data\b[^>]*>([\s\S]*?)<\/Data>/i);
			row.push(dataMatch ? decodeXml(dataMatch[1]) : '');
		}
		rows.push(row);
	}

	if (rows.length === 0) throw new Error('The export contains no spreadsheet rows');
	const headers = rows[0].map((value) => value.trim());
	for (const required of REQUIRED_HEADERS) {
		if (!headers.includes(required)) throw new Error(`Missing required column: ${required}`);
	}

	return rows
		.slice(1)
		.map((values) =>
			Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']))
		);
}

function parseSaleBotDate(value, field, rowNumber) {
	const trimmed = value.trim();
	if (!trimmed) return null;
	const withTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(trimmed) ? trimmed : `${trimmed}+03:00`;
	const date = new Date(withTimezone);
	if (Number.isNaN(date.getTime())) {
		throw new Error(`Invalid ${field} in export row ${rowNumber}`);
	}
	return date;
}

function truthySaleBotFlag(value) {
	return ['1', 'true', 'yes'].includes(value.trim().toLowerCase());
}

function buildContacts(records, { bot }) {
	const contacts = [];
	const seenTelegramIds = new Set();
	let telegramForOtherBots = 0;
	let telegramChatsSkipped = 0;
	let blockedOrUnsubscribedSkipped = 0;

	for (const [index, record] of records.entries()) {
		if (record['Мессенджер'].trim() !== 'Telegram') continue;
		if (record['С каким ботом было общение'].trim().replace(/^@/, '') !== bot.replace(/^@/, '')) {
			telegramForOtherBots += 1;
			continue;
		}

		const telegramIdRaw = record['Идентификатор внутри мессенджера'].trim();
		// Telegram group/channel chat IDs start with -100. They are conversations,
		// not people, and must not enter the CRM contacts table.
		if (/^-\d+$/.test(telegramIdRaw)) {
			telegramChatsSkipped += 1;
			continue;
		}
		if (!/^\d+$/.test(telegramIdRaw)) {
			throw new Error(`Invalid Telegram ID in export row ${index + 2}`);
		}
		const telegramUserId = Number(telegramIdRaw);
		if (!Number.isSafeInteger(telegramUserId)) {
			throw new Error(`Telegram ID is outside JavaScript safe integer range in row ${index + 2}`);
		}
		if (seenTelegramIds.has(telegramUserId)) {
			throw new Error(`Duplicate Telegram ID in export row ${index + 2}`);
		}
		seenTelegramIds.add(telegramUserId);

		const blocked =
			truthySaleBotFlag(record.notSubscribed) || truthySaleBotFlag(record.clientBlocked);
		if (blocked) {
			blockedOrUnsubscribedSkipped += 1;
			continue;
		}

		contacts.push({
			telegramUserId,
			firstName: record['Имя'].trim() || null,
			stage: 'imported',
			tags: [],
			notes: `Импорт из SaleBot, client_id ${record.ID.trim()}`,
			botBlocked: false,
			createdAt: parseSaleBotDate(record['Дата первого контакта'], 'first contact date', index + 2),
			lastInteractionAt: parseSaleBotDate(
				record['Дата последнего контакта'],
				'last contact date',
				index + 2
			)
		});
	}

	return {
		contacts,
		telegramForOtherBots,
		telegramChatsSkipped,
		blockedOrUnsubscribedSkipped
	};
}

function summarize(
	contacts,
	totalRecords,
	telegramForOtherBots,
	telegramChatsSkipped,
	blockedOrUnsubscribedSkipped
) {
	return {
		totalExportRows: totalRecords,
		matchedTelegramContacts: contacts.length,
		activeToImport: contacts.length,
		blockedOrUnsubscribedSkipped,
		telegramContactsForOtherBots: telegramForOtherBots,
		telegramChatsSkipped
	};
}

function randomPublicId(used) {
	for (let attempt = 0; attempt < 100; attempt += 1) {
		const value = Math.floor(100_000_000 + Math.random() * 900_000_000);
		if (!used.has(value)) {
			used.add(value);
			return value;
		}
	}
	throw new Error('Could not generate a unique public_id');
}

async function assertSchema(client) {
	const result = await client.query(`
		select column_name
		from information_schema.columns
		where table_schema = current_schema() and table_name = 'bot_contacts'
	`);
	const columns = new Set(result.rows.map((row) => row.column_name));
	const required = [
		'public_id',
		'telegram_user_id',
		'first_name',
		'stage',
		'tags',
		'notes',
		'bot_blocked',
		'created_at',
		'updated_at',
		'last_interaction_at'
	];
	const missing = required.filter((column) => !columns.has(column));
	if (missing.length > 0) {
		throw new Error(`bot_contacts is missing or outdated; missing columns: ${missing.join(', ')}`);
	}
}

async function inspectDatabase(client, contacts) {
	await assertSchema(client);
	const ids = contacts.map((contact) => String(contact.telegramUserId));
	const [totals, matches, publicIds] = await Promise.all([
		client.query(
			'select count(*)::int as total, count(*) filter (where bot_blocked)::int as blocked from bot_contacts'
		),
		client.query(
			'select telegram_user_id::text from bot_contacts where telegram_user_id = any($1::bigint[])',
			[ids]
		),
		client.query('select public_id::int from bot_contacts')
	]);

	return {
		before: totals.rows[0],
		existingTelegramIds: new Set(matches.rows.map((row) => row.telegram_user_id)),
		usedPublicIds: new Set(publicIds.rows.map((row) => row.public_id))
	};
}

async function upsertBatch(client, contacts, usedPublicIds) {
	const fieldsPerRow = 10;
	const values = [];
	const tuples = contacts.map((contact, rowIndex) => {
		const offset = rowIndex * fieldsPerRow;
		values.push(
			randomPublicId(usedPublicIds),
			String(contact.telegramUserId),
			contact.firstName,
			contact.stage,
			contact.tags,
			contact.notes,
			contact.botBlocked,
			contact.createdAt,
			new Date(),
			contact.lastInteractionAt
		);
		return `(${Array.from({ length: fieldsPerRow }, (_, index) => `$${offset + index + 1}`).join(', ')})`;
	});

	await client.query(
		`insert into bot_contacts (
			public_id, telegram_user_id, first_name, stage, tags, notes,
			bot_blocked, created_at, updated_at, last_interaction_at
		) values ${tuples.join(', ')}
		on conflict (telegram_user_id) do update set
			first_name = coalesce(bot_contacts.first_name, excluded.first_name),
			tags = (
				select coalesce(array_agg(distinct tag), '{}'::text[])
				from unnest(bot_contacts.tags || excluded.tags) as tag
			),
			bot_blocked = bot_contacts.bot_blocked or excluded.bot_blocked,
			updated_at = now(),
			last_interaction_at = case
				when bot_contacts.last_interaction_at is null then excluded.last_interaction_at
				when excluded.last_interaction_at is null then bot_contacts.last_interaction_at
				else greatest(bot_contacts.last_interaction_at, excluded.last_interaction_at)
			end`,
		values
	);
}

async function main() {
	const args = parseArgs(process.argv.slice(2));
	const xml = await fs.readFile(args.source, 'utf8');
	const records = parseXmlSpreadsheet(xml);
	const { contacts, telegramForOtherBots, telegramChatsSkipped, blockedOrUnsubscribedSkipped } =
		buildContacts(records, args);
	const exportSummary = summarize(
		contacts,
		records.length,
		telegramForOtherBots,
		telegramChatsSkipped,
		blockedOrUnsubscribedSkipped
	);

	if (args.analyze) {
		console.log(JSON.stringify({ mode: 'analyze', export: exportSummary }, null, 2));
		return;
	}

	const connectionString = process.env[args.databaseUrlEnv];
	if (!connectionString) throw new Error(`${args.databaseUrlEnv} is not set`);
	const client = new pg.Client({ connectionString });
	await client.connect();

	try {
		const database = await inspectDatabase(client, contacts);
		const existing = contacts.filter((contact) =>
			database.existingTelegramIds.has(String(contact.telegramUserId))
		).length;
		const plan = {
			mode: args.apply ? 'apply' : 'dry-run',
			export: exportSummary,
			databaseBefore: database.before,
			wouldInsert: contacts.length - existing,
			wouldUpdate: existing
		};

		if (!args.apply) {
			console.log(JSON.stringify(plan, null, 2));
			return;
		}

		await client.query('begin');
		try {
			for (let index = 0; index < contacts.length; index += 250) {
				await upsertBatch(client, contacts.slice(index, index + 250), database.usedPublicIds);
			}
			await client.query('commit');
		} catch (error) {
			await client.query('rollback');
			throw error;
		}

		const after = await client.query(
			'select count(*)::int as total, count(*) filter (where bot_blocked)::int as blocked from bot_contacts'
		);
		console.log(JSON.stringify({ ...plan, databaseAfter: after.rows[0] }, null, 2));
	} finally {
		await client.end();
	}
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : String(error));
	process.exitCode = 1;
});

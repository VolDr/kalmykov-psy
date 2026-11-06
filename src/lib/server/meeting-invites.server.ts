/**
 * Persistent short links for Galene invitation tokens.
 * A link itself is a bearer secret. Stored outside Git / public assets.
 * This app uses one PM2 process; writes are serialized within that process.
 */
import { randomInt } from 'node:crypto';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const DB = resolve(process.env.MEET_INVITES_FILE || resolve(process.cwd(), 'storage/meet-invites.json'));
const CODE_RE = /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/;
const ROOM_RE = /^meet-[0-9a-f]{16}$/;
const TOKEN_RE = /^[A-Za-z0-9_-]{10,128}$/;
const alphabet = 'abcdefghjkmnpqrstuvwxyz'; // avoid visually confusing i/l/o
type Invite = {
	code: string;
	group: string;
	token: string;
	label: string;
	expires: string;
};
let queue: Promise<void> = Promise.resolve();

function newCode(): string {
	const segment = (n: number) =>
		Array.from({ length: n }, () => alphabet[randomInt(alphabet.length)]).join('');
	return segment(3) + '-' + segment(4) + '-' + segment(3);
}

async function load(): Promise<Invite[]> {
	try {
		const value: unknown = JSON.parse(await readFile(DB, 'utf8'));
		if (!Array.isArray(value)) throw new Error('Некорректный файл ссылок видеовстреч.');
		return value.filter((v): v is Invite =>
			!!v && typeof v === 'object' &&
			typeof v.code === 'string' && CODE_RE.test(v.code) &&
			typeof v.group === 'string' && ROOM_RE.test(v.group) &&
			typeof v.token === 'string' && TOKEN_RE.test(v.token) &&
			typeof v.expires === 'string' && Number.isFinite(Date.parse(v.expires)) &&
			typeof v.label === 'string'
		);
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
		throw error;
	}
}

async function save(invites: Invite[]): Promise<void> {
	await mkdir(dirname(DB), { recursive: true, mode: 0o700 });
	const tmp = DB + '.' + Date.now() + '-' + randomInt(1_000_000_000) + '.tmp';
	try {
		await writeFile(tmp, JSON.stringify(invites, null, 2), { flag: 'wx', mode: 0o600 });
		await rename(tmp, DB);
	} finally {
		await unlink(tmp).catch(() => {});
	}
}

async function mutate<T>(fn: (values: Invite[]) => T | Promise<T>): Promise<T> {
	const job = queue.then(async () => {
		const values = await load();
		const result = await fn(values);
		await save(values);
		return result;
	});
	queue = job.then(() => undefined, () => undefined);
	return job;
}

/** Create short aliases for newly issued tokens. */
export async function registerMeetingInvites(
	group: string,
	tokens: Array<{ token: string; label: string; expires: string }>,
	replace: boolean
): Promise<Invite[]> {
	if (!ROOM_RE.test(group)) throw new Error('Недопустимый идентификатор комнаты.');
	if (!tokens.length || tokens.some(v =>
		!TOKEN_RE.test(v.token) || !Number.isFinite(Date.parse(v.expires))
	)) throw new Error('Недопустимые токены приглашений.');
	return mutate(values => {
		if (replace) {
			for (let i = values.length - 1; i >= 0; i--) {
				if (values[i].group === group) values.splice(i, 1);
			}
		}
		const added: Invite[] = [];
		for (const token of tokens) {
			let code = newCode();
			while (values.some(v => v.code === code) || added.some(v => v.code === code)) code = newCode();
			const item = { code, group, ...token };
			values.push(item);
			added.push(item);
		}
		return added;
	});
}

export async function removeMeetingInvites(group: string): Promise<void> {
	if (!ROOM_RE.test(group)) throw new Error('Недопустимый идентификатор комнаты.');
	await mutate(values => {
		for (let i = values.length - 1; i >= 0; i--) {
			if (values[i].group === group) values.splice(i, 1);
		}
	});
}

export async function listMeetingInvites(group: string): Promise<Invite[]> {
	return (await load()).filter(v => v.group === group && Date.parse(v.expires) > Date.now());
}

export async function resolveMeetingCode(code: string): Promise<Invite | null> {
	if (!CODE_RE.test(code)) return null;
	const invite = (await load()).find(v => v.code === code);
	return invite && Date.parse(invite.expires) > Date.now() ? invite : null;
}

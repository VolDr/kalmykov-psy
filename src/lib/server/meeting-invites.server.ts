/**
 * One bearer URL per room, independent of the viewer's role.
 * The admin's Galene token is NEVER emitted by the page load. A separate
 * authenticated POST endpoint chooses the correct credential at join time.
 *
 * The file is persisted outside Git; designed for a single PM2 process.
 */
import { randomInt } from 'node:crypto';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const DB = resolve(process.env.MEET_INVITES_FILE || resolve(process.cwd(), 'storage/meet-invites.json'));
const CODE_RE = /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/;
const ROOM_RE = /^meet-[0-9a-f]{16}$/;
const TOKEN_RE = /^[A-Za-z0-9_-]{10,128}$/;
const alphabet = 'abcdefghjkmnpqrstuvwxyz';
export type RoomLink = {
	code: string;
	group: string;
	guestToken: string;
	hostToken: string;
	expires: string;
};
let queue: Promise<void> = Promise.resolve();

const newCode = (): string => {
	const block = (n: number) => Array.from({ length: n }, () => alphabet[randomInt(alphabet.length)]).join('');
	return block(3) + '-' + block(4) + '-' + block(3);
};

function isRoomLink(v: unknown): v is RoomLink {
	if (!v || typeof v !== 'object') return false;
	const r = v as Partial<RoomLink>;
	return typeof r.code === 'string' && CODE_RE.test(r.code) &&
		typeof r.group === 'string' && ROOM_RE.test(r.group) &&
		typeof r.hostToken === 'string' && TOKEN_RE.test(r.hostToken) &&
		typeof r.guestToken === 'string' && TOKEN_RE.test(r.guestToken) &&
		typeof r.expires === 'string' && Number.isFinite(Date.parse(r.expires));
}

async function load(): Promise<RoomLink[]> {
	try {
		const parsed: unknown = JSON.parse(await readFile(DB, 'utf8'));
		if (!Array.isArray(parsed)) throw new Error('Некорректный файл ссылок видеовстреч.');
		// Old rows are retained in storage until a room is reissued, but they
		// don't contain a safe unified link. Never serve those stale codes.
		return parsed.filter(isRoomLink);
	} catch (err) {
		if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
		throw err;
	}
}

async function save(rows: RoomLink[]): Promise<void> {
	await mkdir(dirname(DB), { recursive: true, mode: 0o700 });
	const tmp = DB + '.' + Date.now() + '-' + randomInt(1_000_000_000) + '.tmp';
	try {
		await writeFile(tmp, JSON.stringify(rows, null, 2), { mode: 0o600, flag: 'wx' });
		await rename(tmp, DB);
	} finally {
		await unlink(tmp).catch(() => {});
	}
}

async function mutate<T>(fn: (rows: RoomLink[]) => T | Promise<T>): Promise<T> {
	const job = queue.then(async () => {
		const rows = await load();
		const value = await fn(rows);
		await save(rows);
		return value;
	});
	queue = job.then(() => undefined, () => undefined);
	return job;
}

export async function registerRoomLink(
	group: string,
	hostToken: string,
	guestToken: string,
	expires: string
): Promise<RoomLink> {
	if (!ROOM_RE.test(group) || !TOKEN_RE.test(hostToken) || !TOKEN_RE.test(guestToken) ||
		!Number.isFinite(Date.parse(expires))) throw new Error('Недопустимые данные ссылки.');
	return mutate(rows => {
		let code = newCode();
		while (rows.some(row => row.code === code)) code = newCode();
		const record: RoomLink = { group, code, hostToken, guestToken, expires };
		for (let i = rows.length - 1; i >= 0; i--) if (rows[i].group === group) rows.splice(i, 1);
		rows.push(record);
		return record;
	});
}

export async function removeMeetingInvites(group: string): Promise<void> {
	if (!ROOM_RE.test(group)) throw new Error('Недопустимый идентификатор комнаты.');
	await mutate(rows => {
		for (let i = rows.length - 1; i >= 0; i--) if (rows[i].group === group) rows.splice(i, 1);
	});
}

export async function getRoomLink(group: string): Promise<RoomLink | null> {
	if (!ROOM_RE.test(group)) return null;
	const r = (await load()).find(row => row.group === group);
	return r && Date.parse(r.expires) > Date.now() ? r : null;
}

export async function resolveMeetingCode(code: string): Promise<RoomLink | null> {
	if (!CODE_RE.test(code)) return null;
	const r = (await load()).find(row => row.code === code);
	return r && Date.parse(r.expires) > Date.now() ? r : null;
}

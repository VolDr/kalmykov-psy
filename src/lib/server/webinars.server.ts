import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, open, readFile, readdir, rename, stat, unlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const MAX_VIDEO_BYTES = 1024 * 1024 * 1024; // 1 GiB
const ROOT = resolve(process.env.WEBINAR_STORAGE_DIR || resolve(process.cwd(), 'storage/webinars'));
const INDEX = resolve(ROOT, 'index.json');
const ID_RE = /^[a-f0-9]{16}$/;

export type Webinar = {
	id: string;
	title: string;
	startAt: string;
	durationSeconds: number;
	viewerSecret: string;
	ready: boolean;
	bytes: number;
	createdAt: string;
};

function validId(id: string) {
	if (!ID_RE.test(id)) throw new Error('Некорректный идентификатор вебинара.');
	return id;
}

function mediaPath(id: string) {
	return resolve(ROOT, validId(id) + '.mp4');
}

export function publicWebinar(webinar: Webinar) {
	const { viewerSecret: _secret, ...publicData } = webinar;
	return publicData;
}

async function ensureStore() {
	await mkdir(ROOT, { recursive: true, mode: 0o700 });
}

async function load(): Promise<Webinar[]> {
	await ensureStore();
	try {
		const rows: unknown = JSON.parse(await readFile(INDEX, 'utf8'));
		if (!Array.isArray(rows)) throw new Error('Некорректный индекс вебинаров.');
		return rows as Webinar[];
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
		throw error;
	}
}

async function save(rows: Webinar[]) {
	await ensureStore();
	const tmp = resolve(ROOT, '.index-' + randomBytes(8).toString('hex') + '.tmp');
	try {
		await writeFile(tmp, JSON.stringify(rows, null, 2), { mode: 0o600, flag: 'wx' });
		await rename(tmp, INDEX);
	} finally {
		await unlink(tmp).catch(() => {});
	}
}

// Keep metadata changes atomic across concurrent requests in one PM2 process.
let tail: Promise<void> = Promise.resolve();
async function mutate<T>(cb: (rows: Webinar[]) => Promise<T> | T): Promise<T> {
	const run = tail.then(async () => {
		const rows = await load();
		const value = await cb(rows);
		await save(rows);
		return value;
	});
	tail = run.then(() => undefined, () => undefined);
	return run;
}

export async function listWebinars(): Promise<Webinar[]> {
	return (await load()).sort((a, b) => b.startAt.localeCompare(a.startAt));
}

export async function getWebinar(id: string): Promise<Webinar | null> {
	return (await load()).find(v => v.id === validId(id)) || null;
}

export async function createWebinar(title: string, startAt: string): Promise<Webinar> {
	title = title.trim();
	if (!title || title.length > 100 || /[\x00-\x1f]/.test(title)) {
		throw new Error('Название должно содержать от 1 до 100 символов.');
	}
	const time = Date.parse(startAt);
	if (!Number.isFinite(time) || time < Date.now() - 300_000 || time > Date.now() + 366 * 86400_000) {
		throw new Error('Укажите дату и время начала в пределах следующего года.');
	}
	return mutate((rows) => {
		const webinar: Webinar = {
			id: randomBytes(8).toString('hex'),
			title,
			startAt: new Date(time).toISOString(),
			durationSeconds: 0,
			viewerSecret: randomBytes(24).toString('base64url'),
			ready: false,
			bytes: 0,
			createdAt: new Date().toISOString()
		};
		rows.push(webinar);
		return webinar;
	});
}

export async function deleteWebinar(id: string) {
	id = validId(id);
	await mutate((rows) => {
		const index = rows.findIndex(row => row.id === id);
		if (index === -1) throw new Error('Вебинар не найден.');
		rows.splice(index, 1);
	});
	await unlink(mediaPath(id)).catch((error: NodeJS.ErrnoException) => {
		if (error.code !== 'ENOENT') throw error;
	});
}

export async function receiveVideo(id: string, body: ReadableStream<Uint8Array>, duration: number) {
	id = validId(id);
	if (!Number.isFinite(duration) || duration < 5 || duration > 6 * 3600) {
		throw new Error('Неверная длительность видео (допустимо до 6 часов).');
	}
	const webinar = await getWebinar(id);
	if (!webinar) throw new Error('Вебинар не найден.');
	if (webinar.ready) throw new Error('Видео уже загружено. Для замены создайте новый вебинар.');

	await ensureStore();
	const tmp = resolve(ROOT, '.' + id + '-' + randomBytes(6).toString('hex') + '.upload');
	const fd = await open(tmp, 'wx', 0o600);
	let bytes = 0;
	const reader = body.getReader();
	try {
		while (true) {
			const chunk = await reader.read();
			if (chunk.done) break;
			bytes += chunk.byteLength;
			if (bytes > MAX_VIDEO_BYTES) throw new Error('Видео больше 1 ГБ. Уменьшите файл.');
			let offset = 0;
			while (offset < chunk.byteLength) {
				const { bytesWritten } = await fd.write(chunk, offset, chunk.byteLength - offset);
				if (!bytesWritten) throw new Error('Не удалось записать видео на диск.');
				offset += bytesWritten;
			}
		}
		await fd.sync();
		await fd.close();
		if (bytes < 12) throw new Error('Файл слишком короткий.');
		const probe = await open(tmp, 'r');
		try {
			const header = Buffer.alloc(12);
			await probe.read(header, 0, 12, 0);
			if (header.toString('ascii', 4, 8) !== 'ftyp') {
				throw new Error('Принимаются только видео в формате MP4.');
			}
		} finally { await probe.close(); }
		await mutate(async (rows) => {
			const target = rows.find(row => row.id === id);
			if (!target || target.ready) throw new Error('Вебинар был удален или видео уже загружено.');
			await rename(tmp, mediaPath(id));
			target.ready = true;
			target.bytes = bytes;
			target.durationSeconds = Math.ceil(duration);
		});
	} catch (error) {
		await fd.close().catch(() => {});
		await unlink(tmp).catch(() => {});
		throw error;
	} finally {
		reader.releaseLock();
	}
}

export function webinarState(webinar: Webinar, now = Date.now()): 'draft' | 'waiting' | 'live' | 'ended' {
	if (!webinar.ready) return 'draft';
	const start = Date.parse(webinar.startAt);
	if (now < start) return 'waiting';
	if (now < start + webinar.durationSeconds * 1000) return 'live';
	return 'ended';
}

export function isValidViewerKey(webinar: Webinar, candidate: string) {
	if (typeof candidate !== 'string' || candidate.length > 200) return false;
	const a = createHash('sha256').update(candidate).digest();
	const b = createHash('sha256').update(webinar.viewerSecret).digest();
	return timingSafeEqual(a, b);
}

export async function getVideoFile(id: string) {
	const webinar = await getWebinar(id);
	if (!webinar || !webinar.ready) return null;
	const filename = mediaPath(id);
	const info = await stat(filename);
	return { webinar, info, filename, stream: (start: number, end: number) => createReadStream(filename, { start, end }) };
}

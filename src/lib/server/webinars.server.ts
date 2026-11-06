import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, open, readFile, rename, rm, stat, unlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const execFileAsync = promisify(execFile);
export const MAX_VIDEO_BYTES = 1024 * 1024 * 1024; // 1 GiB ZIP upload
const ROOT = resolve(process.env.WEBINAR_STORAGE_DIR || resolve(process.cwd(), 'storage/webinars'));
const INDEX = resolve(ROOT, 'index.json');
const ID_RE = /^[a-f0-9]{16}$/;
const SEGMENT_RE = /^[A-Za-z0-9][A-Za-z0-9_.-]*\.ts$/;

export type HlsSegment = { file: string; startMs: number; durationMs: number };
export type HlsManifest = { durationSeconds: number; segments: HlsSegment[]; bytes: number };
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

function validId(id: string): string {
	if (!ID_RE.test(id)) throw new Error('Некорректный идентификатор вебинара.');
	return id;
}
function mediaDir(id: string) {
	return resolve(ROOT, validId(id) + '.hls');
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
	await rm(mediaDir(id), { recursive: true, force: true });
	// Remove the deprecated direct-MP4 file if a previous version made one.
	await unlink(resolve(ROOT, id + '.mp4')).catch((error: NodeJS.ErrnoException) => {
		if (error.code !== 'ENOENT') throw error;
	});
}

async function uploadToTemp(body: ReadableStream<Uint8Array>, path: string) {
	const fd = await open(path, 'wx', 0o600);
	let bytes = 0;
	const reader = body.getReader();
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			bytes += value.byteLength;
			if (bytes > MAX_VIDEO_BYTES) throw new Error('HLS ZIP больше 1 ГБ.');
			let offset = 0;
			while (offset < value.byteLength) {
				const { bytesWritten } = await fd.write(value, offset, value.byteLength - offset);
				if (bytesWritten <= 0) throw new Error('Ошибка записи HLS ZIP на диск.');
				offset += bytesWritten;
			}
		}
		await fd.sync();
	} finally {
		reader.releaseLock();
		await fd.close();
	}
	return bytes;
}

export async function receiveHlsZip(id: string, body: ReadableStream<Uint8Array>) {
	id = validId(id);
	const webinar = await getWebinar(id);
	if (!webinar || webinar.ready) throw new Error('Вебинар отсутствует или видео уже загружено.');
	await ensureStore();
	const tmp = resolve(ROOT, '.' + id + '-' + randomBytes(6).toString('hex') + '.zip');
	const unpackDir = resolve(ROOT, '.' + id + '-' + randomBytes(6).toString('hex') + '.hls.tmp');
	let promoted = false;
	try {
		const bytes = await uploadToTemp(body, tmp);
		if (bytes < 100) throw new Error('ZIP-архив пустой.');
		const { stdout } = await execFileAsync(
			'python3',
			['-I', resolve(process.cwd(), 'scripts/ingest_hls.py'), tmp, unpackDir],
			{ timeout: 180_000, maxBuffer: 8 * 1024 * 1024 }
		);
		const manifest: HlsManifest = JSON.parse(stdout.trim());
		if (!manifest.segments.length || manifest.durationSeconds <= 0) throw new Error('Некорректный HLS.');
		await mutate(async (rows) => {
			const target = rows.find(row => row.id === id);
			if (!target || target.ready) throw new Error('Вебинар уже удален или загружен.');
			await rename(unpackDir, mediaDir(id));
			promoted = true;
			target.ready = true;
			target.bytes = manifest.bytes;
			target.durationSeconds = manifest.durationSeconds;
		});
	} finally {
		await unlink(tmp).catch(() => {});
		if (!promoted) await rm(unpackDir, { recursive: true, force: true }).catch(() => {});
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

export async function getHlsManifest(id: string): Promise<HlsManifest | null> {
	const webinar = await getWebinar(id);
	if (!webinar || !webinar.ready) return null;
	try {
		const data: HlsManifest = JSON.parse(await readFile(resolve(mediaDir(id), 'manifest.json'), 'utf8'));
		if (!Array.isArray(data.segments)) throw new Error('Bad HLS manifest');
		return data;
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
		throw error;
	}
}

export function liveHlsPlaylist(webinar: Webinar, manifest: HlsManifest, now = Date.now()): string | null {
	if (webinarState(webinar, now) !== 'live') return null;
	const elapsedMs = now - Date.parse(webinar.startAt);
	const lastAvailable = manifest.segments.findLastIndex(segment => segment.startMs <= elapsedMs);
	if (lastAvailable < 0) return null;
	const first = Math.max(0, lastAvailable - 6);
	const visible = manifest.segments.slice(first, lastAvailable + 1);
	const targetDuration = Math.ceil(Math.max(...manifest.segments.map(segment => segment.durationMs)) / 1000);
	return [
		'#EXTM3U', '#EXT-X-VERSION:3',
		'#EXT-X-TARGETDURATION:' + targetDuration,
		'#EXT-X-MEDIA-SEQUENCE:' + first,
		'#EXT-X-START:TIME-OFFSET=-' + Math.min(12, visible.reduce((n, segment) => n + segment.durationMs / 1000, 0)),
		...visible.flatMap(segment => [
			'#EXTINF:' + (segment.durationMs / 1000).toFixed(3) + ',',
			segment.file
		]), ''
	].join('\n');
}

export function isReleasedSegment(webinar: Webinar, segment: HlsSegment, now = Date.now()) {
	return webinarState(webinar, now) === 'live' &&
		now >= Date.parse(webinar.startAt) + segment.startMs;
}

export async function openSegment(id: string, file: string) {
	if (!SEGMENT_RE.test(file)) return null;
	const manifest = await getHlsManifest(id);
	if (!manifest) return null;
	const segment = manifest.segments.find(item => item.file === file);
	if (!segment) return null;
	const filename = resolve(mediaDir(id), file);
	const info = await stat(filename);
	return { segment, size: info.size, stream: () => createReadStream(filename) };
}

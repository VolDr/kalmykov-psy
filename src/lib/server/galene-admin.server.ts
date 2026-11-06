import { randomBytes } from 'node:crypto';

/**
 * Server-side Galene administration. Never expose Basic credentials or
 * the management API to the browser. The site and Galene share one VPS.
 */
const API_PREFIX = '/galene-api/v0/.groups';
const ROOM_RE = /^meet-[a-f0-9]{16}$/;

export class GaleneAdminError extends Error {
	constructor(message: string, public status?: number) {
		super(message);
		this.name = 'GaleneAdminError';
	}
}

export function galeneAdminConfigured(): boolean {
	return Boolean(process.env.GALENE_ADMIN_USER && process.env.GALENE_ADMIN_PASSWORD);
}

function backend(): URL {
	const url = new URL(process.env.GALENE_ADMIN_URL || 'http://127.0.0.1:8443/');
	if (
		url.protocol !== 'http:' ||
		!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
		!['/', ''].includes(url.pathname) ||
		url.username ||
		url.password
	) {
		throw new GaleneAdminError('Galene Admin API должен быть доступен только локально.');
	}
	if (!galeneAdminConfigured()) {
		throw new GaleneAdminError('Задайте GALENE_ADMIN_USER и GALENE_ADMIN_PASSWORD в окружении сайта.');
	}
	return url;
}

async function request(path: string, method: 'GET' | 'PUT' | 'POST' | 'DELETE' = 'GET', body?: string) {
	const origin = backend();
	const username = process.env.GALENE_ADMIN_USER!;
	const password = process.env.GALENE_ADMIN_PASSWORD!;
	const response = await fetch(new URL(path.replace(/^\//, ''), origin), {
		method,
		headers: {
			Authorization: 'Basic ' + Buffer.from(username + ':' + password).toString('base64'),
			...(body !== undefined
				? { 'Content-Type': method === 'POST' ? 'text/plain; charset=utf-8' : 'application/json' }
				: {}),
			...(method === 'PUT' ? { 'If-None-Match': '*' } : {})
		},
		body,
		signal: AbortSignal.timeout(8000),
		redirect: 'error',
		cache: 'no-store'
	});
	if (!response.ok) {
		// Do not include response text; upstream errors might disclose information.
		throw new GaleneAdminError(
			response.status === 401 || response.status === 403
				? 'Galene отклонил административные учетные данные или запись групп отключена.'
				: response.status === 409 || response.status === 412
					? 'Комната уже существует.'
					: 'Galene вернул HTTP ' + response.status,
			response.status
		);
	}
	return response;
}

function groupPath(group: string) {
	if (!ROOM_RE.test(group)) throw new GaleneAdminError('Недопустимый идентификатор комнаты.');
	return API_PREFIX + '/' + group;
}

export async function listManagedRooms(): Promise<{ id: string; title: string; maxClients: number | null }[]> {
	const response = await request(API_PREFIX + '/');
	// Galene serializes a nil group list as JSON null until the first room exists.
	const payload: unknown = await response.json();
	const groups: unknown = payload === null ? [] : payload;
	if (!Array.isArray(groups)) throw new GaleneAdminError('Неожиданный ответ от Galene.');
	const managed = groups.filter((name): name is string => typeof name === 'string' && ROOM_RE.test(name));
	const details = await Promise.all(
		managed.map(async (id) => {
			try {
				const r = await request(groupPath(id));
				const data = (await r.json()) as Record<string, unknown>;
				return {
					id,
					title: typeof data.displayName === 'string' ? data.displayName : id,
					maxClients: typeof data['max-clients'] === 'number' ? data['max-clients'] : null
				};
			} catch {
				return { id, title: id, maxClients: null };
			}
		})
	);
	return details.sort((a, b) => b.id.localeCompare(a.id));
}

export function roomSlug() {
	return 'meet-' + randomBytes(8).toString('hex');
}
export function newSecret() {
	return randomBytes(24).toString('base64url');
}

export async function createManagedRoom(title: string, maxClients: number) {
	const group = roomSlug();
	const hostPassword = newSecret();
	const guestPassword = newSecret();
	const path = groupPath(group);
	let created = false;
	try {
		await request(
			path,
			'PUT',
			JSON.stringify({
				displayName: title,
				public: false,
				'max-clients': maxClients,
				'allow-recording': false,
				'unrestricted-tokens': false,
				'autolock': false
			})
		);
		created = true;
		await request(path + '/.users/host', 'PUT', JSON.stringify({ permissions: 'op' }));
		await request(path + '/.users/host/.password', 'POST', hostPassword);
		await request(path + '/.wildcard-user', 'PUT', JSON.stringify({ permissions: 'present' }));
		await request(path + '/.wildcard-user/.password', 'POST', guestPassword);
		return { group, hostPassword, guestPassword };
	} catch (error) {
		if (created) {
			try {
				await request(path, 'DELETE');
			} catch {
				throw new GaleneAdminError(
					'Не удалось завершить создание комнаты и автоматически удалить ее. Проверьте группы Galene вручную.'
				);
			}
		}
		throw error;
	}
}

export async function rotateManagedPassword(group: string, who: 'host' | 'guest') {
	const path = groupPath(group);
	const secret = newSecret();
	await request(path + (who === 'host' ? '/.users/host/.password' : '/.wildcard-user/.password'), 'POST', secret);
	return secret;
}

export async function deleteManagedRoom(group: string) {
	await request(groupPath(group), 'DELETE');
}

/**
 * Galene room management. Runs on the SvelteKit server only; the public
 * reverse proxy must continue blocking /galene-api/.
 */
import { randomBytes } from 'node:crypto';
import { listMeetingInvites, registerMeetingInvites, removeMeetingInvites } from './meeting-invites.server.js';

const API_PREFIX = '/galene-api/v0/.groups';
const ROOM_RE = /^meet-[a-f0-9]{16}$/;
const TOKEN_RE = /^[A-Za-z0-9_-]{10,128}$/;
const INVITE_DAYS = 30;
const INVITE_MS = INVITE_DAYS * 86400 * 1000;

type IssuedToken = {
	token: string;
	label: string;
	expires: string;
};
export type MeetingInvite = IssuedToken & { code: string };

export type ManagedRoom = {
	id: string;
	title: string;
	maxClients: number;
	invites: MeetingInvite[];
	linksError: boolean;
};

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
		url.pathname !== '/' || url.search || url.hash || url.username || url.password
	) {
		throw new GaleneAdminError('Galene Admin API должен быть доступен только локально.');
	}
	if (!galeneAdminConfigured()) {
		throw new GaleneAdminError('Задайте GALENE_ADMIN_USER и GALENE_ADMIN_PASSWORD в окружении сайта.');
	}
	return url;
}

type Method = 'GET' | 'PUT' | 'POST' | 'DELETE';
async function request(
	path: string,
	method: Method = 'GET',
	body?: unknown,
	headers?: Record<string, string>
): Promise<Response> {
	const origin = backend();
	const username = process.env.GALENE_ADMIN_USER!;
	const password = process.env.GALENE_ADMIN_PASSWORD!;
	const response = await fetch(new URL(path.replace(/^\//, ''), origin), {
		method,
		headers: {
			Authorization: 'Basic ' + Buffer.from(username + ':' + password).toString('base64'),
			...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
			...headers
		},
		body: body === undefined ? undefined : JSON.stringify(body),
		signal: AbortSignal.timeout(8000),
		redirect: 'error',
		cache: 'no-store'
	});
	if (!response.ok) {
		throw new GaleneAdminError(
			response.status === 401 || response.status === 403
				? 'Galene отклонил учетные данные или запись групп отключена.'
				: response.status === 404 ? 'Комната или приглашение не найдены.'
				: response.status === 409 || response.status === 412
					? 'Комната уже существует или данные изменились.'
					: 'Galene вернул HTTP ' + response.status,
			response.status
		);
	}
	return response;
}

function groupPath(group: string): string {
	if (!ROOM_RE.test(group)) throw new GaleneAdminError('Некорректный идентификатор комнаты.');
	return API_PREFIX + '/' + group;
}

function tokenPath(group: string, token?: string): string {
	if (token && !TOKEN_RE.test(token)) throw new GaleneAdminError('Некорректный токен.');
	return groupPath(group) + '/.tokens/' + (token || '');
}

async function getGroup(group: string): Promise<Record<string, unknown>> {
	const response = await request(groupPath(group));
	return (await response.json()) as Record<string, unknown>;
}

async function listGroupTokens(group: string): Promise<string[]> {
	const response = await request(tokenPath(group));
	const raw: unknown = await response.json();
	if (raw === null) return [];
	if (!Array.isArray(raw) || !raw.every((v) => typeof v === 'string' && TOKEN_RE.test(v))) {
		throw new GaleneAdminError('Galene вернул некорректный список приглашений.');
	}
	return raw as string[];
}

async function getRoomInvites(group: string): Promise<MeetingInvite[]> {
	const tokens = await listGroupTokens(group);
	const aliases = await listMeetingInvites(group);
	const details = await Promise.all(tokens.map(async (token) => {
		const response = await request(tokenPath(group, token));
		const data = (await response.json()) as {
			username?: string;
			permissions?: string[];
			expires?: string;
		};
		// Earlier builds embedded a fixed username into each token. Those
		// tokens must be reissued before participants can choose their names.
		if (data.username !== undefined) return null;
		if (!Array.isArray(data.permissions) || typeof data.expires !== 'string') return null;
		if (Date.parse(data.expires) <= Date.now()) return null;
		const role = data.permissions.includes('op') ? 'Ведущий' :
			data.permissions.includes('present') ? 'Участник' : null;
		if (!role) return null;
		const alias = aliases.find(invite => invite.token === token);
		if (!alias) return null; // legacy link; must be reissued
		return { code: alias.code, token, label: role, expires: data.expires };
	}));
	let index = 0;
	return details
		.filter((v) => v !== null)
		.sort((a, b) => a.label === 'Ведущий' ? -1 :
			b.label === 'Ведущий' ? 1 : a.token.localeCompare(b.token))
		.map((invite) => ({
			...invite,
			label: invite.label === 'Ведущий' ? 'Ведущий' : 'Участник ' + (++index)
		}));
}

export async function listManagedRooms(): Promise<ManagedRoom[]> {
	const response = await request(API_PREFIX + '/');
	const raw: unknown = await response.json();
	const groups = raw === null ? [] : raw;
	if (!Array.isArray(groups)) throw new GaleneAdminError('Galene вернул некорректный список комнат.');
	const ids = groups.filter((v): v is string => typeof v === 'string' && ROOM_RE.test(v));
	return (await Promise.all(ids.map(async (id): Promise<ManagedRoom> => {
		const details = await getGroup(id);
		const rawMax = details['max-clients'];
		const maxClients = typeof rawMax === 'number' && rawMax >= 2 && rawMax <= 12 ? rawMax : 2;
		let invites: MeetingInvite[] = [];
		let linksError = false;
		try {
			invites = await getRoomInvites(id);
		} catch {
			linksError = true;
		}
		return {
			id,
			title: typeof details.displayName === 'string' ? details.displayName : id,
			maxClients,
			invites,
			linksError
		};
	}))).sort((a, b) => b.id.localeCompare(a.id));
}

function roomSlug() {
	return 'meet-' + randomBytes(8).toString('hex');
}

function inviteRoles(maxClients: number): Array<'host' | 'guest'> {
	if (!Number.isInteger(maxClients) || maxClients < 2 || maxClients > 12) {
		throw new GaleneAdminError('Число участников должно быть от 2 до 12.');
	}
	return ['host', ...Array.from({ length: maxClients - 1 }, () => 'guest' as const)];
}

async function createToken(group: string, role: 'host' | 'guest'): Promise<IssuedToken> {
	const expires = new Date(Date.now() + INVITE_MS).toISOString();
	// No username in the token: the user types their preferred name in /meet.
	const response = await request(tokenPath(group), 'POST', {
		permissions: role === 'host'
			? ['op', 'present', 'message', 'caption']
			: ['present', 'message'],
		expires
	});
	const token = response.headers.get('Location');
	if (!token || !TOKEN_RE.test(token)) throw new GaleneAdminError('Galene не вернул токен приглашения.');
	return { token, label: role === 'host' ? 'Ведущий' : 'Участник', expires };
}

async function discardTokens(group: string, tokens: string[]) {
	const failed: string[] = [];
	for (const token of tokens) {
		try {
			await request(tokenPath(group, token), 'DELETE');
		} catch {
			failed.push(token);
		}
	}
	if (failed.length) {
		throw new GaleneAdminError('Не удалось отозвать некоторые старые ссылки. Проверьте приглашения Galene.');
	}
}

async function generateInvites(group: string, maxClients: number): Promise<IssuedToken[]> {
	const minted: IssuedToken[] = [];
	try {
		for (const role of inviteRoles(maxClients)) minted.push(await createToken(group, role));
		return minted;
	} catch (error) {
		// If partial creation fails, do not leave active unreported invitations.
		try {
			await discardTokens(group, minted.map((v) => v.token));
		} catch {
			throw new GaleneAdminError('Не удалось очистить частично созданные приглашения. Проверьте Galene.');
		}
		throw error;
	}
}

export async function createManagedRoom(title: string, maxClients: number) {
	const group = roomSlug();
	const path = groupPath(group);
	let created = false;
	try {
		await request(path, 'PUT', {
			displayName: title,
			public: false,
			'max-clients': maxClients,
			'allow-recording': false,
			'unrestricted-tokens': false,
			'autolock': false
		}, { 'If-None-Match': '*' });
		created = true;
		const tokens = await generateInvites(group, maxClients);
		const invites = await registerMeetingInvites(group, tokens, true);
		return { group, title, invites };
	} catch (error) {
		if (created) {
			try {
				await discardTokens(group, await listGroupTokens(group));
				await request(path, 'DELETE');
				await removeMeetingInvites(group);
			} catch {
				throw new GaleneAdminError('Не удалось отменить создание комнаты. Проверьте Galene вручную.');
			}
		}
		throw error;
	}
}

/**
 * Migrate legacy password rooms and regenerate links. Every existing room
 * token is revoked, and legacy host/wildcard password accounts are deleted.
 */
export async function reissueRoomInvites(group: string) {
	const details = await getGroup(group);
	const count = details['max-clients'];
	const maxClients = typeof count === 'number' && count >= 2 && count <= 12 ? count : 2;
	const oldTokens = await listGroupTokens(group);
	const minted = await generateInvites(group, maxClients);
	// Publish only the new short links. Existing long links remain revoked.
	await registerMeetingInvites(group, minted, true);
	await discardTokens(group, oldTokens);
	for (const path of [groupPath(group) + '/.users/host', groupPath(group) + '/.wildcard-user']) {
		try {
			await request(path, 'DELETE');
		} catch (error) {
			if (!(error instanceof GaleneAdminError && error.status === 404)) {
				throw new GaleneAdminError('Ссылки созданы, но старый пароль мог остаться активным. Проверьте Galene.');
			}
		}
	}
	return { group, invites: minted };
}

export async function deleteManagedRoom(group: string) {
	// Galene stores stateful invitation tokens separately from group JSON files.
	await discardTokens(group, await listGroupTokens(group));
	await request(groupPath(group), 'DELETE');
	await removeMeetingInvites(group);
}

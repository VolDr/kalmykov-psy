import type { Cookies } from '@sveltejs/kit';
import * as bcrypt from 'bcrypt';

import { db } from '../..';
import * as schema from '../../db/schema';
import { eq } from 'drizzle-orm';

export interface User {
	username: string;
}

export interface SessionData {
	username: string;
	createdAt: number;
}

const SESSION_COOKIE_NAME = 'session_id';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// In-memory session store (replace with database/Redis in production)
const sessionStore = new Map<string, SessionData>();

export async function createSession(cookies: Cookies, username: string): Promise<void> {
	const sessionId = crypto.randomUUID();
	const sessionData: SessionData = {
		username,
		createdAt: Date.now()
	};

	sessionStore.set(sessionId, sessionData);

	cookies.set(SESSION_COOKIE_NAME, sessionId, {
		path: '/',
		httpOnly: true,
		sameSite: 'strict',
		secure: process.env.NODE_ENV === 'production',
		maxAge: SESSION_MAX_AGE
	});
}

export function getSession(cookies: Cookies): SessionData | null {
	const sessionId = cookies.get(SESSION_COOKIE_NAME);

	if (!sessionId) {
		return null;
	}

	const session = sessionStore.get(sessionId);

	if (!session) {
		return null;
	}

	const expirationTime = session.createdAt + SESSION_MAX_AGE * 1000;
	if (Date.now() > expirationTime) {
		sessionStore.delete(sessionId);
		return null;
	}

	return session;
}

/**
 * Destroys the session and clears the cookie
 */
export function destroySession(cookies: Cookies): void {
	const sessionId = cookies.get(SESSION_COOKIE_NAME);

	if (sessionId) {
		sessionStore.delete(sessionId);
	}

	cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
}

export async function verifyUser(username: string, password: string): Promise<boolean> {
	console.log(db.query.account);
	const user = (
		await db.select().from(schema.account).where(eq(schema.account.username, username)).limit(1)
	)[0];
	console.log(user);
	if (!user) return false;
	return await bcrypt.compare(password, user.password);
}

/**
 * Hashes a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
	return await bcrypt.hash(password);
}

/**
 * Compares a password with a hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
	return await bcrypt.compare(password, hash);
}

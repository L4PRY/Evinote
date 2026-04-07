import { type RequestEvent, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { getRequestEvent } from '$app/server';
import type { PostgresError } from 'postgres';
import { authLogger } from './logger';
import type { AuthenticatedUser } from '../types/auth/AuthenticatedUser';
import { generateSecureRandomString } from '$lib/randomString';
import { hash, verify } from '@node-rs/argon2';

//                sec    min  hr   day
const DAY_IN_MS = 1000 * 60 * 60 * 24;
const RENEW_THRESHOLD = DAY_IN_MS * 15;
const EXPIRE_THRESHOLD = DAY_IN_MS * 60;

export const argon2Props = {
	memoryCost: 19456,
	timeCost: 2,
	outputLen: 32,
	parallelism: 1
} as const;

export const sessionCookieName = '.EVISECURITY';

export const hashPassword = (password: string) => hash(password, argon2Props);
export const verifyPassword = (hash: string, password: string) =>
	verify(hash, password, argon2Props);

export function requireLogin(): AuthenticatedUser {
	const { locals, route } = getRequestEvent();

	if (!locals.user) {
		return redirect(302, '/auth');
	}

	return locals.user!;
}

export function checkLogin(): AuthenticatedUser | null {
	const { locals } = getRequestEvent();

	return locals.user || null;
}

let layer = 0;
export async function createSession(
	user: number,
	description: string,
	location?: string,
	eat?: Date
) {
	try {
		layer++;
		const result = await db
			.insert(table.Session)
			.values({
				token: generateSecureRandomString(),
				user,
				description,
				iat: new Date(Date.now()),
				eat: eat ?? new Date(Date.now() + DAY_IN_MS * 30),
				location: location ?? 'Unknown'
			})
			.returning();

		layer = 0;
		return result;
	} catch (error) {
		if ((error as PostgresError).code === '23505') {
			authLogger.error('Unique session token collision, retrying...');
			if (layer > 5) {
				layer = 0;
				throw new Error('Failed to create unique session token after multiple attempts');
			}
			return await createSession(user, description, location);
		} else throw new Error('Failed to create session', { cause: error });
	}
}
export async function validateSessionToken(token: string) {
	const [result] = await db
		.select({
			// Adjust user table here to tweak returned data
			user: {
				id: table.User.id,
				username: table.User.username,
				role: table.User.role,
				sessionToken: table.Session.token
			},
			session: table.Session
		})
		.from(table.Session)
		.innerJoin(table.User, eq(table.Session.user, table.User.id))
		.where(eq(table.Session.token, token));

	if (!result) {
		return { session: null, user: null };
	}

	const { session, user } = result;

	const sessionExpired = Date.now() >= session.eat.getTime();
	if (sessionExpired) {
		await db.delete(table.Session).where(eq(table.Session.id, session.id));
		return { session: null, user: null };
	}

	const renewSession = Date.now() >= session.eat.getTime() - RENEW_THRESHOLD;
	if (renewSession) {
		session.eat = new Date(Date.now() + EXPIRE_THRESHOLD);
		await db
			.update(table.Session)
			.set({ eat: session.eat })
			.where(eq(table.Session.id, session.id));
	}

	return { session, user };
}

export type SessionValidationResult = Awaited<ReturnType<typeof validateSessionToken>>;

export async function invalidateSession(sessionId: string) {
	await db.delete(table.Session).where(eq(table.Session.id, sessionId));
}

export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date) {
	event.cookies.set(sessionCookieName, token, {
		expires: expiresAt,
		path: '/',
		httpOnly: true,
		secure: false
	});
}

export function deleteSessionTokenCookie(event: RequestEvent) {
	event.cookies.delete(sessionCookieName, {
		path: '/'
	});
}

import { type RequestEvent, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { getRequestEvent } from '$app/server';
import type { PostgresError } from 'postgres';
import { authLogger } from './logger';

//                sec    min  hr   day
const DAY_IN_MS = 1000 * 60 * 60 * 24;
const RENEW_THRESHOLD = DAY_IN_MS * 15;
const EXPIRE_THRESHOLD = DAY_IN_MS * 60;

export const sessionCookieName = '.EVISECURITY';

export type AuthenticatedUser = NonNullable<
	Awaited<ReturnType<typeof validateSessionToken>>['user']
>;

export type AuthenticatedSession = NonNullable<
	Awaited<ReturnType<typeof validateSessionToken>>['session']
>;

export type AuthContext = {
	user: AuthenticatedUser;
	session: AuthenticatedSession;
};

function generateSecureRandomString(): string {
	// Human readable alphabet (a-z, 0-9 without l, o, 0, 1 to avoid confusion)
	const alphabet = 'abcdefghijkmnpqrstuvwxyz23456789';

	// Generate 24 bytes = 192 bits of entropy.
	// We're only going to use 5 bits per byte so the total entropy will be 192 * 5 / 8 = 120 bits
	const bytes = new Uint8Array(24);
	crypto.getRandomValues(bytes);

	let id = '';
	for (let i = 0; i < bytes.length; i++) {
		// >> 3 "removes" the right-most 3 bits of the byte
		id += alphabet[bytes[i] >> 3];
	}
	return id;
}

export function requireLogin(): AuthenticatedUser {
	const { locals } = getRequestEvent();

	if (!locals.user) {
		return redirect(302, '/auth');
	}

	return locals.user!;
}

let layer = 0;
export async function createSession(userId: number, description: string) {
	try {
		layer++;
		const result = await db.transaction(async (tx) =>
			tx
				.insert(table.Session)
				.values({
					token: generateSecureRandomString(),
					userId,
					description,
					iat: new Date(),
					eat: new Date(Date.now() + DAY_IN_MS * 30)
				})
				.returning()
		);

		layer = 0;
		return result;
	} catch (error) {
		if ((error as PostgresError).code === '23505') {
			authLogger.error('Unique session token collision, retrying...');
			if (layer > 5) {
				layer = 0;
				throw new Error('Failed to create unique session token after multiple attempts');
			}
			createSession(userId, description);
		}
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
		.innerJoin(table.User, eq(table.Session.userId, table.User.id))
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
		path: '/'
	});
}

export function deleteSessionTokenCookie(event: RequestEvent) {
	event.cookies.delete(sessionCookieName, {
		path: '/'
	});
}

import { type RequestEvent, error, redirect } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { getRequestEvent } from '$app/server';
import type { PostgresError } from 'postgres';
import { authLogger } from './logger';
import type { AuthenticatedUser } from '../types/auth/AuthenticatedUser';

//                sec    min  hr   day
const DAY_IN_MS = 1000 * 60 * 60 * 24;
const RENEW_THRESHOLD = DAY_IN_MS * 15;
const EXPIRE_THRESHOLD = DAY_IN_MS * 60;

export const sessionCookieName = '.EVISECURITY';

export function requireLogin(): AuthenticatedUser {
	const { locals } = getRequestEvent();

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
export async function createSession(userId: number, description: string) {
	try {
		layer++;
		const result = await db.transaction(async tx =>
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

export function checkBoardPerms(board: typeof table.Board.$inferSelect) {
	const { locals } = getRequestEvent();

	const user = locals.user as AuthenticatedUser | null;

	const perms = user
		? db
				.select()
				.from(table.Permissions)
				.where(and(eq(table.Permissions.bid, board.id), eq(table.Permissions.uid, user.id)))
		: null;

	if (user && user.role !== 'Admin') {
		switch (board.type) {
			case 'Public':
				// anyone can read, only owner and users with write perms can write
				break;
			case 'Unlisted':
				// anybody can read, only owner and users with perms can write, is not searchable, only accessible through the link
				if (!perms) {
					authLogger.warn(`User ${user?.id} does not have permissions to view board ${board.id}`);
					error(403, 'forbidden');
				}
				break;
			case 'Private':
				// only owner and users with perms can read or write
				if (board.owner !== user?.id || !perms) {
					authLogger.warn(`User ${user?.id} does not have permissions to view board ${board.id}`);
					error(403, 'forbidden');
				}
				break;
		}
	}

	return perms;
}

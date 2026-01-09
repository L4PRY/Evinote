import type { RequestEvent } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';

//                sec    min  hr   day
const DAY_IN_MS = 1000 * 60 * 60 * 24;

export const sessionCookieName = '.EVISECURITY';

export async function createSession(userId: number, description: string) {
	const session = await db
		.insert(table.Session)
		.values({ userId, description, iat: new Date(), eat: new Date(Date.now() + DAY_IN_MS * 30) })
		.returning();
	return session;
}

export async function validateSessionToken(token: string) {
	const [result] = await db
		.select({
			// Adjust user table here to tweak returned data
			user: { id: table.User.id, username: table.User.username },
			session: table.Session
		})
		.from(table.Session)
		.innerJoin(table.User, eq(table.Session.userId, table.User.id))
		.where(eq(table.Session.id, token));

	if (!result) {
		return { session: null, user: null };
	}

	console.log(result.user.username, result.session.id);
	const { session, user } = result;

	const sessionExpired = Date.now() >= session.eat.getTime();
	if (sessionExpired) {
		await db.delete(table.Session).where(eq(table.Session.id, session.id));
		return { session: null, user: null };
	}

	const renewSession = Date.now() >= session.eat.getTime() - DAY_IN_MS * 15;
	if (renewSession) {
		session.eat = new Date(Date.now() + DAY_IN_MS * 30);
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

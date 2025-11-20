import type { RequestEvent } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase64url, encodeHexLowerCase } from '@oslojs/encoding';
import { db } from '$lib/server/db';
import { User, Session } from '$lib/server/db/schema';
import { v5, NAMESPACE_DNS } from '@std/uuid';
import type { InsertSession } from '$lib/server/db/schema';

//                1s     1m   1h  1d
const DAY_IN_MS = 1000 * 60 * 60 * 24 * 60;
export const sessionCookieName = 'auth-session';

export function generateSessionToken() {
	const bytes = crypto.getRandomValues(new Uint8Array(18));
	const token = encodeBase64url(bytes);
	return token;
}

export async function createSession(token: string, userId: number) {
	const sessionId = v5.generate(
		NAMESPACE_DNS,
		encodeHexLowerCase(sha256(new TextEncoder().encode(token)))
	);
	const session: InsertSession = {
		id: sessionId,
		userId,
		iat: new Date(Date.now()),
		eat: new Date(Date.now() + DAY_IN_MS * 30)
	};
	await db.insert(Session).values(session);
	return session;
}

export async function validateSessionToken(token: string) {
	const sessionId = v5.generate(
		NAMESPACE_DNS,
		encodeHexLowerCase(sha256(new TextEncoder().encode(token)))
	);
	const [result] = await db
		.select({
			// Adjust user table here to tweak returned data
			user: { id: User.id, username: User.username },
			session: Session
		})
		.from(Session)
		.innerJoin(User, eq(Session.userId, User.id))
		.where(eq(Session.id, sessionId));

	if (!result) {
		return { session: null, user: null };
	}
	const { session, user } = result;

	const sessionExpired = Date.now() >= session.eat.getTime();
	if (sessionExpired) {
		await db.delete(Session).where(eq(Session.id, session.id));
		return { session: null, user: null };
	}

	const renewSession = Date.now() >= session.eat.getTime() - DAY_IN_MS * 15;
	if (renewSession) {
		session.eat = new Date(Date.now() + DAY_IN_MS * 30);
		await db.update(Session).set({ eat: session.eat }).where(eq(Session.id, session.id));
	}

	return { session, user };
}

export type SessionValidationResult = Awaited<ReturnType<typeof validateSessionToken>>;

export async function invalidateSession(sessionId: string) {
	await db.delete(Session).where(eq(Session.id, sessionId));
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

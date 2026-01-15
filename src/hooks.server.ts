import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import * as auth from '$lib/server/auth';

const handleAuth: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get(auth.sessionCookieName);
	console.log(sessionToken, typeof sessionToken);

	if (!sessionToken || typeof sessionToken === 'undefined' || sessionToken === 'undefined') {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { session, user } = await auth.validateSessionToken(sessionToken);

	if (session) {
		auth.setSessionTokenCookie(event, sessionToken, session.eat);
	} else {
		auth.deleteSessionTokenCookie(event);
	}

	event.locals.user = user;
	event.locals.session = session;

	return resolve(event);
};

const handleRoutes: Handle = async ({ event, resolve }) => {
	// Add route handling logic here
	const unprotectedRoutes = ['/', '/auth'];
	const path = event.url.pathname;

	if (!event.locals.user && !unprotectedRoutes.includes(path)) {
		throw redirect(303, '/auth');
	}
	return resolve(event);
};

export const handle: Handle = sequence(handleAuth, handleRoutes);

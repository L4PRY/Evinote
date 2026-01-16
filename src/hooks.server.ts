import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import * as auth from '$lib/server/auth';
import { authLogger, routeLogger } from '$lib/server/logger';

const handleAuth: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get(auth.sessionCookieName);
	authLogger.info(`got session token: ${sessionToken}`);

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

const protectRoutes: Handle = async ({ event, resolve }) =>
	!event.locals.user && event.route.id?.includes('/(authenticated)/')
		? redirect(303, '/auth')
		: resolve(event);

const logRoute: Handle = async ({ event, resolve }) => {
	routeLogger.trace(`Handling route: ${event.route.id}`);
	return resolve(event);
};

const nullHandler: Handle = async ({ event, resolve }) => resolve(event);

export const handle: Handle = sequence(
	handleAuth,
	protectRoutes,
	process.env.NODE_ENV == 'development' ? logRoute : nullHandler
);

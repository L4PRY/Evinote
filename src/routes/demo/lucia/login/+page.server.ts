import { hash, verify } from '@node-rs/argon2';
import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import * as auth from '$lib/server/auth';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	if (event.locals.user) {
		return redirect(302, '/demo/lucia');
	}
	return {};
};

export const actions: Actions = {
	login: async (event) => {
		const formData = await event.request.formData();
		const username = formData.get('username');
		const password = formData.get('password');

		let isEmailLogin = false;

		// verify wether username is an actual username or email
		if (validateEmail(username)) {
			isEmailLogin = true;
		} else if (!validateUsername(username)) {
			return fail(400, { message: 'Invalid username' });
		} else {
			isEmailLogin = false;
		}

		if (!validatePassword(password)) {
			return fail(400, { message: 'Invalid password (min 6, max 255 characters)' });
		}

		const results = await db
			.select()
			.from(table.User)
			.where(isEmailLogin ? eq(table.User.email, username) : eq(table.User.username, username));

		const existingUser = results.at(0);
		if (!existingUser) {
			return fail(400, { message: 'Incorrect username or password' });
		}

		const validPassword = await verify(existingUser.passhash, password, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});
		if (!validPassword) {
			return fail(400, { message: 'Incorrect username or password' });
		}

		const userAgent = event.request.headers.get('user-agent') ?? 'unknown';

		// todo: might needa error proof this later
		const session = await auth.createSession(existingUser.id, userAgent);

		// @ts-expect-error createSession might return null but physically cant since it returns an insert
		auth.setSessionTokenCookie(event, session.id, session.eat);

		return redirect(302, '/demo/lucia');
	},
	register: async (event) => {
		const formData = await event.request.formData();
		const username = formData.get('username');
		const email = formData.get('email');
		const password = formData.get('password');

		if (!validateUsername(username)) {
			return fail(400, { message: 'Invalid username' });
		}
		if (!validateEmail(email)) {
			return fail(400, { message: 'Invalid email' });
		}
		if (!validatePassword(password)) {
			return fail(400, { message: 'Invalid password' });
		}

		const passwordHash = await hash(password, {
			// recommended minimum parameters
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});

		try {
			const result = await db
				.insert(table.User)
				.values({ username, passhash: passwordHash, email, role: 'User' })
				.returning({ id: table.User.id });

			const userId = result[0]?.id;
			if (!userId) {
				return fail(500, { message: 'Failed to create user' });
			}

			const userAgent = event.request.headers.get('user-agent') ?? 'unknown';

			const session = await auth.createSession(userId, userAgent);

			// @ts-expect-error createSession might return null but physically cant since it returns an insert
			auth.setSessionTokenCookie(event, session.id, session.eat);
		} catch {
			return fail(500, { message: 'An error has occurred' });
		}
		return redirect(302, '/demo/lucia');
	}
};

function validateUsername(username: unknown): username is string {
	return (
		typeof username === 'string' &&
		username.length >= 3 &&
		username.length <= 31 &&
		/^[a-z0-9_-]+$/.test(username)
	);
}

function validatePassword(password: unknown): password is string {
	return typeof password === 'string' && password.length >= 6 && password.length <= 255;
}

function validateEmail(email: unknown): email is string {
	const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return typeof email === 'string' && regex.test(email);
}

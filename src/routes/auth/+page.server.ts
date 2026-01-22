import { verify } from '@node-rs/argon2';
import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import * as auth from '$lib/server/auth';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import type { Actions } from './$types';
import { validateEmail, validatePassword, validateUsername } from '$lib/parseInput';

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
			return fail(400, {
				message: 'Invalid password (min 6, max 255 characters)'
			});
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

		const sessionResult = await auth.createSession(existingUser.id, userAgent);
		const session = sessionResult[0]; // createSession always returns an array with one element

		auth.setSessionTokenCookie(event, session.token, session.eat);

		return redirect(302, '/home');
	}
};

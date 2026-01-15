import { hash } from '@node-rs/argon2';
import { fail, redirect } from '@sveltejs/kit';
import * as auth from '$lib/server/auth';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import type { Actions } from './$types';
import { validateEmail, validatePassword, validateUsername } from '$lib/parseInput';

export const actions: Actions = {
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
				.returning();

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
		return redirect(302, '/home');
	}
};

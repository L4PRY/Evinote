import { hash } from '@node-rs/argon2';
import { scryptSync } from 'node:crypto';
import { fail, redirect } from '@sveltejs/kit';
import * as auth from '$lib/server/auth';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import type { Actions } from './$types';
import { validateEmail, validatePassword, validateUsername } from '$lib/parseInput';
import { env } from '$env/dynamic/private';

export const actions: Actions = {
	register: async (event) => {
		const formData = await event.request.formData();
		const username = formData.get('username')! as string;
		const email = formData.get('email')! as string;
		const password = formData.get('password')! as string;

		if (!validateUsername(username)) {
			return fail(400, { message: 'Invalid username' });
		}
		if (!validateEmail(email)) {
			return fail(400, { message: 'Invalid email' });
		}
		if (!validatePassword(password)) {
			return fail(400, { message: 'Invalid password' });
		}

		const passhash: string =
			env.USE_LEGACY_HASH == '1'
				? scryptSync(password, 'dev-use-do-not-use-in-prod', 32).toString('hex')
				: await hash(password, {
						// recommended minimum parameters
						memoryCost: 19456,
						timeCost: 2,
						outputLen: 32,
						parallelism: 1
					});

		console.log(passhash);

		try {
			const result = await db
				.insert(table.User)
				.values({ username, passhash, email, role: 'User' })
				.returning();

			const userId = result[0]?.id;
			if (!userId) {
				return fail(500, { message: 'Failed to create user' });
			}

			const userAgent = event.request.headers.get('user-agent') ?? 'unknown';

			const sessionResult = await auth.createSession(userId, userAgent);

			if (!sessionResult || sessionResult.length === 0) {
				return fail(500, { message: 'Failed to create session' });
			}

			const session = sessionResult[0]; // createSession always returns an array with one element

			auth.setSessionTokenCookie(event, session.token, session.eat);
		} catch {
			return fail(500, { message: 'An error has occurred' });
		}
		return redirect(302, '/dashboard');
	}
};

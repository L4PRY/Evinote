import { validateEmail, validatePassword, validateUsername } from '$lib/parseInput';
import { hash } from '@node-rs/argon2';
import * as auth from '$lib/server/auth';
import * as table from '$lib/server/db/schema';
import { db } from '$lib/server/db';

export async function POST({ request, cookies }) {
	const { username, email, password } = await request.json();

	if (!validateUsername(username)) {
		return new Response(JSON.stringify({ error: 'Invalid username' }), { status: 400 });
	}
	if (!validateEmail(email)) {
		return new Response(JSON.stringify({ error: 'Invalid email' }), { status: 400 });
	}
	if (!validatePassword(password)) {
		return new Response(JSON.stringify({ error: 'Invalid password' }), { status: 400 });
	}

	const passhash = await hash(password, {
		// recommended minimum parameters
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	});

	try {
		const result = await db
			.insert(table.User)
			.values({ username, passhash, email, role: 'User' })
			.returning();

		const userId = result[0]?.id;
		if (!userId) {
			return new Response(JSON.stringify({ error: 'Failed to create user' }), { status: 500 });
		}

		const userAgent = 'api-' + (request.headers.get('user-agent') ?? 'unkown');

		const sessionResult = await auth.createSession(userId, userAgent);

		if (!sessionResult || sessionResult.length === 0) {
			return new Response(JSON.stringify({ error: 'Failed to create session' }), { status: 500 });
		}

		const session = sessionResult[0]; // createSession always returns an array with one element

		cookies.set('.EVI_API', session.token, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'strict'
		});
	} catch {
		return new Response(JSON.stringify({ error: 'An error has occurred' }), { status: 500 });
	}

	return new Response(JSON.stringify({ message: 'Registration successful' }), { status: 200 });
}

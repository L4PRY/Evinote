import { validateEmail, validatePassword, validateUsername } from '$lib/parseInput';
import * as auth from '$lib/server/auth';
import * as table from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export async function POST({ request, cookies }) {
	const body = await request.json();

	const username = body.username?.toString() ?? '';
	const email = body.email?.toString() ?? '';
	const password = body.password?.toString() ?? '';

	if (!validateUsername(username)) {
		return json({ error: 'Invalid username' }, { status: 400 });
	}
	if (!validateEmail(email)) {
		return json({ error: 'Invalid email' }, { status: 400 });
	}
	if (!validatePassword(password)) {
		return json({ error: 'Invalid password' }, { status: 400 });
	}

	const existingUser = await db
		.select()
		.from(table.User)
		.where(eq(table.User.username, username))
		.then(r => r.at(0));

	if (existingUser) {
		return json({ error: 'Username already taken' }, { status: 400 });
	}

	const passhash = await auth.hashPassword(password.toString());

	const user = await db
		.insert(table.User)
		.values({ username, passhash, email, role: 'User' })
		.returning()
		.then(r => r.at(0));

	if (!user) {
		return json({ error: 'Failed to create user' }, { status: 500 });
	}

	const userAgent = 'api-' + (request.headers.get('user-agent') ?? 'unkown');

	const session = await auth
		.createSession(
			user.id,
			userAgent,
			new Date(Date.now() + 1000 * 60 * 60 * 24) // 1 day
		)
		.then(r => r.at(0));

	if (!session) {
		return json({ error: 'Failed to create session' }, { status: 500 });
	}

	cookies.set('.EVI_API', session.token, {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'strict'
	});

	return json(
		{
			message: 'User created successfully',
			id: user.id,
			key: session.token,
			eat: session.eat
		},
		{ status: 201 }
	);
}

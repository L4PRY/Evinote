// user sends credentials thru api
// backend authenticates and sends back a session token
//  with which they can set a bearer header to access protected routes

import { db } from '$lib/server/db/index';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import * as auth from '$lib/server/auth';
import { verify } from '@node-rs/argon2';
import { validateEmail, validateUsername, validatePassword } from '$lib/parseInput';

export async function POST({ request, cookies }) {
	const { username, password } = await request.json();

	let isEmailLogin = false;

	// verify wether username is an actual username or email
	if (validateEmail(username)) {
		isEmailLogin = true;
	} else if (!validateUsername(username)) {
		return new Response(JSON.stringify({ error: 'Invalid username' }), { status: 400 });
	} else {
		isEmailLogin = false;
	}

	if (!validatePassword(password)) {
		return new Response(JSON.stringify({ error: 'Invalid password (min 6, max 255 characters)' }), {
			status: 400
		});
	}

	const results = await db
		.select()
		.from(table.User)
		.where(isEmailLogin ? eq(table.User.email, username) : eq(table.User.username, username));

	const existingUser = results.at(0);
	if (!existingUser) {
		return new Response(JSON.stringify({ error: 'Invalid username or password' }), { status: 400 });
	}

	// Here you would normally verify the password using a hashing function like bcrypt or argon2
	// For simplicity, we are just comparing the plain text passwords (not recommended for production)
	const validPassword = await verify(existingUser.passhash, password, {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	});

	if (!validPassword) {
		return new Response(JSON.stringify({ error: 'Invalid username or password' }), { status: 400 });
	}

	const sessions = await auth.createSession(
		existingUser.id,
		request.headers.get('user-agent') ?? 'api'
	);

	if (!sessions || sessions.length === 0) {
		return new Response(JSON.stringify({ error: 'Failed to create session' }), { status: 500 });
	}

	const session = sessions[0];

	// Set the session token as a cookie
	cookies.set('.EVI_API', session.token, {
		httpOnly: true,
		path: '/',
		secure: true,
		sameSite: 'strict'
	});

	return new Response(JSON.stringify({ message: 'Login successful' }), { status: 200 });
}

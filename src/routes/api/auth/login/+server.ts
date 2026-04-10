import { json, type RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db/index';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import * as auth from '$lib/server/auth';
import { verify } from '@node-rs/argon2';
import { validateEmail, validateUsername, validatePassword } from '$lib/parseInput';
import { env } from '$env/dynamic/private';
import { scryptSync } from 'node:crypto';
import { routeLogger } from '$lib/server/logger';

export async function POST(event: RequestEvent) {
	const { request, cookies } = event;

	const { username, password } = (await request.json()) as { username: string; password: string };

	const results = await db.select().from(table.User).where(eq(table.User.username, username));
	const existingUser = results.at(0);
	if (!existingUser) {
		return new Response(JSON.stringify({ error: 'Invalid username or password' }), { status: 400 });
	}

	if (existingUser.role !== 'Admin') {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
	}

	const validPassword =
		env.USE_LEGACY_HASH == '1'
			? scryptSync(password, 'dev-use-do-not-use-in-prod', 32).toString('hex') ===
				existingUser.passhash
			: await verify(existingUser.passhash, password, {
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
		request.headers.get('user-agent') ?? 'api',
		''
	);

	if (!sessions || sessions.length === 0) {
		return new Response(JSON.stringify({ error: 'Failed to create session' }), { status: 500 });
	}

	const session = sessions[0];

	// Beállítjuk a session token-t cookie-ban
	event.setHeaders({
		Authorization: `Bearer ${session.token}`
	});

	return json(
		{
			message: 'Login successful',
			key: session.token
		},
		{ status: 200 }
	);
}

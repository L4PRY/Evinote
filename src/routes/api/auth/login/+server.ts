import { json, type RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db/index';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import * as auth from '$lib/server/auth';
import { routeLogger } from '$lib/server/logger';

export async function POST(event: RequestEvent) {
	const { request } = event;
	const body = await request.json();

	const { username, password } = body as { username: string; password: string };

	if (!username || !password) {
		return new Response(JSON.stringify({ error: 'Invalid username or password format' }), {
			status: 400
		});
	}

	const user = await db
		.select()
		.from(table.User)
		.where(eq(table.User.username, username))
		.then(r => r.at(0));

	if (!user) {
		return new Response(JSON.stringify({ error: 'Invalid username or password' }), { status: 400 });
	}

	if (user.role !== 'Admin') {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
	}

	if (!(await auth.verifyPassword(user.passhash, password.toString()))) {
		return new Response(JSON.stringify({ error: 'Invalid username or password' }), { status: 400 });
	}

	const session = await auth
		.createSession(
			user.id,
			request.headers.get('user-agent') ?? 'api',
			'',
			new Date(Date.now() + 1000 * 60 * 60 * 24) // 1 day
		)
		.then(res => res.at(0));

	if (!session) {
		routeLogger.error('Failed to create session for user ID: ' + user.id);
		return new Response(JSON.stringify({ error: 'Failed to create session' }), { status: 500 });
	}

	// Beállítjuk a session token-t cookie-ban
	event.setHeaders({
		Authorization: `Bearer ${session.token}`
	});

	return json(
		{
			message: 'Login successful',
			key: session.token,
			eat: session.eat
		},
		{ status: 200 }
	);
}

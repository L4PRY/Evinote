// legit what should be here
// ion like writing markdown first and then writing code around the markdown
// lowkey pmo
//
// so
// users route eh
// i mean u could use it to like
// get a users info
// and the board they made (public only)
//
// admins could also like get all the users info and delete users and stuff

import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';

export async function GET({ params, locals }) {
	const { id } = params;
	const requestingUser = locals.user;

	const user = db
		.select()
		.from(table.User)
		.where(eq(table.User.id, parseInt(id)))
		.then((res) => res[0]);

	if (!user)
		return new Response(JSON.stringify({ message: 'User does not exist' }), { status: 404 });

	const boards = db
		.select()
		.from(table.Board)
		.where(
			and(
				eq(table.Board.owner, parseInt(id)),
				requestingUser && requestingUser.role !== 'Admin'
					? eq(table.Board.type, 'Public')
					: undefined
			)
		);

	return new Response(JSON.stringify({ user, boards }), { status: 200 });
}

export async function PUT({ params, request, locals }) {
	const { id } = params;
	const { username, email, passhash, role } = await request.json();
	const requestingUser = locals.user;

	const user = await db
		.select()
		.from(table.User)
		.where(eq(table.User.id, parseInt(id)))
		.then((res) => res[0]);

	if (!user)
		return new Response(JSON.stringify({ message: 'User does not exist' }), { status: 404 });

	if (!requestingUser)
		return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });

	if (requestingUser.id !== user.id || requestingUser.role !== 'Admin')
		return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });

	await db
		.update(table.User)
		.set({ username, email, passhash, role })
		.where(eq(table.User.id, parseInt(id)));

	return new Response(null, { status: 204 });
}

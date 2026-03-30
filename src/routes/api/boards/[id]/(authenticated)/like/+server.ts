// POST to add a like
// DELETE to remove a like
// both should return like count after the action (add or remove)

import { requireLogin } from '$lib/server/auth';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { getBoard } from '$lib/server/perms';
import { error } from '@sveltejs/kit';
import { and, count, eq } from 'drizzle-orm';

export const POST = async ({ params, locals }) => {
	const { id } = params;
	const { board, likes } = await getBoard(id);
	const user = requireLogin();

	// try {
	// 	await db.insert(table.BoardLikes).values({ board: board.id, user: user.id });
	// } catch (err) {
	// 	const pgError = (err as DrizzleQueryError).cause as PostgresError; // lol..,,
	// 	console.log(pgError);
	// 	if (pgError.code === '23505') {
	// 		routeLogger.warn(`User ${user.id} attempted to like board ${board.id} multiple times`);
	// 		return new Response(JSON.stringify({ error: 'Already liked' }), { status: 400 });
	// 	}
	// }

	const insert = await db
		.insert(table.BoardLikes)
		.values({ board: board.id, user: user.id })
		.onConflictDoNothing()
		.returning({ board: table.BoardLikes.board });

	if (insert.length === 0) error(400, 'Already liked');

	const newLikes = await db
		.select({ count: count() })
		.from(table.BoardLikes)
		.where(eq(table.BoardLikes.board, board.id))
		.then(res => res[0].count);

	return new Response(JSON.stringify({ likes: newLikes }), { status: 200 });
};

export const DELETE = async ({ params }) => {
	const { id } = params;
	const { board } = await getBoard(id);
	const user = requireLogin();

	await db
		.delete(table.BoardLikes)
		.where(and(eq(table.BoardLikes.board, board.id), eq(table.BoardLikes.user, user.id)));

	const newLikes = await db
		.select({ count: count() })
		.from(table.BoardLikes)
		.where(eq(table.BoardLikes.board, board.id))
		.then(res => res[0].count);

	return new Response(JSON.stringify({ likes: newLikes }), { status: 200 });
};

// POST to add a like
// DELETE to remove a like
// both should return like count after the action (add or remove)

import { requireLogin } from '$lib/server/auth';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { routeLogger } from '$lib/server/logger';
import { getBoard } from '$lib/server/perms';
import { and, count, eq } from 'drizzle-orm';

export const POST = async ({ params, locals }) => {
	const { id } = params;
	const { board, likes } = await getBoard(id);
	const user = requireLogin();

	const existingLike = await db
		.select()
		.from(table.BoardLikes)
		.where(and(eq(table.BoardLikes.board, board.id), eq(table.BoardLikes.user, user.id)))
		.then(res => res[0]);

	if (existingLike) {
		return new Response(JSON.stringify({ error: 'Already liked' }), { status: 400 });
	}

	let newLikes: number;

	await db.insert(table.BoardLikes).values({ board: board.id, user: user.id });

	newLikes = await db
		.select({ count: count() })
		.from(table.BoardLikes)
		.where(eq(table.BoardLikes.board, board.id))
		.then(res => res[0].count);

	return new Response(JSON.stringify({ likes: newLikes }), { status: 200 });
};

export const DELETE = async ({ params, locals }) => {
	const { id } = params;
	const { board, likes } = await getBoard(id);
	const user = requireLogin();

	const existingLike = await db
		.select()
		.from(table.BoardLikes)
		.where(and(eq(table.BoardLikes.board, board.id), eq(table.BoardLikes.user, user.id)))
		.then(res => res[0]);

	if (!existingLike) {
		return new Response(JSON.stringify({ error: 'Like not found' }), { status: 400 });
	}

	let newLikes: number;

	await db
		.delete(table.BoardLikes)
		.where(and(eq(table.BoardLikes.board, board.id), eq(table.BoardLikes.user, user.id)));

	newLikes = await db
		.select({ count: count() })
		.from(table.BoardLikes)
		.where(eq(table.BoardLikes.board, board.id))
		.then(res => res[0].count);

	return new Response(JSON.stringify({ likes: newLikes }), { status: 200 });
};

// get a board with all its notes (with permissions of course)
// update a board (with its notes)
// delete a board

import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { count, eq } from 'drizzle-orm';
import { checkBoardPerms, getBoard } from '$lib/server/perms';

export async function GET({ params }) {
	const { id } = params;

	// get board, likes from layout.server.ts load

	const { board, likes } = await getBoard(id);

	// const notes = await db
	// 	.select()
	// 	.from(table.Note)
	// 	.where(eq(table.Note.bid, parseInt(id)));

	return new Response(JSON.stringify({ board, likes }), { status: 200 });
}

export async function DELETE({ params }) {
	const { id } = params;

	const board = await db
		.select()
		.from(table.Board)
		.where(eq(table.Board.id, parseInt(id)))
		.then(res => res[0]);

	checkBoardPerms(board);

	await db.delete(table.Board).where(eq(table.Board.id, parseInt(id)));

	return new Response(null, { status: 204 });
}

export async function PUT({ params, request }) {
	const { id } = params;
	const { name, type } = await request.json();

	const board = await db
		.select()
		.from(table.Board)
		.where(eq(table.Board.id, parseInt(id)))
		.then(res => res[0]);

	checkBoardPerms(board);

	await db
		.update(table.Board)
		.set({ name, type })
		.where(eq(table.Board.id, parseInt(id)));

	return new Response(null, { status: 204 });
}

export async function PATCH({ params, request }) {
	const { id } = params;
	const { name } = await request.json();

	const board = await db
		.select()
		.from(table.Board)
		.where(eq(table.Board.id, parseInt(id)))
		.then(res => res[0]);

	checkBoardPerms(board);

	await db
		.update(table.Board)
		.set({ name })
		.where(eq(table.Board.id, parseInt(id)));

	return new Response(JSON.stringify({ board }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' }
	});
}

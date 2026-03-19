// get a board with all its notes (with permissions of course)
// update a board (with its notes)
// delete a board

import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { checkBoardPerms } from '$lib/server/auth.js';

export async function GET({ params }) {
	const { id } = params;

	const board = await db
		.select()
		.from(table.Board)
		.where(eq(table.Board.id, parseInt(id)))
		.then((res) => res[0]);

	checkBoardPerms(board);

	const notes = await db
		.select()
		.from(table.Note)
		.where(eq(table.Note.bid, parseInt(id)));

	return new Response(JSON.stringify({ board, notes }), { status: 200 });
}

export async function DELETE({ params }) {
	const { id } = params;

	const board = await db
		.select()
		.from(table.Board)
		.where(eq(table.Board.id, parseInt(id)))
		.then((res) => res[0]);

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
		.then((res) => res[0]);

	checkBoardPerms(board);

	await db
		.update(table.Board)
		.set({ name, type })
		.where(eq(table.Board.id, parseInt(id)));

	return new Response(null, { status: 204 });
}

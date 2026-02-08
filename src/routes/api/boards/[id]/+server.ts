// get a board with all its notes (with permissions of course)
// update a board
// delete a board

import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export async function GET({ params, locals }) {
	const { id } = params;

	const board = await db
		.select()
		.from(table.Board)
		.where(eq(table.Board.id, parseInt(id)))
		.then((res) => res[0]);

	if (!board) {
		return new Response(JSON.stringify({ error: 'Board not found' }), { status: 404 });
	}

	// Check permissions here based on board.type and locals.user
}

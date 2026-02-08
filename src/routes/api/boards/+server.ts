import { db } from '$lib/server/db/index.js';
import * as table from '$lib/server/db/schema.js';
// create a board, api returns id

export async function POST({ request, locals }) {
	// check for either .EVI_API cookie or Authorization header
	if (!locals.user) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
	}

	const { name, type } = await request.json();

	if (!name || !type) {
		return new Response(JSON.stringify({ error: 'Missing name or type' }), { status: 400 });
	}

	const [result] = await db
		.insert(table.Board)
		.values({
			name,
			type,
			owner: locals.user.id
		})
		.returning({ id: table.Board.id });

	return new Response(JSON.stringify({ board_id: result.id }), { status: 201 });
}

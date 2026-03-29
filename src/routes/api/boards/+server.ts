import { requireLogin } from '$lib/server/auth.js';
import { db } from '$lib/server/db/index.js';
import * as table from '$lib/server/db/schema.js';
// create a board, api returns id

export async function POST({ request, locals }) {
	const user = requireLogin();
	const { name, type } = await request.json();

	if (!name || !type) {
		return new Response(JSON.stringify({ error: 'Missing name or type' }), { status: 400 });
	}

	const [result] = await db
		.insert(table.Board)
		.values({
			name,
			type,
			owner: user.id
		})
		.returning({ id: table.Board.id });

	return new Response(JSON.stringify({ board_id: result.id }), { status: 201 });
}

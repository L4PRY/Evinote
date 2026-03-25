import { db } from '$lib/server/db';
import { Board, User } from '$lib/server/db/schema';
import { eq, and, inArray, count, sql } from 'drizzle-orm';
import { requireLogin } from '$lib/server/auth';
import { error } from '@sveltejs/kit';

export const GET = async ({ params }) => {
	const { id } = params;

	const user = requireLogin();

	const boards = await db
		.select({
			id: Board.id,
			name: Board.name,
			type: Board.type,
			updated: Board.updated,
			// get number of notes in jsonb array
			// notesCount: count(Board.notes)
			notesCount: sql`jsonb_array_length(${Board.notes})`.as('notesCount')
		})
		.from(Board)
		.where(
			// only get public and unlisted boards if user is not admin
			user.role === 'Admin'
				? eq(Board.owner, parseInt(id))
				: and(eq(Board.owner, parseInt(id)), inArray(Board.type, ['Public', 'Unlisted']))
		);

	return new Response(JSON.stringify(boards));
};

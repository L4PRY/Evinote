import * as auth from '$lib/server/auth';
import * as table from '$lib/server/db/schema';
import { db } from '$lib/server/db/index';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { count, desc, eq } from 'drizzle-orm';

export const load = async () => {
	const user = auth.requireLogin();
	const boards = await db
		.select({
			id: table.Board.id,
			name: table.Board.name,
			updated: table.Board.updated,
			type: table.Board.type,
			owner: table.Board.owner,
			likes: count(table.BoardLikes.board)
		})
		.from(table.Board)
		.where(eq(table.Board.owner, user.id))
		.leftJoin(table.BoardLikes, eq(table.BoardLikes.board, table.Board.id))
		.groupBy(table.Board.id)
		.orderBy(desc(table.Board.updated));

	return {
		user,
		boards
	};
};

export const actions: Actions = {
	logout: async event => {
		if (!event.locals.session) {
			return fail(401);
		}
		await auth.invalidateSession(event.locals.session.id);
		auth.deleteSessionTokenCookie(event);

		return redirect(302, '/');
	}
};

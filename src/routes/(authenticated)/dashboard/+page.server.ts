import * as auth from '$lib/server/auth';
import * as table from '$lib/server/db/schema';
import { db } from '$lib/server/db/index';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { desc, eq } from 'drizzle-orm';

export const load = async () => {
	const user = auth.requireLogin();
	const boards = db
		.select()
		.from(table.Board)
		.where(eq(table.Board.owner, user.id))
		.orderBy(desc(table.Board.updated));

	return {
		user,
		boards
	};
};

export const actions: Actions = {
	logout: async (event) => {
		if (!event.locals.session) {
			return fail(401);
		}
		await auth.invalidateSession(event.locals.session.id);
		auth.deleteSessionTokenCookie(event);

		return redirect(302, '/');
	}
};

import { routeLogger } from '$lib/server/logger.js';
import { db } from '$lib/server/db/index';
import * as table from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { requireLogin } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';
import type { NoteData } from '$lib/types/canvas/NoteData';
import { checkUserCanModify } from '$lib/server/perms';
import { diffNotes } from '$lib/server/diff';

export const load: PageServerLoad = async ({ params, parent }) => {
	const parentData = await parent();
	const { user, perms, board } = parentData;
	const { id } = params;

	const contributors = user
		? await db
				.select({ username: table.User.username, id: table.User.id, permission: table.Permissions.perm })
				.from(table.User)
				.leftJoin(table.Permissions, eq(table.User.id, table.Permissions.uid))
				.where(eq(table.Permissions.bid, parseInt(id)))
		: [];

	const canModify = checkUserCanModify(board, user ?? undefined, perms ?? undefined);

	return { contributors, canModify };
};

export const actions: Actions = {
	default: async ({ request, params }) => {
		const sessionUser = requireLogin();
		const formData = await request.formData();
		const notes = JSON.parse(formData.get('notes') as string) as NoteData[];
		routeLogger.info(`User requested to update board no. ${params.id}`);
		// routeLogger.info(`notes is ${JSON.stringify(notes)}`);

		const user = await db
			.select()
			.from(table.User)
			.where(eq(table.User.id, sessionUser.id))
			.then(res => res[0]);

		const perms = await db
			.select()
			.from(table.Permissions)
			.where(
				and(eq(table.Permissions.bid, parseInt(params.id)), eq(table.Permissions.uid, user.id))
			)
			.then(res => res[0]);

		const board = await db
			.select()
			.from(table.Board)
			.where(eq(table.Board.id, parseInt(params.id)))
			.then(res => res[0]);

		// diff notes on server and sent by client here

		if (checkUserCanModify(board, user, perms))
			await db
				.update(table.Board)
				.set({ notes: diffNotes(board.notes as NoteData[], notes) })
				// .set({ notes })
				.where(eq(table.Board.id, parseInt(params.id)));
	}
};

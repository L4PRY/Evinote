import { routeLogger } from '$lib/server/logger.js';
import { db } from '$lib/server/db/index';
import * as table from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { requireLogin } from '$lib/server/auth';
import { error } from '@sveltejs/kit';
import type { Actions } from './$types';
import type { NoteData } from '$lib/types/canvas/NoteData';
import { checkLogin } from '$lib/server/auth';
import type { CanvasData } from '$lib/types/canvas/CanvasData.js';
import { checkAccessPerms, checkUserCanModify } from '$lib/server/perms';
import { diffNotes } from '$lib/server/diff';

export async function load({ params }) {
	const { id } = params;
	const sessionUser = checkLogin();

	routeLogger.info(`Loading board with id ${id}`);

	const board = await db
		.select()
		.from(table.Board)
		.where(eq(table.Board.id, parseInt(id)))
		.then(res => res[0]);

	if (!board) {
		routeLogger.warn(`Board with id ${id} not found`);
		error(404, 'board not found');
	}

	// get the full user record if logged in
	const user = sessionUser
		? await db
				.select()
				.from(table.User)
				.where(eq(table.User.id, sessionUser.id))
				.then(res => res[0])
		: null;

	// get perms for current user and board if any

	const perms = user
		? await db
				.select()
				.from(table.Permissions)
				.where(and(eq(table.Permissions.bid, parseInt(id)), eq(table.Permissions.uid, user.id)))
				.then(res => res[0])
		: null;

	return checkAccessPerms(board, user, perms)
		? { id, user, board, perms }
		: error(403, 'forbidden');
}

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

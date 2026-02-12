import { routeLogger } from '$lib/server/logger.js';
import { db } from '$lib/server/db/index';
import * as table from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { checkLogin, requireLogin } from '$lib/server/auth.js';
import { error } from '@sveltejs/kit';
import type { Actions } from './$types';
import type { NoteData } from '$lib/types/NoteData';

export async function load({ params }) {
	const { id } = params;
	const user = checkLogin();

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

	// get perms for current user and board if any

	const perms = user
		? await db
				.select()
				.from(table.Permissions)
				.where(and(eq(table.Permissions.bid, parseInt(id)), eq(table.Permissions.uid, user.id)))
		: null;

	// juggle perms for stuff
	// so like if the board is private, we either check for board.owner === user.id or perms.bid === board.id && read || write perms

	if (user && user.role !== 'Admin')
		switch (board.type) {
			case 'Public':
				// anyone can read, only owner and users with write perms can write
				break;
			case 'Unlisted':
				// anybody can read, only owner and users with perms can write, is not searchable, only accessible through the link
				if (!perms) {
					routeLogger.warn(`User ${user?.id} does not have permissions to view board ${id}`);
					error(403, 'forbidden');
				}
				break;
			case 'Private':
				// only owner and users with perms can read or write
				if (board.owner !== user?.id || !perms) {
					routeLogger.warn(`User ${user?.id} does not have permissions to view board ${id}`);
					error(403, 'forbidden');
				}
				break;
		}

	return {
		id,
		perms,
		notes: board.data
	};
}

export const actions: Actions = {
	default: async ({ request, params }) => {
		const user = requireLogin();
		const formData = await request.formData();
		const notes = JSON.parse(formData.get('notes') as string) as NoteData[];

		routeLogger.info(`User requested to update board no. ${params.id}`);

		const perms = await db
			.select()
			.from(table.Permissions)
			.where(
				and(eq(table.Permissions.bid, parseInt(params.id)), eq(table.Permissions.uid, user.id))
			);

		if (perms && perms.length !== 0) await db.update(table.Board).set({ data: notes });
	}
};

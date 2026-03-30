import { checkLogin } from '$lib/server/auth';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { routeLogger } from '$lib/server/logger';
import { error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { checkAccessPerms } from '$lib/server/perms';

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
		return { id, error: 'Board not found' };
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

	if (!checkAccessPerms(board, user, perms)) {
		return { id, error: 'Access denied: You do not have permission to view this board' };
	}

	return { id, user, board, perms };
}

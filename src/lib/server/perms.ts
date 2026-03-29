import { Board, User, Permissions } from '$lib/server/db/schema';
import { error } from '@sveltejs/kit';
import { routeLogger } from './logger';
import { getRequestEvent } from '$app/server';
import type { AuthenticatedUser } from '$lib/types/auth/AuthenticatedUser';
import { and, count, eq } from 'drizzle-orm';
import { db } from './db';
import * as table from './db/schema';
import { authLogger } from './logger';

export function checkAccessPerms(
	board: typeof Board.$inferSelect,
	user: typeof User.$inferSelect | null,
	perms: typeof Permissions.$inferSelect | null
): boolean {
	// Admins always have access
	if (user?.role === 'Admin') return true;

	switch (board.type) {
		case 'Public':
			// anyone can read public boards
			return true;
		case 'Unlisted':
			// authenticated users can read unlisted boards
			if (!user && !perms) {
				return false;
			}
			return true;
		case 'Private':
			// only owner and users with perms can read private boards
			if (!user) {
				return false;
			}
			if (board.owner !== user.id && !perms) {
				routeLogger.warn(
					`User ${user?.id} does not have permissions to view board ${board.id}, owner is ${board.owner}`
				);
				return false;
			}
			return true;
	}
}

export const checkUserCanModify = (
	board: typeof Board.$inferSelect,
	user?: typeof User.$inferSelect | AuthenticatedUser,
	perms?: typeof Permissions.$inferSelect
): boolean => user?.role === 'Admin' || board.owner === user?.id || perms?.perm === 'Write';

/**
 * Route-level permission check that throws errors when access is denied.
 * Uses checkAccessPerms internally and handles error responses.
 */
export async function checkBoardPerms(board: typeof table.Board.$inferSelect) {
	const { locals } = getRequestEvent();

	const user = locals.user as AuthenticatedUser | null;

	const perms = user
		? db
				.select()
				.from(table.Permissions)
				.where(and(eq(table.Permissions.bid, board.id), eq(table.Permissions.uid, user.id)))
		: null;

	// Use the pure permission check
	const hasAccess = checkAccessPerms(
		board,
		user as typeof User.$inferSelect | null,
		perms as typeof Permissions.$inferSelect | null
	);

	if (!hasAccess) {
		if (!user) {
			authLogger.warn(`Unauthenticated access attempt to board ${board.id}`);
			error(401, 'unauthorized');
		} else {
			authLogger.warn(`User ${user.id} does not have permissions to view board ${board.id}`);
			error(403, 'forbidden');
		}
	}

	return perms;
}

export async function getBoard(id: string | number | undefined) {
	if (typeof id === 'undefined') {
		error(400, 'board id is required');
	}

	const board = await db
		.select()
		.from(table.Board)
		.where(eq(table.Board.id, typeof id === 'string' ? parseInt(id) : id))
		.then(res => res[0]);

	if (!board) {
		error(404, 'board not found');
	}

	await checkBoardPerms(board);

	const likes = await db
		.select({ count: count() })
		.from(table.BoardLikes)
		.where(eq(table.BoardLikes.board, typeof id === 'string' ? parseInt(id) : id))
		.then(res => res[0].count);

	return { board, likes };
}

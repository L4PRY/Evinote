import { requireLogin } from '$lib/server/auth';
import { User, Board, Permissions as Perms } from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { eq, and } from 'drizzle-orm';
import { checkUserCanModify } from '$lib/server/perms';
import type { Actions } from '@sveltejs/kit';

export const load = async ({ params }) => {
	const { id } = params;

	const user = requireLogin();

	const board = await db
		.select()
		.from(Board)
		.where(eq(Board.id, parseInt(id)))
		.then(res => res[0]);

	const perms = await db
		.select()
		.from(Perms)
		.where(and(eq(Perms.bid, parseInt(id)), eq(Perms.uid, user.id)))
		.then(res => res[0]);

	const contributors = await db
		.select({ username: User.username, id: User.id, permission: Perms.perm })
		.from(User)
		.leftJoin(Perms, eq(User.id, Perms.uid))
		.where(and(eq(Perms.bid, parseInt(id)), eq(Perms.uid, user.id)));

	return { id, user, board, contributors, canModify: checkUserCanModify(board, user, perms) };
};

import { requireLogin } from '$lib/server/auth';
import { User, Board, Permissions as Perms } from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { eq, and } from 'drizzle-orm';
import { checkUserCanModify } from '$lib/server/perms';
import type { Actions } from '@sveltejs/kit';
import type { Grid } from '$lib/types/canvas/Grid.js';

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

export const actions: Actions = {
	adduser: async ({ request, params }) => {
		const user = requireLogin();

		const form = await request.formData();
		const username = form.get('username') as string;
		const perm = form.get('permission') as 'Read' | 'Write';
		const { id } = params;

		if (!username || !perm) {
			return { error: 'Missing username or permission' };
		}

		const board = id
			? await db
					.select()
					.from(Board)
					.where(eq(Board.id, parseInt(id)))
					.then(res => res[0])
			: undefined;

		if (!board) {
			return { error: 'Board not found' };
		}

		const perms = await db
			.select()
			.from(Perms)
			.where(and(eq(Perms.bid, parseInt(id!)), eq(Perms.uid, user.id)))
			.then(res => res[0]);

		const contributor = await db
			.select()
			.from(User)
			.where(eq(User.username, username))
			.then(res => res[0]);

		if (!checkUserCanModify(board, user, perms)) {
			return { error: 'You do not have permission to modify this board' };
		}

		const newUser = await db
			.insert(Perms)
			.values({ bid: parseInt(id!), uid: contributor.id, perm });

		return { success: 'User added successfully' };
	},
	removeuser: async ({ request, params }) => {
		const user = requireLogin();

		const form = await request.formData();
		const uid = form.get('userId') as string;
		const { id } = params;

		if (!uid) {
			return { error: 'Missing user ID' };
		}

		const board = id
			? await db
					.select()
					.from(Board)
					.where(eq(Board.id, parseInt(id)))
					.then(res => res[0])
			: undefined;

		if (!board) {
			return { error: 'Board not found' };
		}

		const perms = await db
			.select()
			.from(Perms)
			.where(and(eq(Perms.bid, parseInt(id!)), eq(Perms.uid, user.id)))
			.then(res => res[0]);

		if (!checkUserCanModify(board, user, perms)) {
			return { error: 'You do not have permission to modify this board' };
		}

		await db.delete(Perms).where(and(eq(Perms.bid, parseInt(id!)), eq(Perms.uid, parseInt(uid))));
	},
	save: async ({ request, params }) => {
		const user = requireLogin();
		const form = await request.formData();
		const { id } = params;

		const boardName = form.get('boardName') as string;
		const canvasWidth = form.get('canvasWidth') as string;
		const canvasHeight = form.get('canvasHeight') as string;
		const backgroundType = form.get('backgroundType') as string;
		const backgroundValue = form.get('backgroundValue') as string;
		const gridType = form.get('gridType') as string | null;
		const gridSize = form.get('gridSize') as string | null;
		const gridColor = form.get('gridColor') as string | null;

		if (!boardName || !canvasWidth || !canvasHeight || !backgroundType || !backgroundValue) {
			return { error: 'Missing required fields' };
		}

		const board = id
			? await db
					.select()
					.from(Board)
					.where(eq(Board.id, parseInt(id)))
					.then(res => res[0])
			: undefined;

		if (!board) {
			return { error: 'Board not found' };
		}

		const perms = await db
			.select()
			.from(Perms)
			.where(and(eq(Perms.bid, parseInt(id!)), eq(Perms.uid, user.id)))
			.then(res => res[0]);

		if (!checkUserCanModify(board, user, perms)) {
			return { error: 'You do not have permission to modify this board' };
		}

		db.insert(Board).values({
			name: boardName,
			canvas: {
				size: {
					width: parseInt(canvasWidth),
					height: parseInt(canvasHeight)
				},
				background: {
					type: backgroundType
				}
			}
		});
	},
	delete: async ({ request, params }) => {}
};

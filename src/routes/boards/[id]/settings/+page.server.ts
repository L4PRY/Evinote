import { requireLogin } from '$lib/server/auth';
import { User, Board, Permissions as Perms } from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { eq, and } from 'drizzle-orm';
import { checkUserCanModify } from '$lib/server/perms';
import type { Actions } from '@sveltejs/kit';

import type { CanvasData } from '$lib/types/canvas/CanvasData.js';
import type { File } from 'node:buffer';
import { routeLogger } from '$lib/server/logger.js';

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
		.where(eq(Perms.bid, parseInt(id)));

	return { id, user, board, contributors, canModify: checkUserCanModify(board, user, perms) };
};

export const actions: Actions = {
	adduser: async ({ request, params }) => {
		routeLogger.info('heyy');
		const user = requireLogin();

		const form = await request.formData();
		const username = form.get('username') as string;
		const perm = form.get('permission') as 'Read' | 'Write';
		const { id } = params;

		if (!username || !perm) {
			routeLogger.warn(
				`User ${user.username} attempted to add a contributor without providing a username or permission on board ID: ${id}`
			);
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
			routeLogger.warn(
				`User ${user.username} attempted to add a contributor to non-existent board with ID: ${id}`
			);
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
			routeLogger.warn(
				`User ${user.username} attempted to add a contributor to board ${board.name} (ID: ${id}) without sufficient permissions`
			);
			return { error: 'You do not have permission to modify this board' };
		}

		const newUser = await db
			.insert(Perms)
			.values({ bid: parseInt(id!), uid: contributor.id, perm });

		routeLogger.info(
			`Added user ${username} with permission ${perm} to board ${board.name} (ID: ${id}) by user ${user.username}`
		);
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
		const canvasWidth = Number(form.get('canvasWidth'));
		const canvasHeight = Number(form.get('canvasHeight'));
		const thumbnailUrl = form.get('thumbnail') as string;
		const background = JSON.parse(form.get('background') as string) as CanvasData['background'];

		if (!boardName || !canvasWidth || !canvasHeight || !background || !thumbnailUrl) {
			return { error: 'Missing required fields' };
		}

		let thumbnailMime = await fetch(`/proxy?url=${thumbnailUrl}`, {
			method: 'HEAD'
		});

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

		await db
			.update(Board)
			.set({
				name: boardName,
				canvas: {
					size: {
						width: canvasWidth,
						height: canvasHeight
					},
					thumbnail: {
						location: thumbnailUrl,
						mime: thumbnailMime.headers.get('Content-Type') || 'application/octet-stream'
					},
					background
				}
			})
			.where(eq(Board.id, parseInt(id!)));

		return { success: 'Board settings saved successfully' };
	},
	delete: async ({ request, params }) => {}
};

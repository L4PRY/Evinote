import { requireLogin } from '$lib/server/auth';
import { User, Board, Permissions as Perms } from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { eq, and } from 'drizzle-orm';
import { checkUserCanModify } from '$lib/server/perms';
import { error, redirect, type Actions } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

import type { CanvasData } from '$lib/types/canvas/CanvasData.js';
import type { File } from 'node:buffer';
import { routeLogger } from '$lib/server/logger.js';
import { verify } from '@node-rs/argon2';
import { scryptSync } from 'node:crypto';

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

		if (!contributor) {
			routeLogger.warn(
				`User ${user.username} entry for add-contributor username: ${username} was not found`
			);
			return { error: 'User not found' };
		}

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
	save: async ({ request, params, url }) => {
		const user = requireLogin();
		const form = await request.formData();
		const { id } = params;

		const name = form.get('name') as string;
		const size = JSON.parse(form.get('size') as string) as CanvasData['size'];
		const type = form.get('type') as unknown as (typeof Board.type.enumValues)[number];
		const thumbnail = form.get('thumbnail') as string;
		const background = JSON.parse(form.get('background') as string) as CanvasData['background'];

		routeLogger.info('save form entries are', { name, size, type, thumbnail, background });

		if (!name || !size || !type || !background) {
			return error(400, 'Missing required fields');
		}

		let thumbnailMime = await fetch(`${url.origin}/proxy?url=${thumbnail}`, {
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
			return error(404, 'board not found');
		}

		const perms = await db
			.select()
			.from(Perms)
			.where(and(eq(Perms.bid, parseInt(id!)), eq(Perms.uid, user.id)))
			.then(res => res[0]);

		if (!checkUserCanModify(board, user, perms)) {
			return error(403, 'You do not have permission to modify this board');
		}

		try {
			await db
				.update(Board)
				.set({
					name,
					type,
					canvas: {
						size,
						thumbnail: {
							location: thumbnail,
							mime: thumbnailMime.headers.get('Content-Type') || 'application/octet-stream'
						},
						background
					}
				})
				.where(eq(Board.id, parseInt(id!)));

			return { success: 'Board settings saved successfully' };
		} catch (err) {
			routeLogger.error('Error updating board settings:', err);
			return error(400, 'An error occurred while saving board settings');
		}
	},
	delete: async ({ request, params }) => {
		const user = requireLogin();
		const { id } = params;
		const form = await request.formData();
		const email = form.get('email') as string;
		const password = form.get('password') as string;

		const board = id
			? await db
					.select()
					.from(Board)
					.where(eq(Board.id, parseInt(id)))
					.then(r => r[0])
			: undefined;

		if (!board) error(404, 'board not found');
		routeLogger.info('board is:', board.name);

		const owner = await db
			.select()
			.from(User)
			.where(eq(User.id, board.owner))
			.then(r => r[0]);

		if (board.owner !== user.id) error(403, 'forbidden');

		const validPassword =
			env.USE_LEGACY_HASH == '1'
				? scryptSync(password, 'dev-use-do-not-use-in-prod', 32).toString('hex') === owner.passhash
				: await verify(owner.passhash, password, {
						memoryCost: 19456,
						timeCost: 2,
						outputLen: 32,
						parallelism: 1
					});

		if (owner.email !== email || !validPassword) error(403, 'bad email or password');

		await db
			.delete(Board)
			.where(eq(Board.id, parseInt(id!)))
			.catch(err => {
				routeLogger.error('Error deleting board:', err);
				throw error(500, 'An error occurred while deleting the board');
			});

		return redirect(303, '/boards');
	}
};

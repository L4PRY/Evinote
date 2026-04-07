import { db } from '$lib/server/db';
import {
	deleteSessionTokenCookie,
	hashPassword,
	invalidateSession,
	requireLogin,
	verifyPassword
} from '$lib/server/auth';
import * as table from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';
import { and, desc, eq } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';
import { validateEmail, validatePassword, validateUsername } from '$lib/parseInput';
import type { SettingsForm, SettingsFormReturn } from '$lib/types/dashboard/SettingsForm';

export const load: PageServerLoad = async event => {
	// username
	// email
	// profile picture with history of last 5
	const user = requireLogin();
	const email = await db
		.select()
		.from(table.User)
		.where(eq(table.User.id, event.locals.user!.id))
		.limit(1)
		.then(res => res[0].email);

	const profilePictures = await db
		.select({ id: table.Files.id, date: table.UserPfp.updated, hash: table.Files.hash })
		.from(table.UserPfp)
		.innerJoin(table.Files, eq(table.Files.id, table.UserPfp.file))
		.where(eq(table.UserPfp.user, event.locals.user!.id))
		.orderBy(desc(table.UserPfp.updated))
		.limit(6); // cause first is latest

	return { user, email, profilePictures };
};

export const actions: Actions = {
	setPfp: async event => {
		const user = requireLogin();
		const form = await event.request.formData();
		const id = Number(form.get('id'));

		if (isNaN(id)) return fail(400, 'id not a number conversible');

		const isUpdated = await db
			.update(table.UserPfp)
			.set({ updated: new Date(Date.now()) })
			.where(and(eq(table.UserPfp.user, user.id), eq(table.UserPfp.file, id)))
			.returning();

		if (isUpdated.length === 0) await db.insert(table.UserPfp).values({ user: user.id, file: id });

		return { success: true, message: 'pfp set successfully' };
	},
	updateProfile: async event => {
		const user = requireLogin();
		const formData = await event.request.formData();
		const username = formData.get('username') as string;
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		let userProps: { username?: string; email?: string } = {};
		let formReturn: SettingsFormReturn = {};

		if (!password) {
			formReturn.oldPassword = {
				message: 'Password is required to update profile',
				value: '',
				success: false
			};
			return fail(400, { message: 'Password required', formReturn });
		}

		// Verify password before any change
		const dbUser = await db
			.select()
			.from(table.User)
			.where(eq(table.User.id, user.id))
			.then(r => r.at(0));

		if (!dbUser || !(await verifyPassword(dbUser.passhash, password))) {
			formReturn.oldPassword = {
				message: 'Incorrect password',
				value: '',
				success: false
			};
			return fail(400, { message: 'Incorrect password', formReturn });
		}

		if (username && username !== user.username) {
			if (!validateUsername(username)) {
				formReturn.username = { message: 'Invalid username format', value: username, success: false };
				return fail(400, { message: 'Invalid username', formReturn });
			}
			const existingUser = await db
				.select()
				.from(table.User)
				.where(eq(table.User.username, username))
				.then(r => r.at(0));

			if (existingUser) {
				formReturn.username = { message: 'Username already taken', value: username, success: false };
				return fail(400, { message: 'Username taken', formReturn });
			}
			userProps.username = username;
			formReturn.username = { message: 'Username updated', value: username, success: true };
		}

		if (email && email !== dbUser.email) {
			if (!validateEmail(email)) {
				formReturn.email = { message: 'Invalid email format', value: email, success: false };
				return fail(400, { message: 'Invalid email', formReturn });
			}
			const existingEmail = await db
				.select()
				.from(table.User)
				.where(eq(table.User.email, email))
				.then(r => r.at(0));

			if (existingEmail) {
				formReturn.email = { message: 'Email already in use', value: email, success: false };
				return fail(400, { message: 'Email in use', formReturn });
			}
			userProps.email = email;
			formReturn.email = { message: 'Email updated', value: email, success: true };
		}

		if (Object.keys(userProps).length > 0) {
			await db.update(table.User).set(userProps).where(eq(table.User.id, user.id));
		}

		return { message: 'Profile updated successfully', formReturn };
	},
	changePassword: async event => {
		const user = requireLogin();
		const formData = await event.request.formData();
		const oldPassword = formData.get('oldPassword') as string;
		const newPassword = formData.get('newPassword') as string;

		let formReturn: SettingsFormReturn = {};

		if (!oldPassword || !newPassword) {
			return fail(400, { message: 'Missing fields', formReturn });
		}

		const dbUser = await db
			.select()
			.from(table.User)
			.where(eq(table.User.id, user.id))
			.then(r => r.at(0));

		if (!dbUser || !(await verifyPassword(dbUser.passhash, oldPassword))) {
			formReturn.oldPassword = {
				message: 'Current password is incorrect',
				value: '',
				success: false
			};
			return fail(400, { message: 'Incorrect password', formReturn });
		}

		if (!validatePassword(newPassword)) {
			formReturn.newPassword = {
				message: 'New password does not meet criteria',
				value: '',
				success: false
			};
			return fail(400, { message: 'Weak password', formReturn });
		}

		const passhash = await hashPassword(newPassword);
		await db.update(table.User).set({ passhash }).where(eq(table.User.id, user.id));

		formReturn.newPassword = { message: 'Password updated successfully', value: '', success: true };
		return { message: 'Password updated successfully', formReturn };
	},

	deleteAccount: async event => {
		const user = requireLogin();
		const session = event.locals.session;
		const formData = await event.request.formData();
		const username = formData.get('username') as string;
		const password = formData.get('password') as string;
		const files = formData.get('files') as 'yes' | 'no' | string;

		let deleteFiles = files === 'yes' ? true : false;

		if (!username || !password) return fail(400, 'missing required fields');

		if (username !== user.username) return fail(400, 'invalid entry');

		const dbUser = await db
			.select()
			.from(table.User)
			.where(eq(table.User.id, user.id))
			.then(r => r.at(0));

		if (!dbUser) return fail(500, 'cannot find user on server');

		const result = await verifyPassword(dbUser.passhash, password);

		if (!result) return fail(403, 'invalid entry');

		// this deletes everything from Session, Board, Permissions and BoardLikes
		// Files is kept for if a board is using an image another user had uploaded,
		// but should still be able to be deleted if a gdpr request is made (lol).

		// todo: implement actual logic for wiping images off disk programmatically
		// route and method already exist, just gotta think of a way to do it proper
		await db.transaction(async tx => {
			if (deleteFiles) {
				await tx.delete(table.UserPfp).where(and(eq(table.UserPfp.user, user.id)));
				await tx
					.delete(table.Files)
					.where(
						eq(
							table.Files.id,
							tx
								.select({ id: table.Files.id })
								.from(table.UserPfp)
								.where(eq(table.UserPfp.user, user.id))
								.leftJoin(table.Files, eq(table.Files.id, table.UserPfp.file))
						)
					);
			}
			// delete all boards
			await tx.delete(table.Board).where(eq(table.Board.owner, user.id));

			// delete all sessions
			await tx.delete(table.Session).where(eq(table.Session.user, user.id));

			// delete user finally
			await tx.delete(table.User).where(eq(table.User.id, user.id));
		});

		invalidateSession(session!.id);
		deleteSessionTokenCookie(event);
		return { success: true, message: 'Account deleted successfully' };
	}
};

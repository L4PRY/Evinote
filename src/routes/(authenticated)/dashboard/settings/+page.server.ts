import { db } from '$lib/server/db';
import {
	deleteSessionTokenCookie,
	hashPassword,
	invalidateSession,
	requireLogin,
	validateSessionToken,
	verifyPassword
} from '$lib/server/auth';
import * as table from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';
import { and, desc, eq } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';
import { verify } from '@node-rs/argon2';
import { validateEmail, validatePassword, validateUsername } from '$lib/parseInput';
import type { SettingsForm } from '$lib/types/dashboard/SettingsForm';
import { goto } from '$app/navigation';

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
		.leftJoin(table.Files, eq(table.Files.id, table.UserPfp.file))
		.where(eq(table.UserPfp.user, event.locals.user!.id))
		.orderBy(desc(table.UserPfp.updated))
		.limit(6); // cause first is latest

	return { user, email, profilePictures };
};

export const actions: Actions = {
	setPfp: async event => {
		// validate file type && size
		// should the uploading even happen on the server?
		// should we should just like
		// handle uploading on client
		// send url back to server
		// then server adds it to db
		const user = requireLogin();
		const form = await event.request.formData();
		const id = Number(form.get('id'));

		if (isNaN(id)) return fail(400, 'id not a number conversible');

		console.log(id);

		// check wether pfp already exists with id for user, if so just update the date

		const isUpdated = await db
			.update(table.UserPfp)
			.set({ updated: new Date(Date.now()) })
			.where(and(eq(table.UserPfp.user, user.id), eq(table.UserPfp.file, id)))
			.returning();

		if (isUpdated.length === 0) await db.insert(table.UserPfp).values({ user: user.id, file: id });

		// purge all pfps that are older than the sixth img in descending order
		// weh; later

		return { success: true, message: 'pfp set successfully' };
	},
	setUserProps: async event => {
		// validate username for conflicts
		// validate email for 1 per account
		// validate old password
		// validate new password
		const user = requireLogin();
		const formData = await event.request.formData();
		const username = formData.get('username') as string;
		const email = formData.get('email') as string;
		const oldPassword = formData.get('oldPassword') as string;
		const newPassword = formData.get('newPassword') as string;

		let userProps = {
			username: undefined as string | undefined,
			email: undefined as string | undefined,
			passhash: undefined as string | undefined
		};

		let formReturn = {
			username: undefined as SettingsForm | undefined,
			email: undefined as SettingsForm | undefined,
			oldPassword: undefined as SettingsForm | undefined,
			newPassword: undefined as SettingsForm | undefined
		};

		if (username) {
			// check if username is already taken
			const existingUser = await db
				.select()
				.from(table.User)
				.where(eq(table.User.username, username))
				.then(r => r.at(0));

			if (existingUser && existingUser.id !== user.id && !validateUsername(username)) {
				return fail(400, {
					message: 'Username already taken',
					formReturn: { ...formReturn, username: 'Username already taken' }
				});
			}

			formReturn = {
				...formReturn,
				username: { message: 'Username successfully set', value: username }
			};
			userProps.username = username;
		}

		if (email) {
			// check if email is already taken
			const existingEmail = await db
				.select()
				.from(table.User)
				.where(eq(table.User.email, email))
				.then(r => r.at(0));

			if (existingEmail && existingEmail.id !== user.id && !validateEmail(email)) {
				return fail(400, {
					message: 'Email already in use',
					formReturn: { ...formReturn, email: 'Email already in use' }
				});
			}

			formReturn = {
				...formReturn,
				email: { message: 'Email successfully set', value: email }
			};
			userProps.email = email;
		}

		if (oldPassword && newPassword) {
			// get current password hash
			const existingHash = await db
				.select()
				.from(table.User)
				.where(eq(table.User.id, user.id))
				.then(r => r.at(0)?.passhash);

			if (!existingHash) {
				throw error(500, 'User not found');
			}

			// verify old password
			const isValid = await verifyPassword(existingHash, oldPassword);

			if (!isValid) {
				return fail(400, {
					message: 'Old password is incorrect',
					formReturn: { ...formReturn, oldPassword: 'Old password is incorrect' }
				});
			}

			// validate new password
			if (validatePassword(newPassword)) {
				return fail(400, {
					message: 'New password does not meet criteria',
					formReturn: { ...formReturn, newPassword: validatePassword(newPassword) }
				});
			}

			// hash new password
			formReturn = {
				...formReturn,
				newPassword: { message: 'Password successfully updated', value: '' },
				oldPassword: { message: 'Old password verified', value: '' }
			};
			userProps.passhash = await hashPassword(newPassword);
		}

		if (Object.keys(userProps).length > 0) {
			await db.update(table.User).set(userProps).where(eq(table.User.id, user.id));
		}

		return { message: 'Account updated successfully', formReturn };
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

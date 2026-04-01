import { db } from '$lib/server/db';
import { hashPassword, requireLogin, validateSessionToken, verifyPassword } from '$lib/server/auth';
import * as table from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';
import { desc, eq } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';
import { verify } from '@node-rs/argon2';
import { validatePassword } from '$lib/parseInput';
import type { SettingsForm } from '$lib/types/dashboard/SettingsForm';

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
		.select({ date: table.UserPfp.updated, hash: table.Files.hash })
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
			password: undefined as string | undefined
		};

		let formReturn = {
			username: undefined as SettingsForm | undefined,
			email: undefined as SettingsForm | undefined,
			oldPassword: undefined as SettingsForm | undefined,
			newPassword: undefined as SettingsForm | undefined
		};

		if (!username || !email || !oldPassword || !newPassword)
			return fail(400, { message: 'Missing required fields', formReturn });

		if (username) {
			const existingUser = await db
				.select()
				.from(table.User)
				.where(eq(table.User.username, username))
				.limit(1)
				.then(res => res[0]);

			if (existingUser && existingUser.id !== user.id)
				return fail(400, { message: 'Username already taken', formReturn });

			userProps.username = username;
			formReturn.username = { message: 'Username looks good', value: username };
		}

		if (email) {
			const existingEmail = await db
				.select()
				.from(table.User)
				.where(eq(table.User.email, email))
				.limit(1)
				.then(res => res[0]);

			if (existingEmail && existingEmail.id !== user.id)
				return fail(400, { message: 'Email already in use', formReturn });

			userProps.email = email;
			formReturn.email = { message: 'Email looks good', value: email };
		}

		const passwordHash = await db
			.select({ passwordHash: table.User.passhash })
			.from(table.User)
			.where(eq(table.User.id, user.id))
			.limit(1)
			.then(res => res[0].passwordHash);

		const newPasshash = await hashPassword(newPassword);

		if (!passwordHash || !(await verify(passwordHash, oldPassword))) {
			return fail(400, {
				message: 'Old password is incorrect',
				formReturn: {
					...formReturn,
					oldPassword: { message: 'Old password is incorrect', value: undefined }
				}
			});
		} else {
			userProps.password = newPassword;
			formReturn.oldPassword = { message: 'Old password is correct', value: undefined };

			if (validatePassword(newPassword)) {
				await db.update(table.User).set({ passhash: newPasshash });

				formReturn.newPassword = { message: 'New password looks good', value: undefined };
			}
		}

		return { message: 'Account updated successfully', formReturn };
	},
	deleteAccount: async event => {}
};

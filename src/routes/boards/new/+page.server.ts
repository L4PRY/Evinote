import type { Actions } from './$types';
import { requireLogin } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { fail, redirect } from '@sveltejs/kit';
import * as table from '$lib/server/db/schema';

export const load = async () => requireLogin();

export const actions: Actions = {
	create: async (event) => {
		const formData = await event.request.formData();
		const name = formData.get('name');
		const access = formData.get('access');

		if (typeof name !== 'string' || typeof access !== 'string')
			return fail(400, { success: false, message: 'Invalid form data' });
		else if (!['Public', 'Unlisted', 'Private'].includes(access))
			return fail(400, { success: false, message: 'Invalid access type' });

		const result = await db
			.insert(table.Board)
			.values({
				name: name as string,
				type: access as 'Public' | 'Unlisted' | 'Private',
				owner: event.locals.user!.id,
				updated: new Date(Date.now())
			})
			.returning();

		const board = result[0];

		return redirect(303, `/boards/${board.id}`);
	}
};

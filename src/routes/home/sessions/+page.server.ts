import { db } from '$lib/server/db';
import { validateSessionToken } from '$lib/server/auth';
import * as table from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	const result = await db
		.select()
		.from(table.Session)
		.where(eq(table.Session.userId, event.locals.user!.id))
		.orderBy(table.Session.iat);

	return { sessions: result };
};

export const actions: Actions = {
	invalidate: async (event) => {
		const formData = await event.request.formData();
		const sessionId = formData.get('sessionId');

		if (!sessionId || typeof sessionId !== 'string') {
			return { success: false, message: 'Invalid session ID' };
		}

		const session = await db
			.select()
			.from(table.Session)
			.where(eq(table.Session.id, sessionId))
			.limit(1)
			.then((res) => res[0]);

		if (!session || session.userId !== event.locals.user!.id) {
			return { success: false, message: 'Session not found or unauthorized' };
		}

		await db.delete(table.Session).where(eq(table.Session.id, sessionId));

		validateSessionToken(sessionId); // Clean up any local references if needed

		return { success: true };
	}
};

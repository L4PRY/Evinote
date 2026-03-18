import { json, type RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';

/* =====================================================
   GET
===================================================== */
export async function GET(event: RequestEvent) {
	const { params, locals } = event;

	const userId = Number(params.id);

	if (isNaN(userId)) {
		return json({ message: 'Invalid user ID' }, { status: 400 });
	}

	const requestingUser = locals.user;

	const user = await db
		.select()
		.from(table.User)
		.where(eq(table.User.id, userId))
		.then((res) => res[0]);

	if (!user) {
		return json({ message: 'User not found' }, { status: 404 });
	}

	const conditions = [eq(table.Board.owner, userId)];

	if (!requestingUser || requestingUser.role !== 'Admin') {
		conditions.push(eq(table.Board.type, 'Public'));
	}

	const boards = await db
		.select()
		.from(table.Board)
		.where(and(...conditions));

	return json({ user, boards });
}

/* =====================================================
   PUT
===================================================== */
export async function PUT(event: RequestEvent) {
	const { params, request, locals } = event;

	const userId = Number(params.id);

	if (isNaN(userId)) {
		return json({ message: 'Invalid user ID' }, { status: 400 });
	}

	if (!locals.user) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	const requestingUser = locals.user;

	const user = await db
		.select()
		.from(table.User)
		.where(eq(table.User.id, userId))
		.then((res) => res[0]);

	if (!user) {
		return json({ message: 'User not found' }, { status: 404 });
	}

	if (requestingUser.id !== userId && requestingUser.role !== 'Admin') {
		return json({ message: 'Forbidden' }, { status: 403 });
	}

	const body = await request.json();

	await db
		.update(table.User)
		.set({
			username: body.username,
			email: body.email,
			...(requestingUser.role === 'Admin' && body.role
				? { role: body.role }
				: {})
		})
		.where(eq(table.User.id, userId));

	return new Response(null, { status: 204 });
}

export async function DELETE(event: RequestEvent) {
	try {
		const { params } = event;

		const userId = Number(params.id);

		if (isNaN(userId)) {
			return json({ error: 'Invalid user ID' }, { status: 400 });
		}

		const existing = await db
			.select()
			.from(table.User)
			.where(eq(table.User.id, userId))
			.then((res) => res[0]);

		if (!existing) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		await db.delete(table.Session).where(eq(table.Session.userId, userId));

		await db.delete(table.Board).where(eq(table.Board.owner, userId));

		await db.delete(table.User).where(eq(table.User.id, userId));

		return json({ message: 'User deleted' });

	} catch (err) {
		console.error('DELETE ERROR:', err);
		return json({ error: 'Server error' }, { status: 500 });
	}
}
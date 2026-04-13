import { json, type RequestEvent } from '@sveltejs/kit';
import { requireLogin } from '$lib/server/auth';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { and, eq, desc } from 'drizzle-orm';

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
		.then(res => res[0]);

	if (!user) {
		return json({ message: 'User not found' }, { status: 404 });
	}

	const conditions = [eq(table.Board.owner, userId)];

	if (!requestingUser || requestingUser.role !== 'Admin') {
		conditions.push(eq(table.Board.type, 'Public'));
	}

	const userPfp = await db
		.select()
		.from(table.Files)
		.leftJoin(table.UserPfp, eq(table.UserPfp.file, table.Files.id))
		.where(eq(table.UserPfp.user, userId))
		.orderBy(desc(table.UserPfp.updated))
		.limit(1)
		.then(res => res[0]);

	const boards = await db
		.select()
		.from(table.Board)
		.where(and(...conditions));

	return json(
		{
			id: user.id,
			email: requestingUser?.role === 'Admin' ? user.email : null,
			username: user.username,
			role: requestingUser?.role === 'Admin' ? user.role : null,
			created: user.created,
			pfp: userPfp ? `/api/files/${userPfp.files.hash}` : null
		},
		{ status: 200, headers: { 'Content-Type': 'application/json' } }
	);
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
		.then(res => res[0]);

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
			...(requestingUser.role === 'Admin' && body.role ? { role: body.role } : {})
		})
		.where(eq(table.User.id, userId));

	return new Response(null, { status: 204, headers: { 'Content-Type': 'application/json' } });
}

export async function DELETE(event: RequestEvent) {
	const { params } = event;

	if (event.locals.user?.role !== 'Admin') return json({ error: 'Forbidden' }, { status: 403 });

	const userId = Number(params.id);

	if (isNaN(userId)) {
		return json({ error: 'Invalid user ID' }, { status: 400 });
	}

	const existing = await db
		.select()
		.from(table.User)
		.where(eq(table.User.id, userId))
		.then(res => res[0]);

	if (!existing) {
		return json({ error: 'User not found' }, { status: 404 });
	}

	await db.delete(table.Session).where(eq(table.Session.user, userId));

	await db.delete(table.Board).where(eq(table.Board.owner, userId));

	await db.delete(table.User).where(eq(table.User.id, userId));

	return json({ message: 'User deleted' });
}

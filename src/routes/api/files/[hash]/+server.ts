import { requireLogin } from '$lib/server/auth.js';
import { db } from '$lib/server/db/index.js';
import { Files } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { join as pathJoin } from 'node:path';
import { readFileSync } from 'node:fs';
import { routeLogger } from '$lib/server/logger.js';

export const GET = async ({ params }) => {
	const user = requireLogin();
	const { hash } = params;

	const col = await db
		.select()
		.from(Files)
		.where(eq(Files.hash, hash))
		.then(r => r.at(0));

	if (!col) return new Response('file not found', { status: 404 });

	const path = pathJoin('./uploads/', hash.charAt(0), '/', hash.charAt(1), '/', hash.slice(2));

	// read file contents with correct encoding
	const file = readFileSync(path);

	routeLogger.info(`User ${user.username} accessed file ${col.filename} with hash ${hash}`);

	return new Response(file, {
		status: 200,
		headers: {
			'Content-Type': col.mimetype,
			'Content-Disposition': `inline; filename="${col.filename}"`
		}
	});
};

export const DELETE = async ({ params }) => {
	const user = requireLogin();
	const { hash } = params;

	const col = await db
		.select()
		.from(Files)
		.where(eq(Files.hash, hash))
		.then(r => r.at(0));

	if (!col) return new Response('file not found', { status: 404 });
	if (col.uploader !== user.id && user.role !== 'Admin')
		return new Response('forbidden', { status: 403 });

	await db.delete(Files).where(eq(Files.hash, hash));

	routeLogger.info(`User ${user.username} deleted file ${col.filename} with hash ${hash}`);
};

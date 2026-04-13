import { requireLogin } from '$lib/server/auth.js';
import { db } from '$lib/server/db/index.js';
import { Files } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { join as pathJoin } from 'node:path';
import { readFile } from 'node:fs/promises';
import { routeLogger } from '$lib/server/logger.js';
import { rmSync } from 'node:fs';

export const GET = async ({ request, params }) => {
	const { hash } = params;

	const col = await db
		.select()
		.from(Files)
		.where(eq(Files.hash, hash))
		.then(r => r.at(0));

	if (!col) return new Response('file not found', { status: 404 });

	// check for cache header
	const ifNoneMatch = request.headers.get('if-none-match');
	if (ifNoneMatch === col.hash) {
		return new Response(null, { status: 304 });
	}

	const path = pathJoin('./uploads/', hash.charAt(0), '/', hash.charAt(1), '/', hash.slice(2));

	try {
		// read file contents with correct encoding
		const file = await readFile(path);

		return new Response(file, {
			status: 200,
			headers: {
				'Content-Type': col.mimetype,
				'Content-Disposition': `inline; filename="${col.filename}"`,
				'Cache-Control': 'public, max-age=31536000, immutable',
				'E-Tag': col.hash
			}
		});
	} catch (e: unknown) {
		routeLogger.error(`Error reading file ${col.filename} with hash ${hash}: ${e}`);

		if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
			await db.delete(Files).where(eq(Files.hash, hash));
			return new Response('file not found', { status: 404 });
		}
		return new Response('internal server error', { status: 500 });
	}
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

	const path = pathJoin('./uploads/', hash.charAt(0), '/', hash.charAt(1), '/', hash.slice(2));

	try {
		await db.delete(Files).where(eq(Files.hash, hash));
		rmSync(path);

		return new Response('file deleted', { status: 200 });
	} catch (e) {
		routeLogger.error(`Error deleting file ${col.filename} with hash ${hash}: ${e}`);
		return new Response('internal server error', { status: 500 });
	}
};

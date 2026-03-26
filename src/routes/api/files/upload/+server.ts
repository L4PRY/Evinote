import AllowedFiles from '$lib/types/AllowedFiles.js';
import { error } from '@sveltejs/kit';
import { writeFile } from 'node:fs/promises';
import { db } from '$lib/server/db/index';
import { Files } from '$lib/server/db/schema';
import { eq, or } from 'drizzle-orm';
import { requireLogin } from '$lib/server/auth.js';
import { getRequestEvent } from '$app/server';
import { join as pathJoin } from 'node:path';
import { routeLogger } from '$lib/server/logger.js';
import { existsSync, mkdirSync } from 'node:fs';

// TODO: add some sort of ratelimiting, later
const UPLOAD_FOLDER = './uploads/';

export const POST = async ({ request }) => {
	const user = requireLogin();
	const form = await request.formData();
	const file = form.get('file') as File;

	if (!(file instanceof File)) throw error(400, 'no file uploaded');
	const fileExtension = file.name.split('.').pop()?.toLowerCase();

	if (!fileExtension || !AllowedFiles.includes(fileExtension)) error(400, 'file type not allowed');

	// 50MB limit
	if (file.size > 50 * 1024 * 1024) throw error(400, 'file size is greater than 50mb');

	const contents = file.arrayBuffer();
	const hash = crypto.subtle.digest('SHA-256', await contents);
	const hashHex = Buffer.from(await hash).toString('hex');

	const fileLoc = await db
		.select()
		.from(Files)
		.where(eq(Files.hash, hashHex))
		.limit(1)
		.then(result => result.at(0));

	// return already existing file if exists
	if (fileLoc) {
		return new Response(JSON.stringify({ id: fileLoc.id, url: `/api/files/${fileLoc.hash}` }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const result = await db
		.insert(Files)
		.values({
			hash: hashHex,
			filename: file.name,
			mimetype: file.type,
			uploader: user.id // TODO: add uploader id when auth is implemented
		})
		.returning({ id: Files.id, hash: Files.hash, filename: Files.filename, mime: Files.mimetype });

	const folderPath = pathJoin(UPLOAD_FOLDER, hashHex.charAt(0), hashHex.charAt(1));
	const filePath = pathJoin(folderPath, hashHex.slice(2));

	routeLogger.info(`Saving file ${file.name} with hash ${hashHex} to ${filePath}`);

	// check if path exists, if not create directory structure
	if (!existsSync(folderPath)) {
		mkdirSync(folderPath, { recursive: true });
	}
	await writeFile(filePath, Buffer.from(await contents));

	return new Response(JSON.stringify({ url: `/api/files/${hashHex}`, mime: file.type }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' }
	});
};

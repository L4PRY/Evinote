import { Board } from '$lib/server/db/schema';

export async function generateETag(
	boardData: typeof Board.$inferSelect,
	theme: string
): Promise<string> {
	const hash = await crypto.subtle.digest(
		'SHA-256',
		new TextEncoder().encode(JSON.stringify(boardData))
	);
	return `"${Array.from(new Uint8Array(hash))
		.map(b => b.toString(16).padStart(2, '0'))
		.join('')}"`;
}

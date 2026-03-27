import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET() {
    const users = await db.select({
        id: table.User.id,
        username: table.User.username,
        email: table.User.email,
        created_at: table.User.createdAt,
    }).from(table.User);

    return new Response(JSON.stringify(users), {
        status: 200, headers: { 'Content-Type': 'application/json' }
    });
}
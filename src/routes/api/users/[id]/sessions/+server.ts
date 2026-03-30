import { db } from '$lib/server/db';
import { Board, User, Session } from '$lib/server/db/schema';
import { eq, and, inArray, count, sql } from 'drizzle-orm';
import { requireLogin } from '$lib/server/auth';
import { error } from '@sveltejs/kit';

export const GET = async ({ params }) => {
  const { id } = params;

  const user = requireLogin(); // bejelentkezett user objektum

  const sessions = await db
    .select()
    .from(Session)
    .where(
      user.role === 'Admin'
        ? eq(Session.userId, parseInt(id))       // Admin minden userhez hozzáfér
        : eq(Session.userId, user.id)            // Non-admin csak a saját session-jeihez
    );

    console.log('Sessions for user', id, ':', sessions);

  return new Response(JSON.stringify(sessions), { status: 200, headers: { 'Content-Type': 'application/json' } });
};

import { db } from '$lib/server/db/index.js';
import { Board, BoardLikes } from '$lib/server/db/schema.js';
import { type Filter, timeframes, filters } from '$lib/types/trending/Filter';
import { error } from '@sveltejs/kit';
import { count, desc, eq, sql, and, SQL, isNotNull } from 'drizzle-orm';
import { checkLogin } from '$lib/server/auth';

function getLikesWithTimeframe(timeframe: Filter['timeframe']) {
	switch (timeframe) {
		case 'day': {
			return sql`${BoardLikes.at} >= NOW() - INTERVAL '1 day'`;
		}
		case 'week': {
			return sql`${BoardLikes.at} >= NOW() - INTERVAL '1 week'`;
		}
		case 'month': {
			return sql`${BoardLikes.at} >= NOW() - INTERVAL '1 month'`;
		}
		case 'year': {
			return sql`${BoardLikes.at} >= NOW() - INTERVAL '1 year'`;
		}
		case 'hour': {
			return sql`${BoardLikes.at} >= NOW() - INTERVAL '1 hour'`;
		}
		case 'all': {
			return sql`TRUE`;
		}
	}
}

function getUpdatedWithTimeframe(timeframe: Filter['timeframe']) {
	switch (timeframe) {
		case 'day': {
			return sql`${Board.updated} >= NOW() - INTERVAL '1 day'`;
		}
		case 'week': {
			return sql`${Board.updated} >= NOW() - INTERVAL '1 week'`;
		}
		case 'month': {
			return sql`${Board.updated} >= NOW() - INTERVAL '1 month'`;
		}
		case 'year': {
			return sql`${Board.updated} >= NOW() - INTERVAL '1 year'`;
		}
		case 'hour': {
			return sql`${Board.updated} >= NOW() - INTERVAL '1 hour'`;
		}
		case 'all': {
			return sql`TRUE`;
		}
	}
}

export const GET = async ({ params, url }) => {
	const { filter, timeframe } = params as {
		filter: Filter['type'];
		timeframe: Filter['timeframe'];
	};

	const user = checkLogin();

	// amount of boards to get
	const lower = Number(url.searchParams.get('lower')) || 0;
	const upper = Number(url.searchParams.get('upper')) || 50;

	// check if filter is in enum
	if (!timeframes.includes(timeframe)) error(400, 'invalid timeframe');
	if (!filters.includes(filter)) error(400, 'invalid filter');

	return new Response(
		JSON.stringify(
			filter === 'likes'
				? await db // based on likes
						.select({
							id: Board.id,
							title: Board.name,
							updated: Board.updated,
							likes: count(BoardLikes.board),
							liked: user ? sql`EXISTS (SELECT 1 FROM ${BoardLikes} WHERE ${BoardLikes.board} = ${Board.id} AND ${BoardLikes.user} = ${user.id})` : sql`FALSE`
						})
						.from(Board)
						.leftJoin(BoardLikes, eq(BoardLikes.board, Board.id))
						.where(and(eq(Board.type, 'Public'), getLikesWithTimeframe(timeframe)))
						.orderBy(desc(count(BoardLikes.board)))
						.groupBy(Board.id)
						.limit(upper)
						.offset(lower)
				: await db // last updated
						.select({
							id: Board.id,
							title: Board.name,
							updated: Board.updated,
							likes: count(BoardLikes.board),
							liked: user ? sql`EXISTS (SELECT 1 FROM ${BoardLikes} WHERE ${BoardLikes.board} = ${Board.id} AND ${BoardLikes.user} = ${user.id})` : sql`FALSE`
						})
						.from(Board)
						.where(and(eq(Board.type, 'Public'), getUpdatedWithTimeframe(timeframe)))
						.leftJoin(BoardLikes, eq(BoardLikes.board, Board.id))
						.orderBy(desc(Board.updated))
						.groupBy(Board.id)
						.limit(upper)
						.offset(lower)
		),
		{
			headers: { 'Content-Type': 'application/json' }
		}
	);
};

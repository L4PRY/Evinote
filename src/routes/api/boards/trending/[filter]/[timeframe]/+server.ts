import { db } from '$lib/server/db/index.js';
import { Board, BoardLikes } from '$lib/server/db/schema.js';
import { routeLogger } from '$lib/server/logger.js';
import { type Filter, timeframes, filters } from '$lib/types/trending/Filter';
import { error } from '@sveltejs/kit';
import { count, desc, eq, sql, and, SQL } from 'drizzle-orm';

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

	// amount of boards to get
	const lower = Number(url.searchParams.get('lower')) || 0;
	const upper = Number(url.searchParams.get('upper')) || 50;

	routeLogger.trace(
		`got trending request with ${filter} on ${timeframe} with limits ${lower} and ${upper}`
	);

	// check if filter is in enum
	if (!timeframes.includes(timeframe)) error(400, 'invalid timeframe');
	if (!filters.includes(filter)) error(400, 'invalid filter');

	// order by likes || updated
	// if likes then order by amount of likes within timeframe
	// if updated then order by most frequently updated board within timeframe

	// const dbFilter =
	// 	filter === 'likes' ? getLikesWithTimeframe(timeframe) : getUpdatedWithTimeframe(timeframe);

	// const result = await db
	// 	.select({
	// 		id: Board.id,
	// 		title: Board.name,
	// 		updated: Board.updated,
	// 		likes: (count(BoardLikes.board))
	// 	})
	// 	.from(Board)
	// 	.leftJoin(BoardLikes, eq(BoardLikes.board, Board.id))
	// 	.where(dbFilter)
	// 	.orderBy(filter === 'likes' ? desc(count(BoardLikes.board)) : desc(Board.updated))
	// 	.groupBy(Board.id)
	// 	.limit(upper)
	// 	.offset(lower);

	return new Response(
		JSON.stringify(
			filter === 'likes'
				? await db
						.select({
							id: Board.id,
							title: Board.name,
							updated: Board.updated,
							likes: count(BoardLikes.board)
						})
						.from(Board)
						.leftJoin(BoardLikes, eq(BoardLikes.board, Board.id))
						.where(and(eq(Board.type, 'Public'), getLikesWithTimeframe(timeframe)))
						.orderBy(desc(count(BoardLikes.board)))
						.groupBy(Board.id)
						.limit(upper)
						.offset(lower)
				: await db
						.select({
							id: Board.id,
							title: Board.name,
							updated: Board.updated
							// likes: count(BoardLikes.board)
						})
						.from(Board)
						// .leftJoin(BoardLikes, eq(BoardLikes.board, Board.id))
						.where(and(eq(Board.type, 'Public'), getUpdatedWithTimeframe(timeframe)))
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

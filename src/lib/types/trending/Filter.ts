export const timeframes = ['hour', 'day', 'week', 'month', 'year', 'all'] as const;
export const filters = ['likes', 'updated'] as const;

export type Filter = {
	type: 'likes' | 'updated';
	timeframe: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
	lower: number;
	upper: number;
};

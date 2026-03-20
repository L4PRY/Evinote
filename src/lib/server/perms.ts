import { Board, User, Permissions, permission } from '$lib/server/db/schema';
import { error } from '@sveltejs/kit';
import { routeLogger } from './logger';

export function checkAccessPerms(
	board: typeof Board.$inferSelect,
	user: typeof User.$inferSelect | null,
	perms: typeof Permissions.$inferSelect | null
) {
	// juggle perms for stuff
	// so like if the board is private, we either check for board.owner === user.id or perms.bid === board.id && read || write perms

	if (user?.role !== 'Admin')
		switch (board.type) {
			case 'Public':
				// anyone can read, only owner and users with write perms can write
				break;
			case 'Unlisted':
				// anybody can read, only owner and users with perms can write, is not searchable, only accessible through the link
				if (!user && !perms) {
					error(403, 'forbidden');
				}
				break;
			case 'Private':
				// only owner and users with perms can read or write
				if (!user) {
					error(401, 'unauthorized');
				}
				if (board.owner !== user.id && !perms) {
					routeLogger.warn(
						`User ${user?.id} does not have permissions to view board ${board.id}, owner is ${board.owner}`
					);
					error(403, 'forbidden');
				}
				break;
		}
}

export const checkUserCanModify = (
	board: typeof Board.$inferSelect,
	user?: typeof User.$inferSelect,
	perms?: typeof Permissions.$inferSelect
): boolean => user?.role === 'Admin' || board.owner === user?.id || perms?.perm === 'Write';
// {
// 	if (user?.role === 'Admin') return true;

// 	if (board.owner === user?.id) return true;

// 	if (perms?.perm === 'Write') return true;

// 	return false;
// }

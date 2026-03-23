import { checkAccessPerms, checkUserCanModify, checkBoardPerms } from '$lib/server/perms';
import { describe, it, expect } from 'vitest';
import { User, Board, Permissions as Perms } from '$lib/server/db/schema';

function createMockBoard(overrides?: Partial<typeof Board.$inferSelect>) {
	return {
		id: 'board1',
		owner: 1,
		type: 'Private',
		...overrides
	} as typeof Board.$inferSelect;
}

function createMockUser(overrides?: Partial<typeof User.$inferSelect>) {
	return {
		id: 1,
		username: 'test',
		role: 'User',
		...overrides
	} as typeof User.$inferSelect;
}

describe('Permission checks', () => {
	it('should allow owner to access private board', () => {
		const board = createMockBoard({ type: 'Private' });
		const user = createMockUser({ id: 1 });

		expect(checkAccessPerms(board, user, null)).toBe(true);
	});

	it('should deny access to private board for non-owner without perms', () => {
		const board = createMockBoard({ type: 'Private' });
		const user = createMockUser({ id: 2 });

		expect(checkAccessPerms(board, user, null)).toBe(false);
	});

	it('should allow access to private board for user with perms', () => {
		const board = createMockBoard({ type: 'Private' });
		const user = createMockUser({ id: 2 });
		const perms = { perm: 'Read' } as typeof Perms.$inferSelect;

		expect(checkAccessPerms(board, user, perms)).toBe(true);
	});

	it('should allow anyone to access public board', () => {
		const board = createMockBoard({ type: 'Public' });
		const user = createMockUser({ id: 2 });

		expect(checkAccessPerms(board, user, null)).toBe(true);
	});

	it('should deny access to unlisted board for unauthenticated user', () => {
		const board = createMockBoard({ type: 'Unlisted' });

		expect(checkAccessPerms(board, null, null)).toBe(false);
	});

	it('should allow access to unlisted board for authenticated user', () => {
		const board = createMockBoard({ type: 'Unlisted' });
		const user = createMockUser({ id: 2 });

		expect(checkAccessPerms(board, user, null)).toBe(true);
	});

	it('should allow admin to access any board type', () => {
		const privateBoard = createMockBoard({ type: 'Private', owner: 999 });
		const admin = createMockUser({ id: 2, role: 'Admin' });

		expect(checkAccessPerms(privateBoard, admin, null)).toBe(true);
	});
});

describe('Modify checks', () => {
	it('owner should be able to modify their own board', () => {
		const board = createMockBoard({ type: 'Private' });
		const user = createMockUser({ id: 1 });

		expect(checkUserCanModify(board, user)).toBe(true);
	});

	it('user without permissions should not be able to modify a public board', () => {
		const board = createMockBoard({ type: 'Public' });
		const user = createMockUser({ id: 2 });

		expect(checkUserCanModify(board, user)).toBe(false);
	});

	it('user with permissions should be able to modify a public board', () => {
		const board = createMockBoard({ type: 'Public' });
		const user = createMockUser({ id: 2 });
		const perms = { perm: 'Write' } as typeof Perms.$inferSelect;

		expect(checkUserCanModify(board, user, perms)).toBe(true);
	});

	it('user with write permissions should be able to modify a private board', () => {
		const board = createMockBoard({ type: 'Private' });
		const user = createMockUser({ id: 2 });
		const perms = { perm: 'Write' } as typeof Perms.$inferSelect;

		expect(checkUserCanModify(board, user, perms)).toBe(true);
	});

	it('user with read permissions should not be able to modify a private board', () => {
		const board = createMockBoard({ type: 'Private' });
		const user = createMockUser({ id: 2 });
		const perms = { perm: 'Read' } as typeof Perms.$inferSelect;

		expect(checkUserCanModify(board, user, perms)).toBe(false);
	});

	it('user with write permissions should be able to modify a Unlisted board', () => {
		const board = createMockBoard({ type: 'Unlisted' });
		const user = createMockUser({ id: 2 });
		const perms = { perm: 'Write' } as typeof Perms.$inferSelect;

		expect(checkUserCanModify(board, user, perms)).toBe(true);
	});

	it('user with read permissions should not be able to modify a Unlisted board', () => {
		const board = createMockBoard({ type: 'Unlisted' });
		const user = createMockUser({ id: 2 });
		const perms = { perm: 'Read' } as typeof Perms.$inferSelect;

		expect(checkUserCanModify(board, user, perms)).toBe(false);
	});

	it('admin should be able to modify any board', () => {
		const board = createMockBoard({ type: 'Private', owner: 999 });
		const admin = createMockUser({ id: 2, role: 'Admin' });

		expect(checkUserCanModify(board, admin)).toBe(true);
	});
});

import { pgSchema, serial, text, json, timestamp, varchar, index } from 'drizzle-orm/pg-core';
import { MIMEType } from 'util';

export type File = {
	mime: MIMEType;
	location: URL;
};
export type NoteData = {
	title: string | null;
	position: [number, number];
	color: [type: string, value: string];
	content: (string | File)[];
};

export const auth = pgSchema('auth');
export const app = pgSchema('app');

export const role = auth.enum('role', ['User', 'Admin']);
export const permission = app.enum('permission', ['Read', 'Write']);
export const boardType = app.enum('board_type', ['Public', 'Unlisted', 'Private']);

export const session = auth.table(
	'session',
	{
		id: serial('id').primaryKey(),
		userId: serial('user_id')
			.notNull()
			.references(() => user.id),
		iat: timestamp('issued_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
		eat: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
		description: text('description')
	},
	(table) => [index('session_user').on(table.id, table.userId)]
);

export const user = auth.table(
	'user',
	{
		id: serial('id').primaryKey(),
		username: varchar('username').notNull(),
		email: varchar('email').notNull(),
		passhash: text('passhash').notNull(),
		role: role('role').default('User'),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
	},
	(table) => [index('index_username').on(table.username)]
);

export const permissions = app.table(
	'permissions',
	{
		bid: serial('board_id').references(() => board.id),
		uid: serial('user_id').references(() => user.id),
		perm: permission('permission')
	},
	(table) => [index('user_session').on(table.bid, table.uid)]
);

export const board = app.table(
	'board',
	{
		id: serial('id').primaryKey(),
		type: boardType('board_type').default('Private').notNull(),
		owner: serial('owner_id')
			.notNull()
			.references(() => user.id),
		name: varchar('name').notNull(),
		updated: timestamp('updated_at')
	},
	(table) => [index('table_owner').on(table.owner), index('table_name').on(table.id, table.name)]
);

export const note = app.table(
	'note',
	{
		id: serial('id').primaryKey(),
		bid: serial('board_id')
			.notNull()
			.references(() => board.id),
		data: json('data').$type<NoteData>()
	},
	(table) => [index('parent_board').on(table.bid)]
);

// someone kill me
export type Permission = typeof permission;
export type BoardType = typeof boardType;
export type Role = typeof role;

export type SelectPermission = typeof permissions.$inferSelect;
export type InsertPermission = typeof permissions.$inferInsert;

export type SelectBoard = typeof board.$inferSelect;
export type InsertBoard = typeof board.$inferInsert;

export type SelectNote = typeof note.$inferSelect;
export type InsertNote = typeof note.$inferInsert;

export type SelectUser = typeof user.$inferSelect;
export type InsertUser = typeof user.$inferInsert;

export type SelectSession = typeof session.$inferSelect;
export type InsertSession = typeof session.$inferInsert;

export const SCHEMAS = { auth, app };

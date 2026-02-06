import {
	index,
	json,
	pgSchema,
	serial,
	text,
	timestamp,
	uuid,
	varchar,
	pgEnum,
	pgTable
} from 'drizzle-orm/pg-core';
import { MIMEType } from 'util';
import { generateSecureRandomString } from '../auth';

export type File = {
	mime: MIMEType | string;
	location: URL | string;
};

export type NoteData = {
	title: string | null;
	position: { x: number; y: number };
	color: { type: 'hex' | 'rgba' | 'hsv' | 'oklch'; value: string | number[] };
	content: (string | File)[];
};

//! NOT FINAL VERSION!!!
export type BoardData = {
	background: {
		type: 'Grid' | 'Image' | 'Custom' | 'Solid';
		value: URL | string | number[];
	};
	version: number;
};

export const auth = pgSchema('auth');
export const app = pgSchema('app');

export const role = pgEnum('role', ['User', 'Admin']);
export const permission = pgEnum('permission', ['Read', 'Write']);
export const boardType = pgEnum('board_type', ['Public', 'Unlisted', 'Private']);

export const Session = pgTable(
	'session',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		token: varchar('token', { length: 24 }).notNull().unique(),
		userId: serial('user_id')
			.notNull()
			.references(() => User.id),
		iat: timestamp('issued_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
		eat: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
		description: text('description')
	},
	(table) => [
		index('session_user').on(table.id, table.userId),
		index('session_token').on(table.id, table.token)
	]
);

export const User = pgTable(
	'user',
	{
		id: serial('id').primaryKey(),
		username: varchar('username').notNull().unique(),
		email: varchar('email').notNull(),
		passhash: text('passhash').notNull(),
		role: role('role').default('User'),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
	},
	(table) => [index('index_username').on(table.username)]
);

export const Permissions = pgTable(
	'permissions',
	{
		bid: serial('board_id').references(() => Board.id),
		uid: serial('user_id').references(() => User.id),
		perm: permission('permission')
	},
	(table) => [index('user_session').on(table.bid, table.uid)]
);

//TODO: BOARDS AND NOTES NEED UNIQUE IDENTIFIERS
// I COULD USE THE AUTH.GENEREATESECURERANDOMSTRING AND GET THE FIRST 5 CHARS
// THAT WOULD BE ENOUGH ENTROPY I THINK
// WHY AM I TYPING IN CAPS
export const Board = pgTable(
	'board',
	{
		id: text('id').primaryKey().notNull(), // __ALWAYS__ set the value to be defaultrandomstring.slice(0, 5), drizzle-kit push doesnt like .$default() right now for some reason
		type: boardType('board_type').default('Private').notNull(),
		owner: serial('owner_id')
			.notNull()
			.references(() => User.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
		name: varchar('name').notNull(),
		updated: timestamp('updated_at')
	},
	(table) => [index('table_owner').on(table.owner), index('table_name').on(table.id, table.name)]
);

export const Note = pgTable(
	'note',
	{
		id: text('id').primaryKey().notNull(),
		bid: serial('board_id')
			.notNull()
			.references(() => Board.id, { onDelete: 'cascade' }),
		data: json('data').$type<NoteData>()
	},
	(table) => [index('parent_board').on(table.bid)]
);

// someone kill me
// export type Permission = typeof permission;
// export type BoardType = typeof boardType;
// export type Role = typeof role;

// export type SelectPermission = typeof Permissions.$inferSelect;
// export type InsertPermission = typeof Permissions.$inferInsert;

// export type SelectBoard = typeof Board.$inferSelect;
// export type InsertBoard = typeof Board.$inferInsert;

// export type SelectNote = typeof Note.$inferSelect;
// export type InsertNote = typeof Note.$inferInsert;

// export type SelectUser = typeof User.$inferSelect;
// export type InsertUser = typeof User.$inferInsert;

// export type SelectSession = typeof Session.$inferSelect;
// export type InsertSession = typeof Session.$inferInsert;

// export const SCHEMAS = { auth, app };

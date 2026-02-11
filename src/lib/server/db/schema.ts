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
import type { NoteData } from '$lib/types/NoteData';

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

export const Board = pgTable(
	'board',
	{
		id: serial('id').primaryKey().notNull(),
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
		id: serial('id').primaryKey().notNull(),
		bid: serial('board_id')
			.notNull()
			.references(() => Board.id, { onDelete: 'cascade' }),
		data: json('data').$type<NoteData>()
	},
	(table) => [index('parent_board').on(table.bid)]
);

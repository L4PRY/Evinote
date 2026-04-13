import {
	index,
	jsonb,
	pgSchema,
	serial,
	text,
	timestamp,
	uuid,
	varchar,
	pgEnum,
	pgTable,
	uniqueIndex
} from 'drizzle-orm/pg-core';
import type { CanvasData } from '$lib/types/canvas/CanvasData';
import type { NoteData, NotesRecord } from '$lib/types/canvas/NoteData';

export const role = pgEnum('role', ['User', 'Admin']);
export const permission = pgEnum('permission', ['Read', 'Write']);
export const boardType = pgEnum('board_type', ['Public', 'Unlisted', 'Private']);

export const Session = pgTable(
	'session',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		token: varchar('token', { length: 24 }).notNull().unique(),
		user: serial('user_id')
			.notNull()
			.references(() => User.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
		iat: timestamp('issued_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
		eat: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
		description: text('description'),
		location: text('location')
	},
	table => [
		index('session_user').on(table.id, table.user),
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
		created: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
	},
	table => [index('index_username').on(table.username)]
);

export const Permissions = pgTable(
	'permissions',
	{
		bid: serial('board_id').references(() => Board.id, { onDelete: 'cascade' }),
		uid: serial('user_id').references(() => User.id),
		perm: permission('permission')
	},
	table => [index('user_session').on(table.bid, table.uid)]
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
		updated: timestamp('updated_at'),
		created: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
		version: serial('version'),
		canvas: jsonb('canvas').$type<CanvasData>(),
		notes: jsonb('notes').$type<NotesRecord>()
	},
	table => [index('table_owner').on(table.owner), index('table_name').on(table.id, table.name)]
);

export const BoardLikes = pgTable(
	'board_likes',
	{
		board: serial('board_id')
			.references(() => Board.id, {
				onDelete: 'cascade',
				onUpdate: 'cascade'
			})
			.notNull(),
		user: serial('user_id')
			.references(() => User.id, {
				onDelete: 'cascade',
				onUpdate: 'cascade'
			})
			.notNull(),
		at: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
	},
	table => [uniqueIndex('board_likes_user').on(table.board, table.user)]
);

export const Files = pgTable(
	'files',
	{
		id: serial('id').primaryKey().notNull(),
		hash: varchar('hash').notNull().unique(),
		filename: varchar('filename').notNull(),
		mimetype: varchar('mimetype').notNull(),
		uploaded: timestamp('uploaded_at').notNull().defaultNow(),
		uploader: serial('uploader_id').references(() => User.id, {
			onDelete: 'set null',
			onUpdate: 'cascade'
		})
	},
	table => [
		index('file_hash').on(table.hash),
		index('file_name').on(table.filename),
		index('hash_id').on(table.id, table.hash)
	]
);

export const UserPfp = pgTable(
	'user_pfp',
	{
		id: serial('id').primaryKey().notNull(),
		user: serial('user_id')
			.references(() => User.id, {
				onDelete: 'cascade',
				onUpdate: 'cascade'
			})
			.notNull(),
		file: serial('file_id').references(() => Files.id, {
			onDelete: 'set null',
			onUpdate: 'cascade'
		}),
		updated: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
	},
	table => [index('user_pfp_user').on(table.user), index('user_pfp_file').on(table.file)]
);

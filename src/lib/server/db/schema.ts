import {
  index,
  json,
  pgSchema,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { MIMEType } from "node:util";

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
export const auth = pgSchema("auth");
export const app = pgSchema("app");

export const role = auth.enum("role", ["User", "Admin"]);
export const permission = app.enum("permission", ["Read", "Write"]);
export const boardType = app.enum("board_type", [
  "Public",
  "Unlisted",
  "Private",
]);

export const Session = auth.table(
  "session",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: serial("user_id")
      .notNull()
      .references(() => User.id),
    iat: timestamp("issued_at", { withTimezone: true, mode: "date" }).notNull()
      .defaultNow(),
    eat: timestamp("expires_at", { withTimezone: true, mode: "date" })
      .notNull(),
    description: text("description"),
  },
  (table) => [index("session_user").on(table.id, table.userId)],
);

export const User = auth.table(
  "user",
  {
    id: serial("id").primaryKey(),
    username: varchar("username").notNull().unique(),
    email: varchar("email").notNull(),
    passhash: text("passhash").notNull(),
    role: role("role").default("User"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull().defaultNow(),
  },
  (table) => [index("index_username").on(table.username)],
);

export const Permissions = app.table(
  "permissions",
  {
    bid: serial("board_id").references(() => Board.id),
    uid: serial("user_id").references(() => User.id),
    perm: permission("permission"),
  },
  (table) => [index("user_session").on(table.bid, table.uid)],
);

export const Board = app.table(
  "board",
  {
    id: serial("id").primaryKey(),
    type: boardType("board_type").default("Private").notNull(),
    owner: serial("owner_id")
      .notNull()
      .references(() => User.id, { onDelete: "cascade", onUpdate: "cascade" }),
    name: varchar("name").notNull(),
    updated: timestamp("updated_at"),
  },
  (
    table,
  ) => [
    index("table_owner").on(table.owner),
    index("table_name").on(table.id, table.name),
  ],
);

export const Note = app.table(
  "note",
  {
    id: serial("id").primaryKey(),
    bid: serial("board_id")
      .notNull()
      .references(() => Board.id, { onDelete: "cascade" }),
    data: json("data").$type<NoteData>(),
  },
  (table) => [index("parent_board").on(table.bid)],
);

// someone kill me
export type Permission = typeof permission;
export type BoardType = typeof boardType;
export type Role = typeof role;

export type SelectPermission = typeof Permissions.$inferSelect;
export type InsertPermission = typeof Permissions.$inferInsert;

export type SelectBoard = typeof Board.$inferSelect;
export type InsertBoard = typeof Board.$inferInsert;

export type SelectNote = typeof Note.$inferSelect;
export type InsertNote = typeof Note.$inferInsert;

export type SelectUser = typeof User.$inferSelect;
export type InsertUser = typeof User.$inferInsert;

export type SelectSession = typeof Session.$inferSelect;
export type InsertSession = typeof Session.$inferInsert;

export const SCHEMAS = { auth, app };

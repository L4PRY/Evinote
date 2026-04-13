CREATE TYPE "public"."board_type" AS ENUM('Public', 'Unlisted', 'Private');--> statement-breakpoint
CREATE TYPE "public"."permission" AS ENUM('Read', 'Write');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('User', 'Admin');--> statement-breakpoint
CREATE TABLE "board" (
	"id" serial PRIMARY KEY NOT NULL,
	"board_type" "board_type" DEFAULT 'Private' NOT NULL,
	"owner_id" serial NOT NULL,
	"name" varchar NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" serial NOT NULL,
	"canvas" jsonb,
	"notes" jsonb
);
--> statement-breakpoint
CREATE TABLE "board_likes" (
	"board_id" serial NOT NULL,
	"user_id" serial NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" serial PRIMARY KEY NOT NULL,
	"hash" varchar NOT NULL,
	"filename" varchar NOT NULL,
	"mimetype" varchar NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"uploader_id" serial NOT NULL,
	CONSTRAINT "files_hash_unique" UNIQUE("hash")
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"board_id" serial NOT NULL,
	"user_id" serial NOT NULL,
	"permission" "permission"
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" varchar(24) NOT NULL,
	"user_id" serial NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"description" text,
	"location" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar NOT NULL,
	"email" varchar NOT NULL,
	"passhash" text NOT NULL,
	"role" "role" DEFAULT 'User',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "user_pfp" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" serial NOT NULL,
	"file_id" serial NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "board" ADD CONSTRAINT "board_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "board_likes" ADD CONSTRAINT "board_likes_board_id_board_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."board"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "board_likes" ADD CONSTRAINT "board_likes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_uploader_id_user_id_fk" FOREIGN KEY ("uploader_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_board_id_board_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."board"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "user_pfp" ADD CONSTRAINT "user_pfp_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "user_pfp" ADD CONSTRAINT "user_pfp_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "table_owner" ON "board" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "table_name" ON "board" USING btree ("id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "board_likes_user" ON "board_likes" USING btree ("board_id","user_id");--> statement-breakpoint
CREATE INDEX "file_hash" ON "files" USING btree ("hash");--> statement-breakpoint
CREATE INDEX "file_name" ON "files" USING btree ("filename");--> statement-breakpoint
CREATE INDEX "hash_id" ON "files" USING btree ("id","hash");--> statement-breakpoint
CREATE INDEX "user_session" ON "permissions" USING btree ("board_id","user_id");--> statement-breakpoint
CREATE INDEX "session_user" ON "session" USING btree ("id","user_id");--> statement-breakpoint
CREATE INDEX "session_token" ON "session" USING btree ("id","token");--> statement-breakpoint
CREATE INDEX "index_username" ON "user" USING btree ("username");--> statement-breakpoint
CREATE INDEX "user_pfp_user" ON "user_pfp" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_pfp_file" ON "user_pfp" USING btree ("file_id");
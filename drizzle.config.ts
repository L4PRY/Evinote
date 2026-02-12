import { defineConfig } from 'drizzle-kit';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	dialect: 'postgresql',
	dbCredentials: {
		// stupid ass dotenv impl not supporting the variables
		url: `postgres://${process.env.DB_USER}:${process.env.DB_PASSWD}@${process.env.DB_ADDR}:5432/${process.env.DB}`
	},
	verbose: true,
	strict: true
});

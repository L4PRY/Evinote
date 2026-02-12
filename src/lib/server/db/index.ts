import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

export const db =
	env.DB === 'null' ? drizzle.mock({ schema }) : drizzle(postgres(env.DATABASE_URL), { schema });

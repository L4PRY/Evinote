import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const client = import.meta.env.DB !== "null" ? postgres(env.DATABASE_URL) : null;

export const db = import.meta.env.DB === "null" ? drizzle.mock({ schema }) : drizzle(client!, { schema });

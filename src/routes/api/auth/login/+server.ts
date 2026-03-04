import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db/index';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import * as auth from '$lib/server/auth';
import { verify } from '@node-rs/argon2';
import { validateEmail, validateUsername, validatePassword } from '$lib/parseInput';

export async function POST(event: RequestEvent) {
    const { request, cookies } = event;

    const { username, password } = await request.json() as { username: string; password: string };

    let isEmailLogin = false;

    // Ellenőrizzük, hogy email vagy username
    if (validateEmail(username)) {
        isEmailLogin = true;
    } else if (!validateUsername(username)) {
        return new Response(JSON.stringify({ error: 'Invalid username' }), { status: 400 });
    } else {
        isEmailLogin = false;
    }

    if (!validatePassword(password)) {
        return new Response(
            JSON.stringify({ error: 'Invalid password (min 6, max 255 characters)' }),
            { status: 400 }
        );
    }

    const results = await db
        .select()
        .from(table.User)
        .where(isEmailLogin ? eq(table.User.email, username) : eq(table.User.username, username));

    const existingUser = results.at(0);
    if (!existingUser) {
        return new Response(JSON.stringify({ error: 'Invalid username or password' }), { status: 400 });
    }

    // Ellenőrizzük a jelszó hash-t Argon2-vel
    let validPassword = false;
    try {
        validPassword = await verify(existingUser.passhash, password, {
            memoryCost: 19456,
            timeCost: 2,
            outputLen: 32,
            parallelism: 1
        });
    } catch (err) {
        // Ha a hash sérült vagy hiányzik
        return new Response(
            JSON.stringify({ error: 'Invalid hashed password: please reset your password' }),
            { status: 500 }
        );
    }

    if (!validPassword) {
        return new Response(JSON.stringify({ error: 'Invalid username or password' }), { status: 400 });
    }

    const sessions = await auth.createSession(
        existingUser.id,
        request.headers.get('user-agent') ?? 'api'
    );

    if (!sessions || sessions.length === 0) {
        return new Response(JSON.stringify({ error: 'Failed to create session' }), { status: 500 });
    }

    const session = sessions[0];

    // Beállítjuk a session token-t cookie-ban
    cookies.set('.EVI_API', session.token, {
        httpOnly: true,
        path: '/',
        secure: true,
        sameSite: 'strict'
    });

    return new Response(JSON.stringify({ message: 'Login successful' }), { status: 200 });
}
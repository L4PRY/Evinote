import { hash, verify } from "@node-rs/argon2";
import { fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import * as auth from "$lib/server/auth";
import { db } from "$lib/server/db";
import { User } from "$lib/server/db/schema";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  if (event.locals.user) {
    return redirect(302, "/demo/lucia");
  }
  return {};
};

export const actions: Actions = {
  login: async (event) => {
    const formData = await event.request.formData();
    const username = formData.get("username");
    const email = formData.get("email");
    const password = formData.get("password");

    if (!validateUsername(username)) {
      return fail(400, {
        message:
          "Invalid username (min 3, max 31 characters, alphanumeric only)",
      });
    }

    if (!validateEmail(email)) {
      return fail(400, { message: "Invalid email" });
    }

    if (!validatePassword(password)) {
      return fail(400, {
        message: "Invalid password (min 6, max 255 characters)",
      });
    }

    const results = await db
      .select()
      .from(User)
      .where(eq(User.username, username as string));

    const existingUser = results.at(0);
    if (!existingUser) {
      return fail(400, { message: "Incorrect username or password" });
    }

    const validPassword = await verify(existingUser.passhash, password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });
    if (!validPassword) {
      return fail(400, { message: "Incorrect username or password" });
    }

    const sessionToken = auth.generateSessionToken();
    const session = await auth.createSession(sessionToken, existingUser.id);
    auth.setSessionTokenCookie(event, sessionToken, session.eat);

    return redirect(302, "/demo/lucia");
  },
  register: async (event) => {
    const formData = await event.request.formData();
    const username = formData.get("username");
    const email = formData.get("email");
    const password = formData.get("password");

    if (!validateUsername(username)) {
      return fail(400, { message: "Invalid username" });
    }

    if (!validateEmail(email)) {
      return fail(400, { message: "Invalid email" });
    }

    if (!validatePassword(password)) {
      return fail(400, { message: "Invalid password" });
    }

    const passhash = await hash(password, {
      // recommended minimum parameters
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 5,
    });

    try {
      // Provide required 'email' field, use empty string if not available
      const insertResult = await db
        .insert(User)
        .values({ username: username as string, email, passhash })
        .returning({ id: User.id });

      const userId = insertResult[0]?.id;
      if (!userId) {
        return fail(500, { message: "Failed to create user" });
      }

      const sessionToken = auth.generateSessionToken();
      const session = await auth.createSession(sessionToken, userId);
      auth.setSessionTokenCookie(event, sessionToken, session.eat);
    } catch {
      return fail(500, { message: "An error has occurred" });
    }
    return redirect(302, "/demo/lucia");
  },
};

async function validateUsername(username: unknown) {
  // check if username already exists in db
  try {
    const results = await db
      .select()
      .from(User)
      .where(eq(User.username, username as string));

    if (results.length > 0) {
      return false;
    }
  } catch {
    return false;
  }

  return (
    typeof username === "string" &&
    username.length >= 3 &&
    username.length <= 31 &&
    /^[a-z0-9_-]+$/.test(username)
  );
}

function validateEmail(email: unknown): email is string {
  return (
    typeof email === "string" &&
    new RegExp("^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$").test(email)
  );
}

function validatePassword(password: unknown): password is string {
  return typeof password === "string" && password.length >= 6 &&
    password.length <= 255;
}

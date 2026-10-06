"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createSessionToken,
  SESSION_COOKIE,
  SESSION_SECONDS,
  verifyPassword,
} from "@/lib/security";

export type LoginState = { error: string; field?: "username" | "password" };

export async function signIn(
  _previous: LoginState,
  form: FormData,
): Promise<LoginState> {
  const username = form.get("username");
  const password = form.get("password");
  if (typeof username !== "string" || !username.trim())
    return { error: "Enter your username.", field: "username" };
  if (typeof password !== "string" || !password)
    return { error: "Enter your password.", field: "password" };
  const secret = process.env.AUTH_SECRET;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!secret || secret.length < 32 || !passwordHash)
    return { error: "Sign-in is unavailable. Contact the administrator." };
  const passwordMatches = verifyPassword(password, passwordHash);
  if (username.trim() !== "admin" || !passwordMatches) {
    await new Promise((resolve) => setTimeout(resolve, 700));
    return { error: "Username or password is incorrect. Try again." };
  }
  const token = await createSessionToken(secret, passwordHash);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
  redirect("/");
}

export async function signOut() {
  (await cookies()).set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  redirect("/login");
}

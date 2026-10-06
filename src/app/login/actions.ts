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
    return { error: "Informe seu usuário.", field: "username" };
  if (typeof password !== "string" || !password)
    return { error: "Informe sua senha.", field: "password" };
  const secret = process.env.AUTH_SECRET;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!secret || secret.length < 32 || !passwordHash)
    return {
      error:
        "O acesso está indisponível. Entre em contato com o administrador.",
    };
  const passwordMatches = verifyPassword(password, passwordHash);
  if (username.trim() !== "admin" || !passwordMatches) {
    await new Promise((resolve) => setTimeout(resolve, 700));
    return { error: "Usuário ou senha incorretos. Tente novamente." };
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

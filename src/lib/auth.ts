import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "./security";

export async function hasSession() {
  return verifySessionToken(
    (await cookies()).get(SESSION_COOKIE)?.value,
    process.env.AUTH_SECRET,
    process.env.ADMIN_PASSWORD_HASH,
  );
}

export async function requireAdmin() {
  if (!(await hasSession())) redirect("/login");
}

import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { SignJWT, jwtVerify } from "jose";

export const SESSION_SECONDS = 8 * 60 * 60;
export const SESSION_COOKIE = "__Host-invest-session";
const ISSUER = "invest-calculator";

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

export function verifyPassword(password: string, encoded: string) {
  const [scheme, salt, hash] = encoded.split(":");
  if (
    scheme !== "scrypt" ||
    !/^[a-f0-9]{32}$/.test(salt ?? "") ||
    !/^[a-f0-9]{128}$/.test(hash ?? "") ||
    password.length > 256
  )
    return false;
  return timingSafeEqual(
    scryptSync(password, salt, 64),
    Buffer.from(hash, "hex"),
  );
}

export function credentialVersion(passwordHash: string) {
  return createHash("sha256").update(passwordHash).digest("hex");
}

export async function createSessionToken(secret: string, passwordHash: string) {
  if (secret.length < 32) throw new Error("Session secret is not configured");
  return new SignJWT({
    role: "admin",
    credentialVersion: credentialVersion(passwordHash),
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject("admin")
    .setIssuer(ISSUER)
    .setAudience(ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_SECONDS}s`)
    .sign(new TextEncoder().encode(secret));
}

export async function verifySessionToken(
  token: string | undefined,
  secret: string | undefined,
  passwordHash: string | undefined,
) {
  if (!token || !secret || secret.length < 32 || !passwordHash) return false;
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
      {
        algorithms: ["HS256"],
        issuer: ISSUER,
        audience: ISSUER,
        requiredClaims: ["exp", "iat", "sub"],
      },
    );
    return (
      payload.sub === "admin" &&
      payload.role === "admin" &&
      payload.credentialVersion === credentialVersion(passwordHash)
    );
  } catch {
    return false;
  }
}

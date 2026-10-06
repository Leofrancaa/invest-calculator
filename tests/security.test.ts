import { test } from "node:test";
import assert from "node:assert/strict";
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
} from "../src/lib/security";
import { SignJWT } from "jose";

test("password hashes are salted and reject incorrect or malformed credentials", () => {
  const hash = hashPassword("fixture-password");
  assert.notEqual(hash, hashPassword("fixture-password"));
  assert.equal(verifyPassword("fixture-password", hash), true);
  assert.equal(verifyPassword("wrong-password", hash), false);
  assert.equal(verifyPassword("fixture-password", "invalid"), false);
  assert.equal(verifyPassword("x".repeat(257), hash), false);
});

test("admin sessions reject tampering, expired tokens, changed credentials and weak configuration", async () => {
  const secret = "test-secret-for-sessions-at-least-32-characters";
  const hash = hashPassword("fixture-password");
  const token = await createSessionToken(secret, hash);
  assert.equal(await verifySessionToken(token, secret, hash), true);
  assert.equal(
    await verifySessionToken(token + "tampered", secret, hash),
    false,
  );
  assert.equal(
    await verifySessionToken(token, secret, hashPassword("changed")),
    false,
  );
  assert.equal(
    await verifySessionToken(token, "wrong-key-xxxxxxxxxxxxxxxxxxxxxxxx", hash),
    false,
  );
  assert.equal(await verifySessionToken(undefined, secret, hash), false);
  assert.equal(await verifySessionToken(token, undefined, hash), false);
  await assert.rejects(createSessionToken("weak", hash));
  const expired = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("admin")
    .setIssuer("invest-calculator")
    .setAudience("invest-calculator")
    .setIssuedAt()
    .setExpirationTime(1)
    .sign(new TextEncoder().encode(secret));
  assert.equal(await verifySessionToken(expired, secret, hash), false);
});

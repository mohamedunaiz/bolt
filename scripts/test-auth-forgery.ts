import crypto from "crypto";
import assert from "node:assert/strict";
process.env.NODE_ENV = "production";
process.env.VERCEL = "1";
delete process.env.BOLT_JWT_SECRET;
delete process.env.BOLT_ALLOW_TEST_TOKENS;
const { verifyToken, generateSignedSessionToken } = await import("../server/authMiddleware.js");

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
let n = 0;
const t = async (name: string, fn: () => void | Promise<void>) => { await fn(); n++; console.log("PASS", name); };

await t("forged Firebase-shaped admin token is rejected", async () => {
  const forged = `${b64({ alg: "none" })}.${b64({ sub: "attacker", auth_time: 1, admin: true, email: "x@y.z", exp: 9999999999 })}.sig`;
  assert.equal(await verifyToken(forged), null);
});
await t("bolt_ token signed with the old public default secret is rejected", async () => {
  const payload = b64({ uid: "attacker", role: "admin", isAdmin: true, exp: 9999999999 });
  const sig = crypto.createHmac("sha256", "bolt_prod_secret_token_signing_key_2026").update(payload).digest("base64url");
  assert.equal(await verifyToken(`bolt_${payload}.${sig}`), null);
});
await t("bolt_ token with wrong-length signature returns null (no throw / 500)", async () => {
  assert.equal(await verifyToken(`bolt_${b64({ uid: "u" })}.abc`), null);
});
await t("test tokens are rejected in production", async () => {
  assert.equal(await verifyToken("test-admin-token"), null);
  assert.equal(await verifyToken("test-token-student1"), null);
});
await t("session tokens cannot be issued without BOLT_JWT_SECRET in production", () => {
  assert.throws(() => generateSignedSessionToken({ uid: "u" }), /BOLT_JWT_SECRET/);
});
console.log(`\nPASSED ${n} / ${n}`);

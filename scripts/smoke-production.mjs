#!/usr/bin/env node
/**
 * Production smoke test. No dependencies; Node 18+.
 *
 *   BASE_URL=https://madddy.vercel.app node scripts/smoke-production.mjs
 *
 * Optional (adds authenticated checks). Pass real Firebase ID tokens; never commit them:
 *   ADMIN_TOKEN   - an admin user's ID token  -> runs GET /api/health/deep (real model call + Firestore round trip)
 *   USER_TOKEN_A  - a normal user's ID token  -> news endpoint, Python 503 behaviour, job creation
 *   USER_TOKEN_B  - a second user's ID token  -> proves user B cannot read user A's job (isolation)
 *
 * Exit code 1 if any hard check fails. WARN lines are real problems that need an environment fix
 * (missing key, empty pipeline) but are not code failures.
 */
const BASE = (process.env.BASE_URL || "https://madddy.vercel.app").replace(/\/+$/, "");
const { ADMIN_TOKEN, USER_TOKEN_A, USER_TOKEN_B } = process.env;
let failed = 0;
const pass = (m) => console.log(`PASS  ${m}`);
const fail = (m) => { failed++; console.log(`FAIL  ${m}`); };
const warn = (m) => console.log(`WARN  ${m}`);
const check = (cond, m) => (cond ? pass(m) : fail(m));

async function call(path, { method = "GET", token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* not JSON */ }
  return { status: res.status, json, text, vercelError: res.headers.get("x-vercel-error") };
}

// 1. Homepage
const home = await call("/");
check(home.status === 200 && /<html/i.test(home.text), "GET / serves the homepage (200 HTML)");

// 2. Liveness
const live = await call("/api/health/live");
check(live.status === 200 && live.json?.status === "live", `GET /api/health/live -> 200 JSON (got ${live.status}${live.vercelError ? " " + live.vercelError : ""})`);

// 3. Health: must execute without crashing; report honest subsystem states
const health = await call("/api/health");
check([200, 503].includes(health.status) && health.json?.subsystems, `GET /api/health executes and returns subsystems (got ${health.status})`);
const sub = health.json?.subsystems;
if (sub) {
  check(sub.database?.status === "connected", `Firestore connected (status=${sub.database?.status}${sub.database?.error ? ", " + sub.database.error : ""})`);
  if (sub.ai?.status !== "configured") warn(`AI model not available: status=${sub.ai?.status}. ${sub.ai?.note || ""}`);
  else pass("AI key configured (NOT proof the model answers; see deep check)");
  const p = sub.currentAffairsPipeline;
  if (p?.status !== "active") warn(`Current-affairs pipeline state=${p?.status}: ${p?.reason || ""} (articles=${p?.articlesCached}, mcqs=${p?.dailyMcqsGenerated})`);
  else pass(`Current-affairs pipeline active (articles=${p.articlesCached}, mcqs=${p.dailyMcqsGenerated})`);
  if (sub.pythonEngine?.status === "unavailable") warn("Python engine unavailable on this host (expected on Vercel); /api/python/* should return 503 PYTHON_UNAVAILABLE");
}

// 4. Auth is enforced
const newsAnon = await call("/api/news/daily-current-affairs");
check(newsAnon.status === 401, `news endpoint rejects anonymous requests (got ${newsAnon.status})`);
const newsGarbage = await call("/api/news/daily-current-affairs", { token: "a.b.c" });
check(newsGarbage.status === 401, `news endpoint rejects a forged token (got ${newsGarbage.status})`);
const forged = `${Buffer.from('{"alg":"none"}').toString("base64url")}.${Buffer.from(JSON.stringify({ sub: "attacker", auth_time: 1, admin: true, exp: 9999999999 })).toString("base64url")}.x`;
const adminForged = await call("/api/health/deep", { token: forged });
check([401, 403].includes(adminForged.status), `admin endpoint rejects a forged admin token (got ${adminForged.status})`);

// 5. Authenticated checks
if (USER_TOKEN_A) {
  const news = await call("/api/news/daily-current-affairs", { token: USER_TOKEN_A });
  check(news.status === 200 && news.json?.success === true && Array.isArray(news.json?.articles), `news endpoint returns documented JSON for a signed-in user (state=${news.json?.state ?? "n/a"}, articles=${news.json?.articles?.length ?? "?"})`);
  if (news.json && typeof news.json.state !== "string") warn("news response has no `state` field (the dedicated Vercel route should return one)");
  const py = await call("/api/python/pyqs", { token: USER_TOKEN_A });
  check(py.status === 503 ? py.json?.code === "PYTHON_UNAVAILABLE" : py.status < 500, `Python feature fails clearly, not with an unexplained 500 (got ${py.status}${py.json?.code ? " " + py.json.code : ""})`);

  const created = await call("/api/jobs", { method: "POST", token: USER_TOKEN_A, body: { type: "embeddings_generation", title: "smoke-test job" } });
  check(created.status === 200 && created.json?.job?.id, `user A can create a job (got ${created.status})`);
  const jobId = created.json?.job?.id;
  if (jobId) {
    const again = await call(`/api/jobs/${jobId}`, { token: USER_TOKEN_A });
    check(again.status === 200 && again.json?.job?.id === jobId, "job persists and is readable on a later request");
    check(["completed", "queued", "running"].includes(again.json?.job?.status), `job state is sane (status=${again.json?.job?.status})`);
    if (USER_TOKEN_B) {
      const cross = await call(`/api/jobs/${jobId}`, { token: USER_TOKEN_B });
      check([403, 404].includes(cross.status), `user B cannot read user A's job (got ${cross.status})`);
    } else warn("USER_TOKEN_B not set; skipped cross-user isolation check");
  }
} else warn("USER_TOKEN_A not set; skipped authenticated checks");

if (ADMIN_TOKEN) {
  const deep = await call("/api/health/deep", { token: ADMIN_TOKEN });
  check(deep.status === 200 || deep.status === 503, `GET /api/health/deep runs (got ${deep.status})`);
  for (const [name, c] of Object.entries(deep.json?.checks || {})) {
    (c.ok ? pass : fail)(`deep check "${name}": ${c.ok ? "ok" : c.error || c.reason || JSON.stringify(c)}`);
  }
} else warn("ADMIN_TOKEN not set; skipped the deep AI/Firestore verification");

console.log(failed ? `\n${failed} check(s) FAILED` : "\nAll hard checks passed");
process.exit(failed ? 1 : 0);

import assert from "node:assert/strict";
import { summarizeAiHealth, summarizePipelineHealth, hasUsableKey } from "../server/healthSummary.js";
import { jobQueue } from "../server/jobQueue.js";
import { getPipelineStatus } from "../server/currentAffairsPipeline.js";

let passed = 0;
const t = async (name: string, fn: () => void | Promise<void>) => {
  await fn();
  passed++;
  console.log("PASS", name);
};

// ---- AI health never claims more than it knows
await t("no key -> not_configured, provider null, unverified", () => {
  const h = summarizeAiHealth({});
  assert.equal(h.status, "not_configured");
  assert.equal(h.provider, null);
  assert.equal(h.verified, false);
});
await t("placeholder key is not a key", () => {
  assert.equal(hasUsableKey("MY_GEMINI_API_KEY"), false);
  assert.equal(summarizeAiHealth({ GEMINI_API_KEY: "MY_GEMINI_API_KEY" }).status, "not_configured");
});
await t("key present -> configured but still verified:false", () => {
  const h = summarizeAiHealth({ GEMINI_API_KEY: "real-key" });
  assert.equal(h.status, "configured");
  assert.equal(h.verified, false);
});
await t("recently denied key -> key_rejected", () => {
  assert.equal(summarizeAiHealth({ GEMINI_API_KEY: "k" }, true).status, "key_rejected");
});
await t("OpenAI/Anthropic keys without Gemini are flagged as ignored", () => {
  const h = summarizeAiHealth({ OPENAI_API_KEY: "sk-x", ANTHROPIC_API_KEY: "sk-y" });
  assert.equal(h.status, "not_configured");
  assert.deepEqual(h.ignoredProviderKeys, ["ANTHROPIC_API_KEY", "OPENAI_API_KEY"]);
  assert.match(h.note, /not read by the server/);
});

// ---- pipeline health is derived from data, never hardcoded "active"
const now = Date.parse("2026-10-10T12:00:00Z");
const base = { lastRunTimestamp: null as string | null, totalArticlesCount: 0, dailyMcqsCount: 0 };
await t("0 articles + never run -> never_run", () => {
  assert.equal(summarizePipelineHealth(base, { aiConfigured: true, now }).state, "never_run");
});
await t("0 articles after a run -> empty", () => {
  assert.equal(summarizePipelineHealth({ ...base, lastRunTimestamp: "2026-10-10T00:30:00Z" }, { aiConfigured: true, now }).state, "empty");
});
await t("old data -> stale", () => {
  const s = { lastRunTimestamp: "2026-10-07T00:30:00Z", totalArticlesCount: 20, dailyMcqsCount: 5 };
  assert.equal(summarizePipelineHealth(s, { aiConfigured: true, now }).state, "stale");
});
await t("articles but 0 MCQs: no key -> mcq_unavailable, key -> no_mcqs", () => {
  const s = { lastRunTimestamp: "2026-10-10T00:30:00Z", totalArticlesCount: 20, dailyMcqsCount: 0 };
  assert.equal(summarizePipelineHealth(s, { aiConfigured: false, now }).state, "mcq_unavailable");
  assert.equal(summarizePipelineHealth(s, { aiConfigured: true, now }).state, "no_mcqs");
});
await t("fresh articles + MCQs -> active", () => {
  const s = { lastRunTimestamp: "2026-10-10T00:30:00Z", totalArticlesCount: 20, dailyMcqsCount: 5 };
  assert.equal(summarizePipelineHealth(s, { aiConfigured: true, now }).state, "active");
});
await t("getPipelineStatus() no longer fabricates lastRun or source names when empty", () => {
  const s = getPipelineStatus();
  assert.equal(s.lastRunTimestamp, null);
  assert.deepEqual(s.sourcesSynced, []);
});

// ---- job queue: run to completion inside the request (serverless-safe)
let ran = 0;
jobQueue.registerWorker("__test_ok" as any, async () => { ran++; await new Promise((r) => setTimeout(r, 30)); return { done: true }; });
jobQueue.registerWorker("__test_fail" as any, async () => { throw new Error("boom"); });

await t("runNow executes the job and returns the completed state", async () => {
  const job = jobQueue.enqueue("__test_ok" as any, "ok", { ownerId: "u1", n: 1 });
  const done = await jobQueue.runNow(job.id, 5000);
  assert.equal(done?.status, "completed");
  assert.deepEqual(done?.result, { done: true });
  assert.equal(ran, 1);
});
await t("runNow returns a failed job after retries are exhausted", async () => {
  const job = jobQueue.enqueue("__test_fail" as any, "fail", { ownerId: "u1" }, { maxRetries: 0 });
  const done = await jobQueue.runNow(job.id, 5000);
  assert.equal(done?.status, "failed");
  assert.match(done?.error || "", /boom/);
});
await t("runNow gives up (not hang) when retry back-off outlasts the request", async () => {
  const job = jobQueue.enqueue("__test_fail" as any, "fail-retry", { ownerId: "u1", x: 2 }, { maxRetries: 3 });
  const t0 = Date.now();
  const res = await jobQueue.runNow(job.id, 1500);
  assert.equal(res?.status, "queued");
  assert.ok(Date.now() - t0 < 4000);
});
await t("runNow on an unknown id returns null", async () => {
  assert.equal(await jobQueue.runNow("job-does-not-exist", 500), null);
});

console.log(`\nPASSED ${passed} / ${passed}`);
process.exit(0);

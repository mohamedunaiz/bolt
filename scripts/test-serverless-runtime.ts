/**
 * Serverless persistence + Python availability tests (network-free).
 * Run with: npm run test:serverless
 *
 * Asserts that on a serverless host (VERCEL=1):
 *   - the job queue and RAG store never touch the filesystem,
 *   - Python-backed features fail with an explicit PYTHON_UNAVAILABLE error.
 */
process.env.VERCEL = "1";
process.env.BOLT_DISABLE_PYTHON = "1";
delete process.env.FIREBASE_SERVICE_ACCOUNT;
delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
delete process.env.FIREBASE_CLIENT_EMAIL;
delete process.env.FIREBASE_PRIVATE_KEY;

import fs from "fs";
import path from "path";

let passed = 0;
let failed = 0;
function check(name: string, ok: boolean, detail = "") {
  if (ok) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`); }
}

async function run() {
  const jobsFile = path.join(process.cwd(), "data", "job_queue_store.json");
  const kbFile = path.join(process.cwd(), "server", "knowledge_store.json");
  const jobsBefore = fs.existsSync(jobsFile) ? fs.statSync(jobsFile).mtimeMs : null;
  const kbBefore = fs.existsSync(kbFile) ? fs.statSync(kbFile).mtimeMs : null;

  const { isServerless, isPythonAvailable, PythonUnavailableError } = await import("../server/runtimeEnv");
  const { jobQueue } = await import("../server/jobQueue");
  const rag = await import("../server/ragService");
  const bridge = await import("../server/pythonBridge");

  console.log("\n1. Runtime detection");
  check("VERCEL=1 is serverless", isServerless());
  check("python reported unavailable", !isPythonAvailable());

  console.log("\n2. Python features are explicitly unavailable");
  for (const [name, fn] of [
    ["executePyqs", () => bridge.executePyqs({})],
    ["executeNcertChapters", () => bridge.executeNcertChapters()],
    ["executeNcertQuiz", () => bridge.executeNcertQuiz("x")],
    ["executeMaterialProcess", () => bridge.executeMaterialProcess({ text: "hello world" })],
  ] as const) {
    try { fn(); check(`${name} throws`, false, "no error"); }
    catch (e: any) { check(`${name} throws PYTHON_UNAVAILABLE`, e instanceof PythonUnavailableError && e.code === "PYTHON_UNAVAILABLE"); }
  }

  console.log("\n3. Job queue works without touching the filesystem");
  const job = jobQueue.enqueue("embeddings_generation", "serverless test", { ownerId: "u1" }, { dedupKey: "t-serverless" });
  check("job enqueued in memory", jobQueue.getJob(job.id)?.id === job.id);
  await jobQueue.flush();
  check("flush without Firestore resolves", true);
  check("not durable without credentials", jobQueue.durable === false);
  check("getJobDurable falls back to memory", (await jobQueue.getJobDurable(job.id))?.id === job.id);

  console.log("\n4. RAG store is in-memory on serverless");
  check("seed documents available", rag.listDocuments().length > 0);
  const res = rag.indexNewDocument({
    title: "Serverless test doc",
    category: "Custom Upload",
    content: "Federalism and cooperative governance. ".repeat(10),
    userId: "u1",
  });
  check("document indexed in memory", res.success === true);
  check("document listed for owner", rag.listDocuments("u1").some((d) => d.id === res.document?.id));
  let flushFailed = false;
  try { await rag.flushKnowledgeStore(); } catch { flushFailed = true; }
  check("flush reports failure when Firestore is not configured (never fake success)", flushFailed);
  check("delete works", rag.deleteDocument(res.document!.id));
  try { await rag.flushKnowledgeStore(); } catch {}

  console.log("\n5. No local files were written");
  const jobsAfter = fs.existsSync(jobsFile) ? fs.statSync(jobsFile).mtimeMs : null;
  const kbAfter = fs.existsSync(kbFile) ? fs.statSync(kbFile).mtimeMs : null;
  check("job store file untouched", jobsBefore === jobsAfter);
  check("knowledge store file untouched", kbBefore === kbAfter);

  console.log(`\nPASSED ${passed} / ${passed + failed}\n`);
  process.exit(failed === 0 ? 0 : 1);
}

run().catch((e) => { console.error("Suite crashed:", e); process.exit(1); });

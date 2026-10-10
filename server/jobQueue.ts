/**
 * BOLT Production-Safe Durable Background Job Queue
 * 
 * Production Guarantees:
 * 1. Firestore as Durable Job Store: Syncs jobs to Firestore collection "backgroundJobs" with disk persistence fallback.
 * 2. Worker Recovery: On restart, re-queues interrupted running jobs with backoff or fails jobs exceeding max retries; active watchdog rescues stalled jobs.
 * 3. Retry with Exponential Backoff: Failed jobs undergo exponential backoff (2^n * 1s, max 5m) up to maxRetries.
 * 4. Duplicate Prevention: Locks & deduplication keys prevent concurrent runs of identical active workloads.
 * 5. Strict User Isolation: All jobs track ownerId; non-admin users can only inspect and query their own jobs.
 */

import fs from "fs";
import path from "path";
import { initFirebaseAdmin, getAdminFirestore } from "./firebaseAdmin";
import { isServerless } from "./runtimeEnv";

export type JobType =
  | "document_indexing"
  | "embeddings_generation"
  | "current_affairs_sync"
  | "mcq_generation"
  | "model_training"
  | "benchmark_run"
  | "disaster_recovery_test";

export type JobStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export interface BackgroundJob {
  id: string;
  type: JobType;
  status: JobStatus;
  progressPct: number; // 0 to 100
  title: string;
  ownerId?: string;
  dedupKey?: string;
  params: Record<string, any>;
  result?: Record<string, any>;
  error?: string;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  retryCount: number;
  maxRetries: number;
  nextRunAt?: number;
  lastHeartbeatAt?: string;
}

const JOBS_STORE_PATH = path.join(process.cwd(), "data", "job_queue_store.json");

function ensureJobsDir() {
  const dir = path.dirname(JOBS_STORE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadDiskJobs(): BackgroundJob[] {
  // Serverless filesystems are read-only/ephemeral: Firestore is the only durable store there.
  if (isServerless()) return [];
  try {
    ensureJobsDir();
    if (fs.existsSync(JOBS_STORE_PATH)) {
      const data = fs.readFileSync(JOBS_STORE_PATH, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn("[JobQueue] Failed to read jobs from disk, resetting queue:", e);
  }
  return [];
}

function saveDiskJobs(jobs: BackgroundJob[]) {
  if (isServerless()) return;
  try {
    ensureJobsDir();
    fs.writeFileSync(JOBS_STORE_PATH, JSON.stringify(jobs.slice(0, 100), null, 2), "utf-8");
  } catch (e) {
    console.warn("[JobQueue] Failed to write jobs to disk:", e);
  }
}

class BoltJobQueueManager {
  private jobs: BackgroundJob[] = [];
  private isProcessing: boolean = false;
  private workerHandlers: Map<JobType, (job: BackgroundJob) => Promise<any>> = new Map();
  private locks: Map<string, number> = new Map();
  private watchdogInterval: NodeJS.Timeout | null = null;
  private firestoreDb: any = null;
  private pendingSyncs: Set<Promise<void>> = new Set();
  private lastHydrateAt = 0;

  constructor() {
    this.jobs = loadDiskJobs();
    this.initFirestoreSync();
    this.recoverInterruptedJobs();
    this.startWatchdog();
  }

  private initFirestoreSync() {
    // A project ID alone makes the Admin SDK defer credential lookup until the
    // first Firestore request. In local/preview environments that produces an
    // unhandled ADC error, so only enable the optional sync when credentials
    // are explicitly configured.
    const hasServiceAccount = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT);
    const hasApplicationCredentials = Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    const hasSplitCredentials = Boolean(
      process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY
    );

    if (!hasServiceAccount && !hasApplicationCredentials && !hasSplitCredentials) {
      console.info(
        isServerless()
          ? "[JobQueue] No Firebase Admin credentials on a serverless host: jobs are in-memory only and will not survive this instance."
          : "[JobQueue] Firestore sync disabled: no Admin credentials configured; using local durable store."
      );
      return;
    }

    try {
      this.firestoreDb = getAdminFirestore();
    } catch (err: any) {
      this.firestoreDb = null;
      console.warn("[JobQueue] Firestore sync unavailable, operating with local durable store:", err.message);
    }
  }

  /**
   * Syncs single job to Firestore asynchronously in the background.
   */
  private syncJobToFirestore(job: BackgroundJob): Promise<void> {
    if (!this.firestoreDb) return Promise.resolve();
    const p = (async () => {
      try {
        const cleanJob = JSON.parse(JSON.stringify(job));
        await this.firestoreDb.collection("backgroundJobs").doc(job.id).set(cleanJob, { merge: true });
      } catch (err: any) {
        console.warn(`[JobQueue] Firestore sync failed for ${job.id}:`, err?.message || err);
      }
    })();
    this.pendingSyncs.add(p);
    p.finally(() => this.pendingSyncs.delete(p));
    return p;
  }

  /** True when jobs are persisted to Firestore (the only durable store on serverless hosts). */
  get durable(): boolean {
    return Boolean(this.firestoreDb);
  }

  /**
   * Await all in-flight Firestore writes. Serverless functions may be frozen as soon as the
   * response is sent, so request handlers that enqueue or change jobs await this first.
   */
  async flush(): Promise<void> {
    while (this.pendingSyncs.size > 0) {
      await Promise.allSettled([...this.pendingSyncs]);
    }
  }

  /** Load recent jobs from Firestore into memory (no-op without Firestore). Existing in-memory jobs win. */
  async hydrate(limit = 100): Promise<void> {
    if (!this.firestoreDb) return;
    if (Date.now() - this.lastHydrateAt < 5000) return;
    this.lastHydrateAt = Date.now();
    try {
      const snap = await this.firestoreDb.collection("backgroundJobs").orderBy("createdAt", "desc").limit(limit).get();
      const known = new Set(this.jobs.map((j) => j.id));
      for (const d of snap.docs) {
        if (!known.has(d.id)) this.jobs.push({ ...(d.data() as BackgroundJob), id: d.id });
      }
      this.jobs.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    } catch (err: any) {
      console.warn("[JobQueue] Firestore hydrate failed:", err?.message || err);
    }
  }

  /** getJob that falls back to Firestore when another instance created the job. */
  async getJobDurable(id: string, requestingUserId?: string, isAdmin: boolean = false): Promise<BackgroundJob | null> {
    const local = this.getJob(id, requestingUserId, isAdmin);
    if (local || !this.firestoreDb) return local;
    try {
      const doc = await this.firestoreDb.collection("backgroundJobs").doc(id).get();
      if (!doc.exists) return null;
      const job = { ...(doc.data() as BackgroundJob), id: doc.id };
      if (requestingUserId && !isAdmin && job.ownerId && job.ownerId !== requestingUserId) return null;
      return job;
    } catch (err: any) {
      console.warn("[JobQueue] Firestore getJob failed:", err?.message || err);
      return null;
    }
  }

  async listJobsDurable(filter?: Parameters<BoltJobQueueManager["listJobs"]>[0]): Promise<BackgroundJob[]> {
    await this.hydrate();
    return this.listJobs(filter);
  }

  /**
   * On process startup, safely recover jobs that were marked 'running' when server stopped.
   */
  private recoverInterruptedJobs() {
    let modified = false;
    const now = Date.now();

    for (const j of this.jobs) {
      if (j.status === "running") {
        if ((j.retryCount || 0) < (j.maxRetries || 2)) {
          j.status = "queued";
          j.retryCount = (j.retryCount || 0) + 1;
          const backoff = Math.min(300000, 1000 * Math.pow(2, j.retryCount));
          j.nextRunAt = now + backoff;
          j.error = `Worker crash recovered. Auto-rescheduled with backoff (+${Math.round(backoff / 1000)}s)`;
          modified = true;
          console.log(`[JobQueue] Recovered job ${j.id} (${j.type}) from server restart (attempt ${j.retryCount}/${j.maxRetries})`);
        } else {
          j.status = "failed";
          j.error = "Job terminated abruptly during previous server shutdown and exceeded maximum retries.";
          j.finishedAt = new Date().toISOString();
          modified = true;
          console.warn(`[JobQueue] Job ${j.id} failed: max retries reached during recovery.`);
        }
      }
    }

    if (modified) {
      saveDiskJobs(this.jobs);
    }
  }

  /**
   * Periodic watchdog (every 30s) to rescue stalled/orphaned jobs.
   */
  private startWatchdog() {
    if (this.watchdogInterval) return;
    this.watchdogInterval = setInterval(() => {
      this.checkStalledJobs();
      this.scheduleNext();
    }, 30000);
    if (this.watchdogInterval.unref) {
      this.watchdogInterval.unref();
    }
  }

  private checkStalledJobs() {
    const now = Date.now();
    const STALL_THRESHOLD_MS = 180000; // 3 minutes without heartbeat
    let modified = false;

    for (const j of this.jobs) {
      if (j.status === "running") {
        const lastActivity = j.lastHeartbeatAt ? new Date(j.lastHeartbeatAt).getTime() : j.startedAt ? new Date(j.startedAt).getTime() : 0;
        if (now - lastActivity > STALL_THRESHOLD_MS) {
          console.warn(`[JobQueue] Watchdog detected stalled job ${j.id} (${j.type}). Triggering recovery.`);
          if (j.retryCount < j.maxRetries) {
            j.status = "queued";
            j.retryCount += 1;
            j.nextRunAt = now + 5000;
            j.error = "Stalled worker lease expired. Re-queued by supervisor.";
          } else {
            j.status = "failed";
            j.error = "Worker stalled and exceeded maximum execution retries.";
            j.finishedAt = new Date().toISOString();
          }
          modified = true;
          this.syncJobToFirestore(j);
        }
      }
    }

    if (modified) {
      saveDiskJobs(this.jobs);
    }
  }

  registerWorker(type: JobType, handler: (job: BackgroundJob) => Promise<any>) {
    this.workerHandlers.set(type, handler);
  }

  async tryAcquireLock(key: string, ttlMs: number): Promise<boolean> {
    const now = Date.now();
    const expiresAt = this.locks.get(key);
    if (expiresAt && expiresAt > now) {
      return false;
    }
    this.locks.set(key, now + ttlMs);
    return true;
  }

  releaseLock(key: string) {
    this.locks.delete(key);
  }

  /**
   * Enqueue job with deduplication, ownership isolation, and persistent store.
   */
  enqueue(
    type: JobType,
    title: string,
    params: Record<string, any> = {},
    options?: { maxRetries?: number; ownerId?: string; dedupKey?: string }
  ): BackgroundJob {
    const ownerId = options?.ownerId || (params.userId as string) || undefined;
    const maxRetries = options?.maxRetries !== undefined ? options.maxRetries : 3;
    const dedupKey = options?.dedupKey || `${type}:${ownerId || "sys"}:${JSON.stringify(params)}`;

    // Duplicate Prevention: Check if active job with exact dedupKey exists
    const existingActive = this.jobs.find(
      (j) => (j.status === "queued" || j.status === "running") && (j.dedupKey === dedupKey)
    );

    if (existingActive) {
      console.log(`[JobQueue] Deduplication active: reusing existing active job ${existingActive.id} (${type})`);
      return existingActive;
    }

    const job: BackgroundJob = {
      id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type,
      status: "queued",
      progressPct: 0,
      title,
      ownerId,
      dedupKey,
      params,
      createdAt: new Date().toISOString(),
      retryCount: 0,
      maxRetries,
    };

    this.jobs.unshift(job);
    saveDiskJobs(this.jobs);
    this.syncJobToFirestore(job);
    this.scheduleNext();
    return job;
  }

  getJob(id: string, requestingUserId?: string, isAdmin: boolean = false): BackgroundJob | null {
    const job = this.jobs.find((j) => j.id === id);
    if (!job) return null;

    // Strict Ownership Enforcement: if requesting user is passed and not admin, must match ownerId
    if (requestingUserId && !isAdmin && job.ownerId && job.ownerId !== requestingUserId) {
      return null;
    }

    return job;
  }

  listJobs(filter?: { type?: JobType; status?: JobStatus; ownerId?: string; limit?: number }): BackgroundJob[] {
    let result = [...this.jobs];

    // Data Isolation by ownerId
    if (filter?.ownerId) {
      result = result.filter((j) => j.ownerId === filter.ownerId);
    }
    if (filter?.type) {
      result = result.filter((j) => j.type === filter.type);
    }
    if (filter?.status) {
      result = result.filter((j) => j.status === filter.status);
    }
    const limit = filter?.limit || 50;
    return result.slice(0, limit);
  }

  updateProgress(jobId: string, progressPct: number, partialResult?: Record<string, any>) {
    const job = this.jobs.find((j) => j.id === jobId);
    if (job) {
      job.progressPct = Math.min(100, Math.max(0, Math.round(progressPct)));
      job.lastHeartbeatAt = new Date().toISOString();
      if (partialResult) {
        job.result = { ...job.result, ...partialResult };
      }
      saveDiskJobs(this.jobs);
      this.syncJobToFirestore(job);
    }
  }

  async retryJob(jobId: string, requestingUserId?: string): Promise<BackgroundJob | null> {
    const job = this.jobs.find((j) => j.id === jobId);
    if (!job || job.status === "running") return null;

    if (requestingUserId && job.ownerId && job.ownerId !== requestingUserId) {
      throw new Error("Unauthorized: Cannot retry a background job owned by another user.");
    }

    job.status = "queued";
    job.progressPct = 0;
    job.error = undefined;
    job.nextRunAt = undefined;
    job.retryCount += 1;
    saveDiskJobs(this.jobs);
    this.syncJobToFirestore(job);
    this.scheduleNext();
    return job;
  }

  /**
   * Drive the queue until `jobId` reaches a terminal state or `timeoutMs` elapses.
   * Needed on serverless hosts, where work scheduled with setTimeout after the response is sent can be
   * frozen and never finish. Returns the job's latest state (possibly still queued/running on timeout).
   */
  async runNow(jobId: string, timeoutMs = 45000): Promise<BackgroundJob | null> {
    const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
    const deadline = Date.now() + timeoutMs;
    const find = () => this.jobs.find((j) => j.id === jobId) ?? null;

    while (Date.now() < deadline) {
      const job = find();
      if (!job || (job.status !== "queued" && job.status !== "running")) return job;
      if (job.status === "queued" && job.nextRunAt && job.nextRunAt > Date.now()) {
        if (job.nextRunAt > deadline) return job; // retry back-off outlasts this request
        await sleep(Math.min(job.nextRunAt - Date.now(), deadline - Date.now()));
        continue;
      }
      if (this.isProcessing) {
        await sleep(100); // another job is running in this process
        continue;
      }
      await this.processQueue();
      if (find()?.status === "queued") await sleep(100); // lock contention: avoid a hot loop
    }
    return find();
  }

  private scheduleNext() {
    if (this.isProcessing) return;
    setTimeout(() => this.processQueue(), 50);
  }

  private async processQueue() {
    if (this.isProcessing) return;

    const now = Date.now();
    // Pick highest priority queued job whose backoff window has expired
    const nextJob = this.jobs.find((j) => j.status === "queued" && (!j.nextRunAt || j.nextRunAt <= now));
    if (!nextJob) return;

    // Mutex lock to prevent duplicate concurrent runs
    const lockAcquired = await this.tryAcquireLock(nextJob.id, 120000);
    if (!lockAcquired) {
      return;
    }

    this.isProcessing = true;
    nextJob.status = "running";
    nextJob.startedAt = new Date().toISOString();
    nextJob.lastHeartbeatAt = new Date().toISOString();
    saveDiskJobs(this.jobs);
    this.syncJobToFirestore(nextJob);

    const startTime = Date.now();
    try {
      const handler = this.workerHandlers.get(nextJob.type);
      if (!handler) {
        throw new Error(`No worker registered for job type: ${nextJob.type}`);
      }

      const result = await handler(nextJob);
      nextJob.status = "completed";
      nextJob.progressPct = 100;
      nextJob.result = result || {};
      nextJob.finishedAt = new Date().toISOString();
      nextJob.durationMs = Date.now() - startTime;
      nextJob.error = undefined;
    } catch (err: any) {
      console.error(`[JobQueue] Job ${nextJob.id} (${nextJob.type}) failed:`, err);
      if (nextJob.retryCount < nextJob.maxRetries) {
        nextJob.status = "queued";
        nextJob.retryCount += 1;
        // Exponential backoff: 2s, 4s, 8s, up to 5 min
        const backoffMs = Math.min(300000, 1000 * Math.pow(2, nextJob.retryCount));
        nextJob.nextRunAt = Date.now() + backoffMs;
        nextJob.error = `Retrying in ${Math.round(backoffMs / 1000)}s (attempt ${nextJob.retryCount}/${nextJob.maxRetries}): ${err.message || String(err)}`;
      } else {
        nextJob.status = "failed";
        nextJob.error = err.message || String(err);
        nextJob.finishedAt = new Date().toISOString();
        nextJob.durationMs = Date.now() - startTime;
      }
    } finally {
      this.releaseLock(nextJob.id);
      saveDiskJobs(this.jobs);
      this.syncJobToFirestore(nextJob);
      this.isProcessing = false;
      this.scheduleNext();
    }
  }
}

export const jobQueue = new BoltJobQueueManager();

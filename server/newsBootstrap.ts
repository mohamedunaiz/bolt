import { getAdminFirestore } from "./firebaseAdmin.js";
import { executeNewsIngestionPipeline } from "./currentAffairsPipeline.js";

/**
 * Self-healing news bootstrap.
 *
 * The daily cron needs CRON_SECRET and a successful first run; until then the read endpoint
 * used to answer "being refreshed" forever without ever fetching anything or saying why.
 * Now, when the store is empty, a reader request triggers ONE bounded ingestion run
 * (cooldown + in-flight guard so users cannot hammer the sources) and every attempt's
 * outcome is recorded so the endpoint can explain what went wrong.
 */

export interface NewsSyncStatus {
  attemptedAt: string;
  finishedAt?: string;
  inFlight: boolean;
  ok?: boolean;
  newlyIngested?: number;
  mcqsGenerated?: number;
  successfulSources?: string[];
  failedSources?: Array<{ source: string; error: string }>;
  error?: string;
}

export interface BootstrapDeps {
  readStatus: () => Promise<NewsSyncStatus | null>;
  writeStatus: (status: NewsSyncStatus) => Promise<void>;
  runIngestion: () => Promise<{
    newlyIngested: number;
    mcqsGenerated?: number;
    articles: unknown[];
    successfulSources: string[];
    failedSources: Array<{ source: string; error: string }>;
  }>;
  now?: () => number;
  /** Minimum gap between attempts (default 10 min). */
  cooldownMs?: number;
  /** An in-flight marker older than this is considered dead (default 2 min). */
  inFlightTtlMs?: number;
  /** Max time a reader waits for the run (default 50s; Vercel maxDuration is 60s). */
  budgetMs?: number;
}

export interface BootstrapResult {
  attempted: boolean;
  /** Why no attempt was made, when attempted is false. */
  skippedReason?: "cooldown" | "in_flight" | "not_configured";
  status: NewsSyncStatus | null;
}

const TRIM = 300;
const trim = (s: string) => (s.length > TRIM ? `${s.slice(0, TRIM)}...` : s);

export async function ensureNewsLoaded(deps: BootstrapDeps): Promise<BootstrapResult> {
  const now = deps.now ?? Date.now;
  const cooldownMs = deps.cooldownMs ?? 10 * 60 * 1000;
  const inFlightTtlMs = deps.inFlightTtlMs ?? 2 * 60 * 1000;
  const budgetMs = deps.budgetMs ?? 50_000;

  const previous = await deps.readStatus();
  if (previous) {
    const age = now() - Date.parse(previous.attemptedAt);
    if (previous.inFlight && age < inFlightTtlMs) return { attempted: false, skippedReason: "in_flight", status: previous };
    if (!previous.inFlight && age < cooldownMs) return { attempted: false, skippedReason: "cooldown", status: previous };
  }

  const started: NewsSyncStatus = { attemptedAt: new Date(now()).toISOString(), inFlight: true };
  await deps.writeStatus(started);

  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      deps.runIngestion(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`News ingestion exceeded its ${budgetMs}ms budget`)), budgetMs);
      }),
    ]);
    const ok = result.articles.length > 0;
    const status: NewsSyncStatus = {
      ...started,
      inFlight: false,
      finishedAt: new Date(now()).toISOString(),
      ok,
      newlyIngested: result.newlyIngested,
      mcqsGenerated: result.mcqsGenerated ?? 0,
      successfulSources: result.successfulSources,
      failedSources: result.failedSources.slice(0, 12).map((f) => ({ source: f.source, error: trim(f.error) })),
      ...(ok ? {} : { error: "Every news source (RSS and web search) returned nothing." }),
    };
    await deps.writeStatus(status).catch(() => undefined);
    return { attempted: true, status };
  } catch (e: any) {
    const status: NewsSyncStatus = {
      ...started,
      inFlight: false,
      finishedAt: new Date(now()).toISOString(),
      ok: false,
      error: trim(e?.message || String(e)),
    };
    await deps.writeStatus(status).catch(() => undefined);
    return { attempted: true, status };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

const STATUS_COLLECTION = "news_sync_status";
const STATUS_DOC = "latest";

/** Production wiring: Firestore-backed status + the real ingestion pipeline. */
export async function ensureNewsLoadedForServer(): Promise<BootstrapResult> {
  const db = getAdminFirestore();
  if (!db) {
    return {
      attempted: false,
      skippedReason: "not_configured",
      status: {
        attemptedAt: new Date().toISOString(),
        inFlight: false,
        ok: false,
        error: "Firestore is not configured on the server (set FIREBASE_SERVICE_ACCOUNT or FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY).",
      },
    };
  }
  const ref = db.collection(STATUS_COLLECTION).doc(STATUS_DOC);
  return ensureNewsLoaded({
    readStatus: async () => {
      const snap = await ref.get();
      return snap.exists ? (snap.data() as NewsSyncStatus) : null;
    },
    writeStatus: async (s) => {
      await ref.set(JSON.parse(JSON.stringify(s)));
    },
    runIngestion: () => executeNewsIngestionPipeline(),
  });
}

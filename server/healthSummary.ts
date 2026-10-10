/**
 * Pure helpers that turn raw runtime facts into honest health statuses.
 * "configured" is never reported as "connected": only a live probe (/api/health/deep) can verify a model.
 */
import type { PipelineStatus } from "./currentAffairsPipeline.js";

const PLACEHOLDER_KEYS = new Set(["", "MY_GEMINI_API_KEY"]);

export function hasUsableKey(value: string | undefined): boolean {
  return typeof value === "string" && !PLACEHOLDER_KEYS.has(value.trim());
}

export interface AiHealth {
  status: "not_configured" | "key_rejected" | "configured";
  provider: string | null;
  verified: false;
  /** Provider keys present in the environment that this server does NOT read (only GEMINI_API_KEY is used). */
  ignoredProviderKeys: string[];
  note: string;
}

// The gateway and every direct AI call read process.env.GEMINI_API_KEY only. Other provider keys
// can only be used via admin runtime settings, which are not persisted on serverless hosts.
const IGNORED_PROVIDER_ENV = ["ANTHROPIC_API_KEY", "OPENAI_API_KEY", "XAI_API_KEY"] as const;

export function summarizeAiHealth(
  env: Record<string, string | undefined> = process.env,
  geminiKeyDenied = false,
): AiHealth {
  const ignoredProviderKeys = IGNORED_PROVIDER_ENV.filter((name) => hasUsableKey(env[name]));
  if (!hasUsableKey(env.GEMINI_API_KEY)) {
    return {
      status: "not_configured",
      provider: null,
      verified: false,
      ignoredProviderKeys,
      note:
        "GEMINI_API_KEY is not set, so the mentor answers from built-in academic rules (no model) and " +
        "daily MCQs / web-search news cannot be generated." +
        (ignoredProviderKeys.length
          ? ` ${ignoredProviderKeys.join(", ")} is set but is not read by the server.`
          : ""),
    };
  }
  if (geminiKeyDenied) {
    return {
      status: "key_rejected",
      provider: "Google Gemini",
      verified: false,
      ignoredProviderKeys,
      note: "GEMINI_API_KEY is set but Google rejected it recently (403). Replace the key or enable the API.",
    };
  }
  return {
    status: "configured",
    provider: "Google Gemini",
    verified: false,
    ignoredProviderKeys,
    note: "A Gemini key is present. This is NOT a live check; call GET /api/health/deep (admin) to verify the model responds.",
  };
}

export type PipelineHealthState = "never_run" | "empty" | "stale" | "mcq_unavailable" | "no_mcqs" | "active";

export function summarizePipelineHealth(
  status: Pick<PipelineStatus, "lastRunTimestamp" | "totalArticlesCount" | "dailyMcqsCount">,
  opts: { aiConfigured: boolean; now?: number; staleAfterMs?: number },
): { state: PipelineHealthState; reason: string } {
  const now = opts.now ?? Date.now();
  const staleAfterMs = opts.staleAfterMs ?? 36 * 60 * 60 * 1000; // daily cron + slack
  const lastRun = status.lastRunTimestamp ? Date.parse(status.lastRunTimestamp) : NaN;

  if (status.totalArticlesCount === 0) {
    return status.lastRunTimestamp
      ? { state: "empty", reason: "The last sync stored no articles (all sources failed or returned nothing)." }
      : { state: "never_run", reason: "No sync has stored articles yet. Check CRON_SECRET and trigger /api/news/sync." };
  }
  if (Number.isFinite(lastRun) && now - lastRun > staleAfterMs) {
    return { state: "stale", reason: `Last successful sync was more than ${Math.round(staleAfterMs / 3600000)}h ago.` };
  }
  if (status.dailyMcqsCount === 0) {
    return opts.aiConfigured
      ? { state: "no_mcqs", reason: "Articles are stored but no MCQs were generated (check the last sync result)." }
      : { state: "mcq_unavailable", reason: "MCQs need GEMINI_API_KEY, which is not configured." };
  }
  return { state: "active", reason: "Articles and MCQs are stored and recent." };
}

import crypto from "crypto";
import type { Request, Response } from "express";
import { executeNewsIngestionPipeline } from "../../server/currentAffairsPipeline.js";

let newsSyncInFlight: Promise<Awaited<ReturnType<typeof executeNewsIngestionPipeline>>> | null = null;

function getProvidedSecret(req: Request): string | null {
  const authorization = req.get("authorization");
  if (authorization?.startsWith("Bearer ")) return authorization.slice(7);
  return req.get("x-news-cron-secret") || null;
}

function secretsMatch(expected: string, provided: string): boolean {
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  return expectedBuffer.length === providedBuffer.length && crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}

export default async function handler(req: Request, res: Response) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  // Vercel Cron sends `Authorization: Bearer $CRON_SECRET`; external schedulers can use
  // NEWS_CRON_SECRET. Either configured secret is accepted.
  const expectedSecrets = [process.env.NEWS_CRON_SECRET, process.env.CRON_SECRET].filter(
    (s): s is string => Boolean(s),
  );
  if (expectedSecrets.length === 0) {
    return res.status(503).json({
      success: false,
      state: "not_configured",
      error: "Neither CRON_SECRET nor NEWS_CRON_SECRET is configured; news sync cannot be authenticated.",
    });
  }
  const providedSecret = getProvidedSecret(req);
  if (!providedSecret || !expectedSecrets.some((s) => secretsMatch(s, providedSecret))) {
    return res.status(401).json({ success: false, state: "auth_failure", error: "Unauthorized scheduler request." });
  }

  try {
    newsSyncInFlight ??= executeNewsIngestionPipeline();
    const pipelineResult = await newsSyncInFlight;
    return res.status(200).json({
      success: true,
      state: "ok",
      newlyIngested: pipelineResult.newlyIngested,
      totalArticles: pipelineResult.articles.length,
      successfulSources: pipelineResult.successfulSources,
      failedSources: pipelineResult.failedSources,
      sourceHealth: pipelineResult.sourceHealth,
      sources: pipelineResult.sources,
      cacheRetained: pipelineResult.cacheRetained,
      cacheWritten: pipelineResult.cacheWritten,
      mcqsGenerated: pipelineResult.mcqsGenerated ?? 0,
      updatedAt: pipelineResult.updatedAt,
      timestamp: pipelineResult.updatedAt,
    });
  } catch (error) {
    console.error("[NEWS-SYNC] news sync failed:", error);
    return res.status(500).json({
      success: false,
      state: "backend_failure",
      error: error instanceof Error ? error.message : "News synchronization encountered an error.",
      cacheRetained: true,
      cacheWritten: false,
      timestamp: new Date().toISOString(),
    });
  } finally {
    newsSyncInFlight = null;
  }
}

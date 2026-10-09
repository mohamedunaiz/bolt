import type { Request, Response } from "express";
import { loadCurrentAffairsFromFirestore } from "../../server/currentAffairsPipeline.js";

/**
 * Hosting-agnostic read-only current-affairs endpoint.
 * The normal Express server is the source of truth; this file is retained only
 * for compatibility with deployments that still discover api/ routes.
 */
export default async function handler(req: Request, res: Response) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const result = await loadCurrentAffairsFromFirestore();
    const articles = Array.isArray(result?.articles) ? result.articles : [];
    const mcqs = Array.isArray(result?.mcqs) ? result.mcqs : [];
    const sources = [...new Set(articles.map((a) => a.source).filter(Boolean))];
    const state = articles.length > 0 ? "ok" : "empty";

    return res.status(200).json({
      success: true,
      state,
      articles,
      mcqs,
      sources,
      publisherSources: sources,
      sourceStats: { working: sources.length, failed: 0 },
      count: articles.length,
      updatedAt: result?.updatedAt ?? null,
      message: state === "ok" ? undefined : "Today's current affairs are being refreshed. Please check back shortly.",
    });
  } catch (error) {
    console.error("[NEWS] daily-current-affairs read failed:", error);
    return res.status(200).json({
      success: true,
      state: "unavailable",
      articles: [],
      mcqs: [],
      sources: [],
      publisherSources: [],
      sourceStats: { working: 0, failed: 0 },
      count: 0,
      updatedAt: null,
      message: "The current affairs service is temporarily unavailable. Please try again in a moment.",
    });
  }
}

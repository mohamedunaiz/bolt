import { NewsArticle } from "../src/types";
import { getGeminiClient, executeGeminiWithFailover, parseFirstJsonObject } from "./aiGateway.js";
import { generateDeterministicArticleId } from "./rssService.js";

/**
 * Second news path for when every RSS source fails (blocked publisher, network, bad feed).
 *
 * Gemini is asked to search the live web (Google Search grounding) and summarise today's
 * UPSC-relevant stories. Nothing is accepted without evidence: the response must carry
 * grounding citations, every article is linked to one of those cited pages, and articles
 * are marked as AI-written summaries of live web results. With no key, no citations or
 * any error, the result is an empty list - never invented news.
 */

export interface GroundingSource {
  url: string;
  title: string;
}

export interface GroundedNewsResponse {
  text: string;
  sources: GroundingSource[];
}

export interface GroundedNewsDeps {
  /** Runs the grounded search. Injected in tests; defaults to Gemini + Google Search. */
  search?: (prompt: string) => Promise<GroundedNewsResponse>;
  now?: () => Date;
  maxArticles?: number;
}

const GS_TAGS = ["GS 1", "GS 2", "GS 3", "GS 4"];

function buildPrompt(today: string, max: number): string {
  return `You are a UPSC Civil Services current-affairs editor. Today is ${today}.
Search the web for the most important Indian news from the last 48 hours that matters for UPSC CSE:
government policy and schemes, Supreme Court and High Court judgments, Parliament, economy and RBI,
international relations, environment, science and technology.

Return ONLY valid JSON, no markdown, with this shape:
{"articles":[{
  "headline": string,
  "summary": string (3-4 plain sentences a student can read in 20 seconds),
  "keyHighlights": string[] (3-4 short bullets),
  "gsTags": string[] (from "GS 1","GS 2","GS 3","GS 4"),
  "publisher": string (name of the outlet that reported it),
  "prelimsFact": string,
  "mainsRelevance": string,
  "possibleMainsQuestion": string
}]}
Rules: at most ${max} articles; only real, verifiable stories found in your search results; never invent
facts, numbers or quotes; if you find nothing reliable return {"articles":[]}.`;
}

async function geminiGroundedSearch(prompt: string): Promise<GroundedNewsResponse> {
  const gemini = getGeminiClient();
  if (!gemini) throw new Error("GEMINI_API_KEY is not configured");
  const { result } = await executeGeminiWithFailover(
    gemini,
    "gemini-3.8-flash",
    (modelId) =>
      gemini.models.generateContent({
        model: modelId,
        contents: prompt,
        // responseMimeType JSON is not allowed together with the search tool.
        config: { temperature: 0.2, tools: [{ googleSearch: {} }] },
      }),
    { timeoutMs: 30000, label: "liveNewsFallback" },
  );
  const chunks: any[] = (result as any).candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const sources: GroundingSource[] = chunks
    .map((c) => ({ url: String(c?.web?.uri || ""), title: String(c?.web?.title || "") }))
    .filter((s) => /^https?:\/\//i.test(s.url));
  return { text: (result as any).text || "", sources };
}

function asStringArray(v: unknown, limit: number): string[] {
  return Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean).slice(0, limit) : [];
}

/** Pick the cited page whose title (usually the outlet's domain) best matches the publisher. */
function pickSource(publisher: string, sources: GroundingSource[], index: number): GroundingSource {
  const key = publisher.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (key) {
    const hit = sources.find((s) => s.title.toLowerCase().replace(/[^a-z0-9]/g, "").includes(key));
    if (hit) return hit;
  }
  return sources[index % sources.length];
}

export async function fetchGroundedNews(deps: GroundedNewsDeps = {}): Promise<NewsArticle[]> {
  const search = deps.search ?? geminiGroundedSearch;
  const now = (deps.now ?? (() => new Date()))();
  const max = deps.maxArticles ?? 8;

  const response = await search(buildPrompt(now.toISOString().slice(0, 10), max));
  if (!response.sources.length) return []; // no citations => no evidence => no articles

  const parsed = parseFirstJsonObject(response.text);
  const items: any[] = Array.isArray(parsed?.articles) ? parsed.articles : [];
  const iso = now.toISOString();
  const articles: NewsArticle[] = [];

  items.slice(0, max).forEach((item, i) => {
    const headline = String(item?.headline || "").trim();
    const summary = String(item?.summary || "").trim();
    if (!headline || summary.length < 40) return;
    const src = pickSource(String(item?.publisher || ""), response.sources, i);
    const gsTags = asStringArray(item?.gsTags, 3).filter((t) => GS_TAGS.some((g) => t.startsWith(g)));
    const highlights = asStringArray(item?.keyHighlights, 4);
    articles.push({
      id: generateDeterministicArticleId(src.url, "Web Search", headline),
      date: iso,
      source: "Web Search",
      headline,
      gsTags: gsTags.length ? gsTags : ["GS 2"],
      summary,
      keyHighlights: highlights.length ? highlights : [summary.split(/(?<=[.!?])\s/)[0]],
      detailedInsights: [],
      keyConceptsInvolved: [],
      upscRelevance: {
        prelimsFact: String(item?.prelimsFact || "").trim(),
        mainsRelevance: String(item?.mainsRelevance || "").trim(),
        possibleMainsQuestion: String(item?.possibleMainsQuestion || "").trim(),
      },
      sourceUrl: src.url,
      publishedAt: iso,
      retrievedAt: iso,
      provenanceType: "LIVE_SOURCE",
      isLive: true,
    });
  });

  return articles;
}

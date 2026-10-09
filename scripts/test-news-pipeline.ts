/**
 * BOLT News Ingestion Resilience Test Suite
 *
 * Network-free unit tests for the current-affairs ingestion pipeline. These
 * assert the guarantees the frontend depends on:
 *   - One failing source can never abort ingestion of the others.
 *   - A run where every source fails NEVER overwrites the cache with [].
 *   - RSS 2.0, Atom and RSS 1.0 (RDF) all parse.
 *   - Content-Type is NOT required; HTML error pages are still rejected.
 *
 * Run with: npm run test:news
 */

import {
  looksLikeXmlFeed,
  parseFeedContent,
  RssFetchError,
} from "../server/rssService";
import {
  runNewsIngestion,
  persistArticlesThenGenerateMcqs,
  type IngestionDeps,
} from "../server/currentAffairsPipeline";
import type { NewsArticle } from "../src/types";

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail = "") {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function checkThrows(name: string, fn: () => Promise<unknown>, kind?: string) {
  try {
    await fn();
    check(name, false, "expected an error but none was thrown");
  } catch (e: any) {
    const kindOk = !kind || (e instanceof RssFetchError && e.kind === kind);
    check(name, kindOk, kind ? `expected kind=${kind}, got ${e?.kind}` : "");
  }
}

// --- Sample feed bodies ------------------------------------------------------

const RSS2 = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>Sample RSS</title>
  <item><title>Cabinet approves new policy</title><link>https://example.com/a</link>
    <description>The Union Cabinet approved a scheme today.</description>
    <pubDate>Mon, 01 Sep 2025 10:00:00 GMT</pubDate></item>
  <item><title>Supreme Court verdict on federalism</title><link>https://example.com/b</link>
    <description>A landmark judgment was delivered.</description>
    <pubDate>Mon, 01 Sep 2025 09:00:00 GMT</pubDate></item>
</channel></rss>`;

const ATOM = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom"><title>Sample Atom</title>
  <entry><title>Monetary policy review</title><link href="https://example.com/c"/>
    <summary>The RBI held rates steady.</summary><updated>2025-09-01T10:00:00Z</updated></entry>
</feed>`;

const RDF = `<?xml version="1.0"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns="http://purl.org/rss/1.0/">
  <channel rdf:about="https://example.com"><title>Sample RDF</title></channel>
  <item rdf:about="https://example.com/d"><title>Budget session begins</title>
    <link>https://example.com/d</link><description>The session commenced.</description></item>
</rdf:RDF>`;

const HTML_ERROR = `<!DOCTYPE html><html><head><title>403 Forbidden</title></head>
  <body><h1>Access Denied</h1></body></html>`;

// --- Test helpers ------------------------------------------------------------

function makeArticle(id: string, headline: string): NewsArticle {
  return {
    id,
    headline,
    source: "The Hindu",
    summary: "summary",
    date: new Date().toISOString(),
  } as unknown as NewsArticle;
}

function makeDeps(overrides: Partial<IngestionDeps>): IngestionDeps {
  return {
    feeds: [
      { name: "The Hindu", source: "The Hindu", url: "https://a.example/rss" },
      { name: "PIB", source: "PIB", url: "https://b.example/rss" },
    ],
    fetchFeed: async () => ({ success: false, articles: [], error: "not implemented" }),
    loadCache: async () => ({ articles: [], mcqs: [], updatedAt: null }),
    saveCache: async () => {},
    ...overrides,
  };
}

// --- Suite -------------------------------------------------------------------

async function run() {
  console.log("\n=== BOLT News Ingestion Resilience Suite ===\n");

  console.log("1. Content-Type is not required; HTML error pages rejected");
  check("RSS 2.0 body recognized regardless of content-type", looksLikeXmlFeed(RSS2, "text/html"));
  check("Atom body recognized as text/plain", looksLikeXmlFeed(ATOM, "text/plain"));
  check("RDF body recognized with empty content-type", looksLikeXmlFeed(RDF, ""));
  check("HTML error page rejected", !looksLikeXmlFeed(HTML_ERROR, "text/html"));

  console.log("\n2. Feed format parsing (RSS 2.0 / Atom / RDF)");
  check("RSS 2.0 parses 2 items", parseFeedContent(RSS2, "https://a", "The Hindu").articles.length === 2);
  check("Atom parses 1 entry", parseFeedContent(ATOM, "https://a", "The Hindu").articles.length === 1);
  check("RDF (RSS 1.0) parses 1 item", parseFeedContent(RDF, "https://a", "The Hindu").articles.length === 1);

  console.log("\n3. Malformed / non-feed content yields zero articles (never fabricated, never crashes)");
  check("garbage input yields 0 articles", parseFeedContent("<<not xml>>", "https://a", "The Hindu").articles.length === 0);
  check("HTML error page yields 0 articles", parseFeedContent(HTML_ERROR, "https://a", "The Hindu").articles.length === 0);

  console.log("\n4. One source fails, one succeeds → others still ingested");
  {
    const res = await runNewsIngestion(makeDeps({
      fetchFeed: async (url) =>
        url.includes("a.example")
          ? { success: true, articles: [makeArticle("x1", "Fresh headline one")], durationMs: 5 }
          : { success: false, articles: [], error: "HTTP 500", errorKind: "http_error", httpStatus: 500 },
    }));
    check("one article ingested", res.articles.length === 1);
    check("successfulSources has 1", res.successfulSources.length === 1);
    check("failedSources has 1", res.failedSources.length === 1);
    check("sourceHealth records http_error", res.sourceHealth.some((h) => h.errorKind === "http_error" && h.httpStatus === 500));
    check("cache written on fresh data", res.cacheWritten === true);
  }

  console.log("\n5. ALL sources fail WITH existing cache → cache retained, not overwritten");
  {
    let saveCalled = false;
    const previous = [makeArticle("old1", "Yesterday news")];
    const res = await runNewsIngestion(makeDeps({
      fetchFeed: async () => ({ success: false, articles: [], error: "timeout", errorKind: "timeout" }),
      loadCache: async () => ({ articles: previous, mcqs: [], updatedAt: "2025-09-01T00:00:00Z" }),
      saveCache: async () => { saveCalled = true; },
    }));
    check("previous articles retained", res.articles.length === 1 && res.articles[0].id === "old1");
    check("cacheRetained flag true", res.cacheRetained === true);
    check("cacheWritten false", res.cacheWritten === false);
    check("saveCache NOT called (no overwrite with [])", saveCalled === false);
  }

  console.log("\n6. ALL sources fail WITH empty cache → empty success, no throw, no write");
  {
    let saveCalled = false;
    const res = await runNewsIngestion(makeDeps({
      fetchFeed: async () => ({ success: false, articles: [], error: "network", errorKind: "network" }),
      saveCache: async () => { saveCalled = true; },
    }));
    check("returns empty article list", res.articles.length === 0);
    check("does not write empty cache", saveCalled === false);
    check("all sources marked failed", res.failedSources.length === 2);
  }

  console.log("\n7. A throwing fetchFeed is isolated (Promise.allSettled)");
  {
    const res = await runNewsIngestion(makeDeps({
      fetchFeed: async (url) => {
        if (url.includes("a.example")) throw new Error("boom");
        return { success: true, articles: [makeArticle("y1", "Second source ok")], durationMs: 3 };
      },
    }));
    check("surviving source still ingested", res.articles.length === 1 && res.articles[0].id === "y1");
    check("thrown source recorded as failed", res.failedSources.some((f) => /boom|failed/i.test(f.error)));
  }

  console.log("\n8. Fresh data merges + dedupes against existing cache");
  {
    const previous = [makeArticle("dup", "Repeated headline"), makeArticle("keep", "Older unique headline")];
    const res = await runNewsIngestion(makeDeps({
      loadCache: async () => ({ articles: previous, mcqs: [], updatedAt: null }),
      fetchFeed: async (url) =>
        url.includes("a.example")
          ? { success: true, articles: [makeArticle("dup2", "Repeated headline"), makeArticle("new", "Brand new headline")], durationMs: 2 }
          : { success: false, articles: [], error: "skip" },
    }));
    const headlines = res.articles.map((a) => a.headline);
    const repeatedCount = headlines.filter((h) => h === "Repeated headline").length;
    check("duplicate headline collapsed", repeatedCount === 1, `found ${repeatedCount}`);
    check("brand new headline present", headlines.includes("Brand new headline"));
    check("older unique headline retained", headlines.includes("Older unique headline"));
    check("cache written", res.cacheWritten === true);
  }

  console.log("\n9. Articles are persisted BEFORE MCQ generation; MCQ problems never lose the news");
  {
    const articles = [makeArticle("p1", "Persisted headline")];

    // 9a. ordering: save happens first, generation second
    const order: string[] = [];
    const ok = await persistArticlesThenGenerateMcqs(articles, {
      saveArticles: async () => { order.push("save"); },
      generateMcqs: async () => { order.push("mcqs"); return [{ id: "m1" } as any, { id: "m2" } as any]; },
    });
    check("articles saved before MCQs are generated", order.join(",") === "save,mcqs", order.join(","));
    check("reports number of MCQs generated", ok.mcqsGenerated === 2);

    // 9b. AI outage: generator throws -> articles already saved, no throw, no MCQs
    let savedA = 0;
    const outage = await persistArticlesThenGenerateMcqs(articles, {
      saveArticles: async () => { savedA++; },
      generateMcqs: async () => { throw new Error("503 all candidates exhausted"); },
    });
    check("AI outage does not lose saved articles", savedA === 1);
    check("AI outage reported, 0 MCQs, no throw", outage.mcqsGenerated === 0 && /503/.test(outage.mcqError || ""));

    // 9c. slow AI: generator exceeds the budget -> gives up, articles still saved
    let savedB = 0;
    const started = Date.now();
    const slow = await persistArticlesThenGenerateMcqs(articles, {
      saveArticles: async () => { savedB++; },
      generateMcqs: () => new Promise((resolve) => setTimeout(() => resolve([]), 2000)),
      mcqBudgetMs: 50,
    });
    check("slow AI is cut off by the time budget", Date.now() - started < 1000 && /budget/i.test(slow.mcqError || ""));
    check("slow AI does not lose saved articles", savedB === 1);

    // 9d. failing to save the articles themselves must NOT be reported as success
    let generatorCalled = false;
    let threw = false;
    try {
      await persistArticlesThenGenerateMcqs(articles, {
        saveArticles: async () => { throw new Error("Firestore is not configured"); },
        generateMcqs: async () => { generatorCalled = true; return []; },
      });
    } catch {
      threw = true;
    }
    check("save failure propagates (never reported as success)", threw);
    check("no MCQ generation after a failed save", generatorCalled === false);
  }

  console.log("\n===========================================");
  console.log(`PASSED ${passed} / ${passed + failed}`);
  console.log("===========================================\n");
  process.exit(failed === 0 ? 0 : 1);
}

run().catch((err) => {
  console.error("Test suite crashed:", err);
  process.exit(1);
});

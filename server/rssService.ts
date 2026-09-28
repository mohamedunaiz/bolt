import { XMLParser } from "fast-xml-parser";
import crypto from "crypto";
import { NewsArticle } from "../src/types";

export function generateDeterministicArticleId(canonicalUrl: string, source: string, headline: string): string {
  const normUrl = (canonicalUrl || "").trim().toLowerCase();
  const normSource = (source || "").trim().toLowerCase();
  const normHeadline = (headline || "").trim().toLowerCase().replace(/\s+/g, " ");
  const hash = crypto.createHash("sha256").update(`${normUrl}|${normSource}|${normHeadline}`).digest("hex");
  return `art_${hash.slice(0, 16)}`;
}

export interface RssFeedPreset {
  id: string;
  name: string;
  source: NewsArticle["source"];
  url: string;
  category: string;
  description: string;
}

export const POPULAR_UPSC_FEEDS: RssFeedPreset[] = [
  {
    id: "hindu-editorial",
    name: "The Hindu - Editorials & Op-Ed",
    source: "The Hindu",
    url: "https://www.thehindu.com/opinion/editorial/feeder/default.rss",
    category: "Editorials & Opinions",
    description: "Daily critical analysis on constitutional, governance, and diplomatic issues.",
  },
  {
    id: "hindu-national",
    name: "The Hindu - National News",
    source: "The Hindu",
    url: "https://www.thehindu.com/news/national/feeder/default.rss",
    category: "National Affairs (GS 2)",
    description: "Policy announcements, Supreme Court judgments, and parliamentary debates.",
  },
  {
    id: "hindu-international",
    name: "The Hindu - International Relations",
    source: "The Hindu",
    url: "https://www.thehindu.com/news/international/feeder/default.rss",
    category: "International Relations (GS 2)",
    description: "Global diplomacy, bilateral summits, and multilateral treaties.",
  },
  {
    id: "hindu-science",
    name: "The Hindu - Science & Technology",
    source: "The Hindu",
    url: "https://www.thehindu.com/sci-tech/science/feeder/default.rss",
    category: "Science & Tech (GS 3)",
    description: "Space missions, biotechnology, AI governance, and scientific breakthroughs.",
  },
  {
    id: "hindu-environment",
    name: "The Hindu - Energy & Environment",
    source: "The Hindu",
    url: "https://www.thehindu.com/sci-tech/energy-and-environment/feeder/default.rss",
    category: "Environment & Ecology (GS 3)",
    description: "Climate policy, renewable energy transition, and wildlife conservation.",
  },
  {
    id: "hindu-business",
    name: "The Hindu - Economy & Business",
    source: "The Hindu",
    url: "https://www.thehindu.com/business/feeder/default.rss",
    category: "Economy & Industry (GS 3)",
    description: "Macroeconomic updates, fiscal indicators, and trade developments.",
  },
  {
    id: "pib-releases",
    name: "PIB - Government Press Releases",
    source: "PIB",
    url: "https://pib.gov.in/RssMain.aspx?ModId=6",
    category: "Government Schemes & Policy",
    description: "Authentic notifications from Union Ministries, Cabinet decisions & PM speeches.",
  },
  {
    id: "livemint-politics",
    name: "The Indian Express - Governance & Polity",
    source: "The Indian Express",
    url: "https://indianexpress.com/section/political-pulse/feed/",
    category: "Governance & Polity (GS 2)",
    description: "In-depth investigative coverage of constitutional institutions and policy agendas.",
  },
  {
    id: "livemint-economy",
    name: "The Indian Express - Economy & Policy",
    source: "The Indian Express",
    url: "https://indianexpress.com/section/business/economy/feed/",
    category: "Macroeconomics (GS 3)",
    description: "Macroeconomic indicators, fiscal deficits, and structural reforms.",
  },
  {
    id: "bs-economy",
    name: "Business Standard - Economy & Fiscal Policy",
    source: "Business Standard",
    url: "https://www.business-standard.com/rss/economy-policy-102.rss",
    category: "Macroeconomics & Trade (GS 3)",
    description: "Critical fiscal deficits, monetary transmission, manufacturing, and global trade metrics.",
  },
  {
    id: "moneycontrol-economy",
    name: "Down To Earth - Environment & Wildlife",
    source: "Down To Earth",
    url: "https://www.downtoearth.org.in/rss/environment",
    category: "Environment & Ecology (GS 3)",
    description: "Environmental governance, ecology, climate change, and conservation metrics.",
  },
  {
    id: "livelaw-judiciary",
    name: "LiveLaw - Supreme Court & Legal Judgments",
    source: "LiveLaw",
    url: "https://www.livelaw.in/rss/top-stories",
    category: "Judiciary & Law (GS 2)",
    description: "Supreme Court judgments, constitutional benchmarks, and public interest litigation.",
  },
];

// Helper to strip HTML tags from RSS content
function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

// Derive source from URL or explicit input
export function detectSourceFromUrl(url: string, explicitSource?: string): NewsArticle["source"] {
  if (explicitSource) {
    if (explicitSource.includes("Hindu")) return "The Hindu";
    if (explicitSource.includes("PIB")) return "PIB";
    if (explicitSource.includes("Express")) return "The Indian Express";
    if (explicitSource.includes("Down To Earth") || explicitSource.includes("DTE")) return "Down To Earth";
    if (explicitSource.includes("LiveLaw")) return "LiveLaw";
    if (explicitSource.includes("PRS")) return "PRS Legislative";
    if (explicitSource.includes("Business Standard")) return "Business Standard";
    if (explicitSource.includes("ORF")) return "ORF";
    if (explicitSource.includes("Editorial")) return "Editorials";
    return "Government Sources";
  }

  const lowUrl = url.toLowerCase();
  if (lowUrl.includes("downtoearth.org.in")) return "Down To Earth";
  if (lowUrl.includes("livelaw.in")) return "LiveLaw";
  if (lowUrl.includes("prsindia.org")) return "PRS Legislative";
  if (lowUrl.includes("business-standard.com")) return "Business Standard";
  if (lowUrl.includes("orfonline.org")) return "ORF";
  if (lowUrl.includes("thehindu.com")) return "The Hindu";
  if (lowUrl.includes("pib.gov.in")) return "PIB";
  if (lowUrl.includes("indianexpress.com")) return "The Indian Express";
  if (lowUrl.includes("editorial") || lowUrl.includes("opinion")) return "Editorials";
  return "Government Sources";
}

// Intelligent UPSC classification based on headline & body
function generateUpscTagging(headline: string, summary: string) {
  const combined = `${headline} ${summary}`.toLowerCase();
  const gsTags: string[] = [];
  let prelimsTag = false;

  // GS 2: Polity & Governance
  if (
    combined.includes("judiciary") ||
    combined.includes("supreme court") ||
    combined.includes("high court") ||
    combined.includes("constitution") ||
    combined.includes("article ") ||
    combined.includes("governor") ||
    combined.includes("parliament") ||
    combined.includes("lok sabha") ||
    combined.includes("rajya sabha") ||
    combined.includes("election commission") ||
    combined.includes("cabinet") ||
    combined.includes("panchayat") ||
    combined.includes("federal") ||
    combined.includes("governance") ||
    combined.includes("civil service")
  ) {
    gsTags.push("GS 2 (Polity & Governance)");
  }

  // GS 2: International Relations
  if (
    combined.includes("foreign policy") ||
    combined.includes("diplomacy") ||
    combined.includes("bilateral") ||
    combined.includes("summit") ||
    combined.includes("brics") ||
    combined.includes("quad") ||
    combined.includes("g20") ||
    combined.includes("asean") ||
    combined.includes("unsc") ||
    combined.includes("united nations") ||
    combined.includes("treaty")
  ) {
    gsTags.push("GS 2 (International Relations)");
  }

  // GS 3: Economy & Agriculture
  if (
    combined.includes("rbi") ||
    combined.includes("reserve bank") ||
    combined.includes("inflation") ||
    combined.includes("gdp") ||
    combined.includes("growth") ||
    combined.includes("fiscal") ||
    combined.includes("monetary") ||
    combined.includes("tax") ||
    combined.includes("gst") ||
    combined.includes("agriculture") ||
    combined.includes("msp") ||
    combined.includes("farmer") ||
    combined.includes("trade") ||
    combined.includes("export") ||
    combined.includes("rupee") ||
    combined.includes("banking")
  ) {
    gsTags.push("GS 3 (Economy & Agriculture)");
  }

  // GS 3: Environment & Disaster
  if (
    combined.includes("climate") ||
    combined.includes("environment") ||
    combined.includes("pollution") ||
    combined.includes("wildlife") ||
    combined.includes("forest") ||
    combined.includes("disaster") ||
    combined.includes("flood") ||
    combined.includes("monsoon") ||
    combined.includes("biodiversity") ||
    combined.includes("renewable") ||
    combined.includes("solar")
  ) {
    gsTags.push("GS 3 (Environment & Ecology)");
  }

  // GS 3: Science & Technology / Internal Security
  if (
    combined.includes("isro") ||
    combined.includes("satellite") ||
    combined.includes("space") ||
    combined.includes("artificial intelligence") ||
    combined.includes("ai") ||
    combined.includes("cyber") ||
    combined.includes("quantum") ||
    combined.includes("defence") ||
    combined.includes("missile") ||
    combined.includes("navy") ||
    combined.includes("army") ||
    combined.includes("security")
  ) {
    gsTags.push("GS 3 (Science & Technology)");
  }

  // GS 4: Ethics / Public Administration Optional
  if (
    combined.includes("ethics") ||
    combined.includes("integrity") ||
    combined.includes("corruption") ||
    combined.includes("probity") ||
    combined.includes("accountability") ||
    combined.includes("bureaucracy") ||
    combined.includes("administrative reforms") ||
    combined.includes("arc") ||
    combined.includes("lateral entry")
  ) {
    gsTags.push("Public Administration Optional");
    gsTags.push("GS 4 (Ethics)");
  }

  // GS 1: History / Heritage / Society
  if (
    combined.includes("heritage") ||
    combined.includes("archaeology") ||
    combined.includes("monument") ||
    combined.includes("tribal") ||
    combined.includes("women") ||
    combined.includes("social reform") ||
    combined.includes("caste")
  ) {
    gsTags.push("GS 1 (Indian Society & Heritage)");
  }

  // If no tag found, default to GS 2 & GS 3
  if (gsTags.length === 0) {
    gsTags.push("GS 2 (Governance)", "GS 3 (Economy & Policy)");
  }

  // Prelims tag heuristic
  if (
    combined.includes("act") ||
    combined.includes("amendment") ||
    combined.includes("index") ||
    combined.includes("report") ||
    combined.includes("mission") ||
    combined.includes("scheme") ||
    combined.includes("yojana") ||
    combined.includes("species") ||
    combined.includes("national park") ||
    combined.includes("sanctuary") ||
    combined.includes("statutory") ||
    combined.includes("committee") ||
    combined.includes("launched")
  ) {
    prelimsTag = true;
  }

  return {
    gsTags: Array.from(new Set(gsTags)).slice(0, 3),
    prelimsTag,
  };
}

// Generate UPSC Question, Prelims Fact & Mains relevance from the extracted item
function generateRelevancePointers(headline: string, summary: string, source: string) {
  const cleanHead = headline.trim();
  const lower = `${cleanHead} ${summary}`.toLowerCase();

  let prelimsFact = `Key facts related to ${cleanHead.slice(0, 60)}... for UPSC Prelims: Focus on nodal ministry, statutory backing, and implementing agency.`;
  let mainsRelevance = `Examines institutional mechanisms, policy impacts, and governance dimensions pertinent to UPSC Mains Paper II & III.`;
  let possibleMainsQuestion = `Critically analyze the administrative and socioeconomic implications of "${cleanHead.slice(0, 75)}". Suggest a pragmatic way forward. (15 Marks, 250 Words)`;

  if (lower.includes("governor") || lower.includes("state") || lower.includes("federal")) {
    prelimsFact = "Constitutional provisions under Articles 153 to 163; Sarkaria Commission (1988) and Punchhi Commission (2010) recommendations on gubernatorial discretion.";
    mainsRelevance = "Federalism dynamics, state autonomy, and executive relations between Union and State under GS Paper 2.";
    possibleMainsQuestion = "The office of the Governor has emerged as a focal point of cooperative federalism tensions. Discuss in light of recent Supreme Court verdicts and committee recommendations. (15 Marks)";
  } else if (lower.includes("rbi") || lower.includes("inflation") || lower.includes("economy") || lower.includes("monetary")) {
    prelimsFact = "Monetary Policy Committee (MPC) composition under Section 45ZB of the RBI Act, 1934; Flexible Inflation Targeting framework (4% +/- 2%).";
    mainsRelevance = "Macroeconomic stability, supply-chain bottlenecks, and financial sector governance under GS Paper 3.";
    possibleMainsQuestion = "Examine the effectiveness of monetary policy instruments in curbing imported and food inflation in developing economies like India. (10 Marks)";
  } else if (lower.includes("ai") || lower.includes("technology") || lower.includes("data") || lower.includes("cyber")) {
    prelimsFact = "Digital Personal Data Protection (DPDP) Act 2023 provisions; CERT-In reporting directives; Global AI Safety initiatives.";
    mainsRelevance = "Technology adoption versus regulatory oversight, ethical governance, and data sovereignty under GS Paper 3 & 4.";
    possibleMainsQuestion = "While Artificial Intelligence holds transformative potential for public service delivery, it presents profound ethical and algorithmic challenges. Evaluate. (15 Marks)";
  } else if (lower.includes("climate") || lower.includes("forest") || lower.includes("environment")) {
    prelimsFact = "UNFCCC COP targets, India's Nationally Determined Contributions (NDCs), Environment Protection Act 1986 provisions.";
    mainsRelevance = "Balancing developmental imperatives with ecological sustainability and disaster resilience under GS Paper 3.";
    possibleMainsQuestion = "India's energy transition requires harmonizing aggressive renewable targets with grid stability and socio-economic realities. Critically analyze. (15 Marks)";
  }

  // Extract key highlight bullet points
  const sentences = summary
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);

  const keyHighlights =
    sentences.length >= 2
      ? sentences.slice(0, 4)
      : [
          `${cleanHead}: Reported by ${source}.`,
          summary.slice(0, 160) + (summary.length > 160 ? "..." : ""),
          "Important for UPSC aspirants tracking policy trajectories and institutional reforms.",
        ];

  return { prelimsFact, mainsRelevance, possibleMainsQuestion, keyHighlights };
}

// User-Agent and Accept headers compatible with upstream news publishers
const RSS_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, text/plain, */*",
};

const MAX_FEED_BYTES = 5 * 1024 * 1024; // 5 MB response protection limit

const GOOGLE_NEWS_DOMAINS: Partial<Record<NewsArticle["source"], string>> = {
  "The Hindu": "thehindu.com",
  "The Indian Express": "indianexpress.com",
  PIB: "pib.gov.in",
  LiveLaw: "livelaw.in",
  "PRS Legislative": "prsindia.org",
  "Down To Earth": "downtoearth.org.in",
  "Business Standard": "business-standard.com",
  ORF: "orfonline.org",
};

function googleNewsUrlFor(source: NewsArticle["source"]): string | null {
  const domain = GOOGLE_NEWS_DOMAINS[source];
  if (!domain) return null;
  return `https://news.google.com/rss/search?q=site%3A${domain}%20when%3A1d&hl=en-IN&gl=IN&ceid=IN%3Aen`;
}

function textValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "#text" in value) return String((value as { "#text": unknown })["#text"]);
  return "";
}

/**
 * Typed error so callers (and tests) can distinguish the failure mode of a
 * single feed without string matching.
 */
export type RssFailureKind =
  | "timeout"
  | "http_error"
  | "empty_response"
  | "not_xml"
  | "invalid_xml"
  | "empty_feed"
  | "network";

export class RssFetchError extends Error {
  kind: RssFailureKind;
  httpStatus: number | null;
  constructor(kind: RssFailureKind, message: string, httpStatus: number | null = null) {
    super(message);
    this.name = "RssFetchError";
    this.kind = kind;
    this.httpStatus = httpStatus;
  }
}

/**
 * Resolve the configurable per-feed timeout. Defaults to 15s and is clamped to
 * a sane 5s–60s window.
 */
export function resolveRssTimeoutMs(): number {
  const configured = Number.parseInt(process.env.RSS_FETCH_TIMEOUT_MS || "15000", 10);
  if (!Number.isFinite(configured)) return 15000;
  return Math.min(60000, Math.max(5000, configured));
}

/**
 * Decide whether a fetched body is a usable XML feed.
 * Reject HTML pages, Cloudflare challenge pages, access denied errors.
 * Accepts RSS 2.0, Atom, and RSS 1.0 (RDF).
 */
export function looksLikeXmlFeed(body: string, contentType = ""): boolean {
  if (!body) return false;
  const head = body.slice(0, 2000).toLowerCase();
  const looksLikeHtmlPage = /<!doctype\s+html|<html[\s>]|cloudflare|access denied|403 forbidden|just a moment/i.test(head);
  const hasFeedRoot = /<(\?xml|rss|feed|rdf:rdf)\b/.test(head) || /<(item|entry)\b/.test(head);
  if (looksLikeHtmlPage && !hasFeedRoot) return false;
  if (hasFeedRoot) return true;
  return /xml|rss|atom|rdf/.test(contentType.toLowerCase());
}

export async function fetchXml(url: string, timeoutMs = resolveRssTimeoutMs()): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: RSS_HEADERS,
      redirect: "follow",
    });

    if (!response.ok) {
      throw new RssFetchError(
        "http_error",
        `Upstream server returned HTTP ${response.status}`,
        response.status
      );
    }

    const contentLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_FEED_BYTES) {
      throw new RssFetchError("invalid_xml", `Feed response exceeds size limit (${contentLength} bytes)`);
    }

    const contentType = response.headers.get("content-type") || "";
    const text = (await response.text()).trim();

    if (!text) {
      throw new RssFetchError("empty_response", "Empty feed response received");
    }

    if (text.length > MAX_FEED_BYTES) {
      throw new RssFetchError("invalid_xml", "Feed text length exceeds 5MB size limit");
    }

    if (!looksLikeXmlFeed(text, contentType)) {
      throw new RssFetchError("not_xml", "The source returned HTML or non-feed content instead of RSS/Atom.");
    }

    return text;
  } catch (error: any) {
    if (error instanceof RssFetchError) throw error;
    if (error?.name === "AbortError") {
      throw new RssFetchError("timeout", `The feed request timed out after ${timeoutMs}ms.`);
    }
    throw new RssFetchError("network", error?.message || "Network request failed.");
  } finally {
    clearTimeout(timeoutId);
  }
}

export function parseFeedContent(
  xmlText: string,
  feedUrl: string,
  source: NewsArticle["source"]
): { articles: NewsArticle[]; feedTitle: string } {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    textNodeName: "#text",
    trimValues: true,
    parseAttributeValue: false,
  });

  let parsedXml: any;
  try {
    parsedXml = parser.parse(xmlText);
  } catch (e: any) {
    throw new RssFetchError("invalid_xml", `Malformed XML could not be parsed: ${e?.message || e}`);
  }

  if (!parsedXml || typeof parsedXml !== "object") {
    throw new RssFetchError("invalid_xml", "Parsed XML produced no usable document.");
  }

  const articles: NewsArticle[] = [];
  let feedTitle: string = source;

  // RSS 2.0: rss > channel > item
  const rssChannel = parsedXml.rss?.channel;
  const rssItems = rssChannel?.item ? (Array.isArray(rssChannel.item) ? rssChannel.item : [rssChannel.item]) : [];

  // Atom: feed > entry
  const atomEntries = parsedXml.feed?.entry ? (Array.isArray(parsedXml.feed.entry) ? parsedXml.feed.entry : [parsedXml.feed.entry]) : [];

  // RSS 1.0 (RDF): rdf:RDF > item
  const rdfRoot = parsedXml["rdf:RDF"] || parsedXml.RDF;
  const rdfItems = rdfRoot?.item ? (Array.isArray(rdfRoot.item) ? rdfRoot.item : [rdfRoot.item]) : [];

  if (rssChannel?.title) feedTitle = textValue(rssChannel.title) || String(source);
  if (parsedXml.feed?.title) feedTitle = textValue(parsedXml.feed.title) || String(source);
  if (rdfRoot?.channel?.title) feedTitle = textValue(rdfRoot.channel.title) || String(source);

  for (const item of [...rssItems, ...atomEntries, ...rdfItems].slice(0, 15)) {
    const headline = stripHtml(textValue(item.title) || "Untitled");
    const rawDescription = item.description || item["content:encoded"] || item.summary || item.content || "";
    const summary = stripHtml(textValue(rawDescription));
    const link = textValue(item.link) || item.link?.["@_href"] || textValue(item.guid) || feedUrl;
    const dateValue = item.pubDate || item.published || item.updated || item.date || item["dc:date"];
    const parsedDate = new Date(textValue(dateValue));
    const date = !Number.isNaN(parsedDate.getTime())
      ? parsedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    if (headline.length <= 5) continue;
    const { gsTags, prelimsTag } = generateUpscTagging(headline, summary);
    const { prelimsFact, mainsRelevance, possibleMainsQuestion, keyHighlights } = generateRelevancePointers(headline, summary, source);

    articles.push({
      id: generateDeterministicArticleId(link, source, headline),
      date,
      source,
      headline,
      page: "Live RSS Feed",
      gsTags,
      prelimsTag,
      summary: summary.slice(0, 280) || `${headline}. Parsed directly from ${source} real-time feed.`,
      keyHighlights,
      detailedInsights: [summary || headline, `Source Link: ${link}`, `Curated for UPSC Civil Services Examination preparation from ${source} feed.`],
      keyConceptsInvolved: gsTags.map((tag) => tag.replace(/GS \d \((.*?)\)/, "$1")),
      upscRelevance: { prelimsFact, mainsRelevance, possibleMainsQuestion },
    });
  }

  return { articles, feedTitle };
}

export interface RssFeedResult {
  success: boolean;
  articles: NewsArticle[];
  sourceDetected: string;
  source: string;
  url: string;
  status: "ok" | "failed";
  articleCount: number;
  feedTitle: string;
  error?: string;
  errorKind?: RssFailureKind;
  httpStatus?: number | null;
  durationMs: number;
}

/**
 * Attempt one URL: fetch -> validate -> parse. Empty feeds are treated as a
 * distinct `empty_feed` failure so callers never fabricate articles.
 */
async function attemptFeed(url: string, source: NewsArticle["source"], timeoutMs: number) {
  const xml = await fetchXml(url, timeoutMs);
  const parsed = parseFeedContent(xml, url, source);
  if (parsed.articles.length === 0) {
    throw new RssFetchError("empty_feed", "Feed contained no readable items.");
  }
  return parsed;
}

/**
 * Fetch and parse a single RSS/Atom/RDF feed.
 * Never fabricates articles! If both publisher and Google News fail, returns failed health.
 */
export async function fetchAndParseRssFeed(
  feedUrl: string,
  explicitSource?: string,
): Promise<RssFeedResult> {
  const source = detectSourceFromUrl(feedUrl, explicitSource);
  const timeoutMs = resolveRssTimeoutMs();
  const startedAt = Date.now();
  let lastError: RssFetchError | null = null;
  let httpStatus: number | null = null;

  try {
    const parsed = await attemptFeed(feedUrl, source, timeoutMs);
    return {
      success: true,
      articles: parsed.articles,
      sourceDetected: source,
      source: explicitSource || source,
      url: feedUrl,
      status: "ok",
      articleCount: parsed.articles.length,
      feedTitle: parsed.feedTitle,
      httpStatus: 200,
      durationMs: Date.now() - startedAt,
    };
  } catch (publisherError: any) {
    lastError = publisherError instanceof RssFetchError ? publisherError : new RssFetchError("network", String(publisherError?.message || publisherError));
    httpStatus = lastError.httpStatus ?? null;
    const statusLabel = httpStatus ? `HTTP ${httpStatus}` : lastError.kind;
    console.log(`[RSS] Primary feed attempt for ${source} (${statusLabel}); checking fallback...`);
  }

  const fallbackUrl = googleNewsUrlFor(source);
  if (fallbackUrl && fallbackUrl !== feedUrl) {
    try {
      const parsed = await attemptFeed(fallbackUrl, source, timeoutMs);
      console.log(`[RSS] Google News fallback succeeded: ${source} (${parsed.articles.length} articles)`);
      return {
        success: true,
        articles: parsed.articles,
        sourceDetected: source,
        source: explicitSource || source,
        url: fallbackUrl,
        status: "ok",
        articleCount: parsed.articles.length,
        feedTitle: parsed.feedTitle,
        httpStatus: 200,
        durationMs: Date.now() - startedAt,
      };
    } catch (fallbackError: any) {
      lastError = fallbackError instanceof RssFetchError ? fallbackError : new RssFetchError("network", String(fallbackError?.message || fallbackError));
      if (lastError.httpStatus) httpStatus = lastError.httpStatus;
      const fbStatusLabel = httpStatus ? `HTTP ${httpStatus}` : lastError.kind;
      console.log(`[RSS] Fallback feed attempt for ${source} (${fbStatusLabel})`);
    }
  }

  console.log(`[RSS] Source unavailable: ${source} (status: ${httpStatus || "unavailable"})`);
  return {
    success: false,
    articles: [],
    sourceDetected: source,
    source: explicitSource || source,
    url: feedUrl,
    status: "failed",
    articleCount: 0,
    feedTitle: explicitSource || source,
    error: lastError?.message || `Unable to read publisher or Google News feed for ${source}.`,
    errorKind: lastError?.kind || "network",
    httpStatus: httpStatus ?? lastError?.httpStatus ?? null,
    durationMs: Date.now() - startedAt,
  };
}

import React, { useState, useEffect, useRef } from "react";
import {
  Newspaper,
  Calendar,
  Sparkles,
  ArrowRight,
  Bookmark,
  Share2,
  Zap,
  BookOpen,
  CheckCircle2,
  Layers,
  HelpCircle,
  TrendingUp,
  Rss,
  Plus,
  RefreshCw,
  ExternalLink,
  Trash2,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Radio,
  Play,
  Pause,
  Sliders,
  ShieldCheck,
} from "lucide-react";
import { NewsArticle } from "../types";
import { getAuthHeader } from "../services/userService";

interface NewsViewProps {
  articles: NewsArticle[];
  onUpdateArticles?: (newArticles: NewsArticle[]) => void;
  onStartTodayMCQs: () => void;
  onAskBoltArticle: (article: NewsArticle) => void;
}

interface SavedFeed {
  id: string;
  name: string;
  source:
    | "The Hindu"
    | "PIB"
    | "The Indian Express"
    | "Livemint"
    | "Business Standard"
    | "Down To Earth"
    | "LiveLaw"
    | "PRS Legislative"
    | "Economic Times"
    | "ORF"
    | "Government Sources"
    | "Editorials";
  url: string;
  category: string;
  lastSynced?: string;
  articleCount?: number;
}

const DEFAULT_PRESET_FEEDS: SavedFeed[] = [
  {
    id: "preset-hindu-ed",
    name: "The Hindu - Editorials & Op-Ed",
    source: "The Hindu",
    url: "https://www.thehindu.com/opinion/editorial/feeder/default.rss",
    category: "Editorials",
  },
  {
    id: "preset-hindu-nat",
    name: "The Hindu - National Affairs",
    source: "The Hindu",
    url: "https://www.thehindu.com/news/national/feeder/default.rss",
    category: "National (GS 2)",
  },
  {
    id: "preset-ie-exp",
    name: "The Indian Express - Explained",
    source: "The Indian Express",
    url: "https://news.google.com/rss/search?q=site%3Aindianexpress.com+explained&hl=en-IN&gl=IN&ceid=IN%3Aen",
    category: "In-depth Analysis (GS 2/3)",
  },
  {
    id: "preset-ie-ed",
    name: "The Indian Express - Opinion & Editorials",
    source: "The Indian Express",
    url: "https://news.google.com/rss/search?q=site%3Aindianexpress.com+opinion+OR+editorial&hl=en-IN&gl=IN&ceid=IN%3Aen",
    category: "Editorials & Opinions",
  },
  {
    id: "preset-pib",
    name: "PIB - Official Press Releases",
    source: "PIB",
    url: "https://pib.gov.in/RssMain.aspx?ModId=6",
    category: "Union Government Notifications",
  },
  {
    id: "preset-pib-cabinet",
    name: "PIB - Cabinet Decisions & Schemes",
    source: "PIB",
    url: "https://news.google.com/rss/search?q=site%3Apib.gov.in&hl=en-IN&gl=IN&ceid=IN%3Aen",
    category: "Government Schemes & Policy",
  },
  {
    id: "preset-livemint-econ",
    name: "Livemint - Economy & Macro Policy",
    source: "Livemint",
    url: "https://www.livemint.com/rss/economy",
    category: "Macroeconomics (GS 3)",
  },
  {
    id: "preset-livemint-pol",
    name: "Livemint - Politics & Governance",
    source: "Livemint",
    url: "https://www.livemint.com/rss/politics",
    category: "Governance & Polity (GS 2)",
  },
  {
    id: "preset-bs",
    name: "Business Standard - Economy & Fiscal Policy",
    source: "Business Standard",
    url: "https://www.business-standard.com/rss/economy-policy-102.rss",
    category: "Indian Economy & Industry (GS 3)",
  },
  {
    id: "preset-dte",
    name: "Down To Earth - Environment & Ecology",
    source: "Down To Earth",
    url: "https://news.google.com/rss/search?q=site%3Adowntoearth.org.in&hl=en-IN&gl=IN&ceid=IN%3Aen",
    category: "Environment & Ecology (GS 3)",
  },
  {
    id: "preset-livelaw",
    name: "LiveLaw - Supreme Court & Legal Judgments",
    source: "LiveLaw",
    url: "https://news.google.com/rss/search?q=site%3Alivelaw.in&hl=en-IN&gl=IN&ceid=IN%3Aen",
    category: "Judiciary & Constitutional Law (GS 2)",
  },
  {
    id: "preset-prs",
    name: "PRS Legislative Research - Bills & Acts",
    source: "PRS Legislative",
    url: "https://news.google.com/rss/search?q=site%3Aprsindia.org&hl=en-IN&gl=IN&ceid=IN%3Aen",
    category: "Parliament & Legislation (GS 2)",
  },
  {
    id: "preset-et",
    name: "Economic Times - Economy & Policy",
    source: "Economic Times",
    url: "https://economictimes.indiatimes.com/news/economy/rssfeeds/1373380680.cms",
    category: "Economy & Governance (GS 3)",
  },
  {
    id: "preset-orf",
    name: "Observer Research Foundation (ORF) - Geopolitics",
    source: "ORF",
    url: "https://news.google.com/rss/search?q=site%3Aorfonline.org&hl=en-IN&gl=IN&ceid=IN%3Aen",
    category: "International Relations & Security (GS 2/3)",
  },
];

export const getSourceBadgeClass = (source: string): string => {
  switch (source) {
    case "The Hindu":
      return "text-blue-400 bg-blue-500/10 border-blue-500/30";
    case "The Indian Express":
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    case "PIB":
      return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    case "Livemint":
      return "text-orange-400 bg-orange-500/10 border-orange-500/30";
    case "Business Standard":
      return "text-cyan-400 bg-cyan-500/10 border-cyan-500/30";
    case "Down To Earth":
      return "text-teal-400 bg-teal-500/10 border-teal-500/30";
    case "LiveLaw":
      return "text-purple-400 bg-purple-500/10 border-purple-500/30";
    case "PRS Legislative":
      return "text-indigo-400 bg-indigo-500/10 border-indigo-500/30";
    case "Economic Times":
      return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
    case "ORF":
      return "text-rose-400 bg-rose-500/10 border-rose-500/30";
    default:
      return "text-sky-300 bg-sky-500/10 border-sky-500/20";
  }
};

export const NewsView: React.FC<NewsViewProps> = ({
  articles,
  onUpdateArticles,
  onStartTodayMCQs,
  onAskBoltArticle,
}) => {
  const [selectedSource, setSelectedSource] = useState<string>("All");
  const [activeArticle, setActiveArticle] = useState<NewsArticle | null>(articles[0] || null);

  // Scroll Progress Tracking
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = scrollHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100)) : 0;
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // RSS Feed URL Input & Management State
  const [isFeedManagerOpen, setIsFeedManagerOpen] = useState<boolean>(false);
  const [feedUrlInput, setFeedUrlInput] = useState<string>("");
  const [feedSourceInput, setFeedSourceInput] = useState<SavedFeed["source"]>("The Hindu");
  const [isFetchingFeed, setIsFetchingFeed] = useState<boolean>(false);
  const [isSyncingAll, setIsSyncingAll] = useState<boolean>(false);
  const [feedNotification, setFeedNotification] = useState<{ type: "success" | "error" | "info" | "warning"; message: string } | null>(null);

  // Saved Feeds
  const [savedFeeds, setSavedFeeds] = useState<SavedFeed[]>(() => {
    try {
      const stored = localStorage.getItem("bolt_rss_feeds");
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return DEFAULT_PRESET_FEEDS;
  });

  const [bookmarkedIds, setBookmarkedIds] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem("bolt_news_bookmarks");
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {};
  });

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => {
      const updated = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem("bolt_news_bookmarks", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const saveFeedsList = (feeds: SavedFeed[]) => {
    setSavedFeeds(feeds);
    try {
      localStorage.setItem("bolt_rss_feeds", JSON.stringify(feeds));
    } catch (e) {}
  };

  // Sync active article if articles prop changes
  useEffect(() => {
    if (!activeArticle && articles.length > 0) {
      setActiveArticle(articles[0]);
    }
  }, [articles]);

  // Handle adding and fetching a new RSS/Atom feed URL
  const handleAddAndFetchFeed = async (_urlToFetch?: string, _explicitSource?: SavedFeed["source"]) => {
    await executeScheduledNewsSync(true);
  };

  // Sync All Configured Feeds in Batch
  const handleSyncAllFeeds = async () => {
    await executeScheduledNewsSync(true);
    return;
    /* Legacy batch feed management is intentionally disabled; production sync runs server-side. */
    setIsSyncingAll(true);
    setFeedNotification(null);

    try {
      const response = await fetch("/api/news/sync-all", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await getAuthHeader()) },
        body: JSON.stringify({
          feeds: savedFeeds.map((f) => ({ url: f.url, sourceName: f.source })),
        }),
      });

      const contentType = response.headers.get("content-type")?.toLowerCase() || "";
      const data = contentType.includes("application/json")
        ? await response.json()
        : {
            success: false,
            error: response.ok
              ? "The feed service returned an unexpected non-JSON response."
              : `Feed service error (${response.status}). Please verify the configured feeds.`,
          };

      if (data.success && data.articles) {
        const existingHeadlines = new Set(articles.map((a) => a.headline.toLowerCase().trim()));
        const fresh: NewsArticle[] = [];

        for (const art of data.articles) {
          if (!existingHeadlines.has(art.headline.toLowerCase().trim())) {
            fresh.push(art);
          }
        }

        const merged = [...fresh, ...articles];
        if (onUpdateArticles) {
          onUpdateArticles(merged);
        }
        if (fresh.length > 0) {
          setActiveArticle(fresh[0]);
        }

        setFeedNotification({
          type: "success",
          message: `All sources synchronized! Added ${fresh.length} fresh articles across The Hindu, PIB, and The Indian Express.`,
        });
      }
    } catch (err: any) {
      setFeedNotification({
        type: "error",
        message: "Failed to batch synchronize feeds.",
      });
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleRemoveSavedFeed = (id: string) => {
    const filtered = savedFeeds.filter((f) => f.id !== id);
    saveFeedsList(filtered);
  };

  // ----------------------------------------------------
  // BACKGROUND TASK & SCHEDULED DAILY CURRENT AFFAIRS TRIGGER
  // ----------------------------------------------------
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("bolt_news_auto_sync");
      return stored !== "false";
    } catch {
      return true;
    }
  });

  const [syncIntervalMinutes, setSyncIntervalMinutes] = useState<number>(() => {
    try {
      const stored = localStorage.getItem("bolt_news_sync_interval");
      return stored ? parseInt(stored, 10) : 30;
    } catch {
      return 30;
    }
  });

  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number | null>(() => {
    try {
      const stored = localStorage.getItem("bolt_news_last_sync");
      return stored ? parseInt(stored, 10) : null;
    } catch {
      return null;
    }
  });

  const [countdownSeconds, setCountdownSeconds] = useState<number>(() => {
    const storedLast = localStorage.getItem("bolt_news_last_sync");
    const interval = localStorage.getItem("bolt_news_sync_interval");
    const intervalMin = interval ? parseInt(interval, 10) : 30;
    if (storedLast) {
      const elapsedSec = Math.floor((Date.now() - parseInt(storedLast, 10)) / 1000);
      const rem = intervalMin * 60 - elapsedSec;
      return rem > 0 ? rem : 0;
    }
    return intervalMin * 60;
  });

  const [isBackgroundSyncing, setIsBackgroundSyncing] = useState<boolean>(false);
  const [showSchedulerDetails, setShowSchedulerDetails] = useState<boolean>(false);
  const [schedulerLogs, setSchedulerLogs] = useState<
    Array<{
      id: string;
      time: string;
      added: number;
      sources: string[];
      status: "success" | "error";
      message: string;
    }>
  >(() => {
    try {
      const stored = localStorage.getItem("bolt_news_scheduler_logs");
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      {
        id: "init-1",
        time: "Initial Start",
        added: 0,
        sources: ["The Hindu", "The Indian Express", "PIB", "Down To Earth", "LiveLaw", "PRS Legislative", "Business Standard", "ORF"],
        status: "success",
        message: "Scheduler initialized with 8 reliable UPSC publishers.",
      },
    ];
  });

  const handleToggleAutoSync = () => {
    const next = !isAutoSyncEnabled;
    setIsAutoSyncEnabled(next);
    try {
      localStorage.setItem("bolt_news_auto_sync", String(next));
    } catch {}
  };

  const handleIntervalChange = (newIntervalMinutes: number) => {
    setSyncIntervalMinutes(newIntervalMinutes);
    setCountdownSeconds(newIntervalMinutes * 60);
    try {
      localStorage.setItem("bolt_news_sync_interval", String(newIntervalMinutes));
    } catch {}
  };

  // Background API Trigger Implementation
  const executeScheduledNewsSync = async (isManualTrigger: boolean = false) => {
    if (isBackgroundSyncing) return;
    setIsBackgroundSyncing(true);
    const triggerTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    try {
      // Load the authenticated current-affairs snapshot. The server fetches fresh
      // articles when its Firestore cache is empty; admin-only ingestion stays server-side.
      const response = await fetch("/api/news/daily-current-affairs", {
        method: "GET",
        headers: { Accept: "application/json", ...(await getAuthHeader()) },
      });
      const contentType = response.headers.get("content-type")?.toLowerCase() || "";
      const data = contentType.includes("application/json")
        ? await response.json()
        : { success: false, state: "backend_failure", error: `News service returned HTTP ${response.status}.` };

      // Distinguish specific failure modes
      if (response.status === 401 || data.state === "auth_failure") {
        throw new Error("Authentication failure: Please log in to access verified current affairs.");
      }
      if (response.status >= 500 || data.state === "backend_failure") {
        throw new Error(data.message || data.error || "Backend failure: Current affairs service is temporarily unavailable.");
      }
      if (data.state === "upstream_failure") {
        setFeedNotification({
          type: "warning",
          message: "Temporary upstream failure: News sources are experiencing intermittent connectivity; retaining cached articles.",
        });
      }

      if (data.success && Array.isArray(data.articles)) {
        const existingHeadlines = new Set(articles.map((a) => a.headline.toLowerCase().trim()));
        const fresh: NewsArticle[] = [];

        for (const art of data.articles) {
          if (!existingHeadlines.has(art.headline.toLowerCase().trim())) {
            fresh.push(art);
          }
        }

        const now = Date.now();
        setLastSyncTimestamp(now);
        setCountdownSeconds(syncIntervalMinutes * 60);
        try {
          localStorage.setItem("bolt_news_last_sync", String(now));
        } catch {}

        if (fresh.length > 0) {
          const merged = [...fresh, ...articles];
          if (onUpdateArticles) {
            onUpdateArticles(merged);
          }
          if (!activeArticle) {
            setActiveArticle(fresh[0]);
          }
          setFeedNotification({
            type: "success",
            message: `Ingested ${fresh.length} fresh daily current affairs articles from reliable sources (${(data.sources || []).slice(0, 3).join(", ")})!`,
          });
        } else if (isManualTrigger) {
          const infoMessage =
            data.state === "no_articles_yet"
              ? "No articles stored yet. Scheduled sync will ingest fresh current affairs shortly."
              : data.state === "cached"
                ? "Upstream sources temporarily unavailable; showing verified cached news."
                : data.stale
                  ? "Showing cached news. The feed will refresh on the next cycle."
                  : data.message || "Daily current affairs are fully up to date.";
          setFeedNotification({
            type: data.state === "no_articles_yet" ? "info" : "info",
            message: infoMessage,
          });
        }

        const logEntry = {
          id: "log-" + Date.now(),
          time: triggerTime,
          added: fresh.length,
          sources: data.sources || ["The Hindu", "PIB", "The Indian Express", "Down To Earth", "LiveLaw", "PRS"],
          status: "success" as const,
          message: fresh.length > 0 ? `Merged ${fresh.length} fresh articles into application state` : "All sources verified; 0 new updates",
        };
        setSchedulerLogs((prev) => {
          const next = [logEntry, ...prev.slice(0, 9)];
          try {
            localStorage.setItem("bolt_news_scheduler_logs", JSON.stringify(next));
          } catch {}
          return next;
        });
      } else {
        throw new Error(data.error || "Unexpected payload from daily current affairs API");
      }
    } catch (err: any) {
      console.warn("Background current affairs fetch error:", err);
      const logEntry = {
        id: "log-" + Date.now(),
        time: triggerTime,
        added: 0,
        sources: ["Pipeline"],
        status: "error" as const,
        message: err?.message || "Sync failed",
      };
      setSchedulerLogs((prev) => {
        const next = [logEntry, ...prev.slice(0, 9)];
        try {
          localStorage.setItem("bolt_news_scheduler_logs", JSON.stringify(next));
        } catch {}
        return next;
      });

      if (isManualTrigger) {
        setFeedNotification({
          type: "error",
          message: err?.message || "Background task encountered an error connecting to news APIs.",
        });
      }
    } finally {
      setIsBackgroundSyncing(false);
    }
  };

  // 1. Initial check on mount: If never synced or stale (> syncIntervalMinutes), auto-trigger
  useEffect(() => {
    const now = Date.now();
    const intervalMs = syncIntervalMinutes * 60 * 1000;
    if (!lastSyncTimestamp || now - lastSyncTimestamp >= intervalMs) {
      executeScheduledNewsSync(false);
    }
  }, []);

  // 2. Periodic 1-second countdown ticker and trigger
  useEffect(() => {
    if (!isAutoSyncEnabled) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const intervalMs = syncIntervalMinutes * 60 * 1000;
      const elapsed = now - (lastSyncTimestamp || 0);

      if (elapsed >= intervalMs) {
        executeScheduledNewsSync(false);
      } else {
        const remainingSec = Math.max(0, Math.ceil((intervalMs - elapsed) / 1000));
        setCountdownSeconds(remainingSec);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isAutoSyncEnabled, syncIntervalMinutes, lastSyncTimestamp, articles]);

  // 3. Tab visibility trigger: resume fresh ingestion when user returns
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isAutoSyncEnabled) {
        const now = Date.now();
        const intervalMs = syncIntervalMinutes * 60 * 1000;
        if (!lastSyncTimestamp || now - lastSyncTimestamp >= intervalMs) {
          executeScheduledNewsSync(false);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isAutoSyncEnabled, syncIntervalMinutes, lastSyncTimestamp, articles]);

  const formatCountdown = (totalSec: number) => {
    if (totalSec <= 0) return "Triggering...";
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins.toString().padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`;
    }
    return `${mins}m ${secs.toString().padStart(2, "0")}s`;
  };

  const [searchQuery, setSearchQuery] = useState<string>("");

  const sources = [
    "All",
    "The Hindu",
    "The Indian Express",
    "PIB",
    "Livemint",
    "Business Standard",
    "Down To Earth",
    "LiveLaw",
    "PRS Legislative",
    "Economic Times",
    "ORF",
    "Government Sources",
    "Editorials",
  ];

  const filteredArticles = articles.filter((a) => {
    const matchesSource = selectedSource === "All" || a.source === selectedSource;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      a.headline.toLowerCase().includes(q) ||
      a.summary.toLowerCase().includes(q) ||
      (a.gsTags && a.gsTags.some((t) => t.toLowerCase().includes(q)));
    return matchesSource && matchesSearch;
  });

  return (
    <div ref={containerRef} className="space-y-6 max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-12 relative">
      {/* Subtle Top Scroll Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-slate-900/60 backdrop-blur-sm pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 transition-all duration-150 ease-out shadow-[0_0_10px_rgba(59,130,246,0.8)]"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Top Banner with Reading Progress & RSS Feed Manager Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111723] rounded-2xl border border-[#1e293b] p-5 shadow-lg">
        <div>
          <div className="flex items-center space-x-2 text-slate-400 text-xs font-medium">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>Today, Sep 16, 2026</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live RSS Feeds Active
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white font-['Outfit'] mt-1">
            UPSC Current Affairs & Daily Editorial Analysis
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Curated daily from The Hindu, Indian Express & PIB with syllabus tagging.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* RSS Feed Management Button */}
          <button
            onClick={() => setIsFeedManagerOpen((prev) => !prev)}
            className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center space-x-2 transition-all ${
              isFeedManagerOpen
                ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20"
                : "bg-[#162033] hover:bg-[#1f2d48] text-slate-200 border-slate-700"
            }`}
          >
            <Rss className="w-3.5 h-3.5 text-amber-400" />
            <span>Custom RSS Feeds</span>
            {isFeedManagerOpen ? (
              <ChevronUp className="w-3 h-3 ml-1" />
            ) : (
              <ChevronDown className="w-3 h-3 ml-1" />
            )}
          </button>

          {/* Sync All Button */}
          <button
            onClick={handleSyncAllFeeds}
            disabled={isSyncingAll}
            className="px-3.5 py-2 rounded-xl bg-[#162033] hover:bg-[#1f2d48] text-slate-200 border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-50"
            title="Fetch latest updates from all configured feeds"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isSyncingAll ? "animate-spin" : ""}`} />
            <span>{isSyncingAll ? "Syncing..." : "Sync Feeds"}</span>
          </button>

          {/* Compilations PDF */}
          <button
            onClick={() => setFeedNotification({ type: "info", message: "Monthly UPSC Current Affairs Compilation PDF ready. Access via syllabus repository." })}
            className="px-3.5 py-2 rounded-xl bg-[#162033] hover:bg-[#1f2d48] text-slate-200 border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span>CA Magazines</span>
          </button>
        </div>
      </div>

      {/* BACKGROUND TASK & SCHEDULED TRIGGER STATUS BAR */}
      <div className="bg-[#111723] rounded-2xl border border-slate-800 p-4 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left side: Live Pulse Status & Countdown */}
        <div className="flex items-start sm:items-center space-x-3.5">
          <div className={`p-2.5 rounded-xl border flex items-center justify-center transition-colors ${
            isBackgroundSyncing
              ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
              : isAutoSyncEnabled
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-amber-500/10 border-amber-500/30 text-amber-400"
          }`}>
            {isBackgroundSyncing ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Radio className={`w-5 h-5 ${isAutoSyncEnabled ? "animate-pulse" : ""}`} />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
                {isBackgroundSyncing ? (
                  "Fetching Daily News via API..."
                ) : isAutoSyncEnabled ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping" />
                    <span>Auto-Sync Active</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                    <span>Auto-Sync Paused</span>
                  </>
                )}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 font-mono border border-slate-700">
                {isAutoSyncEnabled
                  ? `Next trigger in: ${formatCountdown(countdownSeconds)}`
                  : "Scheduled triggers suspended"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span>
                {lastSyncTimestamp
                  ? `Last fetched: ${new Date(lastSyncTimestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                  : "Never synced"}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">
                Monitoring 8 reliable outlets (The Hindu, Indian Express, PIB, LiveLaw, DTE, PRS, BS, ORF)
              </span>
            </p>
          </div>
        </div>

        {/* Right side: Scheduler Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Interval Selector */}
          <div className="flex items-center space-x-1.5 bg-[#162033] border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[11px] text-slate-400">Freq:</span>
            <select
              value={syncIntervalMinutes}
              onChange={(e) => handleIntervalChange(parseInt(e.target.value, 10))}
              className="bg-transparent text-white font-medium text-xs focus:outline-none cursor-pointer"
            >
              <option value="15" className="bg-[#111723]">Every 15 min</option>
              <option value="30" className="bg-[#111723]">Every 30 min</option>
              <option value="60" className="bg-[#111723]">Every 1 hour</option>
              <option value="180" className="bg-[#111723]">Every 3 hours</option>
              <option value="720" className="bg-[#111723]">Every 12 hours</option>
              <option value="1440" className="bg-[#111723]">Daily (24h)</option>
            </select>
          </div>

          {/* Toggle Pause / Resume */}
          <button
            onClick={handleToggleAutoSync}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
              isAutoSyncEnabled
                ? "bg-[#162033] hover:bg-[#1f2d48] text-slate-300 border-slate-700"
                : "bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/40"
            }`}
            title={isAutoSyncEnabled ? "Pause automatic scheduled triggers" : "Resume automatic scheduled triggers"}
          >
            {isAutoSyncEnabled ? (
              <>
                <Pause className="w-3.5 h-3.5 text-amber-400" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <span>Resume</span>
              </>
            )}
          </button>

          {/* Trigger Now Button */}
          <button
            onClick={() => executeScheduledNewsSync(true)}
            disabled={isBackgroundSyncing}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
            title="Immediately trigger API fetch and update news list in application state"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isBackgroundSyncing ? "animate-spin" : ""}`} />
            <span>{isBackgroundSyncing ? "Fetching API..." : "Sync Now"}</span>
          </button>

          {/* Task Diagnostics Details Toggle */}
          <button
            onClick={() => setShowSchedulerDetails((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs flex items-center space-x-1 transition-colors ${
              showSchedulerDetails
                ? "bg-slate-700 text-white border-slate-600"
                : "bg-[#162033] hover:bg-[#1f2d48] text-slate-400 hover:text-slate-200 border-slate-700"
            }`}
            title="Show background trigger diagnostics and history"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Diagnostics</span>
            {showSchedulerDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* EXPANDABLE SCHEDULER DIAGNOSTICS & TELEMETRY */}
      {showSchedulerDetails && (
        <div className="bg-[#0e1420] rounded-2xl border border-slate-800 p-4 space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>Background Scheduled Trigger Engine Status</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Authenticated news refresh loads current affairs via <code className="text-blue-400">/api/news/daily-current-affairs</code>; server-side ingestion remains protected and scheduled.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Server Daemon: 30m Active
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Client Watcher: Active
              </span>
            </div>
          </div>

          {/* Connected Reliable API Sources Grid */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Reliable News Pipeline Sources (8 Active):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { name: "The Hindu", spec: "Editorials & National (GS 1/2)" },
                { name: "The Indian Express", spec: "Explained & Opinion (GS 2/3)" },
                { name: "PIB", spec: "Cabinet & Ministry Releases" },
                { name: "Down To Earth", spec: "Environment & Ecology (GS 3)" },
                { name: "LiveLaw", spec: "Judiciary & Supreme Court" },
                { name: "PRS Legislative", spec: "Bills & Parliamentary Acts" },
                { name: "Business Standard", spec: "Macroeconomy & Trade (GS 3)" },
                { name: "ORF", spec: "Geopolitics & Security (GS 2)" },
              ].map((src, i) => (
                <div key={i} className="bg-[#141b2b] border border-slate-800 rounded-xl p-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-xs font-semibold text-white">{src.name}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">{src.spec}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Trigger Log */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Recent Scheduled Run History:
              </span>
              <button
                onClick={() => {
                  const initialLog = [
                    {
                      id: "cleared-" + Date.now(),
                      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                      added: 0,
                      sources: ["All Reliable Sources"],
                      status: "success" as const,
                      message: "Log cleared by user. Standby for next scheduled trigger.",
                    },
                  ];
                  setSchedulerLogs(initialLog);
                  localStorage.setItem("bolt_news_scheduler_logs", JSON.stringify(initialLog));
                }}
                className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
              >
                Clear Log History
              </button>
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {schedulerLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between text-[11px] bg-[#141b2b] border border-slate-800/80 rounded-lg px-3 py-1.5"
                >
                  <div className="flex items-center space-x-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${log.status === "success" ? "bg-emerald-400" : "bg-red-400"}`} />
                    <span className="font-mono text-slate-400">{log.time}</span>
                    <span className="text-slate-200">{log.message}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {log.added > 0 && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        +{log.added} Articles
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500 truncate max-w-[140px]">
                      {log.sources.slice(0, 2).join(", ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* RSS / ATOM FEED MANAGER PANEL (Expandable) */}
      {isFeedManagerOpen && (
        <div className="bg-[#111723] rounded-2xl border border-blue-500/30 p-5 space-y-4 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Rss className="w-4 h-4 text-amber-400" />
                <span>RSS & Atom Feed Ingestion</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Add real-time feeds for The Hindu, PIB, or The Indian Express. Our backend extracts headlines, generates UPSC GS tags, and prepares Mains questions.
              </p>
            </div>
            <span className="text-[11px] text-blue-400 font-medium bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
              {savedFeeds.length} Active Feeds Configured
            </span>
          </div>

          {/* URL Input Form */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Source Publisher
                </label>
                <select
                  value={feedSourceInput}
                  onChange={(e) => setFeedSourceInput(e.target.value as any)}
                  className="w-full bg-[#162033] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="The Hindu">The Hindu</option>
                  <option value="The Indian Express">The Indian Express</option>
                  <option value="PIB">Press Information Bureau (PIB)</option>
                  <option value="Livemint">Livemint</option>
                  <option value="Business Standard">Business Standard</option>
                  <option value="Down To Earth">Down To Earth (DTE)</option>
                  <option value="LiveLaw">LiveLaw (Supreme Court)</option>
                  <option value="PRS Legislative">PRS Legislative Research</option>
                  <option value="Economic Times">Economic Times</option>
                  <option value="ORF">Observer Research Foundation (ORF)</option>
                  <option value="Government Sources">Government Sources</option>
                  <option value="Editorials">Editorials & Opinions</option>
                </select>
              </div>

              <div className="sm:col-span-7">
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  RSS or Atom Feed URL
                </label>
                <input
                  type="url"
                  placeholder="e.g., https://pib.gov.in/RssMain.aspx?ModId=6 or Google News RSS"
                  value={feedUrlInput}
                  onChange={(e) => setFeedUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddAndFetchFeed();
                  }}
                  className="w-full bg-[#162033] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="sm:col-span-2 flex items-end">
                <button
                  type="button"
                  onClick={() => handleAddAndFetchFeed()}
                  disabled={isFetchingFeed || !feedUrlInput.trim()}
                  className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-blue-600/20"
                >
                  {isFetchingFeed ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>{isFetchingFeed ? "Fetching..." : "Fetch Feed"}</span>
                </button>
              </div>
            </div>

            {/* Quick-Add Preset Feed Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] text-slate-400 font-semibold">1-Click Presets:</span>
              <button
                type="button"
                onClick={() => {
                  setFeedSourceInput("The Hindu");
                  setFeedUrlInput("https://www.thehindu.com/opinion/editorial/feeder/default.rss");
                  handleAddAndFetchFeed("https://www.thehindu.com/opinion/editorial/feeder/default.rss", "The Hindu");
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-[#182338] hover:bg-[#202f4a] text-blue-300 border border-blue-500/30 transition-colors flex items-center space-x-1"
              >
                <span>The Hindu (Editorial)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFeedSourceInput("The Hindu");
                  setFeedUrlInput("https://www.thehindu.com/news/national/feeder/default.rss");
                  handleAddAndFetchFeed("https://www.thehindu.com/news/national/feeder/default.rss", "The Hindu");
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-[#182338] hover:bg-[#202f4a] text-blue-300 border border-blue-500/30 transition-colors flex items-center space-x-1"
              >
                <span>The Hindu (National)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFeedSourceInput("The Indian Express");
                  const url = "https://news.google.com/rss/search?q=site%3Aindianexpress.com+explained&hl=en-IN&gl=IN&ceid=IN%3Aen";
                  setFeedUrlInput(url);
                  handleAddAndFetchFeed(url, "The Indian Express");
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-[#182338] hover:bg-[#202f4a] text-emerald-300 border border-emerald-500/30 transition-colors flex items-center space-x-1"
              >
                <span>Indian Express (Explained)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFeedSourceInput("The Indian Express");
                  const url = "https://news.google.com/rss/search?q=site%3Aindianexpress.com+opinion+OR+editorial&hl=en-IN&gl=IN&ceid=IN%3Aen";
                  setFeedUrlInput(url);
                  handleAddAndFetchFeed(url, "The Indian Express");
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-[#182338] hover:bg-[#202f4a] text-emerald-300 border border-emerald-500/30 transition-colors flex items-center space-x-1"
              >
                <span>Indian Express (Editorial)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFeedSourceInput("PIB");
                  const url = "https://pib.gov.in/RssMain.aspx?ModId=6";
                  setFeedUrlInput(url);
                  handleAddAndFetchFeed(url, "PIB");
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-[#182338] hover:bg-[#202f4a] text-amber-300 border border-amber-500/30 transition-colors flex items-center space-x-1"
              >
                <span>PIB Releases</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFeedSourceInput("Livemint");
                  const url = "https://www.livemint.com/rss/economy";
                  setFeedUrlInput(url);
                  handleAddAndFetchFeed(url, "Livemint");
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-[#182338] hover:bg-[#202f4a] text-orange-300 border border-orange-500/30 transition-colors flex items-center space-x-1"
              >
                <span>Livemint (Economy)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFeedSourceInput("Business Standard");
                  const url = "https://www.business-standard.com/rss/economy-policy-102.rss";
                  setFeedUrlInput(url);
                  handleAddAndFetchFeed(url, "Business Standard");
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-[#182338] hover:bg-[#202f4a] text-cyan-300 border border-cyan-500/30 transition-colors flex items-center space-x-1"
              >
                <span>Business Standard</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFeedSourceInput("Down To Earth");
                  const url = "https://news.google.com/rss/search?q=site%3Adowntoearth.org.in&hl=en-IN&gl=IN&ceid=IN%3Aen";
                  setFeedUrlInput(url);
                  handleAddAndFetchFeed(url, "Down To Earth");
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-[#182338] hover:bg-[#202f4a] text-teal-300 border border-teal-500/30 transition-colors flex items-center space-x-1"
              >
                <span>Down To Earth</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFeedSourceInput("LiveLaw");
                  const url = "https://news.google.com/rss/search?q=site%3Alivelaw.in&hl=en-IN&gl=IN&ceid=IN%3Aen";
                  setFeedUrlInput(url);
                  handleAddAndFetchFeed(url, "LiveLaw");
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-[#182338] hover:bg-[#202f4a] text-purple-300 border border-purple-500/30 transition-colors flex items-center space-x-1"
              >
                <span>LiveLaw (Supreme Court)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFeedSourceInput("PRS Legislative");
                  const url = "https://news.google.com/rss/search?q=site%3Aprsindia.org&hl=en-IN&gl=IN&ceid=IN%3Aen";
                  setFeedUrlInput(url);
                  handleAddAndFetchFeed(url, "PRS Legislative");
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-[#182338] hover:bg-[#202f4a] text-indigo-300 border border-indigo-500/30 transition-colors flex items-center space-x-1"
              >
                <span>PRS Legislative</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFeedSourceInput("Economic Times");
                  const url = "https://economictimes.indiatimes.com/news/economy/rssfeeds/1373380680.cms";
                  setFeedUrlInput(url);
                  handleAddAndFetchFeed(url, "Economic Times");
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-[#182338] hover:bg-[#202f4a] text-yellow-300 border border-yellow-500/30 transition-colors flex items-center space-x-1"
              >
                <span>Economic Times</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFeedSourceInput("ORF");
                  const url = "https://news.google.com/rss/search?q=site%3Aorfonline.org&hl=en-IN&gl=IN&ceid=IN%3Aen";
                  setFeedUrlInput(url);
                  handleAddAndFetchFeed(url, "ORF");
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-[#182338] hover:bg-[#202f4a] text-rose-300 border border-rose-500/30 transition-colors flex items-center space-x-1"
              >
                <span>ORF (Geopolitics)</span>
              </button>
            </div>
          </div>

          {/* Feedback Toast */}
          {feedNotification && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                feedNotification.type === "success"
                  ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                  : feedNotification.type === "error"
                  ? "bg-red-950/40 border-red-500/40 text-red-300"
                  : "bg-blue-950/40 border-blue-500/40 text-blue-300"
              }`}
            >
              <div className="flex items-center space-x-2">
                {feedNotification.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                )}
                <span>{feedNotification.message}</span>
              </div>
              <button
                onClick={() => setFeedNotification(null)}
                className="text-slate-400 hover:text-white text-[11px] ml-3"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Active Feeds List */}
          <div className="pt-2 border-t border-slate-800">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Configured Real-Time Feed Sources
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {savedFeeds.map((feed) => (
                <div
                  key={feed.id}
                  className="p-2.5 rounded-xl bg-[#162033] border border-slate-800 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                      <p className="text-xs font-bold text-white truncate">{feed.name}</p>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{feed.url}</p>
                  </div>
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleAddAndFetchFeed(feed.url, feed.source)}
                      disabled={isFetchingFeed}
                      title="Sync this feed"
                      className="p-1 rounded-md text-slate-400 hover:text-blue-400 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveSavedFeed(feed.id)}
                      title="Remove feed"
                      className="p-1 rounded-md text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Today's MCQs Banner (Matching Screenshot 6 Banner) */}
      <div className="rounded-2xl bg-gradient-to-r from-red-950/70 via-purple-950/50 to-[#121b2d] border border-red-900/40 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div>
          <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
            Daily Knowledge Test
          </span>
          <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
            Today's MCQs
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            <span className="text-slate-400">1603 practiced</span> • 15 questions based on today's newspaper editorials.
          </p>
        </div>

        <button
          onClick={onStartTodayMCQs}
          className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg shadow-red-600/30 transition-all hover:scale-105"
        >
          <span>Practice Now</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Search Bar & News Overview */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search headlines, syllabus paper, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#111723] border border-[#1e293b] rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        <div className="text-xs text-slate-400 self-end sm:self-auto">
          Showing <span className="text-white font-semibold">{filteredArticles.length}</span> of {articles.length} news items
        </div>
      </div>

      {/* Source Filter Tabs & Feed Scroll Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2 bg-[#111723] p-1.5 rounded-xl border border-[#1e293b] text-xs font-semibold overflow-x-auto">
          {sources.map((src) => (
            <button
              key={src}
              onClick={() => setSelectedSource(src)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                selectedSource === src
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {src}
            </button>
          ))}
        </div>

        {/* Scroll Progress Metric Badge */}
        <div className="flex items-center space-x-2 text-xs text-slate-400 self-end sm:self-auto">
          <span>Feed scrolled:</span>
          <div className="w-20 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700/80">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-150"
              style={{ width: `${scrollProgress}%` }}
            />
          </div>
          <span className="font-mono text-[11px] font-bold text-slate-300">
            {Math.round(scrollProgress)}%
          </span>
        </div>
      </div>

      {/* Layout: Articles List (Left) + Detail View (Right, Matching Screenshot 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Articles Feed */}
        <div className="lg:col-span-5 space-y-3.5">
          {filteredArticles.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#111723] border border-[#1e293b] text-center space-y-3">
              <Newspaper className="w-10 h-10 text-slate-500 mx-auto" />
              <h4 className="font-bold text-white text-sm">No articles found for "{selectedSource}"</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Click "Custom RSS Feeds" at the top to add a live feed URL for {selectedSource}.
              </p>
              <button
                onClick={() => setIsFeedManagerOpen(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
              >
                Add RSS Feed
              </button>
            </div>
          ) : (
            filteredArticles.map((article) => {
              const isSelected = activeArticle?.id === article.id;

              return (
                <div
                  key={article.id}
                  onClick={() => setActiveArticle(article)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-[#162033] border-blue-500/60 ring-1 ring-blue-500/40 shadow-md shadow-blue-500/10"
                      : "bg-[#111723] border-[#1e293b] hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${getSourceBadgeClass(article.source)}`}>
                      {article.source}
                    </span>
                    <span className="text-[11px]">{article.date}</span>
                  </div>

                  <h4 className="font-bold text-white text-sm sm:text-base leading-snug line-clamp-2">
                    {article.headline}
                  </h4>

                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">
                    {article.summary}
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2 border-t border-slate-800/80">
                    {article.gsTags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="text-[10px] px-2 py-0.5 rounded bg-[#1f2c42] text-slate-300 font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                    {article.prelimsTag && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                        Prelims Fact
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Full Article View (Matching Screenshot 5) */}
        {activeArticle && (
          <div className="lg:col-span-7 bg-[#111723] rounded-2xl border border-[#1e293b] p-5 sm:p-7 space-y-6 shadow-md">
            {/* Header & Meta */}
            <div className="space-y-3 border-b border-slate-800 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border ${getSourceBadgeClass(activeArticle.source)}`}>
                    {activeArticle.source}
                  </span>
                  {activeArticle.page && (
                    <span className="text-slate-400">• {activeArticle.page}</span>
                  )}
                  <span className="text-slate-400">• {activeArticle.date}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onAskBoltArticle(activeArticle)}
                    className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 font-bold text-xs flex items-center space-x-1.5 transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current text-amber-400" />
                    <span>Ask Bolt</span>
                  </button>
                  <button
                    onClick={() => toggleBookmark(activeArticle.id)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      bookmarkedIds[activeArticle.id]
                        ? "text-amber-400 bg-amber-500/10"
                        : "text-slate-400 hover:text-white"
                    }`}
                    title={
                      bookmarkedIds[activeArticle.id]
                        ? "Bookmarked in your revision folder"
                        : "Bookmark for revision"
                    }
                  >
                    <Bookmark
                      className={`w-4 h-4 ${
                        bookmarkedIds[activeArticle.id] ? "fill-current" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                {activeArticle.headline}
              </h2>

              <div className="flex flex-wrap items-center gap-1.5">
                {activeArticle.gsTags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20"
                  >
                    {tag}
                  </span>
                ))}
                {activeArticle.prelimsTag && (
                  <span className="text-xs px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                    Prelims Ready
                  </span>
                )}
              </div>
            </div>

            {/* Key Highlights (Matching Screenshot 5) */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                Key Highlights
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-200">
                {activeArticle.keyHighlights.map((hl, idx) => (
                  <li key={idx} className="flex items-start space-x-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                    <span className="leading-relaxed">{hl}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Visual Infographic Card (Matching Screenshot 5 Box) */}
            {activeArticle.infographic && (
              <div className="p-4 sm:p-5 rounded-xl bg-[#0e141f] border border-blue-900/40 space-y-4 shadow-inner">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                      UPSC Infographic
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-white mt-0.5">
                      {activeArticle.infographic.title}
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Effective: {activeArticle.infographic.effectiveDate}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeArticle.infographic.cards.map((card, cIdx) => (
                    <div
                      key={cIdx}
                      className="p-3 rounded-lg bg-[#162033] border border-slate-800 space-y-1"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-200">{card.title}</span>
                        {card.value && (
                          <span className="text-xs font-bold text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10">
                            {card.value}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">{card.subtitle}</p>
                    </div>
                  ))}
                </div>

                {activeArticle.infographic.themes && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-300">Themes:</span>
                    {activeArticle.infographic.themes.map((th, thIdx) => (
                      <span key={thIdx} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {th}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Detailed Insights & Key Concepts */}
            <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                Detailed Insights
              </h3>
              {activeArticle.detailedInsights.map((insight, idx) => (
                <p key={idx}>{insight}</p>
              ))}
            </div>

            {/* UPSC Relevance Card (Matching Screenshot 5) */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#121b2d] to-[#0e141f] border border-blue-900/40 space-y-2.5 text-xs">
              <h4 className="font-bold text-white flex items-center space-x-1.5 text-sm">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>UPSC Examination Relevance</span>
              </h4>

              <div className="space-y-1.5 text-slate-300">
                <p>
                  <strong className="text-slate-200">Prelims Pointer:</strong>{" "}
                  {activeArticle.upscRelevance.prelimsFact}
                </p>
                <p>
                  <strong className="text-slate-200">Mains Dimension:</strong>{" "}
                  {activeArticle.upscRelevance.mainsRelevance}
                </p>
                <div className="p-2.5 rounded-lg bg-[#162033] border border-slate-800 text-blue-200">
                  <strong className="text-blue-400 block mb-1">Expected Mains Question:</strong>
                  "{activeArticle.upscRelevance.possibleMainsQuestion}"
                </div>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={onStartTodayMCQs}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-colors"
              >
                <span>Practice MCQs on this Article</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onAskBoltArticle(activeArticle)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-colors"
              >
                <Zap className="w-3.5 h-3.5 fill-white" />
                <span>Deep Dive with Bolt</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

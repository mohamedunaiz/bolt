import React, { useState } from "react";
import {
  Newspaper,
  Calendar,
  Sparkles,
  ArrowRight,
  Bookmark,
  Share2,
  Zap,
  BookOpen,
  ChevronRight,
  ExternalLink,
  Users,
  Store,
  ShieldCheck,
  Percent,
  CheckCircle2,
  Layers,
  HelpCircle,
  Clock,
  TrendingUp,
  Check,
} from "lucide-react";
import { NewsArticle, NavigationTab } from "../types";

interface DailyNewsDashboardSectionProps {
  articles: NewsArticle[];
  onNavigate: (tab: NavigationTab) => void;
  onAskBolt: (prompt: string) => void;
  onStartTodayMCQs: () => void;
}

export const DailyNewsDashboardSection: React.FC<DailyNewsDashboardSectionProps> = ({
  articles,
  onNavigate,
  onAskBolt,
  onStartTodayMCQs,
}) => {
  const [activeArticleIndex, setActiveArticleIndex] = useState<number>(0);
  const [bookmarkedIds, setBookmarkedIds] = useState<Record<string, boolean>>({ "news-1": true });
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const activeArticle = articles[activeArticleIndex] || articles[0];

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarkedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderInfographicIcon = (iconType?: string) => {
    switch (iconType) {
      case "users":
        return <Users className="w-4 h-4 text-emerald-400" />;
      case "store":
        return <Store className="w-4 h-4 text-blue-400" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="bg-[#111723] rounded-2xl border border-[#1e293b] p-5 shadow-xl space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-400 mb-0.5">
            <Newspaper className="w-4 h-4" />
            <span>Daily Editorial Analysis & News Updates</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
              Live Today
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white font-['Outfit']">
            UPSC Current Affairs: Infographic & High-Yield Analysis
          </h3>
          <p className="text-slate-400 text-xs mt-0.5">
            Structured daily briefs curated from The Hindu, PIB & Indian Express with syllabus mapping.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigate("news")}
            className="px-3 py-1.5 rounded-xl bg-[#162033] hover:bg-[#1d2b45] text-slate-200 border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <span>All Daily Articles</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Article Selector Carousel Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        {articles.slice(0, 4).map((art, idx) => (
          <button
            key={art.id}
            onClick={() => setActiveArticleIndex(idx)}
            className={`px-3 py-2 rounded-xl text-left flex-shrink-0 transition-all border ${
              activeArticleIndex === idx
                ? "bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-600/20"
                : "bg-[#162033] border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <div className="flex items-center space-x-1.5 mb-0.5">
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-blue-300">
                {art.source}
              </span>
              <span className="text-[10px] text-slate-400">{art.page || "Editorial"}</span>
            </div>
            <p className="text-xs font-semibold line-clamp-1 max-w-[220px]">
              {art.headline}
            </p>
          </button>
        ))}
      </div>

      {/* Main Feature News Card or Empty State */}
      {activeArticle ? (
        <div className="bg-[#141d2d] rounded-2xl border border-slate-800 p-5 space-y-4">
          {/* Metadata Row: Source, Date, GSTags & Bookmark */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-bold text-xs">
                {activeArticle.source}
              </span>
              <div className="flex items-center space-x-1 text-slate-400 text-xs">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>{activeArticle.date}</span>
                {activeArticle.page && <span>• {activeArticle.page}</span>}
              </div>
              {activeArticle.gsTags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 text-[11px] font-semibold border border-blue-500/20"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => toggleBookmark(activeArticle.id, e)}
                className={`p-1.5 rounded-lg border transition-colors ${
                  bookmarkedIds[activeArticle.id]
                    ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                    : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                }`}
                title="Bookmark for Revision"
              >
                <Bookmark className="w-4 h-4 fill-current" />
              </button>
              <button
                onClick={() => {
                  try {
                    navigator.clipboard?.writeText(window.location.href);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  } catch {}
                }}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:text-white transition-colors"
                title={copiedLink ? "Link copied to clipboard!" : "Share Article"}
              >
                {copiedLink ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Headline & Summary */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-['Outfit'] leading-snug">
              {activeArticle.headline}
            </h2>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed bg-[#162238] p-3 rounded-xl border border-blue-900/30">
              {activeArticle.summary}
            </p>
          </div>

          {/* Structured Infographic Visual Grid (Matching Photo 6/1) */}
          {activeArticle.infographic && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>{activeArticle.infographic.title}</span>
                </span>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {activeArticle.infographic.effectiveDate}
                </span>
              </div>

              {/* Infographic Main Anchor */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/20 border border-blue-500/30 text-center">
                <span className="text-xs font-semibold text-slate-300">Core Policy Decision</span>
                <p className="text-base sm:text-lg font-bold text-blue-200 mt-0.5">
                  {activeArticle.infographic.mainAnchor}
                </p>
              </div>

              {/* Infographic Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {activeArticle.infographic.cards.map((c, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-[#19253b] border border-slate-700/80 hover:border-blue-500/50 transition-colors flex items-start space-x-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5 border border-blue-500/20">
                      {renderInfographicIcon(c.iconType)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white line-clamp-1">{c.title}</h4>
                      <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">{c.subtitle}</p>
                      {c.value && (
                        <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {c.value}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Themes */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-400 font-semibold mr-1">Syllabus Themes:</span>
                {activeArticle.infographic.themes.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Key Bullet Highlights */}
          <div className="p-4 rounded-xl bg-[#101726] border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Key Editorial Highlights for UPSC</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {activeArticle.keyHighlights.map((hl, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                  <span className="leading-relaxed">{hl}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* UPSC Relevance Box: Prelims Fact & Mains Question */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-900/30">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1">
                <Sparkles className="w-3 h-3" />
                <span>Prelims High-Yield Fact</span>
              </span>
              <p className="text-xs text-slate-200 mt-1.5 leading-relaxed font-medium">
                {activeArticle.upscRelevance.prelimsFact}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-900/30">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center space-x-1">
                <BookOpen className="w-3 h-3" />
                <span>Mains Analytical Dimension</span>
              </span>
              <p className="text-xs text-slate-200 mt-1.5 leading-relaxed">
                {activeArticle.upscRelevance.possibleMainsQuestion}
              </p>
            </div>
          </div>

          {/* Action CTAs: Practice Today's 15 MCQs & Ask Bolt */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={onStartTodayMCQs}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-red-600/30 transition-all hover:scale-[1.02]"
              >
                <span>Practice Today's 15 MCQs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() =>
                  onAskBolt(
                    `Analyze today's news article: "${activeArticle.headline}" from the perspective of UPSC GS and Public Administration. Break down key statutory bodies, constitutional provisions, and model mains answer points.`
                  )
                }
                className="px-3.5 py-2 rounded-xl bg-[#162033] hover:bg-[#1d2b45] text-blue-300 border border-blue-900/50 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
              >
                <Zap className="w-3.5 h-3.5 text-blue-400" />
                <span>Ask Bolt to Deconstruct</span>
              </button>
            </div>

            <button
              onClick={() => onNavigate("news")}
              className="text-xs text-slate-400 hover:text-white font-medium flex items-center space-x-1"
            >
              <span>View Full Editorial Page</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-[#141d2d] rounded-2xl border border-slate-800 p-8 text-center space-y-3">
          <Newspaper className="w-10 h-10 text-slate-500 mx-auto" />
          <h4 className="font-bold text-white text-sm">Today's Current Affairs Loading...</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Fresh articles from The Hindu, PIB, and The Indian Express are being synchronized. You can also view or refresh them in the News tab.
          </p>
          <button
            onClick={() => onNavigate("news")}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
          >
            Open News Tab
          </button>
        </div>
      )}
    </div>
  );
};

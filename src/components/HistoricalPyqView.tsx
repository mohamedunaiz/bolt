import React, { useState, useEffect, useMemo } from "react";
import {
  History,
  Compass,
  Sparkles,
  Award,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Search,
  Filter,
  Layers,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Calendar,
  Clock,
  Flame,
  Check,
  X,
  ArrowRight,
  TrendingUp,
  FileText,
  ShieldCheck,
  ExternalLink,
  PenTool,
  Send,
  HelpCircle,
} from "lucide-react";
import { UpscPyqItem, RecurringThemeAnalysis } from "../types";

interface HistoricalPyqViewProps {
  onAskBoltQuestion?: (qText: string) => void;
  onEvaluateAnswer?: (question: string, answer: string, marks: number) => void;
}

export const HistoricalPyqView: React.FC<HistoricalPyqViewProps> = ({
  onAskBoltQuestion,
  onEvaluateAnswer,
}) => {
  // Primary datasets
  const [pyqs, setPyqs] = useState<UpscPyqItem[]>([]);
  const [recurringThemes, setRecurringThemes] = useState<RecurringThemeAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Filters
  const [selectedStage, setSelectedStage] = useState<"All" | "Prelims" | "Mains">("All");
  const [selectedPaper, setSelectedPaper] = useState<string>("All");
  const [selectedTier, setSelectedTier] = useState<string>("ALL");
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedYearRange, setSelectedYearRange] = useState<string>("all");

  // Interaction states
  const [userMcqAnswers, setUserMcqAnswers] = useState<Record<string, string>>({});
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});
  const [expandedModelAnswers, setExpandedModelAnswers] = useState<Record<string, boolean>>({});
  const [draftAnswers, setDraftAnswers] = useState<Record<string, string>>({});
  const [evalErrors, setEvalErrors] = useState<Record<string, string>>({});

  // 1. Fetch genuine verified PYQs & Recurring Theme Analytics from server
  useEffect(() => {
    let isMounted = true;
    const loadPyqsAndThemes = async () => {
      setIsLoading(true);
      setErrorNotice(null);
      try {
        const [pyqsRes, themesRes] = await Promise.all([
          fetch("/api/pyqs/search"),
          fetch("/api/pyqs/analysis"),
        ]);

        if (pyqsRes.ok) {
          const pyqsData = await pyqsRes.json();
          if (isMounted && Array.isArray(pyqsData.pyqs)) {
            setPyqs(pyqsData.pyqs);
          }
        }

        if (themesRes.ok) {
          const themesData = await themesRes.json();
          if (isMounted && Array.isArray(themesData.themes)) {
            setRecurringThemes(themesData.themes);
          }
        }
      } catch (err: any) {
        console.warn("Failed loading PYQ intelligence:", err.message);
        if (isMounted) setErrorNotice("Notice: Operating on local PYQ cache.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadPyqsAndThemes();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Client-side multi-dimensional filtering
  const filteredPyqs = useMemo(() => {
    return pyqs.filter((q) => {
      // Stage filter
      if (selectedStage !== "All" && q.stage !== selectedStage) {
        return false;
      }

      // Paper filter
      if (selectedPaper !== "All" && q.paper !== selectedPaper) {
        return false;
      }

      // Tier filter
      if (selectedTier !== "ALL") {
        if (selectedTier === "VERIFIED_ONLY" && q.verification.tier === "PRACTICE_QUESTION") {
          return false;
        }
        if (selectedTier !== "VERIFIED_ONLY" && q.verification.tier !== selectedTier) {
          return false;
        }
      }

      // Theme hotspot filter
      if (selectedThemeId && q.recurringThemeId !== selectedThemeId) {
        return false;
      }

      // Year range filter
      if (selectedYearRange === "recent" && q.year < 2020) return false;
      if (selectedYearRange === "2013-2019" && (q.year < 2013 || q.year > 2019)) return false;
      if (selectedYearRange === "historical" && q.year >= 2013) return false;

      // Keyword Search filter
      if (searchQuery.trim()) {
        const needle = searchQuery.toLowerCase().trim();
        const matchesText = q.questionText.toLowerCase().includes(needle);
        const matchesTopic = q.topic.toLowerCase().includes(needle);
        const matchesSubtopic = q.subtopic.toLowerCase().includes(needle);
        const matchesPaper = q.paper.toLowerCase().includes(needle);
        const matchesYear = q.year.toString().includes(needle);
        const matchesSource = q.verification.source.toLowerCase().includes(needle);
        const matchesThinkers = q.relatedThinkers?.some((t) => t.toLowerCase().includes(needle));
        if (
          !matchesText &&
          !matchesTopic &&
          !matchesSubtopic &&
          !matchesPaper &&
          !matchesYear &&
          !matchesSource &&
          !matchesThinkers
        ) {
          return false;
        }
      }

      return true;
    });
  }, [pyqs, selectedStage, selectedPaper, selectedTier, selectedThemeId, selectedYearRange, searchQuery]);

  // Handlers
  const handleSelectOption = (questionId: string, optionKey: string) => {
    if (userMcqAnswers[questionId]) return;
    setUserMcqAnswers((prev) => ({ ...prev, [questionId]: optionKey }));
    setExpandedDetails((prev) => ({ ...prev, [questionId]: true }));
  };

  const toggleDetails = (questionId: string) => {
    setExpandedDetails((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const toggleModelAnswer = (questionId: string) => {
    setExpandedModelAnswers((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const handleDraftChange = (questionId: string, text: string) => {
    setDraftAnswers((prev) => ({ ...prev, [questionId]: text }));
    if (evalErrors[questionId] && text.trim().length >= 20) {
      setEvalErrors((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    }
  };

  // Score statistics for Prelims MCQs answered in this session
  const answeredMcqIds = Object.keys(userMcqAnswers);
  const totalMcqAnswered = answeredMcqIds.length;
  let correctMcqCount = 0;
  answeredMcqIds.forEach((id) => {
    const q = pyqs.find((item) => item.id === id);
    if (q && userMcqAnswers[id] === q.correctOption) {
      correctMcqCount++;
    }
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-[#121824] border border-[#232f45] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold text-xs border border-emerald-500/30 flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>UPSC Official PYQ Repository</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 text-xs border border-blue-500/25">
                Prelims GS-1 + Mains GS 1–4 & PubAdmin
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-xs border border-amber-500/25">
                SuperKalam-Grade Analysis
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-['Outfit']">
              Official UPSC Previous Year Questions (PYQs)
            </h1>
            <p className="text-sm text-slate-300 mt-1.5 max-w-3xl leading-relaxed">
              Every question is verified against official UPSC Civil Services Examination papers with
              direct provenance links. Explore command-word breakdowns, 4-dimension demand analysis,
              thinkers to anchor, constitutional articles, and complete model answer frameworks.
            </p>
          </div>

          {/* Quick Score Snapshot */}
          {totalMcqAnswered > 0 && (
            <div className="p-3.5 rounded-xl bg-[#172033] border border-slate-700/80 text-right flex flex-col sm:items-end justify-center">
              <span className="text-[11px] text-slate-400 font-medium">MCQ Session Score</span>
              <div className="text-lg font-bold text-white">
                {correctMcqCount * 2} / {totalMcqAnswered * 2} Marks
              </div>
              <span className="text-[10px] text-emerald-400 font-semibold">
                {Math.round((correctMcqCount / totalMcqAnswered) * 100)}% Accuracy ({correctMcqCount}/{totalMcqAnswered})
              </span>
            </div>
          )}
        </div>

        {/* Stage Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-slate-800">
          <span className="text-xs font-semibold text-slate-400 mr-2 flex items-center space-x-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Examination Stage:</span>
          </span>
          {(["All", "Mains", "Prelims"] as const).map((stage) => (
            <button
              key={stage}
              onClick={() => setSelectedStage(stage)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedStage === stage
                  ? "bg-amber-500 text-slate-950 font-bold shadow-md"
                  : "bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700/60"
              }`}
            >
              {stage === "All" ? "All Stages (Prelims & Mains)" : stage === "Mains" ? "Mains Descriptive (GS 1–4 & PubAdmin)" : "Prelims Objective (MCQs)"}
            </button>
          ))}
        </div>
      </div>

      {/* UPSC Recurring Themes Hotspots Bar */}
      {recurringThemes.length > 0 && (
        <div className="bg-[#121824] border border-[#232f45] rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white font-['Outfit']">
                UPSC Recurring Themes & Question Hotspots (Derived from Verified PYQs)
              </h2>
            </div>
            {selectedThemeId && (
              <button
                onClick={() => setSelectedThemeId(null)}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center space-x-1"
              >
                <span>Clear Theme Filter</span>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recurringThemes.map((theme) => {
              const isSelected = selectedThemeId === theme.themeId;
              return (
                <div
                  key={theme.themeId}
                  onClick={() => setSelectedThemeId(isSelected ? null : theme.themeId)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-amber-500/15 border-amber-500/50 shadow-md shadow-amber-950/20"
                      : "bg-[#0d121c] border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {theme.paper} • {theme.unit}
                    </span>
                    <span className="text-[11px] font-bold text-amber-400">
                      Asked {theme.frequencyCount} times
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white leading-snug line-clamp-2">
                    {theme.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                    {theme.repetitionPattern}
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-slate-500">
                    <span className="text-emerald-400 font-medium">{theme.trend}</span>
                    <span className="text-slate-400">Score: {theme.importanceScore}/100</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Multi-Dimensional Filter Bar */}
      <div className="bg-[#121824] border border-[#232f45] rounded-2xl p-4 shadow-md space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by topic, article, thinker (e.g. Bommai, Austin, Article 356)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#0d121c] border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Paper Selector */}
          <div className="md:col-span-3">
            <select
              value={selectedPaper}
              onChange={(e) => setSelectedPaper(e.target.value)}
              className="w-full px-2.5 py-2 bg-[#0d121c] border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="All">All Papers</option>
              <option value="GS 1">GS 1: History, Geography & Society</option>
              <option value="GS 2">GS 2: Polity, Governance & IR</option>
              <option value="GS 3">GS 3: Economy, S&T & Environment</option>
              <option value="GS 4">GS 4: Ethics, Integrity & Aptitude</option>
              <option value="PubAdmin Paper 1">PubAdmin Paper 1 (Admin Theory)</option>
              <option value="PubAdmin Paper 2">PubAdmin Paper 2 (Indian Admin)</option>
            </select>
          </div>

          {/* Verification Tier Selector */}
          <div className="md:col-span-3">
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="w-full px-2.5 py-2 bg-[#0d121c] border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Tiers (Official + Practice)</option>
              <option value="VERIFIED_ONLY">Verified Official Only (UPSC Papers)</option>
              <option value="VERIFIED_OFFICIAL_PYQ">Official UPSC CSE Papers</option>
              <option value="VERIFIED_RELIABLE_ARCHIVE">Verified Historical Archives (1855–1947)</option>
              <option value="PRACTICE_QUESTION">BOLT Practice Drills</option>
            </select>
          </div>

          {/* Year Range */}
          <div className="md:col-span-2">
            <select
              value={selectedYearRange}
              onChange={(e) => setSelectedYearRange(e.target.value)}
              className="w-full px-2.5 py-2 bg-[#0d121c] border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Years</option>
              <option value="recent">Recent (2020–2024)</option>
              <option value="2013-2019">Syllabus Era (2013–2019)</option>
              <option value="historical">Historical Archives</option>
            </select>
          </div>
        </div>

        {/* Results Count & Reset */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
          <div className="flex items-center space-x-2">
            <span>
              Showing <strong className="text-white">{filteredPyqs.length}</strong> questions
            </span>
            {selectedThemeId && (
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-semibold border border-amber-500/30">
                Filtered by Theme Hotspot
              </span>
            )}
          </div>
          {(selectedStage !== "All" || selectedPaper !== "All" || selectedTier !== "ALL" || selectedThemeId || searchQuery) && (
            <button
              onClick={() => {
                setSelectedStage("All");
                setSelectedPaper("All");
                setSelectedTier("ALL");
                setSelectedThemeId(null);
                setSearchQuery("");
                setSelectedYearRange("all");
              }}
              className="text-xs text-amber-400 hover:text-white flex items-center space-x-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Questions Stream */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="p-12 text-center bg-[#121824] rounded-2xl border border-slate-800 text-slate-400">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold">Loading official UPSC PYQ repository...</p>
          </div>
        ) : filteredPyqs.length === 0 ? (
          <div className="p-12 text-center bg-[#121824] rounded-2xl border border-slate-800 space-y-3">
            <Compass className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No questions matched your filter</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Try resetting the stage or paper filter to view the complete catalog of verified UPSC PYQs.
            </p>
            <button
              onClick={() => {
                setSelectedStage("All");
                setSelectedPaper("All");
                setSelectedTier("ALL");
                setSelectedThemeId(null);
                setSearchQuery("");
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredPyqs.map((q) => {
            const isMains = q.stage === "Mains" || q.questionType !== "MCQ";
            const isExpanded = expandedDetails[q.id];
            const isModelAnswerExpanded = expandedModelAnswers[q.id];
            const userAnswer = userMcqAnswers[q.id];
            const isAnswered = !!userAnswer;
            const isCorrect = userAnswer === q.correctOption;

            return (
              <div
                key={q.id}
                className="bg-[#121824] border border-[#232f45] rounded-2xl p-5 sm:p-6 space-y-4 hover:border-slate-700 transition-all shadow-md"
              >
                {/* Header: Stage, Year, Paper, Verification Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Verification Tier Badge */}
                    {q.verification.tier === "VERIFIED_OFFICIAL_PYQ" ? (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30 flex items-center space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>✓ UPSC {q.year} Official PYQ</span>
                      </span>
                    ) : q.verification.tier === "VERIFIED_RELIABLE_ARCHIVE" ? (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30 flex items-center space-x-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        <span>Historical Archive ({q.year})</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 font-bold text-xs border border-purple-500/30 flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span>BOLT Practice Drill ({q.year})</span>
                      </span>
                    )}

                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700">
                      {q.stage}
                    </span>

                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 text-xs font-semibold border border-blue-500/20">
                      {q.paper}
                    </span>

                    {q.marks > 0 && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 text-xs font-semibold border border-amber-500/20">
                        {q.marks} Marks {q.wordLimit ? `(${q.wordLimit} Words)` : ""}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {q.commandWord && (
                      <span className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 text-[11px] font-bold border border-purple-500/30">
                        Directive: {q.commandWord}
                      </span>
                    )}
                    {q.verification.officialAnswerVerified && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold flex items-center space-x-1">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Official Key</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Provenance Box with direct link to official paper */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-[#0d121c] border border-slate-800 text-[11px]">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400 font-medium">Source / Provenance:</span>
                    <span className="text-slate-200 font-semibold">{q.verification.source}</span>
                  </div>
                  {q.verification.sourceUrl && (
                    <a
                      href={q.verification.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline font-medium flex items-center space-x-1"
                    >
                      <span>Official UPSC Paper PDF</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  )}
                </div>

                {/* Subtopic / Topic categorization */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span className="text-slate-300 font-semibold">{q.unit}:</span>
                  <span>{q.topic}</span>
                  {q.subtopic && (
                    <>
                      <span>•</span>
                      <span className="text-amber-400 font-medium">{q.subtopic}</span>
                    </>
                  )}
                </div>

                {/* Question Text */}
                <div className="text-sm sm:text-base text-slate-100 font-['Outfit'] font-normal leading-relaxed whitespace-pre-line p-3 bg-slate-900/40 rounded-xl border border-slate-800/80">
                  {q.questionText}
                </div>

                {/* --- MAINS QUESTION INTERACTIVE EXPANSION --- */}
                {isMains && (
                  <div className="space-y-4 pt-2">
                    {/* Demand Analysis & Dimensions Toggle */}
                    {q.demandAnalysis && (
                      <div className="p-3.5 rounded-xl bg-[#0d121c] border border-slate-800 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                            <PenTool className="w-3.5 h-3.5" />
                            <span>SuperKalam Demand Analysis & Dimensions</span>
                          </span>
                          <button
                            onClick={() => toggleDetails(q.id)}
                            className="text-xs text-slate-400 hover:text-white flex items-center space-x-1"
                          >
                            <span>{isExpanded ? "Collapse" : "Expand Dimensions"}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          <strong className="text-white">Core Demand:</strong> {q.demandAnalysis.coreDemand}
                        </p>

                        {isExpanded && (
                          <div className="space-y-2 pt-2 border-t border-slate-800 animate-fadeIn">
                            <div className="space-y-1">
                              <span className="text-[11px] font-semibold text-slate-400">Essential Answer Dimensions:</span>
                              {q.demandAnalysis.dimensions.map((dim, i) => (
                                <div key={i} className="text-xs text-slate-300 flex items-start space-x-2 pl-2">
                                  <span className="text-amber-400 font-bold">•</span>
                                  <span>{dim}</span>
                                </div>
                              ))}
                            </div>

                            {/* Thinkers and Constitutional Articles */}
                            <div className="flex flex-wrap gap-2 pt-2 text-xs">
                              {q.relatedThinkers && q.relatedThinkers.length > 0 && (
                                <div className="p-2 rounded-lg bg-blue-950/20 border border-blue-900/30 text-blue-300">
                                  <strong className="text-blue-200">Thinkers:</strong> {q.relatedThinkers.join(", ")}
                                </div>
                              )}
                              {q.constitutionalArticles && q.constitutionalArticles.length > 0 && (
                                <div className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-900/30 text-emerald-300">
                                  <strong className="text-emerald-200">Articles:</strong> {q.constitutionalArticles.join(", ")}
                                </div>
                              )}
                              {q.secondArcReports && q.secondArcReports.length > 0 && (
                                <div className="p-2 rounded-lg bg-purple-950/20 border border-purple-900/30 text-purple-300">
                                  <strong className="text-purple-200">2nd ARC:</strong> {q.secondArcReports.join(", ")}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Model Answer Framework Accordion */}
                    {q.modelAnswerFramework && (
                      <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0d121c]">
                        <button
                          onClick={() => toggleModelAnswer(q.id)}
                          className="w-full p-3 flex items-center justify-between text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-slate-900/40"
                        >
                          <span className="flex items-center space-x-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Structured Model Answer Framework</span>
                          </span>
                          {isModelAnswerExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        {isModelAnswerExpanded && (
                          <div className="p-4 space-y-3 text-xs leading-relaxed border-t border-slate-800 animate-fadeIn">
                            <div>
                              <strong className="text-white block mb-0.5">Introduction:</strong>
                              <p className="text-slate-300">{q.modelAnswerFramework.introduction}</p>
                            </div>

                            <div>
                              <strong className="text-white block mb-1">Body Points:</strong>
                              <div className="space-y-1.5 pl-2">
                                {q.modelAnswerFramework.bodyPoints.map((bp, i) => (
                                  <div key={i} className="text-slate-300 flex items-start space-x-2">
                                    <span className="text-emerald-400 font-bold">{i + 1}.</span>
                                    <span>{bp}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <strong className="text-white block mb-0.5">Way Forward / Conclusion:</strong>
                              <p className="text-slate-300">{q.modelAnswerFramework.wayForward}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Answer Drafting Workspace */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-semibold text-slate-300 flex items-center space-x-1">
                          <FileText className="w-3.5 h-3.5 text-amber-400" />
                          <span>Draft Your Answer (Evaluate with 7-Dimension Rubric):</span>
                        </span>
                        <span>
                          {(draftAnswers[q.id]?.trim().split(/\s+/).filter(Boolean).length || 0)} / {q.wordLimit || 150} words
                        </span>
                      </div>
                      <textarea
                        rows={4}
                        placeholder={`Write your structured ${q.wordLimit || 150}-word answer here...`}
                        value={draftAnswers[q.id] || ""}
                        onChange={(e) => handleDraftChange(q.id, e.target.value)}
                        className="w-full p-3 bg-[#0d121c] border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 resize-y"
                      />
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() =>
                            onAskBoltQuestion?.(
                              `Provide a detailed command-word breakdown and thinker integration for UPSC question (${q.year}, ${q.paper}): ${q.questionText}`
                            )
                          }
                          className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center space-x-1"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                          <span>Ask Bolt Mentor for Guidance</span>
                        </button>

                        <button
                          onClick={() => {
                            const text = draftAnswers[q.id];
                            if (!text || text.trim().length < 20) {
                              setEvalErrors((prev) => ({
                                ...prev,
                                [q.id]: "Please write at least 20 words to evaluate your answer.",
                              }));
                              return;
                            }
                            setEvalErrors((prev) => {
                              const next = { ...prev };
                              delete next[q.id];
                              return next;
                            });
                            onEvaluateAnswer?.(q.questionText, text, q.marks || 10);
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md"
                        >
                          <Send className="w-3 h-3" />
                          <span>Evaluate Answer</span>
                        </button>
                      </div>
                      {evalErrors[q.id] && (
                        <p className="text-[11px] text-red-400 mt-1.5 font-medium animate-fadeIn">
                          {evalErrors[q.id]}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* --- PRELIMS QUESTION INTERACTIVE OPTIONS --- */}
                {!isMains && q.options && q.options.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="space-y-2">
                      {q.options.map((opt) => {
                        const isSelected = userAnswer === opt.key;
                        const isCorrectKey = opt.key === q.correctOption;

                        let btnClasses = "w-full p-3 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-start space-x-3 ";
                        if (isAnswered) {
                          if (isCorrectKey) {
                            btnClasses += "bg-emerald-950/40 border-emerald-500 text-emerald-200 font-medium";
                          } else if (isSelected && !isCorrectKey) {
                            btnClasses += "bg-rose-950/40 border-rose-500 text-rose-200";
                          } else {
                            btnClasses += "bg-[#0d121c] border-slate-800 text-slate-400 opacity-60";
                          }
                        } else {
                          btnClasses += "bg-[#0d121c] border-slate-800 hover:border-slate-700 text-slate-200";
                        }

                        return (
                          <button
                            key={opt.key}
                            onClick={() => handleSelectOption(q.id, opt.key)}
                            disabled={isAnswered}
                            className={btnClasses}
                          >
                            <span className="font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs border border-slate-700 shrink-0">
                              {opt.key}
                            </span>
                            <span className="leading-relaxed">{opt.text}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Reveal Explanation if answered or requested */}
                    {isAnswered && (
                      <div className="p-4 rounded-xl bg-[#0d121c] border border-slate-800 space-y-3 animate-fadeIn">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                            Official Answer Key: Option {q.correctOption}
                          </span>
                          {q.verification.officialAnswerVerified && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                              Verified with Official UPSC Key
                            </span>
                          )}
                        </div>

                        {q.explanation && (
                          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                            {q.explanation}
                          </p>
                        )}

                        {q.optionAnalysis && q.optionAnalysis.length > 0 && (
                          <div className="space-y-1.5 pt-2 border-t border-slate-800">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Statement-wise Analysis:
                            </span>
                            {q.optionAnalysis.map((oa, i) => (
                              <div
                                key={i}
                                className={`text-xs p-2 rounded-lg flex items-start space-x-2 ${
                                  oa.isCorrect
                                    ? "bg-emerald-950/30 text-emerald-300 border border-emerald-900/40"
                                    : "bg-rose-950/30 text-rose-300 border border-rose-900/40"
                                }`}
                              >
                                <span className="font-bold">Stmt {oa.optionKey}:</span>
                                <span>{oa.analysis}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

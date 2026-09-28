import React, { useState, useMemo } from "react";
import {
  Zap,
  Flame,
  AlertTriangle,
  RotateCcw,
  Target,
  ArrowRight,
  ChevronRight,
  BookOpen,
  Award,
  Sparkles,
  Clock,
  Calendar,
  Brain,
  Upload,
  History,
  Newspaper,
  GraduationCap,
  Sliders,
  Plus,
  Minus,
  Check,
  X,
  Search,
  Send,
  CheckCircle2,
  CheckSquare,
  FileText,
  TrendingUp,
} from "lucide-react";
import { StudentIntelligenceModal } from "./StudentIntelligenceModal";
import {
  UserProfile,
  SyllabusTopic,
  NavigationTab,
  NewsArticle,
  MainsAnswerEvaluation,
  StudySessionLog,
} from "../types";
import { MilestonesSection } from "./MilestonesSection";
import { generateMilestones } from "../data/milestonesData";

interface HomeDashboardProps {
  user: UserProfile;
  topics: SyllabusTopic[];
  articles?: NewsArticle[];
  evaluations?: MainsAnswerEvaluation[];
  studySessions?: StudySessionLog[];
  onUpdateUser?: (updated: UserProfile) => void;
  onUpdateStudySessions?: (sessions: StudySessionLog[]) => void;
  onNavigate: (tab: NavigationTab) => void;
  onAskBoltAboutWeakness: (weaknessName: string) => void;
  onStartRevision: () => void;
  onViewEvaluation: () => void;
  onAskBolt?: (prompt: string) => void;
  onStartTodayMCQs?: () => void;
}

const QUICK_PROMPTS = [
  {
    icon: "📰",
    label: "Today's The Hindu & PIB Analysis",
    prompt: "Summarize today's top 3 news stories for UPSC CSE with GS Paper mapping, Prelims takeaways, and Mains questions.",
  },
  {
    icon: "🎯",
    label: "5 Prelims MCQs on Modern India",
    prompt: "Generate 5 tough UPSC Prelims standard MCQs on Modern Indian History (Freedom Struggle) with detailed explanations.",
  },
  {
    icon: "✍️",
    label: "Evaluate Mains GS2 Answer",
    prompt: "I want to write an answer on 'The Office of the Governor: A Federal Linchpin or An Instrument of the Centre?'. Provide the demand breakdown, constitutional articles, and 7-dimension scoring criteria.",
  },
  {
    icon: "🧠",
    label: "Explain Herbert Simon's Bounded Rationality",
    prompt: "Explain Herbert Simon's Bounded Rationality and Administrative Man concept with real-world Indian district governance examples and 2nd ARC linkages.",
  },
  {
    icon: "🔄",
    label: "Generate Today's Revision Schedule",
    prompt: "Based on spaced repetition intervals, help me design a 2-hour high-yield revision routine for Public Administration Paper 1 core concepts.",
  },
];

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  user,
  topics,
  articles = [],
  evaluations = [],
  studySessions = [],
  onUpdateUser,
  onUpdateStudySessions,
  onNavigate,
  onAskBoltAboutWeakness,
  onStartRevision,
  onViewEvaluation,
  onAskBolt = () => {},
  onStartTodayMCQs = () => onNavigate("prelims"),
}) => {
  const [omnibarQuery, setOmnibarQuery] = useState("");
  const [isIntelligenceOpen, setIsIntelligenceOpen] = useState(false);

  // Daily study goal calculations
  const currentGoalHours = user.dailyStudyGoal || user.dailyStudyHoursGoal || 6;
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Filter study sessions achieved today
  const todaySessions = useMemo(() => {
    return (studySessions || []).filter((s) => {
      if (s.date === todayStr) return true;
      if (s.timestamp) {
        try {
          const sDate = new Date(s.timestamp);
          if (!isNaN(sDate.getTime())) {
            return sDate.toISOString().split("T")[0] === todayStr;
          }
        } catch {}
      }
      return false;
    });
  }, [studySessions, todayStr]);

  const todayAchievedMinutes = useMemo(() => {
    return todaySessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  }, [todaySessions]);

  const todayAchievedHours = useMemo(() => {
    return parseFloat((todayAchievedMinutes / 60).toFixed(1));
  }, [todayAchievedMinutes]);

  const rawPercentage = currentGoalHours > 0 ? (todayAchievedHours / currentGoalHours) * 100 : 0;
  const todayGoalPercentage = Math.round(rawPercentage);
  const clampedGoalPercentage = Math.min(todayGoalPercentage, 100);
  const isGoalAchieved = todayAchievedHours >= currentGoalHours;
  const remainingHours = Math.max(0, parseFloat((currentGoalHours - todayAchievedHours).toFixed(1)));

  // State for adjusting study goal inline
  const [isAdjustingGoal, setIsAdjustingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState<number>(currentGoalHours);

  const handleSaveGoal = (newGoal: number) => {
    const val = Math.max(0.5, Math.min(18, parseFloat(newGoal.toFixed(1))));
    setTempGoal(val);
    if (onUpdateUser) {
      onUpdateUser({
        ...user,
        dailyStudyGoal: val,
        dailyStudyHoursGoal: val,
      });
    }
    setIsAdjustingGoal(false);
  };

  const handleQuickLog = (minutes: number, topicTitle: string) => {
    const newSession: StudySessionLog = {
      id: "sess-" + Date.now(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      date: todayStr,
      subject: "pub_ad",
      topic: topicTitle,
      durationMinutes: minutes,
      mode: "deep_work",
    };
    const updated = [newSession, ...(studySessions || [])];
    if (onUpdateStudySessions) {
      onUpdateStudySessions(updated);
    }
    try {
      localStorage.setItem("bolt_study_sessions", JSON.stringify(updated));
    } catch {}
    if (onUpdateUser) {
      const addedHours = parseFloat((minutes / 60).toFixed(2));
      onUpdateUser({
        ...user,
        totalStudyHours: parseFloat(((user.totalStudyHours || 0) + addedHours).toFixed(1)),
      });
    }
  };

  const handleOmnibarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = omnibarQuery.trim();
    if (!query) return;
    onAskBolt(query);
    setOmnibarQuery("");
  };

  // Generate gamified milestones
  const milestones = useMemo(() => {
    return generateMilestones(user, topics, evaluations);
  }, [user, topics, evaluations]);

  // Calculate curriculum analytics
  const paper1Topics = topics.filter((t) => t.paper === "Paper 1");
  const paper2Topics = topics.filter((t) => t.paper === "Paper 2");

  const avgPaper1 = Math.round(
    paper1Topics.reduce((acc, t) => acc + t.completionPercentage, 0) / (paper1Topics.length || 1)
  );
  const avgPaper2 = Math.round(
    paper2Topics.reduce((acc, t) => acc + t.completionPercentage, 0) / (paper2Topics.length || 1)
  );
  const overallCompletion = Math.round((avgPaper1 + avgPaper2) / 2);

  const weakTopics = topics.filter((t) => t.status === "needs_revision");
  const strongTopics = topics.filter((t) => t.status === "strong");

  const latestEvaluation = evaluations && evaluations.length > 0 ? evaluations[0] : null;

  // Filter top 3 articles for clean display
  const topArticles = articles.slice(0, 3);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-12">
      {/* 1. SuperKalam Hero: AI Mentor Omnibar & Welcoming Greeting */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0e1422] via-[#0d121c] to-[#0a0e17] border border-slate-800/80 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 space-y-5">
          {/* Header Row: Welcoming & Aspirant Target */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
            <div>
              <div className="flex items-center space-x-2 text-amber-400 font-semibold text-xs tracking-wider uppercase mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>24/7 AI Study Mentor</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome back, {user.name}
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                Targeting <strong className="text-slate-200">{user.target}</strong> · Optional:{" "}
                <strong className="text-amber-300">{user.optionalSubject}</strong>
              </p>
            </div>

            <div className="flex items-center space-x-2 self-start sm:self-center">
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold">
                <Flame className="w-4 h-4 fill-orange-400" />
                <span>{user.studyStreakDays} Days Streak</span>
              </div>
              <button
                onClick={() => setIsIntelligenceOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                title="View Cognitive Diagnostics & Weak Area Breakdown"
              >
                <Brain className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">Cognitive</span>
                <span>Diagnostics</span>
              </button>
            </div>
          </div>

          {/* Iconic Ask Kalam / Bolt Omnibar */}
          <div className="space-y-3">
            <form onSubmit={handleOmnibarSubmit} className="relative group">
              <div className="relative flex items-center">
                <div className="absolute left-4 pointer-events-none flex items-center justify-center text-amber-400">
                  <Zap className="w-5 h-5 fill-amber-400/20" />
                </div>
                <input
                  type="text"
                  value={omnibarQuery}
                  onChange={(e) => setOmnibarQuery(e.target.value)}
                  placeholder="Ask your AI Mentor anything (e.g. 'Explain Weber's Bureaucracy', 'Evaluate my Mains answer', 'Generate 5 MCQs on Article 356')..."
                  className="w-full pl-12 pr-28 py-3.5 sm:py-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 focus:border-amber-500 text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 shadow-inner transition-all"
                />
                <button
                  type="submit"
                  disabled={!omnibarQuery.trim()}
                  className="absolute right-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 disabled:opacity-40 disabled:hover:from-amber-500 disabled:hover:to-indigo-600 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <span>Ask Mentor</span>
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </form>

            {/* Quick Action Suggestion Prompts (SuperKalam Style) */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap shrink-0">
                Suggested prompts:
              </span>
              {QUICK_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => onAskBolt(p.prompt)}
                  className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/90 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-medium flex items-center space-x-1.5 transition-colors shrink-0"
                >
                  <span>{p.icon}</span>
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Aspirant Daily Progress Ribbon (Clean, motivating & actionable) */}
      <section className="rounded-2xl bg-[#0d121c] border border-slate-800/80 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white">Daily Study Goal</h2>
                {isGoalAchieved ? (
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center space-x-1">
                    <Check className="w-3 h-3" />
                    <span>Goal Met Today!</span>
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">
                    {remainingHours}h remaining to reach target
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Target: <strong className="text-slate-200">{currentGoalHours} hours/day</strong> ·{" "}
                <span className="text-white font-bold">{todayAchievedHours}h</span> logged today ({todaySessions.length} sessions)
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => handleQuickLog(30, "Public Administration Core Revision")}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
              title="Add 30 minutes of study"
            >
              +30m Log
            </button>
            <button
              onClick={() => handleQuickLog(60, "GS & Current Affairs In-Depth Study")}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
              title="Add 1 hour of study"
            >
              +1h Log
            </button>
            <button
              onClick={() => onNavigate("planner")}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors flex items-center space-x-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Routine & Timer</span>
            </button>
          </div>
        </div>

        {/* The Visual Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isGoalAchieved
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                  : "bg-gradient-to-r from-amber-500 via-indigo-500 to-blue-500"
              }`}
              style={{ width: `${clampedGoalPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 px-1 font-medium">
            <span>0h (0%)</span>
            <span>{(currentGoalHours * 0.5).toFixed(1)}h (50%)</span>
            <span className={isGoalAchieved ? "text-emerald-400 font-bold" : ""}>
              {currentGoalHours}h Goal ({todayGoalPercentage}%)
            </span>
          </div>
        </div>
      </section>

      {/* 3. The 4 SuperKalam Core Study Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: 📰 Today's Current Affairs & Daily MCQs */}
        <div className="rounded-2xl bg-[#0d121c] border border-slate-800/80 p-5 flex flex-col justify-between shadow-sm hover:border-slate-700 transition-colors">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Newspaper className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Today's Current Affairs</h3>
                  <p className="text-[11px] text-slate-400">The Hindu · Indian Express · PIB · Livemint · DTE</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate("news")}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center space-x-1"
              >
                <span>All Articles</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Headlines Preview */}
            <div className="mt-3 space-y-2.5">
              {topArticles.length > 0 ? (
                topArticles.map((art) => (
                  <div
                    key={art.id}
                    onClick={() => onNavigate("news")}
                    className="p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 cursor-pointer transition-colors"
                  >
                    <p className="text-xs font-semibold text-slate-200 line-clamp-1">{art.headline}</p>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-1">
                      <span className="font-medium text-blue-400">{art.source}</span>
                      <span>·</span>
                      <span>{art.gsTags?.join(" · ") || "General Studies"}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400">
                  Daily articles cache loaded. Click below to read & solve daily MCQs.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-400 font-medium">5 Daily MCQs available</span>
            <button
              onClick={onStartTodayMCQs}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors flex items-center space-x-1.5"
            >
              <span>Solve Today's MCQs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 2: 🎯 Prelims Practice & PYQs Drill */}
        <div className="rounded-2xl bg-[#0d121c] border border-slate-800/80 p-5 flex flex-col justify-between shadow-sm hover:border-slate-700 transition-colors">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Prelims Practice Hub</h3>
                  <p className="text-[11px] text-slate-400">
                    {user.questionsAttempted} Attempted · {user.overallAccuracy || 0}% Accuracy
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate("pyqs")}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center space-x-1"
              >
                <span>PYQ Archive</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Daily Drill: Modern India & Polity</span>
                <span className="text-emerald-400 font-bold">10 Questions</span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2">
                Focus questions aligned to recurring UPSC themes: Constitutional bodies, Governor's discretion & Economic reforms.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-400 font-medium">Instant explanation & score</span>
            <button
              onClick={() => onNavigate("prelims")}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center space-x-1.5"
            >
              <span>Start 10 MCQs Drill</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 3: ✍️ Mains Daily Answer Writing */}
        <div className="rounded-2xl bg-[#0d121c] border border-slate-800/80 p-5 flex flex-col justify-between shadow-sm hover:border-slate-700 transition-colors">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Mains 7-Dimension Evaluation</h3>
                  <p className="text-[11px] text-slate-400">
                    {user.mainsEvaluatedCount || 0} Answers Graded by AI Mentor
                  </p>
                </div>
              </div>
              <button
                onClick={onViewEvaluation}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1"
              >
                <span>Evaluations</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="text-[10px] font-semibold text-indigo-400">
                Question of the Day · 15 Marks
              </span>
              <p className="text-xs font-semibold text-slate-200 line-clamp-2">
                "Critically evaluate the role of the Governor under Article 163 in light of recent judicial pronouncements and 2nd ARC recommendations."
              </p>
              <p className="text-[11px] text-slate-400">
                Thinkers to cite: Sarkaria Commission, Punchhi Commission, Supreme Court 2023 rulings.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-400 font-medium">Rubric: Structure, Thinkers, Tone</span>
            <button
              onClick={() => onNavigate("mains")}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors flex items-center space-x-1.5"
            >
              <span>Submit Answer for Review</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 4: 🔄 Spaced Repetition Due Today */}
        <div className="rounded-2xl bg-[#0d121c] border border-slate-800/80 p-5 flex flex-col justify-between shadow-sm hover:border-slate-700 transition-colors">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Spaced Repetition Alert</h3>
                  <p className="text-[11px] text-slate-400">Ebbinghaus Forgetting Curve Guard</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate("learn")}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center space-x-1"
              >
                <span>Syllabus Tree</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {weakTopics.slice(0, 2).map((t) => (
                <div
                  key={t.id}
                  className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-200">{t.name}</p>
                    <p className="text-[10px] text-slate-400">{t.paper} · Due for revision</p>
                  </div>
                  <button
                    onClick={() => onAskBoltAboutWeakness(t.name)}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-xs font-semibold transition-colors"
                  >
                    Revise with AI
                  </button>
                </div>
              ))}
              {weakTopics.length === 0 && (
                <div className="p-3 text-center text-xs text-slate-400 rounded-xl bg-slate-900/40 border border-slate-800">
                  ✓ All syllabus units currently within active memory retention threshold.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-400 font-medium">
              Overall syllabus coverage: <strong className="text-white">{overallCompletion}%</strong>
            </span>
            <button
              onClick={onStartRevision}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              Open Full Syllabus
            </button>
          </div>
        </div>
      </section>

      {/* 4. Specialized Study Tools Ecosystem Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Study Toolkit & Specialized Hubs
          </h2>
          <span className="text-xs text-slate-400">Integrated UPSC preparation tools</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Historical PYQ Archive */}
          <button
            onClick={() => onNavigate("pyqs")}
            className="p-4 rounded-2xl bg-[#0d121c] border border-slate-800 hover:border-slate-700 text-left transition-all hover:-translate-y-0.5 group shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <History className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
              Historical PYQs (1855–2026)
            </h4>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
              170+ years of civil service questions with peripheral area and current linkages.
            </p>
          </button>

          {/* NCERT Foundation Hub */}
          <button
            onClick={() => onNavigate("ncert")}
            className="p-4 rounded-2xl bg-[#0d121c] border border-slate-800 hover:border-slate-700 text-left transition-all hover:-translate-y-0.5 group shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
              NCERT Foundation (6–12)
            </h4>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
              Chapter-wise concept summaries, mindmap key points, and foundation quizzes.
            </p>
          </button>

          {/* Upload Notes & Quiz */}
          <button
            onClick={() => onNavigate("materials")}
            className="p-4 rounded-2xl bg-[#0d121c] border border-slate-800 hover:border-slate-700 text-left transition-all hover:-translate-y-0.5 group shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Upload className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
              Upload Notes & Quiz
            </h4>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
              Upload PDF / text files to automatically generate grounded tests and flashcards.
            </p>
          </button>

          {/* Concept Knowledge Graph */}
          <button
            onClick={() => onNavigate("knowledgeGraph")}
            className="p-4 rounded-2xl bg-[#0d121c] border border-slate-800 hover:border-slate-700 text-left transition-all hover:-translate-y-0.5 group shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Brain className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
              Concept Knowledge Graph
            </h4>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
              Interactive thinker networks, administrative theories, and syllabus interlinkages.
            </p>
          </button>
        </div>
      </section>

      {/* 5. Milestones & Achievements */}
      <MilestonesSection
        milestones={milestones}
        onNavigate={onNavigate}
        onAskBolt={onAskBolt}
      />

      {/* Cognitive Intelligence Diagnostics Modal */}
      <StudentIntelligenceModal
        isOpen={isIntelligenceOpen}
        onClose={() => setIsIntelligenceOpen(false)}
        user={user}
        topics={topics}
        onAskBoltTopic={onAskBolt}
        onPracticeTopic={() => {
          setIsIntelligenceOpen(false);
          onNavigate("prelims");
        }}
      />
    </div>
  );
};

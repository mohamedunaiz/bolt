import React, { useState, useEffect, useCallback, useRef } from "react";
import { Navigation } from "./components/Navigation";
import { HomeDashboard } from "./components/HomeDashboard";
import { SyllabusAnalyticsView } from "./components/SyllabusAnalyticsView";
import { PrelimsPracticeView } from "./components/PrelimsPracticeView";
import { MainsEvaluationView } from "./components/MainsEvaluationView";
import { NewsView } from "./components/NewsView";
import { TimetableAndTimerView } from "./components/TimetableAndTimerView";
import { BoltAssistantView } from "./components/BoltAssistantView";
import { KnowledgeBaseView } from "./components/KnowledgeBaseView";
import { KnowledgeGraphVisualization } from "./components/KnowledgeGraphVisualization";
import { MaterialUploadAndQuizView } from "./components/MaterialUploadAndQuizView";
import { NcertFoundationView } from "./components/NcertFoundationView";
import { HistoricalPyqView } from "./components/HistoricalPyqView";
import { PythonEngineConsoleModal } from "./components/PythonEngineConsoleModal";
import { SettingsModal } from "./components/SettingsModal";
import { SettingsView } from "./components/SettingsView";
import { AuthModal } from "./components/AuthModal";
import {
  initialUserProfile,
  publicAdminSyllabus,
  prelimsPracticeQuestions,
  mainsPYQsList,
} from "./data/upscData";
import { DEFAULT_TIMETABLE_SLOTS } from "./data/timetableData";
import {
  NavigationTab,
  PrelimsQuestion,
  NewsArticle,
  MainsAnswerEvaluation,
  UserProfile,
  SyllabusTopic,
  ActiveModelConfig,
  AppThemeMode,
  TimetableSlot,
  StudySessionLog,
  UserFullProgressData,
} from "./types";
import { DEFAULT_ACTIVE_MODEL_CONFIG } from "./data/modelsData";
import { loadUserProgress, saveUserProgress, logoutAccount, subscribeToAuthState, getCleanSyllabus, getCleanTimetableSlots } from "./services/userService";
import { cacheSyllabusOffline, cacheTimetableOffline, flushOfflineQueue } from "./services/offlineSyncService";
import { OfflineStatusIndicator } from "./components/OfflineStatusIndicator";
import { ScrollToTopButton } from "./components/ScrollToTopButton";
import { Search, Bookmark, X } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>("home");

  // Dynamic user profile with persistent storage
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem("bolt_current_user");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return initialUserProfile;
  });

  // Active Model Configuration with persistent storage
  const [activeModelConfig, setActiveModelConfig] = useState<ActiveModelConfig>(() => {
    try {
      const saved = localStorage.getItem("bolt_active_model_config");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_ACTIVE_MODEL_CONFIG;
  });

  // User Theme Mode state (High-Contrast Dark Mode vs Light Reading Mode)
  const [themeMode, setThemeMode] = useState<AppThemeMode>(() => {
    try {
      const savedTheme = localStorage.getItem("bolt_theme_mode");
      if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
      const savedUser = localStorage.getItem("bolt_current_user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed.themeMode === "light" || parsed.themeMode === "dark") return parsed.themeMode;
      }
    } catch (e) {}
    return user.themeMode || "dark";
  });

  // Apply theme class to document element and body for full styling support
  useEffect(() => {
    try {
      localStorage.setItem("bolt_theme_mode", themeMode);
    } catch (e) {}
    if (themeMode === "light") {
      document.documentElement.classList.add("theme-light");
      document.documentElement.classList.remove("theme-dark");
      document.body.classList.add("theme-light");
      document.body.classList.remove("theme-dark");
    } else {
      document.documentElement.classList.add("theme-dark");
      document.documentElement.classList.remove("theme-light");
      document.body.classList.add("theme-dark");
      document.body.classList.remove("theme-light");
    }
  }, [themeMode]);

  const handleToggleTheme = (mode?: AppThemeMode) => {
    const nextMode = mode || (themeMode === "dark" ? "light" : "dark");
    setThemeMode(nextMode);
    const updatedUser: UserProfile = {
      ...user,
      themeMode: nextMode,
    };
    handleUpdateUser(updatedUser);
  };

  // State with persistent storage
  const [topics, setTopics] = useState<SyllabusTopic[]>(() => {
    try {
      const saved = localStorage.getItem("bolt_topics");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return publicAdminSyllabus;
  });

  const [questions, setQuestions] = useState<PrelimsQuestion[]>(prelimsPracticeQuestions);
  const [modelAnswers, setModelAnswers] = useState(mainsPYQsList);

  // Mains evaluations - clean empty default (no mock fake answers)
  const [evaluations, setEvaluations] = useState<MainsAnswerEvaluation[]>(() => {
    try {
      const saved = localStorage.getItem("bolt_mains_evaluations");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [articles, setArticles] = useState<NewsArticle[]>(() => {
    try {
      const saved = localStorage.getItem("bolt_news_articles");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // Timetable slots
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>(() => {
    try {
      const saved = localStorage.getItem("bolt_custom_timetable_slots");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_TIMETABLE_SLOTS;
  });

  // Study session logs - clean empty default (no mock study sessions)
  const [studySessions, setStudySessions] = useState<StudySessionLog[]>(() => {
    try {
      const saved = localStorage.getItem("bolt_study_sessions");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Strictly filter out any mock session fixtures
          const clean = parsed.filter(
            (s: any) =>
              s &&
              s.id &&
              !s.id.startsWith("sess-today") &&
              !s.id.startsWith("sess-yest") &&
              !s.id.startsWith("sess-past")
          );
          if (clean.length !== parsed.length) {
            localStorage.setItem("bolt_study_sessions", JSON.stringify(clean));
          }
          return clean;
        }
      }
    } catch (e) {}
    return [];
  });

  // Modals & prompts
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<"signin" | "signup">("signin");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [boltInitialPrompt, setBoltInitialPrompt] = useState<string | null>(null);
  const [isPythonConsoleOpen, setIsPythonConsoleOpen] = useState<boolean>(false);

  // Debounced auto-save ref
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync helper that saves locally and sends to backend if user is logged in
  const triggerSaveProgress = useCallback(
    (overrides?: Partial<UserFullProgressData>) => {
      const currentUser = overrides?.user || user;
      const currentTopics = overrides?.topics || topics;
      const currentEvaluations = overrides?.evaluations || evaluations;
      const currentSlots = overrides?.timetableSlots || timetableSlots;
      const currentSessions = overrides?.studySessions || studySessions;

      // Always save to localStorage and offline CacheStorage
      try {
        localStorage.setItem("bolt_current_user", JSON.stringify(currentUser));
        localStorage.setItem("bolt_topics", JSON.stringify(currentTopics));
        localStorage.setItem("bolt_mains_evaluations", JSON.stringify(currentEvaluations));
        localStorage.setItem("bolt_custom_timetable_slots", JSON.stringify(currentSlots));
        localStorage.setItem("bolt_study_sessions", JSON.stringify(currentSessions));
        cacheSyllabusOffline(currentTopics);
        cacheTimetableOffline(currentSlots);
      } catch (e) {}

      // If user is authenticated with an email, sync with backend store
      if (currentUser.email) {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
          saveUserProgress({
            user: currentUser,
            topics: currentTopics,
            evaluations: currentEvaluations,
            timetableSlots: currentSlots,
            studySessions: currentSessions,
          }).catch((err) => {
            console.error("Auto-sync failed:", err);
          });
        }, 300);
      }
    },
    [user, topics, evaluations, timetableSlots, studySessions]
  );

  // Load user's saved data from Firestore / backend on mount and subscribe to Firebase Auth
  useEffect(() => {
    // 1. Listen to Firebase Auth state
    const unsubscribe = subscribeToAuthState(async (fbUser) => {
      if (fbUser) {
        const userId = fbUser.uid;
        const saved = await loadUserProgress(userId);
        if (saved) {
          if (saved.user) setUser(saved.user);
          if (saved.topics && saved.topics.length > 0) setTopics(saved.topics);
          if (saved.evaluations) setEvaluations(saved.evaluations);
          if (saved.timetableSlots && saved.timetableSlots.length > 0) setTimetableSlots(saved.timetableSlots);
          if (saved.studySessions) setStudySessions(saved.studySessions);
        } else {
          // New authenticated user with clean slate
          const newUserProfile: UserProfile = {
            id: userId,
            name: fbUser.displayName || fbUser.email?.split("@")[0] || "UPSC Aspirant",
            email: fbUser.email || "",
            avatarUrl: fbUser.photoURL || undefined,
            target: "UPSC CSE 2026",
            optionalSubject: "Public Administration",
            studyStreakDays: 1,
            totalStudyHours: 0,
            questionsAttempted: 0,
            mainsEvaluatedCount: 0,
            overallAccuracy: 0,
            themeMode: "dark",
          };
          setUser(newUserProfile);
          setTopics(getCleanSyllabus());
          setEvaluations([]);
          setTimetableSlots(getCleanTimetableSlots());
          setStudySessions([]);
        }
      }
    });

    // 2. Initial load for stored user if no immediate auth state change
    const targetId = user.id || user.email;
    if (targetId && !targetId.startsWith("guest")) {
      loadUserProgress(targetId).then((saved) => {
        if (saved) {
          if (saved.user) setUser(saved.user);
          if (saved.topics && saved.topics.length > 0) setTopics(saved.topics);
          if (saved.evaluations) setEvaluations(saved.evaluations);
          if (saved.timetableSlots && saved.timetableSlots.length > 0) setTimetableSlots(saved.timetableSlots);
          if (saved.studySessions) setStudySessions(saved.studySessions);
        }
      });
    }

    // 3. Prime offline caches for syllabus and timetable
    cacheSyllabusOffline(topics);
    cacheTimetableOffline(timetableSlots);
    flushOfflineQueue(targetId);

    return () => unsubscribe();
  }, []);

  // Update user profile helper
  const handleUpdateUser = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    triggerSaveProgress({ user: updatedUser });
  };

  const handleUpdateActiveModelConfig = (config: ActiveModelConfig) => {
    setActiveModelConfig(config);
    try {
      localStorage.setItem("bolt_active_model_config", JSON.stringify(config));
    } catch (e) {}
  };

  const revisionDueCount = topics.filter((t) => t.status === "needs_revision").length;

  const handleAskBolt = (promptText: string) => {
    setBoltInitialPrompt(promptText);
    setActiveTab("bolt");
  };

  const handleAskBoltAboutWeakness = (weaknessName: string) => {
    handleAskBolt(
      `I am struggling with ${weaknessName}. Analyze my specific weaknesses in this unit and explain the core concepts with 2nd ARC and thinker references.`
    );
  };

  const handleAskBoltQuestion = (q: PrelimsQuestion) => {
    handleAskBolt(
      `Explain Prelims Question: "${q.questionText}". Break down why Option ${q.correctOption} is correct and explain the related concept (${q.relatedConcept}).`
    );
  };

  const handleAskBoltArticle = (art: NewsArticle) => {
    handleAskBolt(
      `Break down the UPSC relevance of this news article: "${art.headline}". Provide 3 Prelims facts, 2 Mains dimensions, and how to use it in Public Administration / GS answers.`
    );
  };

  // Record prelims answer and update accuracy and count
  const handleRecordPrelimsAnswer = (questionId: string, isCorrect: boolean) => {
    const prevAttempted = user.questionsAttempted || 0;
    const prevAccuracy = user.overallAccuracy || 0;
    const prevCorrect = Math.round((prevAttempted * prevAccuracy) / 100);
    const newCorrect = prevCorrect + (isCorrect ? 1 : 0);
    const newAttempted = prevAttempted + 1;
    const newAccuracy = Math.round((newCorrect / newAttempted) * 100);

    const updatedUser: UserProfile = {
      ...user,
      questionsAttempted: newAttempted,
      overallAccuracy: newAccuracy,
    };

    handleUpdateUser(updatedUser);
  };

  // Mains evaluation save handler
  const handleSaveNewEvaluation = (newEval: MainsAnswerEvaluation) => {
    const updatedEvaluations = [newEval, ...evaluations];
    setEvaluations(updatedEvaluations);

    const updatedUser: UserProfile = {
      ...user,
      mainsEvaluatedCount: (user.mainsEvaluatedCount || 0) + 1,
    };
    setUser(updatedUser);

    triggerSaveProgress({
      user: updatedUser,
      evaluations: updatedEvaluations,
    });
  };

  // Syllabus topic update handler
  const handleUpdateTopic = (updatedTopic: SyllabusTopic) => {
    const updatedTopics = topics.map((t) => (t.id === updatedTopic.id ? updatedTopic : t));
    setTopics(updatedTopics);
    triggerSaveProgress({ topics: updatedTopics });
  };

  // Timetable update handler
  const handleUpdateTimetableSlots = (newSlots: TimetableSlot[]) => {
    setTimetableSlots(newSlots);
    triggerSaveProgress({ timetableSlots: newSlots });
  };

  // Study sessions update handler
  const handleUpdateStudySessions = (newSessions: StudySessionLog[]) => {
    setStudySessions(newSessions);
    triggerSaveProgress({ studySessions: newSessions });
  };

  // Sign out handler: save data, clear session, and reset to clean slate
  const handleLogout = async () => {
    if (user.email) {
      await saveUserProgress({
        user,
        topics,
        evaluations,
        timetableSlots,
        studySessions,
      });
    }
    logoutAccount();
    setUser(initialUserProfile);
    setTopics(publicAdminSyllabus);
    setEvaluations([]);
    setTimetableSlots(DEFAULT_TIMETABLE_SLOTS);
    setStudySessions([]);
    setActiveTab("home");
  };

  // Apply restored user & progress upon successful login
  const handleLoginSuccess = (loggedUser: UserProfile, progress?: UserFullProgressData) => {
    setUser(loggedUser);
    if (progress) {
      if (progress.topics && progress.topics.length > 0) setTopics(progress.topics);
      if (progress.evaluations) setEvaluations(progress.evaluations);
      if (progress.timetableSlots && progress.timetableSlots.length > 0)
        setTimetableSlots(progress.timetableSlots);
      if (progress.studySessions) setStudySessions(progress.studySessions);
    } else if (loggedUser.email) {
      loadUserProgress(loggedUser.email).then((saved) => {
        if (saved) {
          if (saved.user) setUser(saved.user);
          if (saved.topics && saved.topics.length > 0) setTopics(saved.topics);
          if (saved.evaluations) setEvaluations(saved.evaluations);
          if (saved.timetableSlots && saved.timetableSlots.length > 0)
            setTimetableSlots(saved.timetableSlots);
          if (saved.studySessions) setStudySessions(saved.studySessions);
        }
      });
    }
  };

  // Search Results
  const searchResults = searchQuery.trim()
    ? {
        topics: topics.filter(
          (t) =>
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.keyThinkers?.some((th) => th.toLowerCase().includes(searchQuery.toLowerCase()))
        ),
        questions: questions.filter(
          (q) =>
            q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.subject.toLowerCase().includes(searchQuery.toLowerCase())
        ),
        answers: modelAnswers.filter(
          (a) =>
            a.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.topic.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      }
    : null;

  return (
    <div
      className={`min-h-screen ${
        themeMode === "light"
          ? "bg-[#f8fafc] text-slate-900 theme-light"
          : "bg-[#090d16] text-slate-100 theme-dark"
      } flex flex-col font-sans selection:bg-blue-600 selection:text-white transition-colors duration-200`}
    >
      {/* Top Header & Mobile Bottom Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        themeMode={themeMode}
        onToggleTheme={handleToggleTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenBookmarks={() => setIsBookmarksOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        revisionDueCount={revisionDueCount}
        onOpenAuth={(mode) => {
          setAuthModalMode(mode || "signin");
          setIsAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        activeModelConfig={activeModelConfig}
        onOpenPythonConsole={() => setIsPythonConsoleOpen(true)}
      />

      {/* Offline Status & Caching Control Indicator */}
      <OfflineStatusIndicator topics={topics} timetableSlots={timetableSlots} />

      {/* Main Content Area */}
      <main className="flex-grow">
        {activeTab === "home" && (
          <HomeDashboard
            user={user}
            topics={topics}
            articles={articles}
            evaluations={evaluations}
            studySessions={studySessions}
            onUpdateUser={handleUpdateUser}
            onUpdateStudySessions={handleUpdateStudySessions}
            onNavigate={(tab) => setActiveTab(tab)}
            onAskBoltAboutWeakness={handleAskBoltAboutWeakness}
            onStartRevision={() => setActiveTab("learn")}
            onViewEvaluation={() => setActiveTab("mains")}
            onAskBolt={handleAskBolt}
            onStartTodayMCQs={() => setActiveTab("prelims")}
          />
        )}

        {activeTab === "learn" && (
          <SyllabusAnalyticsView
            topics={topics}
            user={user}
            onAskBoltTopic={(name) => handleAskBoltAboutWeakness(name)}
            onPracticeTopicMCQs={() => setActiveTab("prelims")}
          />
        )}

        {activeTab === "knowledge" && (
          <KnowledgeBaseView />
        )}

        {activeTab === "knowledgeGraph" && (
          <KnowledgeGraphVisualization
            user={user}
            onAskBoltTopic={(topicOrThinker) => handleAskBoltAboutWeakness(topicOrThinker)}
            onPracticePYQ={() => setActiveTab("mains")}
          />
        )}

        {activeTab === "prelims" && (
          <PrelimsPracticeView
            questions={questions}
            onAskBoltQuestion={handleAskBoltQuestion}
            onRecordAnswer={handleRecordPrelimsAnswer}
          />
        )}

        {activeTab === "pyqs" && (
          <HistoricalPyqView
            onAskBoltQuestion={handleAskBolt}
            onEvaluateAnswer={(questionText, answerText) => {
              setActiveTab("mains");
              handleAskBolt(`Please evaluate my answer for this official UPSC Mains question using the 7-dimension rubric:\n\nQuestion:\n${questionText}\n\nMy Written Answer:\n${answerText}`);
            }}
          />
        )}

        {activeTab === "mains" && (
          <MainsEvaluationView
            modelAnswers={modelAnswers}
            evaluations={evaluations}
            onAskBolt={handleAskBolt}
            onSaveNewEvaluation={handleSaveNewEvaluation}
            user={user}
          />
        )}

        {activeTab === "materials" && (
          <MaterialUploadAndQuizView />
        )}

        {activeTab === "ncert" && (
          <NcertFoundationView />
        )}

        {activeTab === "news" && (
          <NewsView
            articles={articles}
            onUpdateArticles={(newArticles) => {
              setArticles(newArticles);
              try {
                localStorage.setItem("bolt_news_articles", JSON.stringify(newArticles));
              } catch (e) {}
            }}
            onStartTodayMCQs={() => setActiveTab("prelims")}
            onAskBoltArticle={handleAskBoltArticle}
          />
        )}

        {(activeTab === "schedule" || activeTab === "planner") && (
          <TimetableAndTimerView
            user={user}
            topics={topics}
            onUpdateUser={handleUpdateUser}
            onUpdateTopic={handleUpdateTopic}
            onNavigate={(tab) => setActiveTab(tab)}
            onAskBolt={handleAskBolt}
            initialSubTab={activeTab === "planner" ? "planner" : undefined}
            timetableSlots={timetableSlots}
            onUpdateTimetableSlots={handleUpdateTimetableSlots}
            studySessions={studySessions}
            onUpdateStudySessions={handleUpdateStudySessions}
          />
        )}

        {activeTab === "bolt" && (
          <BoltAssistantView
            user={user}
            topics={topics}
            evaluations={evaluations}
            articles={articles}
            questions={questions}
            timetableSlots={timetableSlots}
            studySessions={studySessions}
            onNavigateTab={(tab) => setActiveTab(tab)}
            initialPrompt={boltInitialPrompt}
            onClearInitialPrompt={() => setBoltInitialPrompt(null)}
            activeModelConfig={activeModelConfig}
            onOpenModelSettings={() => setActiveTab("settings")}
          />
        )}

        {activeTab === "settings" && (
          <SettingsView
            user={user}
            onUpdateUser={handleUpdateUser}
            activeModelConfig={activeModelConfig}
            onUpdateActiveModelConfig={handleUpdateActiveModelConfig}
            onOpenAuth={(mode) => {
              setAuthModalMode(mode || "signin");
              setIsAuthModalOpen(true);
            }}
            themeMode={themeMode}
            onToggleTheme={handleToggleTheme}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        onUpdateUser={handleUpdateUser}
        activeModelConfig={activeModelConfig}
        onUpdateActiveModelConfig={handleUpdateActiveModelConfig}
        onOpenAuth={(mode) => {
          setAuthModalMode(mode || "signin");
          setIsAuthModalOpen(true);
        }}
        themeMode={themeMode}
        onToggleTheme={handleToggleTheme}
      />

      {/* Authentication Modal for Sign In / Sign Up */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={user}
        initialMode={authModalMode}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Interactive Python 3.10 Engine Diagnostic Terminal */}
      <PythonEngineConsoleModal
        isOpen={isPythonConsoleOpen}
        onClose={() => setIsPythonConsoleOpen(false)}
      />

      {/* Global Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
          <div className="bg-[#111723] rounded-2xl border border-[#1e293b] max-w-2xl w-full p-5 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-blue-400 font-bold text-sm">
                <Search className="w-4 h-4" />
                <span>Search Syllabus, PYQs & MCQs</span>
              </div>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Herbert Simon, Article 311, 2nd ARC, UPI MDR, etc..."
              className="w-full bg-[#0d121c] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            />

            {searchResults && (
              <div className="max-h-96 overflow-y-auto space-y-4 text-xs">
                {searchResults.topics.length > 0 && (
                  <div>
                    <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Syllabus Units ({searchResults.topics.length})
                    </h4>
                    <div className="space-y-1.5">
                      {searchResults.topics.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => {
                            setActiveTab("learn");
                            setIsSearchOpen(false);
                          }}
                          className="p-2.5 rounded-lg bg-[#162033] hover:bg-[#1f2d48] cursor-pointer flex justify-between items-center"
                        >
                          <span className="font-semibold text-slate-200">{t.name}</span>
                          <span className="text-blue-400 font-bold">{t.paper}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.answers.length > 0 && (
                  <div>
                    <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Mains Model Answers ({searchResults.answers.length})
                    </h4>
                    <div className="space-y-1.5">
                      {searchResults.answers.map((a) => (
                        <div
                          key={a.id}
                          onClick={() => {
                            setActiveTab("mains");
                            setIsSearchOpen(false);
                          }}
                          className="p-2.5 rounded-lg bg-[#162033] hover:bg-[#1f2d48] cursor-pointer"
                        >
                          <p className="font-semibold text-slate-200 line-clamp-1">
                            "{a.questionText}"
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {a.paper} • {a.marks} Marks
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bookmarks Modal */}
      {isBookmarksOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111723] rounded-2xl border border-[#1e293b] max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
                <Bookmark className="w-4 h-4 fill-amber-400" />
                <span>Saved Questions & Bookmarks</span>
              </div>
              <button
                onClick={() => setIsBookmarksOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div
                onClick={() => {
                  setActiveTab("mains");
                  setIsBookmarksOpen(false);
                }}
                className="p-3 rounded-xl bg-[#162033] hover:bg-[#1f2d48] cursor-pointer border border-slate-800 space-y-1"
              >
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Mains 2024 PYQ</span>
                  <span className="text-blue-400 font-bold">Paper 1</span>
                </div>
                <p className="font-semibold text-slate-200">
                  "Herbert Simon's concept of 'Bounded Rationality' revolutionized administrative
                  theory..."
                </p>
              </div>

              <div
                onClick={() => {
                  setActiveTab("prelims");
                  setIsBookmarksOpen(false);
                }}
                className="p-3 rounded-xl bg-[#162033] hover:bg-[#1f2d48] cursor-pointer border border-slate-800 space-y-1"
              >
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Prelims MCQ • Question 1</span>
                  <span className="text-emerald-400 font-bold">Economy</span>
                </div>
                <p className="font-semibold text-slate-200">
                  NPCI Merchant Discount Rate (MDR) for UPI transactions over ₹2,000.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsBookmarksOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page-Wide Smooth Scroll Button Component */}
      <ScrollToTopButton />
    </div>
  );
}

import React, { useState, useEffect, useRef } from "react";
import {
  BookOpen,
  GraduationCap,
  Award,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Filter,
  Layers,
  Compass,
  Check,
  X,
  Flame,
  Clock,
  ArrowRight,
  BookMarked,
  ShieldCheck,
  BarChart3,
  Bookmark,
  FileText,
  HelpCircle,
  Share2,
} from "lucide-react";
import { NcertChapter } from "../types";
import { ALL_NCERT_CHAPTERS } from "../data/ncertCurriculumData";
import {
  NcertCurriculumSection,
  ChapterStudyStatus,
} from "./ncert/NcertCurriculumSection";
import {
  saveFirebaseNcertProgress,
  getFirebaseNcertProgress,
} from "../services/firestoreService";
import { getStoredCurrentUser } from "../services/userService";

export const NcertFoundationView: React.FC = () => {
  const [chapters, setChapters] = useState<NcertChapter[]>(ALL_NCERT_CHAPTERS);
  const [selectedChapter, setSelectedChapter] = useState<NcertChapter>(ALL_NCERT_CHAPTERS[0]);
  const [activeMainView, setActiveMainView] = useState<"curriculum" | "study" | "quiz">("curriculum");
  const [isQuizActive, setIsQuizActive] = useState<boolean>(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, "A" | "B" | "C" | "D">>({});
  const [engineStatus, setEngineStatus] = useState<string>("Ready (Python 3.10 Engine)");

  // Persistent Chapter Study Statuses: unstudied | in_progress | completed | needs_revision
  const [chapterStatuses, setChapterStatuses] = useState<Record<string, ChapterStudyStatus>>(() => {
    try {
      const saved = localStorage.getItem("bolt_ncert_status");
      if (saved) return JSON.parse(saved);

      // Backwards compatibility with older completed chapters record
      const legacyCompleted = localStorage.getItem("bolt_ncert_completed");
      if (legacyCompleted) {
        const parsedLegacy = JSON.parse(legacyCompleted);
        const migrated: Record<string, ChapterStudyStatus> = {};
        Object.keys(parsedLegacy).forEach((id) => {
          if (parsedLegacy[id]) migrated[id] = "completed";
        });
        return migrated;
      }
      return {};
    } catch {
      return {};
    }
  });

  // Persistent Quiz Scores per chapter
  const [quizScores, setQuizScores] = useState<
    Record<string, { score: number; maxScore: number; timestamp: string }>
  >(() => {
    try {
      const saved = localStorage.getItem("bolt_ncert_quiz_scores");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const studyArenaRef = useRef<HTMLDivElement>(null);

  // Fetch updated chapters from Python API on mount if available
  useEffect(() => {
    const fetchChapters = async () => {
      try {
        const res = await fetch("/api/python/ncert/chapters");
        if (res.ok) {
          const data = await res.json();
          if (data.chapters && data.chapters.length > 0) {
            setChapters(data.chapters);
            setEngineStatus("Connected: Python 3.10 NCERT Engine");
          }
        }
      } catch (err) {
        console.info("Using embedded NCERT foundation curriculum data:", err);
      }
    };
    fetchChapters();
  }, []);

  // Load cloud progress from Firebase Firestore if user is authenticated
  useEffect(() => {
    const loadCloudProgress = async () => {
      const user = getStoredCurrentUser();
      const userId = user?.id || user?.email;
      if (!userId || userId === "aspirant-default") return;
      try {
        const cloudData = await getFirebaseNcertProgress(userId);
        if (cloudData && cloudData.chapterStatus) {
          setChapterStatuses((prev) => ({ ...prev, ...cloudData.chapterStatus }));
        }
        if (cloudData && cloudData.quizScores) {
          setQuizScores((prev) => ({ ...prev, ...cloudData.quizScores }));
        }
      } catch (e) {
        console.info("Could not fetch remote NCERT progress:", e);
      }
    };
    loadCloudProgress();
  }, []);

  // Update Status handler with local & Firebase synchronization
  const handleUpdateStatus = (chapterId: string, status: ChapterStudyStatus) => {
    setChapterStatuses((prev) => {
      const updated = { ...prev, [chapterId]: status };
      try {
        localStorage.setItem("bolt_ncert_status", JSON.stringify(updated));
        // Keep legacy key synced for older components
        const legacyCompleted: Record<string, boolean> = {};
        Object.entries(updated).forEach(([k, v]) => {
          if (v === "completed") legacyCompleted[k] = true;
        });
        localStorage.setItem("bolt_ncert_completed", JSON.stringify(legacyCompleted));
      } catch {}

      // Push to Firestore if authenticated
      const user = getStoredCurrentUser();
      const userId = user?.id || user?.email;
      if (userId && userId !== "aspirant-default") {
        const completedIds = Object.keys(updated).filter((k) => updated[k] === "completed");
        const inProgressIds = Object.keys(updated).filter((k) => updated[k] === "in_progress");
        const revisionIds = Object.keys(updated).filter((k) => updated[k] === "needs_revision");
        saveFirebaseNcertProgress(userId, {
          completedChapterIds: completedIds,
          inProgressChapterIds: inProgressIds,
          revisionChapterIds: revisionIds,
          chapterStatus: updated,
          lastSelectedChapterId: chapterId,
        });
      }

      return updated;
    });
  };

  // Chapter Selection handler
  const handleSelectChapter = (chapter: NcertChapter, autoStartQuiz: boolean = false) => {
    setSelectedChapter(chapter);
    setUserAnswers({});
    if (autoStartQuiz) {
      setActiveMainView("quiz");
      setIsQuizActive(true);
    } else {
      setActiveMainView("study");
      setIsQuizActive(false);
    }

    // Smooth scroll down to study arena if triggered from curriculum
    setTimeout(() => {
      if (studyArenaRef.current) {
        studyArenaRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  const handleSelectOption = (qId: string, optKey: "A" | "B" | "C" | "D") => {
    setUserAnswers((prev) => {
      const updated = { ...prev, [qId]: optKey };

      // Check if all questions are answered; if so, persist quiz score
      const allAnswered = selectedChapter.quizQuestions.every((q) => !!updated[q.id]);
      if (allAnswered) {
        let score = 0;
        selectedChapter.quizQuestions.forEach((q) => {
          if (updated[q.id] === q.correctOption) score += 2;
        });
        const maxScore = selectedChapter.quizQuestions.length * 2;
        const newRecord = {
          score,
          maxScore,
          timestamp: new Date().toISOString(),
        };

        setQuizScores((prevScores) => {
          const nextScores = { ...prevScores, [selectedChapter.id]: newRecord };
          try {
            localStorage.setItem("bolt_ncert_quiz_scores", JSON.stringify(nextScores));
          } catch {}

          const user = getStoredCurrentUser();
          const userId = user?.id || user?.email;
          if (userId && userId !== "aspirant-default") {
            saveFirebaseNcertProgress(userId, { quizScores: nextScores });
          }
          return nextScores;
        });

        // Automatically mark chapter as completed if score >= 70%
        if (score / maxScore >= 0.7) {
          handleUpdateStatus(selectedChapter.id, "completed");
        }
      }

      return updated;
    });
  };

  const calculateQuizScore = () => {
    let score = 0;
    selectedChapter.quizQuestions.forEach((q) => {
      if (userAnswers[q.id] === q.correctOption) score += 2;
    });
    return score;
  };

  const currentStatus = chapterStatuses[selectedChapter.id] || "unstudied";
  const recordedScore = quizScores[selectedChapter.id];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 animate-fadeIn">
      {/* SECTION 1: TOP NAVIGATION & VIEW SELECTOR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#232f45]">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveMainView("curriculum")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
              activeMainView === "curriculum"
                ? "bg-blue-600 text-white shadow-lg ring-1 ring-blue-400"
                : "bg-[#151b28] text-slate-300 hover:text-white border border-[#232f45]"
            }`}
          >
            <Layers className="w-4 h-4 text-blue-300" />
            <span>Curriculum Foundation Syllabus (Class 6-12)</span>
          </button>

          <button
            onClick={() => {
              setActiveMainView("study");
              setIsQuizActive(false);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
              activeMainView === "study" && !isQuizActive
                ? "bg-emerald-600 text-white shadow-lg ring-1 ring-emerald-400"
                : "bg-[#151b28] text-slate-300 hover:text-white border border-[#232f45]"
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-300" />
            <span>Active Study Workspace</span>
          </button>

          <button
            onClick={() => {
              setActiveMainView("quiz");
              setIsQuizActive(true);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
              activeMainView === "quiz" || isQuizActive
                ? "bg-purple-600 text-white shadow-lg ring-1 ring-purple-400"
                : "bg-[#151b28] text-slate-300 hover:text-white border border-[#232f45]"
            }`}
          >
            <Award className="w-4 h-4 text-purple-300" />
            <span>Chapter MCQ Quiz Arena</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-[11px]">{engineStatus}</span>
        </div>
      </div>

      {/* SECTION 2: NCERT FOUNDATION CURRICULUM SECTION (CLASS 6-12 & SUBJECTS) */}
      <div className={activeMainView === "curriculum" ? "block" : "space-y-4"}>
        <NcertCurriculumSection
          chapters={chapters}
          selectedChapter={selectedChapter}
          onSelectChapter={handleSelectChapter}
          chapterStatuses={chapterStatuses}
          onUpdateStatus={handleUpdateStatus}
          quizScores={quizScores}
        />
      </div>

      {/* SECTION 3: ACTIVE CHAPTER STUDY & QUIZ ARENA */}
      <div ref={studyArenaRef} className="pt-4 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-6 rounded-full bg-emerald-500" />
            <h3 className="text-lg font-bold text-white font-['Outfit']">
              Active Chapter Workspace: Class {selectedChapter.classNum} • {selectedChapter.subject}
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setActiveMainView("study");
                setIsQuizActive(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                !isQuizActive
                  ? "bg-emerald-600 text-white"
                  : "bg-[#151b28] text-slate-400 hover:text-white border border-[#232f45]"
              }`}
            >
              Study Notes & Mindmap
            </button>
            <button
              onClick={() => {
                setActiveMainView("quiz");
                setIsQuizActive(true);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                isQuizActive
                  ? "bg-emerald-600 text-white"
                  : "bg-[#151b28] text-slate-400 hover:text-white border border-[#232f45]"
              }`}
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Attend Quiz ({selectedChapter.quizQuestions.length})</span>
            </button>
          </div>
        </div>

        <div className="bg-[#151b28] border border-[#232f45] rounded-2xl p-6 shadow-xl space-y-6">
          {/* Chapter Metadata Banner */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#232f45]">
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                  Class {selectedChapter.classNum} NCERT
                </span>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {selectedChapter.subject}
                </span>
                {selectedChapter.gsPaper && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {selectedChapter.gsPaper}
                  </span>
                )}
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                    selectedChapter.upscWeightage === "Very High"
                      ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                      : "bg-blue-500/10 text-blue-300 border-blue-500/20"
                  }`}
                >
                  UPSC Weightage: {selectedChapter.upscWeightage}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white font-['Outfit']">
                Ch {selectedChapter.chapterNumber}: {selectedChapter.chapterTitle}
              </h2>
              <p className="text-xs text-slate-400">
                Textbook: <span className="text-slate-200 font-semibold">{selectedChapter.bookTitle}</span>
                {selectedChapter.estimatedReadMinutes && (
                  <span className="ml-3 text-slate-400">
                    ⏱ Approx. {selectedChapter.estimatedReadMinutes} min study
                  </span>
                )}
              </p>
            </div>

            {/* Study Status Action Matrix */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-xs text-slate-400 mr-1">Study Status:</div>
              {(["unstudied", "in_progress", "completed", "needs_revision"] as ChapterStudyStatus[]).map(
                (st) => {
                  const isCurrent = currentStatus === st;
                  return (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(selectedChapter.id, st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                        isCurrent
                          ? st === "completed"
                            ? "bg-emerald-600 text-white shadow-md ring-1 ring-emerald-400"
                            : st === "in_progress"
                            ? "bg-amber-600 text-white shadow-md ring-1 ring-amber-400"
                            : st === "needs_revision"
                            ? "bg-purple-600 text-white shadow-md ring-1 ring-purple-400"
                            : "bg-slate-700 text-white"
                          : "bg-[#101622] text-slate-400 hover:text-white border border-[#232f45]"
                      }`}
                    >
                      {st === "completed" && <Check className="w-3 h-3" />}
                      <span>
                        {st === "completed"
                          ? "Mastered"
                          : st === "in_progress"
                          ? "Reading"
                          : st === "needs_revision"
                          ? "Needs Revision"
                          : "Not Started"}
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* MODE A: STUDY NOTES & MINDMAPS */}
          {!isQuizActive && (
            <div className="space-y-6 animate-fadeIn">
              {/* High Yield Crux */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>High-Yield UPSC Examination Crux</span>
                </h3>
                <div className="p-4 rounded-xl bg-[#101622] border border-[#232f45] text-sm text-slate-200 leading-relaxed">
                  {selectedChapter.highYieldCrux}
                </div>
              </div>

              {/* Foundational Terms & Concepts */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center space-x-1.5">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Foundational NCERT Terms & Concepts ({selectedChapter.keyConcepts.length})</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedChapter.keyConcepts.map((concept, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-lg bg-[#101622] border border-[#232f45] text-xs font-medium text-slate-200 flex items-center space-x-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      <span>{concept}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Revision Mindmap Points */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center space-x-1.5">
                  <Compass className="w-4 h-4 text-amber-400" />
                  <span>Revision Mindmap Bullets</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {selectedChapter.mindmapPoints.map((pt, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[#101622] border border-[#232f45] text-xs text-slate-300 flex items-start space-x-2.5 leading-relaxed"
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Launch Quiz Callout */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-blue-950/40 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Award className="w-4 h-4 text-emerald-400" />
                    <span>Evaluate Foundational Understanding</span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Attend the {selectedChapter.quizQuestions.length} NCERT-grounded MCQs. Score at
                    least 70% to automatically earn chapter mastery.
                  </p>
                  {recordedScore && (
                    <div className="text-[11px] text-emerald-400 font-semibold mt-1">
                      Previous Score: {recordedScore.score} / {recordedScore.maxScore} Marks
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setIsQuizActive(true)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all whitespace-nowrap flex items-center space-x-1.5 shrink-0"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Chapter Quiz ({selectedChapter.quizQuestions.length} Qs)</span>
                </button>
              </div>
            </div>
          )}

          {/* MODE B: INTERACTIVE CHAPTER QUIZ */}
          {isQuizActive && (
            <div className="space-y-6 animate-fadeIn">
              {/* Quiz Score Header */}
              <div className="p-4 rounded-xl bg-[#101622] border border-[#232f45] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Current Attempt Score</div>
                    <div className="text-sm font-bold text-white">
                      {calculateQuizScore()} / {selectedChapter.quizQuestions.length * 2} Marks
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setUserAnswers({})}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 flex items-center space-x-1.5 transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Quiz</span>
                  </button>

                  <button
                    onClick={() => setIsQuizActive(false)}
                    className="px-3 py-1.5 rounded-lg bg-[#151b28] text-slate-300 hover:text-white border border-[#232f45] text-xs font-semibold"
                  >
                    Return to Study Notes
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-6">
                {selectedChapter.quizQuestions.map((q, qIndex) => {
                  const selected = userAnswers[q.id];
                  const isAnswered = !!selected;
                  const isCorrect = selected === q.correctOption;

                  return (
                    <div
                      key={q.id}
                      className="p-5 rounded-2xl bg-[#101622] border border-[#232f45] space-y-3.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 rounded bg-emerald-600/20 text-emerald-400 font-bold text-xs flex items-center justify-center">
                            {qIndex + 1}
                          </span>
                          <span className="text-xs text-slate-400 font-semibold">
                            UPSC Foundation Concept Question
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">2 Marks</span>
                      </div>

                      <p className="text-sm font-medium text-slate-100 whitespace-pre-line leading-relaxed">
                        {q.questionText}
                      </p>

                      <div className="space-y-2 pt-1">
                        {q.options.map((opt) => {
                          const isThisSelected = selected === opt.key;
                          const isThisCorrect = q.correctOption === opt.key;

                          let optStyle =
                            "bg-[#151c2a] border-[#232f45] text-slate-200 hover:border-emerald-500/50 hover:bg-[#182133]";

                          if (isAnswered) {
                            if (isThisCorrect) {
                              optStyle =
                                "bg-emerald-950/60 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500/40";
                            } else if (isThisSelected && !isThisCorrect) {
                              optStyle =
                                "bg-rose-950/60 border-rose-500 text-rose-200 ring-1 ring-rose-500/40";
                            } else {
                              optStyle =
                                "bg-[#151c2a]/40 border-[#232f45]/50 text-slate-400 opacity-60";
                            }
                          }

                          return (
                            <button
                              key={opt.key}
                              onClick={() => handleSelectOption(q.id, opt.key)}
                              className={`w-full p-3 rounded-xl border text-left text-xs font-medium flex items-start space-x-3 transition-all ${optStyle}`}
                            >
                              <span
                                className={`w-5 h-5 rounded text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                                  isAnswered && isThisCorrect
                                    ? "bg-emerald-500 text-white"
                                    : isAnswered && isThisSelected
                                    ? "bg-rose-500 text-white"
                                    : "bg-slate-800 text-slate-300"
                                }`}
                              >
                                {opt.key}
                              </span>
                              <span className="flex-1 leading-relaxed">{opt.text}</span>
                              {isAnswered && isThisCorrect && (
                                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              )}
                              {isAnswered && isThisSelected && !isThisCorrect && (
                                <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      {isAnswered && (
                        <div className="mt-3 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5 animate-fadeIn">
                          <div
                            className={`font-bold flex items-center space-x-1.5 ${
                              isCorrect ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {isCorrect ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <AlertCircle className="w-4 h-4" />
                            )}
                            <span>
                              {isCorrect
                                ? "Correct! UPSC standard conceptual grounding."
                                : `Incorrect. Option (${q.correctOption}) is the correct answer.`}
                            </span>
                          </div>
                          <p className="text-slate-300 leading-relaxed">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

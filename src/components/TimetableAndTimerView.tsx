import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Calendar,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  AlertCircle,
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Award,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Sliders,
  Check,
  Coffee,
  Brain,
  FileText,
  HelpCircle,
  RefreshCw,
  Sun,
  Moon,
  Briefcase,
  Target,
  Flame,
} from "lucide-react";
import {
  UserProfile,
  SyllabusTopic,
  NavigationTab,
  TimetableSlot,
  TimetablePreset,
  TimerMode,
  TimerPhase,
  AmbientSoundType,
  StudySessionLog,
  StudySubjectCategory,
} from "../types";
import { DEFAULT_TIMETABLE_SLOTS, TIMETABLE_PRESETS } from "../data/timetableData";
import { soundEngine } from "../utils/soundEngine";
import { StudyPlanner } from "./StudyPlanner";
import { cacheTimetableOffline } from "../services/offlineSyncService";

interface TimetableAndTimerViewProps {
  user: UserProfile;
  topics: SyllabusTopic[];
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onUpdateTopic?: (updated: SyllabusTopic) => void;
  onNavigate: (tab: NavigationTab) => void;
  onAskBolt?: (prompt: string) => void;
  initialSubTab?: "planner" | "timetable" | "timer" | "analytics";
  timetableSlots?: TimetableSlot[];
  onUpdateTimetableSlots?: (slots: TimetableSlot[]) => void;
  studySessions?: StudySessionLog[];
  onUpdateStudySessions?: (sessions: StudySessionLog[]) => void;
}

const STORAGE_TIMETABLE_KEY = "bolt_custom_timetable_slots";
const STORAGE_SESSIONS_KEY = "bolt_study_sessions";

export const TimetableAndTimerView: React.FC<TimetableAndTimerViewProps> = ({
  user,
  topics,
  onUpdateUser,
  onUpdateTopic = () => {},
  onNavigate,
  onAskBolt = () => {},
  initialSubTab = "planner",
  timetableSlots,
  onUpdateTimetableSlots,
  studySessions,
  onUpdateStudySessions,
}) => {
  // Main view tab: "planner" | "timetable" | "timer" | "analytics"
  const [activeSubTab, setActiveSubTab] = useState<"planner" | "timetable" | "timer" | "analytics">(
    initialSubTab
  );

  // Timetable State
  const [slots, setSlots] = useState<TimetableSlot[]>(() => {
    if (timetableSlots && timetableSlots.length > 0) {
      return timetableSlots;
    }
    try {
      const saved = localStorage.getItem(STORAGE_TIMETABLE_KEY);
      if (saved) {
        const parsed: TimetableSlot[] = JSON.parse(saved);
        return parsed.map((s) => {
          const match = DEFAULT_TIMETABLE_SLOTS.find((d) => d.id === s.id || d.title === s.title);
          return {
            ...s,
            syllabusUnitTitle: s.syllabusUnitTitle || match?.syllabusUnitTitle,
            estimatedMinutes: s.estimatedMinutes !== undefined ? s.estimatedMinutes : match?.estimatedMinutes,
            timeSpentMinutes: s.timeSpentMinutes !== undefined ? s.timeSpentMinutes : (match?.timeSpentMinutes || 0),
          };
        });
      }
    } catch (e) {}
    return DEFAULT_TIMETABLE_SLOTS;
  });

  // Sync slots when prop changes
  useEffect(() => {
    if (timetableSlots && timetableSlots.length > 0) {
      setSlots(timetableSlots);
    }
  }, [timetableSlots]);

  const [activePresetId, setActivePresetId] = useState<string>("full-time");
  const [activeFocusedSlotId, setActiveFocusedSlotId] = useState<string | null>(null);
  const [isAddSlotOpen, setIsAddSlotOpen] = useState<boolean>(false);
  const [newSlotStart, setNewSlotStart] = useState<string>("15:00");
  const [newSlotEnd, setNewSlotEnd] = useState<string>("16:30");
  const [newSlotTitle, setNewSlotTitle] = useState<string>("");
  const [newSlotSubject, setNewSlotSubject] = useState<StudySubjectCategory>("pub_ad");
  const [newSlotNotes, setNewSlotNotes] = useState<string>("");
  const [newSlotPriority, setNewSlotPriority] = useState<"high" | "medium" | "low">("high");
  const [newSlotSyllabusUnit, setNewSlotSyllabusUnit] = useState<string>("");
  const [newSlotEstimatedMin, setNewSlotEstimatedMin] = useState<number>(90);
  const [newSlotSpentMin, setNewSlotSpentMin] = useState<number>(0);

  // Save timetable helper
  const saveSlots = (newSlots: TimetableSlot[]) => {
    setSlots(newSlots);
    if (onUpdateTimetableSlots) {
      onUpdateTimetableSlots(newSlots);
    }
    try {
      localStorage.setItem(STORAGE_TIMETABLE_KEY, JSON.stringify(newSlots));
      cacheTimetableOffline(newSlots);
    } catch (e) {}
  };

  // Study Sessions History State - clean empty list default (no mock sessions)
  const [sessions, setSessions] = useState<StudySessionLog[]>(() => {
    if (studySessions) return studySessions;
    try {
      const saved = localStorage.getItem(STORAGE_SESSIONS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    if (studySessions) {
      setSessions(studySessions);
    }
  }, [studySessions]);

  const saveSessions = (newSessions: StudySessionLog[]) => {
    setSessions(newSessions);
    if (onUpdateStudySessions) {
      onUpdateStudySessions(newSessions);
    }
    try {
      localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(newSessions));
    } catch (e) {}
  };

  // ----------------------------------------------------
  // STUDY TIMER ENGINE STATE
  // ----------------------------------------------------
  const [timerMode, setTimerMode] = useState<TimerMode>("deep_work"); // 50m / 10m
  const [timerPhase, setTimerPhase] = useState<TimerPhase>("focus");
  const [durationSeconds, setDurationSeconds] = useState<number>(50 * 60);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(50 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [stopwatchSeconds, setStopwatchSeconds] = useState<number>(0);

  // Timer Context
  const [selectedSubject, setSelectedSubject] = useState<StudySubjectCategory>("pub_ad");
  const [activeTopicName, setActiveTopicName] = useState<string>("Herbert Simon – Decision-Making Theory");
  const [pomodoroCount, setPomodoroCount] = useState<number>(0);
  const [ambientSound, setAmbientSound] = useState<AmbientSoundType>("none");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [loggedNotification, setLoggedNotification] = useState<string | null>(null);

  // Keep track of current system time for active slot detection
  const [currentTimeStr, setCurrentTimeStr] = useState<string>(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTimeStr(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Timer Mode Preset Switcher
  const applyTimerMode = (mode: TimerMode) => {
    setTimerMode(mode);
    setTimerPhase("focus");
    setIsTimerRunning(false);
    if (mode === "pomodoro") {
      setDurationSeconds(25 * 60);
      setSecondsRemaining(25 * 60);
    } else if (mode === "deep_work") {
      setDurationSeconds(50 * 60);
      setSecondsRemaining(50 * 60);
    } else if (mode === "mains_sim") {
      setDurationSeconds(90 * 60); // 90 mins UPSC Mains simulation
      setSecondsRemaining(90 * 60);
    } else if (mode === "stopwatch") {
      setStopwatchSeconds(0);
    }
  };

  // Sound Effect Handler on Ambient Change
  useEffect(() => {
    if (isTimerRunning && ambientSound !== "none") {
      soundEngine.setAmbient(ambientSound, 0.18);
    } else {
      soundEngine.stopAmbient();
    }
    return () => {
      soundEngine.stopAmbient();
    };
  }, [ambientSound, isTimerRunning]);

  // Main Timer Countdown / Stopwatch Tick
  useEffect(() => {
    let interval: any = null;

    if (isTimerRunning) {
      interval = setInterval(() => {
        if (timerMode === "stopwatch") {
          setStopwatchSeconds((prev) => prev + 1);
        } else {
          setSecondsRemaining((prev) => {
            if (prev <= 1) {
              // Timer Complete!
              soundEngine.playCompletionChime();
              handlePhaseCompletion();
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerMode, timerPhase]);

  // Phase Completion logic (Pomodoro cycle)
  const handlePhaseCompletion = () => {
    setIsTimerRunning(false);
    if (timerPhase === "focus") {
      const nextCount = pomodoroCount + 1;
      setPomodoroCount(nextCount);

      // Auto-log the completed session time
      const minutesCompleted = Math.round(durationSeconds / 60);
      logCompletedSession(minutesCompleted);

      // Next phase: short break or long break (every 4 cycles)
      if (nextCount % 4 === 0) {
        setTimerPhase("long_break");
        setDurationSeconds(15 * 60);
        setSecondsRemaining(15 * 60);
      } else {
        setTimerPhase("short_break");
        setDurationSeconds(5 * 60);
        setSecondsRemaining(5 * 60);
      }
    } else {
      // Break over, back to focus
      setTimerPhase("focus");
      if (timerMode === "pomodoro") {
        setDurationSeconds(25 * 60);
        setSecondsRemaining(25 * 60);
      } else if (timerMode === "deep_work") {
        setDurationSeconds(50 * 60);
        setSecondsRemaining(50 * 60);
      }
    }
  };

  // Log session to user analytics and session history
  const logCompletedSession = (minutes: number) => {
    if (minutes < 1) return;

    const newLog: StudySessionLog = {
      id: "sess-" + Date.now(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      date: new Date().toISOString().split("T")[0],
      subject: selectedSubject,
      topic: activeTopicName,
      durationMinutes: minutes,
      mode: timerMode,
    };

    saveSessions([newLog, ...sessions]);

    // Update user's study hours
    const addedHours = parseFloat((minutes / 60).toFixed(2));
    onUpdateUser({
      totalStudyHours: parseFloat(((user.totalStudyHours || 0) + addedHours).toFixed(1)),
    });

    // Automatically update time spent on the active/focused scheduled study block
    const targetSlotId = activeFocusedSlotId || slots.find((s) => s.title === activeTopicName || s.syllabusUnitTitle === activeTopicName)?.id;
    if (targetSlotId) {
      const updatedSlots = slots.map((s) => {
        if (s.id === targetSlotId) {
          const est = s.estimatedMinutes && s.estimatedMinutes > 0 ? s.estimatedMinutes : calculateSlotDurationMinutes(s.startTime, s.endTime);
          const nextSpent = (s.timeSpentMinutes || 0) + minutes;
          return {
            ...s,
            timeSpentMinutes: nextSpent,
            isCompleted: nextSpent >= est ? true : s.isCompleted,
          };
        }
        return s;
      });
      saveSlots(updatedSlots);
    }

    // If Pub Ad or Prelims, update daily goals in localStorage
    try {
      const savedGoals = localStorage.getItem("bolt_daily_study_goals");
      if (savedGoals) {
        const parsed = JSON.parse(savedGoals);
        if (selectedSubject === "pub_ad" && parsed.pubAdGoal) {
          parsed.pubAdGoal.completedHours = parseFloat(
            ((parsed.pubAdGoal.completedHours || 0) + addedHours).toFixed(2)
          );
        } else if (selectedSubject === "prelims" && parsed.prelimsGoal) {
          parsed.prelimsGoal.completedHours = parseFloat(
            ((parsed.prelimsGoal.completedHours || 0) + addedHours).toFixed(2)
          );
        }
        localStorage.setItem("bolt_daily_study_goals", JSON.stringify(parsed));
      }
    } catch (e) {}

    setLoggedNotification(
      `Logged ${minutes} mins for "${activeTopicName}" (+${addedHours}h added to your UPSC streak)!`
    );
    setTimeout(() => setLoggedNotification(null), 5000);
  };

  // Manual session logging (for stopwatch or partial sessions)
  const handleManualLogSession = () => {
    let minutesToLog = 0;
    if (timerMode === "stopwatch") {
      minutesToLog = Math.round(stopwatchSeconds / 60);
      setStopwatchSeconds(0);
    } else {
      const elapsedSeconds = durationSeconds - secondsRemaining;
      minutesToLog = Math.round(elapsedSeconds / 60);
      // Reset timer
      setSecondsRemaining(durationSeconds);
    }

    setIsTimerRunning(false);
    soundEngine.stopAmbient();

    if (minutesToLog < 1) {
      setLoggedNotification("Session too short to log (minimum 1 minute required).");
      setTimeout(() => setLoggedNotification(null), 3500);
      return;
    }

    logCompletedSession(minutesToLog);
  };

  // Reset timer
  const handleResetTimer = () => {
    soundEngine.playClick();
    setIsTimerRunning(false);
    soundEngine.stopAmbient();
    if (timerMode === "stopwatch") {
      setStopwatchSeconds(0);
    } else {
      setSecondsRemaining(durationSeconds);
    }
  };

  // Toggle timer play/pause
  const handleToggleTimer = () => {
    soundEngine.playClick();
    setIsTimerRunning(!isTimerRunning);
  };

  // Helper format seconds to mm:ss or hh:mm:ss
  const formatTime = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  // Calculate percentage of timer progress for SVG circular bar
  const timerPercentage = useMemo(() => {
    if (timerMode === "stopwatch") return 100;
    if (durationSeconds === 0) return 0;
    return Math.max(0, Math.min(100, ((durationSeconds - secondsRemaining) / durationSeconds) * 100));
  }, [durationSeconds, secondsRemaining, timerMode]);

  // Determine current active slot based on local time
  const currentActiveSlot = useMemo(() => {
    const toMinutes = (timeStr: string) => {
      const [h, m] = timeStr.split(":").map(Number);
      return h * 60 + m;
    };
    const nowMin = toMinutes(currentTimeStr);

    return (
      slots.find((slot) => {
        const startMin = toMinutes(slot.startTime);
        const endMin = toMinutes(slot.endTime);
        return nowMin >= startMin && nowMin < endMin;
      }) || null
    );
  }, [slots, currentTimeStr]);

  // Helper to calculate duration in minutes between startTime and endTime
  const calculateSlotDurationMinutes = (startTime: string, endTime: string): number => {
    try {
      const [sh, sm] = startTime.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);
      let diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff < 0) diff += 24 * 60; // handles overnight study slot
      return diff > 0 ? diff : 60;
    } catch {
      return 60;
    }
  };

  // Helper to format minutes into clean readable notation (e.g. 1h 30m or 45m)
  const formatMinutes = (mins: number): string => {
    if (mins <= 0) return "0m";
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  // Calculate syllabus unit progress for any scheduled study block
  const getSlotUnitProgress = (slot: TimetableSlot) => {
    const estimated =
      slot.estimatedMinutes && slot.estimatedMinutes > 0
        ? slot.estimatedMinutes
        : calculateSlotDurationMinutes(slot.startTime, slot.endTime);

    // Derive syllabus unit title
    let unitTitle = slot.syllabusUnitTitle;
    if (!unitTitle) {
      const matched = topics.find((t) => {
        const tLower = t.name.toLowerCase();
        return (
          slot.title.toLowerCase().includes(tLower) ||
          slot.topicNotes.toLowerCase().includes(tLower) ||
          t.subtopics?.some(
            (sub) =>
              slot.topicNotes.toLowerCase().includes(sub.name.toLowerCase()) ||
              slot.title.toLowerCase().includes(sub.name.toLowerCase())
          )
        );
      });
      if (matched) {
        unitTitle = `${matched.paper}: ${matched.name}`;
      } else {
        unitTitle = slot.title;
      }
    }

    let spent = typeof slot.timeSpentMinutes === "number" ? slot.timeSpentMinutes : 0;
    if (slot.isCompleted && spent < estimated) {
      spent = estimated;
    }

    // Also match against logged sessions if session duration is higher
    const matchingSessions = sessions.filter((s) => {
      const sTopic = s.topic.toLowerCase();
      return (
        sTopic.includes(slot.title.toLowerCase()) ||
        slot.topicNotes.toLowerCase().includes(sTopic) ||
        (unitTitle && sTopic.includes(unitTitle.toLowerCase()))
      );
    });
    const sessionSpent = matchingSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    if (sessionSpent > spent) {
      spent = sessionSpent;
    }

    const percentage =
      estimated > 0
        ? Math.min(100, Math.round((spent / estimated) * 100))
        : slot.isCompleted
        ? 100
        : 0;
    const remaining = Math.max(0, estimated - spent);

    return {
      estimatedMinutes: estimated,
      timeSpentMinutes: spent,
      percentage,
      unitTitle,
      remainingMinutes: remaining,
      isFullyCompleted: percentage >= 100 || !!slot.isCompleted,
    };
  };

  // Quick log time increment for a specific scheduled study block (+15m or +30m)
  const handleQuickLogTime = (slotId: string, additionalMinutes: number) => {
    soundEngine.playClick();
    const targetSlot = slots.find((s) => s.id === slotId);
    if (!targetSlot) return;

    const est =
      targetSlot.estimatedMinutes && targetSlot.estimatedMinutes > 0
        ? targetSlot.estimatedMinutes
        : calculateSlotDurationMinutes(targetSlot.startTime, targetSlot.endTime);
    const currentSpent = targetSlot.timeSpentMinutes || 0;
    const newSpent = currentSpent + additionalMinutes;
    const isNowCompleted = newSpent >= est ? true : targetSlot.isCompleted;

    const updated = slots.map((s) =>
      s.id === slotId
        ? {
            ...s,
            timeSpentMinutes: newSpent,
            isCompleted: isNowCompleted,
          }
        : s
    );
    saveSlots(updated);

    // Also log to session history
    const newLog: StudySessionLog = {
      id: "sess-" + Date.now(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      date: new Date().toISOString().split("T")[0],
      subject: targetSlot.subject,
      topic: targetSlot.syllabusUnitTitle || targetSlot.title,
      durationMinutes: additionalMinutes,
      mode: "deep_work",
      notes: `Progress logged for ${targetSlot.syllabusUnitTitle || targetSlot.title}.`,
    };
    saveSessions([newLog, ...sessions]);

    // Update user study hours
    const addedHours = parseFloat((additionalMinutes / 60).toFixed(2));
    onUpdateUser({
      totalStudyHours: parseFloat(((user.totalStudyHours || 0) + addedHours).toFixed(1)),
    });

    const newPct = Math.min(100, Math.round((newSpent / est) * 100));
    setLoggedNotification(
      `+${additionalMinutes}m logged for "${targetSlot.title}" (${newPct}% completed)!`
    );
    setTimeout(() => setLoggedNotification(null), 4000);
  };

  // Load a slot directly into the study timer and switch to timer view
  const handleStartTimerForSlot = (slot: TimetableSlot) => {
    soundEngine.playClick();
    setActiveFocusedSlotId(slot.id);
    setSelectedSubject(slot.subject);
    setActiveTopicName(slot.syllabusUnitTitle || slot.title);
    applyTimerMode("deep_work");
    setActiveSubTab("timer");
    setIsTimerRunning(true);
  };

  // Apply Routine Preset
  const handleApplyPreset = (preset: TimetablePreset) => {
    setActivePresetId(preset.id);
    setActiveFocusedSlotId(null);
    saveSlots(preset.slots);
  };

  // Toggle Slot Done
  const handleToggleSlotCompleted = (id: string) => {
    soundEngine.playClick();
    const updated = slots.map((s) => {
      if (s.id === id) {
        const willComplete = !s.isCompleted;
        const est =
          s.estimatedMinutes && s.estimatedMinutes > 0
            ? s.estimatedMinutes
            : calculateSlotDurationMinutes(s.startTime, s.endTime);
        return {
          ...s,
          isCompleted: willComplete,
          timeSpentMinutes: willComplete ? Math.max(s.timeSpentMinutes || 0, est) : s.timeSpentMinutes,
        };
      }
      return s;
    });
    saveSlots(updated);
  };

  // Add custom slot
  const handleAddCustomSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlotTitle.trim()) return;

    const estMin =
      Number(newSlotEstimatedMin) > 0
        ? Number(newSlotEstimatedMin)
        : calculateSlotDurationMinutes(newSlotStart, newSlotEnd);
    const spentMin = Number(newSlotSpentMin) >= 0 ? Number(newSlotSpentMin) : 0;

    const newSlot: TimetableSlot = {
      id: "slot-" + Date.now(),
      startTime: newSlotStart,
      endTime: newSlotEnd,
      title: newSlotTitle.trim(),
      subject: newSlotSubject,
      topicNotes: newSlotNotes.trim() || "Targeted study session",
      priority: newSlotPriority,
      isCompleted: spentMin >= estMin && estMin > 0,
      dayOfWeek: "all",
      syllabusUnitTitle: newSlotSyllabusUnit.trim() || newSlotTitle.trim(),
      estimatedMinutes: estMin,
      timeSpentMinutes: spentMin,
    };

    // Sort by startTime
    const updated = [...slots, newSlot].sort((a, b) => a.startTime.localeCompare(b.startTime));
    saveSlots(updated);
    setIsAddSlotOpen(false);
    setNewSlotTitle("");
    setNewSlotNotes("");
    setNewSlotSyllabusUnit("");
    setNewSlotEstimatedMin(90);
    setNewSlotSpentMin(0);
  };

  // Remove custom slot
  const handleRemoveSlot = (id: string) => {
    const updated = slots.filter((s) => s.id !== id);
    saveSlots(updated);
  };

  // Subject label & badge styling mapping
  const getSubjectBadge = (subj: StudySubjectCategory) => {
    switch (subj) {
      case "pub_ad":
        return { label: "Public Administration", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
      case "prelims":
        return { label: "Prelims Drills", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" };
      case "mains":
        return { label: "Mains Writing", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
      case "current_affairs":
        return { label: "Current Affairs", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
      case "gs_core":
        return { label: "General Studies", color: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30" };
      case "revision":
        return { label: "Flashcards & Revision", color: "bg-rose-500/20 text-rose-400 border-rose-500/30" };
      case "csat":
        return { label: "CSAT Paper 2", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" };
      default:
        return { label: "Study Block", color: "bg-slate-700 text-slate-300 border-slate-600" };
    }
  };

  // Calculate total scheduled hours
  const totalScheduledHours = useMemo(() => {
    const toMinutes = (timeStr: string) => {
      const [h, m] = timeStr.split(":").map(Number);
      return h * 60 + m;
    };
    const sumMin = slots.reduce((acc, slot) => {
      const diff = toMinutes(slot.endTime) - toMinutes(slot.startTime);
      return acc + (diff > 0 ? diff : 0);
    }, 0);
    return (sumMin / 60).toFixed(1);
  }, [slots]);

  const completedSlotsCount = slots.filter((s) => s.isCompleted).length;

  return (
    <div className={`space-y-6 max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-12 ${isFullscreen ? "fixed inset-0 z-50 bg-[#0a0e17] p-6 overflow-y-auto" : ""}`}>
      {/* Top Banner Header */}
      <div className="bg-[#111723] rounded-2xl border border-[#1e293b] p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold mb-1">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Time Management & Discipline Center</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Active Time: {currentTimeStr}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              ✓ Offline Cached
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-['Outfit']">
            Timetable, Daily Schedules & Focus Study Timer
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5 max-w-2xl">
            Customizable UPSC routines, real-time slot tracking, and deep-work Pomodoro timer with automatic streak logging.
          </p>
        </div>

        {/* Sub-tab Switcher: Planner / Timetable / Timer / Analytics */}
        <div className="flex flex-wrap items-center bg-[#151b28] p-1.5 rounded-xl border border-[#232f45] gap-1 self-start md:self-auto">
          <button
            onClick={() => setActiveSubTab("planner")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
              activeSubTab === "planner"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-300 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Weekly Study Planner</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-extrabold hidden sm:inline">
              Drag & Drop
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab("timetable")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
              activeSubTab === "timetable"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-300 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Daily Schedule</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded bg-slate-900/60 text-slate-300">
              {completedSlotsCount}/{slots.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab("timer")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
              activeSubTab === "timer"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-300 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Brain className="w-3.5 h-3.5 text-amber-400" />
            <span>Focus Timer</span>
            {isTimerRunning && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping ml-1" />
            )}
          </button>

          <button
            onClick={() => setActiveSubTab("analytics")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
              activeSubTab === "analytics"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-300 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Session Logs</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {loggedNotification && (
        <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/50 text-emerald-300 text-xs sm:text-sm font-semibold flex items-center space-x-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{loggedNotification}</span>
        </div>
      )}

      {/* ==================================================== */}
      {/* VIEW 0: WEEKLY STUDY PLANNER (DRAG & DROP)           */}
      {/* ==================================================== */}
      {activeSubTab === "planner" && (
        <StudyPlanner
          user={user}
          topics={topics}
          onUpdateUser={onUpdateUser}
          onUpdateTopic={onUpdateTopic}
          onNavigate={onNavigate}
          onAskBolt={onAskBolt}
        />
      )}

      {/* ==================================================== */}
      {/* VIEW 1: TIMETABLE & DAILY SCHEDULE                  */}
      {/* ==================================================== */}
      {activeSubTab === "timetable" && (
        <div className="space-y-6">
          {/* Ongoing Slot Alert (if user is currently in a scheduled time block) */}
          {currentActiveSlot ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-950/70 via-indigo-950/50 to-[#111723] border border-blue-500/40 shadow-lg flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                      Current Scheduled Time Block ({currentActiveSlot.startTime} – {currentActiveSlot.endTime})
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    {currentActiveSlot.title}
                  </h3>
                  <p className="text-xs text-slate-300">{currentActiveSlot.topicNotes}</p>
                </div>

                <div className="flex items-center space-x-2 self-start sm:self-auto flex-shrink-0">
                  <button
                    onClick={() => handleStartTimerForSlot(currentActiveSlot)}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center space-x-2 shadow-lg shadow-blue-600/30 transition-all hover:scale-105"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Start Focus Timer</span>
                  </button>
                </div>
              </div>

              {/* Visual Progress for Ongoing Slot */}
              {(() => {
                const activeProgress = getSlotUnitProgress(currentActiveSlot);
                return (
                  <div className="pt-2.5 border-t border-blue-500/20 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center space-x-2">
                        <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-slate-300 font-medium">Syllabus Unit: {activeProgress.unitTitle}</span>
                        <span className="text-slate-400 font-mono">
                          • Spent: {formatMinutes(activeProgress.timeSpentMinutes)} / {formatMinutes(activeProgress.estimatedMinutes)} req.
                        </span>
                      </div>
                      <span
                        className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] border ${
                          activeProgress.isFullyCompleted
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                        }`}
                      >
                        {activeProgress.percentage}% Completed
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-900/80 overflow-hidden border border-blue-500/30">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ease-out ${
                          activeProgress.isFullyCompleted
                            ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                            : "bg-gradient-to-r from-blue-500 to-indigo-400"
                        }`}
                        style={{ width: `${Math.min(100, activeProgress.percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-[#111723] border border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>No scheduled slot active right now. Next slot or free revision block.</span>
              </div>
              <button
                onClick={() => setActiveSubTab("timer")}
                className="text-blue-400 hover:text-blue-300 font-semibold"
              >
                Launch Quick Timer →
              </button>
            </div>
          )}

          {/* Routine Presets Selector Bar */}
          <div className="bg-[#111723] rounded-2xl border border-[#1e293b] p-4 sm:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>UPSC Routine Presets & Schedules</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Choose an established topper schedule or create your own custom time blocks.
                </p>
              </div>

              <button
                onClick={() => setIsAddSlotOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md shadow-blue-600/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Time Slot</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
              {TIMETABLE_PRESETS.map((preset) => {
                const isActive = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isActive
                        ? "bg-[#18253d] border-blue-500 ring-1 ring-blue-500 shadow-md shadow-blue-500/10"
                        : "bg-[#141b29] border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate">{preset.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold">
                        {preset.targetHours} hrs
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                      {preset.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add Time Slot Modal / Drawer */}
          {isAddSlotOpen && (
            <div className="bg-[#111723] rounded-2xl border border-blue-500/40 p-5 space-y-4 shadow-xl animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Plus className="w-4 h-4 text-blue-400" />
                  <span>Add New Scheduled Time Block</span>
                </h4>
                <button
                  onClick={() => setIsAddSlotOpen(false)}
                  className="text-slate-400 hover:text-white text-xs font-bold"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleAddCustomSlot} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={newSlotStart}
                      onChange={(e) => setNewSlotStart(e.target.value)}
                      className="w-full bg-[#162033] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={newSlotEnd}
                      onChange={(e) => setNewSlotEnd(e.target.value)}
                      className="w-full bg-[#162033] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Subject / Paper
                    </label>
                    <select
                      value={newSlotSubject}
                      onChange={(e) => setNewSlotSubject(e.target.value as any)}
                      className="w-full bg-[#162033] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="pub_ad">Public Administration</option>
                      <option value="prelims">Prelims Practice & Drills</option>
                      <option value="mains">Mains Answer Writing</option>
                      <option value="current_affairs">Current Affairs & Editorials</option>
                      <option value="gs_core">General Studies (GS 1-4)</option>
                      <option value="revision">Spaced Flashcards & Revision</option>
                      <option value="csat">CSAT Paper 2</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Priority Level
                    </label>
                    <select
                      value={newSlotPriority}
                      onChange={(e) => setNewSlotPriority(e.target.value as any)}
                      className="w-full bg-[#162033] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="high">High Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="low">Low Priority</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Slot Title
                  </label>
                  <input
                    id="new-slot-title-input"
                    type="text"
                    placeholder="e.g. Herbert Simon Bounded Rationality & 2nd ARC Report"
                    value={newSlotTitle}
                    onChange={(e) => setNewSlotTitle(e.target.value)}
                    className="w-full bg-[#162033] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Syllabus Unit / Chapter
                    </label>
                    <input
                      id="new-slot-unit-input"
                      type="text"
                      placeholder="e.g. Paper 1 Unit 2: Administrative Thinkers"
                      value={newSlotSyllabusUnit}
                      onChange={(e) => setNewSlotSyllabusUnit(e.target.value)}
                      className="w-full bg-[#162033] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Estimated Time Req. (Mins)
                    </label>
                    <input
                      id="new-slot-est-min-input"
                      type="number"
                      min={15}
                      step={15}
                      value={newSlotEstimatedMin}
                      onChange={(e) => setNewSlotEstimatedMin(Number(e.target.value))}
                      className="w-full bg-[#162033] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Initial Time Spent (Mins)
                    </label>
                    <input
                      id="new-slot-spent-min-input"
                      type="number"
                      min={0}
                      step={15}
                      value={newSlotSpentMin}
                      onChange={(e) => setNewSlotSpentMin(Number(e.target.value))}
                      className="w-full bg-[#162033] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Topic Notes / Deliverables
                  </label>
                  <input
                    id="new-slot-notes-input"
                    type="text"
                    placeholder="e.g. Read 2 chapters, solve 15 PYQs, write 1 model answer"
                    value={newSlotNotes}
                    onChange={(e) => setNewSlotNotes(e.target.value)}
                    className="w-full bg-[#162033] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddSlotOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20"
                  >
                    Save Slot to Timetable
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Timetable Schedule Blocks List */}
          <div className="bg-[#111723] rounded-2xl border border-[#1e293b] p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-white text-base">
                  Daily Structured Schedule ({totalScheduledHours} Hours Total)
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                {completedSlotsCount} of {slots.length} blocks completed
              </span>
            </div>

            <div className="space-y-3">
              {slots.map((slot) => {
                const badge = getSubjectBadge(slot.subject);
                const isCurrent = currentActiveSlot?.id === slot.id;
                const unitProgress = getSlotUnitProgress(slot);

                return (
                  <div
                    key={slot.id}
                    id={`study-block-${slot.id}`}
                    className={`p-4 rounded-xl border transition-all flex flex-col gap-3.5 ${
                      isCurrent
                        ? "bg-[#18263e] border-blue-500 shadow-md shadow-blue-500/10 ring-1 ring-blue-500"
                        : slot.isCompleted
                        ? "bg-[#101622]/60 border-slate-800/80 opacity-80"
                        : "bg-[#141b29] border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {/* Header Row: Checkbox + Time + Badges + Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start space-x-3 min-w-0">
                        <button
                          id={`toggle-slot-btn-${slot.id}`}
                          onClick={() => handleToggleSlotCompleted(slot.id)}
                          className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-colors flex-shrink-0"
                          title={slot.isCompleted ? "Mark incomplete" : "Mark completed (100%)"}
                        >
                          {slot.isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-500 hover:text-slate-300" />
                          )}
                        </button>

                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                              {slot.startTime} – {slot.endTime}
                            </span>

                            <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${badge.color}`}>
                              {badge.label}
                            </span>

                            {slot.priority === "high" && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-bold border border-red-500/20">
                                High Yield
                              </span>
                            )}

                            {isCurrent && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Active Now
                              </span>
                            )}
                          </div>

                          <h4
                            className={`text-sm sm:text-base font-bold truncate ${
                              slot.isCompleted ? "line-through text-slate-400" : "text-white"
                            }`}
                          >
                            {slot.title}
                          </h4>

                          <p className="text-xs text-slate-400 line-clamp-1">{slot.topicNotes}</p>
                        </div>
                      </div>

                      {/* Right: Quick Time Logging & Action Controls */}
                      <div className="flex items-center space-x-1.5 sm:self-center flex-shrink-0">
                        <button
                          id={`quick-log-15-${slot.id}`}
                          onClick={() => handleQuickLogTime(slot.id, 15)}
                          className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-mono transition-colors"
                          title="Log +15 minutes for this syllabus unit"
                        >
                          +15m
                        </button>
                        <button
                          id={`quick-log-30-${slot.id}`}
                          onClick={() => handleQuickLogTime(slot.id, 30)}
                          className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-mono transition-colors"
                          title="Log +30 minutes for this syllabus unit"
                        >
                          +30m
                        </button>
                        <button
                          id={`focus-timer-btn-${slot.id}`}
                          onClick={() => handleStartTimerForSlot(slot)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-bold flex items-center space-x-1 transition-colors"
                          title="Start focus timer with this syllabus unit"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Focus</span>
                        </button>

                        <button
                          id={`remove-slot-btn-${slot.id}`}
                          onClick={() => handleRemoveSlot(slot.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                          title="Remove block"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Visual Progress Bar Section reflecting completion percentage */}
                    <div className="pt-2.5 border-t border-slate-800/70 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
                        {/* Syllabus Unit Name & Time Spent vs Estimated Required */}
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
                          <div className="flex items-center space-x-1.5 text-slate-300 font-medium truncate">
                            <BookOpen className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                            <span className="text-slate-400 text-[11px]">Unit:</span>
                            <span
                              className="text-slate-200 text-xs font-semibold truncate max-w-[280px] sm:max-w-xs md:max-w-md"
                              title={unitProgress.unitTitle}
                            >
                              {unitProgress.unitTitle}
                            </span>
                          </div>

                          <div className="flex items-center space-x-1.5 text-[11px] font-mono text-slate-400">
                            <span className="text-slate-600">•</span>
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>Spent:</span>
                            <span className="font-bold text-white">
                              {formatMinutes(unitProgress.timeSpentMinutes)}
                            </span>
                            <span>/</span>
                            <span className="text-slate-300">
                              {formatMinutes(unitProgress.estimatedMinutes)} req.
                            </span>
                            {unitProgress.remainingMinutes > 0 ? (
                              <span className="text-slate-500">
                                ({formatMinutes(unitProgress.remainingMinutes)} remaining)
                              </span>
                            ) : (
                              <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>Target Achieved</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Completion Percentage Badge */}
                        <div className="flex items-center space-x-2 self-start sm:self-auto flex-shrink-0">
                          <span
                            className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${
                              unitProgress.isFullyCompleted
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                : unitProgress.percentage > 0
                                ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                                : "bg-slate-800 text-slate-400 border-slate-700"
                            }`}
                          >
                            {unitProgress.percentage}% Completed
                          </span>
                        </div>
                      </div>

                      {/* Visual Progress Bar Track & Fill */}
                      <div className="w-full h-2 rounded-full bg-slate-900/90 overflow-hidden border border-slate-800/80">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ease-out ${
                            unitProgress.isFullyCompleted
                              ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                              : unitProgress.percentage > 0
                              ? "bg-gradient-to-r from-blue-600 to-indigo-500"
                              : "bg-slate-700"
                          }`}
                          style={{ width: `${Math.min(100, unitProgress.percentage)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* VIEW 2: DEDICATED FOCUS STUDY TIMER (POMODORO)      */}
      {/* ==================================================== */}
      {activeSubTab === "timer" && (
        <div className="space-y-6">
          {/* Timer Setup Bar: Subject & Topic Binding */}
          <div className="bg-[#111723] rounded-2xl border border-[#1e293b] p-4 sm:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Brain className="w-4 h-4 text-amber-400" />
                  <span>Focus Session Configuration</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select your active subject and topic so study time is automatically attributed to your UPSC streak.
                </p>
              </div>

              {/* Fullscreen Button */}
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors self-end sm:self-auto"
                title={isFullscreen ? "Exit Fullscreen" : "Distraction-Free Mode"}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
              <div className="sm:col-span-4">
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Subject Category
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value as any)}
                  className="w-full bg-[#162033] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="pub_ad">Public Administration Optional</option>
                  <option value="prelims">Prelims Drills & MCQs</option>
                  <option value="mains">Mains Answer Writing</option>
                  <option value="current_affairs">Current Affairs & Editorial</option>
                  <option value="gs_core">General Studies (GS 1-4)</option>
                  <option value="revision">Thinker Flashcards & Revision</option>
                  <option value="csat">CSAT Paper 2</option>
                </select>
              </div>

              <div className="sm:col-span-8">
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Active Study Topic / Goal
                </label>
                <input
                  type="text"
                  value={activeTopicName}
                  onChange={(e) => setActiveTopicName(e.target.value)}
                  placeholder="e.g. Herbert Simon Bounded Rationality & Administrative Behavior"
                  className="w-full bg-[#162033] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Main Circular Timer Display Card */}
          <div className="bg-[#111723] rounded-2xl border border-[#1e293b] p-6 sm:p-10 flex flex-col items-center justify-center space-y-6 shadow-2xl relative overflow-hidden">
            {/* Background Glow */}
            <div
              className={`absolute -top-24 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
                isTimerRunning ? "bg-blue-500/15" : "bg-slate-700/10"
              }`}
            />

            {/* Mode Selectors */}
            <div className="flex flex-wrap items-center justify-center gap-2 relative z-10">
              <button
                onClick={() => applyTimerMode("deep_work")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  timerMode === "deep_work"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "bg-[#162033] text-slate-400 hover:text-white"
                }`}
              >
                Deep Work (50m)
              </button>

              <button
                onClick={() => applyTimerMode("pomodoro")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  timerMode === "pomodoro"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "bg-[#162033] text-slate-400 hover:text-white"
                }`}
              >
                Pomodoro (25m)
              </button>

              <button
                onClick={() => applyTimerMode("mains_sim")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  timerMode === "mains_sim"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "bg-[#162033] text-slate-400 hover:text-white"
                }`}
              >
                Mains Exam Sim (90m)
              </button>

              <button
                onClick={() => applyTimerMode("stopwatch")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  timerMode === "stopwatch"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "bg-[#162033] text-slate-400 hover:text-white"
                }`}
              >
                Stopwatch
              </button>
            </div>

            {/* Circular Progress Ring */}
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center my-2">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  className="stroke-slate-800"
                  strokeWidth="5"
                  fill="none"
                />
                {/* Active Progress Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  className={`transition-all duration-500 ${
                    timerPhase === "focus" ? "stroke-blue-500" : "stroke-emerald-400"
                  }`}
                  strokeWidth="5"
                  strokeDasharray="276.46"
                  strokeDashoffset={276.46 * (1 - timerPercentage / 100)}
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>

              {/* Inside Ring Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-1">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  {timerMode === "stopwatch"
                    ? "Open Study Session"
                    : timerPhase === "focus"
                    ? "Deep Focus Block"
                    : timerPhase === "short_break"
                    ? "Short Rest (5m)"
                    : "Extended Rest (15m)"}
                </span>

                <div className="text-5xl sm:text-6xl font-extrabold text-white font-mono tracking-tight">
                  {timerMode === "stopwatch" ? formatTime(stopwatchSeconds) : formatTime(secondsRemaining)}
                </div>

                <p className="text-xs text-blue-300 font-medium max-w-[200px] truncate">
                  {activeTopicName}
                </p>

                {pomodoroCount > 0 && (
                  <div className="flex items-center space-x-1 text-[11px] text-amber-400 font-semibold pt-1">
                    <Flame className="w-3.5 h-3.5 fill-current" />
                    <span>{pomodoroCount} completed today</span>
                  </div>
                )}
              </div>
            </div>

            {/* Primary Controls */}
            <div className="flex items-center space-x-3 relative z-10">
              <button
                onClick={handleToggleTimer}
                className={`px-8 py-3.5 rounded-2xl font-bold text-sm sm:text-base flex items-center space-x-2 transition-all shadow-xl hover:scale-105 ${
                  isTimerRunning
                    ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30"
                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/40"
                }`}
              >
                {isTimerRunning ? (
                  <>
                    <Pause className="w-5 h-5 fill-white" />
                    <span>Pause Session</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-white" />
                    <span>{secondsRemaining === durationSeconds ? "Start Focus" : "Resume Session"}</span>
                  </>
                )}
              </button>

              <button
                onClick={handleResetTimer}
                className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Reset Timer"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                onClick={handleManualLogSession}
                className="px-4 py-3.5 rounded-2xl bg-[#162033] hover:bg-[#1f2d48] border border-slate-700 text-xs font-bold text-slate-200 transition-colors"
                title="Save time to streak now"
              >
                <span>Log Time</span>
              </button>
            </div>

            {/* Ambient Background Generator Controls */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-4 border-t border-slate-800 w-full max-w-md">
              <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1 mr-1">
                <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Ambient Sound:</span>
              </span>

              <button
                onClick={() => setAmbientSound("none")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                  ambientSound === "none"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                Off
              </button>

              <button
                onClick={() => setAmbientSound("rain")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                  ambientSound === "rain"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                🌧️ Rainfall
              </button>

              <button
                onClick={() => setAmbientSound("whitenoise")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                  ambientSound === "whitenoise"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                ☕ Library Noise
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* VIEW 3: STUDY SESSION ANALYTICS & LOGS               */}
      {/* ==================================================== */}
      {activeSubTab === "analytics" && (
        <div className="space-y-6">
          {/* Top Performance Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#111723] border border-[#1e293b] space-y-1">
              <span className="text-xs text-slate-400 font-semibold">Total Verified Study Hours</span>
              <p className="text-2xl sm:text-3xl font-bold text-white">
                {user.totalStudyHours || 0} Hours
              </p>
              <span className="text-[11px] text-emerald-400 font-medium">Logged across all modules</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#111723] border border-[#1e293b] space-y-1">
              <span className="text-xs text-slate-400 font-semibold">Active Study Streak</span>
              <p className="text-2xl sm:text-3xl font-bold text-orange-400 flex items-center gap-2">
                <Flame className="w-6 h-6 fill-current" />
                <span>{user.studyStreakDays} Days</span>
              </p>
              <span className="text-[11px] text-slate-400 font-medium">Daily target consistency</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#111723] border border-[#1e293b] space-y-1">
              <span className="text-xs text-slate-400 font-semibold">Sessions Completed</span>
              <p className="text-2xl sm:text-3xl font-bold text-blue-400">
                {sessions.length} Sessions
              </p>
              <span className="text-[11px] text-blue-300 font-medium">Average 45m per block</span>
            </div>
          </div>

          {/* Session History Feed */}
          <div className="bg-[#111723] rounded-2xl border border-[#1e293b] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">
                Recent Focused Study Sessions Log
              </h3>
              <span className="text-xs text-slate-400">Chronological history</span>
            </div>

            <div className="space-y-3">
              {sessions.map((sess) => {
                const badge = getSubjectBadge(sess.subject);
                return (
                  <div
                    key={sess.id}
                    className="p-3.5 rounded-xl bg-[#162033] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${badge.color}`}>
                          {badge.label}
                        </span>
                        <span className="text-xs text-slate-400">{sess.date} • {sess.timestamp}</span>
                      </div>
                      <h4 className="font-bold text-white text-sm truncate">{sess.topic}</h4>
                      {sess.notes && (
                        <p className="text-xs text-slate-400 line-clamp-1">{sess.notes}</p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-auto flex-shrink-0">
                      <span className="font-mono text-sm font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                        +{sess.durationMinutes} mins
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

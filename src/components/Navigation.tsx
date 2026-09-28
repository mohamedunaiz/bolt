import React, { useState, useRef, useEffect } from "react";
import {
  Home,
  Zap,
  Newspaper,
  CheckSquare,
  FileText,
  GraduationCap,
  Calendar,
  History,
  BookOpen,
  Network,
  Upload,
  Search,
  Bookmark,
  Settings,
  Flame,
  ChevronDown,
  Sun,
  Moon,
  LogIn,
  LogOut,
  User,
  UserPlus,
  Cpu,
  Terminal,
  Menu,
  X,
  Target,
  Layers,
  Sparkles,
} from "lucide-react";
import { NavigationTab, UserProfile, ActiveModelConfig, AppThemeMode } from "../types";

interface NavigationProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  user: UserProfile;
  onOpenSettings: () => void;
  onOpenBookmarks: () => void;
  onOpenSearch: () => void;
  revisionDueCount: number;
  onOpenAuth?: (mode?: "signin" | "signup") => void;
  onLogout?: () => void;
  activeModelConfig?: ActiveModelConfig;
  themeMode?: AppThemeMode;
  onToggleTheme?: (mode?: AppThemeMode) => void;
  onOpenPythonConsole?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  user,
  onOpenSettings,
  onOpenBookmarks,
  onOpenSearch,
  revisionDueCount,
  onOpenAuth,
  onLogout,
  themeMode = "dark",
  onToggleTheme,
  onOpenPythonConsole,
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false);
  const [isMoreToolsOpen, setIsMoreToolsOpen] = useState<boolean>(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const moreToolsRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setIsProfileMenuOpen(false);
      }
      if (moreToolsRef.current && !moreToolsRef.current.contains(target)) {
        setIsMoreToolsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectTab = (tab: NavigationTab) => {
    setActiveTab(tab);
    setIsMoreToolsOpen(false);
    setIsMobileDrawerOpen(false);
  };

  const isMoreToolActive = [
    "pyqs",
    "ncert",
    "knowledgeGraph",
    "materials",
    "knowledge",
    "settings",
  ].includes(activeTab);

  return (
    <>
      {/* SuperKalam-Style Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#0d121c]/95 dark:bg-[#0d121c]/95 border-b border-slate-800/80 backdrop-blur-md px-4 py-2.5 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Brand Logo & Aspirant Tag */}
          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => handleSelectTab("home")}
              className="flex items-center space-x-2.5 group focus:outline-none"
              title="Return to Dashboard"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 via-indigo-600 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Zap className="w-4 h-4 text-white fill-white" />
              </div>
              <div className="text-left">
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-base tracking-wide text-white">
                    BOLT
                  </span>
                  <span className="text-[10px] text-amber-400 font-semibold tracking-wider uppercase">
                    AI Mentor
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                  UPSC CSE Preparation
                </p>
              </div>
            </button>
          </div>

          {/* Primary Study Navigation Tabs (Clean SuperKalam Pillars) */}
          <nav
            aria-label="Main Navigation"
            className="hidden lg:flex items-center space-x-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800/80"
          >
            {/* Dashboard */}
            <button
              onClick={() => handleSelectTab("home")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeTab === "home"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            {/* Kalam / Bolt AI Mentor */}
            <button
              onClick={() => handleSelectTab("bolt")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
                activeTab === "bolt"
                  ? "bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-md shadow-indigo-500/20"
                  : "text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
              }`}
              title="Open 24/7 AI UPSC Mentor"
            >
              <Zap className="w-3.5 h-3.5 fill-current animate-pulse text-amber-400" />
              <span>AI Mentor</span>
            </button>

            {/* Daily Current Affairs */}
            <button
              onClick={() => handleSelectTab("news")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeTab === "news"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              <Newspaper className="w-3.5 h-3.5 text-blue-400" />
              <span>Current Affairs</span>
            </button>

            {/* Prelims Practice */}
            <button
              onClick={() => handleSelectTab("prelims")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeTab === "prelims"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>Prelims</span>
            </button>

            {/* Mains Answer Evaluation */}
            <button
              onClick={() => handleSelectTab("mains")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeTab === "mains"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Mains</span>
            </button>

            {/* Syllabus & Spaced Revision */}
            <button
              onClick={() => handleSelectTab("learn")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all relative ${
                activeTab === "learn"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
              <span>Syllabus</span>
              {revisionDueCount > 0 && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"
                  title={`${revisionDueCount} topics due for revision`}
                />
              )}
            </button>

            {/* Study Planner & Routine */}
            <button
              onClick={() => handleSelectTab("planner")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeTab === "planner" || activeTab === "schedule"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-teal-400" />
              <span>Routine</span>
            </button>

            {/* "More Tools" Dropdown */}
            <div className="relative" ref={moreToolsRef}>
              <button
                onClick={() => setIsMoreToolsOpen(!isMoreToolsOpen)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
                  isMoreToolActive
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                }`}
              >
                <span>More</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isMoreToolsOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#0f1522] border border-slate-800 shadow-2xl p-1.5 z-50 animate-in fade-in-50 zoom-in-95">
                  <div className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Specialized Tools
                  </div>

                  <button
                    onClick={() => handleSelectTab("pyqs")}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium flex items-center space-x-2 transition-colors ${
                      activeTab === "pyqs"
                        ? "bg-blue-600 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <History className="w-3.5 h-3.5 text-amber-400" />
                    <span>PYQ Archive (1855–2026)</span>
                  </button>

                  <button
                    onClick={() => handleSelectTab("ncert")}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium flex items-center space-x-2 transition-colors ${
                      activeTab === "ncert"
                        ? "bg-blue-600 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                    <span>NCERT Foundation (6–12)</span>
                  </button>

                  <button
                    onClick={() => handleSelectTab("knowledgeGraph")}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium flex items-center space-x-2 transition-colors ${
                      activeTab === "knowledgeGraph"
                        ? "bg-blue-600 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Network className="w-3.5 h-3.5 text-blue-400" />
                    <span>Concept Knowledge Graph</span>
                  </button>

                  <button
                    onClick={() => handleSelectTab("materials")}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium flex items-center space-x-2 transition-colors ${
                      activeTab === "materials"
                        ? "bg-blue-600 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Upload Notes & Quiz</span>
                  </button>

                  <button
                    onClick={() => handleSelectTab("knowledge")}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium flex items-center space-x-2 transition-colors ${
                      activeTab === "knowledge"
                        ? "bg-blue-600 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                    <span>RAG Document Store</span>
                  </button>

                  <div className="my-1 border-t border-slate-800" />

                  {onOpenPythonConsole && (
                    <button
                      onClick={() => {
                        setIsMoreToolsOpen(false);
                        onOpenPythonConsole();
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium flex items-center space-x-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Python 3.10 Engine</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleSelectTab("settings")}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium flex items-center space-x-2 transition-colors ${
                      activeTab === "settings"
                        ? "bg-blue-600 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>Preferences & Models</span>
                  </button>
                </div>
              )}
            </div>
          </nav>

          {/* Right Action Controls: Streak, Search, Bookmarks, Theme & Profile */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Direct Ask Mentor CTA for small/medium screens */}
            <button
              onClick={() => handleSelectTab("bolt")}
              className="lg:hidden flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-500/20"
            >
              <Zap className="w-3.5 h-3.5 fill-current text-white" />
              <span>Ask Mentor</span>
            </button>

            {/* Streak Counter */}
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-400 text-xs font-semibold border border-orange-500/20">
              <Flame className="w-3.5 h-3.5 fill-orange-400" />
              <span>{user.studyStreakDays}d streak</span>
            </div>

            {/* Search (Cmd+K) */}
            <button
              onClick={onOpenSearch}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Search Topics & PYQs (Cmd+K)"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Bookmarks */}
            <button
              onClick={onOpenBookmarks}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Saved Questions & Bookmarks"
              aria-label="Bookmarks"
            >
              <Bookmark className="w-4 h-4" />
            </button>

            {/* Theme Toggle (Light / Dark) */}
            <button
              onClick={() => onToggleTheme?.()}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title={
                themeMode === "light"
                  ? "Switch to High-Contrast Dark Mode"
                  : "Switch to Light Reading Mode"
              }
              aria-label="Toggle Theme"
            >
              {themeMode === "light" ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            {/* User Profile Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center space-x-2 py-1 px-1.5 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
                title="Aspirant Account & Settings"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-amber-500 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                  {user.name ? user.name.charAt(0).toUpperCase() : "A"}
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#0f1522] border border-slate-800 shadow-2xl p-2.5 z-50 space-y-2 animate-in fade-in-50 zoom-in-95">
                  <div className="px-2 py-1.5 border-b border-slate-800">
                    <p className="font-bold text-white text-xs truncate">
                      {user?.name || "UPSC Aspirant"}
                    </p>
                    <p className="text-[11px] text-amber-400 font-medium mt-0.5">
                      {user?.target || "UPSC CSE 2026"} • {user?.optionalSubject || "Pub Admin"}
                    </p>
                    {user?.email && (
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {user.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1 text-xs">
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        handleSelectTab("settings");
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 flex items-center space-x-2 transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-blue-400" />
                      <span>Profile & Target Year</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        handleSelectTab("settings");
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 flex items-center space-x-2 transition-colors"
                    >
                      <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                      <span>AI Model & Settings</span>
                    </button>

                    <div className="my-1 border-t border-slate-800" />

                    {user.email ? (
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          if (onLogout) onLogout();
                          else onOpenAuth?.("signin");
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/30 flex items-center space-x-2 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out (Data Synced)</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            onOpenAuth?.("signin");
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-emerald-400 hover:bg-slate-800 flex items-center space-x-2 transition-colors"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          <span>Sign In</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            onOpenAuth?.("signup");
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-amber-400 hover:bg-slate-800 flex items-center space-x-2 transition-colors"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Create Account</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Drawer Trigger */}
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Open Mobile Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (SuperKalam 5 Primary Pillars) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0d121c]/95 backdrop-blur-lg border-t border-slate-800 px-3 py-1.5 flex items-center justify-around"
      >
        <button
          onClick={() => handleSelectTab("home")}
          className={`flex flex-col items-center py-1 px-2.5 rounded-lg transition-colors ${
            activeTab === "home" ? "text-amber-400 font-bold" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Home</span>
        </button>

        <button
          onClick={() => handleSelectTab("bolt")}
          className={`flex flex-col items-center py-1 px-2.5 rounded-lg transition-colors ${
            activeTab === "bolt" ? "text-amber-400 font-bold" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Zap className="w-5 h-5 mb-0.5 fill-current text-amber-400 animate-pulse" />
          <span className="text-[10px]">Mentor</span>
        </button>

        <button
          onClick={() => handleSelectTab("news")}
          className={`flex flex-col items-center py-1 px-2.5 rounded-lg transition-colors ${
            activeTab === "news" ? "text-blue-400 font-bold" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Newspaper className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">News</span>
        </button>

        <button
          onClick={() => handleSelectTab("prelims")}
          className={`flex flex-col items-center py-1 px-2.5 rounded-lg transition-colors ${
            activeTab === "prelims" ? "text-emerald-400 font-bold" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <CheckSquare className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Prelims</span>
        </button>

        <button
          onClick={() => handleSelectTab("mains")}
          className={`flex flex-col items-center py-1 px-2.5 rounded-lg transition-colors ${
            activeTab === "mains" ? "text-indigo-400 font-bold" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <FileText className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Mains</span>
        </button>

        <button
          onClick={() => setIsMobileDrawerOpen(true)}
          className={`flex flex-col items-center py-1 px-2.5 rounded-lg transition-colors ${
            isMoreToolActive || activeTab === "learn" || activeTab === "planner"
              ? "text-purple-400 font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Layers className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">All</span>
        </button>
      </nav>

      {/* Mobile Drawer (Accessible from Mobile Bottom Bar or Header Menu) */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden flex justify-end">
          <div className="w-4/5 max-w-sm h-full bg-[#0d121c] border-l border-slate-800 p-4 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-indigo-600 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white fill-white" />
                  </div>
                  <span className="font-bold text-white text-sm">All UPSC Tools</span>
                </div>
                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-1">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
                  Primary Pillars
                </div>
                <button
                  onClick={() => handleSelectTab("home")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2.5 ${
                    activeTab === "home" ? "bg-slate-800 text-white" : "text-slate-300"
                  }`}
                >
                  <Home className="w-4 h-4 text-blue-400" />
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={() => handleSelectTab("bolt")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center space-x-2.5 ${
                    activeTab === "bolt"
                      ? "bg-gradient-to-r from-amber-500 to-indigo-600 text-white"
                      : "text-amber-400"
                  }`}
                >
                  <Zap className="w-4 h-4 fill-current text-amber-400" />
                  <span>AI Mentor (Ask Anything)</span>
                </button>
                <button
                  onClick={() => handleSelectTab("news")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2.5 ${
                    activeTab === "news" ? "bg-slate-800 text-white" : "text-slate-300"
                  }`}
                >
                  <Newspaper className="w-4 h-4 text-blue-400" />
                  <span>Daily Current Affairs & Editorials</span>
                </button>
                <button
                  onClick={() => handleSelectTab("prelims")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2.5 ${
                    activeTab === "prelims" ? "bg-slate-800 text-white" : "text-slate-300"
                  }`}
                >
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                  <span>Prelims Practice & Tests</span>
                </button>
                <button
                  onClick={() => handleSelectTab("mains")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2.5 ${
                    activeTab === "mains" ? "bg-slate-800 text-white" : "text-slate-300"
                  }`}
                >
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>Mains Answer Evaluation</span>
                </button>
                <button
                  onClick={() => handleSelectTab("learn")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2.5 ${
                    activeTab === "learn" ? "bg-slate-800 text-white" : "text-slate-300"
                  }`}
                >
                  <GraduationCap className="w-4 h-4 text-purple-400" />
                  <span>Syllabus & Spaced Repetition</span>
                </button>
                <button
                  onClick={() => handleSelectTab("planner")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2.5 ${
                    activeTab === "planner" ? "bg-slate-800 text-white" : "text-slate-300"
                  }`}
                >
                  <Calendar className="w-4 h-4 text-teal-400" />
                  <span>Study Planner & Routine</span>
                </button>

                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 pt-4 pb-1">
                  Reference & Tools
                </div>
                <button
                  onClick={() => handleSelectTab("pyqs")}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center space-x-2.5 text-slate-300"
                >
                  <History className="w-4 h-4 text-amber-400" />
                  <span>Historical PYQs (1855–2026)</span>
                </button>
                <button
                  onClick={() => handleSelectTab("ncert")}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center space-x-2.5 text-slate-300"
                >
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <span>NCERT Foundation (6–12)</span>
                </button>
                <button
                  onClick={() => handleSelectTab("knowledgeGraph")}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center space-x-2.5 text-slate-300"
                >
                  <Network className="w-4 h-4 text-blue-400" />
                  <span>Concept Knowledge Graph</span>
                </button>
                <button
                  onClick={() => handleSelectTab("materials")}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center space-x-2.5 text-slate-300"
                >
                  <Upload className="w-4 h-4 text-indigo-400" />
                  <span>Upload Study Material & Quiz</span>
                </button>
                <button
                  onClick={() => handleSelectTab("knowledge")}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center space-x-2.5 text-slate-300"
                >
                  <BookOpen className="w-4 h-4 text-purple-400" />
                  <span>RAG Knowledge Store</span>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-2">
              <button
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  handleSelectTab("settings");
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center space-x-2 text-slate-300 hover:bg-slate-800"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Settings & Preferences</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

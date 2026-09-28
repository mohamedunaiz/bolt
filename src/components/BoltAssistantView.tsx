import React, { useState, useRef, useEffect } from "react";
import Markdown from "react-markdown";
import {
  Zap,
  Send,
  Sparkles,
  Bot,
  User,
  GraduationCap,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  ArrowRight,
  ArrowDown,
  Copy,
  Check,
  CheckCircle2,
  ChevronDown,
  Globe,
  FileText,
  Bookmark,
  Calendar,
  Layers,
  Compass,
  Sliders,
  Eye,
  HeartHandshake,
  HelpCircle,
  Brain,
  X,
  History,
  Pencil,
  Plus,
} from "lucide-react";
import {
  ChatMessage,
  ChatThread,
  UserProfile,
  SyllabusTopic,
  NavigationTab,
  ActiveModelConfig,
  MainsAnswerEvaluation,
  NewsArticle,
  PrelimsQuestion,
  AgentToolCall,
  TimetableSlot,
  StudySessionLog,
} from "../types";
import { ChatHistorySidebar } from "./ChatHistorySidebar";
import { computeBoltAppContext } from "../services/appContextService";
import { executeAgentTool, detectToolFromPrompt, BOLT_TOOL_DEFINITIONS } from "../services/boltAgentTools";
import { saveFirebaseChatMessage } from "../services/firestoreService";
import {
  buildClaudeConversationalSystemPrompt,
  BoltEngagementTone,
} from "../services/boltSystemPrompt";
import { ExpandableThoughtProcess } from "./ExpandableThoughtProcess";
import { extractOrGenerateThoughtProcess } from "../services/thoughtProcessService";

interface BoltAssistantViewProps {
  user: UserProfile;
  topics: SyllabusTopic[];
  evaluations?: MainsAnswerEvaluation[];
  articles?: NewsArticle[];
  questions?: PrelimsQuestion[];
  timetableSlots?: TimetableSlot[];
  studySessions?: StudySessionLog[];
  onNavigateTab: (tab: NavigationTab) => void;
  initialPrompt?: string | null;
  onClearInitialPrompt?: () => void;
  activeModelConfig?: ActiveModelConfig;
  onOpenModelSettings?: () => void;
}

function generateLocalKnowledgeAnswer(query: string, user: UserProfile, tone: BoltEngagementTone = "empathetic_socratic"): string {
  const q = query.toLowerCase();
  const userName = user.name || "Aspirant";
  const optional = user.optionalSubject || "Public Administration";

  if (q.includes("simon") || q.includes("bounded rationality") || q.includes("decision")) {
    return `### Active Reflection & Immediate Insight
Hello ${userName}. I hear you—Herbert Simon's work in *Administrative Behavior* is often perceived as intimidating because it breaks down the neat, prescriptive classical rules and reveals how human, uncertain, and cognitively bounded administrative decision-making actually is. 

At its core, Simon's fundamental breakthrough is that administrative actors cannot be omniscient "Economic Men" who compute all possible permutations; instead, facing cognitive, computational, and temporal limits, they are **"Administrative Men" who satisfice**—selecting alternatives that meet acceptable aspiration thresholds.

---

### Transparent Step-by-Step Reasoning

#### Step 1: Critiquing the Classical "Proverbs"
Simon famously demonstrated that classical principles (Fayol's unity of command, Gulick's POSDCORB) contradict each other in practice (e.g., specialization contradicts hierarchy). He declared that administration is fundamentally a study of **decision-making**, not merely execution.

#### Step 2: Fact Premises vs. Value Premises
Every administrative choice combines two building blocks:
- **Fact Premises:** Empirical, observable descriptions of reality that can be validated as true or false.
- **Value Premises:** Ethical choices, policy goals, or moral imperatives that reflect preferences rather than empirical proof.
Rationality operates strictly on selecting optimal means for given value ends.

#### Step 3: Why Rationality Is Inherently Bounded
Administrators face three non-negotiable real-world constraints:
1. **Cognitive Limits:** Inability to mentally store, calculate, and weigh all conceivable outcomes.
2. **Information & Time Deficits:** Decisions in governance must be executed before complete information can ever be gathered.
3. **Satisficing Behavior:** Administrators search sequentially and stop at the first alternative that satisfies the threshold criteria.

#### Step 4: Concrete Indian Administrative Application (Paper 2 & 2nd ARC)
- **District Administration:** An SDM handling emergency monsoon relief operates under acute bounded rationality, utilizing standard operating procedures (SOPs) and heuristic discretion.
- **2nd ARC 10th Report (Personnel Administration):** Stresses decision-support systems, digitised land records, and MIS dashboards specifically to mitigate bounded rationality in public service delivery.

#### Step 5: UPSC CSE Scoring Edge (Examiner's Lens)
- **Thinker Linkage:** Contrast Simon with Chester Barnard's *Zone of Indifference* and Chris Argyris's *Integration of Individual and Organization*.
- **Diagram Suggestion:** Draw a flowchart contrasting "Economic Man (Global Optimization)" with "Administrative Man (Bounded Search & Satisficing Threshold)".

---

> 💡 **Collaborative Next Step:**
> Would you like to evaluate a 15-mark answer on this topic or explore how Simon's decision-making model applies to AI-assisted governance in India?
> - [📝 Evaluate a Simon Mains Answer](#action:mains)
> - [🗺️ Explore Simon in the Concept Knowledge Graph](#action:knowledgeGraph)`;
  }

  if (q.includes("weber") || q.includes("bureaucracy") || q.includes("authority")) {
    return `### Active Reflection & Immediate Insight
Hello ${userName}. Bureaucracy is one of the most debated pillars of our optional, and candidates frequently struggle with separating Max Weber's sociological construct of the "ideal type" from the pejorative modern meaning of red-tape. 

Weber did not design bureaucracy as an empirical description of any single existing country; he conceptualized an **ideal-type model** anchored in **Legal-Rational Authority**, designed to ensure maximum calculability, precision, and impersonality in large-scale social administration.

---

### Transparent Step-by-Step Reasoning

#### Step 1: The Tripartite Classification of Authority
Weber identified three pure types of legitimate authority:
1. **Traditional Authority:** Rooted in inherited sanctified customs and lineage (e.g., feudal monarchies).
2. **Charismatic Authority:** Rooted in extraordinary personal devotion to an exemplary leader (inherently volatile).
3. **Legal-Rational Authority:** Rooted in legally enacted impersonal rules and graded constitutional offices (the bedrock of modern states).

#### Step 2: Structural Characteristics of Ideal-Type Bureaucracy
- **Hierarchy of Offices:** Graded chain of authority with clearly defined appeal pathways.
- **Sphere of Competence:** Codified division of labor bounded by explicit statutory jurisdictions.
- **Impersonality & Sine Ira et Studio:** Decisions rendered without hatred or passion, treating citizens strictly according to the rule of law.
- **Separation of Office and Incumbent:** Officials cannot privatize or own their official positions.

#### Step 3: Dysfunctions & Post-Weberian Thought
- **Robert K. Merton:** Bureaucratic personality leads to "trained incapacity" and goal displacement (rules become ends rather than means).
- **Michel Crozier:** The "Bureaucratic Phenomenon"—rules create protected zones of uncertainty, fostering defensive coalitions.
- **Alvin Gouldner:** Distinction between Mock, Representative, and Punishment-Centered bureaucracies.

#### Step 4: Indian Administrative Realities (Paper 2 & 2nd ARC)
- **Steel Frame vs. Rigidity:** India's All-India Services (protected under Article 311) embody Weberian permanence, yet struggle with accountability deficits and status-quo bias.
- **2nd ARC 4th Report (Ethics in Governance) & 10th Report:** Recommends transitioning from rule-bound compliance to performance management, citizen charters, and lateral entry.

#### Step 5: UPSC CSE Scoring Architecture
- **Critical Distinction:** Always highlight that Weber praised bureaucracy's technical efficiency while simultaneously warning of the **"Iron Cage" (*Stahlhartes Gehäuse*)** of disenchantment.

---

> 💡 **Collaborative Next Step:**
> Shall we review how Weberian neutrality contrasts with the doctrine of "committed bureaucracy", or would you like to attempt a diagnostic question?
> - [📝 Practice a Weberian Answer](#action:mains)
> - [⚡ Check Prelims Polity & Admin MCQs](#action:prelims)`;
  }

  if (q.includes("weak") || q.includes("syllabus") || q.includes("progress")) {
    return `### Active Reflection & Strategic Insight
Hello ${userName}. It is completely natural during UPSC preparation to look at the vastness of the syllabus and feel a sense of cognitive overload. Let us take a breath, look at your actual telemetry with clarity, and transform that anxiety into a structured sequence of high-return actions.

---

### Step-by-Step Diagnostic & Action Sequence

#### Step 1: Telemetry Assessment
- **Subject:** ${optional} (Target: UPSC CSE)
- **High-Leverage Pivot:** Focus on master concepts in Paper 1 (Administrative Thought & Behaviour) because they provide theoretical fodder that automatically enriches your Paper 2 answers.

#### Step 2: Targeted Remediation for Priority Topics
1. **Administrative Thought (Simon, Weber, Riggs, Follett):**
   - Dedicate a single 60-minute deep-focus block to conceptual deconstruction.
   - Use active recall rather than passive re-reading.
2. **Accountability & Control (Paper 1 & Paper 2):**
   - Consolidate statutory tools: Lokpal, CVC, CAG, RTI Act, and Citizens' Charters.
   - Ground in 2nd ARC Report 4 recommendations.

#### Step 3: Daily Execution Rhythm
- **Morning (45 mins):** 15 targeted Prelims MCQs with detailed analysis of answer rationales.
- **Mid-day (75 mins):** Deep theoretical study of one weak thinker unit.
- **Evening (30 mins):** 1 timed Mains answer (150 words / 10 marks).

---

> 💡 **Ready to Start?**
> Let's take the first concrete step together right now:
> - [⚡ Launch 2 Prelims Practice MCQs](#action:prelims)
> - [📅 Open Your Adaptive Study Timetable](#action:planner)`;
  }

  return `### Active Reflection & Conceptual Overview
Hello ${userName}. I hear you—approaching **"${query.trim()}"** thoughtfully requires us to look beyond superficial definitions and understand how this theme interlocks with both administrative theory and real-world Indian governance.

Let us think through this systematically together:

---

### Transparent Step-by-Step Reasoning

#### Step 1: The Core Theoretical Foundation
Within the academic landscape of ${optional}, this topic addresses the continuous dialectic between structural efficiency and human, behavioral responsiveness. 

#### Step 2: Constitutional & Institutional Anchors
In the Indian administrative context, look for the underlying constitutional architecture:
- Relevant Articles of the Constitution (e.g., Articles 311 for civil services, 243 for democratic decentralization, or 280 for fiscal federalism).
- Statutory commissions, appellate mechanisms, or regulatory guardrails.

#### Step 3: Administrative Reality & 2nd ARC Guidance
Abstract principles must be validated against field realities:
- Cross-reference with the 2nd Administrative Reforms Commission (e.g., Report 1 on RTI, Report 4 on Ethics, or Report 12 on Citizen-Centric Governance).
- Identify field implementation bottlenecks (e.g., bureaucratic inertia, resource deficits, or discretionary abuse).

#### Step 4: UPSC CSE Mains Scoring Dimension
- **Paper 1 ↔ Paper 2 Bridge:** High marks come from using Paper 1 thinkers to explain Paper 2 institutional behaviors.
- **Diagrammatic Anchor:** Visualizing this interaction with an input-throughput-output governance loop or stakeholder matrix signals analytical clarity to the examiner.

---

> 💡 **How Would You Like to Proceed?**
> - [⚡ Test understanding with Prelims MCQs](#action:prelims)
> - [📝 Draft a 10-marker answer on this topic](#action:mains)
> - [📅 Add to today's study schedule](#action:planner)`;
}

function getDefaultThreads(user: UserProfile, liveContext: any): ChatThread[] {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  const initialText = `### Hello ${user.name || "Aspirant"} — Welcome to BOLT

I am your conversational mentor for the UPSC Civil Services Examination. I approach our sessions as an intellectual partnership—combining the warmth, active listening, and transparent step-by-step reasoning of Claude with real-time awareness of your active study dashboard:

---

### Step-by-Step Diagnostic of Your Live Preparation State

#### Step 1: Active Metric Reflection
I've reviewed your current progress across Paper 1 and Paper 2:
- **Syllabus completion:** ${liveContext.syllabus.overallCompletion}% overall (Paper 1: ${liveContext.syllabus.paper1Completion}%, Paper 2: ${liveContext.syllabus.paper2Completion}%)
- **Target areas requiring consolidation:** ${
    liveContext.syllabus.weakTopics.map((w: any) => `${w.name} (${w.score}% mastery)`).join(", ") ||
    "Administrative Thought, Accountability & Control"
  }
- **Consolidated foundations:** ${
    liveContext.syllabus.strongTopics.map((s: any) => `${s.name} (${s.score}% mastery)`).join(", ") ||
    "Administrative Behaviour, Constitutional Framework"
  }
- **Practice trajectory:** ${liveContext.prelimsPerformance.questionsAttempted} MCQs attempted (${liveContext.prelimsPerformance.accuracyPercentage}% accuracy) • ${liveContext.mainsPerformance.evaluatedCount} answers evaluated (${liveContext.mainsPerformance.averageScore}/15 average)

#### Step 2: How We Can Work Together
Whether you are deconstructing an elusive thinker like Herbert Simon or Fred Riggs, seeking feedback on a 15-mark Mains answer, or looking for an empathetic sounding board during an intense revision week, I am here to think through each problem with you step-by-step.

#### Step 3: Collaborative Next Action
What would serve your preparation best right now?
> 💡 **Suggested First Steps:**
> - Ask me: *"Analyze my weak areas and recommend what to revise first today"*
> - Ask me: *"Explain Herbert Simon's Bounded Rationality with a 15-marker answer structure"*
> - [⚡ Practice Prelims MCQs](#action:prelims) • [📝 Open Mains Evaluation Room](#action:mains) • [📅 View Timetable & Schedule](#action:planner)`;

  const initialThought = extractOrGenerateThoughtProcess(
    initialText,
    "Initial candidate greeting, readiness evaluation, and live dashboard diagnostic",
    user.optionalSubject || "Public Administration"
  );

  const thread1Messages: ChatMessage[] = [
    {
      id: "m-1",
      role: "assistant",
      text: initialText,
      thoughtProcess: initialThought.thoughtProcess,
      reasoningPhases: initialThought.reasoningPhases,
      timestamp: "Just now",
      mode: "public_admin",
      actionCards: [
        {
          type: "topic",
          title: "Public Administration Diagnostic",
          description: "Analyze your knowledge level in Administrative Thought (Herbert Simon & Max Weber)",
          actionLabel: "Analyze Weak Area",
        },
        {
          type: "model_answer",
          title: "Herbert Simon Model Answer",
          description: "Inspect 15-mark structured model answer with diagram & 2nd ARC links",
          actionLabel: "View Model Answer",
          targetTab: "mains",
        },
        {
          type: "topic",
          title: "In-App Capabilities Guide",
          description: "Explore all 11 study tools and see how Bolt AI acts as your in-app co-pilot",
          actionLabel: "App Capabilities Tour",
        },
      ],
    },
  ];

  return [
    {
      id: "thread-diagnostic",
      title: "UPSC Preparation Diagnostic & Strategy",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      messages: thread1Messages,
      mode: "public_admin",
    },
  ];
}

export const BoltAssistantView: React.FC<BoltAssistantViewProps> = ({
  user,
  topics,
  evaluations = [],
  articles = [],
  questions = [],
  timetableSlots = [],
  studySessions = [],
  onNavigateTab,
  initialPrompt,
  onClearInitialPrompt,
  activeModelConfig,
  onOpenModelSettings,
}) => {
  // Compute real, dynamic dashboard analytics via App Context Service
  const liveContext = computeBoltAppContext(user, topics, evaluations, articles, questions);

  const [engagementTone, setEngagementTone] = useState<BoltEngagementTone>("empathetic_socratic");
  const [showPromptModal, setShowPromptModal] = useState<boolean>(false);
  const [expandAllThoughts, setExpandAllThoughts] = useState<boolean>(false);

  // Chat threads persistent state (purges mock threads)
  const [threads, setThreads] = useState<ChatThread[]>(() => {
    try {
      const saved = localStorage.getItem("bolt_chat_threads_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const clean = parsed.filter(
            (t: any) =>
              t &&
              t.id !== "thread-herbert-simon" &&
              t.id !== "thread-ethics-2ndarc"
          );
          if (clean.length > 0) {
            if (clean.length !== parsed.length) {
              localStorage.setItem("bolt_chat_threads_v1", JSON.stringify(clean));
            }
            return clean;
          }
        }
      }
    } catch (e) {}
    return getDefaultThreads(user, liveContext);
  });

  const [activeThreadId, setActiveThreadId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem("bolt_active_thread_id");
      if (savedId) return savedId;
    } catch (e) {}
    return "thread-diagnostic";
  });

  // Chat History Sidebar toggle state
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("bolt_chat_sidebar_open");
      if (saved !== null) return saved === "true";
    } catch (e) {}
    return typeof window !== "undefined" ? window.innerWidth >= 1024 : true;
  });

  // Header quick rename state
  const [isHeaderRenaming, setIsHeaderRenaming] = useState<boolean>(false);
  const [headerRenameTitle, setHeaderRenameTitle] = useState<string>("");

  // Persist threads to local storage
  useEffect(() => {
    try {
      localStorage.setItem("bolt_chat_threads_v1", JSON.stringify(threads));
    } catch (e) {}
  }, [threads]);

  // Persist active thread ID
  useEffect(() => {
    try {
      localStorage.setItem("bolt_active_thread_id", activeThreadId);
    } catch (e) {}
  }, [activeThreadId]);

  // Active thread derivation
  const activeThread =
    threads.find((t) => t.id === activeThreadId) ||
    threads[0] || {
      id: "thread-default",
      title: "New Conversation",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
      mode: "public_admin",
    };

  const messages = activeThread.messages;

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("bolt_chat_sidebar_open", String(next));
      } catch (e) {}
      return next;
    });
  };

  const handleSelectThread = (threadId: string) => {
    setActiveThreadId(threadId);
    setIsHeaderRenaming(false);
  };

  const handleNewThread = () => {
    const newId = `thread-${Date.now()}`;
    const newThread: ChatThread = {
      id: newId,
      title: "New Conversation",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mode,
      messages: [
        {
          id: `m-${Date.now()}`,
          role: "assistant",
          text: `### Fresh Conversation Started\n\nI am ready for a new discussion regarding your ${
            mode === "public_admin" ? "Public Administration" : "UPSC General Studies"
          } preparation. What topic, thinker, syllabus area, or Mains question would you like to explore?`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          mode,
        },
      ],
    };

    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(newId);
    setIsHeaderRenaming(false);
  };

  const handleRenameThread = (threadId: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    setThreads((prev) =>
      prev.map((t) =>
        t.id === threadId ? { ...t, title: trimmed, updatedAt: new Date().toISOString() } : t
      )
    );
  };

  const handleDeleteThread = (threadId: string) => {
    setThreads((prev) => {
      const filtered = prev.filter((t) => t.id !== threadId);
      if (filtered.length === 0) {
        const freshId = `thread-${Date.now()}`;
        const freshThread: ChatThread = {
          id: freshId,
          title: "New Conversation",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          mode,
          messages: [
            {
              id: `m-${Date.now()}`,
              role: "assistant",
              text: `Ready for a new discussion! What would you like to explore?`,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              mode,
            },
          ],
        };
        setActiveThreadId(freshId);
        return [freshThread];
      }
      if (activeThreadId === threadId) {
        setActiveThreadId(filtered[0].id);
      }
      return filtered;
    });
  };

  const appendMessageToActiveThread = (msg: ChatMessage, autoTitlePrompt?: string) => {
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === activeThread.id) {
          const isGeneric = t.title === "New Conversation" || t.title.startsWith("New Conversation");
          const updatedTitle =
            autoTitlePrompt && isGeneric
              ? autoTitlePrompt.trim().slice(0, 36) + (autoTitlePrompt.trim().length > 36 ? "..." : "")
              : t.title;
          return {
            ...t,
            title: updatedTitle,
            updatedAt: new Date().toISOString(),
            messages: [...t.messages, msg],
          };
        }
        return t;
      })
    );
  };

  const [inputMessage, setInputMessage] = useState<string>("");
  const [mode, setMode] = useState<"public_admin" | "general">("public_admin");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showScrollBottom, setShowScrollBottom] = useState<boolean>(false);
  const [showWorkspaceNavigator, setShowWorkspaceNavigator] = useState<boolean>(false);
  const [copiedAction, setCopiedAction] = useState<{ id: string; type: "answer" | "reasoning" | "full" } | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [pendingSensitiveAction, setPendingSensitiveAction] = useState<{
    toolName: string;
    args: Record<string, any>;
    prompt: string;
  } | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollBottom(false);
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 140;
    setShowScrollBottom(isScrolledUp);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (initialPrompt) {
      sendMessage(initialPrompt);
      if (onClearInitialPrompt) {
        onClearInitialPrompt();
      }
    }
  }, [initialPrompt]);

  const getReasoningText = (msg: ChatMessage): string => {
    if (msg.thoughtProcess) return msg.thoughtProcess;
    if (msg.reasoningPhases && msg.reasoningPhases.length > 0) {
      return msg.reasoningPhases.map((p) => `[${p.phase}: ${p.title}]\n${p.detail}`).join("\n\n");
    }
    const synthesized = extractOrGenerateThoughtProcess(msg.text, undefined, user.optionalSubject);
    return synthesized.thoughtProcess;
  };

  const handleCopy = (id: string, text: string, type: "answer" | "reasoning" | "full" = "answer") => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopiedAction({ id, type });
      setCopiedMessageId(id);
      setTimeout(() => {
        setCopiedAction(null);
        setCopiedMessageId(null);
      }, 2500);
    });
  };

  const handleCopyText = (id: string, text: string) => {
    handleCopy(id, text, "answer");
  };

  const handleCopyFullNote = (msg: ChatMessage) => {
    const reasoning = getReasoningText(msg);
    const fullNote = `=====================================================
BOLT AI MENTORSHIP NOTE (UPSC CSE PREPARATION)
=====================================================

🧠 STEP-BY-STEP REASONING NOTES:
${reasoning}

-----------------------------------------------------
📝 AI-GENERATED ANSWER:
-----------------------------------------------------
${msg.text}

=====================================================
Target: ${user.target || "UPSC CSE"} • Optional: ${user.optionalSubject || "Public Administration"}
Exported from Bolt UPSC Assistant • ${new Date().toLocaleDateString()}
`;
    handleCopy(msg.id, fullNote, "full");
  };

  const handleCopyReasoningOnly = (msg: ChatMessage) => {
    const reasoning = getReasoningText(msg);
    const note = `=====================================================
BOLT AI COGNITIVE REASONING NOTES (UPSC CSE)
=====================================================
${reasoning}
`;
    handleCopy(msg.id, note, "reasoning");
  };

  const handleClearChat = () => {
    const welcomeMsg: ChatMessage = {
      id: "m-" + Date.now(),
      role: "assistant",
      text: `Chat cleared. Ready for a new discussion! What would you like to explore regarding your UPSC preparation?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      mode,
    };
    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThread.id
          ? {
              ...t,
              messages: [welcomeMsg],
              updatedAt: new Date().toISOString(),
            }
          : t
      )
    );
  };

  const sendMessage = async (textToSend?: string) => {
    const query = textToSend || inputMessage;
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: "u-" + Date.now(),
      role: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    appendMessageToActiveThread(userMsg, query);
    setInputMessage("");
    setIsLoading(true);

    try {
      // 1. Tool-Calling Check: Check if prompt warrants controlled agent tool execution
      const detected = detectToolFromPrompt(query);
      let executedToolCall: AgentToolCall | undefined;

      if (detected) {
        const toolDef = BOLT_TOOL_DEFINITIONS.find((t) => t.name === detected.name);
        if (toolDef?.permissionLevel === "sensitive") {
          setPendingSensitiveAction({
            toolName: detected.name,
            args: detected.args,
            prompt: toolDef.confirmationPrompt || `Confirm execution of ${detected.name}?`,
          });
          setIsLoading(false);
          return;
        }

        try {
          const toolRes = await executeAgentTool(detected.name, detected.args, {
            user,
            topics,
            evaluations,
            articles,
            questions,
            mcqAttempts: [],
            onNavigateTab,
          });

          executedToolCall = {
            id: `call-${Date.now()}`,
            name: detected.name,
            arguments: detected.args,
            result: toolRes.result,
            status: "success",
          };
        } catch (tErr) {
          console.warn("Tool execution error:", tErr);
        }
      }

      // Re-compute fresh live context on each message to ensure 100% sync
      const freshContext = computeBoltAppContext(user, topics, evaluations, articles, questions);

      const sessionToken = localStorage.getItem("bolt_auth_token");
      const authHeaders: Record<string, string> = sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {};

      // Send compact payload to prevent HTTP payload bloat and socket resets
      const compactTopics = (topics || []).slice(0, 45).map((t) => ({
        id: t.id,
        name: t.name,
        completionPercentage: t.completionPercentage,
        knowledgeScore: t.knowledgeScore,
        paper: t.paper,
      }));

      const compactEvaluations = (evaluations || []).slice(0, 5).map((e) => ({
        id: e.id,
        questionText: e.questionText,
        score: e.score,
        maxMarks: e.maxMarks,
        subject: e.subject,
      }));

      const compactArticles = (articles || []).slice(0, 3).map((a) => ({
        headline: a.headline,
        source: a.source,
        gsTags: a.gsTags,
      }));

      const conversationalSystemPrompt = buildClaudeConversationalSystemPrompt(user, freshContext, {
        tone: engagementTone,
        mode,
      });

      const payloadBody = JSON.stringify({
        message: query,
        systemPrompt: conversationalSystemPrompt,
        systemPromptOverride: conversationalSystemPrompt,
        engagementTone,
        history: messages.slice(-8).map((m) => ({
          role: m.role,
          text: m.text,
          name: m.role === "assistant" ? "BOLT" : (user.name || "Student"),
        })),
        mode,
        user,
        topics: compactTopics,
        evaluations: compactEvaluations,
        articles: compactArticles,
        timetableSlots: (timetableSlots || []).slice(0, 7),
        studySessions: (studySessions || []).slice(0, 5),
        modelId: activeModelConfig?.selectedModelId || "gemini-3.1-flash-lite",
        modelType: activeModelConfig?.modelType || "cloud",
        provider: activeModelConfig?.provider || (activeModelConfig?.modelType === "local" ? "local" : "gemini"),
        apiKey: activeModelConfig?.apiKey,
        baseUrl: activeModelConfig?.baseUrl,
        localEndpoint: activeModelConfig?.localEndpoint || "http://localhost:11434",
        activeAdapter: activeModelConfig?.activeAdapter,
        temperature: activeModelConfig?.temperature ?? 0.7,
        appContext: freshContext,
        toolExecution: executedToolCall ? { name: executedToolCall.name, result: executedToolCall.result } : undefined,
        currentContext: {
          user,
          optionalSubject: user.optionalSubject || "Public Administration",
          syllabusCompletion: `${freshContext.syllabus.overallCompletion}% overall`,
          paper1Completion: `${freshContext.syllabus.paper1Completion}%`,
          paper2Completion: `${freshContext.syllabus.paper2Completion}%`,
          weakTopics: freshContext.syllabus.weakTopics.map((w) => `${w.name} (${w.score}%)`),
          strongTopics: freshContext.syllabus.strongTopics.map((s) => `${s.name} (${s.score}%)`),
          questionsAttempted: freshContext.prelimsPerformance.questionsAttempted,
          mainsEvaluatedCount: freshContext.mainsPerformance.evaluatedCount,
          mainsAverage: `${freshContext.mainsPerformance.averageScore} / 15 Marks`,
          prelimsAccuracy: `${freshContext.prelimsPerformance.accuracyPercentage}%`,
          revisionDueCount: freshContext.revisionStatus.dueCount,
          weeklyPlannedHours: freshContext.studySchedule.weeklyPlannedHours,
          weeklyTrackedHours: freshContext.studySchedule.weeklyTrackedHours,
          systemContextText: freshContext.systemContextText,
        },
      });

      // Resilient fetch with timeout and 1-time retry
      const doFetch = async (attempt = 1): Promise<Response> => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);
        try {
          const res = await fetch("/api/bolt/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeaders },
            body: payloadBody,
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          return res;
        } catch (fetchErr: any) {
          clearTimeout(timeoutId);
          if (attempt < 2) {
            await new Promise((r) => setTimeout(r, 600));
            return doFetch(attempt + 1);
          }
          throw fetchErr;
        }
      };

      const response = await doFetch();

      let data: any;
      try {
        const rawText = await response.text();
        data = JSON.parse(rawText);
      } catch {
        data = {
          success: false,
          status: "AI_FALLBACK",
          isFallback: true,
          response: null,
        };
      }

      const isFallback = Boolean(data.isFallback || data.status === "AI_FALLBACK" || !response.ok);
      const rawReply = data.response || (data.error ? `**Notice:** ${data.error}` : null) || generateLocalKnowledgeAnswer(query, user, engagementTone);

      const parsedThought = extractOrGenerateThoughtProcess(
        rawReply,
        query,
        user.optionalSubject || "Public Administration"
      );

      const assistantMsg: ChatMessage = {
        id: "a-" + Date.now(),
        role: "assistant",
        text: parsedThought.cleanedText,
        thoughtProcess: parsedThought.thoughtProcess,
        reasoningPhases: parsedThought.reasoningPhases,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        mode,
        status: (data.status as any) || (isFallback ? "AI_FALLBACK" : "AI_SUCCESS"),
        isFallback,
        engine: data.engine || "Bolt Academic Knowledge Base",
        citations: data.citations || [],
        toolCalls: executedToolCall ? [executedToolCall] : undefined,
      };

      appendMessageToActiveThread(assistantMsg);

      // Save to Firestore if authenticated
      if (user.id && !user.id.startsWith("guest") && user.id !== "aspirant-default") {
        saveFirebaseChatMessage(user.id, userMsg).catch(() => {});
        saveFirebaseChatMessage(user.id, assistantMsg).catch(() => {});
      }
    } catch (error: any) {
      console.warn("Bolt chat connection notice:", error?.message || error);
      const localAnswer = generateLocalKnowledgeAnswer(query, user, engagementTone);
      const parsedFallbackThought = extractOrGenerateThoughtProcess(
        localAnswer,
        query,
        user.optionalSubject || "Public Administration"
      );
      const fallbackMsg: ChatMessage = {
        id: "a-" + Date.now(),
        role: "assistant",
        text: parsedFallbackThought.cleanedText,
        thoughtProcess: parsedFallbackThought.thoughtProcess,
        reasoningPhases: parsedFallbackThought.reasoningPhases,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        mode,
        status: "AI_FALLBACK",
        isFallback: true,
        engine: "Bolt Offline Academic Synthesis",
      };
      appendMessageToActiveThread(fallbackMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    {
      label: "⚡ How can you help me in this app?",
      prompt: "How can you help me in this app? Give me a complete tour of your in-app capabilities, tools, and access.",
    },
    {
      label: "📊 Where am I lagging?",
      prompt: "Analyze my Public Administration syllabus progress, topic knowledge scores, and critical weak units.",
    },
    {
      label: "🎯 Practice 2 Prelims MCQs",
      prompt: "Give me 2 high-yield UPSC Prelims MCQs on delegated legislation and administrative accountability with full explanations.",
    },
    {
      label: "📝 Model Answer: Herbert Simon",
      prompt: "Give me a 15-marker UPSC Mains model answer for Herbert Simon's Bounded Rationality with diagram and 2nd ARC citations.",
    },
    {
      label: "🗺️ Concept Knowledge Graph",
      prompt: "Show me how the Concept Knowledge Graph connects Public Administration thinkers to Indian administration realities.",
    },
    {
      label: "📅 Build my weekly study plan",
      prompt: "Create a personalized 7-day revision timetable targeting my weakest units in Paper 1 and Paper 2.",
    },
  ];

  const appWorkspaces: Array<{
    id: NavigationTab;
    label: string;
    description: string;
    icon: string;
    suggestedPrompt: string;
  }> = [
    {
      id: "prelims",
      label: "Prelims Simulator",
      description: "Timed 4-option MCQs with syllabus linkage & accuracy analysis",
      icon: "🎯",
      suggestedPrompt: "Quiz me on 2 high-yield Prelims MCQs for Indian Polity & Administration.",
    },
    {
      id: "mains",
      label: "Mains 7-Dimension Evaluator",
      description: "Grade typed/handwritten answers with 7-dimension UPSC rubric",
      icon: "📝",
      suggestedPrompt: "How can I improve my score from 8 to 11 marks in a 15-mark Public Administration Mains answer?",
    },
    {
      id: "planner",
      label: "Study Timetable & Planner",
      description: "Adaptive schedule with Ebbinghaus spaced-repetition slots",
      icon: "📅",
      suggestedPrompt: "Generate an adaptive study schedule for this week addressing my lowest-scoring units.",
    },
    {
      id: "knowledgeGraph",
      label: "Concept Knowledge Graph",
      description: "2D interactive map of Thinkers, Articles, and Indian realities",
      icon: "🗺️",
      suggestedPrompt: "Explain the link between Chester Barnard's Zone of Indifference and street-level bureaucracy in India.",
    },
    {
      id: "learn",
      label: "Syllabus & Knowledge Mastery",
      description: "Track Paper 1 & Paper 2 completion vs diagnostic mastery",
      icon: "📊",
      suggestedPrompt: "Break down the difference between my syllabus completion and knowledge mastery.",
    },
    {
      id: "ncert",
      label: "NCERT Foundation",
      description: "Classes 6-12 foundational chapter summaries & diagnostic quizzes",
      icon: "📖",
      suggestedPrompt: "Give me a quick foundational drill on Indian Constitution at Work (NCERT Class 11).",
    },
    {
      id: "pyqs",
      label: "Historical PYQs Archive",
      description: "Explore 19th-century, early republic, and modern peripheral questions",
      icon: "📜",
      suggestedPrompt: "What are the recurring themes in UPSC Public Administration PYQs over the last 10 years?",
    },
    {
      id: "news",
      label: "Curated Current Affairs",
      description: "The Hindu, Livemint & PIB editorials mapped to GS papers with MCQs",
      icon: "📰",
      suggestedPrompt: "Summarize today's top editorial developments with 3 Prelims facts and 2 Mains Public Administration dimensions.",
    },
    {
      id: "knowledge",
      label: "2nd ARC Knowledge Base",
      description: "Indexed 2nd ARC reports (Ethics, Personnel, Local Governance, RTI)",
      icon: "📚",
      suggestedPrompt: "What are the most important recommendations of the 2nd ARC 4th Report on Ethics in Governance?",
    },
    {
      id: "schedule",
      label: "Focus & Pomodoro Timer",
      description: "Track deep study sessions and build consecutive study streaks",
      icon: "⏱️",
      suggestedPrompt: "How can I optimize my Pomodoro focus intervals for intense UPSC answer writing?",
    },
    {
      id: "settings",
      label: "AI Engine & Settings",
      description: "Switch models (Gemini, Groq, OpenAI, Claude) and tune keys",
      icon: "⚙️",
      suggestedPrompt: "Show me my current active AI model settings and inference status.",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-4 h-[calc(100vh-4.5rem)] flex flex-row relative w-full overflow-hidden">
      {/* Chat History Sidebar */}
      <ChatHistorySidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        threads={threads}
        activeThreadId={activeThreadId}
        onSelectThread={handleSelectThread}
        onNewThread={handleNewThread}
        onRenameThread={handleRenameThread}
        onDeleteThread={handleDeleteThread}
      />

      {/* Main Chat Workspace */}
      <div className="flex-1 min-w-0 flex flex-col h-full relative">
        {/* Mentor Header & Mode Switcher */}
        <div className="bg-[#111723] rounded-2xl border border-[#1e293b] p-3 sm:p-4 mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
              <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-bold text-white text-base sm:text-lg font-['Outfit'] flex items-center gap-1.5">
                  <span>BOLT AI</span>
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Active & Connected</span>
                </span>
              </div>
              <p className="text-slate-400 text-xs truncate sm:whitespace-normal">
                Claude-grade conversational mentor with live bidirectional access to your UPSC workspace & performance data.
              </p>
              {/* Active Thread Topic & Quick Rename Indicator */}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-[11px] text-slate-400">Thread:</span>
                {isHeaderRenaming ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (headerRenameTitle.trim()) {
                        handleRenameThread(activeThread.id, headerRenameTitle.trim());
                      }
                      setIsHeaderRenaming(false);
                    }}
                    className="flex items-center gap-1"
                  >
                    <input
                      type="text"
                      value={headerRenameTitle}
                      onChange={(e) => setHeaderRenameTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setIsHeaderRenaming(false);
                      }}
                      autoFocus
                      className="px-2 py-0.5 bg-[#0b0f17] border border-blue-500 rounded text-xs text-white focus:outline-none max-w-[200px] sm:max-w-xs"
                      placeholder="Thread title..."
                    />
                    <button
                      type="submit"
                      className="p-1 rounded bg-blue-600 text-white hover:bg-blue-500"
                      title="Save title"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsHeaderRenaming(false)}
                      className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                      title="Cancel"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-1.5 group">
                    <span
                      className="text-xs font-semibold text-slate-200 truncate max-w-[180px] sm:max-w-xs cursor-pointer hover:text-blue-300 transition-colors"
                      onClick={() => {
                        setHeaderRenameTitle(activeThread.title);
                        setIsHeaderRenaming(true);
                      }}
                      title="Click to rename thread"
                    >
                      {activeThread.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setHeaderRenameTitle(activeThread.title);
                        setIsHeaderRenaming(true);
                      }}
                      className="p-0.5 text-slate-400 hover:text-blue-300 transition-colors"
                      title="Rename this conversation thread"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Controls & Mode Switcher */}
          <div className="flex items-center space-x-2 self-start sm:self-center flex-wrap gap-y-1">
            {/* Toggle Chat History Sidebar */}
            <button
              type="button"
              onClick={handleToggleSidebar}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs transition-colors flex items-center gap-1.5 ${
                isSidebarOpen
                  ? "bg-blue-600/30 border-blue-500/50 text-blue-200 font-semibold"
                  : "bg-[#162033] hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white"
              }`}
              title={isSidebarOpen ? "Close chat history sidebar" : "Open chat history sidebar"}
              aria-label="Toggle Chat History sidebar"
            >
              <History className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">History</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-mono">
                {threads.length}
              </span>
            </button>

            <button
              onClick={() => setShowWorkspaceNavigator((prev) => !prev)}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs transition-colors flex items-center gap-1.5 ${
                showWorkspaceNavigator
                  ? "bg-blue-600/30 border-blue-500/50 text-blue-200 font-semibold"
                  : "bg-[#162033] hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white"
              }`}
              title="Explore all in-app study tools"
            >
              <Compass className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">App Tools</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-mono">11</span>
            </button>

            <button
              onClick={handleNewThread}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1"
              title="Start new conversation"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Chat</span>
            </button>

          <div className="flex items-center space-x-1 bg-[#162033] p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setMode("public_admin")}
              className={`px-2.5 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all ${
                mode === "public_admin"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Pub Admin</span>
            </button>
            <button
              onClick={() => setMode("general")}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                mode === "general"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              General GS
            </button>
          </div>
        </div>
      </div>

      {/* Conversational Tone & Claude-Style System Prompt Architecture Bar */}
      <div className="bg-[#0e1420] rounded-xl border border-slate-800/80 px-3 py-2 mb-3 flex flex-wrap items-center justify-between gap-2 shadow-sm text-xs flex-shrink-0">
        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
          <div className="flex items-center space-x-1.5 text-amber-400 font-semibold">
            <HeartHandshake className="w-4 h-4 text-amber-400" />
            <span className="text-slate-200">Conversational Persona:</span>
          </div>
          <div className="flex items-center space-x-1 bg-[#141b2b] p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setEngagementTone("empathetic_socratic")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                engagementTone === "empathetic_socratic"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Empathetic & Socratic: active listening, empathetic guidance, and step-by-step reasoning"
            >
              🤝 Empathetic & Socratic
            </button>
            <button
              type="button"
              onClick={() => setEngagementTone("deep_analytical")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                engagementTone === "deep_analytical"
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/40 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Deep Analytical: multi-paradigmatic comparative analysis & thinker literature"
            >
              🔬 Deep Analytical
            </button>
            <button
              type="button"
              onClick={() => setEngagementTone("exam_strategist")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                engagementTone === "exam_strategist"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Exam Strategist: 10/15-marker structure, keyword density, and examiner expectations"
            >
              🎯 Exam Strategist
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setExpandAllThoughts((prev) => !prev)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors flex items-center space-x-1.5 ${
              expandAllThoughts
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold"
                : "bg-[#141b2b] hover:bg-slate-800 text-slate-300 border-slate-700"
            }`}
            title="Expand or collapse step-by-step reasoning processes across all responses"
          >
            <Brain className="w-3.5 h-3.5 text-amber-400" />
            <span>{expandAllThoughts ? "Collapse Reasoning" : "Expand All Reasoning"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPromptModal(true)}
            className="px-2.5 py-1 rounded-lg bg-[#141b2b] hover:bg-slate-800 text-blue-300 hover:text-blue-200 border border-blue-500/30 text-[11px] font-medium transition-colors flex items-center space-x-1.5"
            title="Inspect the active Claude-style system prompt and reasoning directives"
          >
            <Eye className="w-3.5 h-3.5 text-blue-400" />
            <span>Inspect System Prompt</span>
          </button>
        </div>
      </div>

      {/* Expandable Workspace & Tools Directory */}
      {showWorkspaceNavigator && (
        <div className="mb-3 p-3.5 rounded-2xl bg-[#0f172a]/95 border border-blue-500/30 shadow-xl backdrop-blur-md flex-shrink-0 animate-fadeIn space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-['Outfit']">
                Bolt AI In-App Command Directory (11 Workspaces)
              </h3>
            </div>
            <button
              onClick={() => setShowWorkspaceNavigator(false)}
              className="text-slate-400 hover:text-white text-xs font-medium px-2 py-0.5 rounded hover:bg-slate-800"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
            {appWorkspaces.map((ws) => (
              <div
                key={ws.id}
                className="p-2.5 rounded-xl bg-[#162033]/80 hover:bg-[#1f2d48] border border-slate-800/80 hover:border-blue-500/40 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm">{ws.icon}</span>
                    <span className="text-xs font-bold text-slate-200 group-hover:text-blue-300 transition-colors line-clamp-1">
                      {ws.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                    {ws.description}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-800/60">
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateTab(ws.id);
                      setShowWorkspaceNavigator(false);
                    }}
                    className="flex-1 py-1 px-2 rounded-lg bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white text-[10px] font-semibold transition-colors text-center"
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sendMessage(ws.suggestedPrompt);
                      setShowWorkspaceNavigator(false);
                    }}
                    className="py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] transition-colors"
                    title="Ask Bolt about this"
                  >
                    Ask Bolt
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1 sm:pr-2 scrollbar-thin"
      >
        {messages.map((msg) => {
          const isUser = msg.role === "user";

          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${isUser ? "flex-row-reverse space-x-reverse" : ""}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  isUser
                    ? "bg-gradient-to-tr from-purple-600 to-blue-600 text-white"
                    : "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Zap className="w-4 h-4 fill-white" />}
              </div>

              <div
                className={`max-w-[90%] sm:max-w-2xl rounded-2xl p-4 sm:p-5 text-xs sm:text-sm space-y-3 leading-relaxed shadow-sm relative group ${
                  isUser
                    ? "bg-blue-600 text-white rounded-tr-none"
                    : "bg-[#111723] text-slate-200 border border-[#1e293b] rounded-tl-none"
                }`}
              >
                {/* Claude-Grade Conversational Reasoning Badge & Quick Copy */}
                {!isUser && (
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 text-[11px] gap-2">
                    <div className="flex items-center space-x-1.5 text-blue-300 font-medium truncate">
                      <HeartHandshake className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span className="truncate">
                        {engagementTone === "empathetic_socratic"
                          ? "Claude-Grade Mentorship • Active Listening & Empathy"
                          : engagementTone === "deep_analytical"
                          ? "Claude-Grade Mentorship • Deep Analytical Rigor"
                          : "Claude-Grade Mentorship • High-Yield Exam Architecture"}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.id, msg.text, "answer")}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-medium flex items-center space-x-1 transition-all border ${
                          copiedAction?.id === msg.id && copiedAction.type === "answer"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold"
                            : "bg-[#141d2f] hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/70"
                        }`}
                        title="Copy AI answer text to clipboard"
                      >
                        {copiedAction?.id === msg.id && copiedAction.type === "answer" ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-400" />
                            <span>Copy Answer</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyFullNote(msg)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-medium flex items-center space-x-1 transition-all border ${
                          copiedAction?.id === msg.id && copiedAction.type === "full"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold"
                            : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30"
                        }`}
                        title="Copy answer + step-by-step reasoning notes to clipboard"
                      >
                        {copiedAction?.id === msg.id && copiedAction.type === "full" ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Copied Full Note!</span>
                          </>
                        ) : (
                          <>
                            <Brain className="w-3 h-3 text-amber-400" />
                            <span className="hidden sm:inline">Copy + Reasoning</span>
                            <span className="sm:hidden">Full</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Knowledge Engine Synthesis Badge (Offline Mode) */}
                {!isUser && msg.isFallback && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-950/40 border border-blue-500/30 text-blue-200 text-[11px] font-medium">
                    <Sparkles className="w-3.5 h-3.5 flex-shrink-0 text-blue-400" />
                    <span>
                      {msg.status === "AI_UNAVAILABLE"
                        ? "Offline Synthesis: Instant knowledge engine response."
                        : `Offline Academic Synthesis • ${msg.engine || "Syllabus Knowledge Base"}`}
                    </span>
                  </div>
                )}

                {/* Agent Tool Execution Badge */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="space-y-2 pb-2">
                    {msg.toolCalls.map((tc) => {
                      const insight = (tc.result as any)?.traceInsight;
                      return (
                        <div
                          key={tc.id}
                          className="p-3 rounded-xl bg-[#0d1525] border border-blue-500/40 text-[11px] shadow-sm"
                        >
                          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                            <div className="flex items-center space-x-2">
                              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                              <span className="font-semibold text-blue-200">
                                {insight?.headline || `⚡ Verified Tool Execution: ${tc.name}`}
                              </span>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold text-[10px] flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Live App Data</span>
                            </span>
                          </div>

                          {insight?.bullets && (
                            <div className="mt-2 space-y-1">
                              {insight.bullets.map((b: string, bIdx: number) => (
                                <div key={bIdx} className="flex items-start space-x-1.5 text-slate-300 text-[11px]">
                                  <span className="text-emerald-400 font-bold">✓</span>
                                  <span>{b.replace(/^✓\s*/, "")}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {insight?.findings && insight.findings.length > 0 && (
                            <div className="mt-2 p-2 rounded-lg bg-red-950/30 border border-red-900/40 text-[11px]">
                              <div className="font-semibold text-red-300 mb-1">Deficits requiring attention:</div>
                              {insight.findings.map((f: string, fIdx: number) => (
                                <div key={fIdx} className="text-red-200">• {f}</div>
                              ))}
                            </div>
                          )}

                          {insight?.recommendation && (
                            <div className="mt-2 text-blue-300 italic text-[11px]">
                              💡 {insight.recommendation}
                            </div>
                          )}

                          <details className="mt-2 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400">
                            <summary className="cursor-pointer hover:text-slate-200 flex items-center gap-1 font-medium">
                              <span>View technical analysis</span>
                              <ChevronDown className="w-3 h-3" />
                            </summary>
                            <pre className="mt-1.5 p-2 bg-black/60 rounded text-[9px] font-mono text-slate-300 overflow-x-auto max-h-36">
                              {JSON.stringify(tc.result, null, 2)}
                            </pre>
                          </details>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Expandable Thought Process Section */}
                {!isUser && (
                  <div className="pb-2">
                    <ExpandableThoughtProcess
                      key={`${msg.id}-${expandAllThoughts}`}
                      thoughtProcess={msg.thoughtProcess}
                      reasoningPhases={
                        msg.reasoningPhases && msg.reasoningPhases.length > 0
                          ? msg.reasoningPhases
                          : extractOrGenerateThoughtProcess(msg.text, undefined, user.optionalSubject).reasoningPhases
                      }
                      durationEstimateSeconds={
                        Math.max(1.8, Math.min(4.2, +(msg.text.length / 420).toFixed(1)))
                      }
                      initiallyExpanded={expandAllThoughts}
                    />
                  </div>
                )}

                {/* Rich Markdown Rendered Body */}
                <div className="markdown-body text-slate-200 text-xs sm:text-sm leading-relaxed space-y-2.5">
                  <Markdown
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-base sm:text-lg font-bold text-white mt-3.5 mb-1.5 pb-1 border-b border-slate-700/60">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-sm sm:text-base font-bold text-blue-200 mt-3 mb-1">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-xs sm:text-sm font-bold text-amber-300 mt-2.5 mb-1">
                          {children}
                        </h3>
                      ),
                      h4: ({ children }) => (
                        <h4 className="text-xs sm:text-sm font-semibold text-slate-200 mt-2 mb-0.5">
                          {children}
                        </h4>
                      ),
                      p: ({ children }) => <p className="mb-2 leading-relaxed text-slate-200">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1 text-slate-200">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1 text-slate-200">{children}</ol>,
                      li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                      em: ({ children }) => <em className="italic text-slate-300">{children}</em>,
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-2 border-blue-500/80 pl-3 py-1 my-2 bg-blue-950/20 rounded-r-lg text-slate-300 text-xs italic">
                          {children}
                        </blockquote>
                      ),
                      code: ({ inline, children, ...props }: any) =>
                        inline ? (
                          <code className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-[11px]" {...props}>
                            {children}
                          </code>
                        ) : (
                          <code className="block p-3 rounded-xl bg-[#0b101b] border border-slate-800 text-slate-200 font-mono text-xs overflow-x-auto my-2" {...props}>
                            {children}
                          </code>
                        ),
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-3 rounded-xl border border-slate-800">
                          <table className="w-full text-left text-xs border-collapse">{children}</table>
                        </div>
                      ),
                      thead: ({ children }) => <thead className="bg-[#162033] text-slate-200 border-b border-slate-700/60">{children}</thead>,
                      th: ({ children }) => <th className="p-2 font-semibold text-slate-100">{children}</th>,
                      td: ({ children }) => <td className="p-2 border-b border-slate-800/60 text-slate-300">{children}</td>,
                      a: ({ href, children }) => {
                        if (href && href.startsWith("#action:")) {
                          const actionTab = href.replace("#action:", "") as NavigationTab;
                          return (
                            <button
                              type="button"
                              onClick={() => onNavigateTab(actionTab)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 my-1 mx-0.5 rounded-lg bg-blue-600/25 hover:bg-blue-600/40 border border-blue-500/40 text-blue-200 hover:text-white font-medium text-xs transition-all cursor-pointer shadow-sm"
                            >
                              <span>{children}</span>
                              <ArrowRight className="w-3 h-3 text-blue-400" />
                            </button>
                          );
                        }
                        if (href && href.startsWith("#prompt:")) {
                          const promptText = decodeURIComponent(href.replace("#prompt:", ""));
                          return (
                            <button
                              type="button"
                              onClick={() => sendMessage(promptText)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 my-1 mx-0.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/40 text-emerald-200 hover:text-white font-medium text-xs transition-all cursor-pointer shadow-sm"
                            >
                              <Sparkles className="w-3 h-3 text-emerald-400" />
                              <span>{children}</span>
                            </button>
                          );
                        }
                        return (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline inline-flex items-center gap-0.5 font-medium"
                          >
                            {children}
                          </a>
                        );
                      },
                    }}
                  >
                    {msg.text}
                  </Markdown>
                </div>

                {/* Verified RAG Citations */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-amber-400">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Verified Knowledge Sources ({msg.citations.length})</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono">High Confidence RAG</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {msg.citations.map((cite, cIdx) => {
                        const isCurrentAffairs =
                          cite.category?.toLowerCase().includes("current") ||
                          cite.documentTitle?.toLowerCase().includes("pib") ||
                          cite.documentTitle?.toLowerCase().includes("hindu");
                        const isUploaded =
                          cite.category?.toLowerCase().includes("upload") ||
                          cite.category?.toLowerCase().includes("custom");

                        return (
                          <div
                            key={cIdx}
                            className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-[11px] space-y-1 hover:border-amber-500/40 transition-colors"
                          >
                            <div className="flex items-center justify-between font-semibold text-slate-200">
                              <span className="truncate pr-2">{cite.documentTitle}</span>
                              <span className="text-[10px] text-amber-400 font-mono flex-shrink-0">
                                p.{cite.approxPage || 1}
                              </span>
                            </div>
                            {cite.excerpt && (
                              <p className="text-[10px] text-slate-400 italic line-clamp-2">
                                "{cite.excerpt}"
                              </p>
                            )}
                            <div className="flex items-center justify-between pt-1 text-[9px] text-slate-400">
                              <span className="inline-flex items-center gap-1 font-semibold text-blue-300">
                                {isUploaded ? (
                                  <>
                                    <FileText className="w-3 h-3 text-indigo-400" />
                                    <span>📄 Uploaded material</span>
                                  </>
                                ) : isCurrentAffairs ? (
                                  <>
                                    <Globe className="w-3 h-3 text-cyan-400" />
                                    <span>🌐 Current-affairs source</span>
                                  </>
                                ) : (
                                  <>
                                    <Bookmark className="w-3 h-3 text-amber-400" />
                                    <span>📚 UPSC/PYQ Canon</span>
                                  </>
                                )}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                                {cite.category}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Optional Action Cards */}
                {msg.actionCards && msg.actionCards.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-800">
                    {msg.actionCards.map((card, cIdx) => (
                      <div
                        key={cIdx}
                        className="p-2.5 rounded-xl bg-[#162033] border border-slate-800 space-y-1.5"
                      >
                        <h4 className="font-bold text-white text-xs">{card.title}</h4>
                        <p className="text-[11px] text-slate-400">{card.description}</p>
                        <button
                          onClick={() => {
                            if (card.targetTab) {
                              onNavigateTab(card.targetTab);
                            } else {
                              sendMessage(card.title);
                            }
                          }}
                          className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                        >
                          <span>{card.actionLabel}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Message Footer: Timestamp & Copy to Clipboard Action Bar */}
                <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-800/60 text-[11px] gap-2">
                  <div className="flex items-center flex-wrap gap-2">
                    {!isUser ? (
                      <>
                        {/* Primary Copy Answer Button */}
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.id, msg.text, "answer")}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-all border shadow-sm ${
                            copiedAction?.id === msg.id && copiedAction.type === "answer"
                              ? "bg-emerald-500/25 text-emerald-300 border-emerald-500/50 font-semibold"
                              : "bg-[#141e30] hover:bg-[#1a273e] text-slate-200 hover:text-white border-slate-700/80 hover:border-slate-600"
                          }`}
                          title="Copy AI-generated answer to clipboard"
                        >
                          {copiedAction?.id === msg.id && copiedAction.type === "answer" ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="font-semibold text-emerald-300">Copied Answer!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-blue-400" />
                              <span>Copy to Clipboard</span>
                            </>
                          )}
                        </button>

                        {/* Copy Full Note with Reasoning Notes */}
                        <button
                          type="button"
                          onClick={() => handleCopyFullNote(msg)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-all border shadow-sm ${
                            copiedAction?.id === msg.id && copiedAction.type === "full"
                              ? "bg-emerald-500/25 text-emerald-300 border-emerald-500/50 font-semibold"
                              : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border-amber-500/30"
                          }`}
                          title="Save comprehensive study note with reasoning chain and answer"
                        >
                          {copiedAction?.id === msg.id && copiedAction.type === "full" ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="font-semibold text-emerald-300">Copied Full Note!</span>
                            </>
                          ) : (
                            <>
                              <Brain className="w-3.5 h-3.5 text-amber-400" />
                              <span>Copy Answer + Reasoning Notes</span>
                            </>
                          )}
                        </button>

                        {/* Copy Reasoning Only */}
                        <button
                          type="button"
                          onClick={() => handleCopyReasoningOnly(msg)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-medium flex items-center gap-1 transition-all border ${
                            copiedAction?.id === msg.id && copiedAction.type === "reasoning"
                              ? "bg-emerald-500/25 text-emerald-300 border-emerald-500/50 font-semibold"
                              : "bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700/60"
                          }`}
                          title="Copy only step-by-step reasoning notes"
                        >
                          {copiedAction?.id === msg.id && copiedAction.type === "reasoning" ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-300">Copied Reasoning!</span>
                            </>
                          ) : (
                            <span>Reasoning Notes Only</span>
                          )}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.id, msg.text, "answer")}
                        className="opacity-70 hover:opacity-100 flex items-center gap-1 text-blue-200 hover:text-white text-[10px] transition-opacity"
                        title="Copy query text"
                      >
                        {copiedAction?.id === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-white" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Prompt</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <span className={isUser ? "text-blue-200 text-[10px]" : "text-slate-400 text-[10px] font-mono"}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white flex-shrink-0">
              <Zap className="w-4 h-4 fill-white animate-pulse" />
            </div>
            <div className="bg-[#111723] border border-[#1e293b] rounded-2xl rounded-tl-none p-4 text-xs text-slate-300 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
              <span>Bolt is synthesizing UPSC syllabus & your latest metrics...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="absolute bottom-28 right-6 z-20 flex items-center gap-1.5 px-3 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xl border border-blue-400/30 transition-all transform hover:scale-105 active:scale-95"
          title="Scroll to latest message"
        >
          <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
          <span>Latest message</span>
        </button>
      )}

      {/* Sensitive Action Confirmation Dialog */}
      {pendingSensitiveAction && (
        <div className="mb-2 p-3.5 rounded-2xl bg-amber-950/50 border border-amber-500/60 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn flex-shrink-0">
          <div className="flex items-start space-x-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-200">Confirmation Required for Sensitive Action</h4>
              <p className="text-[11px] text-slate-300">{pendingSensitiveAction.prompt}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 self-end sm:self-center">
            <button
              onClick={() => setPendingSensitiveAction(null)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                const action = pendingSensitiveAction;
                setPendingSensitiveAction(null);
                try {
                  const toolRes = await executeAgentTool(action.toolName, action.args, {
                    user,
                    topics,
                    evaluations,
                    articles,
                    questions,
                    mcqAttempts: [],
                    onNavigateTab,
                  });
                  const confMsg: ChatMessage = {
                    id: "c-" + Date.now(),
                    role: "assistant",
                    text: `✅ **Action Confirmed and Completed**: ${toolRes.summary}`,
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                  };
                  appendMessageToActiveThread(confMsg);
                } catch (err) {
                  console.error(err);
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md shadow-red-600/30 transition-colors"
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {/* Quick Prompt Chips */}
      <div className="py-2 overflow-x-auto flex items-center space-x-2 flex-shrink-0 scrollbar-none">
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => sendMessage(qp.prompt)}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-xl bg-[#162033] hover:bg-[#1f2d48] border border-slate-800 text-slate-300 hover:text-white text-xs whitespace-nowrap transition-colors flex items-center space-x-1.5 flex-shrink-0"
          >
            <Sparkles className="w-3 h-3 text-blue-400" />
            <span>{qp.label}</span>
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className="flex items-center space-x-2 bg-[#111723] rounded-2xl border border-[#1e293b] p-2 flex-shrink-0 shadow-lg"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={`Ask Bolt anything (${mode === "public_admin" ? "Pub Admin Paper 1 & 2" : "UPSC GS"})...`}
          className="flex-grow bg-transparent text-sm text-white placeholder-slate-500 px-3 py-2 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || isLoading}
          className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white transition-colors shadow-md shadow-blue-600/30 flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* System Prompt & Conversational Architecture Modal */}
      {showPromptModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-[#0f172a] border border-blue-500/30 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#131d31]">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-['Outfit']">
                    Claude-Style Conversational System Prompt & Architecture
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Live active listening directives, pedagogical empathy, and 5-phase step-by-step reasoning
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPromptModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed scrollbar-thin">
              {/* Highlight Architecture Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-[#162033] border border-blue-500/30 space-y-1">
                  <div className="flex items-center space-x-1.5 text-blue-300 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Active Listening Mandate</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Directly addresses and reflects the user's emotional and academic premise first. Bans generic conversational openers like "Certainly!", "Sure thing!", or "As an AI...".
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#162033] border border-amber-500/30 space-y-1">
                  <div className="flex items-center space-x-1.5 text-amber-300 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>5-Phase Step-by-Step Reasoning</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Structures explanations through Active Reflection → First Principles → Indian Administrative Reality (2nd ARC) → UPSC CSE Scoring Edge → Collaborative Action.
                  </p>
                </div>
              </div>

              {/* Persona Mode Highlights */}
              <div className="p-3 rounded-xl bg-[#121927] border border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Current Selected Tone:</span>
                <span className="font-semibold text-amber-300 uppercase tracking-wide">
                  {engagementTone.replace("_", " ")}
                </span>
              </div>

              {/* Dynamic Compiled System Prompt */}
              <div>
                <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Compiled Prompt Sent to Bolt AI Gateway:</span>
                  <span className="text-slate-400 font-normal lowercase">live context synced</span>
                </div>
                <pre className="p-3.5 bg-[#090e17] rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 whitespace-pre-wrap max-h-72 overflow-y-auto leading-relaxed scrollbar-thin">
                  {buildClaudeConversationalSystemPrompt(user, liveContext, {
                    tone: engagementTone,
                    mode,
                  })}
                </pre>
              </div>
            </div>

            <div className="p-3 border-t border-slate-800 bg-[#131d31] flex justify-end">
              <button
                type="button"
                onClick={() => setShowPromptModal(false)}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

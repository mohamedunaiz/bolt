export type NavigationTab =
  | "home"
  | "learn"
  | "knowledge"
  | "knowledgeGraph"
  | "prelims"
  | "mains"
  | "materials"
  | "ncert"
  | "news"
  | "schedule"
  | "planner"
  | "bolt"
  | "pyqs"
  | "settings";

export interface UpscPyqItem {
  id: string;
  year: number;
  stage: "Prelims" | "Mains";
  paper: "GS 1" | "GS 2" | "GS 3" | "GS 4" | "PubAdmin Paper 1" | "PubAdmin Paper 2";
  unit: string;
  topic: string;
  subtopic: string;
  questionType: "MCQ" | "10-Marker" | "15-Marker" | "20-Marker" | "Case Study";
  marks: number;
  questionText: string;
  verification: {
    tier: "VERIFIED_OFFICIAL_PYQ" | "VERIFIED_RELIABLE_ARCHIVE" | "PRACTICE_QUESTION";
    verified: boolean;
    source: string;
    sourceUrl: string | null;
    note: string;
    officialAnswerVerified?: boolean;
  };
  syllabusMapping: {
    paper: string;
    subject: string;
    topic: string;
    subtopic: string;
  };
  commandWord?: string;
  wordLimit?: number;
  demandAnalysis?: {
    coreDemand: string;
    dimensions: string[];
    commandWordGuide: string;
    relevantConstitutionalArticles?: string[];
    relevantCommittees?: string[];
    relevantThinkers?: string[];
    staticCurrentLinkage?: string;
  };
  recurringThemeId?: string;
  recurringThemeLabel?: string;
  difficulty: "Easy" | "Medium" | "Hard";
  relatedThinkers?: string[];
  constitutionalArticles?: string[];
  secondArcReports?: string[];
  options?: { key: string; text: string }[];
  correctOption?: string;
  explanation?: string;
  optionAnalysis?: { optionKey: string; analysis: string; isCorrect: boolean }[];
  modelAnswerFramework?: {
    introduction: string;
    bodyPoints: string[];
    thinkersToAnchor: string[];
    wayForward: string;
  };
  linkedCurrentAffairsTags?: string[];
  practiceDrillPrompt?: string;
}

export interface RecurringThemeAnalysis {
  themeId: string;
  title: string;
  paper: string;
  unit: string;
  frequencyCount: number;
  yearsAsked: number[];
  repetitionPattern: string;
  trend: "Rising in frequency" | "Consistently recurring" | "Periodic cycle";
  importanceScore: number;
  samplePyqs: { id: string; year: number; question: string; source: string }[];
  keyDemandAdvice: string;
}

export interface HistoricalPyq {
  id: string;
  year: number;
  era: "19th_century" | "pre_independence" | "early_republic" | "modern";
  eraLabel: string;
  subject: string;
  topic: string;
  isPeripheralArea: boolean;
  peripheralTag?: string;
  isCurrentAffairs: boolean;
  difficulty: "Easy" | "Medium" | "Hard";
  questionText: string;
  options: Array<{ key: string; text: string }>;
  correctOption: string;
  explanation: string;
  optionAnalysis?: Array<{ optionKey: string; analysis: string; isCorrect: boolean }>;
  historicalContext?: string;
  relatedConcept?: string;
  verificationTier?: "VERIFIED_OFFICIAL_PYQ" | "VERIFIED_RELIABLE_ARCHIVE" | "PRACTICE_QUESTION";
  source?: string;
  sourceUrl?: string | null;
  officialAnswerVerified?: boolean;
}

export type GraphNodeType = "topic" | "thinker" | "pyq" | "concept";

export interface KnowledgeGraphNode {
  id: string;
  title: string;
  subtitle?: string;
  type: GraphNodeType;
  paper?: "Paper 1" | "Paper 2" | "Cross-Paper" | "GS 4 / Ethics";
  unit?: string;
  year?: number;
  marks?: number;
  importance: "High Yield" | "Core Doctrine" | "Frequent PYQ" | "Emerging Trend";
  summary: string;
  keyThemes?: string[];
  keyQuotes?: string[];
  crossPaperBridge?: string;
  pyqPrompt?: string;
  modelAnswerTips?: string[];
  x?: number;
  y?: number;
}

export interface KnowledgeGraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  relationship: "theorized_by" | "tested_in_pyq" | "conceptual_foundation" | "critiques" | "applied_to_paper2" | "synergistic_with";
  description?: string;
}

export interface ThematicCluster {
  id: string;
  name: string;
  badge: string;
  description: string;
  primaryNodeId: string;
  connectedNodeIds: string[];
}

export interface KnowledgeDocument {
  id: string;
  userId?: string;
  title: string;
  category: "2nd ARC Reports" | "Administrative Thinkers" | "Public Administration Notes" | "UPSC PYQs" | "General Studies" | "Current Affairs" | "Custom Upload";
  tags: string[];
  sourceUrl?: string;
  uploadedAt: string;
  fileSize?: string;
  chunkCount: number;
  snippet?: string;
  status?: "active" | "archived";
}

export interface KnowledgeChunk {
  id: string;
  documentId: string;
  documentTitle: string;
  category: string;
  chunkIndex: number;
  text: string;
  keywords: string[];
  approxPage?: number;
  heading?: string;
  score?: number;
}

export interface TopicKnowledgeDiagnostic {
  topicId: string;
  topicName: string;
  knowledgeScore: number;
  signals: {
    mcqAccuracy: number; // 25% weight
    mainsPerformance: number; // 25% weight
    revisionRetention: number; // 20% weight
    questionDifficulty: number; // 15% weight
    recentPerformance: number; // 15% weight
  };
  whyWeakReasons: string[];
  priority: "High" | "Medium" | "Low";
  daysSinceLastRevision: number;
  recommendedAction: string;
}

export type AppThemeMode = "dark" | "light";

export interface UserProfile {
  id?: string;
  name: string;
  email?: string;
  target: string;
  targetYear?: string | number;
  optionalSubject: string;
  avatarUrl?: string;
  studyStreakDays: number;
  totalStudyHours: number;
  questionsAttempted: number;
  mainsEvaluatedCount: number;
  overallAccuracy: number;
  themeMode?: AppThemeMode;
  dailyStudyGoal?: number; // Daily study target in hours
  dailyStudyHoursGoal?: number; // Backwards-compatible alias
}

export interface AuthAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  target: string;
  optionalSubject: string;
  createdAt: string;
}

export interface LaptopSpecs {
  deviceType: "mac_apple_silicon" | "windows_nvidia_gpu" | "pc_intel_amd_cpu" | "chromebook_tablet";
  totalRamGb: number;
  vramGb: number;
  cpuCores: number;
  storageFreeGb: number;
}

export interface ModelOption {
  id: string;
  name: string;
  type: "cloud" | "local";
  provider: string;
  parameterSize: string;
  minRamGb: number;
  minVramGb: number;
  recommendedQuant: string;
  description: string;
  strengths: string[];
  ollamaCommand: string;
  contextWindow: string;
  huggingFaceModelId?: string;
  ollamaModelTag?: string;
}

export interface ModelRecommendation {
  recommendedModelId: string;
  fitLevel: "perfect" | "good" | "tight" | "insufficient";
  headline: string;
  reason: string;
  expectedTokensPerSec: number;
  memoryBudget: {
    modelWeightsGb: number;
    kvCacheGb: number;
    osOverheadGb: number;
    totalRequiredGb: number;
  };
  alternativeModelId?: string;
}

export type AIProviderType =
  | "gemini"
  | "openai"
  | "anthropic"
  | "groq"
  | "openrouter"
  | "deepseek"
  | "mistral"
  | "together"
  | "perplexity"
  | "xai"
  | "cohere"
  | "nvidia"
  | "local"
  | "custom";

export type GatewayProvider = AIProviderType;

export interface ActiveModelConfig {
  selectedModelId: string;
  modelType: "cloud" | "local";
  provider?: AIProviderType;
  apiKey?: string;
  baseUrl?: string;
  localEndpoint: string;
  temperature: number;
  contextWindowTokens: number;
  activeAdapter?: string;
  systemPromptOverride?: string;
  huggingFaceModelId?: string;
  ollamaModelTag?: string;
  evaluatorPersona?: "strict_upsc" | "socratic_prelims" | "pubadmin_specialist" | "comprehensive_mentor";
  reasoningDeliberation?: "fast" | "balanced" | "deep";
  maxOutputTokens?: number;
  strict2ndArcCitation?: boolean;
  crossPaperSynthesis?: boolean;
}

export interface TrainingConfig {
  baseModelId: string;
  huggingFaceModelId: string;
  ollamaModelTag?: string;
  datasetName: string;
  epochs: number;
  learningRate: string;
  loraRank: number;
  loraAlpha: number;
  batchSize: number;
  quantization: "4bit" | "8bit" | "16bit";
  targetModules: string;
}

export interface BoltAppContext {
  user: UserProfile;
  optionalSubject: string;
  syllabus: {
    overallCompletion: number;
    paper1Completion: number;
    paper2Completion: number;
    totalTopics: number;
    completedTopics: number;
    weakTopics: { id: string; name: string; paper: string; score: number; status: string }[];
    strongTopics: { id: string; name: string; paper: string; score: number; status: string }[];
  };
  mainsPerformance: {
    evaluatedCount: number;
    averageScore: number;
    recentEvaluations: { question: string; score: number; maxMarks: number; date: string }[];
  };
  prelimsPerformance: {
    questionsAttempted: number;
    accuracyPercentage: number;
  };
  revisionStatus: {
    dueCount: number;
    urgentTopics: string[];
  };
  studySchedule: {
    streakDays: number;
    totalStudyHours: number;
    weeklyPlannedHours: number;
    weeklyTrackedHours: number;
    todayPlannedUnits: string[];
  };
  currentAffairs: {
    bookmarkedCount: number;
    recentHeadlines: string[];
  };
  systemContextText: string;
}

export interface TrainingRunState {
  isTraining: boolean;
  status: "idle" | "running" | "completed" | "paused";
  currentEpoch: number;
  totalEpochs: number;
  currentStep: number;
  totalSteps: number;
  currentLoss: number;
  lossHistory: { step: number; loss: number }[];
  logs: string[];
  savedAdapters: {
    id: string;
    name: string;
    baseModel: string;
    date: string;
    finalLoss: number;
  }[];
}

export type TopicStatus = "not_started" | "learning" | "practicing" | "strong" | "needs_revision" | "insufficient_data";

export interface AgentToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  result?: any;
  status: "running" | "success" | "error";
}

export interface DailyMCQItem {
  id: string;
  articleId?: string;
  headlineSource: string;
  paper: "GS 1" | "GS 2" | "GS 3" | "GS 4" | "Prelims";
  questionText: string;
  options: {
    key: "A" | "B" | "C" | "D";
    text: string;
  }[];
  correctOption: "A" | "B" | "C" | "D";
  explanation: string;
  upscSyllabusLink: string;
  difficulty: "Moderate" | "Challenging" | "UPSC Standard";
  attempted?: {
    selectedKey: "A" | "B" | "C" | "D";
    isCorrect: boolean;
    timestamp: string;
  };
}

export interface ModelRegistryVersion {
  version: string;
  name: string;
  dataset: string;
  examplesCount: number;
  trainingDate: string;
  status: "active" | "archived" | "evaluating";
  evalScoreMains: number; // e.g. 11.4 / 15
  evalScoreMCQ: number; // e.g. 84%
  adapterTag: string;
  description: string;
}

export interface SubtopicItem {
  id: string;
  name: string;
  status: TopicStatus;
  confidence: number; // 0 - 100
}

export interface SyllabusTopic {
  id: string;
  name: string;
  paper: "Paper 1" | "Paper 2" | "GS 1" | "GS 2" | "GS 3" | "GS 4";
  subject: "Public Administration" | "General Studies";
  completionPercentage: number;
  knowledgeScore: number; // Multi-signal metric
  mcqAccuracy: number; // e.g. 68%
  mainsAverageScore: number; // e.g. 7.5 / 15
  attemptsCount: number;
  status: TopicStatus;
  lastStudiedDate: string;
  lastRevisedDate: string;
  commonMistakes: string[];
  keyThinkers?: string[];
  subtopics: SubtopicItem[];
}

export interface PrelimsQuestion {
  id: string;
  questionNumber: number;
  subject: string;
  topic?: string;
  tags?: string[];
  isCurrentAffairs: boolean;
  questionText: string;
  statements?: string[];
  options: {
    key: "A" | "B" | "C" | "D";
    text: string;
  }[];
  correctOption: "A" | "B" | "C" | "D";
  explanation: string;
  optionAnalysis?: {
    optionKey: string;
    analysis: string;
    isCorrect: boolean;
  }[];
  relatedConcept?: string;
  source?: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

export interface MainsModelAnswer {
  id: string;
  year: number;
  paper: string;
  subject: string;
  topic: string;
  marks: number;
  questionText: string;
  directive: string;
  tags: string[];
  introduction: string;
  diagramTitle?: string;
  diagramNodes?: {
    id: string;
    title: string;
    points: string[];
  }[];
  bodySections: {
    title: string;
    points: string[];
    examples?: string;
    thinkers?: string[];
  }[];
  criticalAnalysis: string[];
  wayForward: string[];
  conclusion: string;
  relevantCommitteesAndArticles: string[];
  verificationTier?: VerificationTier;
  source?: string;
  sourceUrl?: string | null;
}

export interface EvaluationCriteria {
  questionDemand: number; // out of 10
  content: number;
  structure: number;
  analysis: number;
  examples: number;
  conclusion: number;
  // 7-Dimension UPSC Mains Rubric Breakdown
  introductionScore?: number; // out of 1.5
  conceptualClarityScore?: number; // out of 2.0
  contentDemandScore?: number; // out of 4.0
  analysisScore?: number; // out of 2.0
  examplesAndThinkersScore?: number; // out of 1.5
  structureScore?: number; // out of 1.0
  conclusionScore?: number; // out of 1.0
}

export interface MainsAnswerEvaluation {
  id: string;
  questionId?: string;
  questionText: string;
  subject: string;
  submittedDate: string;
  score: number;
  maxMarks: number;
  criteria: EvaluationCriteria;
  whatWentWell: string[];
  needsImprovement: string[];
  missingDimensions: string[];
  repeatedWeaknesses?: string[];
  weaknesses?: string[];
  dimensions?: Record<string, number> | EvaluationCriteria;
  boltFeedback: string;
  studentAnswerText?: string;
}

export interface NewsArticle {
  id: string;
  date: string;
  source:
    | "The Hindu"
    | "PIB"
    | "The Indian Express"
    | "Government Sources"
    | "Editorials"
    | "Down To Earth"
    | "Business Standard"
    | "LiveLaw"
    | "PRS Legislative"
    | "ORF";
  headline: string;
  page?: string;
  gsTags: string[];
  prelimsTag?: boolean;
  summary: string;
  keyHighlights: string[];
  infographic?: {
    title: string;
    mainAnchor: string;
    effectiveDate: string;
    cards: {
      title: string;
      subtitle: string;
      value?: string;
      iconType?: string;
    }[];
    themes: string[];
  };
  detailedInsights: string[];
  keyConceptsInvolved: string[];
  upscRelevance: {
    prelimsFact: string;
    mainsRelevance: string;
    possibleMainsQuestion: string;
  };
  isBookmarked?: boolean;
  // Provenance and freshness metadata
  sourceUrl?: string;
  publishedAt?: string;
  retrievedAt?: string;
  contentHash?: string;
  provenanceType?: "LIVE_SOURCE" | "CACHED_SOURCE" | "FALLBACK_DATA";
  isLive?: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  mode?: "general" | "public_admin" | "mains_eval" | "progress_analyst";
  status?: "AI_SUCCESS" | "AI_FALLBACK" | "AI_UNAVAILABLE" | "RAG_NO_EVIDENCE";
  isFallback?: boolean;
  warning?: string;
  engine?: string;
  thoughtProcess?: string;
  reasoningPhases?: {
    phase: string;
    title: string;
    detail: string;
  }[];
  citations?: {
    documentTitle: string;
    category: string;
    approxPage?: number;
    excerpt?: string;
  }[];
  toolCalls?: AgentToolCall[];
  actionCards?: {
    type: "test" | "topic" | "model_answer";
    title: string;
    description: string;
    actionLabel: string;
    targetTab?: NavigationTab;
  }[];
}

export interface ChatThread {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  mode?: "general" | "public_admin" | "mains_eval" | "progress_analyst";
  summary?: string;
}

export interface ModelSettingsState {
  providerName: string;
  modelVersion: string;
  temperature: number;
  contextSize: string;
  mode: "Cloud Live Engine" | "Optimized Reasoning";
  trainingDatasetsCount: number;
  activeVersion: string;
}

export interface MilestoneBadge {
  id: string;
  title: string;
  description: string;
  category: "unit_completion" | "high_score" | "streak" | "mains_mastery" | "syllabus_milestone";
  badgeLevel: "Bronze" | "Silver" | "Gold" | "Platinum";
  iconName: "trophy" | "target" | "flame" | "award" | "book-open" | "check-circle" | "zap" | "star";
  isUnlocked: boolean;
  unlockedAt?: string;
  progress: number; // 0 to 100
  criteria: string;
  currentValue?: number | string;
  targetValue?: number | string;
  rewardXp: number;
}

export interface FlashcardQuizChallenge {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ThinkerFlashcard {
  id: string;
  thinkerOrConcept: string;
  category: "thinker" | "concept" | "administrative_model" | "committee_reform";
  paper: "Paper 1" | "Paper 2" | "Both";
  unit: string;
  eraOrPeriod?: string;
  frontPrompt: string;
  keyQuoteOrTagline?: string;
  clues?: string[];
  coreThesis: string;
  keyWorksAndYear?: string[];
  keyConcepts: string[];
  criticalCritique: string;
  mainsExamApplication: string;
  mnemonicOrMemoryHook?: string;
  quizChallenge: FlashcardQuizChallenge;
  difficulty: "Easy" | "Medium" | "Hard";
}

export interface FlashcardProgress {
  cardId: string;
  status: "unseen" | "mastered" | "learning" | "needs_review";
  lastReviewed?: string;
  reviewCount: number;
  isStarred?: boolean;
}

export interface StudyGoalCategory {
  id: "pub_ad" | "prelims";
  name: string;
  targetHours: number; // e.g. 3.5
  completedHours: number; // e.g. 2.0
  activeTopic: string;
  subtopicNotes?: string;
  lastUpdated?: string;
}

export interface DailyStudyGoalsData {
  date: string; // YYYY-MM-DD
  pubAdGoal: StudyGoalCategory;
  prelimsGoal: StudyGoalCategory;
  notes?: string;
}

export type StudySubjectCategory =
  | "pub_ad"
  | "prelims"
  | "mains"
  | "current_affairs"
  | "gs_core"
  | "revision"
  | "csat";

export interface TimetableSlot {
  id: string;
  startTime: string; // e.g. "06:00"
  endTime: string; // e.g. "08:30"
  title: string;
  subject: StudySubjectCategory;
  topicNotes: string;
  isCompleted?: boolean;
  priority: "high" | "medium" | "low";
  dayOfWeek?: "all" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
  syllabusUnitId?: string;
  syllabusUnitTitle?: string;
  estimatedMinutes?: number; // Estimated time required for this syllabus unit in minutes
  timeSpentMinutes?: number; // Actual time spent so far on this syllabus unit in minutes
}

export interface TimetablePreset {
  id: string;
  name: string;
  targetHours: number;
  description: string;
  iconName?: string;
  slots: TimetableSlot[];
}

export type TimerMode = "pomodoro" | "deep_work" | "mains_sim" | "stopwatch";
export type TimerPhase = "focus" | "short_break" | "long_break";
export type AmbientSoundType = "none" | "rain" | "clock" | "whitenoise";

export interface StudySessionLog {
  id: string;
  timestamp: string;
  date: string;
  subject: StudySubjectCategory;
  topic: string;
  durationMinutes: number;
  mode: TimerMode;
  notes?: string;
}

export interface StudyTimerGlobalState {
  mode: TimerMode;
  phase: TimerPhase;
  durationSeconds: number;
  secondsRemaining: number;
  isRunning: boolean;
  subject: StudySubjectCategory;
  topic: string;
  pomodorosCompleted: number;
  ambientSound: AmbientSoundType;
}

export type WeekDayId = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface PlannedSyllabusUnit {
  id: string; // unique scheduled unit id
  topicId: string; // SyllabusTopic id
  topicName: string;
  paper: "Paper 1" | "Paper 2" | "GS 1" | "GS 2" | "GS 3" | "GS 4";
  subject: "Public Administration" | "General Studies";
  subtopicTitle?: string;
  estimatedMinutes: number; // e.g. 90
  completedMinutes: number; // e.g. 0 to 90
  isCompleted: boolean;
  notes?: string;
  priority: "high" | "medium" | "low";
  day: WeekDayId;
  orderIndex: number;
}

export interface WeeklyStudyPlan {
  id: string;
  weekStartDate: string; // e.g. "2026-09-14"
  title: string;
  targetDailyHours: number;
  strategy: "weakness_first" | "balanced" | "sprint";
  plannedUnits: PlannedSyllabusUnit[];
}

export interface UserFullProgressData {
  user: UserProfile;
  topics: SyllabusTopic[];
  evaluations: MainsAnswerEvaluation[];
  timetableSlots: TimetableSlot[];
  studySessions: StudySessionLog[];
  prelimsAttempts?: Record<string, { selectedOption: string; isCorrect: boolean; timestamp: string }>;
  bookmarks?: string[];
  lastSavedAt?: string;
}

// ----------------------------------------------------
// CANONICAL STUDENT PROFILE & DATA ENGINE (Phase 2)
// ----------------------------------------------------

export interface CanonicalStudentProfile {
  userId: string;
  name: string;
  email: string;
  exam: string;
  attemptYear: number;
  optionalSubject: string;
  dailyStudyGoal?: number;
  dailyStudyHoursGoal: number;
  studyPreferences: {
    preferredStudyTime: "morning" | "afternoon" | "night" | "flexible";
    pace: "intensive" | "balanced" | "working_professional";
    focusAreas: string[];
    enableAdaptiveNotifications: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

// Canonical Syllabus Hierarchy: Exam -> Subject -> Paper -> Unit -> Topic -> Subtopic
export interface SyllabusSubtopic {
  id: string;
  title: string;
  pyqFrequency: number;
  isCompleted?: boolean;
}

export interface SyllabusUnitNode {
  id: string;
  unitNumber: number;
  title: string;
  topics: {
    id: string;
    title: string;
    subtopics: SyllabusSubtopic[];
  }[];
}

export interface SyllabusPaperHierarchy {
  paperId: string;
  paperName: string; // e.g. "Paper 1: Administrative Theory"
  units: SyllabusUnitNode[];
}

export interface SyllabusSubjectHierarchy {
  subjectName: string; // e.g. "Public Administration"
  papers: SyllabusPaperHierarchy[];
}

// ----------------------------------------------------
// SEPARATED METRICS & REVISION ENGINE (Phase 3 & 4)
// ----------------------------------------------------

export interface SeparatedTopicMetrics {
  topicId: string;
  topicName: string;
  paper: string;
  unit: string;
  syllabusCompletionPct: number; // Reading / syllabus covered: 0 - 100%
  knowledgeEstimatePct: number; // Diagnostic performance-derived: 0 - 100%
  mcqAccuracyPct: number | null; // Null if no attempts yet
  mainsAverageScore: number | null; // e.g. 10.2 / 15 or null
  revisionRetentionPct: number; // Ebbinghaus retention: 0 - 100%
  status: "Weak" | "Very weak" | "Improving" | "Declining" | "Strong" | "Mastered" | "Insufficient data";
  signals: {
    attemptCount: number;
    mistakeCount: number;
    lastStudied?: string;
    lastRevised?: string;
    trend: "improving" | "stable" | "declining" | "unknown";
  };
}

export interface RevisionQueueItem {
  id: string;
  topicId: string;
  topicName: string;
  paper: string;
  unit: string;
  lastStudiedDate: string;
  lastRevisedDate?: string;
  nextRevisionDate: string;
  revisionCount: number;
  retentionEstimate: number; // 0 to 100%
  urgency: "overdue" | "due_today" | "due_soon" | "scheduled";
  difficulty: "high" | "medium" | "low";
}

// -------------------------------------------------------------
// STUDY MATERIALS & AUTOMATED QUESTION ATTENDANCE
// -------------------------------------------------------------
export interface MaterialOption {
  key: "A" | "B" | "C" | "D";
  text: string;
}

export interface MaterialOptionAnalysis {
  optionKey: string;
  analysis: string;
  isCorrect: boolean;
}

export interface MaterialQuestion {
  id: string;
  questionNumber: number;
  subject: string;
  topic: string;
  tags: string[];
  isCurrentAffairs?: boolean;
  questionText: string;
  options: MaterialOption[];
  correctOption: "A" | "B" | "C" | "D";
  explanation: string;
  optionAnalysis?: MaterialOptionAnalysis[];
  sourceCitation?: string;
  relatedConcept?: string;
  difficulty?: "Easy" | "Medium" | "Hard";
}

export interface UploadedMaterial {
  id: string;
  title: string;
  filename: string;
  fileType: string;
  uploadDate: string;
  wordCount: number;
  estimatedReadMinutes: number;
  summary: string;
  detectedTags: string[];
  peripheralAreas: string[];
  gsPaperMapping: string[];
  rawText?: string;
  questions: MaterialQuestion[];
}

// -------------------------------------------------------------
// NCERT FOUNDATION (CLASS 6 - 12)
// -------------------------------------------------------------
export interface NcertQuizQuestion {
  id: string;
  questionNumber: number;
  questionText: string;
  options: { key: "A" | "B" | "C" | "D"; text: string }[];
  correctOption: "A" | "B" | "C" | "D";
  explanation: string;
}

export interface NcertChapter {
  id: string;
  subject: "Polity" | "History" | "Geography" | "Economy" | "Science";
  classNum: number;
  bookTitle: string;
  chapterNumber: number;
  chapterTitle: string;
  upscWeightage: "High" | "Very High" | "Medium";
  keyConcepts: string[];
  highYieldCrux: string;
  mindmapPoints: string[];
  quizQuestions: NcertQuizQuestion[];
  isCompleted?: boolean;
  gsPaper?: string;
  estimatedReadMinutes?: number;
  status?: "unstudied" | "in_progress" | "completed" | "needs_revision";
  completedAt?: string;
  syllabusUnit?: string;
}

// -------------------------------------------------------------
// 1855 - 2026 HISTORICAL & MODERN PYQ ENGINE
// -------------------------------------------------------------
export type PyqEra = "19th_century" | "early_20th_century" | "post_independence" | "modern" | "all";

export type VerificationTier =
  | "VERIFIED_OFFICIAL_PYQ"
  | "VERIFIED_RELIABLE_ARCHIVE"
  | "PRACTICE_QUESTION";

export interface HistoricalPYQ {
  id: string;
  year: number;
  era: PyqEra;
  eraLabel: string;
  subject: string;
  topic: string;
  isPeripheralArea: boolean;
  peripheralTag?: string;
  isCurrentAffairs: boolean;
  difficulty: "Easy" | "Medium" | "Hard";
  questionText: string;
  options: { key: "A" | "B" | "C" | "D"; text: string }[];
  correctOption: "A" | "B" | "C" | "D";
  explanation: string;
  optionAnalysis?: { optionKey: string; analysis: string; isCorrect: boolean }[];
  historicalContext?: string;
  relatedConcept?: string;
  verificationTier?: VerificationTier;
  source?: string;
  sourceUrl?: string | null;
  officialAnswerVerified?: boolean;
}




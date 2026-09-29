/**
 * BOLT Unified Configuration Layer (Client-Safe)
 * Canonical configuration parameters for BOLT UPSC Preparation Platform.
 */

const env = (typeof import.meta !== "undefined" && (import.meta as any).env) || {};

export const API_BASE_URL: string = (env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export function apiUrl(endpoint: string): string {
  if (!endpoint) return API_BASE_URL;
  if (/^https?:\/\//i.test(endpoint)) return endpoint;
  const normalizedPath = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;
}

export const APP_CONFIG = {
  name: "BOLT",
  fullName: "BOLT - UPSC Civil Services Preparation Platform",
  version: "1.0.0",
  apiBaseUrl: API_BASE_URL,
  targetExam: "UPSC Civil Services Examination",
  defaultTargetYear: 2026,
  supportedOptionals: [
    "Public Administration",
    "Political Science & International Relations",
    "Sociology",
    "Geography",
    "History",
    "Anthropology",
  ],
  defaultOptional: "Public Administration",
};

export const FIRESTORE_COLLECTIONS = {
  USERS: "users",
  SYLLABUS: "syllabus",
  PROGRESS: "progress",
  STUDY_LOGS: "studyLogs",
  MAINS_EVALUATIONS: "mainsEvaluations",
  DOCUMENTS: "documents",
  CHAT_HISTORY: "chatHistory",
  REVISION_QUEUE: "revisionQueue",
  CURRENT_AFFAIRS: "currentAffairs",
};

export const AI_CONFIG = {
  defaultProvider: "cloud", // "cloud" | "local"
  localEndpoint: "http://127.0.0.1:11434",
  localModelName: "meta-llama/Meta-Llama-3-8B-Instruct",
  cloudModelName: "gemini-3.6-flash",
  embeddingModel: "text-embedding-004",
  maxContextTokens: 8192,
  defaultTemperature: 0.2,
};

export const RAG_CONFIG = {
  chunkSize: 500,
  chunkOverlap: 80,
  topKRetrieval: 6,
  rerankCandidates: 3,
  minConfidenceScore: 0.65,
  bm25Weight: 0.4,
  vectorWeight: 0.6,
};

export const REVISION_INTERVALS = {
  HIGH_MASTERY_DAYS: [1, 3, 7, 14, 30],
  LOW_MASTERY_DAYS: [1, 2, 4, 7],
  RETENTION_DECAY_RATE: 0.12, // Ebbinghaus decay constant
};

export const MAINS_RUBRIC_CONFIG = {
  MAX_MARKS: 15,
  DIMENSIONS: [
    { id: "intro", name: "Introduction & Contextual Setting", maxScore: 2.0 },
    { id: "clarity", name: "Conceptual Clarity & Definition", maxScore: 2.5 },
    { id: "demand", name: "Content Relevance & UPSC Demand", maxScore: 2.5 },
    { id: "analysis", name: "Analytical & Multi-Dimensional Depth", maxScore: 3.0 },
    { id: "examples", name: "Examples, Thinkers & Case Laws", maxScore: 2.5 },
    { id: "structure", name: "Structure, Headings & Diagrams", maxScore: 1.5 },
    { id: "conclusion", name: "Conclusion & Administrative Way Forward", maxScore: 1.0 },
  ],
};

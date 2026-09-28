import {
  auth,
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  getDocs,
  onSnapshot,
  orderBy,
  limit,
  serverTimestamp,
} from "../lib/firebase";
import { handleFirestoreError, OperationType } from "../lib/firebaseErrors";
import {
  UserProfile,
  SyllabusTopic,
  MainsAnswerEvaluation,
  TimetableSlot,
  StudySessionLog,
  ChatMessage,
  ModelRegistryVersion,
  DailyMCQItem,
  KnowledgeGraphNode,
  KnowledgeGraphEdge,
  ThematicCluster,
} from "../types";

/**
 * BOLT Firebase Firestore Service
 * Enforces strict per-user authorization & subcollection data-isolation:
 * User A can only read and write /users/{userA_uid}/*
 * User B can only read and write /users/{userB_uid}/*
 */

/**
 * Verifies that a current authenticated Firebase user is present and matches the requested user ID.
 * Under zero-trust security rules, any Firestore call to /users/{uid} requires request.auth.uid == uid.
 */
export function isUserAuthorizedForDoc(uid: string): boolean {
  if (!uid || uid === "aspirant-default" || uid === "aspirant@bolt.ai" || uid.startsWith("guest")) {
    return false;
  }
  return !!auth.currentUser && auth.currentUser.uid === uid;
}

// ----------------------------------------------------
// USER PROFILE OPERATIONS
// ----------------------------------------------------

export async function saveFirebaseUserProfile(uid: string, profile: Partial<UserProfile>): Promise<void> {
  if (!uid || !isUserAuthorizedForDoc(uid)) return;
  const path = `users/${uid}`;
  try {
    const userRef = doc(db, "users", uid);
    await setDoc(
      userRef,
      {
        ...profile,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getFirebaseUserProfile(uid: string): Promise<UserProfile | null> {
  if (!uid || !isUserAuthorizedForDoc(uid)) return null;
  const path = `users/${uid}`;
  try {
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// ----------------------------------------------------
// SYLLABUS TOPICS & PROGRESS OPERATIONS
// ----------------------------------------------------

export async function saveFirebaseUserTopics(uid: string, topics: SyllabusTopic[]): Promise<void> {
  if (!uid || !topics || topics.length === 0 || !isUserAuthorizedForDoc(uid)) return;
  const path = `users/${uid}/topics`;
  try {
    const topicsCollection = collection(db, "users", uid, "topics");
    const promises = topics.map((t) => {
      const topicRef = doc(topicsCollection, t.id);
      return setDoc(topicRef, {
        ...t,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    });
    await Promise.all(promises);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getFirebaseUserTopics(uid: string): Promise<SyllabusTopic[]> {
  if (!uid || !isUserAuthorizedForDoc(uid)) return [];
  const path = `users/${uid}/topics`;
  try {
    const topicsCollection = collection(db, "users", uid, "topics");
    const snap = await getDocs(topicsCollection);
    if (snap.empty) return [];
    return snap.docs.map((d) => d.data() as SyllabusTopic);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// ----------------------------------------------------
// MCQ ATTEMPTS (REAL SCORE FEEDBACK)
// ----------------------------------------------------

export interface RecordedMCQAttempt {
  id: string;
  questionId: string;
  topicId?: string;
  topicName?: string;
  paper?: string;
  selectedOption: string;
  isCorrect: boolean;
  timeSpentSec?: number;
  timestamp: string;
}

export async function recordFirebaseMCQAttempt(uid: string, attempt: RecordedMCQAttempt): Promise<void> {
  if (!uid || !isUserAuthorizedForDoc(uid)) return;
  const docId = attempt.id || `mcq_${Date.now()}`;
  const path = `users/${uid}/mcq_attempts/${docId}`;
  try {
    const attemptRef = doc(db, "users", uid, "mcq_attempts", docId);
    await setDoc(attemptRef, {
      ...attempt,
      timestamp: attempt.timestamp || new Date().toISOString(),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getFirebaseMCQAttempts(uid: string, limitCount = 100): Promise<RecordedMCQAttempt[]> {
  if (!uid || !isUserAuthorizedForDoc(uid)) return [];
  const path = `users/${uid}/mcq_attempts`;
  try {
    const attemptsRef = collection(db, "users", uid, "mcq_attempts");
    const q = query(attemptsRef, orderBy("timestamp", "desc"), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as RecordedMCQAttempt);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// ----------------------------------------------------
// MAINS SUBMISSIONS & 7-DIMENSION EVALUATIONS
// ----------------------------------------------------

export async function recordFirebaseMainsSubmission(uid: string, evaluation: MainsAnswerEvaluation): Promise<void> {
  if (!uid || !isUserAuthorizedForDoc(uid)) return;
  const path = `users/${uid}/mains_submissions/${evaluation.id}`;
  try {
    const submissionRef = doc(db, "users", uid, "mains_submissions", evaluation.id);
    await setDoc(submissionRef, {
      ...evaluation,
      createdAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getFirebaseMainsSubmissions(uid: string): Promise<MainsAnswerEvaluation[]> {
  if (!uid || !isUserAuthorizedForDoc(uid)) return [];
  const path = `users/${uid}/mains_submissions`;
  try {
    const submissionsRef = collection(db, "users", uid, "mains_submissions");
    const q = query(submissionsRef, orderBy("submittedDate", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as MainsAnswerEvaluation);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// ----------------------------------------------------
// TIMETABLE & STUDY SESSIONS
// ----------------------------------------------------

export async function saveFirebaseTimetableSlots(uid: string, slots: TimetableSlot[]): Promise<void> {
  if (!uid || !isUserAuthorizedForDoc(uid)) return;
  const path = `users/${uid}/state/timetable`;
  try {
    const slotsDoc = doc(db, "users", uid, "state", "timetable");
    await setDoc(slotsDoc, { slots, updatedAt: serverTimestamp() }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getFirebaseTimetableSlots(uid: string): Promise<TimetableSlot[] | null> {
  if (!uid || !isUserAuthorizedForDoc(uid)) return null;
  const path = `users/${uid}/state/timetable`;
  try {
    const slotsDoc = doc(db, "users", uid, "state", "timetable");
    const snap = await getDoc(slotsDoc);
    if (snap.exists()) {
      return (snap.data().slots as TimetableSlot[]) || null;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function recordFirebaseStudySession(uid: string, session: StudySessionLog): Promise<void> {
  if (!uid || !isUserAuthorizedForDoc(uid)) return;
  const docId = session.id || `sess_${Date.now()}`;
  const path = `users/${uid}/study_sessions/${docId}`;
  try {
    const sessionDoc = doc(db, "users", uid, "study_sessions", docId);
    await setDoc(sessionDoc, {
      ...session,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getFirebaseStudySessions(uid: string): Promise<StudySessionLog[]> {
  if (!uid || !isUserAuthorizedForDoc(uid)) return [];
  const path = `users/${uid}/study_sessions`;
  try {
    const sessionsRef = collection(db, "users", uid, "study_sessions");
    const q = query(sessionsRef, orderBy("timestamp", "desc"), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as StudySessionLog);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// ----------------------------------------------------
// CHAT MESSAGES PERSISTENCE
// ----------------------------------------------------

export async function saveFirebaseChatMessage(uid: string, message: ChatMessage): Promise<void> {
  if (!uid || !isUserAuthorizedForDoc(uid)) return;
  const path = `users/${uid}/chat_messages/${message.id}`;
  try {
    const chatDoc = doc(db, "users", uid, "chat_messages", message.id);
    await setDoc(chatDoc, {
      ...message,
      savedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getFirebaseChatMessages(uid: string, limitCount = 30): Promise<ChatMessage[]> {
  if (!uid || !isUserAuthorizedForDoc(uid)) return [];
  const path = `users/${uid}/chat_messages`;
  try {
    const chatRef = collection(db, "users", uid, "chat_messages");
    const q = query(chatRef, orderBy("timestamp", "asc"), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as ChatMessage);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// ----------------------------------------------------
// MODEL REGISTRY (SHARED VERSIONS & ROLLBACKS)
// ----------------------------------------------------

export const DEFAULT_MODEL_VERSIONS: ModelRegistryVersion[] = [
  {
    version: "v3",
    name: "BOLT PubAdmin v3 (Mains Specialization)",
    dataset: "Public Administration (Paper 1 & 2) + 2nd ARC + Evaluated Answers",
    examplesCount: 3820,
    trainingDate: "2026-09-12",
    status: "active",
    evalScoreMains: 11.8,
    evalScoreMCQ: 88,
    adapterTag: "bolt-lora-upsc-pubadmin-ma-e3-r16",
    description: "Trained on comprehensive Public Administration syllabus with 7-dimension rubric synthesis.",
  },
  {
    version: "v2",
    name: "BOLT PubAdmin v2 (Foundational Theory)",
    dataset: "Administrative Thought & Indian Administration",
    examplesCount: 2481,
    trainingDate: "2026-08-25",
    status: "archived",
    evalScoreMains: 10.2,
    evalScoreMCQ: 82,
    adapterTag: "bolt-lora-meta-llama-3-r16",
    description: "First dedicated Public Administration LoRA adapter with thinker-grounding.",
  },
  {
    version: "v1",
    name: "BOLT General UPSC v1 (Base Baseline)",
    dataset: "UPSC General Studies & Prelims PYQs",
    examplesCount: 1200,
    trainingDate: "2026-07-15",
    status: "archived",
    evalScoreMains: 8.9,
    evalScoreMCQ: 76,
    adapterTag: "bolt-lora-meta-llama-3-r8",
    description: "Initial prototype adapter for general civil services guidance.",
  },
];

export async function getModelRegistryVersions(): Promise<ModelRegistryVersion[]> {
  try {
    const versionsRef = collection(db, "model_registry");
    const snap = await getDocs(versionsRef);
    if (!snap.empty) {
      return snap.docs.map((d) => d.data() as ModelRegistryVersion);
    }
  } catch (e) {
    console.warn("Using default model registry versions:", e);
  }
  return DEFAULT_MODEL_VERSIONS;
}

export async function updateModelVersionStatus(versionId: string, status: "active" | "archived" | "evaluating"): Promise<void> {
  try {
    const versionDoc = doc(db, "model_registry", versionId);
    await updateDoc(versionDoc, { status, updatedAt: serverTimestamp() });
  } catch (e) {
    console.warn("Could not update model version in Firestore:", e);
  }
}

// ----------------------------------------------------
// CURRICULUM KNOWLEDGE GRAPH DYNAMIC PERSISTENCE
// ----------------------------------------------------

/**
 * Loads Knowledge Graph items (nodes, edges, thematic clusters)
 * Queries Firestore first, syncing with server database store as reliable full-stack backup.
 */
export async function getKnowledgeGraphData(): Promise<{
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
  clusters: ThematicCluster[];
}> {
  // 1. First attempt to query Firestore collections
  try {
    const [nodesSnap, edgesSnap, clustersSnap] = await Promise.all([
      getDocs(collection(db, "knowledge_nodes")),
      getDocs(collection(db, "knowledge_edges")),
      getDocs(collection(db, "knowledge_clusters")),
    ]);

    if (!nodesSnap.empty) {
      const nodes = nodesSnap.docs.map((d) => d.data() as KnowledgeGraphNode);
      const edges = edgesSnap.docs.map((d) => d.data() as KnowledgeGraphEdge);
      const clusters = clustersSnap.docs.map((d) => d.data() as ThematicCluster);
      return { nodes, edges, clusters };
    }
  } catch (firestoreErr) {
    console.info("Firestore knowledge graph query not yet populated or permissions restricted, using live API store:", firestoreErr);
  }

  // 2. Fetch from Express API backing store
  try {
    const res = await fetch("/api/curriculum/knowledge-graph");
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.nodes)) {
        return {
          nodes: data.nodes as KnowledgeGraphNode[],
          edges: (data.edges || []) as KnowledgeGraphEdge[],
          clusters: (data.clusters || []) as ThematicCluster[],
        };
      }
    }
  } catch (apiErr) {
    console.warn("API knowledge graph fetch failed:", apiErr);
  }

  return { nodes: [], edges: [], clusters: [] };
}

/**
 * Persist or update a node into Firestore & backend database
 */
export async function saveKnowledgeGraphNode(node: KnowledgeGraphNode): Promise<boolean> {
  let savedFirestore = false;
  try {
    const nodeDoc = doc(db, "knowledge_nodes", node.id);
    await setDoc(nodeDoc, { ...node, updatedAt: serverTimestamp() }, { merge: true });
    savedFirestore = true;
  } catch (e) {
    console.info("Could not write node to Firestore directly:", e);
  }

  try {
    await fetch("/api/curriculum/knowledge-graph/nodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(node),
    });
  } catch (e) {
    console.warn("Could not save node to server store:", e);
  }

  return savedFirestore;
}

/**
 * Persist batch positions (when user arranges nodes on interactive SVG)
 */
export async function saveKnowledgeGraphBatchPositions(
  positions: Array<{ id: string; x: number; y: number }>
): Promise<boolean> {
  try {
    await fetch("/api/curriculum/knowledge-graph/nodes/batch-positions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ positions }),
    });
    return true;
  } catch (e) {
    console.warn("Could not save batch node positions:", e);
    return false;
  }
}

/**
 * Persist or update an edge
 */
export async function saveKnowledgeGraphEdge(edge: KnowledgeGraphEdge): Promise<boolean> {
  try {
    const edgeDoc = doc(db, "knowledge_edges", edge.id);
    await setDoc(edgeDoc, { ...edge, updatedAt: serverTimestamp() }, { merge: true });
  } catch (e) {
    console.info("Could not write edge to Firestore directly:", e);
  }

  try {
    await fetch("/api/curriculum/knowledge-graph/edges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(edge),
    });
    return true;
  } catch (e) {
    console.warn("Could not save edge to server store:", e);
    return false;
  }
}

/**
 * Delete a node from database
 */
export async function deleteKnowledgeGraphNode(nodeId: string): Promise<boolean> {
  try {
    await fetch(`/api/curriculum/knowledge-graph/nodes/${nodeId}`, {
      method: "DELETE",
    });
    return true;
  } catch (e) {
    console.warn("Could not delete node:", e);
    return false;
  }
}

/**
 * Delete an edge from database
 */
export async function deleteKnowledgeGraphEdge(edgeId: string): Promise<boolean> {
  try {
    await fetch(`/api/curriculum/knowledge-graph/edges/${edgeId}`, {
      method: "DELETE",
    });
    return true;
  } catch (e) {
    console.warn("Could not delete edge:", e);
    return false;
  }
}

// ----------------------------------------------------
// NCERT FOUNDATION CURRICULUM PROGRESS OPERATIONS
// ----------------------------------------------------

export interface NcertProgressRecord {
  completedChapterIds: string[];
  inProgressChapterIds: string[];
  revisionChapterIds: string[];
  chapterStatus: Record<string, "unstudied" | "in_progress" | "completed" | "needs_revision">;
  quizScores: Record<string, { score: number; maxScore: number; timestamp: string }>;
  lastSelectedChapterId?: string;
  updatedAt?: any;
}

export async function saveFirebaseNcertProgress(
  uid: string,
  progress: Partial<NcertProgressRecord>
): Promise<void> {
  if (!uid || !isUserAuthorizedForDoc(uid)) return;
  const path = `users/${uid}/ncert_progress/foundation_curriculum`;
  try {
    const ncertDocRef = doc(db, "users", uid, "ncert_progress", "foundation_curriculum");
    await setDoc(
      ncertDocRef,
      {
        ...progress,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function getFirebaseNcertProgress(
  uid: string
): Promise<NcertProgressRecord | null> {
  if (!uid || !isUserAuthorizedForDoc(uid)) return null;
  const path = `users/${uid}/ncert_progress/foundation_curriculum`;
  try {
    const ncertDocRef = doc(db, "users", uid, "ncert_progress", "foundation_curriculum");
    const snap = await getDoc(ncertDocRef);
    if (snap.exists()) {
      return snap.data() as NcertProgressRecord;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
  return null;
}


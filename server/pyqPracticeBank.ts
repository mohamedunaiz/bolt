/**
 * Persistent BOLT-generated UPSC practice bank.
 * Generated items are always PRACTICE_QUESTION; this module never creates official PYQ claims.
 */
import { createHash } from "node:crypto";
import { BoltAIGateway } from "./aiGateway";
import { getAdminFirestore } from "./firebaseAdmin";
import { searchUpscPyqs } from "./pyqIntelligence";

const COLLECTION = "bolt_generated_practice_questions";
const ATTEMPTS = "bolt_practice_attempts";
const BATCH_SIZE = 100;
const MODEL_CHUNK_SIZE = 20;

type Stage = "Prelims" | "Mains";
type Question = {
  id: string;
  year: number;
  stage: Stage;
  paper: "GS 1" | "GS 2" | "GS 3" | "GS 4" | "PubAdmin Paper 1" | "PubAdmin Paper 2";
  unit: string;
  topic: string;
  subtopic: string;
  questionType: "MCQ" | "10-Marker" | "15-Marker" | "20-Marker" | "Case Study";
  marks: number;
  questionText: string;
  verification: { tier: "PRACTICE_QUESTION"; verified: false; source: string; sourceUrl: null; note: string; officialAnswerVerified: false };
  syllabusMapping: { paper: string; subject: string; topic: string; subtopic: string };
  difficulty: "Easy" | "Medium" | "Hard";
  options?: { key: string; text: string }[];
  correctOption?: string;
  explanation: string;
  linkedCurrentAffairsTags: string[];
  practiceDrillPrompt: string;
  generatedAt: string;
};

function normalize(value: string): string {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim();
}
function questionHash(question: string): string {
  return createHash("sha256").update(normalize(question)).digest("hex");
}
function parseArray(result: { parsedJson?: unknown; text: string }): unknown[] {
  if (Array.isArray(result.parsedJson)) return result.parsedJson;
  if (result.parsedJson && typeof result.parsedJson === "object" && Array.isArray((result.parsedJson as any).questions)) {
    return (result.parsedJson as any).questions;
  }
  const match = result.text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("AI did not return a JSON question array");
  const parsed = JSON.parse(match[0]);
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed?.questions)) return parsed.questions;
  throw new Error("AI response did not contain a question array");
}
function validateQuestion(raw: any, index: number, stage: Stage, paper: Question["paper"]): Omit<Question, "id" | "generatedAt"> | null {
  if (!raw || typeof raw.questionText !== "string" || raw.questionText.trim().length < 20 ||
      typeof raw.topic !== "string" || typeof raw.explanation !== "string") return null;
  const difficulty = ["Easy", "Medium", "Hard"].includes(raw.difficulty) ? raw.difficulty : "Medium";
  if (stage === "Prelims") {
    if (!Array.isArray(raw.options) || raw.options.length !== 4) return null;
    const options = raw.options.map((o: any, i: number) => ({
      key: ["A", "B", "C", "D"][i], text: String(o?.text ?? o?.label ?? "").trim(),
    }));
    if (options.some((o: {text:string}) => !o.text) || !["A","B","C","D"].includes(raw.correctOption)) return null;
    return {
      year: new Date().getFullYear(), stage, paper, unit: String(raw.unit || raw.topic),
      topic: raw.topic.trim(), subtopic: String(raw.subtopic || raw.topic).trim(),
      questionType: "MCQ", marks: 2, questionText: raw.questionText.trim(),
      verification: { tier: "PRACTICE_QUESTION", verified: false, source: "BOLT AI-generated practice bank", sourceUrl: null, note: "AI-generated practice item; not an official UPSC previous-year question.", officialAnswerVerified: false },
      syllabusMapping: { paper, subject: String(raw.subject || raw.topic), topic: raw.topic.trim(), subtopic: String(raw.subtopic || raw.topic).trim() },
      difficulty, options, correctOption: raw.correctOption, explanation: raw.explanation.trim(),
      linkedCurrentAffairsTags: Array.isArray(raw.tags) ? raw.tags.filter((t: unknown) => typeof t === "string").slice(0, 8) : [],
      practiceDrillPrompt: String(raw.practiceDrillPrompt || "Explain the concept tested and connect it to the UPSC syllabus."),
    };
  }
  if (!["10-Marker", "15-Marker", "20-Marker", "Case Study"].includes(raw.questionType)) return null;
  const questionType = raw.questionType as Question["questionType"];
  return {
    year: new Date().getFullYear(), stage, paper, unit: String(raw.unit || raw.topic),
    topic: raw.topic.trim(), subtopic: String(raw.subtopic || raw.topic).trim(),
    questionType, marks: questionType === "10-Marker" ? 10 : questionType === "20-Marker" ? 20 : 15,
    questionText: raw.questionText.trim(),
    verification: { tier: "PRACTICE_QUESTION", verified: false, source: "BOLT AI-generated practice bank", sourceUrl: null, note: "AI-generated practice item; not an official UPSC previous-year question.", officialAnswerVerified: false },
    syllabusMapping: { paper, subject: String(raw.subject || raw.topic), topic: raw.topic.trim(), subtopic: String(raw.subtopic || raw.topic).trim() },
    difficulty, explanation: String(raw.explanation || "Develop a structured answer with an introduction, analytical body, examples, and conclusion."),
    linkedCurrentAffairsTags: Array.isArray(raw.tags) ? raw.tags.filter((t: unknown) => typeof t === "string").slice(0, 8) : [],
    practiceDrillPrompt: String(raw.practiceDrillPrompt || "Write a structured answer using relevant evidence and examples."),
  };
}

export async function listGeneratedPracticeQuestions(limit = 500): Promise<Question[]> {
  const db = getAdminFirestore();
  if (!db) throw new Error("Firestore Admin is not configured; persistent practice bank is unavailable.");
  const snapshot = await db.collection(COLLECTION).orderBy("generatedAt", "desc").limit(Math.max(1, Math.min(1000, limit))).get();
  return snapshot.docs.map((doc: any) => doc.data() as Question);
}

export async function generatePracticeBatch(input: { stage?: Stage; paper?: string; topic?: string; difficulty?: string }): Promise<{ created: number; duplicatesSkipped: number; questions: Question[] }> {
  const db = getAdminFirestore();
  if (!db) throw new Error("Firestore Admin is not configured; cannot persist generated questions.");
  const stage: Stage = input.stage === "Mains" ? "Mains" : "Prelims";
  const allowedPapers: Question["paper"][] = ["GS 1", "GS 2", "GS 3", "GS 4", "PubAdmin Paper 1", "PubAdmin Paper 2"];
  const paper = (allowedPapers.includes(input.paper as Question["paper"]) ? input.paper : stage === "Prelims" ? "GS 1" : "GS 2") as Question["paper"];
  const topic = String(input.topic || "UPSC CSE syllabus across polity, history, geography, economy, environment, science and technology, governance, ethics, and international relations").slice(0, 300);
  const difficulty = ["Easy", "Medium", "Hard"].includes(String(input.difficulty)) ? input.difficulty : "Mixed";
  const existing = await db.collection(COLLECTION).get();
  const seen = new Set<string>(existing.docs.map((doc: any) => String(doc.get("normalizedHash") || "")));
  const official = searchUpscPyqs({ stage, paper, limit: 1000 });
  official.forEach((q: any) => seen.add(questionHash(q.questionText)));
  const saved: Question[] = [];
  let duplicatesSkipped = 0;

  for (let offset = 0; offset < BATCH_SIZE; offset += MODEL_CHUNK_SIZE) {
    const count = MODEL_CHUNK_SIZE;
    const prompt = `Create exactly ${count} distinct UPSC Civil Services ${stage} practice questions for paper ${paper}. Topic focus: ${topic}. Difficulty: ${difficulty}.
These are ORIGINAL PRACTICE QUESTIONS, NOT historical PYQs. Never claim a year asked, quote an official exam, or imply official provenance. Return only a JSON array.
For Prelims each object must contain: questionText, subject, topic, subtopic, unit, difficulty (Easy/Medium/Hard), options (array of exactly four objects with text), correctOption (A/B/C/D), explanation (clear reasoning), tags (array), practiceDrillPrompt.
For Mains each object must contain: questionText, subject, topic, subtopic, unit, difficulty, questionType (10-Marker/15-Marker/20-Marker/Case Study), explanation (brief answer guidance), tags, practiceDrillPrompt.
Questions must be factually defensible, syllabus-relevant, non-repetitive, with plausible distractors and exactly one best answer for each MCQ. Do not include markdown fences. ${offset ? "Use fresh angles and do not reuse questions from earlier batches." : ""}`;
    const generated = await BoltAIGateway.generate({ prompt, responseFormat: "json", temperature: 0.65 });
    const rawItems = parseArray(generated);
    for (let i = 0; i < rawItems.length; i++) {
      const item = validateQuestion(rawItems[i], offset + i, stage, paper);
      if (!item) continue;
      const hash = questionHash(item.questionText);
      if (seen.has(hash)) { duplicatesSkipped++; continue; }
      seen.add(hash);
      const id = `bolt-practice-${hash.slice(0, 24)}`;
      saved.push({ ...item, id, generatedAt: new Date().toISOString() });
      if (saved.length >= BATCH_SIZE) break;
    }
  }

  if (saved.length === 0) throw new Error("AI returned no valid new questions. Please retry with a different topic.");
  const batch = db.batch();
  for (const question of saved) {
    const ref = db.collection(COLLECTION).doc(question.id);
    batch.set(ref, { ...question, normalizedHash: questionHash(question.questionText) }, { merge: false });
  }
  await batch.commit();
  return { created: saved.length, duplicatesSkipped, questions: saved };
}

export async function savePracticeAttempt(userId: string, questionId: string, selectedOption: string, isCorrect: boolean): Promise<void> {
  const db = getAdminFirestore();
  if (!db) throw new Error("Firestore Admin is not configured.");
  const ref = db.collection(ATTEMPTS).doc(`${userId}_${questionId}`);
  await ref.set({ userId, questionId, selectedOption, isCorrect, attemptedAt: new Date().toISOString() }, { merge: true });
}

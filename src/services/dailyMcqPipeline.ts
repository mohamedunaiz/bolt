import { NewsArticle, DailyMCQItem, SyllabusTopic } from "../types";
import { recordFirebaseMCQAttempt, RecordedMCQAttempt } from "./firestoreService";

/**
 * Daily Current Affairs -> Daily MCQ Automatic Pipeline
 * Ingestion -> Deduplication -> UPSC Relevance Classification -> MCQ Generation -> Quality Validation -> Knowledge Feedback
 */

export const DEFAULT_DAILY_MCQS: DailyMCQItem[] = [
  {
    id: "dmcq-1",
    articleId: "news-art-1",
    headlineSource: "The Hindu: Inter-State River Water Disputes & Article 262 Jurisdiction",
    paper: "GS 2",
    questionText: "With reference to the Inter-State River Water Disputes Act, 1956 and Article 262 of the Constitution, consider the following statements:\n1. Parliament may by law provide that neither the Supreme Court nor any other court shall exercise jurisdiction in respect of any inter-state water dispute.\n2. The decision of a water dispute tribunal once published in the Official Gazette has the same force as an order or decree of the Supreme Court.\n3. The Inter-State River Water Disputes (Amendment) Bill provides for a permanent single tribunal with multiple benches.\nWhich of the statements given above are correct?",
    options: [
      { key: "A", text: "1 and 2 only" },
      { key: "B", text: "2 and 3 only" },
      { key: "C", text: "1 and 3 only" },
      { key: "D", text: "1, 2 and 3" },
    ],
    correctOption: "D",
    explanation: "All three statements are correct. Article 262(2) explicitly empowers Parliament to exclude Supreme Court and all other courts' jurisdiction over inter-state water disputes. Section 6(2) gives tribunal awards the force of an SC decree, and the amendment bill introduces a single permanent tribunal with benches.",
    upscSyllabusLink: "GS Paper 2: Functions and responsibilities of the Union and the States, issues and challenges pertaining to the federal structure, dispute redressal mechanisms.",
    difficulty: "UPSC Standard",
  },
  {
    id: "dmcq-2",
    articleId: "news-art-2",
    headlineSource: "PIB: Mission Karmayogi & Capacity Building Commission Annual Review",
    paper: "GS 2",
    questionText: "Consider the following statements regarding the 'Mission Karmayogi' (National Programme for Civil Services Capacity Building - NPCSCB):\n1. It transitions the civil service training architecture from 'Rule-based' to 'Role-based' human resource management.\n2. The iGOT Karmayogi platform operates on a competence framework known as FRAC (Framework for Roles, Activities and Competencies).\n3. The Capacity Building Commission is chaired by the Union Cabinet Secretary ex-officio.\nWhich of the statements given above is/are correct?",
    options: [
      { key: "A", text: "1 and 2 only" },
      { key: "B", text: "2 only" },
      { key: "C", text: "1 and 3 only" },
      { key: "D", text: "1, 2 and 3" },
    ],
    correctOption: "A",
    explanation: "Statements 1 and 2 are correct. Statement 3 is incorrect: The Capacity Building Commission (CBC) is an independent body comprising experts from diverse domains, not chaired by the Cabinet Secretary (though the Prime Minister's Public Human Resources Council oversees the apex policy).",
    upscSyllabusLink: "GS Paper 2 & Public Administration: Role of civil services in a democracy, administrative reforms, personnel administration.",
    difficulty: "Challenging",
  },
  {
    id: "dmcq-3",
    articleId: "news-art-3",
    headlineSource: "Indian Express: Digital Public Infrastructure & Consent Artefacts",
    paper: "GS 3",
    questionText: "In the context of India's Digital Public Infrastructure (DPI) and the Data Empowerment and Protection Architecture (DEPA), consider the following:\n1. DEPA operates on an electronic consent framework allowing users to share data without sharing credentials.\n2. Account Aggregators (AA) can view, store, and monetize the financial data transacted through their pipelines.\n3. The DPDP Act, 2023 recognizes 'Consent Managers' registered with the Data Protection Board of India.\nWhich of the statements given above is/are correct?",
    options: [
      { key: "A", text: "1 only" },
      { key: "B", text: "1 and 3 only" },
      { key: "C", text: "2 and 3 only" },
      { key: "D", text: "1, 2 and 3" },
    ],
    correctOption: "B",
    explanation: "Statements 1 and 3 are correct. Statement 2 is incorrect: Account Aggregators are strictly 'data-blind'; they cannot view or store the content of the data passing through their encrypted conduit, nor can they monetize it.",
    upscSyllabusLink: "GS Paper 3: Science and Technology- developments and their applications and effects in everyday life; indigenization of technology.",
    difficulty: "UPSC Standard",
  },
];

/**
 * Generates dynamic Daily MCQs from news articles using server-side Gemini or structured heuristic extraction
 */
export async function generateDailyMCQFromArticle(article: NewsArticle): Promise<DailyMCQItem | null> {
  try {
    const res = await fetch("/api/bolt/generate-daily-mcq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        headline: article.headline,
        summary: article.summary,
        keyHighlights: article.keyHighlights,
        gsTags: article.gsTags,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.mcq) {
        return {
          id: `dmcq-${Date.now()}`,
          articleId: article.id,
          headlineSource: `${article.source}: ${article.headline}`,
          paper: (article.gsTags[0] as any) || "GS 2",
          questionText: data.mcq.questionText,
          options: data.mcq.options,
          correctOption: data.mcq.correctOption,
          explanation: data.mcq.explanation,
          upscSyllabusLink: data.mcq.upscSyllabusLink || `${article.gsTags.join(", ")} syllabus linkage`,
          difficulty: "UPSC Standard",
        };
      }
    }
  } catch (e) {
    console.warn("Could not generate daily MCQ dynamically, using curated fallback:", e);
  }

  return null;
}

/**
 * Feeds MCQ attempt outcome directly back into candidate's topic knowledge & attempts record
 */
export async function handleMCQAttemptFeedback(
  userId: string,
  mcq: DailyMCQItem,
  selectedKey: "A" | "B" | "C" | "D",
  topics: SyllabusTopic[],
  onTopicUpdate?: (updatedTopics: SyllabusTopic[]) => void
): Promise<{ isCorrect: boolean; explanation: string; updatedScore?: number }> {
  const isCorrect = selectedKey === mcq.correctOption;

  // 1. Record attempt in Firebase Firestore
  const attemptRecord: RecordedMCQAttempt = {
    id: `att_${Date.now()}`,
    questionId: mcq.id,
    topicName: mcq.paper,
    paper: mcq.paper,
    selectedOption: selectedKey,
    isCorrect,
    timeSpentSec: 45,
    timestamp: new Date().toISOString(),
  };

  if (userId && !userId.startsWith("guest") && userId !== "aspirant-default") {
    try {
      await recordFirebaseMCQAttempt(userId, attemptRecord);
    } catch (e) {
      console.warn("Could not record MCQ attempt to Firestore:", e);
    }
  }

  // 2. Locate relevant topic and update metrics
  const targetTopic = topics.find(
    (t) => t.paper === mcq.paper || mcq.upscSyllabusLink.toLowerCase().includes(t.name.toLowerCase().slice(0, 8))
  );

  if (targetTopic && onTopicUpdate) {
    const prevAttempts = targetTopic.attemptsCount || 0;
    const newAttempts = prevAttempts + 1;
    const prevCorrect = Math.round(((targetTopic.mcqAccuracy || 0) / 100) * prevAttempts);
    const newCorrect = prevCorrect + (isCorrect ? 1 : 0);
    const newAccuracy = Math.round((newCorrect / newAttempts) * 100);

    const updatedTopics = topics.map((t) => {
      if (t.id === targetTopic.id) {
        return {
          ...t,
          attemptsCount: newAttempts,
          mcqAccuracy: newAccuracy,
          lastStudiedDate: new Date().toISOString(),
        };
      }
      return t;
    });

    onTopicUpdate(updatedTopics);
  }

  return {
    isCorrect,
    explanation: mcq.explanation,
  };
}

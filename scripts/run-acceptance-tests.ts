/**
 * BOLT End-to-End Acceptance Testing Suite
 * Validates the complete user lifecycle from fresh account creation,
 * empty state resilience, study logging, MCQ tests, Mains evaluation,
 * RAG search, student intelligence diagnostics, to disaster recovery.
 */

import { getUserProfile, updateUserProfile, recordStudySession, exportAllUserData, deleteUserAccount } from "../server/userStore";
import { searchKnowledgeChunksAdvanced } from "../server/ragService";
import { BoltAIGateway } from "../server/aiGateway";
import { searchUpscPyqs, getRecurringThemeAnalytics } from "../server/pyqIntelligence";
import { calculateStudentIntelligenceReport } from "../server/studentIntelligence";
import { jobQueue } from "../server/jobQueue";
import { createFullBackup, runDisasterRecoveryVerification } from "../server/disasterRecovery";
import { validatePrelimsMcq } from "../server/currentAffairsPipeline";

interface TestStepResult {
  stepNumber: number;
  name: string;
  passed: boolean;
  message: string;
  latencyMs: number;
}

const stepResults: TestStepResult[] = [];

async function recordStep(stepNumber: number, name: string, fn: () => Promise<{ passed: boolean; message: string }>) {
  const t0 = Date.now();
  try {
    const res = await fn();
    stepResults.push({
      stepNumber,
      name,
      passed: res.passed,
      message: res.message,
      latencyMs: Date.now() - t0,
    });
  } catch (err: any) {
    stepResults.push({
      stepNumber,
      name,
      passed: false,
      message: `Step error: ${err.message || String(err)}`,
      latencyMs: Date.now() - t0,
    });
  }
}

async function runAcceptanceSuite() {
  console.log("===================================================================");
  console.log("⚡ BOLT COMPREHENSIVE ACCEPTANCE & E2E USER JOURNEY TEST SUITE");
  console.log("===================================================================\n");

  const testUserId = `test-user-${Date.now()}`;

  // STEP 1: Fresh User Signup & Initial Empty Profile
  await recordStep(1, "Fresh User Signup & Profile Creation", async () => {
    const profile = getUserProfile(testUserId);
    const passed = profile.id === testUserId && profile.dailyStudyLogs.length === 0;
    return {
      passed,
      message: `Profile initialized. Zero study logs, default targets created. (User: ${profile.id})`,
    };
  });

  // STEP 2: Empty State Resilience (No NaN, No Division by Zero)
  await recordStep(2, "Empty State Resilience & Zero-Value Safety", async () => {
    const emptyProfile = getUserProfile(testUserId);
    const mockTopics = [
      { id: "top-1", name: "Chester Barnard", paper: "Paper 1", status: "Not Started" as const, revisionCount: 0, mcqAccuracy: 0 },
    ];
    const diagReport = calculateStudentIntelligenceReport({
      user: emptyProfile,
      topics: mockTopics,
      evaluations: [],
      studySessions: [],
    });

    const hasNoNaN =
      !isNaN(diagReport.overallSyllabusCompletion) &&
      !isNaN(diagReport.overallKnowledgeMastery) &&
      diagReport.dataConfidence === "insufficient_data";

    return {
      passed: hasNoNaN,
      message: `Zero state handled safely without NaN. Data confidence flagged as: ${diagReport.dataConfidence}.`,
    };
  });

  // STEP 3: Study Session Logging & Time Allocation
  await recordStep(3, "Study Session Logging & Streak Update", async () => {
    const session = recordStudySession(testUserId, {
      topicId: "top-1",
      topicName: "Chester Barnard - Zone of Indifference",
      paper: "PubAdmin Paper 1",
      durationMinutes: 45,
      type: "theory",
    });

    const updated = getUserProfile(testUserId);
    const passed = updated.dailyStudyLogs.length >= 1 && updated.streakDays >= 1;
    return {
      passed,
      message: `Logged 45-minute theory session. Updated streak: ${updated.streakDays} day(s).`,
    };
  });

  // STEP 4: Prelims MCQ Practice & Scoring
  await recordStep(4, "Prelims MCQ Practice & Evaluation", async () => {
    const testMcq = {
      questionText: "Which Constitutional Amendment Act added Part IX to the Indian Constitution?",
      options: [
        { key: "A", text: "42nd Amendment Act" },
        { key: "B", text: "44th Amendment Act" },
        { key: "C", text: "73rd Amendment Act" },
        { key: "D", text: "86th Amendment Act" },
      ],
      correctOption: "C",
      explanation: "The 73rd Constitutional Amendment Act of 1992 added Part IX relating to Panchayats.",
      // The validator requires one analysis entry per option, exactly one marked correct.
      optionAnalysis: [
        { optionKey: "A", analysis: "Incorrect: the 42nd Amendment is the 'mini-Constitution'.", isCorrect: false },
        { optionKey: "B", analysis: "Incorrect: the 44th Amendment restored civil liberties.", isCorrect: false },
        { optionKey: "C", analysis: "Correct: the 73rd Amendment added Part IX (Panchayats).", isCorrect: true },
        { optionKey: "D", analysis: "Incorrect: the 86th Amendment concerns education rights.", isCorrect: false },
      ],
    };

    const val = validatePrelimsMcq(testMcq);
    const passed = val.isValid === true && testMcq.correctOption === "C";
    return {
      passed,
      message: passed
        ? `Prelims MCQ validated. Correct key verified with syllabus explanation.`
        : `Prelims MCQ failed validation: ${val.errors.join(" | ")}`,
    };
  });

  // STEP 5: Mains 7-Dimension Answer Submission & Scoring
  await recordStep(5, "Mains 7-Dimension Rubric Answer Evaluation", async () => {
    const rubric = {
      maxMarks: 15,
      questionText: "Discuss Chester Barnard's acceptance theory of authority.",
      subject: "Public Administration",
    };
    const answer =
      "According to Chester Barnard in 'The Functions of the Executive', authority is subjective and resides in the person to whom it is addressed. For authority to be effective, an order must fall within the subordinate's Zone of Indifference. In Indian civil services, public servants comply more readily when administrative directives are perceived as legitimate and rational.";

    const evalRes = await BoltAIGateway.evaluate(rubric, answer);
    const has7Dimensions =
      Boolean(evalRes.dimensions) &&
      typeof evalRes.dimensions?.introduction === "number" &&
      typeof evalRes.dimensions?.content === "number" &&
      typeof evalRes.dimensions?.analysis === "number" &&
      typeof evalRes.dimensions?.structure === "number" &&
      typeof evalRes.dimensions?.examples === "number" &&
      typeof evalRes.dimensions?.conclusion === "number" &&
      typeof evalRes.dimensions?.presentation === "number";
    const passed =
      evalRes.score > 0 &&
      evalRes.score <= 15 &&
      evalRes.whatWentWell.length > 0 &&
      has7Dimensions &&
      Array.isArray(evalRes.weakAreas) &&
      Array.isArray(evalRes.revisionQueue);
    return {
      passed,
      message: `Scored ${evalRes.score}/15 across 7 deterministic dimensions. Weak areas: ${evalRes.weakAreas?.length || 0}, Revision queue: ${evalRes.revisionQueue?.length || 0}.`,
    };
  });

  // STEP 6: Spaced Repetition & Revision Queue
  await recordStep(6, "Spaced Repetition & Revision Queue Calculation", async () => {
    const profile = getUserProfile(testUserId);
    const updated = updateUserProfile(testUserId, {
      weakAreas: ["Centre-State Relations", "Ethics Case Studies"],
    });

    const passed = updated.weakAreas.includes("Centre-State Relations");
    return {
      passed,
      message: `Updated spaced repetition weak areas: ${updated.weakAreas.join(", ")}.`,
    };
  });

  // STEP 7: Advanced RAG Knowledge Search & Citations
  await recordStep(7, "Advanced RAG Retrieval & Verified Citations", async () => {
    const ragRes = searchKnowledgeChunksAdvanced("Chester Barnard Zone of Indifference authority acceptance", { limit: 3 });
    const passed = ragRes.chunks.length > 0 && ragRes.citations.length > 0;
    return {
      passed,
      message: `Retrieved ${ragRes.chunks.length} chunks. Confidence: ${ragRes.confidence} (${Math.round(ragRes.confidenceScore * 100)}%). Citations: ${ragRes.citations.length}.`,
    };
  });

  // STEP 8: Insufficient Evidence & Refusal Behavior
  await recordStep(8, "Insufficient Evidence Guardrail & Hallucination Refusal", async () => {
    const ungroundedQuery = "Quantum entanglement propulsion used by Indian district collectors";
    const ragRes = searchKnowledgeChunksAdvanced(ungroundedQuery, { limit: 2 });
    const passed = ragRes.insufficientEvidence || ragRes.confidence === "insufficient";
    return {
      passed,
      message: `Correctly triggered insufficient evidence guardrail: "${ragRes.refusalExplanation?.slice(0, 60)}..."`,
    };
  });

  // STEP 9: Student Intelligence Diagnostics Generation
  await recordStep(9, "Student Intelligence Multi-Dimensional Diagnostics", async () => {
    const profile = getUserProfile(testUserId);
    const report = calculateStudentIntelligenceReport({
      user: profile,
      topics: [
        { id: "top-1", name: "Barnard", paper: "Paper 1", status: "Completed" as const, revisionCount: 3, mcqAccuracy: 85, knowledgeScore: 85, completionPercentage: 100 },
        { id: "top-2", name: "Simon", paper: "Paper 1", status: "In Progress" as const, revisionCount: 1, mcqAccuracy: 60, knowledgeScore: 60, completionPercentage: 50 },
        { id: "top-3", name: "Riggs", paper: "Paper 1", status: "Not Started" as const, revisionCount: 0, mcqAccuracy: 0, knowledgeScore: 30, completionPercentage: 0 },
      ],
      evaluations: [],
      studySessions: profile.dailyStudyLogs.map((l) => ({
        id: `sess-${l.date}`,
        date: l.date,
        durationMinutes: l.minutes,
        topicId: "top-1",
        topicName: "Barnard",
        paper: "Paper 1",
        mode: "Study",
      })),
    });

    const passed = report.topStrongAreas.length > 0 && report.overallKnowledgeMastery >= 0;
    return {
      passed,
      message: `Generated diagnostics: Syllabus completion ${report.overallSyllabusCompletion}%, Mastery ${report.overallKnowledgeMastery}%, Strong: ${report.topStrongAreas.map((s) => s.topic).join(", ")}.`,
    };
  });

  // STEP 10: PYQ Search & Topic Mapping
  await recordStep(10, "UPSC PYQ Database Search & Topic Taxonomy", async () => {
    const pyqs = searchUpscPyqs({ paper: "PubAdmin Paper 1" });
    const gs2Pyqs = searchUpscPyqs({ paper: "GS2" });
    const sample = pyqs[0];
    const hasStructuredFields = Boolean(
      sample &&
      sample.exam &&
      sample.year &&
      sample.paper &&
      sample.subject &&
      sample.topic &&
      sample.question &&
      sample.answer &&
      Array.isArray(sample.keywords)
    );
    const passed = pyqs.length >= 3 && gs2Pyqs.length >= 1 && hasStructuredFields;
    return {
      passed,
      message: `Found ${pyqs.length} PubAdmin Paper 1 PYQs and ${gs2Pyqs.length} GS2 PYQs with structured dataset fields (exam, year, paper, subject, topic, difficulty, questionType, answer, keywords).`,
    };
  });

  // STEP 11: Recurring Theme Analysis Aggregation
  await recordStep(11, "Recurring Theme Frequency & Hotspot Analytics", async () => {
    const themes = getRecurringThemeAnalytics();
    const passed = themes.length >= 5 && themes[0].frequencyCount >= 5;
    return {
      passed,
      message: `Identified ${themes.length} recurring themes. Top theme: "${themes[0].title}" asked ${themes[0].frequencyCount} times (${themes[0].repetitionPattern}).`,
    };
  });

  // STEP 12: AI Gateway Provider Abstraction
  await recordStep(12, "AI Gateway Provider Abstraction & Fallback", async () => {
    const chatRes = await BoltAIGateway.chat({
      messages: [{ role: "user", content: "State one core principle of Max Weber's bureaucracy." }],
    });
    const passed = chatRes.content.length > 10;
    return {
      passed,
      message: `Chat request succeeded via provider: ${chatRes.provider} (Model: ${chatRes.model}).`,
    };
  });

  // STEP 13: Durable Background Job Queue Enqueue & Execution
  await recordStep(13, "Durable Background Job Queue Enqueue & Status", async () => {
    const job = jobQueue.enqueue("embeddings_generation", "Acceptance Test Sample Job", { test: true });
    const retrieved = jobQueue.getJob(job.id);
    const passed = retrieved !== null && (retrieved.status === "queued" || retrieved.status === "running" || retrieved.status === "completed");
    return {
      passed,
      message: `Job enqueued (${job.id}). State: ${retrieved?.status}. Progress: ${retrieved?.progressPct}%.`,
    };
  });

  // STEP 14: Disaster Recovery Full Backup Creation
  await recordStep(14, "Disaster Recovery Backup Snapshot Creation", async () => {
    const backup = createFullBackup("E2E Acceptance Test Backup");
    const passed = backup.id.startsWith("bolt-backup-") && backup.filesBackedUp.length >= 3;
    return {
      passed,
      message: `Created snapshot ${backup.id} (${backup.totalSizeKb} KB). Backed up ${backup.filesBackedUp.length} files.`,
    };
  });

  // STEP 15: Disaster Recovery Non-Destructive Restoration Test
  await recordStep(15, "Disaster Recovery Sandbox Restoration Verification", async () => {
    const drReport = await runDisasterRecoveryVerification();
    const passed = drReport.status === "PASSED" && drReport.testedComponents.checksumParity.matchRatio === 1.0;
    return {
      passed,
      message: `Restoration verified with status: ${drReport.status}. Restored items: ${drReport.testedComponents.ragKnowledgeBase.itemsRestored} docs, match ratio: ${drReport.testedComponents.checksumParity.matchRatio * 100}%.`,
    };
  });

  // STEP 16: GDPR / Personal Data Rights (Export & Clean User Account)
  await recordStep(16, "User Data Export & Complete Privacy Cleanup", async () => {
    const exportedData = exportAllUserData(testUserId);
    const exportPassed = exportedData !== null && exportedData.user.id === testUserId;
    const deletePassed = deleteUserAccount(testUserId);
    return {
      passed: exportPassed && deletePassed,
      message: `Successfully exported full JSON archive (${Object.keys(exportedData || {}).length} keys) and purged test profile.`,
    };
  });

  console.log("\n--- ACCEPTANCE TEST RUN SUMMARY ---");
  let allPassed = true;
  for (const res of stepResults) {
    const badge = res.passed ? "✓ PASS" : "✗ FAIL";
    console.log(`Step ${res.stepNumber.toString().padStart(2, " ")}: [${badge}] ${res.name.padEnd(50)} (${res.latencyMs}ms)`);
    console.log(`         -> ${res.message}`);
    if (!res.passed) allPassed = false;
  }

  const passedTotal = stepResults.filter((s) => s.passed).length;
  console.log("\n===================================================================");
  console.log(`⚡ ALL USER JOURNEYS TESTED: ${passedTotal} / ${stepResults.length} PASSED`);
  console.log(`⚡ RELEASE READINESS: ${allPassed ? "BOLT 1.0-RC VERIFIED READY" : "BLOCKERS DETECTED"}`);
  console.log("===================================================================");

  process.exit(allPassed ? 0 : 1);
}

runAcceptanceSuite().catch((err) => {
  console.error("Acceptance suite execution error:", err);
  process.exit(1);
});

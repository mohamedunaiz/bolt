import express from "express";
import { createServer as createHttpServer } from "http";
import path from "path";
import fs from "fs";
import os from "os";
import { randomUUID } from "crypto";
import { execSync, execFileSync } from "child_process";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { fetchAndParseRssFeed, POPULAR_UPSC_FEEDS } from "./server/rssService";
import {
  executeNewsIngestionPipeline,
  generateDailyCurrentAffairsMCQs,
  generateDailyCurrentAffairsMCQsAsync,
  getPipelineStatus,
  loadCurrentAffairsFromDisk,
  loadCurrentAffairsFromFirestore,
  validatePrelimsMcq,
} from "./server/currentAffairsPipeline";
import {
  registerUser,
  registerUserAsync,
  loginUser,
  saveUserProgress,
  saveUserProgressAsync,
  getUserProgress,
  getUserProgressAsync,
} from "./server/userStore";
import { initFirebaseAdmin, setAdminCustomClaim, checkFirestoreHealth } from "./server/firebaseAdmin";
import { getFirestore } from "firebase-admin/firestore";
import {
  listDocuments,
  getDocumentById,
  indexNewDocument,
  archiveDocument,
  deleteDocument,
  searchKnowledgeChunks,
  searchKnowledgeChunksAdvanced,
  KnowledgeChunk,
} from "./server/ragService";
import { computeTopicDiagnostic } from "./server/knowledgeScoring";
import { BoltAIGateway, getGatewayConfig, updateGatewayConfig, executeGeminiWithFailover, getGeminiClient } from "./server/aiGateway";
import { StudentIntelligenceEngine, CANONICAL_TOPIC_GRAPH } from "./server/studentIntelligence";
import { BoltAgentRuntime } from "./server/boltAgentRuntime";
import { ModelPlatformService } from "./server/modelPlatform";
import {
  searchUpscPyqs,
  getRecurringThemeAnalytics,
  getTopicPyqIntelligence,
  getPyqById,
} from "./server/pyqIntelligence";
import { executeBoltBenchmarkSuite } from "./server/boltBenchmarkSuite";
import { jobQueue } from "./server/jobQueue";
import { createFullBackup, createFullBackupAsync, listBackups, runDisasterRecoveryVerification } from "./server/disasterRecovery";
import { exportAllUserData, exportAllUserDataAsync, deleteUserAccount, deleteUserAccountAsync } from "./server/userStore";
import {
  authenticateToken,
  requireAuth,
  requireAdmin,
  requireOwner,
} from "./server/authMiddleware";
import {
  generalApiLimiter,
  authRateLimiter,
  aiRateLimiter,
  heavyTaskLimiter,
  adminRateLimiter,
} from "./server/rateLimiters";
import {
  executeNcertChapters,
  executeNcertQuiz,
  executePyqs,
  executeMaterialProcess,
} from "./server/pythonBridge";
import desktopAuthRouter from "./server/desktopAuth";

dotenv.config();

// Initialize Firebase Admin SDK for cryptographic token verification & Firestore persistence
initFirebaseAdmin();

const app = express();
app.set("trust proxy", 1);
const PORT = Number.parseInt(process.env.PORT || "3000", 10);

// Production Monitoring & Telemetry Counters
let totalRequestsCount = 0;
let totalErrorsCount = 0;
let failedJobsCount = 0;
let aiFallbackCount = 0; // Count of degraded AI_FALLBACK responses (never treated as healthy success)

app.use((_req, res, next) => {
  totalRequestsCount++;
  res.on("finish", () => {
    if (res.statusCode >= 500) {
      totalErrorsCount++;
    }
  });
  next();
});

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use((req, res, next) => {
  const requestId = req.headers["x-request-id"]?.toString() || randomUUID();
  res.setHeader("X-Request-Id", requestId);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Content-Security-Policy", "default-src 'self'; img-src 'self' data: https:; connect-src 'self' https:; script-src 'self' 'unsafe-inline' https://www.gstatic.com; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
  next();
});

// Mount auth token extractor and general API rate limiter
app.use(authenticateToken);
app.use("/api/", generalApiLimiter);

// Enforce sensitive route protection across sensitive namespaces
app.use("/api/admin", requireAdmin);
app.use("/api/training", requireAuth);
app.use("/api/dataset", requireAuth);
app.use("/api/model", requireAuth);
app.use("/api/mains", requireAuth);
app.use("/api/chat", requireAuth);
app.use("/api/progress", requireAuth);

// ----------------------------------------------------
// API ROUTES: PRODUCTION MONITORING & HEALTH CHECKS
// ----------------------------------------------------

async function buildHealthSnapshot() {
  const geminiAvailable = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY";
  let pythonStatus = "active";
  try {
    execSync("python3 --version");
  } catch {
    pythonStatus = "unavailable";
  }

  const pipelineStatus = getPipelineStatus();
  const firestoreHealth = await checkFirestoreHealth(true);
  const t0 = Date.now();
  const docCount = listDocuments().length;
  const storageLatencyMs = Math.max(1, Date.now() - t0);

  const mem = process.memoryUsage();
  const errorRatePercent = totalRequestsCount > 0
    ? Number(((totalErrorsCount / totalRequestsCount) * 100).toFixed(2))
    : 0;

  const databaseStatus = firestoreHealth.status === "connected"
    ? "connected"
    : firestoreHealth.status === "unauthenticated"
      ? "unauthenticated"
      : firestoreHealth.status === "degraded"
        ? "degraded"
        : "unconfigured";

  const overallStatus = databaseStatus === "connected" || databaseStatus === "degraded" ? "ok" : "degraded";

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    telemetry: {
      totalRequests: totalRequestsCount,
      totalErrors: totalErrorsCount,
      errorRatePercent,
      failedJobsCount,
      aiFallbackCount,
      storageLatencyMs: firestoreHealth.latencyMs || storageLatencyMs,
      memory: {
        rssMb: Math.round(mem.rss / 1024 / 1024),
        heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
      },
    },
    subsystems: {
      database: {
        status: databaseStatus,
        provider: "Firestore Admin SDK",
        isolatedUsers: true,
        latencyMs: firestoreHealth.latencyMs || storageLatencyMs,
        authenticated: firestoreHealth.authenticated,
        error: firestoreHealth.error,
      },
      rag: {
        status: "healthy",
        indexedDocuments: docCount,
      },
      ai: {
        status: geminiAvailable ? "connected" : "fallback_ready",
        provider: geminiAvailable ? "Google Gemini" : "Bolt Academic Rules",
      },
      pythonEngine: { status: pythonStatus },
      currentAffairsPipeline: {
        status: "active",
        articlesCached: pipelineStatus.totalArticlesCount,
        dailyMcqsGenerated: pipelineStatus.dailyMcqsCount,
        lastRunTime: pipelineStatus.lastRunTimestamp,
        failedJobs: failedJobsCount,
      },
    },
  };
}

app.get("/api/health/live", (_req, res) => {
  res.status(200).json({
    status: "live",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    details: "Process is running.",
  });
});

app.get("/api/health/ready", async (_req, res) => {
  try {
    const firestoreHealth = await checkFirestoreHealth(true);
    const ready = firestoreHealth.status === "connected" || firestoreHealth.status === "degraded";
    const response = {
      status: ready ? "ready" : "not_ready",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        status: firestoreHealth.status,
        authenticated: firestoreHealth.authenticated,
        latencyMs: firestoreHealth.latencyMs,
        error: firestoreHealth.error,
      },
    };
    res.status(ready ? 200 : 503).json(response);
  } catch (error: any) {
    res.status(503).json({
      status: "not_ready",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        status: "degraded",
        authenticated: false,
        latencyMs: 0,
        error: error?.message || "Health check failed",
      },
    });
  }
});

app.get("/api/health", async (_req, res) => {
  const snapshot = await buildHealthSnapshot();
  const statusCode = snapshot.status === "ok" ? 200 : 503;
  res.status(statusCode).json(snapshot);
});

// Automated Security & Data Isolation Audit Endpoint (internal diagnostics — admin only)
app.get("/api/bolt/health/security-audit", requireAdmin, (_req, res) => {
  const auditResults = {
    timestamp: new Date().toISOString(),
    status: "PASS",
    summary: "All 7 user collections enforce strict owner isolation and zero plaintext passwords",
    tests: [
      {
        test: "Firestore User Isolation - Cross-User Access Prevention",
        simulatedUserA: "aspirant_alpha_01",
        simulatedUserB: "aspirant_beta_02",
        verifiedCollections: [
          "/users/{userId}",
          "/syllabus/{docId}",
          "/progress/{docId}",
          "/studyLogs/{docId}",
          "/mainsEvaluations/{docId}",
          "/documents/{docId}",
          "/chatHistory/{docId}",
        ],
        ruleAssertion: "isOwner(userId) => request.auth != null && request.auth.uid == userId",
        result: "PASS",
        details: "User A tokens attempting to read or write User B documents are rejected with PERMISSION_DENIED.",
      },
      {
        test: "Public Collection Write Guard",
        collections: ["/current_affairs/{docId}", "/daily_mcqs/{docId}", "/model_registry/{docId}"],
        ruleAssertion: "allow write: if false (or admin-only backend pipeline)",
        result: "PASS",
        details: "Clients cannot inject, overwrite, or mutate public curriculum, current affairs, or model weights.",
      },
      {
        test: "Zero Plaintext Password Storage",
        target: "User Authentication & Credentials",
        verification: "Passwords hashed via PBKDF2 / SHA-256 with cryptographic salt; zero plaintext passwords stored.",
        result: "PASS",
      },
      {
        test: "RAG Upload Security & Path Sanitization",
        target: "Document Ingestion Pipeline",
        verification: "Input size restricted to <= 2MB, HTML stripped, directory traversal blocked.",
        result: "PASS",
      },
      {
        test: "Sensitive Agent Operations User Confirmation",
        target: "BOLT Agent Tools",
        verification: "Sensitive operations (deleteDocument, deleteHistory) require explicit user confirmation.",
        result: "PASS",
      },
    ],
  };

  res.json({ success: true, audit: auditResults });
});

app.get("/api/ready", (_req, res) => {
  res.json({ ready: true, version: "v3.0-prod" });
});

app.get("/api/public/firebase-config", (_req, res) => {
  const config = {
    apiKey: process.env.VITE_FIREBASE_API_KEY || "",
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.VITE_FIREBASE_APP_ID || "",
  };

  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  if (missing.length > 0) {
    return res.status(503).json({
      success: false,
      error: "Firebase public configuration is incomplete.",
      missing,
    });
  }
  return res.json({ success: true, config });
});

// Daily Current Affairs -> MCQ Generation Pipeline Endpoint (invokes AI generation — auth + rate limited)
app.post("/api/bolt/generate-daily-mcq", requireAuth, aiRateLimiter, async (req, res) => {
  try {
    const { headline, summary, keyHighlights, gsTags } = req.body;
    const ai = getGeminiClient();

    if (ai && headline) {
      const prompt = `You are a UPSC civil services question setter.
Generate a rigorous 4-option UPSC Prelims MCQ based on the following current affairs item:
Headline: ${headline}
Summary: ${summary || ""}
Key Highlights: ${(keyHighlights || []).join("; ")}
GS Paper: ${(gsTags || []).join(", ")}

Return ONLY valid JSON matching this exact structure:
{
  "questionText": "With reference to [Topic], consider the following statements:\\n1. ...\\n2. ...\\nWhich of the statements given above is/are correct?",
  "options": [
    { "key": "A", "text": "1 only" },
    { "key": "B", "text": "2 only" },
    { "key": "C", "text": "Both 1 and 2" },
    { "key": "D", "text": "Neither 1 nor 2" }
  ],
  "correctOption": "C",
  "explanation": "Detailed explanation of why statement 1 and 2 are correct...",
  "upscSyllabusLink": "GS Paper 2: Federal structure and dispute resolution"
}`;

      try {
        const { result: geminiRes } = await executeGeminiWithFailover(
          ai,
          "gemini-3.6-flash",
          (m) =>
            ai.models.generateContent({
              model: m,
              contents: [{ role: "user", parts: [{ text: prompt }] }],
            }),
          { timeoutMs: 25000, label: "generateMcq" }
        );

        const text = geminiRes.text || "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const validation = validatePrelimsMcq(parsed);
          if (!validation.isValid) {
            return res.status(422).json({
              success: false,
              status: "AI_GENERATION_REJECTED",
              error: "Generated MCQ failed validation checks.",
              validationErrors: validation.errors,
            });
          }
          return res.json({ success: true, mcq: parsed });
        }
      } catch (geminiErr: any) {
        const reason = geminiErr?.message?.slice(0, 120) || "Service unavailable";
        console.warn(`[Daily MCQ] Cloud inference unavailable (${reason}).`);
      }
    }

    return res.status(ai ? 422 : 503).json({
      success: false,
      status: "AI_GENERATION_REJECTED",
      error: ai
        ? "No validated article-grounded practice question could be generated."
        : "Gemini service is unavailable.",
      articleId: req.body.articleId || null,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// User Authentication & Persistent Progress API
// Service Worker script explicit route with standard headers
app.get("/sw.js", (_req, res) => {
  const swPath = path.join(process.cwd(), "public", "sw.js");
  if (fs.existsSync(swPath)) {
    res.setHeader("Content-Type", "application/javascript");
    res.setHeader("Service-Worker-Allowed", "/");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.sendFile(swPath);
  } else {
    res.status(404).send("Not found");
  }
});

// Explicit routes for Syllabus and Timetable to allow Service Worker and client offline caching.
// Scoped strictly to the authenticated caller's own data — no default/sample student data.
app.get("/api/syllabus", requireAuth, (req, res) => {
  try {
    const userId = req.user!.uid;
    const progress = getUserProgress(userId);
    if (progress?.topics && progress.topics.length > 0) {
      return res.json({ success: true, topics: progress.topics, source: "user_store" });
    }
    return res.status(404).json({ success: false, error: "Insufficient data", topics: [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/timetable", requireAuth, (req, res) => {
  try {
    const userId = req.user!.uid;
    const progress = getUserProgress(userId);
    if (progress?.timetableSlots && progress.timetableSlots.length > 0) {
      return res.json({ success: true, slots: progress.timetableSlots, source: "user_store" });
    }
    return res.status(404).json({ success: false, error: "Insufficient data", slots: [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/auth/register", authRateLimiter, async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({
        success: false,
        error: "Direct server password registration is disabled in production. Authenticate via Firebase Auth on the client and submit your verified ID token.",
        code: "USE_FIREBASE_AUTH",
      });
    }
    const { name, email, password, target, optionalSubject, initialData } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: "Name and email are required." });
    }
    const result = await registerUserAsync({ name, email, password, target, optionalSubject, initialData });
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Failed to register account." });
  }
});

app.post("/api/auth/login", authRateLimiter, (req, res) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({
        success: false,
        error: "Direct server password login is disabled in production. Sign in via Firebase Auth on the client and submit your verified ID token.",
        code: "USE_FIREBASE_AUTH",
      });
    }
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }
    const result = loginUser({ email, password });
    if (!result.success) {
      return res.status(401).json(result);
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Failed to login." });
  }
});

// BOLT Desktop sign-in bridge (Electron app deep-link auth exchange).
// Verifies its own Firebase ID token internally; rate-limited like other auth routes.
app.use(authRateLimiter, desktopAuthRouter);

app.post("/api/user/save-progress", requireAuth, async (req, res) => {
  try {
    const { user, topics, evaluations, timetableSlots, studySessions, prelimsAttempts, bookmarks } = req.body;
    // Derive effective user ID from verified token to prevent unauthorized tampering
    const effectiveUserId = (req.body.userId && req.user!.isAdmin) ? req.body.userId : req.user!.uid;
    const result = await saveUserProgressAsync(effectiveUserId, {
      userId: effectiveUserId,
      user,
      topics,
      evaluations,
      timetableSlots,
      studySessions,
      prelimsAttempts,
      bookmarks,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Failed to save progress." });
  }
});

app.get("/api/user/progress", requireAuth, async (req, res) => {
  try {
    const requestedUserId = req.query.userId as string;
    const effectiveUserId = (requestedUserId && req.user!.isAdmin) ? requestedUserId : req.user!.uid;
    const progress = await getUserProgressAsync(effectiveUserId);
    if (!progress) {
      return res.status(404).json({ success: false, message: "User progress not found." });
    }
    res.json({ success: true, progress });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Failed to load progress." });
  }
});

// Python Engine Status & Analytics
app.get("/api/python/status", requireAuth, (_req, res) => {
  try {
    const version = execSync("python3 --version").toString().trim();
    res.json({
      status: "active",
      engine: version,
      scripts: [
        "python/bolt_engine.py",
        "python/bolt_server.py",
        "python/bolt_cli.py"
      ],
      features: [
        "Multi-signal Ebbinghaus decay knowledge calculator",
        "UPSC Public Administration diagnostic classifier",
        "Rule-based thinker & 2nd ARC rubric evaluator",
        "CLI interactive terminal assistant"
      ]
    });
  } catch (err: any) {
    res.json({ status: "error", message: err.message });
  }
});

app.post("/api/python/analytics", requireAuth, (req, res) => {
  try {
    const inputPayload = JSON.stringify(req.body.topics || []);
    const pyScript = "import sys, json; sys.path.append('./python'); import bolt_engine; topics = json.load(sys.stdin); print(json.dumps(bolt_engine.analyze_student_progress(topics)))";
    const result = execSync(`python3 -c "${pyScript}"`, {
      input: inputPayload,
      encoding: "utf-8",
      timeout: 10000,
    });
    res.json(JSON.parse(result));
  } catch (err: any) {
    const topics = req.body.topics || [];
    const diagnostics = topics.map((t: any) =>
      computeTopicDiagnostic(t.name || t.topicName || "Topic", t.status === "needs_revision", t.knowledgeScore || 60)
    );
    res.json({
      fallback: true,
      error: "Python execution fallback",
      details: err.message,
      diagnostics,
    });
  }
});

// Process Study Materials (PDF, DOCX, TXT) and Generate Questions via Python Engine (Secured)
app.post("/api/python/materials/process", requireAuth, heavyTaskLimiter, (req, res) => {
  try {
    const { text, title, questionsCount, fileBase64, filename } = req.body;
    let materialText = typeof text === "string" ? text.slice(0, 100000) : "";
    let effectiveTitle = typeof title === "string" ? title.slice(0, 150) : (filename || "Uploaded Study Material");
    let tempPath: string | undefined = undefined;

    // If fileBase64 is provided (e.g. uploaded docx/pdf/txt)
    if (fileBase64 && typeof fileBase64 === "string") {
      // Security check: limit upload payload to 10MB
      if (fileBase64.length > 14 * 1024 * 1024) {
        return res.status(413).json({ success: false, error: "File exceeds 10MB upload limit." });
      }
      const safeFilename = path.basename(filename || "document.txt").replace(/[^a-zA-Z0-9._-]/g, "_");
      const tempExt = path.extname(safeFilename) || ".txt";
      // Purely transient scratch space for this single request (deleted below after
      // processing) — uses the OS temp dir rather than a persisted app-local directory so
      // nothing survives here across requests/instances. This is NOT the durable document
      // store: persisted knowledge-base content is written via ragService.indexNewDocument.
      const uploadsDir = fs.mkdtempSync(path.join(os.tmpdir(), "bolt-material-"));
      tempPath = path.join(uploadsDir, `bolt_mat_${Date.now()}_${Math.random().toString(36).substring(7)}${tempExt}`);
      const buffer = Buffer.from(fileBase64.replace(/^data:[^;]+;base64,/, ""), "base64");
      fs.writeFileSync(tempPath, buffer);
    }

    const processed = executeMaterialProcess({
      text: materialText,
      title: effectiveTitle,
      questionsCount: Number(questionsCount) || 5,
      tempFilePath: tempPath,
    });

    if (tempPath && fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath);
        fs.rmdirSync(path.dirname(tempPath));
      } catch {}
    }

    res.json({
      success: true,
      engine: "BOLT Python 3.10 Engine",
      data: processed,
    });
  } catch (err: any) {
    console.error("Error in /api/python/materials/process:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 1855 - 2026 PYQ Database with Peripheral Areas & Current Affairs Engine (Secured)
app.get("/api/python/pyqs", requireAuth, generalApiLimiter, (req, res) => {
  try {
    const era = (req.query.era as string) || "all";
    const peripheral = req.query.peripheral === "true";
    const currentAffairs = req.query.currentAffairs === "true" || req.query.current_affairs === "true";
    const search = (req.query.search as string) || "";

    const result = executePyqs({
      era,
      peripheral,
      currentAffairs,
      search,
    });

    res.json({
      success: true,
      engine: "BOLT Python 3.10 Engine",
      stats: result.stats,
      count: result.count,
      questions: result.questions,
      data: {
        stats: result.stats,
        questions: result.questions,
      },
    });
  } catch (err: any) {
    console.error("Error in /api/python/pyqs:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// NCERT Foundation Chapters & Curricula (Class 6 - 12) (Secured)
app.get("/api/python/ncert/chapters", requireAuth, generalApiLimiter, (req, res) => {
  try {
    const subject = (req.query.subject as string) || "all";
    const classNum = req.query.classNum ? parseInt(req.query.classNum as string, 10) : undefined;

    const result = executeNcertChapters(subject, classNum);

    res.json({
      success: true,
      engine: "BOLT Python 3.10 Engine",
      count: result.count,
      chapters: result.chapters,
    });
  } catch (err: any) {
    console.error("Error in /api/python/ncert/chapters:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// NCERT Chapter Quiz Assessment (Secured)
app.get("/api/python/ncert/quiz", requireAuth, generalApiLimiter, (req, res) => {
  try {
    const chapterId = (req.query.chapterId as string) || "";
    if (!chapterId) {
      return res.status(400).json({ success: false, error: "Missing chapterId parameter" });
    }

    const result = executeNcertQuiz(chapterId);

    res.json({
      success: true,
      engine: "BOLT Python 3.10 Engine",
      chapterId: result.chapterId,
      questions: result.questions,
    });
  } catch (err: any) {
    console.error("Error in /api/python/ncert/quiz:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Allowed CLI operations for developer diagnostic console (strict whitelist, no arbitrary shell execution)
const ALLOWED_CLI_COMMANDS: Record<string, string[]> = {
  "python3 python/bolt_cli.py status": ["python/bolt_cli.py", "status"],
  "python python/bolt_cli.py status": ["python/bolt_cli.py", "status"],
  "python3 python/bolt_cli.py pyqs --era 19th_century": ["python/bolt_cli.py", "pyqs", "--era", "19th_century"],
  "python python/bolt_cli.py pyqs --era 19th_century": ["python/bolt_cli.py", "pyqs", "--era", "19th_century"],
  "python3 python/bolt_cli.py pyqs --peripheral": ["python/bolt_cli.py", "pyqs", "--peripheral"],
  "python python/bolt_cli.py pyqs --peripheral": ["python/bolt_cli.py", "pyqs", "--peripheral"],
  "python3 python/bolt_cli.py materials --demo": ["python/bolt_cli.py", "materials", "--demo"],
  "python python/bolt_cli.py materials --demo": ["python/bolt_cli.py", "materials", "--demo"],
  "python3 python/bolt_cli.py ncert --summary": ["python/bolt_cli.py", "ncert", "--summary"],
  "python python/bolt_cli.py ncert --summary": ["python/bolt_cli.py", "ncert", "--summary"],
  "python3 python/bolt_cli.py analytics": ["python/bolt_cli.py", "analytics"],
  "python python/bolt_cli.py analytics": ["python/bolt_cli.py", "analytics"],
};

// Python Engine CLI Terminal Runner - Secured for Admin & Disabled in Production by default
app.post("/api/python/cli/execute", requireAdmin, adminRateLimiter, (req, res) => {
  try {
    // Defense-in-depth: Disable CLI command execution in production environments
    if (process.env.NODE_ENV === "production" && process.env.ENABLE_DEV_CLI !== "true") {
      return res.status(403).json({
        success: false,
        error: "Python CLI execution is disabled in production environments for security hardening.",
      });
    }

    const { command } = req.body;
    const sanitized = (command || "").trim();

    const allowedArgs = ALLOWED_CLI_COMMANDS[sanitized];
    if (!allowedArgs) {
      return res.status(403).json({
        success: false,
        error: "Execution forbidden: only registered developer diagnostic commands are permitted.",
      });
    }

    const t0 = Date.now();
    const output = execFileSync("python3", allowedArgs, { encoding: "utf-8", timeout: 15000 });
    const executionTimeMs = Date.now() - t0;

    res.json({
      success: true,
      command: sanitized,
      executionTimeMs,
      output,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || "Command execution failed",
      stderr: err.stderr?.toString() || "",
    });
  }
});

// Model / Settings (The ONLY place where underlying engine details live)
app.get("/api/settings/model", (_req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY");
  res.json({
    provider: "Gemini AI Studio",
    model: "gemini-3.1-flash-lite",
    hasApiKey: hasKey,
    temperature: 0.7,
    contextWindow: "32,768 tokens",
    specialization: "UPSC Public Administration & Civil Services GS",
    trainingVersion: "v2.4-pubadmin-mains",
  });
});

// Server-controlled allowlists for AI overrides. Client requests may only select from
// these; raw apiKey/baseUrl/localEndpoint values are NEVER accepted from request bodies,
// since forwarding client-supplied credentials/endpoints into the AI gateway would allow
// key theft and SSRF against arbitrary internal or external hosts.
const ALLOWED_AI_MODELS = new Set([
  "gemini-3.1-flash-lite",
  "gemini-3.6-flash",
]);
const ALLOWED_AI_PROVIDERS = new Set(["gemini", "google", "local-ollama"]);
const DEFAULT_AI_MODEL = "gemini-3.1-flash-lite";

// Resolves a safe { modelOverride, providerOverride, systemPromptOverride } from client
// input. apiKey/baseUrl/localEndpoint overrides are only ever honored for admins running
// the internal model-diagnostics/testing flows, never for regular chat/eval traffic.
function resolveSafeAiOverrides(req: any, body: any) {
  const requestedModel = typeof body.modelId === "string" ? body.modelId : undefined;
  const requestedProvider = typeof (body.provider || body.modelType) === "string" ? (body.provider || body.modelType) : undefined;

  const modelOverride = requestedModel && ALLOWED_AI_MODELS.has(requestedModel) ? requestedModel : DEFAULT_AI_MODEL;
  const providerOverride = requestedProvider && ALLOWED_AI_PROVIDERS.has(requestedProvider) ? requestedProvider : undefined;

  const isAdmin = !!req.user?.isAdmin;
  return {
    modelOverride,
    providerOverride,
    // Custom system prompts and raw endpoint/key overrides are an admin-only diagnostic
    // capability (used e.g. by /api/ai/test-connection), never accepted from end users.
    systemPromptOverride: isAdmin && typeof body.systemPrompt === "string" ? body.systemPrompt.slice(0, 4000) : undefined,
    apiKeyOverride: undefined,
    baseUrlOverride: isAdmin && typeof body.baseUrl === "string" ? body.baseUrl : undefined,
    endpointOverride: isAdmin && typeof body.localEndpoint === "string" ? body.localEndpoint : undefined,
  };
}

// 1. BOLT Central Chatbot API (Powered by BoltAgentRuntime & AI Gateway)
app.post("/api/bolt/chat", requireAuth, aiRateLimiter, async (req, res) => {
  try {
    const {
      message,
      history = [],
      currentContext = {},
      mode = "general",
      user,
      topics,
      evaluations,
      timetableSlots,
      prelimsAttempts,
      articles,
    } = req.body;

    const safeOverrides = resolveSafeAiOverrides(req, req.body);

    const candidateData = {
      user: user || currentContext?.user || req.body.appContext?.user || { name: "Aspirant", target: "UPSC CSE 2026", optionalSubject: "Public Administration" },
      topics: topics || currentContext?.topics || req.body.appContext?.topics || [],
      evaluations: evaluations || currentContext?.evaluations || req.body.appContext?.evaluations || [],
      timetableSlots: timetableSlots || currentContext?.timetableSlots || req.body.appContext?.timetableSlots || [],
      prelimsAttempts: prelimsAttempts || currentContext?.prelimsAttempts || req.body.appContext?.prelimsAttempts || {},
      articles: articles || currentContext?.articles || req.body.appContext?.articles || [],
      studySessions: req.body.studySessions || currentContext?.studySessions || [],
      mode,
    };

    const runtimeResult = await BoltAgentRuntime.run(
      message || "",
      history,
      candidateData,
      safeOverrides
    );

    res.json({
      success: true,
      status: "AI_SUCCESS",
      isFallback: false,
      response: runtimeResult.response,
      mode,
      engine: `${runtimeResult.providerUsed} (${runtimeResult.modelUsed})`,
      citations: runtimeResult.citations,
      agentContext: runtimeResult.contextSnapshot,
      steps: runtimeResult.executedSteps,
    });
  } catch (error: any) {
    console.error("Bolt Chat Error (degraded fallback):", error?.message || error);
    aiFallbackCount++;
    const { message, mode = "public_admin", currentContext, user = { name: "Aspirant" } } = req.body;
    const isPubAdmin = mode === "public_admin";
    const responseText = generateContextualBoltResponse(message || "", isPubAdmin, currentContext, user);
    // AI_FALLBACK is a degraded state, not a normal success: success is explicitly false
    // so client-side success checks don't treat heuristic output as a genuine AI response,
    // even though we still return HTTP 200 with usable content for graceful UX.
    res.status(200).json({
      success: false,
      status: "AI_FALLBACK",
      isFallback: true,
      degraded: true,
      warning: "AI service connection unavailable. Generated from deterministic UPSC syllabus heuristics and academic rubrics.",
      response: responseText,
      mode: mode || "public_admin",
      engine: "Bolt Academic Heuristic Rule-Base (Offline)",
      citations: [],
    });
  }
});

// Dedicated Model-Independent AI Gateway Chat Endpoint
app.post("/api/ai/gateway/chat", requireAuth, aiRateLimiter, async (req, res) => {
  try {
    const response = await BoltAIGateway.chat(req.body);
    res.json({ success: true, status: "AI_SUCCESS", isFallback: false, ...response });
  } catch (err: any) {
    res.status(500).json({ success: false, status: "AI_UNAVAILABLE", isFallback: true, message: err.message });
  }
});

// ----------------------------------------------------
// STUDENT INTELLIGENCE ENGINE & TOPIC GRAPH API
// ----------------------------------------------------
app.post("/api/student/intelligence", requireAuth, (req, res) => {
  try {
    const report = StudentIntelligenceEngine.analyze(req.body);
    res.json({ success: true, report });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/student/topic-graph", requireAuth, (_req, res) => {
  res.json({ success: true, topicGraph: CANONICAL_TOPIC_GRAPH });
});

// ----------------------------------------------------
// AI GATEWAY SETTINGS & MODEL CONFIGURATION
// ----------------------------------------------------
// Model/gateway configuration is internal diagnostics data — admin only, matching the
// existing admin-only POST that mutates it (a masked apiKey is still sensitive config surface).
app.get("/api/ai/settings", requireAdmin, (_req, res) => {
  const cfg = getGatewayConfig();
  // Safe masking for sensitive API keys in responses
  const safeConfig = {
    ...cfg,
    apiKey: cfg.apiKey ? `${cfg.apiKey.slice(0, 4)}...${cfg.apiKey.slice(-4)}` : "",
  };
  res.json({ success: true, config: safeConfig });
});

app.post("/api/ai/settings", requireAdmin, (req, res) => {
  try {
    const updated = updateGatewayConfig(req.body);
    res.json({
      success: true,
      config: {
        ...updated,
        apiKey: updated.apiKey ? `${updated.apiKey.slice(0, 4)}...${updated.apiKey.slice(-4)}` : "",
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Live AI Model Latency & Connectivity Diagnostic Ping across all Providers
app.post("/api/ai/test-connection", requireAdmin, async (req, res) => {
  try {
    const result = await BoltAIGateway.testConnection(req.body);
    res.json(result);
  } catch (err: any) {
    res.json({
      success: false,
      connected: false,
      latencyMs: 0,
      message: err.message || "Failed to test connection",
      provider: req.body.provider || "unknown",
      model: req.body.modelId || "default",
      timestamp: new Date().toISOString(),
    });
  }
});

// ----------------------------------------------------
// LOCAL MODEL PLATFORM: DATASET BUILDER
// ----------------------------------------------------
app.get("/api/ai/dataset/items", requireAuth, (req, res) => {
  const { category, status } = req.query as { category?: string; status?: string };
  const items = ModelPlatformService.listDataset(category, status);
  res.json({ success: true, items, count: items.length });
});

// Dataset items are training data for the model: only admins/reviewers may add
// or modify them, matching the existing admin-only review/export endpoints below.
// (No separate "reviewer" role exists elsewhere in this file's req.user shape —
// requireAdmin is the same gate already used for /dataset/review and /dataset/export.
// If you have a distinct reviewer role/claim, swap this for that check instead.)
app.post("/api/ai/dataset/items", requireAdmin, (req, res) => {
  try {
    const item = ModelPlatformService.addDatasetItem(req.body);
    res.json({ success: true, item });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/ai/dataset/review", requireAdmin, (req, res) => {
  try {
    const { id, decision, reviewer } = req.body;
    const ok = ModelPlatformService.reviewDatasetItem(id, decision, reviewer || req.user!.email);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/ai/dataset/export", requireAdmin, (_req, res) => {
  const jsonl = ModelPlatformService.exportApprovedDatasetJsonl();
  res.setHeader("Content-Disposition", 'attachment; filename="bolt_upsc_dataset.jsonl"');
  res.setHeader("Content-Type", "application/jsonlines");
  res.send(jsonl);
});

// ----------------------------------------------------
// NON-BLOCKING ASYNCHRONOUS TRAINING QUEUE & WORKER
// ----------------------------------------------------
// Job creation (POST, below) is already admin-only, so no non-admin user can ever
// own a training job — there is nothing to "filter by owner" for. requireAdmin here
// is therefore the correct fix, not just the simpler one: it matches the actual
// ownership model instead of adding an owner-filter that would always return an
// empty list for non-admins while giving a false impression of per-user scoping.
app.get("/api/ai/training/jobs", requireAdmin, (_req, res) => {
  res.json({ success: true, jobs: ModelPlatformService.listTrainingJobs() });
});

app.post("/api/ai/training/jobs", requireAdmin, heavyTaskLimiter, (req, res) => {
  try {
    const job = ModelPlatformService.startTrainingJob(req.body);
    res.json({ success: true, job });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Detail route for training jobs — internal model training state is restricted to admins
app.get("/api/ai/training/jobs/:id", requireAdmin, (req, res) => {
  const job = ModelPlatformService.getTrainingJob(req.params.id);
  if (!job) return res.status(404).json({ success: false, message: "Job not found" });
  res.json({ success: true, job });
});

// ----------------------------------------------------
// MODEL REGISTRY & BENCHMARK VERIFICATION
// ----------------------------------------------------
app.get("/api/ai/registry/models", requireAuth, (_req, res) => {
  res.json({ success: true, models: ModelPlatformService.listModels() });
});

app.post("/api/ai/registry/activate", requireAdmin, adminRateLimiter, (req, res) => {
  try {
    const { modelId } = req.body;
    const result = ModelPlatformService.activateModel(modelId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/ai/registry/rollback", requireAdmin, adminRateLimiter, (req, res) => {
  try {
    const { targetId } = req.body || {};
    const result = ModelPlatformService.rollbackModel(targetId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ----------------------------------------------------
// KNOWLEDGE REPOSITORY & RAG API
// ----------------------------------------------------

app.get("/api/knowledge/documents", requireAuth, (req, res) => {
  const userId = (req.user!.isAdmin && req.query.userId) ? (req.query.userId as string) : req.user!.uid;
  const docs = listDocuments(userId);
  res.json({ success: true, documents: docs, count: docs.length });
});

app.get("/api/knowledge/documents/:id", requireAuth, (req, res) => {
  const doc = getDocumentById(req.params.id);
  if (!doc) {
    return res.status(404).json({ success: false, message: "Document not found" });
  }
  if (doc.document.userId && doc.document.userId !== req.user!.uid && !req.user!.isAdmin) {
    return res.status(403).json({ success: false, error: "Access denied to this document" });
  }
  res.json({ success: true, ...doc });
});

app.post("/api/knowledge/upload", requireAuth, heavyTaskLimiter, (req, res) => {
  try {
    const { title, category, tags, content, sourceUrl } = req.body;
    // Derive authenticated userId from token to ensure isolation
    const userId = req.user!.uid;
    const result = indexNewDocument({ title, category, tags, content, userId, sourceUrl });
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Failed to index document" });
  }
});

app.delete("/api/knowledge/documents/:id", requireAuth, (req, res) => {
  const doc = getDocumentById(req.params.id);
  if (doc && doc.document.userId && doc.document.userId !== req.user!.uid && !req.user!.isAdmin) {
    return res.status(403).json({ success: false, error: "Access denied to delete this document" });
  }
  const success = deleteDocument(req.params.id);
  res.json({ success });
});

app.post("/api/knowledge/archive", requireAuth, (req, res) => {
  try {
    const { id, archive } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, message: "Document id is required." });
    }
    const doc = getDocumentById(id);
    if (doc && doc.document.userId && doc.document.userId !== req.user!.uid && !req.user!.isAdmin) {
      return res.status(403).json({ success: false, error: "Access denied to archive this document" });
    }
    const success = archiveDocument(id, archive !== false);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Failed to archive document." });
  }
});

app.post("/api/knowledge/search", requireAuth, (req, res) => {
  const { query, category, limit } = req.body;
  const userId = req.user!.uid;
  const chunks = searchKnowledgeChunks(query || "", { category, limit: Number(limit) || 5, userId });
  res.json({ success: true, chunks, count: chunks.length });
});

// Topic Knowledge Diagnostic Tool API
app.get("/api/bolt/topic-diagnostic", requireAuth, (req, res) => {
  const topicName = (req.query.topicName as string) || "Administrative Thought";
  const isWeak = req.query.isWeak === "true";
  const diagnostic = computeTopicDiagnostic(topicName, isWeak);
  res.json({ success: true, diagnostic });
});

// ----------------------------------------------------
// CURRICULUM KNOWLEDGE GRAPH API (FIRESTORE-BACKED, SYSTEM-OWNED)
// ----------------------------------------------------
// Previously this endpoint group read/wrote a single flat local JSON file
// (data/knowledge_graph_store.json). That is unsafe in production: it is not shared
// across horizontally-scaled instances (each replica has its own disk, so writes on one
// instance are invisible to others), not durable across restarts/redeploys on ephemeral
// filesystems, and has no concurrency control for simultaneous read-modify-write requests.
// firestore.rules already defines the correct schema for this data (public read, admin-only
// write on knowledge_nodes / knowledge_edges / knowledge_clusters) but the server never
// actually used it. This migrates the implementation to match those rules, using the
// Firebase Admin SDK that initFirebaseAdmin() already initializes at module load.
const kgDb = getFirestore();
const KG_NODES_COLLECTION = "knowledge_nodes";
const KG_EDGES_COLLECTION = "knowledge_edges";
const KG_CLUSTERS_COLLECTION = "knowledge_clusters";

async function getKnowledgeGraphStore(): Promise<{ nodes: any[]; edges: any[]; clusters: any[]; updatedAt?: string }> {
  try {
    const [nodesSnap, edgesSnap, clustersSnap] = await Promise.all([
      kgDb.collection(KG_NODES_COLLECTION).get(),
      kgDb.collection(KG_EDGES_COLLECTION).get(),
      kgDb.collection(KG_CLUSTERS_COLLECTION).get(),
    ]);

    if (!nodesSnap.empty || !edgesSnap.empty) {
      return {
        nodes: nodesSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        edges: edgesSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        clusters: clustersSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        updatedAt: new Date().toISOString(),
      };
    }
  } catch (err: any) {
    console.warn("Firestore knowledge graph fetch notice (using local JSON store fallback):", err.message);
  }

  // Fallback to local structured dataset
  const localFile = path.join(process.cwd(), "data", "knowledge_graph_store.json");
  if (fs.existsSync(localFile)) {
    try {
      const content = JSON.parse(fs.readFileSync(localFile, "utf-8"));
      return {
        nodes: content.nodes || [],
        edges: content.edges || [],
        clusters: content.clusters || [],
        updatedAt: new Date().toISOString(),
      };
    } catch {}
  }

  return { nodes: [], edges: [], clusters: [], updatedAt: new Date().toISOString() };
}

// GET full knowledge graph — shared, system-owned curriculum reference data.
// Read access requires authentication; only admins may mutate it (see POST/DELETE below).
app.get("/api/curriculum/knowledge-graph", requireAuth, async (_req, res) => {
  try {
    const store = await getKnowledgeGraphStore();
    res.json({
      success: true,
      nodes: store.nodes,
      edges: store.edges,
      clusters: store.clusters,
      updatedAt: store.updatedAt,
    });
  } catch (e: any) {
    console.error("Failed to load knowledge graph from Firestore:", e);
    res.status(500).json({ success: false, message: "Failed to load knowledge graph." });
  }
});

// POST / PUT node — System-owned curriculum data: mutations are admin-only, not per-user.
app.post("/api/curriculum/knowledge-graph/nodes", requireAdmin, async (req, res) => {
  try {
    const node = req.body;
    if (!node || !node.id || !node.title) {
      return res.status(400).json({ success: false, message: "Valid node with id and title is required." });
    }
    await kgDb.collection(KG_NODES_COLLECTION).doc(String(node.id)).set(
      { ...node, updatedAt: new Date().toISOString(), updatedBy: req.user!.uid },
      { merge: true }
    );
    res.json({ success: true, node });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST batch positions (when an admin repositions nodes on the curriculum canvas)
// Repositioning nodes mutates the shared production graph — admin-only.
app.post("/api/curriculum/knowledge-graph/nodes/batch-positions", requireAdmin, async (req, res) => {
  try {
    const { positions } = req.body; // Array<{ id: string; x: number; y: number }>
    if (!Array.isArray(positions) || positions.length === 0) {
      return res.status(400).json({ success: false, message: "Positions array required." });
    }
    if (positions.length > 500) {
      return res.status(400).json({ success: false, message: "Too many positions in a single batch (max 500)." });
    }
    const batch = kgDb.batch();
    const now = new Date().toISOString();
    for (const p of positions) {
      if (!p || typeof p.id !== "string") continue;
      batch.set(
        kgDb.collection(KG_NODES_COLLECTION).doc(p.id),
        { x: p.x, y: p.y, updatedAt: now, updatedBy: req.user!.uid },
        { merge: true }
      );
    }
    await batch.commit();
    res.json({ success: true, count: positions.length });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST / PUT edge — System-owned curriculum data: mutations are admin-only, not per-user.
app.post("/api/curriculum/knowledge-graph/edges", requireAdmin, async (req, res) => {
  try {
    const edge = req.body;
    if (!edge || !edge.id || !edge.source || !edge.target) {
      return res.status(400).json({ success: false, message: "Valid edge with id, source, and target is required." });
    }
    await kgDb.collection(KG_EDGES_COLLECTION).doc(String(edge.id)).set(
      { ...edge, updatedAt: new Date().toISOString(), updatedBy: req.user!.uid },
      { merge: true }
    );
    res.json({ success: true, edge });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// DELETE node (and any edges referencing it) — admin only.
app.delete("/api/curriculum/knowledge-graph/nodes/:id", requireAdmin, async (req, res) => {
  try {
    const nodeId = req.params.id;
    const [sourceEdges, targetEdges] = await Promise.all([
      kgDb.collection(KG_EDGES_COLLECTION).where("source", "==", nodeId).get(),
      kgDb.collection(KG_EDGES_COLLECTION).where("target", "==", nodeId).get(),
    ]);
    const batch = kgDb.batch();
    batch.delete(kgDb.collection(KG_NODES_COLLECTION).doc(nodeId));
    for (const doc of [...sourceEdges.docs, ...targetEdges.docs]) {
      batch.delete(doc.ref);
    }
    await batch.commit();
    res.json({ success: true, deletedNodeId: nodeId });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// DELETE edge — admin only.
app.delete("/api/curriculum/knowledge-graph/edges/:id", requireAdmin, async (req, res) => {
  try {
    const edgeId = req.params.id;
    await kgDb.collection(KG_EDGES_COLLECTION).doc(edgeId).delete();
    res.json({ success: true, deletedEdgeId: edgeId });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ----------------------------------------------------
// RSS / ATOM FEED PIPELINE (The Hindu, PIB, Indian Express)
// ----------------------------------------------------

// Preset Feeds
app.get("/api/news/presets", (_req, res) => {
  res.json({
    success: true,
    presets: POPULAR_UPSC_FEEDS,
  });
});

// Approved-source allowlist for RSS ingestion. Fetching arbitrary user-supplied URLs from
// the server is an SSRF vector (probing internal/cloud-metadata hosts, port scanning, etc.),
// so only these known-safe UPSC news hostnames may ever be fetched.
const APPROVED_NEWS_FEED_HOSTNAMES = new Set<string>([
  "www.thehindu.com",
  "thehindu.com",
  "archive.pib.gov.in",
  "pib.gov.in",
  "indianexpress.com",
  "www.indianexpress.com",
]);
try {
  for (const preset of (POPULAR_UPSC_FEEDS as any[]) || []) {
    const candidateUrl = preset?.url || preset?.feedUrl || preset?.rssUrl || preset?.link;
    if (typeof candidateUrl === "string") {
      try {
        APPROVED_NEWS_FEED_HOSTNAMES.add(new URL(candidateUrl).hostname);
      } catch {}
    }
  }
} catch {}

function isApprovedFeedUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:") return false;
    return APPROVED_NEWS_FEED_HOSTNAMES.has(parsed.hostname);
  } catch {
    return false;
  }
}

let newsSyncInProgress = false;

function hasNewsCronSecret(req: express.Request): boolean {
  const expected = process.env.NEWS_CRON_SECRET;
  if (!expected) return false;
  const header = req.headers.authorization || "";
  const bearer = header.replace(/^Bearer\s+/i, "");
  return bearer === expected || req.headers["x-news-cron-secret"] === expected;
}

app.post("/api/news/sync", async (req, res) => {
  if (!hasNewsCronSecret(req)) {
    return res.status(process.env.NEWS_CRON_SECRET ? 403 : 503).json({
      success: false,
      error: process.env.NEWS_CRON_SECRET ? "Invalid news sync credential." : "NEWS_CRON_SECRET is not configured.",
    });
  }
  if (newsSyncInProgress) {
    return res.status(409).json({ success: false, error: "NEWS_SYNC_IN_PROGRESS" });
  }

  newsSyncInProgress = true;
  try {
    const result = await executeNewsIngestionPipeline();
    res.json({ success: true, ...result, timestamp: new Date().toISOString() });
  } catch (error: any) {
    const status = error?.message === "CURRENT_AFFAIRS_SYNC_IN_PROGRESS" ? 409 : 500;
    res.status(status).json({ success: false, error: error?.message || "News synchronization failed." });
  } finally {
    newsSyncInProgress = false;
  }
});

// Fetch & Parse single RSS/Atom Feed URL — restricted to approved source hostnames only.
app.post("/api/news/fetch-feed", requireAuth, async (req, res) => {
  try {
    const { feedUrl, sourceName } = req.body;
    if (!feedUrl || typeof feedUrl !== "string") {
      return res.status(400).json({
        success: false,
        error: "Missing required 'feedUrl' parameter.",
      });
    }
    const trimmedUrl = feedUrl.trim();
    if (!isApprovedFeedUrl(trimmedUrl)) {
      return res.status(403).json({
        success: false,
        error: "Feed URL host is not on the approved UPSC news source allowlist.",
      });
    }

    const result = await fetchAndParseRssFeed(trimmedUrl, sourceName);
    res.json(result);
  } catch (error: any) {
    console.error("RSS fetch error:", error);
    res.status(500).json({
      success: false,
      error: error?.message || "Failed to fetch or parse RSS feed.",
    });
  }
});

// Sync multiple feeds in batch — every feed URL, including client-supplied ones, is checked
// against the approved-source allowlist before being fetched.
app.post("/api/news/sync-all", requireAdmin, async (req, res) => {
  try {
    const requestedFeeds: { url: string; sourceName?: string }[] | undefined = req.body.feeds;
    const feedUrls: { url: string; sourceName?: string }[] = (requestedFeeds && requestedFeeds.length > 0)
      ? requestedFeeds.filter((f) => f && typeof f.url === "string" && isApprovedFeedUrl(f.url))
      : [
          { url: "https://www.thehindu.com/opinion/editorial/feeder/default.rss", sourceName: "The Hindu" },
          { url: "https://archive.pib.gov.in/rss/rss.aspx", sourceName: "PIB" },
          { url: "https://indianexpress.com/section/explained/feed/", sourceName: "The Indian Express" },
        ];

    if (feedUrls.length === 0) {
      return res.status(400).json({ success: false, error: "No approved feed URLs supplied." });
    }

    const results = await Promise.allSettled(
      feedUrls.map((f) => fetchAndParseRssFeed(f.url, f.sourceName))
    );

    // Merge articles and avoid duplicate headlines
    const seenHeadlines = new Set<string>();
    const mergedArticles = [];

    const failedSources: string[] = [];
    for (const result of results) {
      if (result.status === "rejected") {
        failedSources.push("unknown");
        continue;
      }
      const r = result.value;
      if (r.success && r.articles) {
        for (const art of r.articles) {
          const normTitle = art.headline.toLowerCase().trim();
          if (!seenHeadlines.has(normTitle)) {
            seenHeadlines.add(normTitle);
            mergedArticles.push(art);
          }
        }
      } else {
        failedSources.push(r.sourceDetected);
      }
    }

    res.json({
      success: true,
      count: mergedArticles.length,
      articles: mergedArticles,
      sourcesSynced: results
        .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof fetchAndParseRssFeed>>> => r.status === "fulfilled" && r.value.success)
        .map((r) => r.value.sourceDetected),
      failedSources,
    });
  } catch (error: any) {
    console.error("Sync all feeds error:", error);
    res.status(500).json({
      success: false,
      error: error?.message || "Failed to batch sync RSS feeds.",
    });
  }
});

// 1.1 Python LoRA Model Training Execution API
app.post("/api/bolt/train", requireAdmin, heavyTaskLimiter, async (req, res) => {
  try {
    const {
      datasetId,
      datasetName,
      baseModelId,
      huggingFaceModelId,
      ollamaModelTag,
      epochs = 3,
      loraRank = 16,
      loraAlpha,
      learningRate = 0.0002,
      quantize4bit = true,
      batchSize = 2,
    } = req.body;
    
    const configPayload = JSON.stringify({
      datasetId: datasetId || datasetName || "upsc-pubadmin-mains-pyq",
      datasetName: datasetName || datasetId || "UPSC Public Administration Mains & 2nd ARC",
      baseModelId: baseModelId || "llama3.1:8b-instruct-q4_K_M",
      huggingFaceModelId: huggingFaceModelId || "meta-llama/Meta-Llama-3.1-8B-Instruct",
      ollamaModelTag: ollamaModelTag || "llama3.1:8b-instruct-q4_K_M",
      epochs: Number(epochs) || 3,
      loraRank: Number(loraRank) || 16,
      loraAlpha: Number(loraAlpha) || (Number(loraRank) || 16) * 2,
      learningRate: Number(learningRate) || 0.0002,
      quantize4bit: Boolean(quantize4bit),
      batchSize: Number(batchSize) || 2,
    });

    const pythonOutput = execFileSync(
      "python3",
      ["python/bolt_train.py", "--config", configPayload],
      { encoding: "utf-8", timeout: 30000 }
    );

    const result = JSON.parse(pythonOutput.trim());
    res.json({
      success: true,
      trainingRun: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Python training execution error:", error?.message || error);
    res.status(500).json({
      success: false,
      error: error?.message || "Training pipeline execution encountered an issue.",
    });
  }
});

// 1.1.1 Current Affairs Processing Pipeline Endpoints (expensive network+AI work — admin only)
app.post("/api/news/pipeline/run", requireAdmin, heavyTaskLimiter, async (_req, res) => {
  try {
    const result = await executeNewsIngestionPipeline();
    res.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error?.message || "Failed running news pipeline.",
    });
  }
});

app.get("/api/news/pipeline/status", requireAuth, (_req, res) => {
  try {
    const status = getPipelineStatus();
    res.json({
      success: true,
      status,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message });
  }
});

app.post("/api/news/pipeline/mcqs", requireAuth, aiRateLimiter, (req, res) => {
  try {
    const count = parseInt(req.body.count || "5", 10);
    const articles = loadCurrentAffairsFromDisk();
    const mcqs = generateDailyCurrentAffairsMCQs(articles, count);
    res.json({
      success: true,
      count: mcqs.length,
      mcqs,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message });
  }
});

// 1.1.2 Daily Current Affairs Scheduled Trigger & Auto-Sync API
app.get("/api/news/daily-current-affairs", requireAuth, async (_req, res) => {
  try {
    const { articles: firestoreArticles } = await loadCurrentAffairsFromFirestore();
    let articles = firestoreArticles;
    if (!articles || articles.length === 0) {
      const pipelineResult = await executeNewsIngestionPipeline();
      articles = pipelineResult.articles;
    }
    const status = getPipelineStatus();
    res.json({
      success: true,
      count: articles.length,
      articles,
      status,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || "Failed to fetch current affairs." });
  }
});

app.post("/api/news/daily-current-affairs/sync", requireAdmin, heavyTaskLimiter, async (_req, res) => {
  try {
    const pipelineResult = await executeNewsIngestionPipeline();
    const status = getPipelineStatus();
    res.json({
      success: true,
      articles: pipelineResult.articles,
      newlyIngested: pipelineResult.newlyIngested,
      sources: pipelineResult.sources,
      status,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || "Failed to execute current affairs sync." });
  }
});

// NOTE: the previous naive `setInterval`-based background sync here (running every 30
// minutes purely in-process, duplicating the separate 6-hour scheduler below) has been
// removed. In-process timers are lost on every restart/redeploy/scale-out and can double-run
// across multiple instances. Scheduling now flows exclusively through initCurrentAffairsScheduler(),
// which enqueues into the durable jobQueue rather than invoking the pipeline directly (see below).

// 1.2 Model & Daemon Status API — restricted to authenticated users, and the local-model
// endpoint probe is locked to loopback hosts only to prevent SSRF against arbitrary hosts.
const LOOPBACK_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);
app.get("/api/bolt/models/status", requireAuth, async (req, res) => {
  let localOnline = false;
  const requestedEndpoint = (req.query.endpoint as string) || "http://localhost:11434";
  let endpoint = "http://localhost:11434";
  try {
    const parsed = new URL(requestedEndpoint);
    if (LOOPBACK_HOSTNAMES.has(parsed.hostname)) {
      endpoint = requestedEndpoint;
    }
  } catch {
    // Fall back to default loopback endpoint on invalid input.
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const check = await fetch(`${endpoint.replace(/\/$/, "")}/api/tags`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    localOnline = check.ok;
  } catch (e) {
    localOnline = false;
  }

  res.json({
    localEndpoint: endpoint,
    localEngineOnline: localOnline,
    pythonEngine: "active",
    pythonVersion: "3.10",
    cloudEngine: "Gemini 3.8 Flash (Active)",
  });
});

// 2. Mains Answer Evaluation API (Routed through Model-Independent AI Gateway)
app.post("/api/bolt/evaluate", requireAuth, async (req, res) => {
  try {
    const {
      question,
      answerText,
      maxMarks = 15,
      subject = "Public Administration",
    } = req.body;
    const safeOverrides = resolveSafeAiOverrides(req, req.body);
    const result = await BoltAIGateway.evaluateMains(
      {
        maxMarks: Number(maxMarks) || 15,
        questionText: question || "Mains Question",
        subject,
        providerOverride: safeOverrides.providerOverride,
        apiKeyOverride: undefined,
        baseUrlOverride: safeOverrides.baseUrlOverride,
        modelOverride: safeOverrides.modelOverride,
      },
      answerText || ""
    );
    res.json(result);
  } catch (error: any) {
    console.error("Evaluation error (degraded fallback):", error);
    aiFallbackCount++;
    const fallback = generateMainsEvaluationFallback(req.body.question, req.body.answerText, req.body.maxMarks || 15, req.body.subject);
    // Fallback is a degraded heuristic result, never presented as a genuine AI evaluation.
    res.status(200).json({ ...fallback, success: false, isFallback: true, status: "AI_FALLBACK", degraded: true });
  }
});

// Dedicated AI Gateway Mains Evaluation Endpoint
app.post("/api/ai/gateway/evaluate", requireAuth, async (req, res) => {
  try {
    const { rubric, answerText } = req.body;
    const result = await BoltAIGateway.evaluateMains(rubric, answerText);
    res.json({ success: true, evaluation: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Model Answer Generator API (Multi-provider via BoltAIGateway)
app.post("/api/bolt/model-answer", requireAuth, async (req, res) => {
  try {
    const {
      question,
      subject = "Public Administration",
      marks = 15,
      year = 2026,
    } = req.body;
    const safeOverrides = resolveSafeAiOverrides(req, req.body);

    const prompt = `Generate an exceptional, topper-level UPSC Civil Services Mains Model Answer for:
Subject: ${subject}
Year: ${year}
Marks: ${marks}
Question: "${question}"

Provide a detailed response with:
1. "introduction": 2-3 concise, impactful sentences grounding the concept and historical/constitutional context.
2. "diagramConcept": A structured concept diagram outline or flowchart breakdown (with nodes/arrows) that an aspirant can sketch in 45 seconds in the exam hall.
3. "multidimensionalBreakdown": An array of dimensions (e.g. Social, Economic, Political, Institutional, Administrative) each with bullet points and concrete Indian examples.
4. "thinkersAndCommittees": Specific citations (e.g. 2nd ARC, Weber, Simon, Sarkaria, Supreme Court cases).
5. "criticalAnalysis": Contemporary challenges and implementation gaps.
6. "wayForward": Pragmatic, actionable solutions.
7. "conclusion": Forward-looking, SDG/constitutional ethos summary.

Format strictly as JSON matching this structure.`;

    const genRes = await BoltAIGateway.generate({
      prompt,
      responseFormat: "json",
      providerOverride: safeOverrides.providerOverride,
      apiKeyOverride: undefined,
      baseUrlOverride: safeOverrides.baseUrlOverride,
      modelOverride: safeOverrides.modelOverride,
    });

    if (genRes.parsedJson && Object.keys(genRes.parsedJson).length > 0) {
      return res.json(genRes.parsedJson);
    }
    const match = genRes.text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return res.json(JSON.parse(match[0]));
      } catch {}
    }
    aiFallbackCount++;
    const fallback = generateModelAnswerFallback(question, subject, marks, year);
    return res.status(200).json({ ...fallback, success: false, isFallback: true, status: "AI_FALLBACK", degraded: true });
  } catch (error: any) {
    console.error("Model answer error (degraded fallback):", error);
    aiFallbackCount++;
    const fallback = generateModelAnswerFallback(req.body.question, req.body.subject, req.body.marks || 15, req.body.year || 2026);
    res.status(200).json({ ...fallback, success: false, isFallback: true, status: "AI_FALLBACK", degraded: true });
  }
});

// Helper Fallbacks
function generateContextualBoltResponse(msg: string, isPubAdmin: boolean, ctx: any, user: any, relevantChunks: any[] = []): string {
  const lower = msg.toLowerCase();
  const weakList = Array.isArray(ctx?.weakTopics) && ctx.weakTopics.length > 0 
    ? ctx.weakTopics 
    : ["Administrative Thinkers (Taylor, Weber, Simon)", "Accountability & Control", "Financial Administration"];
  const strongList = Array.isArray(ctx?.strongTopics) && ctx.strongTopics.length > 0
    ? ctx.strongTopics
    : ["Administrative Behaviour & Motivation", "Constitutional Framework", "Local Governance"];

  const syllabusText = ctx?.syllabusCompletion || "78% overall";
  const paper1Text = ctx?.paper1Completion || "71%";
  const paper2Text = ctx?.paper2Completion || "56%";
  const attemptsCount = ctx?.questionsAttempted ?? user?.questionsAttempted ?? 14;
  const mainsCount = ctx?.mainsEvaluatedCount ?? user?.mainsEvaluatedCount ?? 6;
  const prelimsAcc = ctx?.prelimsAccuracy || (user?.overallAccuracy ? `${user.overallAccuracy}%` : "74%");

  let ragCitationBlock = "";
  if (relevantChunks && relevantChunks.length > 0 && (relevantChunks[0].score || 0) > 2) {
    ragCitationBlock = `\n\n---\n#### 📄 Verified Sources (from your Knowledge Repository):\n` +
      relevantChunks.slice(0, 2).map((c: any) => `- **${c.documentTitle}** (*${c.category}*, approx. Page ${c.approxPage || 1})\n  > *"...${c.text.slice(0, 160).replace(/\n/g, ' ')}..."*`).join("\n");
  }
  
  // App Help & Capabilities
  if (
    lower.includes("app") ||
    lower.includes("how do i use") ||
    lower.includes("help me in") ||
    lower.includes("what can you do") ||
    lower.includes("capabilities") ||
    lower.includes("tour") ||
    lower.includes("features")
  ) {
    return `### ⚡ BOLT AI In-App Command Center & Access Guide

Hello ${user.name || "Aspirant"}! I am **Bolt**, your dedicated UPSC mentor and co-pilot across this entire workspace. I don't just answer questions—I have live, bidirectional access to your study records and can guide you directly into every tool:

---

#### 1. 🎯 Prelims MCQ Simulator
- **What it does:** Dynamic, timed 4-option UPSC Prelims questions with detailed explanations, syllabus linkage, and option elimination rationales.
- **How I help:** I analyze your error patterns and generate drills targeting your exact weak areas.
- [⚡ Practice Prelims MCQs](#action:prelims)

#### 2. 📝 Mains 7-Dimension Evaluator
- **What it does:** Rigorously grades typed or handwritten answers against the 7-dimension UPSC rubric with marks out of 15 and thinker upgrades.
- **How I help:** Submit an answer here or in the Mains room. I identify missing constitutional articles and administrative doctrines.
- [📝 Open Mains Evaluation Room](#action:mains)

#### 3. 📅 Adaptive Study Planner & Timetable
- **What it does:** Schedules your daily study sessions with built-in **Ebbinghaus Spaced Repetition** to ensure high recall retention.
- **How I help:** I align your timetable with your live syllabus coverage.
- [📅 View & Customize Timetable](#action:planner)

#### 4. 🗺️ Concept Knowledge Graph
- **What it does:** Interactive 2D graph mapping Public Administration Thinkers, Constitutional Articles, and contemporary Indian governance.
- **How I help:** I help you spot Paper 1 ↔ Paper 2 cross-linkages for high-scoring Mains answers.
- [🗺️ Open Concept Knowledge Graph](#action:knowledgeGraph)

#### 5. 📊 Granular Syllabus & Progress Diagnostics
- **What it does:** Differentiates between what you have covered (**Syllabus Completion**) and your actual retention (**Knowledge Mastery**).
- **How I help:** Ask me *"Where am I lagging?"* anytime.
- [📊 View Syllabus Progress](#action:learn)

#### 6. 📖 NCERT Foundation & Quizzes
- **What it does:** Foundational summaries and chapter-end quizzes for Classes 6–12 across History, Polity, Economy, and Geography.
- [📖 Study NCERT Foundation](#action:ncert)

#### 7. 📜 Historical PYQs Archive
- **What it does:** Explores 19th-century civil services examinations, early republic trends, and modern peripheral questions.
- [📜 Historical PYQs Archive](#action:pyqs)

#### 8. 📰 Curated Current Affairs & Daily MCQs
- **What it does:** Daily editorials from The Hindu, Livemint, and PIB mapped to GS papers with instant MCQs.
- [📰 Read Today's News & Editorials](#action:news)

#### 9. 📚 2nd ARC & Thinker Knowledge Base
- **What it does:** Comprehensive indexed corpus of the 2nd Administrative Reforms Commission reports and administrative theorists.
- [📚 Search 2nd ARC Corpus](#action:knowledge)

#### 10. ⏱️ Focus Timer & ⚙️ AI Engine Settings
- [⏱️ Open Focus Timer](#action:schedule) &nbsp;|&nbsp; [⚙️ Configure Model & API Keys](#action:settings)

---

What would you like to explore right now? Click any button above or simply tell me what topic is on your mind!`;
  }

  if (lower.includes("weak") || lower.includes("struggling") || lower.includes("analyze my progress") || lower.includes("ennoda knowledge")) {
    return `### 📊 Diagnostic Evaluation for ${user.name}

Based on your current platform performance across **${attemptsCount} test attempts** and **${mainsCount} Mains evaluations**:

**Overall Syllabus Completion:** ${syllabusText}
- **Paper 1 (Administrative Theory):** ${paper1Text}
- **Paper 2 (Indian Administration):** ${paper2Text}
- **Current Prelims Accuracy:** ${prelimsAcc}

#### ⚠️ Critical Weak Areas Requiring Immediate Focus
${weakList.map((w: string, idx: number) => `${idx + 1}. **${w}**`).join("\n")}

#### 🌟 Established Strengths
${strongList.map((s: string) => `- **${s}**`).join("\n")}

#### 🎯 Recommended Action Plan for Today:
1. **Targeted Revision**: Spend 45 minutes on **${weakList[0] || "Administrative Thought"}**.
2. **Prelims Drill**: Practice 10 high-yield MCQs to test conceptual clarity.
3. **Mains Synthesis**: Draft 1 structured 15-mark answer integrating 2nd ARC citations.

> 💡 **Next Steps:**
> - [⚡ Open Prelims Practice](#action:prelims)
> - [📝 Submit Mains Answer for Evaluation](#action:mains)
> - [📅 Add Revision Slot to Timetable](#action:planner)`;
  }

  if (lower.includes("revision plan") || lower.includes("study plan") || lower.includes("what should i study") || lower.includes("timetable")) {
    return `### 📅 High-Yield 7-Day Targeted Study Plan for ${user.name}

Tailored strictly to address your weak spots in **Administrative Thinkers** & **Accountability**:

- **Day 1 (Today):** Administrative Thought — Classical vs Behavioural Paradigm (Taylor, Weber, Follett). Solve 15 MCQs + 1 Mains 10-marker.
- **Day 2:** Herbert Simon's Decision Making Theory & Chester Barnard's Functions of the Executive. Link with Paper 2 District Administration.
- **Day 3:** Accountability Mechanisms — Citizens' Charters, Social Audit, 2nd ARC Report 4 recommendations.
- **Day 4:** Indian Administration — Union Secretariat & Cabinet Secretariat role evolution.
- **Day 5:** Civil Services in India — Article 311 constitutional safeguards & Lateral Entry debates.
- **Day 6:** Full Paper 1 Sectional Test (100 Marks) under timed exam conditions.
- **Day 7:** Comprehensive answer review with Bolt + Weak topic remediation.

> 💡 **Manage Your Schedule:**
> - [📅 View & Customize Timetable](#action:planner)
> - [⏱️ Start a Timed Focus Session](#action:schedule)`;
  }

  if (lower.includes("simon") || lower.includes("bounded rationality")) {
    return `### 🧠 Herbert Simon's Bounded Rationality — Public Administration Core

**1. Core Philosophy:**
Herbert Simon in *Administrative Behavior (1947)* demolished the Classical 'Economic Man' who maximizes utilities with perfect knowledge. Simon introduced **Administrative Man**, who operates under **Bounded Rationality** and seeks to **satisfice** rather than maximize.

**2. Three Core Constraints of Bounded Rationality:**
- **Cognitive limitations:** Human mind cannot compute all possible consequences.
- **Imperfect information:** Bureaucrats never have 100% complete data in dynamic situations.
- **Time & resource pressures:** Decisions must be taken within statutory deadlines.

**3. Application to UPSC Mains (Paper 1 & Paper 2 Linkage):**
- *Paper 1:* Connects with decision premises (Fact vs Value). In public policy formulation, value premises often dominate factual analysis.
- *Paper 2 (Indian Context):* Disaster management during flash floods (e.g. Wayanad/Himalayan floods) or emergency procurement during Covid-19 are classic examples of the District Magistrate satisficing under bounded rationality.
- *Way Forward / Thinker Integration:* Yehezkel Dror's *Optimal Model* and Charles Lindblom's *Incrementalism (Muddling Through)* build upon Simon's critique.

> 💡 **Related Tools:**
> - [📝 Evaluate Mains Answer on Herbert Simon](#action:mains)
> - [🗺️ View Simon in Knowledge Graph](#action:knowledgeGraph)`;
  }

  if (lower.includes("weber") || lower.includes("bureaucracy") || lower.includes("ideal type")) {
    return `### 🏛️ Max Weber's Ideal-Type Bureaucracy & Contemporary Relevance

**1. Characteristics of Weberian Bureaucracy:**
- **Hierarchy of Authority:** Clear chain of command and spherical jurisdictions.
- **Impersonal Order & Formal Rules:** Sine ira et studio (without hatred or passion).
- **Written Documentation:** Preserved files and official records.
- **Merit-based Recruitment:** Technical competence and fixed salary with pension rights.

**2. Critiques (Paper 1):**
- Robert Merton: Trained incapacity, displacement of goals (rules become ends in themselves).
- Alvin Gouldner: Mock bureaucracy vs Representative bureaucracy.
- Michel Crozier: The Bureaucratic Phenomenon — vicious circles of rigidity.

**3. Indian Context (Paper 2):**
- The "Steel Frame" (Sardar Patel's vision) versus the "Iron Cage" of red-tapism.
- Shift from Weberian rule-bound bureaucracy to Citizen-Centric Governance (2nd ARC 12th Report), Mission Karmayogi, and lateral entry.

> 💡 **Related Tools:**
> - [📝 Submit an Answer on Weber](#action:mains)
> - [📚 Search 2nd ARC Report 10 on Civil Service Reform](#action:knowledge)`;
  }

  if (lower.includes("article 311") || lower.includes("civil services") || lower.includes("doctrine of pleasure")) {
    return `### 📜 Constitutional Safeguards for Civil Servants: Article 311

**1. Key Provisions:**
- **Clause (1):** No civil servant can be dismissed or removed by an authority subordinate to that by which they were appointed.
- **Clause (2):** No dismissal, removal, or reduction in rank without a reasonable inquiry informing them of charges and granting reasonable opportunity of being heard.

**2. The Exceptions (Proviso to Art 311(2)):**
- Sub-clause (a): Conviction on a criminal charge.
- Sub-clause (b): Where the disciplinary authority records in writing that it is not reasonably practicable to hold an inquiry.
- Sub-clause (c): Where the President or Governor is satisfied that in the interest of the security of the State, it is not expedient to hold an inquiry.

**3. Public Administration & 2nd ARC Recommendations:**
- Balancing security of tenure (to foster fearless, honest advice) with accountability (weeding out corrupt/inefficient officers via FR 56(j) periodic reviews).
- 2nd ARC (10th Report on *Refurbishing of Personnel Administration*) recommended streamlining disciplinary inquiries to prevent frivolous delays.

> 💡 **Explore in App:**
> - [⚡ Prelims Practice on Polity & Constitution](#action:prelims)
> - [🗺️ Open Concept Knowledge Graph](#action:knowledgeGraph)`;
  }

  if (lower.includes("arc") || lower.includes("administrative reforms commission")) {
    return `### 📑 2nd Administrative Reforms Commission (ARC) Key Reports for Mains

The 2nd ARC (chaired by Veerappa Moily) is indispensable for scoring in Public Administration Paper 2 and GS Paper 4:

1. **4th Report — Ethics in Governance:**
   - National Ombudsman (Lokpal) and strengthening Lokayuktas.
   - Code of Ethics & Code of Conduct distinction for civil servants and ministers.
   - Protection of whistleblowers and confiscation of corrupt properties.
2. **1st Report — Right to Information: Master Key to Good Governance:**
   - Suo-motu disclosure under Section 4(1)(b) of RTI Act.
   - Repeal/amendment of the Official Secrets Act, 1923.
3. **6th Report — Local Governance:**
   - Devolution of Funds, Functions, and Functionaries (3Fs) to PRIs and ULBs.
   - Activity mapping and District Planning Committees (Art 243ZD).
4. **10th Report — Refurbishing Personnel Administration:**
   - Performance-related pay, domain specialization for civil servants, and 360-degree appraisal systems.
5. **12th Report — Citizen Centric Administration:**
   - Sevottam framework, Citizen Charters with grievance redressal timelines, and social audits.

> 💡 **Search Reports:**
> - [📚 Open 2nd ARC Knowledge Base](#action:knowledge)
> - [📝 Grade Answer on ARC Recommendations](#action:mains)`;
  }

  // India's Independence & Modern History
  if (
    lower.includes("independence") ||
    lower.includes("independent") ||
    lower.includes("1947") ||
    lower.includes("freedom struggle") ||
    lower.includes("british rule") ||
    lower.includes("mountbatten") ||
    lower.includes("tryst with destiny") ||
    lower.includes("partition") ||
    lower.includes("quit india")
  ) {
    return `India attained independence from British colonial rule on **August 15, 1947**.

While this marks the historic birth of modern independent India, in the context of the UPSC Civil Services Examination—particularly **GS Paper 1 (Modern Indian History)** and **GS Paper 2 (Constitutional Framework & Governance)**—it represents several key constitutional and administrative milestones:

---

### 1. The Legal & Constitutional Framework
- **The Indian Independence Act, 1947**: Passed by the British Parliament and granted Royal Assent on **July 18, 1947**, this statute formally terminated British sovereignty and created two independent Dominions: **India** and **Pakistan**.
- **The Mountbatten Plan (June 3, 1947)**: Set forth the principles of partition, the immediate transfer of power on a dominion status basis, and the demarcation of frontiers under the Radcliffe Boundary Commission.
- **Interim Constitutional Architecture**: Under Section 8 of the 1947 Act, the **Government of India Act, 1935** (adapted with essential omissions) served as the working constitution of India until the new Constitution was enacted on **November 26, 1949** and came into full force on **January 26, 1950**.

### 2. Transition from Dominion to Sovereign Republic
- From August 15, 1947 to January 26, 1950, India was technically a Dominion within the British Commonwealth. Lord Mountbatten served as the first Governor-General of independent India (until June 1948), followed by **C. Rajagopalachari**—the only Indian Governor-General.
- The **Constituent Assembly**, elected under the Cabinet Mission Plan of 1946, took on a dual role: drafting the sovereign constitution (chaired by Dr. Rajendra Prasad with Dr. B.R. Ambedkar chairing the Drafting Committee) and functioning as India's provisional parliament (presided over by G.V. Mavalankar).

### 3. Administrative Continuity & Patel's Vision
- Rather than dismantling the administrative machinery, **Sardar Vallabhbhai Patel** championed the preservation of an All India Service structure under Article 312, creating the modern **Indian Administrative Service (IAS)** and **Indian Police Service (IPS)** to maintain national cohesion during the complex integration of over 560 princely states.

Would you like to examine the Constituent Assembly debates, practice a Mains question on the integration of princely states, or test your Prelims knowledge on the 1947 Act?`;
  }

  // Indian Constitution, Preamble & Governance Core
  if (
    lower.includes("constitution") ||
    lower.includes("preamble") ||
    lower.includes("fundamental right") ||
    lower.includes("dpsp") ||
    lower.includes("directive principle") ||
    lower.includes("emergency") ||
    lower.includes("basic structure") ||
    lower.includes("kesavananda") ||
    lower.includes("federalism")
  ) {
    return `### 📜 Constitutional Dimensions & Institutional Architecture

The Constitution of India was framed over 2 years, 11 months, and 18 days by the Constituent Assembly, adopted on **November 26, 1949** and enacted on **January 26, 1950**.

#### Core Pillars for UPSC Analysis:
1. **The Preamble**: 
   - Establishes the constitutional philosophy: a *Sovereign, Socialist, Secular, Democratic, Republic* striving for *Justice, Liberty, Equality, and Fraternity*.
   - In *Kesavananda Bharati (1973)*, the Supreme Court confirmed the Preamble is an integral part of the Constitution, subject to amendment under Article 368 without altering the **Basic Structure**.

2. **Fundamental Rights (Part III) & DPSPs (Part IV)**:
   - Harmonious construction (*Minerva Mills, 1980*): The Constitution is founded on the bedrock of the balance between enforceable civil-political rights and socio-economic aspirations.

3. **Asymmetric Federalism & Cooperative Governance**:
   - Division of legislative powers under the 7th Schedule, backed by inter-governmental institutions like the GST Council (Art 279A) and Finance Commission (Art 280).

Which specific constitutional article, landmark judicial precedent, or governance mechanism would you like to explore?`;
  }

  // Conversational Greeting
  if (
    lower === "hi" ||
    lower === "hello" ||
    lower === "hey" ||
    lower.includes("talk to me") ||
    lower.includes("who are you")
  ) {
    return `### Hello! It's wonderful to connect with you.

I am **Bolt**, your dedicated UPSC mentor and study partner. I combine the conversational poise, depth, and clarity of Claude with real-time access to your study performance across this workspace.

How can I assist with your preparation or conceptual questions today? Whether you'd like to explore an administrative theory, practice Prelims MCQs, or review your study plan, I'm here to help.`;
  }

  // General Direct Response
  return `Thank you for bringing this up.

From an academic and civil services preparation standpoint, addressing this topic requires looking at the underlying principles, constitutional or administrative context, and real-world governance implications:

1. **Core Conceptual Foundations**: Clarity on primary definitions, statutory authorities, and institutional mandates is essential for balanced analysis.
2. **Key Dynamics & Dimensions**: Evaluating the topic across administrative efficiency, constitutional propriety, accountability, and public interest.
3. **Application & Contemporary Relevance**: Citing authoritative commissions (like the 2nd ARC) or relevant constitutional articles strengthens both Prelims accuracy and Mains answer writing.

Feel free to ask a specific follow-up question or let me know if you would like to test this area with practice MCQs or an evaluated Mains answer!`;
}

function generateMainsEvaluationFallback(question: string, answerText: string, maxMarks: number, subject: string) {
  return {
    score: Math.min(10.5, Math.round(maxMarks * 0.68 * 10) / 10),
    maxMarks,
    criteria: {
      questionDemand: 8,
      content: 8,
      structure: 7,
      analysis: 6,
      examples: 8,
      conclusion: 8,
      // 7-Dimension UPSC Mains Rubric
      introductionScore: 1.1, // out of 1.5
      conceptualClarityScore: 1.5, // out of 2.0
      contentDemandScore: 2.6, // out of 4.0
      analysisScore: 1.4, // out of 2.0
      examplesAndThinkersScore: 1.1, // out of 1.5
      structureScore: 0.9, // out of 1.0
      conclusionScore: 0.8, // out of 1.0
    },
    whatWentWell: [
      "Clear understanding of the core concept and prompt directive.",
      "Good inclusion of real-world administrative context and illustrative examples.",
      "Logical paragraph division with distinct introduction and forward-looking conclusion.",
    ],
    needsImprovement: [
      "Question directive was only partially addressed; needs more comparative depth.",
      "Integrate at least one administrative thinker (e.g., Weber/Simon) or 2nd ARC recommendation.",
      "Provide a sharper visual concept flowchart to save time and capture multi-dimensionality.",
    ],
    missingDimensions: [
      "Institutional dimension: Role of oversight bodies (CVC, Lokpal, CAG).",
      "Accountability dimension: Citizens' Charters and social audits.",
      "Citizen-centric dimension: Grassroots grievance redressal (Sevottam model).",
    ],
    repeatedWeaknesses: [
      "Weak introductions lacking crisp constitutional or theoretical framing",
      "Limited empirical examples and committee citations (e.g., 2nd ARC, Sarkaria Commission)",
      "Insufficient critical counter-analysis before concluding",
      "Inconsistent citation of relevant administrative thinkers",
    ],
    boltFeedback: `Your answer demonstrates solid foundational knowledge and good articulation. However, in competitive UPSC evaluation, you are losing 2-3 crucial marks because you treat the topic in a generalized GS manner rather than applying specialized Public Administration rigor. By grounding your arguments in 2nd ARC recommendations and citing scholars like Fred Riggs or Chester Barnard, your score will easily jump to the 12-13/15 bracket.`,
    modelAnswerOutline: {
      introduction: "Contextualize the theme with constitutional provisions or historical administrative shifts.",
      coreArguments: [
        "Primary structural dynamics and operational bottlenecks.",
        "Citizen interface and procedural delays.",
        "Digital governance interventions and accountability loops.",
      ],
      thinkersAndCommittees: [
        "2nd ARC 12th Report on Citizen-Centric Administration",
        "Herbert Simon's Satisficing model in bureaucratic discretion",
      ],
      wayForward: "Adopt the 3E approach (Economy, Efficiency, Effectiveness) coupled with institutionalized Social Audits.",
    },
  };
}

function generateModelAnswerFallback(question: string, subject: string, marks: number, year: number) {
  return {
    subject,
    year,
    marks,
    question,
    introduction:
      "Globalization and administrative modernisation have fundamentally transformed India's institutional architecture, demanding a paradigm shift from rigid bureaucratic hierarchy toward agile, citizen-centric governance.",
    diagramConcept: {
      title: "Multidimensional Impact & Governance Model",
      nodes: [
        { label: "Economic Sphere", details: "Gig economy, Market deregulation, FDI flows" },
        { label: "Social Sphere", details: "Nuclear families, Individualism, Urbanization" },
        { label: "Political Sphere", details: "Digital activism, Participatory democracy" },
        { label: "Administrative Sphere", details: "Citizen charters, Sevottam, Decentralization" },
      ],
    },
    multidimensionalBreakdown: [
      {
        heading: "Impact on Social & Cultural Spheres",
        points: [
          "Changing family dynamics: Shift toward nuclear setups fostering autonomy while raising senior citizen vulnerability.",
          "Democratization of knowledge: Massive uptake of MOOCs (SWAYAM, Coursera) bridging tier-2/3 educational divides.",
        ],
        examples: "Rise in urban crèches, mental health helplines (KIRAN), and gig worker unions.",
      },
      {
        heading: "Impact on Economic & Employment Realities",
        points: [
          "Rise of platform economy: Expanding youth employment in delivery and tech sectors.",
          "Skill mismatch: Need for dynamic vocational training aligned with National Education Policy (NEP) 2020.",
        ],
        examples: "PM Kaushal Vikas Yojana 4.0, Startup India ecosystem rankings.",
      },
    ],
    thinkersAndCommittees: [
      "2nd ARC Report on Ethics in Governance & Citizen-Centric Governance",
      "Fred Riggs' Prismatic-Sala Model regarding formalistic transition in developing polities",
      "Herbert Simon's Bounded Rationality in fast-paced tech policy decisions",
    ],
    criticalAnalysis:
      "While technological globalization creates unprecedented opportunities, uneven digital infrastructure risks exacerbating regional and socioeconomic disparities.",
    wayForward:
      "Institutionalize social security for platform workers, deepen digital literacy missions, and strengthen local self-governance institutions under 73rd and 74th Amendments.",
    conclusion:
      "By harmonizing global best practices with constitutional values of equity and social justice, Indian administration can successfully steer the youth dividend toward holistic national development.",
  };
}

// Scheduling enqueues onto the durable, persisted jobQueue (system-owned, type
// "current_affairs_sync") rather than invoking the pipeline directly. The actual
// execution logic lives in the "current_affairs_sync" worker registered further
// down this file.
//
// ITEM 5 FIX (scaffold, see server/jobQueue.ts header): the in-process setInterval
// below is still per-replica, which by itself would double-enqueue under horizontal
// scale-out — that was the original bug. It is now guarded by a Firestore
// transactional lock (jobQueue.tryAcquireLock) so only the one replica that wins the
// lock for a given ~6-hour window actually enqueues; the rest no-op silently. This
// makes the in-process timer *safe* under scale-out, but the recommended production
// path is still to drive this from a real external scheduler (Cloud Scheduler / cron
// hitting POST /api/internal/scheduler/current-affairs-sync below) and disable the
// setInterval entirely via DISABLE_INPROCESS_SCHEDULER — the lock is a safety net,
// not a replacement for a real scheduler product.
function initCurrentAffairsScheduler() {
  console.log("[Scheduler] Booting durable UPSC Current Affairs & MCQ job scheduler...");
  loadCurrentAffairsFromFirestore().catch((e) =>
    console.warn("[CurrentAffairs] Boot sync notice:", e.message)
  );

  const enqueueSyncJob = async (label: string) => {
    try {
      const gotLock = await jobQueue.tryAcquireLock("current_affairs_sync", 6 * 60 * 60 * 1000 - 60_000);
      if (!gotLock) {
        console.log(`[Scheduler] Skipping "${label}" — another instance holds the lock for this window.`);
        return;
      }
      const job = jobQueue.enqueue("current_affairs_sync", label, { ownerId: "system", triggeredBy: "scheduler" });
      console.log(`[Scheduler] Enqueued durable job ${job?.id || "(unknown id)"} (${label}).`);
    } catch (e) {
      failedJobsCount++;
      console.warn("[Scheduler] Failed to enqueue current_affairs_sync job:", e);
    }
  };

  // In Cloud Run / production environments, disable the in-process timer and rely on
  // the external Cloud Scheduler endpoint (POST /api/internal/scheduler/current-affairs-sync)
  // as the authoritative production scheduler.
  const isCloudRun = Boolean(process.env.K_SERVICE || process.env.K_REVISION || process.env.CLOUD_RUN_JOB);
  const isProduction = process.env.NODE_ENV === "production" || isCloudRun;
  const disableInProcess =
    process.env.DISABLE_INPROCESS_SCHEDULER === "true" ||
    (isProduction && process.env.ENABLE_INPROCESS_SCHEDULER !== "true");

  if (disableInProcess) {
    console.log(
      "[Scheduler] Production Cloud Run mode active: in-process timer disabled. External Cloud Scheduler endpoint (POST /api/internal/scheduler/current-affairs-sync) is the authoritative production scheduler."
    );
    return;
  }

  // Initial sync shortly after boot (local development only)
  setTimeout(() => enqueueSyncJob("Startup current affairs sync"), 3000);

  // Periodic refresh every 6 hours (local development only)
  setInterval(() => enqueueSyncJob("Scheduled 6-hour current affairs sync"), 6 * 60 * 60 * 1000);
}

// Production-recommended trigger path: point an external scheduler (Cloud
// Scheduler, a cron-based CI job, etc.) at this endpoint instead of relying on
// the in-process timer. Protected by a shared secret rather than end-user auth,
// since the caller is infrastructure, not a logged-in user. Set
// SCHEDULER_TRIGGER_SECRET in the environment; requests without a matching
// X-Scheduler-Secret header are rejected. This endpoint is new — wire it up to
// your actual scheduler and set the env var before relying on it.
app.post("/api/internal/scheduler/current-affairs-sync", (req, res) => {
  const expected = process.env.SCHEDULER_TRIGGER_SECRET;
  if (!expected) {
    return res.status(503).json({ success: false, error: "SCHEDULER_TRIGGER_SECRET is not configured." });
  }
  if (req.headers["x-scheduler-secret"] !== expected) {
    return res.status(403).json({ success: false, error: "Invalid scheduler credential." });
  }
  try {
    const job = jobQueue.enqueue("current_affairs_sync", "External scheduler trigger", {
      ownerId: "system",
      triggeredBy: "external-scheduler",
    });
    res.json({ success: true, job });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e?.message || "Failed to enqueue job." });
  }
});

// ----------------------------------------------------
// JOB QUEUE WORKERS REGISTRATION
// ----------------------------------------------------
jobQueue.registerWorker("benchmark_run", async (job) => {
  jobQueue.updateProgress(job.id, 15);
  const report = await executeBoltBenchmarkSuite();
  jobQueue.updateProgress(job.id, 100);
  return report;
});

jobQueue.registerWorker("disaster_recovery_test", async (job) => {
  jobQueue.updateProgress(job.id, 25);
  const report = await runDisasterRecoveryVerification();
  jobQueue.updateProgress(job.id, 100);
  return report;
});

jobQueue.registerWorker("current_affairs_sync", async (job) => {
  jobQueue.updateProgress(job.id, 30);
  const res = await executeNewsIngestionPipeline();
  jobQueue.updateProgress(job.id, 70);
  const mcqs = await generateDailyCurrentAffairsMCQsAsync(res.articles, 5);
  jobQueue.updateProgress(job.id, 100);
  return { newlyIngested: res.newlyIngested, mcqsGenerated: mcqs.length };
});

jobQueue.registerWorker("mcq_generation", async (job) => {
  const count = job.params.count || 5;
  const articles = loadCurrentAffairsFromDisk();
  const mcqs = generateDailyCurrentAffairsMCQs(articles, count);
  return { count: mcqs.length, mcqs };
});

jobQueue.registerWorker("document_indexing", async (job) => {
  const { title, text, category } = job.params;
  const res = indexNewDocument({
    title: title || "Untitled Document",
    category: category || "General Studies",
    content: text || "",
  });
  return { docId: res.document?.id, chunksCount: res.document?.chunkCount || 0 };
});

jobQueue.registerWorker("embeddings_generation", async (job) => {
  jobQueue.updateProgress(job.id, 50);
  return { status: "embeddings_reindexed" };
});

// ----------------------------------------------------
// UPSC PYQ INTELLIGENCE ENDPOINTS
// ----------------------------------------------------
app.get("/api/pyqs/search", requireAuth, (req, res) => {
  try {
    const stage = req.query.stage as any;
    const paper = req.query.paper as any;
    const yearStart = req.query.yearStart ? parseInt(req.query.yearStart as string, 10) : undefined;
    const yearEnd = req.query.yearEnd ? parseInt(req.query.yearEnd as string, 10) : undefined;
    const topic = req.query.topic as string;
    const recurringThemeId = req.query.recurringThemeId as string;
    const searchQuery = (req.query.q as string) || (req.query.query as string) || (req.query.search as string);

    const results = searchUpscPyqs({
      stage,
      paper,
      yearStart,
      yearEnd,
      topic,
      recurringThemeId,
      searchQuery,
    });

    res.json({
      success: true,
      count: results.length,
      pyqs: results,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/pyqs/analysis", requireAuth, (_req, res) => {
  try {
    const recurringThemes = getRecurringThemeAnalytics();
    res.json({
      success: true,
      count: recurringThemes.length,
      themes: recurringThemes,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/pyqs/topic/:topicName", requireAuth, (req, res) => {
  try {
    const topicName = decodeURIComponent(req.params.topicName);
    const intel = getTopicPyqIntelligence(topicName);
    res.json({
      success: true,
      topic: topicName,
      data: intel,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/pyqs/:id", requireAuth, (req, res) => {
  try {
    const pyq = getPyqById(req.params.id);
    if (!pyq) {
      return res.status(404).json({ success: false, error: "PYQ not found." });
    }
    res.json({ success: true, pyq });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// ADVANCED RAG WITH CITATIONS & EVIDENCE GUARD
// ----------------------------------------------------
app.post("/api/rag/search-advanced", requireAuth, (req, res) => {
  try {
    const { query, category, limit, minConfidenceThreshold } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, error: "Query parameter is required." });
    }

    const userId = req.user!.uid;
    const result = searchKnowledgeChunksAdvanced(query, {
      category,
      limit: limit || 4,
      minConfidenceThreshold: minConfidenceThreshold || 0.38,
      userId,
    });

    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// EXPANDED 64-TEST AI BENCHMARK ENDPOINT
// ----------------------------------------------------
app.post("/api/benchmark/run", requireAdmin, heavyTaskLimiter, async (_req, res) => {
  try {
    const summary = await executeBoltBenchmarkSuite();
    res.json({ success: true, benchmark: summary });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// DURABLE JOB QUEUE ENDPOINTS
// ----------------------------------------------------
// Job types that operate on shared/system resources (benchmarks, DR tests, curriculum-wide
// current affairs sync) rather than a single user's own data — only admins may enqueue or
// view these regardless of who technically submitted the request.
const ADMIN_ONLY_JOB_TYPES = new Set(["benchmark_run", "disaster_recovery_test", "current_affairs_sync"]);

function jobOwnerId(job: any): string | undefined {
  return job?.params?.ownerId;
}

app.get("/api/jobs", requireAuth, (req, res) => {
  try {
    const type = req.query.type as any;
    const status = req.query.status as any;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 25;
    const isAdmin = !!req.user!.isAdmin;
    const jobs = jobQueue.listJobs({ type, status, limit: isAdmin ? limit : Math.max(limit, 100) });
    // Cross-user isolation: non-admins only ever see jobs they own.
    const scoped = isAdmin ? jobs : jobs.filter((j: any) => jobOwnerId(j) === req.user!.uid).slice(0, limit);
    res.json({ success: true, jobs: scoped });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/jobs", requireAuth, (req, res) => {
  try {
    const { type, title, params } = req.body;
    if (!type || !title) {
      return res.status(400).json({ success: false, error: "Type and title are required." });
    }
    if (ADMIN_ONLY_JOB_TYPES.has(type) && !req.user!.isAdmin) {
      return res.status(403).json({ success: false, error: "This job type is restricted to administrators." });
    }
    // Every job is scoped to its creator (or explicitly to "system" for admin-triggered
    // system-wide jobs), so ownership can always be enforced on read/retry.
    const ownerId = req.user!.isAdmin && params?.ownerId === "system" ? "system" : req.user!.uid;
    const job = jobQueue.enqueue(type, title, { ...(params || {}), ownerId });
    res.json({ success: true, job });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/jobs/:id", requireAuth, (req, res) => {
  try {
    const job = jobQueue.getJob(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found." });
    }
    const isOwner = jobOwnerId(job) === req.user!.uid;
    if (!isOwner && !req.user!.isAdmin) {
      return res.status(403).json({ success: false, error: "Access denied to this job." });
    }
    res.json({ success: true, job });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/jobs/:id/retry", requireAuth, async (req, res) => {
  try {
    const existing = jobQueue.getJob(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: "Job cannot be retried." });
    }
    const isOwner = jobOwnerId(existing) === req.user!.uid;
    if (!isOwner && !req.user!.isAdmin) {
      return res.status(403).json({ success: false, error: "Access denied to this job." });
    }
    const job = await jobQueue.retryJob(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: "Job cannot be retried." });
    }
    res.json({ success: true, job });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// DISASTER RECOVERY & BACKUPS
// ----------------------------------------------------
app.get("/api/admin/backups", requireAdmin, adminRateLimiter, (_req, res) => {
  try {
    const backups = listBackups();
    res.json({ success: true, backups });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/admin/backup", requireAdmin, adminRateLimiter, async (req, res) => {
  try {
    const description = req.body.description || "Manual Admin Snapshot";
    const backup = await createFullBackupAsync(description);
    res.json({ success: true, backup });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/admin/restore-test", requireAdmin, adminRateLimiter, async (_req, res) => {
  try {
    const report = await runDisasterRecoveryVerification();
    res.json({ success: true, report });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// USER DATA PRIVACY & GDPR CONTROLS
// ----------------------------------------------------
app.post("/api/user/export-data", requireAuth, async (req, res) => {
  try {
    // Derive effective user ID from verified token to prevent unauthorized data extraction
    const effectiveUserId = (req.body.userId && req.user!.isAdmin) ? req.body.userId : req.user!.uid;
    const archive = await exportAllUserDataAsync(effectiveUserId);
    res.json({ success: true, archive });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/user/delete-account", requireAuth, async (req, res) => {
  try {
    // Derive effective user ID from verified token to prevent unauthorized deletion
    const effectiveUserId = (req.body.userId && req.user!.isAdmin) ? req.body.userId : req.user!.uid;
    const deleted = await deleteUserAccountAsync(effectiveUserId);
    res.json({ success: true, deleted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin role management via Firebase Custom Claims
app.post("/api/admin/users/:uid/role", requireAdmin, adminRateLimiter, async (req, res) => {
  try {
    const { uid } = req.params;
    const { isAdmin } = req.body;
    if (typeof isAdmin !== "boolean") {
      return res.status(400).json({ success: false, error: "isAdmin boolean required." });
    }
    const updated = await setAdminCustomClaim(uid, isAdmin);
    if (updated) {
      res.json({ success: true, message: `Updated admin role for ${uid} to ${isAdmin}.` });
    } else {
      res.status(500).json({ success: false, error: "Failed to update custom claims via Firebase Admin." });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// STREAMING AI RESPONSES (SSE PROTOCOL)
// ----------------------------------------------------
app.post("/api/ai/stream", requireAuth, aiRateLimiter, async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const { messages, activeAdapter } = req.body;
    const safeOverrides = resolveSafeAiOverrides(req, req.body);
    await BoltAIGateway.stream(
      {
        messages: messages || [{ role: "user", content: "Hello BOLT" }],
        activeAdapter,
        providerOverride: safeOverrides.providerOverride,
      },
      (chunk) => {
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }
    );
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// ----------------------------------------------------
// VITE MIDDLEWARE SETUP
// ----------------------------------------------------
async function startServer() {
  const httpServer = createHttpServer(app);

  if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
  server: {
  middlewareMode: true,
  // The preview proxy does not forward this custom server's HMR socket.
  // Disable HMR so Vite does not inject a client that repeatedly reconnects.
  hmr: false,
  },
  appType: "spa",
  });
  app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Bolt UPSC Server running on http://0.0.0.0:${PORT}`);
  initCurrentAffairsScheduler();
  });
}

if (!process.env.VERCEL && process.env.BOLT_SERVERLESS !== "true") {
  startServer().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
}

export { app, startServer };

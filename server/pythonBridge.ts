import { execFileSync } from "child_process";
import path from "path";
import fs from "fs";
import os from "os";
import { assertPythonAvailable } from "./runtimeEnv";

const ROOT_DIR = process.cwd();
const PYTHON_DIR = path.join(ROOT_DIR, "python");

/**
 * Execute 1855-2026 PYQ queries via python/bolt_pyqs.py
 */
export function executePyqs(options: {
  era?: string;
  peripheral?: boolean;
  currentAffairs?: boolean;
  search?: string;
}): { stats: any; count: number; questions: any[] } {
  assertPythonAvailable();
  const args = [path.join(PYTHON_DIR, "bolt_pyqs.py")];

  if (options.era && options.era !== "all") {
    args.push("--era", options.era);
  }
  if (options.peripheral) {
    args.push("--peripheral");
  }
  if (options.currentAffairs) {
    args.push("--current-affairs");
  }
  if (options.search && options.search.trim()) {
    args.push("--search", options.search.trim());
  }

  let questions: any[] = [];
  let count = 0;

  try {
    const rawOutput = execFileSync("python3", args, {
      cwd: ROOT_DIR,
      encoding: "utf-8",
      timeout: 10000,
    });
    const parsed = JSON.parse(rawOutput);
    questions = parsed.questions || [];
    count = parsed.count ?? questions.length;
  } catch (err: any) {
    console.error("Error executing bolt_pyqs.py:", err.message);
  }

  // Get statistics
  let stats: any = {};
  try {
    const statsOutput = execFileSync(
      "python3",
      [path.join(PYTHON_DIR, "bolt_pyqs.py"), "--stats"],
      { cwd: ROOT_DIR, encoding: "utf-8", timeout: 8000 }
    );
    stats = JSON.parse(statsOutput);
  } catch (err: any) {
    console.error("Error fetching PYQ stats:", err.message);
    stats = {
      totalQuestions: questions.length,
      yearSpan: "1855 - 2026",
      erasBreakdown: {},
      peripheralAreasCount: 0,
      currentAffairsCount: 0,
    };
  }

  return { stats, count, questions };
}

/**
 * Execute NCERT Chapter queries via python/bolt_ncert.py
 */
export function executeNcertChapters(
  subject?: string,
  classNum?: number
): { count: number; chapters: any[] } {
  assertPythonAvailable();
  const args = [path.join(PYTHON_DIR, "bolt_ncert.py")];

  if (subject && subject.toLowerCase() !== "all") {
    args.push("--subject", subject);
  }
  if (classNum && !isNaN(classNum)) {
    args.push("--class-num", String(classNum));
  }

  try {
    const rawOutput = execFileSync("python3", args, {
      cwd: ROOT_DIR,
      encoding: "utf-8",
      timeout: 10000,
    });
    const parsed = JSON.parse(rawOutput);
    return {
      count: parsed.count ?? (parsed.chapters?.length || 0),
      chapters: parsed.chapters || [],
    };
  } catch (err: any) {
    console.error("Error executing bolt_ncert.py chapters:", err.message);
    return { count: 0, chapters: [] };
  }
}

/**
 * Execute NCERT Chapter Quiz queries via python/bolt_ncert.py
 */
export function executeNcertQuiz(
  chapterId: string
): { chapterId: string; questions: any[] } {
  assertPythonAvailable();
  const args = [path.join(PYTHON_DIR, "bolt_ncert.py"), "--chapter-id", chapterId];

  try {
    const rawOutput = execFileSync("python3", args, {
      cwd: ROOT_DIR,
      encoding: "utf-8",
      timeout: 10000,
    });
    const parsed = JSON.parse(rawOutput);
    return {
      chapterId,
      questions: parsed.questions || [],
    };
  } catch (err: any) {
    console.error("Error executing bolt_ncert.py quiz:", err.message);
    return { chapterId, questions: [] };
  }
}

/**
 * Execute Study Material processing & Quiz generation via python/bolt_materials.py
 */
export function executeMaterialProcess(options: {
  text?: string;
  title?: string;
  questionsCount?: number;
  tempFilePath?: string;
}): any {
  assertPythonAvailable();
  const questionsCount = options.questionsCount || 5;
  let targetFile = options.tempFilePath;
  let createdTemp = false;

  try {
    if (!targetFile || !fs.existsSync(targetFile)) {
      if (options.text) {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "bolt-bridge-"));
        targetFile = path.join(tmpDir, `material_${Date.now()}.txt`);
        fs.writeFileSync(targetFile, options.text, "utf-8");
        createdTemp = true;
      }
    }

    if (targetFile && fs.existsSync(targetFile)) {
      const args = [
        path.join(PYTHON_DIR, "bolt_materials.py"),
        "--file",
        targetFile,
        "--questions",
        String(questionsCount),
      ];

      const rawOutput = execFileSync("python3", args, {
        cwd: ROOT_DIR,
        encoding: "utf-8",
        timeout: 15000,
      });

      return JSON.parse(rawOutput);
    } else {
      // Fallback demo material
      const args = [
        path.join(PYTHON_DIR, "bolt_materials.py"),
        "--demo",
        "--questions",
        String(questionsCount),
      ];
      const rawOutput = execFileSync("python3", args, {
        cwd: ROOT_DIR,
        encoding: "utf-8",
        timeout: 15000,
      });
      return JSON.parse(rawOutput);
    }
  } catch (err: any) {
    console.error("Error executing bolt_materials.py:", err.message);
    return {
      extracted: {
        filename: options.title || "study_material.txt",
        fileType: "TXT",
        wordCount: options.text ? options.text.split(/\s+/).length : 0,
        estimatedReadMinutes: 2,
        summary: options.text ? options.text.slice(0, 300) : "Study material processed.",
        detectedTags: ["Public Administration", "Polity & Governance"],
        peripheralAreas: ["Colonial Civil Service Evolution (1855-1947)"],
        gsPaperMapping: ["GS 2"],
      },
      questions: [],
    };
  } finally {
    if (createdTemp && targetFile && fs.existsSync(targetFile)) {
      try {
        fs.unlinkSync(targetFile);
        fs.rmdirSync(path.dirname(targetFile));
      } catch {}
    }
  }
}

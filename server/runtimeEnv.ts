import { spawnSync } from "child_process";

/**
 * Serverless hosts (Vercel, AWS Lambda) give functions a read-only or ephemeral
 * filesystem and no guarantee that two requests hit the same instance. Anything
 * that must survive has to live in Firestore, not in local files.
 */
export function isServerless(): boolean {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);
}

export class PythonUnavailableError extends Error {
  readonly code = "PYTHON_UNAVAILABLE";
  constructor(message?: string) {
    super(
      message ||
        "The Python engine is not available in this deployment. Python-backed features (PYQ database, NCERT, study-material processing, Python console) require a Python runtime or a separately deployed Python service."
    );
    this.name = "PythonUnavailableError";
  }
}

let pythonProbe: { available: boolean; version: string | null } | null = null;

/** Probe for a usable python3 once per process. Always false on serverless hosts. */
export function getPythonRuntime(): { available: boolean; version: string | null } {
  if (pythonProbe) return pythonProbe;
  if (isServerless() || process.env.BOLT_DISABLE_PYTHON === "1") {
    pythonProbe = { available: false, version: null };
    return pythonProbe;
  }
  try {
    const r = spawnSync("python3", ["--version"], { encoding: "utf-8", timeout: 5000 });
    const out = `${r.stdout || ""}${r.stderr || ""}`.trim();
    pythonProbe = r.status === 0 && !r.error ? { available: true, version: out || null } : { available: false, version: null };
  } catch {
    pythonProbe = { available: false, version: null };
  }
  return pythonProbe;
}

export function isPythonAvailable(): boolean {
  return getPythonRuntime().available;
}

export function assertPythonAvailable(): void {
  if (!isPythonAvailable()) throw new PythonUnavailableError();
}

/** Test hook. */
export function _resetPythonProbeForTests(): void {
  pythonProbe = null;
}

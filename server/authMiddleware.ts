import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { verifyFirebaseIdTokenSignature } from "./firebaseAdmin.js";

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  role: "admin" | "student" | "evaluator";
  isAdmin: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

const IS_PRODUCTION = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";

// The signing secret must come from the environment. The previous hardcoded fallback was public
// in the repository, so anyone could mint valid "bolt_" admin session tokens. In production with
// no secret configured, BOLT session tokens are disabled (Firebase auth keeps working).
const JWT_SECRET: string | null =
  process.env.BOLT_JWT_SECRET || (IS_PRODUCTION ? null : "bolt_dev_only_insecure_signing_key");
if (!JWT_SECRET) {
  console.error("[AUTH] BOLT_JWT_SECRET is not set; BOLT session tokens are disabled in production.");
}
const ADMIN_EMAILS = new Set([
  "mohamedunaiz001@gmail.com",
  "autumnr092006@gmail.com",
  "admin@bolt.internal",
  "admin@upsc-bolt.org",
]);

/**
 * Generate a signed session token for verified users
 */
export function generateSignedSessionToken(user: { uid: string; email?: string; role?: string }): string {
  if (!JWT_SECRET) {
    throw new Error("BOLT_JWT_SECRET is not configured; cannot issue session tokens.");
  }
  const payload = {
    uid: user.uid,
    email: user.email || "",
    role: user.role || (ADMIN_EMAILS.has(user.email || "") ? "admin" : "student"),
    isAdmin: user.role === "admin" || ADMIN_EMAILS.has(user.email || ""),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600, // 7 days
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(payloadB64)
    .digest("base64url");

  return `bolt_${payloadB64}.${signature}`;
}

/** Short-lived cache of verified Firebase tokens so we do not re-verify on every request. */
const verifiedFirebaseTokens = new Map<string, { user: AuthenticatedUser; expiresAt: number }>();
const FIREBASE_TOKEN_CACHE_MAX = 500;
const FIREBASE_TOKEN_CACHE_TTL_MS = 5 * 60 * 1000;

function verifyBoltSessionToken(cleanToken: string): AuthenticatedUser | null {
  if (!JWT_SECRET) return null;
  const parts = cleanToken.slice(5).split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, signature] = parts;

  const expectedSig = crypto.createHmac("sha256", JWT_SECRET).update(payloadB64).digest("base64url");
  const a = Buffer.from(signature);
  const b = Buffer.from(expectedSig);
  // timingSafeEqual throws on length mismatch, which would surface as a 500 for a bad token.
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8"));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null; // Expired
    return {
      uid: payload.uid,
      email: payload.email,
      role: payload.role || (payload.isAdmin ? "admin" : "student"),
      isAdmin: Boolean(payload.isAdmin || payload.role === "admin" || ADMIN_EMAILS.has(payload.email || "")),
    };
  } catch {
    return null;
  }
}

async function verifyFirebaseToken(cleanToken: string): Promise<AuthenticatedUser | null> {
  const cacheKey = crypto.createHash("sha256").update(cleanToken).digest("hex");
  const cached = verifiedFirebaseTokens.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.user;
  if (cached) verifiedFirebaseTokens.delete(cacheKey);

  const result = await verifyFirebaseIdTokenSignature(cleanToken);

  if (result.status === "valid") {
    // Email-based admin is only honoured for verified addresses.
    const isAdmin = Boolean(
      result.admin || (result.emailVerified && ADMIN_EMAILS.has((result.email || "").toLowerCase())),
    );
    const user: AuthenticatedUser = {
      uid: result.uid,
      email: result.email || "",
      role: isAdmin ? "admin" : "student",
      isAdmin,
    };
    if (verifiedFirebaseTokens.size >= FIREBASE_TOKEN_CACHE_MAX) {
      const oldest = verifiedFirebaseTokens.keys().next().value;
      if (oldest) verifiedFirebaseTokens.delete(oldest);
    }
    verifiedFirebaseTokens.set(cacheKey, {
      user,
      expiresAt: Math.min(result.exp * 1000, Date.now() + FIREBASE_TOKEN_CACHE_TTL_MS),
    });
    return user;
  }

  if (
    result.status === "unavailable" &&
    !IS_PRODUCTION &&
    process.env.BOLT_ALLOW_UNVERIFIED_FIREBASE_TOKENS === "true"
  ) {
    // Explicit local-development opt-in only (no Admin credentials available): accept an UNVERIFIED
    // payload so the app is usable offline. Never enabled implicitly, and never in production.
    try {
      const parts = cleanToken.split(".");
      if (parts.length !== 3) return null;
      const decoded = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
      if (!decoded.sub || !decoded.auth_time) return null;
      if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) return null;
      const email = decoded.email || "";
      const isAdmin = Boolean(decoded.admin === true || decoded.role === "admin" || ADMIN_EMAILS.has(email.toLowerCase()));
      return { uid: decoded.sub, email, role: isAdmin ? "admin" : "student", isAdmin };
    } catch {
      return null;
    }
  }

  // Invalid signature/claims, or Admin SDK unavailable in production: fail closed.
  return null;
}

/**
 * Verify a token string (BOLT signed session tokens, Firebase ID tokens, and test-harness tokens).
 * Firebase ID tokens are cryptographically verified; they are never trusted on shape alone.
 */
export async function verifyToken(token: string): Promise<AuthenticatedUser | null> {
  if (!token || typeof token !== "string") return null;

  const cleanToken = token.trim().replace(/^Bearer\s+/i, "");
  if (!cleanToken) return null;

  // 1. BOLT signed session token
  if (cleanToken.startsWith("bolt_")) {
    const user = verifyBoltSessionToken(cleanToken);
    if (user) return user;
  }

  // 2. Firebase ID token
  if (cleanToken.split(".").length === 3) {
    const user = await verifyFirebaseToken(cleanToken);
    if (user) return user;
  }

  // 3. Automated test / development tokens (CI, test runners, benchmark verification)
  if (process.env.NODE_ENV !== "production" || process.env.BOLT_ALLOW_TEST_TOKENS === "true") {
    if (cleanToken === "test-admin-token" || cleanToken.startsWith("admin-test-")) {
      return { uid: "admin_test_operator", email: "admin@bolt.internal", role: "admin", isAdmin: true };
    }
    if (cleanToken.startsWith("test-token-") || cleanToken.startsWith("test-user-")) {
      const uid = cleanToken.replace(/^test-(?:token|user)-/, "") || "test_student";
      return { uid, email: `${uid}@upsc-bolt.test`, role: "student", isAdmin: false };
    }
  }

  return null;
}

/**
 * Middleware: Extract and attach user without rejecting if token is missing
 */
export async function authenticateToken(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization || (req.headers["x-auth-token"] as string);
  if (authHeader) {
    try {
      const user = await verifyToken(authHeader);
      if (user) {
        req.user = user;
      }
    } catch (err) {
      console.warn("[AUTH] token verification error:", err instanceof Error ? err.message : err);
    }
  }
  next();
}

/**
 * Middleware: Require verified user authentication
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization || (req.headers["x-auth-token"] as string);

  if (!authHeader) {
    res.status(401).json({
      success: false,
      error: "Authentication required. Missing Bearer Authorization header.",
      code: "AUTH_REQUIRED",
    });
    return;
  }

  let user: AuthenticatedUser | null = null;
  try {
    user = await verifyToken(authHeader);
  } catch (err) {
    console.warn("[AUTH] token verification error:", err instanceof Error ? err.message : err);
  }
  if (!user) {
    res.status(401).json({
      success: false,
      error: "Invalid or expired authentication token.",
      code: "INVALID_TOKEN",
    });
    return;
  }

  req.user = user;
  next();
}

/**
 * Middleware: Require administrator role
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (!req.user || !req.user.isAdmin) {
      res.status(403).json({
        success: false,
        error: "Forbidden: Administrator privileges required.",
        code: "ADMIN_FORBIDDEN",
      });
      return;
    }
    next();
  });
}

/**
 * Middleware: Verify resource owner (or admin override)
 * Prevents User A from mutating or accessing User B's resources
 */
export function requireOwner(paramName: string = "userId") {
  return (req: Request, res: Response, next: NextFunction): void => {
    requireAuth(req, res, () => {
      if (!req.user) return;

      const targetUserId =
        req.params[paramName] ||
        (req.body && req.body[paramName]) ||
        (req.query && (req.query[paramName] as string));

      if (!targetUserId) {
        res.status(400).json({
          success: false,
          error: `Missing target ${paramName} parameter for owner verification.`,
          code: "MISSING_TARGET_USER",
        });
        return;
      }

      if (req.user.uid !== targetUserId && !req.user.isAdmin) {
        res.status(403).json({
          success: false,
          error: "Forbidden: Cannot access or modify another user's private resources.",
          code: "ACCESS_DENIED",
        });
        return;
      }

      next();
    });
  };
}

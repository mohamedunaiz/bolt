import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { getAuth } from "firebase-admin/auth";
import { initFirebaseAdmin } from "./firebaseAdmin";

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

const JWT_SECRET = process.env.BOLT_JWT_SECRET;
if (process.env.NODE_ENV === "production" && !JWT_SECRET) {
  throw new Error("BOLT_JWT_SECRET is required in production.");
}
const EFFECTIVE_JWT_SECRET = JWT_SECRET || "local-development-only-secret";
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
    .createHmac("sha256", EFFECTIVE_JWT_SECRET)
    .update(payloadB64)
    .digest("base64url");

  return `bolt_${payloadB64}.${signature}`;
}

/**
 * Verify a token string (Supports Firebase ID Tokens, BOLT Signed Session Tokens, and Test Harness Tokens)
 */
export function verifyLocalToken(token: string): AuthenticatedUser | null {
  if (!token || typeof token !== "string") return null;

  const cleanToken = token.trim().replace(/^Bearer\s+/i, "");
  if (!cleanToken) return null;

  // 1. Check BOLT signed session token
  if (cleanToken.startsWith("bolt_")) {
    const raw = cleanToken.slice(5);
    const parts = raw.split(".");
    if (parts.length === 2) {
      const [payloadB64, signature] = parts;
      const expectedSig = crypto
        .createHmac("sha256", EFFECTIVE_JWT_SECRET)
        .update(payloadB64)
        .digest("base64url");

      if (signature.length === expectedSig.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
        try {
          const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8"));
          if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
            return null; // Expired
          }
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
    }
  }

  // Automated Test / Development Tokens (for CI, test runners, and automated benchmark verification)
  if (process.env.NODE_ENV !== "production" || process.env.BOLT_ALLOW_TEST_TOKENS === "true") {
    if (cleanToken === "test-admin-token" || cleanToken.startsWith("admin-test-")) {
      return {
        uid: "admin_test_operator",
        email: "admin@bolt.internal",
        role: "admin",
        isAdmin: true,
      };
    }
    if (cleanToken.startsWith("test-token-") || cleanToken.startsWith("test-user-")) {
      const uid = cleanToken.replace(/^test-(?:token|user)-/, "") || "test_student";
      return {
        uid,
        email: `${uid}@upsc-bolt.test`,
        role: "student",
        isAdmin: false,
      };
    }
  }

  return null;
}

async function verifyToken(token: string): Promise<AuthenticatedUser | null> {
  const localUser = verifyLocalToken(token);
  if (localUser) return localUser;

  const cleanToken = token.trim().replace(/^Bearer\s+/i, "");
  if (cleanToken.split(".").length !== 3) return null;

  const app = initFirebaseAdmin();
  if (!app) return null;

  try {
    const decoded = await getAuth(app).verifyIdToken(cleanToken, true);
    const email = decoded.email || "";
    const isAdmin = Boolean(decoded.admin === true || decoded.role === "admin" || ADMIN_EMAILS.has(email.toLowerCase()));
    return { uid: decoded.uid, email, role: isAdmin ? "admin" : "student", isAdmin };
  } catch {
    return null;
  }
}

/**
 * Middleware: Extract and attach user without rejecting if token is missing
 */
export async function authenticateToken(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization || (req.headers["x-auth-token"] as string);
  if (authHeader) {
    const user = await verifyToken(authHeader);
    if (user) {
      req.user = user;
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

  const user = await verifyToken(authHeader);
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

async function authenticateRequest(req: Request): Promise<AuthenticatedUser | null> {
  const authHeader = req.headers.authorization || (req.headers["x-auth-token"] as string);
  if (!authHeader) return null;
  return verifyToken(authHeader);
}

/**
 * Middleware: Require administrator role
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const user = await authenticateRequest(req);
  if (!user) {
    res.status(401).json({ success: false, error: "Invalid or missing authentication token.", code: "INVALID_TOKEN" });
    return;
  }
  req.user = user;
  if (!user.isAdmin) {
    res.status(403).json({
      success: false,
      error: "Forbidden: Administrator privileges required.",
      code: "ADMIN_FORBIDDEN",
    });
    return;
  }
  next();
}

/**
 * Middleware: Verify resource owner (or admin override)
 * Prevents User A from mutating or accessing User B's resources
 */
export function requireOwner(paramName: string = "userId") {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = await authenticateRequest(req);
    if (!user) {
      res.status(401).json({ success: false, error: "Invalid or missing authentication token.", code: "INVALID_TOKEN" });
      return;
    }
    req.user = user;

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

    if (user.uid !== targetUserId && !user.isAdmin) {
      res.status(403).json({
        success: false,
        error: "Forbidden: Cannot access or modify another user's private resources.",
        code: "ACCESS_DENIED",
      });
      return;
    }

    next();
  };
}

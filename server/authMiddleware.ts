import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { getAuth } from "firebase-admin/auth";
import { getApps } from "firebase-admin/app";
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

const JWT_SECRET =
  process.env.BOLT_JWT_SECRET ||
  (process.env.NODE_ENV === "production" ? undefined : "bolt_dev_only_secret_change_me");
const ALLOW_TEST_TOKENS = process.env.NODE_ENV !== "production" || process.env.BOLT_ALLOW_TEST_TOKENS === "true";

function getStaticAdminEmails(): Set<string> {
  const configured = process.env.BOLT_ADMIN_EMAILS || "";
  return new Set(
    configured
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

/**
 * Generate a signed local-development session token for non-production use.
 */
export function generateSignedSessionToken(user: { uid: string; email?: string; role?: string }): string {
  if (!JWT_SECRET) {
    throw new Error("BOLT_JWT_SECRET is required to generate signed session tokens.");
  }

  const adminEmails = getStaticAdminEmails();
  const email = (user.email || "").toLowerCase();
  const payload = {
    uid: user.uid,
    email,
    role: user.role || (adminEmails.has(email) ? "admin" : "student"),
    isAdmin: user.role === "admin" || adminEmails.has(email),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(payloadB64).digest("base64url");
  return `bolt_${payloadB64}.${signature}`;
}

function verifySignedSessionToken(token: string): AuthenticatedUser | null {
  if (!JWT_SECRET || !token.startsWith("bolt_")) return null;
  const raw = token.slice(5);
  const parts = raw.split(".");
  if (parts.length !== 2) return null;

  const [payloadB64, signature] = parts;
  const expectedSig = crypto.createHmac("sha256", JWT_SECRET).update(payloadB64).digest("base64url");
  if (signature.length !== expectedSig.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8"));
    if (!payload?.uid) return null;
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    const email = typeof payload.email === "string" ? payload.email : "";
    return {
      uid: payload.uid,
      email,
      role: payload.role === "admin" ? "admin" : "student",
      isAdmin: payload.role === "admin" || payload.isAdmin === true,
    };
  } catch {
    return null;
  }
}

async function verifyFirebaseToken(token: string): Promise<AuthenticatedUser | null> {
  try {
    initFirebaseAdmin();
    if (getApps().length === 0) return null;
    const decoded = await getAuth().verifyIdToken(token, true);
    const email = (decoded.email || "").toLowerCase();
    const adminEmails = getStaticAdminEmails();
    const isAdmin = decoded.admin === true || decoded.role === "admin" || adminEmails.has(email);
    return {
      uid: decoded.uid,
      email: decoded.email,
      role: isAdmin ? "admin" : "student",
      isAdmin,
    };
  } catch {
    return null;
  }
}

async function verifyAuthHeader(authHeader: string): Promise<AuthenticatedUser | null> {
  const token = authHeader.trim().replace(/^Bearer\s+/i, "");
  if (!token) return null;

  const signed = verifySignedSessionToken(token);
  if (signed) return signed;

  const firebaseUser = await verifyFirebaseToken(token);
  if (firebaseUser) return firebaseUser;

  if (ALLOW_TEST_TOKENS) {
    if (token === "test-admin-token" || token.startsWith("admin-test-")) {
      return {
        uid: "admin_test_operator",
        email: "admin@bolt.internal",
        role: "admin",
        isAdmin: true,
      };
    }
    if (token.startsWith("test-token-") || token.startsWith("test-user-")) {
      const uid = token.replace(/^test-(?:token|user)-/, "") || "test_student";
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

export async function authenticateToken(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization || (req.headers["x-auth-token"] as string | undefined);
  if (authHeader) {
    const user = await verifyAuthHeader(authHeader);
    if (user) req.user = user;
  }
  next();
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization || (req.headers["x-auth-token"] as string | undefined);
  if (!authHeader) {
    res.status(401).json({
      success: false,
      error: "Authentication required.",
      code: "AUTH_REQUIRED",
    });
    return;
  }

  const user = await verifyAuthHeader(authHeader);
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

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  void requireAuth(req, res, () => {
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

export function requireOwner(paramName = "userId") {
  return (req: Request, res: Response, next: NextFunction): void => {
    void requireAuth(req, res, () => {
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

import { createRequire } from "node:module";
import type { Express } from "express";

// The build compiles server.ts to a private CommonJS bundle outside the public
// Vite output directory. includeFiles in vercel.json ensures the bundle is
// present in this function artifact; the original TypeScript source is not
// imported at runtime.
const require = createRequire(import.meta.url);
const { app } = require("../server-build/server.cjs") as { app: Express };

/**
 * Vercel Serverless Function Catch-All Handler.
 * Forward API requests to the shared Express app so authentication, Firebase,
 * RAG, current-affairs, and the existing route middleware remain authoritative.
 */
export default function handler(req: any, res: any) {
  if (req.query && req.query.path) {
    const rawPath = Array.isArray(req.query.path)
      ? req.query.path.join("/")
      : String(req.query.path);

    if (!req.url || req.url === "/" || req.url.includes("[...path]") || !req.url.includes(rawPath)) {
      try {
        const parsed = new URL(req.url || "/", "http://localhost");
        parsed.searchParams.delete("path");
        const qs = parsed.searchParams.toString();
        req.url = `/api/${rawPath}${qs ? `?${qs}` : ""}`;
      } catch {
        req.url = `/api/${rawPath}`;
      }
    }
  }

  if (typeof req.url === "string" && !req.url.startsWith("/api")) {
    req.url = `/api${req.url.startsWith("/") ? "" : "/"}${req.url}`;
  }

  return app(req, res);
}

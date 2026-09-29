import { app } from "../server.ts";

/**
 * Vercel Serverless Function Catch-All Handler.
 * Ensures all /api/* routes (including /api/news/*, /api/pyqs/*, etc.)
 * route seamlessly to Express in both Vercel production and local environments.
 */
export default function handler(req: any, res: any) {
  // If Vercel catch-all populated req.query.path
  if (req.query && req.query.path) {
    const rawPath = Array.isArray(req.query.path)
      ? req.query.path.join("/")
      : String(req.query.path);

    // If req.url is missing, root, or contains the literal catch-all token
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

  // Ensure leading /api prefix exists
  if (typeof req.url === "string" && !req.url.startsWith("/api")) {
    req.url = `/api${req.url.startsWith("/") ? "" : "/"}${req.url}`;
  }

  return app(req, res);
}


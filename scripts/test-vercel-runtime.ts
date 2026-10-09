import { createRequire } from "node:module";
import type { Express } from "express";
import express from "express";
import type { Server } from "node:http";

process.env.VERCEL = "1";

const require = createRequire(import.meta.url);
const bundle = require("../server-build/server.cjs") as { app?: Express; default?: { app?: Express } };
const app = bundle.app ?? bundle.default?.app;
if (!app) throw new Error("Compiled server bundle did not export the Express app.");

async function start(appToServe: Express): Promise<{ server: Server; baseUrl: string }> {
  const server = appToServe.listen(0, "127.0.0.1");
  await new Promise<void>((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Unable to get local test server address.");
  return { server, baseUrl: `http://127.0.0.1:${address.port}` };
}

async function stop(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
  console.log(`PASS: ${message}`);
}

async function main(): Promise<void> {
  const mainServer = await start(app);
  try {
    const liveResponse = await fetch(`${mainServer.baseUrl}/api/health/live`);
    const liveJson = await liveResponse.json() as { status?: string };
    assert(liveResponse.status === 200 && liveJson.status === "live", "/api/health/live returns HTTP 200 JSON");

    const healthResponse = await fetch(`${mainServer.baseUrl}/api/health`);
    const healthContentType = healthResponse.headers.get("content-type") || "";
    const healthJson = await healthResponse.json() as { status?: string };
    assert(healthContentType.includes("application/json") && typeof healthJson.status === "string",
      "/api/health runs without a module-loading crash");
  } finally {
    await stop(mainServer.server);
  }

  // Test the separately-deployed Vercel news function too, not only the Express route.
  const { default: dailyCurrentAffairsHandler } = await import("../api/news/daily-current-affairs.ts");
  const probe = express();
  probe.get("/api/news/daily-current-affairs", (req, res) => dailyCurrentAffairsHandler(req, res));
  const newsServer = await start(probe);
  try {
    const response = await fetch(`${newsServer.baseUrl}/api/news/daily-current-affairs`);
    const body = await response.json() as { success?: boolean; state?: string; articles?: unknown[]; mcqs?: unknown[] };
    assert(response.status === 200 && body.success === true && typeof body.state === "string"
      && Array.isArray(body.articles) && Array.isArray(body.mcqs),
      "/api/news/daily-current-affairs returns the documented JSON shape without an import crash");
  } finally {
    await stop(newsServer.server);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

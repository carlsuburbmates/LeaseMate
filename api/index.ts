/**
 * Vercel serverless function entry point.
 * Vercel's @vercel/node builder compiles this TypeScript file directly
 * and resolves all imports from the project source tree.
 */
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerJobRoutes } from "../server/_core/jobs";
import { registerStorageProxy } from "../server/_core/storageProxy";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import { registerStripeWebhook } from "../server/stripeWebhook";

const app = express();

// ⚠️ Stripe webhook MUST be registered BEFORE express.json()
registerStripeWebhook(app);
registerJobRoutes(app);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

registerStorageProxy(app);

// tRPC API
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// SPA fallback — all non-API routes return a simple message
// (static files are served by Vercel's CDN from outputDirectory)
app.get("*", (req, res) => {
  if (
    !req.path.startsWith("/api/") &&
    !req.path.startsWith("/manus-storage/") &&
    !req.path.startsWith("/storage/")
  ) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.status(404).json({ error: "API route not found" });
});

export default app;

/**
 * Vercel serverless function entry point.
 * Wraps the Express app for Vercel's Node.js runtime.
 */
import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { registerStorageProxy } from "../server/_core/storageProxy";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import { registerStripeWebhook } from "../server/stripeWebhook";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// ⚠️ Stripe webhook MUST be registered BEFORE express.json()
registerStripeWebhook(app);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

registerStorageProxy(app);
registerOAuthRoutes(app);

// tRPC API
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Serve static files from the Vite build output
const distPublic = path.resolve(__dirname, "../dist/public");
app.use(express.static(distPublic));

// SPA fallback — all non-API routes serve index.html
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.sendFile(path.join(distPublic, "index.html"));
});

export default app;

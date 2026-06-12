import express, { type Express, type Request, type Response } from "express";
import { Receiver } from "@upstash/qstash";
import { z } from "zod/v4";
import { ENV } from "./env";
import {
  INTERNAL_JOB_HEADER,
  runDailyStaleRequestCleanupTask,
  runPaymentDeadlineCheckTask,
  runProviderTimeoutCheckTask,
} from "../lib/qstash";

const jsonBodyParser = express.raw({ type: "*/*" });

const delayedInvitationJobSchema = z.object({
  taskId: z.number().int().positive(),
  invitationId: z.number().int().positive(),
});

const qstashReceiver =
  ENV.qstashCurrentSigningKey && ENV.qstashNextSigningKey
    ? new Receiver({
        currentSigningKey: ENV.qstashCurrentSigningKey,
        nextSigningKey: ENV.qstashNextSigningKey,
      })
    : null;

function readRawBody(req: Request): string {
  if (Buffer.isBuffer(req.body)) {
    return req.body.toString("utf8");
  }
  if (typeof req.body === "string") {
    return req.body;
  }
  return "";
}

function parseJsonBody<T>(req: Request, schema: z.ZodSchema<T>): T {
  const rawBody = readRawBody(req);
  const parsed = rawBody.length > 0 ? JSON.parse(rawBody) : {};
  return schema.parse(parsed);
}

async function authorizeQueuedJob(req: Request): Promise<void> {
  const jobSecret = req.header(INTERNAL_JOB_HEADER);
  if (ENV.internalJobSecret && jobSecret === ENV.internalJobSecret) {
    return;
  }

  const signature = req.header("upstash-signature");
  if (!signature || !qstashReceiver) {
    throw new Error("Unauthorized job request.");
  }

  await qstashReceiver.verify({
    body: readRawBody(req),
    signature,
    url: new URL(req.originalUrl, ENV.appUrl).toString(),
  });
}

function authorizeCronRequest(req: Request): boolean {
  if (!ENV.cronSecret) return false;
  return req.header("authorization") === `Bearer ${ENV.cronSecret}`;
}

function sendJobError(res: Response, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  res.status(400).json({ error: message });
}

export function registerJobRoutes(app: Express) {
  app.post("/api/jobs/provider-timeout", jsonBodyParser, async (req, res) => {
    try {
      await authorizeQueuedJob(req);
      const body = parseJsonBody(req, delayedInvitationJobSchema);
      const result = await runProviderTimeoutCheckTask(body.taskId, body.invitationId);
      res.status(200).json({ success: true, result });
    } catch (error) {
      sendJobError(res, error);
    }
  });

  app.post("/api/jobs/payment-deadline", jsonBodyParser, async (req, res) => {
    try {
      await authorizeQueuedJob(req);
      const body = parseJsonBody(req, delayedInvitationJobSchema);
      const result = await runPaymentDeadlineCheckTask(body.taskId, body.invitationId);
      res.status(200).json({ success: true, result });
    } catch (error) {
      sendJobError(res, error);
    }
  });

  app.get("/api/jobs/stale-request-cleanup", async (req, res) => {
    try {
      if (!authorizeCronRequest(req)) {
        throw new Error("Unauthorized cron request.");
      }
      await runDailyStaleRequestCleanupTask();
      res.status(200).json({ success: true });
    } catch (error) {
      sendJobError(res, error);
    }
  });

  app.post("/api/jobs/stale-request-cleanup", jsonBodyParser, async (req, res) => {
    try {
      await authorizeQueuedJob(req);
      await runDailyStaleRequestCleanupTask();
      res.status(200).json({ success: true });
    } catch (error) {
      sendJobError(res, error);
    }
  });
}

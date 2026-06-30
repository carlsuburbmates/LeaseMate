import express from "express";
import { Receiver } from "@upstash/qstash";
import { z } from "zod/v4";
import { ENV } from "./env.js";
import {
  INTERNAL_JOB_HEADER,
  runDailyStaleRequestCleanupTask,
  runPaymentDeadlineCheckTask,
  runProviderTimeoutCheckTask,
} from "../lib/qstash.js";

const jsonBodyParser = express.raw({ type: "*/*" });

type JobRequest = {
  body?: unknown;
  originalUrl: string;
  header: (name: string) => string | undefined;
};

type JobResponse = {
  status: (code: number) => JobResponse;
  json: (body: unknown) => void;
};

type JobRouteRegistrar = {
  get: (...args: any[]) => unknown;
  post: (...args: any[]) => unknown;
};

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

function readRawBody(req: JobRequest): string {
  if (Buffer.isBuffer(req.body)) {
    return req.body.toString("utf8");
  }
  if (typeof req.body === "string") {
    return req.body;
  }
  return "";
}

function parseJsonBody<T>(req: JobRequest, schema: z.ZodSchema<T>): T {
  const rawBody = readRawBody(req);
  const parsed = rawBody.length > 0 ? JSON.parse(rawBody) : {};
  return schema.parse(parsed);
}

async function authorizeQueuedJob(req: JobRequest): Promise<void> {
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

function authorizeCronRequest(req: JobRequest): boolean {
  if (!ENV.cronSecret) return false;
  return req.header("authorization") === `Bearer ${ENV.cronSecret}`;
}

function sendJobError(res: JobResponse, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  res.status(400).json({ error: message });
}

export function registerJobRoutes(app: JobRouteRegistrar) {
  app.post("/api/jobs/provider-timeout", jsonBodyParser, async (req: JobRequest, res: JobResponse) => {
    try {
      await authorizeQueuedJob(req);
      const body = parseJsonBody(req, delayedInvitationJobSchema);
      const result = await runProviderTimeoutCheckTask(body.taskId, body.invitationId);
      res.status(200).json({ success: true, result });
    } catch (error) {
      sendJobError(res, error);
    }
  });

  app.post("/api/jobs/payment-deadline", jsonBodyParser, async (req: JobRequest, res: JobResponse) => {
    try {
      await authorizeQueuedJob(req);
      const body = parseJsonBody(req, delayedInvitationJobSchema);
      const result = await runPaymentDeadlineCheckTask(body.taskId, body.invitationId);
      res.status(200).json({ success: true, result });
    } catch (error) {
      sendJobError(res, error);
    }
  });

  app.get("/api/jobs/stale-request-cleanup", async (req: JobRequest, res: JobResponse) => {
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

  app.post("/api/jobs/stale-request-cleanup", jsonBodyParser, async (req: JobRequest, res: JobResponse) => {
    try {
      await authorizeQueuedJob(req);
      await runDailyStaleRequestCleanupTask();
      res.status(200).json({ success: true });
    } catch (error) {
      sendJobError(res, error);
    }
  });
}

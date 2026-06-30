import { Client } from "@upstash/qstash";
import { and, eq, gte, lte } from "drizzle-orm";
import {
  createAuditEvent,
  createAutomationTask,
  createCustomerRelease,
  createException,
  getCustomerRelease,
  getDb,
  getExceptionById,
  getFeeByInvitation,
  getInvitationById,
  getMoveRequestById,
  getMoveRequestItemById,
  updateAutomationTask,
  updateIntroductionFee,
  updateInvitation,
  updateProviderProfile,
} from "../db.js";
import { ENV } from "../_core/env.js";
import { notifyOwner } from "../_core/notification.js";
import {
  customerReleases,
  exceptions,
  moveRequestItems,
  moveRequests,
  providerProfiles,
  providerTimeoutLog,
} from "../../drizzle/schema.js";
import { evaluateProviderApproval } from "./providerApproval.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_TIMEOUT_MS = 2_147_483_647;
const JOB_SECRET_HEADER = "x-leasemate-job-secret";
const localTimers = new Map<number, NodeJS.Timeout>();
const qstashClient = ENV.qstashToken ? new Client({ token: ENV.qstashToken }) : null;

export const BASE_URL = ENV.appUrl;
export const INTERNAL_JOB_HEADER = JOB_SECRET_HEADER;

type TaskRunnerResult = Record<string, unknown>;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function canUseRemoteScheduler() {
  return Boolean(qstashClient && ENV.appUrl && ENV.internalJobSecret);
}

function getJobUrl(path: string) {
  return new URL(path, ENV.appUrl).toString();
}

function encodeDelay(seconds: number) {
  return `${Math.max(0, Math.floor(seconds))}s` as `${bigint}s`;
}

async function publishDelayedJob(path: string, body: Record<string, unknown>, delaySeconds: number) {
  if (!qstashClient) {
    throw new Error("QStash client is not configured.");
  }

  const response = await qstashClient.publishJSON({
    url: getJobUrl(path),
    body,
    delay: encodeDelay(delaySeconds),
    headers: {
      [JOB_SECRET_HEADER]: ENV.internalJobSecret,
    },
  });

  const published = response as { messageId?: string | null };
  return published.messageId ?? null;
}

async function findOpenException(code: typeof exceptions.$inferInsert.code, entityType: string, entityId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(exceptions)
    .where(
      and(
        eq(exceptions.code, code),
        eq(exceptions.status, "open"),
        eq(exceptions.entityType, entityType),
        eq(exceptions.entityId, entityId)
      )
    )
    .limit(1);
  return result[0];
}

async function createOpenException(input: typeof exceptions.$inferInsert) {
  const entityType = input.entityType ?? "unknown";
  const entityId = input.entityId ?? 0;
  const existing = await findOpenException(input.code, entityType, entityId);
  if (existing) return existing.id;
  const result = await createException(input);
  return Number((result as any).insertId);
}

async function runTask(taskId: number, runner: () => Promise<TaskRunnerResult>) {
  await updateAutomationTask(taskId, {
    status: "running",
    startedAt: new Date(),
    attemptCount: 1,
    errorMessage: null,
  });

  try {
    const result = await runner();
    await updateAutomationTask(taskId, {
      status: "completed",
      result,
      completedAt: new Date(),
      errorMessage: null,
    });
    return result;
  } catch (error) {
    const message = getErrorMessage(error);
    await updateAutomationTask(taskId, {
      status: "failed",
      completedAt: new Date(),
      errorMessage: message,
      result: { ok: false, message },
    });
    throw error;
  } finally {
    const timer = localTimers.get(taskId);
    if (timer) {
      clearTimeout(timer);
      localTimers.delete(taskId);
    }
  }
}

async function processProviderTimeout(invitationId: number): Promise<TaskRunnerResult> {
  const invitation = await getInvitationById(invitationId);
  if (!invitation) {
    return { ok: true, skipped: true, reason: "invitation_missing" };
  }
  if (invitation.status !== "pending") {
    return { ok: true, skipped: true, reason: `invitation_${invitation.status}` };
  }

  const item = await getMoveRequestItemById(invitation.moveRequestItemId);
  const request = item ? await getMoveRequestById(item.moveRequestId) : undefined;
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  await updateInvitation(invitationId, {
    status: "expired",
    respondedAt: new Date(),
  });

  await db.insert(providerTimeoutLog).values({
    providerId: invitation.providerId,
    invitationId,
  });

  await db
    .update(moveRequestItems)
    .set({ status: "exception" })
    .where(eq(moveRequestItems.id, invitation.moveRequestItemId));

  const exceptionId = await createOpenException({
    code: "EX-03",
    severity: "warning",
    affectedParty: "Customer",
    entityType: "provider_invitation",
    entityId: invitationId,
    moveRequestId: item?.moveRequestId,
    providerId: invitation.providerId,
    customerId: request?.customerId,
    description: `Provider invitation #${invitationId} expired after 48 hours without a response.`,
    status: "open",
  });

  await createAuditEvent({
    eventType: "automation.provider_timeout",
    entityType: "provider_invitation",
    entityId: invitationId,
    actorType: "system",
    actorId: null,
    description: `Invitation #${invitationId} auto-expired after provider timeout.`,
    metadata: { exceptionId },
  });

  await checkProviderAutoPause(invitation.providerId);
  await notifyOwner({
    title: "LeaseMate: Provider timeout",
    content: `Invitation #${invitationId} timed out and was marked expired.`,
  }).catch(() => {});

  return { ok: true, invitationId, exceptionId };
}

async function processPaymentDeadline(invitationId: number): Promise<TaskRunnerResult> {
  const invitation = await getInvitationById(invitationId);
  if (!invitation) {
    return { ok: true, skipped: true, reason: "invitation_missing" };
  }
  if (invitation.status !== "accepted") {
    return { ok: true, skipped: true, reason: `invitation_${invitation.status}` };
  }

  const fee = await getFeeByInvitation(invitationId);
  if (fee?.status === "paid") {
    return { ok: true, skipped: true, reason: "fee_paid" };
  }

  const item = await getMoveRequestItemById(invitation.moveRequestItemId);
  const request = item ? await getMoveRequestById(item.moveRequestId) : undefined;
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  if (fee && fee.status === "pending") {
    await updateIntroductionFee(fee.id, {
      status: "overdue",
      overdueAt: new Date(),
    });
  }

  await db
    .update(moveRequestItems)
    .set({ status: "exception" })
    .where(eq(moveRequestItems.id, invitation.moveRequestItemId));

  const exceptionCode = fee ? "EX-06" : "EX-05";
  const exceptionId = await createOpenException({
    code: exceptionCode,
    severity: exceptionCode === "EX-05" ? "critical" : "warning",
    affectedParty: exceptionCode === "EX-05" ? "Customer + Platform" : "Platform + Customer",
    entityType: "provider_invitation",
    entityId: invitationId,
    moveRequestId: item?.moveRequestId,
    providerId: invitation.providerId,
    customerId: request?.customerId,
    description:
      exceptionCode === "EX-05"
        ? `Provider accepted invitation #${invitationId} but did not pay the introduction fee within 24 hours.`
        : `Introduction fee for invitation #${invitationId} is overdue after 24 hours.`,
    status: "open",
  });

  await createAuditEvent({
    eventType: "automation.payment_deadline_missed",
    entityType: "provider_invitation",
    entityId: invitationId,
    actorType: "system",
    actorId: null,
    description: `Invitation #${invitationId} missed the introduction fee deadline.`,
    metadata: { exceptionId, exceptionCode },
  });

  if (exceptionCode === "EX-05") {
    await notifyOperatorCriticalException(exceptionId);
  } else {
    await notifyOwner({
      title: "LeaseMate: Payment overdue",
      content: `Invitation #${invitationId} is still unpaid 24 hours after acceptance.`,
    }).catch(() => {});
  }

  return { ok: true, invitationId, exceptionId, exceptionCode };
}

async function processCustomerDetailsRelease(invitationId: number): Promise<TaskRunnerResult> {
  const invitation = await getInvitationById(invitationId);
  if (!invitation) {
    return { ok: true, skipped: true, reason: "invitation_missing" };
  }

  const fee = await getFeeByInvitation(invitationId);
  if (!fee || fee.status !== "paid") {
    return { ok: true, skipped: true, reason: "fee_not_paid" };
  }

  const item = await getMoveRequestItemById(invitation.moveRequestItemId);
  const request = item ? await getMoveRequestById(item.moveRequestId) : undefined;
  if (!item || !request) {
    const exceptionId = await createOpenException({
      code: "EX-09",
      severity: "critical",
      affectedParty: "Provider + Customer",
      entityType: "provider_invitation",
      entityId: invitationId,
      moveRequestId: item?.moveRequestId,
      providerId: invitation.providerId,
      customerId: request?.customerId,
      description: `Customer detail release failed for invitation #${invitationId}: related request data is missing.`,
      status: "open",
    });
    await notifyOperatorCriticalException(exceptionId);
    throw new Error("Unable to release customer details: request context missing.");
  }

  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const existingRelease = await getCustomerRelease(fee.id);
  if (existingRelease?.status === "released") {
    return { ok: true, skipped: true, reason: "already_released" };
  }

  if (existingRelease) {
    await db
      .update(customerReleases)
      .set({ status: "released", releasedAt: new Date() })
      .where(eq(customerReleases.id, existingRelease.id));
  } else {
    await createCustomerRelease({
      introductionFeeId: fee.id,
      moveRequestItemId: invitation.moveRequestItemId,
      providerId: invitation.providerId,
      customerId: request.customerId,
      status: "released",
      releasedAt: new Date(),
    });
  }

  await db
    .update(moveRequestItems)
    .set({ status: "details_released" })
    .where(eq(moveRequestItems.id, invitation.moveRequestItemId));

  await createAuditEvent({
    eventType: "automation.customer_details_released",
    entityType: "provider_invitation",
    entityId: invitationId,
    actorType: "system",
    actorId: null,
    description: `Customer details released for invitation #${invitationId}.`,
    metadata: { introductionFeeId: fee.id },
  });

  return { ok: true, invitationId, introductionFeeId: fee.id };
}

async function processCriticalExceptionNotification(exceptionId: number): Promise<TaskRunnerResult> {
  const exception = await getExceptionById(exceptionId);
  if (!exception) {
    return { ok: true, skipped: true, reason: "exception_missing" };
  }
  if (exception.severity !== "critical") {
    return { ok: true, skipped: true, reason: "not_critical" };
  }

  await notifyOwner({
    title: `LeaseMate: Critical exception ${exception.code}`,
    content: `${exception.description}\n\nException #${exception.id} is open and requires review.`,
  }).catch(() => {});

  await createAuditEvent({
    eventType: "exception.critical_notified",
    entityType: "exception",
    entityId: exceptionId,
    actorType: "system",
    actorId: null,
    description: `Owner notification sent for critical exception #${exceptionId}.`,
  });

  return { ok: true, exceptionId };
}

async function processDailyStaleRequestCleanup(): Promise<TaskRunnerResult> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const cutoff = new Date(Date.now() - 7 * DAY_MS);
  const staleDrafts = await db
    .select()
    .from(moveRequests)
    .where(and(eq(moveRequests.status, "draft"), lte(moveRequests.createdAt, cutoff)));

  if (staleDrafts.length === 0) {
    return { ok: true, cancelledCount: 0 };
  }

  await db
    .update(moveRequests)
    .set({ status: "cancelled" })
    .where(and(eq(moveRequests.status, "draft"), lte(moveRequests.createdAt, cutoff)));

  await Promise.all(
    staleDrafts.map((request) =>
      createAuditEvent({
        eventType: "automation.stale_request_cancelled",
        entityType: "move_request",
        entityId: request.id,
        actorType: "system",
        actorId: null,
        description: `Draft request #${request.id} auto-cancelled after 7 days of inactivity.`,
      })
    )
  );

  return { ok: true, cancelledCount: staleDrafts.length };
}

async function scheduleTrackedTask(params: {
  jobType: string;
  entityType: string;
  entityId: number;
  payload: Record<string, unknown>;
  delaySeconds: number;
  path: string;
  runner: () => Promise<TaskRunnerResult>;
}) {
  const scheduledAt = new Date(Date.now() + params.delaySeconds * 1000);
  const insertResult = await createAutomationTask({
    jobType: params.jobType,
    entityType: params.entityType,
    entityId: params.entityId,
    payload: params.payload,
    status: "scheduled",
    scheduledAt,
  });
  const taskId = Number((insertResult as any).insertId);

  if (canUseRemoteScheduler()) {
    try {
      const remoteMessageId = await publishDelayedJob(
        params.path,
        { taskId, ...params.payload },
        params.delaySeconds
      );
      await updateAutomationTask(taskId, {
        result: { delivery: "qstash", messageId: remoteMessageId },
      });
      return { taskId, scheduledAt, remoteMessageId };
    } catch (error) {
      await updateAutomationTask(taskId, {
        result: {
          delivery: "local_fallback",
          schedulerError: getErrorMessage(error),
        },
      });
      console.warn(`[Automation] Failed to publish ${params.jobType} to QStash, falling back to local timer.`, error);
    }
  }

  const delayMs = Math.min(
    Math.max(0, scheduledAt.getTime() - Date.now()),
    MAX_TIMEOUT_MS
  );

  const timer = setTimeout(() => {
    runTask(taskId, params.runner).catch((error) => {
      console.error(`[Automation] ${params.jobType} failed:`, error);
    });
  }, delayMs);

  localTimers.set(taskId, timer);
  return { taskId, scheduledAt, remoteMessageId: null };
}

async function runImmediateTrackedTask(params: {
  jobType: string;
  entityType: string;
  entityId: number;
  payload: Record<string, unknown>;
  runner: () => Promise<TaskRunnerResult>;
}) {
  const scheduledAt = new Date();
  const insertResult = await createAutomationTask({
    jobType: params.jobType,
    entityType: params.entityType,
    entityId: params.entityId,
    payload: params.payload,
    status: "scheduled",
    scheduledAt,
  });
  const taskId = Number((insertResult as any).insertId);
  return runTask(taskId, params.runner);
}

export async function scheduleProviderTimeoutCheck(
  invitationId: number,
  delaySeconds = 172800
): Promise<void> {
  await scheduleTrackedTask({
    jobType: "provider_timeout_check",
    entityType: "provider_invitation",
    entityId: invitationId,
    payload: { invitationId },
    delaySeconds,
    path: "/api/jobs/provider-timeout",
    runner: () => processProviderTimeout(invitationId),
  });
}

export async function runProviderTimeoutCheckTask(taskId: number, invitationId: number) {
  return runTask(taskId, () => processProviderTimeout(invitationId));
}

export async function schedulePaymentDeadlineCheck(
  invitationId: number,
  delaySeconds = 86400
): Promise<void> {
  await scheduleTrackedTask({
    jobType: "payment_deadline_check",
    entityType: "provider_invitation",
    entityId: invitationId,
    payload: { invitationId },
    delaySeconds,
    path: "/api/jobs/payment-deadline",
    runner: () => processPaymentDeadline(invitationId),
  });
}

export async function runPaymentDeadlineCheckTask(taskId: number, invitationId: number) {
  return runTask(taskId, () => processPaymentDeadline(invitationId));
}

export async function triggerCustomerDetailsRelease(invitationId: number): Promise<void> {
  await runImmediateTrackedTask({
    jobType: "customer_details_release",
    entityType: "provider_invitation",
    entityId: invitationId,
    payload: { invitationId },
    runner: () => processCustomerDetailsRelease(invitationId),
  });
}

export async function triggerProviderApprovalEvaluation(providerId: number): Promise<void> {
  await runImmediateTrackedTask({
    jobType: "provider_approval_evaluation",
    entityType: "provider_profile",
    entityId: providerId,
    payload: { providerId },
    runner: () => evaluateProviderApproval(providerId),
  });
}

export async function checkProviderAutoPause(providerId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const since = new Date(Date.now() - 30 * DAY_MS);
  const timeoutRows = await db
    .select()
    .from(providerTimeoutLog)
    .where(and(eq(providerTimeoutLog.providerId, providerId), gte(providerTimeoutLog.timedOutAt, since)));

  const profile = (
    await db
      .select()
      .from(providerProfiles)
      .where(eq(providerProfiles.id, providerId))
      .limit(1)
  )[0];

  if (!profile) return;

  await updateProviderProfile(providerId, {
    timeoutCount30Days: timeoutRows.length,
    lastTimeoutAt: new Date(),
  });

  if (timeoutRows.length < 2 || profile.status === "paused") return;

  await updateProviderProfile(providerId, {
    status: "paused",
    pauseReason: "Automatically paused after 2 provider timeouts within 30 days.",
  });

  await createAuditEvent({
    eventType: "provider.auto_paused",
    entityType: "provider_profile",
    entityId: providerId,
    actorType: "system",
    actorId: null,
    description: `Provider #${providerId} auto-paused after ${timeoutRows.length} timeouts in 30 days.`,
  });

  await notifyOwner({
    title: "LeaseMate: Provider auto-paused",
    content: `Provider #${providerId} was auto-paused after ${timeoutRows.length} timeouts in 30 days.`,
  }).catch(() => {});
}

export async function notifyOperatorCriticalException(exceptionId: number): Promise<void> {
  await runImmediateTrackedTask({
    jobType: "critical_exception_notification",
    entityType: "exception",
    entityId: exceptionId,
    payload: { exceptionId },
    runner: () => processCriticalExceptionNotification(exceptionId),
  });
}

export async function scheduleDailyStaleRequestCleanup(): Promise<void> {
  await runImmediateTrackedTask({
    jobType: "daily_stale_request_cleanup",
    entityType: "move_request",
    entityId: 0,
    payload: {},
    runner: processDailyStaleRequestCleanup,
  });
}

export async function runDailyStaleRequestCleanupTask() {
  return scheduleDailyStaleRequestCleanup();
}

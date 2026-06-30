import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";
import { ENV } from "../_core/env.js";
import { notifyOwner } from "../_core/notification.js";
import { router } from "../_core/trpc.js";
import {
  createAuditEvent,
  createException,
  flagUser,
  getAllProviders,
  getAllExceptions,
  getAllMoveRequests,
  getAuditEvents,
  getAutomationTasks,
  getCriticalOpenExceptions,
  getExceptionById,
  getFeeByInvitation,
  getMoveRequestById,
  getMoveRequestItems,
  getOpenExceptions,
  getOpsDashboardStats,
  getRecentAuditEvents,
  getServiceCategories,
  getUserById,
  pauseProvider,
  updateException,
  updateIntroductionFee,
  updateMoveRequest,
  updateProviderProfile,
} from "../db.js";
import {
  notifyOperatorCriticalException,
  triggerProviderApprovalEvaluation,
} from "../lib/qstash.js";
import { sendProviderRefundApproved } from "../lib/resend.js";
import {
  EXCEPTION_CODES,
  EXCEPTION_META,
  operatorProcedure,
} from "./shared.js";

export const opsRouter = router({
  dashboard: operatorProcedure.query(() => getOpsDashboardStats()),

  allRequests: operatorProcedure
    .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
    .query(({ input }) => getAllMoveRequests(input.limit, input.offset)),

  requestDetail: operatorProcedure
    .input(z.object({ requestId: z.number() }))
    .query(async ({ input }) => {
      const request = await getMoveRequestById(input.requestId);
      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const items = await getMoveRequestItems(input.requestId);
      const categories = await getServiceCategories();
      const categoryById = new Map(
        categories.map((category) => [category.id, category]),
      );

      return {
        ...request,
        items: items.map((item) => ({
          ...item,
          categoryName: categoryById.get(item.categoryId)?.name ?? null,
        })),
      };
    }),

  updateRequestStatus: operatorProcedure
    .input(
      z.object({
        requestId: z.number(),
        status: z.enum([
          "submitted",
          "in_progress",
          "partially_fulfilled",
          "fulfilled",
          "cancelled",
        ]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await updateMoveRequest(input.requestId, { status: input.status });
      await createAuditEvent({
        eventType: "move_request.status_updated",
        entityType: "move_request",
        entityId: input.requestId,
        actorType: "operator",
        actorId: ctx.user.id,
        description: `Operator updated status to ${input.status}`,
      });
      return { success: true };
    }),

  openExceptions: operatorProcedure.query(() => getOpenExceptions()),
  allExceptions: operatorProcedure
    .input(z.object({ limit: z.number().default(100) }))
    .query(({ input }) => getAllExceptions(input.limit)),
  criticalExceptions: operatorProcedure.query(() => getCriticalOpenExceptions()),

  exceptionDetail: operatorProcedure
    .input(z.object({ exceptionId: z.number() }))
    .query(async ({ input }) => {
      const exception = await getExceptionById(input.exceptionId);
      if (!exception) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const meta = EXCEPTION_META[exception.code];
      const audit = await getAuditEvents(
        exception.entityType ?? "exception",
        exception.entityId ?? exception.id,
      );

      return { ...exception, meta, audit };
    }),

  resolveException: operatorProcedure
    .input(
      z.object({
        exceptionId: z.number(),
        notes: z.string().optional(),
        action: z.enum(["resolved", "dismissed"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await updateException(input.exceptionId, {
        status: input.action,
        operatorNotes: input.notes,
        resolvedBy: ctx.user.id,
        resolvedAt: new Date(),
      });

      await createAuditEvent({
        eventType: `exception.${input.action}`,
        entityType: "exception",
        entityId: input.exceptionId,
        actorType: "operator",
        actorId: ctx.user.id,
        description: `Operator ${input.action} exception #${input.exceptionId}. Notes: ${input.notes ?? "none"}`,
      });

      return { success: true };
    }),

  approveRefund: operatorProcedure
    .input(
      z.object({
        exceptionId: z.number(),
        invitationId: z.number(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const fee = await getFeeByInvitation(input.invitationId);
      if (!fee) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await updateIntroductionFee(fee.id, {
        status: "refunded",
        refundedAt: new Date(),
      });

      const { getCustomerRelease } = await import("../db.js");
      const release = await getCustomerRelease(fee.id);
      if (release?.customerId) {
        await flagUser(
          release.customerId,
          "Flagged by operator after provider refund dispute.",
        );
      }

      await updateException(input.exceptionId, {
        status: "resolved",
        operatorNotes: input.notes,
        resolvedBy: ctx.user.id,
        resolvedAt: new Date(),
      });

      await createAuditEvent({
        eventType: "refund.approved",
        entityType: "introduction_fee",
        entityId: fee.id,
        actorType: "operator",
        actorId: ctx.user.id,
        description: `Operator approved refund for fee #${fee.id}. ${input.notes ?? ""}`,
      });

      const providerUser = await getUserById(fee.providerId);
      if (providerUser?.email) {
        sendProviderRefundApproved({
          providerName: providerUser.name ?? "Provider",
          providerEmail: providerUser.email,
          invitationId: input.invitationId,
          serviceCategory: "Introduction Fee",
          suburb: "",
          refundAmount: `$${parseFloat(fee.amount).toFixed(2)}`,
          refundReason: input.notes ?? "Approved by operator.",
          billingUrl: `${ENV.appUrl}/provider/billing`,
        }).catch(() => {});
      }

      return { success: true };
    }),

  rejectRefund: operatorProcedure
    .input(z.object({ exceptionId: z.number(), reason: z.string().min(5) }))
    .mutation(async ({ ctx, input }) => {
      await updateException(input.exceptionId, {
        status: "dismissed",
        operatorNotes: input.reason,
        resolvedBy: ctx.user.id,
        resolvedAt: new Date(),
      });

      await createAuditEvent({
        eventType: "refund.rejected",
        entityType: "exception",
        entityId: input.exceptionId,
        actorType: "operator",
        actorId: ctx.user.id,
        description: `Operator rejected refund request. Reason: ${input.reason}`,
      });

      return { success: true };
    }),

  pauseProvider: operatorProcedure
    .input(z.object({ providerId: z.number(), reason: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await pauseProvider(input.providerId, input.reason);
      await createAuditEvent({
        eventType: "provider.paused",
        entityType: "provider_profile",
        entityId: input.providerId,
        actorType: "operator",
        actorId: ctx.user.id,
        description: `Operator paused provider #${input.providerId}: ${input.reason}`,
      });
      return { success: true };
    }),

  reactivateProvider: operatorProcedure
    .input(z.object({ providerId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await updateProviderProfile(input.providerId, {
        status: "active",
        pauseReason: null,
      });
      await createAuditEvent({
        eventType: "provider.reactivated",
        entityType: "provider_profile",
        entityId: input.providerId,
        actorType: "operator",
        actorId: ctx.user.id,
        description: `Operator reactivated provider #${input.providerId}`,
      });
      return { success: true };
    }),

  approveProvider: operatorProcedure
    .input(
      z.object({
        providerId: z.number(),
        reason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await updateProviderProfile(input.providerId, {
        status: "active",
        approvalMode: "manual",
        eligibilityStatus: "eligible",
        approvedAt: new Date(),
        approvedBy: ctx.user.id,
        approvalReason:
          input.reason?.trim() ||
          "Manually approved by an operator.",
        rejectionReason: null,
      });

      await createAuditEvent({
        eventType: "provider.manually_approved",
        entityType: "provider_profile",
        entityId: input.providerId,
        actorType: "operator",
        actorId: ctx.user.id,
        description: `Operator manually approved provider #${input.providerId}.`,
      });

      return { success: true };
    }),

  rejectProvider: operatorProcedure
    .input(
      z.object({
        providerId: z.number(),
        reason: z.string().min(5),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await updateProviderProfile(input.providerId, {
        status: "pending",
        approvalMode: "manual",
        eligibilityStatus: "needs_review",
        approvedAt: null,
        approvedBy: null,
        autoApprovedAt: null,
        approvalReason: null,
        rejectionReason: input.reason.trim(),
      });

      await createAuditEvent({
        eventType: "provider.manually_rejected",
        entityType: "provider_profile",
        entityId: input.providerId,
        actorType: "operator",
        actorId: ctx.user.id,
        description: `Operator manually held provider #${input.providerId}: ${input.reason.trim()}`,
      });

      return { success: true };
    }),

  reevaluateProviderApproval: operatorProcedure
    .input(z.object({ providerId: z.number() }))
    .mutation(async ({ input }) => {
      await triggerProviderApprovalEvaluation(input.providerId);
      return { success: true };
    }),

  allProviders: operatorProcedure.query(() => getAllProviders()),

  auditLog: operatorProcedure
    .input(
      z.object({
        entityType: z.string().optional(),
        entityId: z.number().optional(),
        limit: z.number().default(50),
      }),
    )
    .query(async ({ input }) => {
      if (input.entityType && input.entityId) {
        return getAuditEvents(input.entityType, input.entityId);
      }

      return getRecentAuditEvents(input.limit);
    }),

  automationTasks: operatorProcedure.query(() => getAutomationTasks()),

  systemHealth: operatorProcedure.query(async () => {
    const stats = await getOpsDashboardStats();
    return {
      status: (stats?.criticalExceptions ?? 0) > 0 ? "degraded" : "healthy",
      stats,
      timestamp: new Date().toISOString(),
    };
  }),

  createManualException: operatorProcedure
    .input(
      z.object({
        code: z.enum(EXCEPTION_CODES),
        description: z.string().min(5),
        moveRequestId: z.number().optional(),
        providerId: z.number().optional(),
        customerId: z.number().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const meta = EXCEPTION_META[input.code];
      const result = await createException({
        ...input,
        severity: meta.severity,
        affectedParty: meta.affectedParty,
        entityType: "manual",
        entityId: 0,
        status: "open",
      });

      if (meta.severity === "critical") {
        await notifyOperatorCriticalException(Number((result as any).insertId));
      }

      await notifyOwner({
        title: `Exception Created: ${input.code}`,
        content: `Operator created ${input.code} (${meta.name}): ${input.description}`,
      });

      return { id: Number((result as any).insertId) };
    }),
});

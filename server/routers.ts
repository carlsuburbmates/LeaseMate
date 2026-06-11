import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";
import {
  getAllSuburbs,
  searchSuburbs,
  getServiceCategories,
  getProductsByCategory,
  getProductsByProvider,
  createProduct,
  updateProduct,
  deleteProduct,
  getProviderProfile,
  getProviderProfileById,
  createProviderProfile,
  updateProviderProfile,
  pauseProvider,
  getActiveProviders,
  getMoveRequestsByCustomer,
  getMoveRequestById,
  createMoveRequest,
  updateMoveRequest,
  getMoveRequestItems,
  getAllMoveRequests,
  getInvitationsByProvider,
  getInvitationById,
  updateInvitation,
  getFeeByInvitation,
  updateIntroductionFee,
  getProviderBillingHistory,
  getOpenExceptions,
  getAllExceptions,
  getExceptionById,
  createException,
  updateException,
  getCriticalOpenExceptions,
  createAuditEvent,
  getAuditEvents,
  getRecentAuditEvents,
  getAutomationTasks,
  updateAutomationTask,
  getOpsDashboardStats,
  flagUser,
  setUserRole,
  getUserById,
  getMoveRequestItemById,
  getCustomerRelease,
  getUserById as getUserForRelease,
  createMoveRequestItem,
} from "./db";
import { notifyOwner } from "./_core/notification";

// ─── Role guards ──────────────────────────────────────────────────────────

const customerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!["customer", "admin", "operator"].includes(ctx.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Customer access required." });
  }
  return next({ ctx });
});

const providerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!["provider", "admin", "operator"].includes(ctx.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Provider access required." });
  }
  return next({ ctx });
});

const operatorProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!["admin", "operator"].includes(ctx.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Operator access required." });
  }
  return next({ ctx });
});

// ─── Customer-safe status labels ──────────────────────────────────────────

const CUSTOMER_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  in_progress: "In Progress",
  partially_fulfilled: "Partially Arranged",
  fulfilled: "All Arranged",
  cancelled: "Cancelled",
  pending_match: "Finding Providers",
  invitation_sent: "Contacting Providers",
  provider_accepted: "Provider Confirmed",
  details_released: "Provider Assigned",
  all_declined: "Seeking Alternatives",
  exception: "Under Review",
};

// ─── Exception metadata ───────────────────────────────────────────────────

const EXCEPTION_META: Record<string, { name: string; affectedParty: string; severity: "critical" | "warning" | "informational"; prevention: string; resolution: string }> = {
  "EX-01": { name: "No Provider Matched", affectedParty: "Customer", severity: "critical", prevention: "Block intake if fewer than 3 active providers in category/zone. Do not go live without minimum supply.", resolution: "Manually assign a provider or mark the item unfulfillable and notify the customer." },
  "EX-02": { name: "Provider Declined", affectedParty: "Customer (indirect)", severity: "informational", prevention: "Route only to active providers below their weekly cap. Use availability toggle.", resolution: "Confirm backup invitation fired. Escalate to EX-07 if no backup exists." },
  "EX-03": { name: "Provider Timeout", affectedParty: "Customer", severity: "warning", prevention: "Auto-pause providers with 2+ timeouts in 30 days. SLA enforcement transfers to provider.", resolution: "Confirm backup invitation fired. Manually invite backup if automation missed it." },
  "EX-04": { name: "All Providers Declined", affectedParty: "Customer", severity: "critical", prevention: "Maintain minimum 3 active providers per category/zone. Monitor decline rates.", resolution: "Manually find and assign an alternative provider. Notify customer if none available." },
  "EX-05": { name: "Provider Accepted But Unpaid", affectedParty: "Customer + Platform", severity: "critical", prevention: "Require Stripe card on provider onboarding. Charge automatically on acceptance.", resolution: "Send final payment reminder. Cancel acceptance and reroute to backup if still unpaid after 24h." },
  "EX-06": { name: "Payment Overdue", affectedParty: "Platform + Customer", severity: "warning", prevention: "Auto-charge on acceptance. No manual payment step required.", resolution: "Confirm reminder sent. Monitor. Escalates to EX-05 if unpaid after 24h." },
  "EX-07": { name: "Customer Needs More Options", affectedParty: "Customer", severity: "warning", prevention: "Maintain minimum supply. Monitor provider availability before routing.", resolution: "Manually assign alternative provider or notify customer and offer to modify request." },
  "EX-08": { name: "Automation Failed", affectedParty: "Customer + Platform", severity: "critical", prevention: "QStash retries handle transient failures silently. Alert only on persistent failure.", resolution: "Retry the failed job. Manually perform the step if retry fails. Investigate if systemic." },
  "EX-09": { name: "Customer Release Failed", affectedParty: "Provider + Customer", severity: "critical", prevention: "Use atomic transaction: payment and release in a single operation.", resolution: "Manually trigger customer detail release from Billing Queue. Investigate if it fails again." },
  "EX-10": { name: "Data Issue", affectedParty: "Customer or Provider", severity: "warning", prevention: "Enforce suburb dropdowns, phone format checks, and mandatory fields at intake and onboarding.", resolution: "Identify the bad field. Correct it. Resume workflow manually." },
  "EX-11": { name: "Manual Review Required", affectedParty: "Operator", severity: "warning", prevention: "Reduce via clear automation rules. These are genuine edge cases.", resolution: "Review timeline. Make judgment call. Document decision in operator notes." },
  "EX-12": { name: "Communication Failure", affectedParty: "Provider or Customer", severity: "warning", prevention: "Resend delivery webhooks auto-retry. Verify email at onboarding.", resolution: "Manually resend the failed email. Flag as EX-10 if address is invalid." },
  "EX-13": { name: "Provider Refund Request", affectedParty: "Provider + Customer", severity: "warning", prevention: "Require 3 documented contact attempts before Flag Issue button activates.", resolution: "Verify claim against audit log. Approve refund + flag customer account, or reject with explanation." },
};

// ─── Routers ──────────────────────────────────────────────────────────────

const referenceRouter = router({
  suburbs: publicProcedure.query(() => getAllSuburbs()),
  searchSuburbs: publicProcedure.input(z.object({ query: z.string() })).query(({ input }) => searchSuburbs(input.query)),
  categories: publicProcedure.query(() => getServiceCategories()),
  productsByCategory: publicProcedure.input(z.object({ categoryId: z.number() })).query(({ input }) => getProductsByCategory(input.categoryId)),
  exceptionMeta: operatorProcedure.query(() => EXCEPTION_META),
});

const intakeRouter = router({
  createRequest: customerProcedure
    .input(z.object({
      propertyAddress: z.string().min(5),
      propertySuburb: z.string().min(2),
      propertyPostcode: z.string().optional(),
      propertyType: z.enum(["apartment", "house", "townhouse", "studio", "other"]),
      bedrooms: z.number().int().min(0).max(20),
      bathrooms: z.number().int().min(0).max(20),
      accessNotes: z.string().optional(),
      moveOutDate: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await createMoveRequest({
        customerId: ctx.user.id,
        propertyAddress: input.propertyAddress,
        propertySuburb: input.propertySuburb,
        propertyPostcode: input.propertyPostcode,
        propertyType: input.propertyType,
        bedrooms: input.bedrooms,
        bathrooms: input.bathrooms,
        accessNotes: input.accessNotes,
        moveOutDate: input.moveOutDate ? new Date(input.moveOutDate) : undefined,
        status: "draft",
      });
      await createAuditEvent({ eventType: "move_request.created", entityType: "move_request", entityId: Number((result as any).insertId), actorType: "customer", actorId: ctx.user.id, description: `Customer created move request for ${input.propertySuburb}` });
      return { id: Number((result as any).insertId) };
    }),

  submitRequest: customerProcedure
    .input(z.object({ requestId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const req = await getMoveRequestById(input.requestId);
      if (!req || req.customerId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
      await updateMoveRequest(input.requestId, { status: "submitted", submittedAt: new Date() });
      await createAuditEvent({ eventType: "move_request.submitted", entityType: "move_request", entityId: input.requestId, actorType: "customer", actorId: ctx.user.id, description: "Customer submitted move request" });
      await notifyOwner({ title: "New Cart Submission", content: `Move request #${input.requestId} submitted by customer ${ctx.user.name ?? ctx.user.email}` });
      return { success: true };
    }),

  myRequests: customerProcedure.query(async ({ ctx }) => {
    const requests = await getMoveRequestsByCustomer(ctx.user.id);
    return requests.map(r => ({
      ...r,
      statusLabel: CUSTOMER_STATUS_LABELS[r.status] ?? r.status,
    }));
  }),

  requestDetail: customerProcedure
    .input(z.object({ requestId: z.number() }))
    .query(async ({ ctx, input }) => {
      const req = await getMoveRequestById(input.requestId);
      if (!req || req.customerId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
      const items = await getMoveRequestItems(input.requestId);
      return {
        ...req,
        statusLabel: CUSTOMER_STATUS_LABELS[req.status] ?? req.status,
        items: items.map(i => ({ ...i, statusLabel: CUSTOMER_STATUS_LABELS[i.status] ?? i.status })),
      };
    }),

  addCartItem: customerProcedure
    .input(z.object({
      requestId: z.number(),
      categoryId: z.number(),
      productId: z.number().optional(),
      position: z.enum(["preferred", "backup"]).default("preferred"),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const req = await getMoveRequestById(input.requestId);
      if (!req || req.customerId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
      if (req.status !== "draft") throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot modify a submitted request." });
      const result = await createMoveRequestItem({
        moveRequestId: input.requestId,
        categoryId: input.categoryId,
        productId: input.productId,
        position: input.position,
        customerNotes: input.notes ?? null,
        status: "pending_match",
      });
      await createAuditEvent({ eventType: "cart_item.added", entityType: "move_request", entityId: input.requestId, actorType: "customer", actorId: ctx.user.id, description: `Customer added ${input.position} provider for category ${input.categoryId}` });
      return { id: Number((result as any).insertId) };
    }),

  cancelRequest: customerProcedure
    .input(z.object({ requestId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const req = await getMoveRequestById(input.requestId);
      if (!req || req.customerId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
      if (req.status === "fulfilled") throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot cancel a fulfilled request." });
      await updateMoveRequest(input.requestId, { status: "cancelled" });
      await createAuditEvent({ eventType: "move_request.cancelled", entityType: "move_request", entityId: input.requestId, actorType: "customer", actorId: ctx.user.id, description: "Customer cancelled move request" });
      return { success: true };
    }),
});

const providerRouter = router({
  myProfile: providerProcedure.query(async ({ ctx }) => {
    return getProviderProfile(ctx.user.id);
  }),

  createProfile: protectedProcedure
    .input(z.object({
      businessName: z.string().min(2),
      abn: z.string().optional(),
      phone: z.string().optional(),
      contactEmail: z.string().email().optional(),
      suburb: z.string().optional(),
      maxJobsPerWeek: z.number().int().min(1).max(100).default(10),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await getProviderProfile(ctx.user.id);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Provider profile already exists." });
      const result = await createProviderProfile({ userId: ctx.user.id, ...input });
      await setUserRole(ctx.user.id, "provider");
      await createAuditEvent({ eventType: "provider.registered", entityType: "provider_profile", entityId: Number((result as any).insertId), actorType: "provider", actorId: ctx.user.id, description: `Provider registered: ${input.businessName}` });
      return { id: Number((result as any).insertId) };
    }),

  updateProfile: providerProcedure
    .input(z.object({
      businessName: z.string().min(2).optional(),
      abn: z.string().optional(),
      phone: z.string().optional(),
      contactEmail: z.string().email().optional(),
      suburb: z.string().optional(),
      maxJobsPerWeek: z.number().int().min(1).max(100).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const profile = await getProviderProfile(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "NOT_FOUND" });
      await updateProviderProfile(profile.id, input);
      return { success: true };
    }),

  myProducts: providerProcedure.query(async ({ ctx }) => {
    const profile = await getProviderProfile(ctx.user.id);
    if (!profile) return [];
    return getProductsByProvider(profile.id);
  }),

  addProduct: providerProcedure
    .input(z.object({
      categoryId: z.number(),
      title: z.string().min(2),
      description: z.string().optional(),
      priceType: z.enum(["fixed", "hourly", "quote"]),
      priceAmount: z.string().optional(),
      priceLabel: z.string().optional(),
      coverageZones: z.array(z.string()).default([]),
      propertyTypes: z.array(z.string()).default([]),
      maxBedrooms: z.number().optional(),
      introductionFee: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const profile = await getProviderProfile(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Provider profile required." });
      const result = await createProduct({ ...input, providerId: profile.id });
      return { id: Number((result as any).insertId) };
    }),

  updateProduct: providerProcedure
    .input(z.object({ productId: z.number(), data: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      priceType: z.enum(["fixed", "hourly", "quote"]).optional(),
      priceAmount: z.string().optional(),
      priceLabel: z.string().optional(),
      isActive: z.boolean().optional(),
    }) }))
    .mutation(async ({ ctx, input }) => {
      await updateProduct(input.productId, input.data);
      return { success: true };
    }),

  deleteProduct: providerProcedure
    .input(z.object({ productId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteProduct(input.productId);
      return { success: true };
    }),

  myOpportunities: providerProcedure.query(async ({ ctx }) => {
    const profile = await getProviderProfile(ctx.user.id);
    if (!profile) return [];
    const invitations = await getInvitationsByProvider(profile.id);
    // Hard business rule: mask full address until introduction fee is paid and customer_release exists
    const result = await Promise.all(invitations.map(async (inv) => {
      // Get the move request item to find the move request
      const item = await getMoveRequestItemById(inv.moveRequestItemId);
      const moveRequest = item ? await getMoveRequestById(item.moveRequestId) : null;
      // Check payment and release status
      const fee = await getFeeByInvitation(inv.id);
      const release = fee?.status === "paid" ? await getCustomerRelease(fee.id) : null;
      const addressReleased = release !== null && release !== undefined && release.status === "released";
      // Get customer contact info only if address is released
      const customer = addressReleased && moveRequest ? await getUserForRelease(moveRequest.customerId) : null;
      return {
        id: inv.id,
        moveRequestItemId: inv.moveRequestItemId,
        status: inv.status,
        invitedAt: inv.invitedAt,
        expiresAt: inv.expiresAt,
        respondedAt: inv.respondedAt,
        declineReason: inv.declineReason,
        // Pre-payment: suburb and basic property info only
        propertySuburb: moveRequest?.propertySuburb ?? null,
        propertyType: moveRequest?.propertyType ?? null,
        bedrooms: moveRequest?.bedrooms ?? null,
        bathrooms: moveRequest?.bathrooms ?? null,
        moveOutDate: moveRequest?.moveOutDate ?? null,
        // Full address and contact ONLY released after payment confirmed
        propertyAddress: addressReleased ? moveRequest?.propertyAddress ?? null : null,
        accessNotes: addressReleased ? moveRequest?.accessNotes ?? null : null,
      customerPhone: addressReleased ? customer?.email ?? null : null, // users table has no phone column; email used as contact fallback
      customerEmail: addressReleased ? customer?.email ?? null : null,
        customerName: addressReleased ? customer?.name ?? null : null,
        addressReleased,
        feeStatus: fee?.status ?? null,
        feeAmount: fee?.amount ?? null,
      };
    }));
    return result;
  }),

  acceptOpportunity: providerProcedure
    .input(z.object({ invitationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const inv = await getInvitationById(input.invitationId);
      if (!inv) throw new TRPCError({ code: "NOT_FOUND" });
      const profile = await getProviderProfile(ctx.user.id);
      if (!profile || inv.providerId !== profile.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (inv.status !== "pending") throw new TRPCError({ code: "BAD_REQUEST", message: "Invitation is no longer pending." });
      await updateInvitation(input.invitationId, { status: "accepted", respondedAt: new Date() });
      await createAuditEvent({ eventType: "invitation.accepted", entityType: "provider_invitation", entityId: input.invitationId, actorType: "provider", actorId: ctx.user.id, description: `Provider ${profile.businessName} accepted invitation #${input.invitationId}` });
      return { success: true };
    }),

  declineOpportunity: providerProcedure
    .input(z.object({ invitationId: z.number(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const inv = await getInvitationById(input.invitationId);
      if (!inv) throw new TRPCError({ code: "NOT_FOUND" });
      const profile = await getProviderProfile(ctx.user.id);
      if (!profile || inv.providerId !== profile.id) throw new TRPCError({ code: "FORBIDDEN" });
      await updateInvitation(input.invitationId, { status: "declined", respondedAt: new Date(), declineReason: input.reason });
      await createAuditEvent({ eventType: "invitation.declined", entityType: "provider_invitation", entityId: input.invitationId, actorType: "provider", actorId: ctx.user.id, description: `Provider declined invitation #${input.invitationId}` });
      return { success: true };
    }),

  billingHistory: providerProcedure.query(async ({ ctx }) => {
    const profile = await getProviderProfile(ctx.user.id);
    if (!profile) return [];
    return getProviderBillingHistory(profile.id);
  }),

  flagJob: providerProcedure
    .input(z.object({ invitationId: z.number(), reason: z.string().min(10), contactAttempts: z.number().int().min(3, "You must log at least 3 contact attempts before flagging a job.") }))
    .mutation(async ({ ctx, input }) => {
      const inv = await getInvitationById(input.invitationId);
      if (!inv) throw new TRPCError({ code: "NOT_FOUND" });
      const profile = await getProviderProfile(ctx.user.id);
      if (!profile || inv.providerId !== profile.id) throw new TRPCError({ code: "FORBIDDEN" });
      // Business rule: must have paid the introduction fee
      const fee = await getFeeByInvitation(input.invitationId);
      if (!fee || fee.status !== "paid") throw new TRPCError({ code: "BAD_REQUEST", message: "You can only flag a job after paying the introduction fee." });
      // Business rule: 7-day window from payment date
      if (fee.paidAt) {
        const daysSincePaid = (Date.now() - new Date(fee.paidAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSincePaid > 7) throw new TRPCError({ code: "BAD_REQUEST", message: "The 7-day refund window has expired." });
      }
      // Business rule: minimum 3 contact attempts required (enforced server-side)
      if (input.contactAttempts < 3) throw new TRPCError({ code: "BAD_REQUEST", message: "You must log at least 3 contact attempts before flagging a job." });
      await createException({
        code: "EX-13",
        severity: "warning",
        affectedParty: "Provider + Customer",
        entityType: "provider_invitation",
        entityId: input.invitationId,
        providerId: profile.id,
        description: `Provider ${profile.businessName} flagged job: ${input.reason}`,
        status: "open",
      });
      await notifyOwner({ title: "Provider Refund Request (EX-13)", content: `Provider ${profile.businessName} flagged invitation #${input.invitationId}: ${input.reason}` });
      return { success: true };
    }),
});

const opsRouter = router({
  dashboard: operatorProcedure.query(() => getOpsDashboardStats()),

  allRequests: operatorProcedure
    .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
    .query(({ input }) => getAllMoveRequests(input.limit, input.offset)),

  requestDetail: operatorProcedure
    .input(z.object({ requestId: z.number() }))
    .query(async ({ input }) => {
      const req = await getMoveRequestById(input.requestId);
      if (!req) throw new TRPCError({ code: "NOT_FOUND" });
      const items = await getMoveRequestItems(input.requestId);
      return { ...req, items };
    }),

  updateRequestStatus: operatorProcedure
    .input(z.object({ requestId: z.number(), status: z.enum(["submitted", "in_progress", "partially_fulfilled", "fulfilled", "cancelled"]) }))
    .mutation(async ({ ctx, input }) => {
      await updateMoveRequest(input.requestId, { status: input.status });
      await createAuditEvent({ eventType: "move_request.status_updated", entityType: "move_request", entityId: input.requestId, actorType: "operator", actorId: ctx.user.id, description: `Operator updated status to ${input.status}` });
      return { success: true };
    }),

  openExceptions: operatorProcedure.query(() => getOpenExceptions()),
  allExceptions: operatorProcedure.input(z.object({ limit: z.number().default(100) })).query(({ input }) => getAllExceptions(input.limit)),
  criticalExceptions: operatorProcedure.query(() => getCriticalOpenExceptions()),

  exceptionDetail: operatorProcedure
    .input(z.object({ exceptionId: z.number() }))
    .query(async ({ input }) => {
      const ex = await getExceptionById(input.exceptionId);
      if (!ex) throw new TRPCError({ code: "NOT_FOUND" });
      const meta = EXCEPTION_META[ex.code];
      const audit = await getAuditEvents(ex.entityType ?? "exception", ex.entityId ?? ex.id);
      return { ...ex, meta, audit };
    }),

  resolveException: operatorProcedure
    .input(z.object({ exceptionId: z.number(), notes: z.string().optional(), action: z.enum(["resolved", "dismissed"]) }))
    .mutation(async ({ ctx, input }) => {
      await updateException(input.exceptionId, { status: input.action, operatorNotes: input.notes, resolvedBy: ctx.user.id, resolvedAt: new Date() });
      await createAuditEvent({ eventType: `exception.${input.action}`, entityType: "exception", entityId: input.exceptionId, actorType: "operator", actorId: ctx.user.id, description: `Operator ${input.action} exception #${input.exceptionId}. Notes: ${input.notes ?? "none"}` });
      return { success: true };
    }),

  approveRefund: operatorProcedure
    .input(z.object({ exceptionId: z.number(), invitationId: z.number(), notes: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const fee = await getFeeByInvitation(input.invitationId);
      if (!fee) throw new TRPCError({ code: "NOT_FOUND" });
      // Mark fee as refunded (Stripe refund is a placeholder until Stripe is live)
      await updateIntroductionFee(fee.id, { status: "refunded", refundedAt: new Date() });
      // Flag the customer
      const release = await (async () => {
        const { getCustomerRelease } = await import("./db");
        return getCustomerRelease(fee.id);
      })();
      if (release?.customerId) {
        await flagUser(release.customerId, "Flagged by operator after provider refund dispute.");
      }
      await updateException(input.exceptionId, { status: "resolved", operatorNotes: input.notes, resolvedBy: ctx.user.id, resolvedAt: new Date() });
      await createAuditEvent({ eventType: "refund.approved", entityType: "introduction_fee", entityId: fee.id, actorType: "operator", actorId: ctx.user.id, description: `Operator approved refund for fee #${fee.id}. ${input.notes ?? ""}` });
      return { success: true };
    }),

  rejectRefund: operatorProcedure
    .input(z.object({ exceptionId: z.number(), reason: z.string().min(5) }))
    .mutation(async ({ ctx, input }) => {
      await updateException(input.exceptionId, { status: "dismissed", operatorNotes: input.reason, resolvedBy: ctx.user.id, resolvedAt: new Date() });
      await createAuditEvent({ eventType: "refund.rejected", entityType: "exception", entityId: input.exceptionId, actorType: "operator", actorId: ctx.user.id, description: `Operator rejected refund request. Reason: ${input.reason}` });
      return { success: true };
    }),

  pauseProvider: operatorProcedure
    .input(z.object({ providerId: z.number(), reason: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await pauseProvider(input.providerId, input.reason);
      await createAuditEvent({ eventType: "provider.paused", entityType: "provider_profile", entityId: input.providerId, actorType: "operator", actorId: ctx.user.id, description: `Operator paused provider #${input.providerId}: ${input.reason}` });
      return { success: true };
    }),

  reactivateProvider: operatorProcedure
    .input(z.object({ providerId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { updateProviderProfile } = await import("./db");
      await updateProviderProfile(input.providerId, { status: "active", pauseReason: null });
      await createAuditEvent({ eventType: "provider.reactivated", entityType: "provider_profile", entityId: input.providerId, actorType: "operator", actorId: ctx.user.id, description: `Operator reactivated provider #${input.providerId}` });
      return { success: true };
    }),

  allProviders: operatorProcedure.query(() => getActiveProviders()),

  auditLog: operatorProcedure
    .input(z.object({ entityType: z.string().optional(), entityId: z.number().optional(), limit: z.number().default(50) }))
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
    .input(z.object({
      code: z.enum(["EX-01","EX-02","EX-03","EX-04","EX-05","EX-06","EX-07","EX-08","EX-09","EX-10","EX-11","EX-12","EX-13"]),
      description: z.string().min(5),
      moveRequestId: z.number().optional(),
      providerId: z.number().optional(),
      customerId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const meta = EXCEPTION_META[input.code];
      const result = await createException({
        ...input,
        severity: meta.severity,
        affectedParty: meta.affectedParty,
        entityType: "manual",
        entityId: 0,
        status: "open",
      });
      await notifyOwner({ title: `Exception Created: ${input.code}`, content: `Operator created ${input.code} (${meta.name}): ${input.description}` });
      return { id: Number((result as any).insertId) };
    }),
});

// ─── App Router ───────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  reference: referenceRouter,
  intake: intakeRouter,
  provider: providerRouter,
  ops: opsRouter,
});

export type AppRouter = typeof appRouter;

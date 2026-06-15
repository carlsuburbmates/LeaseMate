import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createAuditEvent,
  createException,
  createProduct,
  createProviderProfile,
  deleteProduct,
  getCustomerRelease,
  getFeeByInvitation,
  getInvitationById,
  getInvitationsByProvider,
  getMoveRequestById,
  getMoveRequestItemById,
  getProductsByProvider,
  getProviderBillingHistory,
  getProviderProfile,
  getServiceCategories,
  getUserById,
  pauseProvider,
  setUserRole,
  updateInvitation,
  updateProduct,
  updateProviderProfile,
} from "../db";
import { notifyOwner } from "../_core/notification";
import { createIntroductionFeeCheckout } from "../lib/stripe";
import { schedulePaymentDeadlineCheck } from "../lib/qstash";
import { sendProviderRefundApproved } from "../lib/resend";
import { ENV } from "../_core/env";
import { providerProcedure } from "./shared";

export const providerRouter = router({
  myProfile: providerProcedure.query(async ({ ctx }) => {
    return getProviderProfile(ctx.user.id);
  }),

  createProfile: protectedProcedure
    .input(
      z.object({
        businessName: z.string().min(2),
        abn: z.string().optional(),
        phone: z.string().optional(),
        contactEmail: z.string().email().optional(),
        suburb: z.string().optional(),
        maxJobsPerWeek: z.number().int().min(1).max(100).default(10),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await getProviderProfile(ctx.user.id);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Provider profile already exists.",
        });
      }

      const result = await createProviderProfile({ userId: ctx.user.id, ...input });
      await setUserRole(ctx.user.id, "provider");

      await createAuditEvent({
        eventType: "provider.registered",
        entityType: "provider_profile",
        entityId: Number((result as any).insertId),
        actorType: "provider",
        actorId: ctx.user.id,
        description: `Provider registered: ${input.businessName}`,
      });

      return { id: Number((result as any).insertId) };
    }),

  updateProfile: providerProcedure
    .input(
      z.object({
        businessName: z.string().min(2).optional(),
        abn: z.string().optional(),
        phone: z.string().optional(),
        contactEmail: z.string().email().optional(),
        suburb: z.string().optional(),
        maxJobsPerWeek: z.number().int().min(1).max(100).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const profile = await getProviderProfile(ctx.user.id);
      if (!profile) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await updateProviderProfile(profile.id, input);
      return { success: true };
    }),

  myProducts: providerProcedure.query(async ({ ctx }) => {
    const profile = await getProviderProfile(ctx.user.id);
    if (!profile) return [];
    return getProductsByProvider(profile.id);
  }),

  addProduct: providerProcedure
    .input(
      z.object({
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
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const profile = await getProviderProfile(ctx.user.id);
      if (!profile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Provider profile required.",
        });
      }

      const result = await createProduct({ ...input, providerId: profile.id });
      return { id: Number((result as any).insertId) };
    }),

  updateProduct: providerProcedure
    .input(
      z.object({
        productId: z.number(),
        data: z.object({
          title: z.string().optional(),
          description: z.string().optional(),
          priceType: z.enum(["fixed", "hourly", "quote"]).optional(),
          priceAmount: z.string().optional(),
          priceLabel: z.string().optional(),
          isActive: z.boolean().optional(),
        }),
      }),
    )
    .mutation(async ({ input }) => {
      await updateProduct(input.productId, input.data);
      return { success: true };
    }),

  deleteProduct: providerProcedure
    .input(z.object({ productId: z.number() }))
    .mutation(async ({ input }) => {
      await deleteProduct(input.productId);
      return { success: true };
    }),

  myOpportunities: providerProcedure.query(async ({ ctx }) => {
    const profile = await getProviderProfile(ctx.user.id);
    if (!profile) return [];

    const invitations = await getInvitationsByProvider(profile.id);

    return Promise.all(
      invitations.map(async (invitation) => {
        const item = await getMoveRequestItemById(invitation.moveRequestItemId);
        const moveRequest = item
          ? await getMoveRequestById(item.moveRequestId)
          : null;
        const fee = await getFeeByInvitation(invitation.id);
        const release =
          fee?.status === "paid" ? await getCustomerRelease(fee.id) : null;
        const addressReleased = Boolean(release?.status === "released");
        const customer =
          addressReleased && moveRequest
            ? await getUserById(moveRequest.customerId)
            : null;

        return {
          id: invitation.id,
          moveRequestItemId: invitation.moveRequestItemId,
          status: invitation.status,
          invitedAt: invitation.invitedAt,
          expiresAt: invitation.expiresAt,
          respondedAt: invitation.respondedAt,
          declineReason: invitation.declineReason,
          propertySuburb: moveRequest?.propertySuburb ?? null,
          propertyType: moveRequest?.propertyType ?? null,
          bedrooms: moveRequest?.bedrooms ?? null,
          bathrooms: moveRequest?.bathrooms ?? null,
          moveOutDate: moveRequest?.moveOutDate ?? null,
          propertyAddress: addressReleased
            ? moveRequest?.propertyAddress ?? null
            : null,
          accessNotes: addressReleased ? moveRequest?.accessNotes ?? null : null,
          customerPhone: addressReleased ? customer?.email ?? null : null,
          customerEmail: addressReleased ? customer?.email ?? null : null,
          customerName: addressReleased ? customer?.name ?? null : null,
          addressReleased,
          feeStatus: fee?.status ?? null,
          feeAmount: fee?.amount ?? null,
        };
      }),
    );
  }),

  acceptOpportunity: providerProcedure
    .input(z.object({ invitationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const invitation = await getInvitationById(input.invitationId);
      if (!invitation) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const profile = await getProviderProfile(ctx.user.id);
      if (!profile || invitation.providerId !== profile.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      if (invitation.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invitation is no longer pending.",
        });
      }

      await updateInvitation(input.invitationId, {
        status: "accepted",
        respondedAt: new Date(),
      });

      await createAuditEvent({
        eventType: "invitation.accepted",
        entityType: "provider_invitation",
        entityId: input.invitationId,
        actorType: "provider",
        actorId: ctx.user.id,
        description: `Provider ${profile.businessName} accepted invitation #${input.invitationId}`,
      });

      await schedulePaymentDeadlineCheck(input.invitationId);
      return { success: true };
    }),

  declineOpportunity: providerProcedure
    .input(z.object({ invitationId: z.number(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const invitation = await getInvitationById(input.invitationId);
      if (!invitation) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const profile = await getProviderProfile(ctx.user.id);
      if (!profile || invitation.providerId !== profile.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await updateInvitation(input.invitationId, {
        status: "declined",
        respondedAt: new Date(),
        declineReason: input.reason,
      });

      await createAuditEvent({
        eventType: "invitation.declined",
        entityType: "provider_invitation",
        entityId: input.invitationId,
        actorType: "provider",
        actorId: ctx.user.id,
        description: `Provider declined invitation #${input.invitationId}`,
      });

      return { success: true };
    }),

  billingHistory: providerProcedure.query(async ({ ctx }) => {
    const profile = await getProviderProfile(ctx.user.id);
    if (!profile) return [];
    return getProviderBillingHistory(profile.id);
  }),

  createCheckoutSession: providerProcedure
    .input(
      z.object({
        invitationId: z.number(),
        origin: z.string().url(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const invitation = await getInvitationById(input.invitationId);
      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found.",
        });
      }

      const profile = await getProviderProfile(ctx.user.id);
      if (!profile || invitation.providerId !== profile.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      if (invitation.status !== "accepted") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invitation must be accepted before payment.",
        });
      }

      const existingFee = await getFeeByInvitation(input.invitationId);
      if (existingFee?.status === "paid") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Introduction fee already paid for this invitation.",
        });
      }

      const item = await getMoveRequestItemById(invitation.moveRequestItemId);
      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Move request item not found.",
        });
      }

      const categories = await getServiceCategories();
      const category = categories.find(
        (candidate) => candidate.id === item.categoryId,
      );
      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Service category not found.",
        });
      }

      const { url, sessionId } = await createIntroductionFeeCheckout({
        invitationId: input.invitationId,
        categorySlug: category.slug,
        providerEmail: ctx.user.email ?? profile.contactEmail ?? "",
        providerName: ctx.user.name ?? profile.businessName,
        providerId: profile.id,
        origin: input.origin,
      });

      await createAuditEvent({
        eventType: "payment.checkout_created",
        entityType: "provider_invitation",
        entityId: input.invitationId,
        actorType: "provider",
        actorId: ctx.user.id,
        description: `Checkout session created for invitation #${input.invitationId} (${category.slug})`,
      });

      return { url, sessionId };
    }),

  flagJob: providerProcedure
    .input(
      z.object({
        invitationId: z.number(),
        reason: z
          .string()
          .min(
            10,
            "You must log at least 3 contact attempts before flagging a job.",
          ),
        contactAttempts: z.number().int().min(
          3,
          "You must log at least 3 contact attempts before flagging a job.",
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const invitation = await getInvitationById(input.invitationId);
      if (!invitation) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const profile = await getProviderProfile(ctx.user.id);
      if (!profile || invitation.providerId !== profile.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const fee = await getFeeByInvitation(input.invitationId);
      if (!fee || fee.status !== "paid") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "You can only flag a job after paying the introduction fee.",
        });
      }

      if (fee.paidAt) {
        const daysSincePaid =
          (Date.now() - new Date(fee.paidAt).getTime()) /
          (1000 * 60 * 60 * 24);
        if (daysSincePaid > 7) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "The 7-day refund window has expired.",
          });
        }
      }

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

      await notifyOwner({
        title: "Provider Refund Request (EX-13)",
        content: `Provider ${profile.businessName} flagged invitation #${input.invitationId}: ${input.reason}`,
      });

      return { success: true };
    }),
});

import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";
import { notifyOwner } from "../_core/notification";
import { router } from "../_core/trpc";
import {
  createAuditEvent,
  createMoveRequest,
  createMoveRequestItem,
  getMoveRequestById,
  getMoveRequestItems,
  getMoveRequestsByCustomer,
  updateMoveRequest,
} from "../db";
import { ENV } from "../_core/env";
import { sendCustomerRequestReceived } from "../lib/resend";
import { CUSTOMER_STATUS_LABELS, customerProcedure } from "./shared";

export const intakeRouter = router({
  createRequest: customerProcedure
    .input(
      z.object({
        propertyAddress: z.string().min(5),
        propertySuburb: z.string().min(2),
        propertyPostcode: z.string().optional(),
        propertyType: z.enum([
          "apartment",
          "house",
          "townhouse",
          "studio",
          "other",
        ]),
        bedrooms: z.number().int().min(0).max(20),
        bathrooms: z.number().int().min(0).max(20),
        accessNotes: z.string().optional(),
        moveOutDate: z.string().optional(),
      }),
    )
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

      await createAuditEvent({
        eventType: "move_request.created",
        entityType: "move_request",
        entityId: Number((result as any).insertId),
        actorType: "customer",
        actorId: ctx.user.id,
        description: `Customer created move request for ${input.propertySuburb}`,
      });

      return { id: Number((result as any).insertId) };
    }),

  submitRequest: customerProcedure
    .input(z.object({ requestId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const request = await getMoveRequestById(input.requestId);
      if (!request || request.customerId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await updateMoveRequest(input.requestId, {
        status: "submitted",
        submittedAt: new Date(),
      });

      await createAuditEvent({
        eventType: "move_request.submitted",
        entityType: "move_request",
        entityId: input.requestId,
        actorType: "customer",
        actorId: ctx.user.id,
        description: "Customer submitted move request",
      });

      await notifyOwner({
        title: "New Cart Submission",
        content: `Move request #${input.requestId} submitted by customer ${ctx.user.name ?? ctx.user.email}`,
      });

      if (ctx.user.email) {
        const requestData = await getMoveRequestById(input.requestId);
        const items = await getMoveRequestItems(input.requestId);

        sendCustomerRequestReceived({
          customerName: ctx.user.name ?? "there",
          customerEmail: ctx.user.email,
          requestId: input.requestId,
          suburb: requestData?.propertySuburb ?? "",
          moveOutDate:
            requestData?.moveOutDate instanceof Date
              ? requestData.moveOutDate.toLocaleDateString("en-AU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : String(requestData?.moveOutDate ?? ""),
          serviceCount: items.length,
          dashboardUrl: `${ENV.appUrl}/customer/requests/${input.requestId}`,
        }).catch(() => {});
      }

      return { success: true };
    }),

  myRequests: customerProcedure.query(async ({ ctx }) => {
    const requests = await getMoveRequestsByCustomer(ctx.user.id);
    return requests.map((request) => ({
      ...request,
      statusLabel: CUSTOMER_STATUS_LABELS[request.status] ?? request.status,
    }));
  }),

  requestDetail: customerProcedure
    .input(z.object({ requestId: z.number() }))
    .query(async ({ ctx, input }) => {
      const request = await getMoveRequestById(input.requestId);
      if (!request || request.customerId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const items = await getMoveRequestItems(input.requestId);

      return {
        ...request,
        statusLabel: CUSTOMER_STATUS_LABELS[request.status] ?? request.status,
        items: items.map((item) => ({
          ...item,
          statusLabel: CUSTOMER_STATUS_LABELS[item.status] ?? item.status,
        })),
      };
    }),

  addCartItem: customerProcedure
    .input(
      z.object({
        requestId: z.number(),
        categoryId: z.number(),
        productId: z.number().optional(),
        position: z.enum(["preferred", "backup"]).default("preferred"),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const request = await getMoveRequestById(input.requestId);
      if (!request || request.customerId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (request.status !== "draft") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot modify a submitted request.",
        });
      }

      const result = await createMoveRequestItem({
        moveRequestId: input.requestId,
        categoryId: input.categoryId,
        productId: input.productId,
        position: input.position,
        customerNotes: input.notes ?? null,
        status: "pending_match",
      });

      await createAuditEvent({
        eventType: "cart_item.added",
        entityType: "move_request",
        entityId: input.requestId,
        actorType: "customer",
        actorId: ctx.user.id,
        description: `Customer added ${input.position} provider for category ${input.categoryId}`,
      });

      return { id: Number((result as any).insertId) };
    }),

  cancelRequest: customerProcedure
    .input(z.object({ requestId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const request = await getMoveRequestById(input.requestId);
      if (!request || request.customerId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (request.status === "fulfilled") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot cancel a fulfilled request.",
        });
      }

      await updateMoveRequest(input.requestId, { status: "cancelled" });
      await createAuditEvent({
        eventType: "move_request.cancelled",
        entityType: "move_request",
        entityId: input.requestId,
        actorType: "customer",
        actorId: ctx.user.id,
        description: "Customer cancelled move request",
      });

      return { success: true };
    }),
});

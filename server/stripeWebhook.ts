/**
 * Stripe webhook handler for LeaseMate.
 * Registered BEFORE express.json() so raw body is available for signature verification.
 *
 * Handles:
 *   checkout.session.completed → mark invitation as paid, create customer_release,
 *                                 send emails, write audit event
 */
import express from "express";
import { ENV } from "./_core/env.js";
import { constructWebhookEvent } from "./lib/stripe.js";
import { getDb } from "./db.js";
import {
  providerInvitations,
  introductionFees,
  auditEvents,
  moveRequestItems,
  moveRequests,
  users,
} from "../drizzle/schema.js";
import { eq } from "drizzle-orm";
import { notifyOwner } from "./_core/notification.js";
import { triggerCustomerDetailsRelease } from "./lib/qstash.js";
import {
  sendProviderPaymentConfirmed,
  sendCustomerProviderMatched,
} from "./lib/resend.js";

type HeaderValue = string | string[] | undefined;

type StripeWebhookRequest = {
  body: Buffer;
  headers: Record<string, HeaderValue>;
};

type StripeWebhookResponse = {
  status: (code: number) => StripeWebhookResponse;
  json: (body: unknown) => unknown;
};

type StripeWebhookRouteRegistrar = {
  post: (...args: any[]) => unknown;
};

export function registerStripeWebhook(app: StripeWebhookRouteRegistrar): void {
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    (req: StripeWebhookRequest, res: StripeWebhookResponse) => {
      const sig = req.headers["stripe-signature"];
      if (typeof sig !== "string" || sig.trim() === "") {
        return res.status(400).json({ error: "Webhook Error: Missing stripe-signature header" });
      }

      let event;
      try {
        event = constructWebhookEvent(req.body as Buffer, sig as string);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("[Stripe Webhook] Signature verification failed:", message);
        return res.status(400).json({ error: `Webhook Error: ${message}` });
      }

      // Test event detection per Stripe docs
      if (event.id.startsWith("evt_test_")) {
        console.log("[Stripe Webhook] Test event detected, returning verification response");
        return res.json({ verified: true });
      }

      // Handle events asynchronously — respond 200 immediately
      res.json({ received: true });

      handleWebhookEvent(event).catch(err => {
        console.error("[Stripe Webhook] Handler error:", err);
      });
    }
  );
}

async function handleWebhookEvent(event: import("stripe").Stripe.Event): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("[Stripe Webhook] Database not available");
    return;
  }

  console.log(`[Stripe Webhook] Processing event: ${event.type} | ${event.id}`);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as import("stripe").Stripe.Checkout.Session;
    const invitationId = session.metadata?.invitation_id
      ? parseInt(session.metadata.invitation_id)
      : null;
    const providerId = session.metadata?.provider_id
      ? parseInt(session.metadata.provider_id)
      : null;
    const categorySlug = session.metadata?.category_slug ?? "";

    if (!invitationId || !providerId) {
      console.error("[Stripe Webhook] Missing metadata in checkout session:", session.id);
      return;
    }

    // 1. Get the invitation to find the move_request_item
    const [invitation] = await db
      .select()
      .from(providerInvitations)
      .where(eq(providerInvitations.id, invitationId))
      .limit(1);

    if (!invitation) {
      console.error("[Stripe Webhook] Invitation not found:", invitationId);
      return;
    }

    // 2. Create introduction_fees record
    const amountCents = session.amount_total ?? 0;
    const amountDecimal = (amountCents / 100).toFixed(2);
    const [existingFee] = await db
      .select()
      .from(introductionFees)
      .where(eq(introductionFees.invitationId, invitationId))
      .limit(1);

    if (existingFee?.status === "paid") {
      console.log(`[Stripe Webhook] Duplicate paid event ignored for invitation #${invitationId}`);
      await triggerCustomerDetailsRelease(invitationId);
      return;
    }

    if (existingFee) {
      await db
        .update(introductionFees)
        .set({
          amount: amountDecimal,
          stripePaymentIntentId: (session.payment_intent as string) ?? null,
          stripeCheckoutSessionId: session.id,
          status: "paid",
          paidAt: new Date(),
          overdueAt: null,
        })
        .where(eq(introductionFees.id, existingFee.id));
    } else {
      await db.insert(introductionFees).values({
        invitationId,
        providerId,
        moveRequestItemId: invitation.moveRequestItemId,
        amount: amountDecimal,
        stripePaymentIntentId: (session.payment_intent as string) ?? null,
        stripeCheckoutSessionId: session.id,
        status: "paid",
        paidAt: new Date(),
      });
    }

    // 3. Get move request details for customer release
    const [item] = await db
      .select()
      .from(moveRequestItems)
      .where(eq(moveRequestItems.id, invitation.moveRequestItemId))
      .limit(1);

    if (!item) {
      console.error("[Stripe Webhook] Move request item not found:", invitation.moveRequestItemId);
      return;
    }

    const [request] = await db
      .select()
      .from(moveRequests)
      .where(eq(moveRequests.id, item.moveRequestId))
      .limit(1);

    if (!request) {
      console.error("[Stripe Webhook] Move request not found:", item.moveRequestId);
      return;
    }

    // 4. Get the introduction fee we just created
    const [fee] = await db
      .select()
      .from(introductionFees)
      .where(eq(introductionFees.invitationId, invitationId))
      .limit(1);

    if (!fee) {
      console.error("[Stripe Webhook] Could not find introduction fee after insert");
      return;
    }

    // 5. Release customer details through the shared automation path
    await triggerCustomerDetailsRelease(invitationId);

    // 6. Fetch provider and customer user records for emails
    const [providerUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, providerId))
      .limit(1);

    const [customerUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, request.customerId))
      .limit(1);

    // 7. Send emails (fire-and-forget, do not block webhook response)
    const categoryDisplay = categorySlug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
    const moveOutStr = request.moveOutDate instanceof Date
      ? request.moveOutDate.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })
      : String(request.moveOutDate);
    const appBase = ENV.appUrl;

    if (providerUser?.email) {
      sendProviderPaymentConfirmed({
        providerName: providerUser.name ?? "",
        providerEmail: providerUser.email ?? "",
        invitationId,
        serviceCategory: categoryDisplay,
        customerName: customerUser?.name ?? "Your customer",
        customerEmail: customerUser?.email ?? "",
        propertyAddress: request.propertyAddress,
        suburb: request.propertySuburb,
        moveOutDate: moveOutStr,
        amountPaid: `$${amountDecimal}`,
        billingUrl: `${appBase}/provider/billing`,
      }).catch(err => console.error("[Stripe Webhook] Failed to send provider payment email:", err));
    }

    if (customerUser?.email) {
      sendCustomerProviderMatched({
        customerName: customerUser.name ?? "",
        customerEmail: customerUser.email ?? "",
        requestId: request.id,
        serviceCategory: categoryDisplay,
        suburb: request.propertySuburb,
        dashboardUrl: `${appBase}/requests/${request.id}`,
      }).catch(err => console.error("[Stripe Webhook] Failed to send customer matched email:", err));
    }

    // 8. Write audit event
    await db.insert(auditEvents).values({
      eventType: "payment_confirmed",
      entityType: "invitation",
      entityId: invitationId,
      actorType: "system",
      actorId: null,
      description: `Provider #${providerId} paid introduction fee for ${categorySlug}`,
      metadata: {
        stripeSessionId: session.id,
        amountCents,
        categorySlug,
        providerId,
        moveRequestId: request.id,
      },
    });

    // 9. Notify owner
    await notifyOwner({
      title: "LeaseMate: Introduction fee received",
      content: `Provider #${providerId} paid the introduction fee for ${categorySlug} (Invitation #${invitationId}). Customer details have been released.`,
    }).catch(() => {});

    console.log(`[Stripe Webhook] ✅ Payment processed: Invitation #${invitationId} | Provider #${providerId} | Released customer details for Request #${request.id}`);
  }
}

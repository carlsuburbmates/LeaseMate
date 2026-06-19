import dotenv from "dotenv";
import express from "express";
import Stripe from "stripe";
import { afterEach, describe, expect, it } from "vitest";
import { registerStripeWebhook } from "./stripeWebhook";

dotenv.config({ path: ".env", override: true });

let activeServer: ReturnType<express.Express["listen"]> | null = null;

afterEach(async () => {
  if (activeServer) {
    await new Promise<void>((resolve, reject) => {
      activeServer?.close((err) => (err ? reject(err) : resolve()));
    });
    activeServer = null;
  }
});

async function postWebhook(payload: string, signature: string) {
  const app = express();
  registerStripeWebhook(app);

  activeServer = await new Promise<ReturnType<express.Express["listen"]>>((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });

  const address = activeServer.address();
  if (!address || typeof address === "string") {
    throw new Error("Could not resolve ephemeral test port");
  }

  return fetch(`http://127.0.0.1:${address.port}/api/stripe/webhook`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "stripe-signature": signature,
    },
    body: payload,
  });
}

describe("registerStripeWebhook", () => {
  it("accepts a correctly signed raw Stripe payload", async () => {
    process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "sk_test_dummy";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_testsecret";

    const stripe = new Stripe("sk_test_dummy");
    const payload = JSON.stringify({
      id: "evt_test_checkout_completed",
      object: "event",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_123",
          metadata: {
            invitation_id: "1",
            provider_id: "1",
            category_slug: "removalist",
          },
          amount_total: 2500,
          payment_intent: "pi_test_123",
        },
      },
    });

    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: "whsec_testsecret",
    });

    const response = await postWebhook(payload, signature);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ verified: true });
  });

  it("rejects a missing signature header", async () => {
    const payload = JSON.stringify({ id: "evt_test_missing_sig", object: "event", type: "checkout.session.completed", data: { object: {} } });
    const response = await postWebhook(payload, "");

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Webhook Error: Missing stripe-signature header",
    });
  });
});

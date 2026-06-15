/**
 * LeaseMate Stripe Integration
 * Sandbox mode — all prices in AUD, test keys only.
 * Switch to live keys via Settings → Payment after Stripe KYC.
 */
import Stripe from "stripe";

let stripeClient: Stripe | null = null;

function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY ?? "";
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      apiVersion: "2026-05-27.dahlia",
    });
  }

  return stripeClient;
}

/**
 * Stripe sandbox product/price registry.
 * One price per service category — introduction fee paid by provider.
 */
export const STRIPE_PRICES: Record<string, { productId: string; priceId: string; amountAud: number }> = {
  "removalist": {
    productId: "prod_Ui7mlokSK8VDav",
    priceId: "price_1TihXACnSMWZLbpKx9U66Fgx",
    amountAud: 25,
  },
  "end-of-lease-cleaning": {
    productId: "prod_Ui7mSYeptizOxL",
    priceId: "price_1TihXBCnSMWZLbpKJIVe4IEg",
    amountAud: 15,
  },
  "carpet-cleaning": {
    productId: "prod_Ui7msJX1DSJJrJ",
    priceId: "price_1TihXCCnSMWZLbpKC767CTAx",
    amountAud: 15,
  },
  "pest-control": {
    productId: "prod_Ui7mWB6VfPIq0m",
    priceId: "price_1TihXDCnSMWZLbpKLcxs9OND",
    amountAud: 15,
  },
  "handyman": {
    productId: "prod_Ui7mk5y8cD6krB",
    priceId: "price_1TihXECnSMWZLbpKfjgYZxJS",
    amountAud: 15,
  },
  "rubbish-removal": {
    productId: "prod_Ui7mFIGsqSKUBG",
    priceId: "price_1TihXFCnSMWZLbpKCTyBbruh",
    amountAud: 15,
  },
};

/**
 * Creates a Stripe Checkout Session for a provider paying an introduction fee.
 * Returns the session URL to redirect the provider to.
 */
export async function createIntroductionFeeCheckout(params: {
  invitationId: number;
  categorySlug: string;
  providerEmail: string;
  providerName: string;
  providerId: number;
  origin: string;
}): Promise<{ url: string; sessionId: string }> {
  const price = STRIPE_PRICES[params.categorySlug];
  if (!price) {
    throw new Error(`No Stripe price configured for category: ${params.categorySlug}`);
  }

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: params.providerEmail,
    line_items: [
      {
        price: price.priceId,
        quantity: 1,
      },
    ],
    metadata: {
      invitation_id: params.invitationId.toString(),
      provider_id: params.providerId.toString(),
      category_slug: params.categorySlug,
      platform: "leasemate",
    },
    client_reference_id: params.providerId.toString(),
    success_url: `${params.origin}/provider/billing?payment=success&invitation=${params.invitationId}`,
    cancel_url: `${params.origin}/provider/opportunities?payment=cancelled`,
    allow_promotion_codes: false,
    payment_intent_data: {
      description: `LeaseMate introduction fee — ${params.categorySlug}`,
      metadata: {
        invitation_id: params.invitationId.toString(),
        provider_id: params.providerId.toString(),
        category_slug: params.categorySlug,
      },
    },
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL");

  return { url: session.url, sessionId: session.id };
}

/**
 * Verifies a Stripe webhook signature and returns the event.
 * Must be called with the raw request body (Buffer), not parsed JSON.
 */
export function constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
  return getStripe().webhooks.constructEvent(rawBody, signature, secret);
}

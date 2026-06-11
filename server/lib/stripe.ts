/**
 * Stripe client placeholder.
 * Wire up by:
 * 1. Running `webdev_add_feature stripe`
 * 2. Setting STRIPE_SECRET_KEY via webdev_request_secrets
 * 3. Replacing this file with the real Stripe SDK initialization.
 *
 * All Stripe calls must be server-side only.
 */

// import Stripe from "stripe";
// export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

export const stripe = null; // Replace with real Stripe instance post-launch

/**
 * Create a Stripe Checkout Session for an introduction fee payment.
 * @param invitationId - The provider_invitations.id being paid for
 * @param amount - Amount in AUD cents (e.g. 2500 = $25.00)
 * @param providerId - The provider's user ID (for metadata)
 * @param successUrl - Redirect URL after successful payment
 * @param cancelUrl - Redirect URL if payment is cancelled
 */
export async function createIntroductionFeeCheckout(_params: {
  invitationId: number;
  amount: number;
  providerId: number;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ url: string }> {
  // TODO: Implement with real Stripe SDK post-launch
  throw new Error("Stripe integration not yet active. Set STRIPE_SECRET_KEY and wire up this function.");
}

/**
 * Issue a full refund for an introduction fee.
 * @param stripePaymentIntentId - The Stripe PaymentIntent ID stored in introduction_fees.stripePaymentIntentId
 */
export async function refundIntroductionFee(_stripePaymentIntentId: string): Promise<void> {
  // TODO: Implement with real Stripe SDK post-launch
  throw new Error("Stripe integration not yet active.");
}

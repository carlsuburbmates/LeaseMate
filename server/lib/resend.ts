/**
 * Resend email client placeholder.
 * Wire up by:
 * 1. Setting RESEND_API_KEY via webdev_request_secrets
 * 2. Verifying your sending domain in the Resend dashboard
 * 3. Replacing the stub functions below with real Resend SDK calls.
 *
 * All email sends must be server-side only.
 */

// import { Resend } from "resend";
// const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS = "LeaseMate <noreply@leasemate.com.au>"; // Update to verified domain

/**
 * Email template registry.
 * Each function corresponds to one of the 10 transactional email templates.
 */

export async function sendProviderInvitation(_params: {
  to: string;
  providerName: string;
  categoryName: string;
  suburb: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  expiresAt: Date;
  acceptUrl: string;
  declineUrl: string;
}): Promise<void> {
  // TODO: Implement with Resend SDK post-launch
  console.log("[Resend placeholder] sendProviderInvitation called — not yet active");
}

export async function sendCustomerRequestConfirmation(_params: {
  to: string;
  customerName: string;
  requestId: number;
  services: string[];
  trackingUrl: string;
}): Promise<void> {
  console.log("[Resend placeholder] sendCustomerRequestConfirmation called — not yet active");
}

export async function sendProviderAcceptanceConfirmation(_params: {
  to: string;
  providerName: string;
  categoryName: string;
  paymentUrl: string;
  amount: number;
}): Promise<void> {
  console.log("[Resend placeholder] sendProviderAcceptanceConfirmation called — not yet active");
}

export async function sendCustomerDetailsRelease(_params: {
  to: string;
  providerName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  propertyAddress: string;
  accessNotes: string | null;
  moveOutDate: string | null;
}): Promise<void> {
  console.log("[Resend placeholder] sendCustomerDetailsRelease called — not yet active");
}

export async function sendProviderTimeoutWarning(_params: {
  to: string;
  providerName: string;
  categoryName: string;
  hoursRemaining: number;
}): Promise<void> {
  console.log("[Resend placeholder] sendProviderTimeoutWarning called — not yet active");
}

export async function sendOperatorExceptionAlert(_params: {
  exceptionCode: string;
  severity: string;
  description: string;
  requestId: number | null;
  opsUrl: string;
}): Promise<void> {
  console.log("[Resend placeholder] sendOperatorExceptionAlert called — not yet active");
}

export async function sendRefundApproved(_params: {
  to: string;
  providerName: string;
  amount: number;
  categoryName: string;
}): Promise<void> {
  console.log("[Resend placeholder] sendRefundApproved called — not yet active");
}

export async function sendRefundRejected(_params: {
  to: string;
  providerName: string;
  categoryName: string;
  reason: string;
}): Promise<void> {
  console.log("[Resend placeholder] sendRefundRejected called — not yet active");
}

export { FROM_ADDRESS };

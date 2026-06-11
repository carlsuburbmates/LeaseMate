/**
 * QStash automation job stubs.
 * Wire up by:
 * 1. Creating a QStash account at upstash.com
 * 2. Setting QSTASH_TOKEN, QSTASH_CURRENT_SIGNING_KEY, QSTASH_NEXT_SIGNING_KEY via webdev_request_secrets
 * 3. Replacing stub functions with real @upstash/qstash SDK calls.
 *
 * All 6 automation jobs defined in MASTER_BUILD_PLAN.md Phase 4.
 */

// import { Client } from "@upstash/qstash";
// const qstash = new Client({ token: process.env.QSTASH_TOKEN! });

const BASE_URL = process.env.VITE_APP_URL ?? "https://leasemate.manus.space";

/**
 * JOB-01: Provider invitation timeout check.
 * Fires 48 hours after invitation is sent.
 * Checks if provider responded; if not, creates EX-03 and escalates to backup.
 */
export async function scheduleProviderTimeoutCheck(_invitationId: number, _delaySeconds: number = 172800): Promise<void> {
  // TODO: Implement with QStash SDK post-launch
  // await qstash.publishJSON({
  //   url: `${BASE_URL}/api/jobs/provider-timeout`,
  //   body: { invitationId },
  //   delay: delaySeconds,
  // });
  console.log("[QStash placeholder] scheduleProviderTimeoutCheck — not yet active");
}

/**
 * JOB-02: Payment deadline check.
 * Fires 24 hours after provider accepts but hasn't paid.
 * Creates EX-05/EX-06 if still unpaid.
 */
export async function schedulePaymentDeadlineCheck(_invitationId: number, _delaySeconds: number = 86400): Promise<void> {
  console.log("[QStash placeholder] schedulePaymentDeadlineCheck — not yet active");
}

/**
 * JOB-03: Customer details release after payment confirmed.
 * Fires immediately after Stripe webhook confirms payment.
 * Creates customer_releases row and sends provider the contact details.
 */
export async function triggerCustomerDetailsRelease(_invitationId: number): Promise<void> {
  console.log("[QStash placeholder] triggerCustomerDetailsRelease — not yet active");
}

/**
 * JOB-04: Provider auto-pause check.
 * Fires after each timeout event.
 * Counts timeouts in last 30 days; pauses provider if >= 2.
 */
export async function checkProviderAutoPause(_providerId: number): Promise<void> {
  console.log("[QStash placeholder] checkProviderAutoPause — not yet active");
}

/**
 * JOB-05: Operator critical exception notification.
 * Fires immediately when a Critical-severity exception is created.
 * Sends email alert to operator via Resend.
 */
export async function notifyOperatorCriticalException(_exceptionId: number): Promise<void> {
  console.log("[QStash placeholder] notifyOperatorCriticalException — not yet active");
}

/**
 * JOB-06: Stale request cleanup.
 * Daily cron: marks draft requests older than 7 days as cancelled.
 */
export async function scheduleDailyStaleRequestCleanup(): Promise<void> {
  console.log("[QStash placeholder] scheduleDailyStaleRequestCleanup — not yet active");
}

export { BASE_URL };

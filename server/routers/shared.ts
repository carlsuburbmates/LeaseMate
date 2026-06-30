import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "../_core/trpc.js";

function requireRole(
  allowedRoles: string[],
  message: string,
) {
  return protectedProcedure.use(({ ctx, next }) => {
    if (!allowedRoles.includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message });
    }

    return next({ ctx });
  });
}

export const customerProcedure = requireRole(
  ["customer", "admin", "operator"],
  "Customer access required.",
);

export const providerProcedure = requireRole(
  ["provider", "admin", "operator"],
  "Provider access required.",
);

export const operatorProcedure = requireRole(
  ["admin", "operator"],
  "Operator access required.",
);

export const CUSTOMER_STATUS_LABELS: Record<string, string> = {
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

export const EXCEPTION_CODES = [
  "EX-01",
  "EX-02",
  "EX-03",
  "EX-04",
  "EX-05",
  "EX-06",
  "EX-07",
  "EX-08",
  "EX-09",
  "EX-10",
  "EX-11",
  "EX-12",
  "EX-13",
] as const;

export type ExceptionCode = (typeof EXCEPTION_CODES)[number];

export const EXCEPTION_META: Record<
  ExceptionCode,
  {
    name: string;
    affectedParty: string;
    severity: "critical" | "warning" | "informational";
    prevention: string;
    resolution: string;
  }
> = {
  "EX-01": {
    name: "No Provider Matched",
    affectedParty: "Customer",
    severity: "critical",
    prevention:
      "Block intake if fewer than 3 active providers in category/zone. Do not go live without minimum supply.",
    resolution:
      "Manually assign a provider or mark the item unfulfillable and notify the customer.",
  },
  "EX-02": {
    name: "Provider Declined",
    affectedParty: "Customer (indirect)",
    severity: "informational",
    prevention:
      "Route only to active providers below their weekly cap. Use availability toggle.",
    resolution:
      "Confirm backup invitation fired. Escalate to EX-07 if no backup exists.",
  },
  "EX-03": {
    name: "Provider Timeout",
    affectedParty: "Customer",
    severity: "warning",
    prevention:
      "Auto-pause providers with 2+ timeouts in 30 days. SLA enforcement transfers to provider.",
    resolution:
      "Confirm backup invitation fired. Manually invite backup if automation missed it.",
  },
  "EX-04": {
    name: "All Providers Declined",
    affectedParty: "Customer",
    severity: "critical",
    prevention:
      "Maintain minimum 3 active providers per category/zone. Monitor decline rates.",
    resolution:
      "Manually find and assign an alternative provider. Notify customer if none available.",
  },
  "EX-05": {
    name: "Provider Accepted But Unpaid",
    affectedParty: "Customer + Platform",
    severity: "critical",
    prevention:
      "Require Stripe card on provider onboarding. Charge automatically on acceptance.",
    resolution:
      "Send final payment reminder. Cancel acceptance and reroute to backup if still unpaid after 24h.",
  },
  "EX-06": {
    name: "Payment Overdue",
    affectedParty: "Platform + Customer",
    severity: "warning",
    prevention:
      "Auto-charge on acceptance. No manual payment step required.",
    resolution:
      "Confirm reminder sent. Monitor. Escalates to EX-05 if unpaid after 24h.",
  },
  "EX-07": {
    name: "Customer Needs More Options",
    affectedParty: "Customer",
    severity: "warning",
    prevention:
      "Maintain minimum supply. Monitor provider availability before routing.",
    resolution:
      "Manually assign alternative provider or notify customer and offer to modify request.",
  },
  "EX-08": {
    name: "Automation Failed",
    affectedParty: "Customer + Platform",
    severity: "critical",
    prevention:
      "QStash retries handle transient failures silently. Alert only on persistent failure.",
    resolution:
      "Retry the failed job. Manually perform the step if retry fails. Investigate if systemic.",
  },
  "EX-09": {
    name: "Customer Release Failed",
    affectedParty: "Provider + Customer",
    severity: "critical",
    prevention:
      "Use atomic transaction: payment and release in a single operation.",
    resolution:
      "Manually trigger customer detail release from Billing Queue. Investigate if it fails again.",
  },
  "EX-10": {
    name: "Data Issue",
    affectedParty: "Customer or Provider",
    severity: "warning",
    prevention:
      "Enforce suburb dropdowns, phone format checks, and mandatory fields at intake and onboarding.",
    resolution:
      "Identify the bad field. Correct it. Resume workflow manually.",
  },
  "EX-11": {
    name: "Manual Review Required",
    affectedParty: "Operator",
    severity: "warning",
    prevention:
      "Reduce via clear automation rules. These are genuine edge cases.",
    resolution:
      "Review timeline. Make judgment call. Document decision in operator notes.",
  },
  "EX-12": {
    name: "Communication Failure",
    affectedParty: "Provider or Customer",
    severity: "warning",
    prevention:
      "Resend delivery webhooks auto-retry. Verify email at onboarding.",
    resolution:
      "Manually resend the failed email. Flag as EX-10 if address is invalid.",
  },
  "EX-13": {
    name: "Provider Refund Request",
    affectedParty: "Provider + Customer",
    severity: "warning",
    prevention:
      "Require 3 documented contact attempts before Flag Issue button activates.",
    resolution:
      "Verify claim against audit log. Approve refund + flag customer account, or reject with explanation.",
  },
};

export const LOCAL_AUTH_ROLES = [
  "customer",
  "provider",
  "operator",
  "admin",
] as const;

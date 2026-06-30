import {
  createAuditEvent,
  getProductsByProvider,
  getProviderProfileById,
  updateProviderProfile,
} from "../db.js";

type EligibilityStatus = "eligible" | "ineligible" | "needs_review";

type RequirementKey =
  | "business_name"
  | "abn"
  | "phone"
  | "contact_email"
  | "suburb"
  | "active_product";

type RequirementCheck = {
  key: RequirementKey;
  label: string;
  passed: boolean;
  detail: string;
};

export type ProviderEligibilitySnapshot = {
  activeProductCount: number;
  summary: string;
  unmetRequirementKeys: RequirementKey[];
  requirements: RequirementCheck[];
};

function cleanString(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function normalizeAbn(abn: string | null | undefined) {
  return cleanString(abn).replace(/\D/g, "");
}

function buildEligibilitySnapshot(input: {
  businessName?: string | null;
  abn?: string | null;
  phone?: string | null;
  contactEmail?: string | null;
  suburb?: string | null;
  activeProductCount: number;
}): ProviderEligibilitySnapshot {
  const normalizedAbn = normalizeAbn(input.abn);
  const email = cleanString(input.contactEmail);
  const requirements: RequirementCheck[] = [
    {
      key: "business_name",
      label: "Business name",
      passed: cleanString(input.businessName).length >= 2,
      detail:
        cleanString(input.businessName).length >= 2
          ? "Provided."
          : "Add a business name.",
    },
    {
      key: "abn",
      label: "ABN",
      passed: normalizedAbn.length === 11,
      detail:
        normalizedAbn.length === 11
          ? "ABN present."
          : "Add a valid 11-digit ABN.",
    },
    {
      key: "phone",
      label: "Phone",
      passed: cleanString(input.phone).length >= 6,
      detail:
        cleanString(input.phone).length >= 6
          ? "Phone present."
          : "Add a contact phone number.",
    },
    {
      key: "contact_email",
      label: "Contact email",
      passed: email.includes("@") && email.includes("."),
      detail:
        email.includes("@") && email.includes(".")
          ? "Contact email present."
          : "Add a valid contact email.",
    },
    {
      key: "suburb",
      label: "Business suburb",
      passed: cleanString(input.suburb).length >= 2,
      detail:
        cleanString(input.suburb).length >= 2
          ? "Suburb present."
          : "Add the business suburb.",
    },
    {
      key: "active_product",
      label: "Active service product",
      passed: input.activeProductCount >= 1,
      detail:
        input.activeProductCount >= 1
          ? `${input.activeProductCount} active product${input.activeProductCount === 1 ? "" : "s"} available.`
          : "Add at least 1 active service product.",
    },
  ];

  const unmetRequirementKeys = requirements
    .filter((requirement) => !requirement.passed)
    .map((requirement) => requirement.key);

  return {
    activeProductCount: input.activeProductCount,
    requirements,
    unmetRequirementKeys,
    summary:
      unmetRequirementKeys.length === 0
        ? "All approval requirements are satisfied."
        : `${unmetRequirementKeys.length} approval requirement${unmetRequirementKeys.length === 1 ? "" : "s"} still need attention.`,
  };
}

function determineEligibilityStatus(params: {
  allPassed: boolean;
  approvalMode: "auto" | "manual";
  status: "active" | "paused" | "suspended" | "pending";
}): EligibilityStatus {
  if (params.allPassed && params.approvalMode === "manual" && params.status === "pending") {
    return "needs_review";
  }

  if (params.allPassed) {
    return "eligible";
  }

  return "ineligible";
}

export async function evaluateProviderApproval(providerId: number) {
  const profile = await getProviderProfileById(providerId);
  if (!profile) {
    return { ok: true, skipped: true, reason: "provider_missing" };
  }

  const products = await getProductsByProvider(providerId);
  const activeProductCount = products.filter((product) => product.isActive).length;
  const snapshot = buildEligibilitySnapshot({
    businessName: profile.businessName,
    abn: profile.abn,
    phone: profile.phone,
    contactEmail: profile.contactEmail,
    suburb: profile.suburb,
    activeProductCount,
  });

  const now = new Date();
  const allPassed = snapshot.unmetRequirementKeys.length === 0;
  const eligibilityStatus = determineEligibilityStatus({
    allPassed,
    approvalMode: profile.approvalMode,
    status: profile.status,
  });

  await updateProviderProfile(providerId, {
    eligibilityChecks: snapshot,
    eligibilityStatus,
    lastEligibilityEvaluatedAt: now,
  });

  await createAuditEvent({
    eventType: "provider.approval_evaluated",
    entityType: "provider_profile",
    entityId: providerId,
    actorType: "system",
    actorId: null,
    description: `Provider #${providerId} approval evaluated: ${eligibilityStatus}.`,
    metadata: {
      approvalMode: profile.approvalMode,
      providerStatus: profile.status,
      activeProductCount,
      unmetRequirementKeys: snapshot.unmetRequirementKeys,
    },
  });

  if (profile.status !== "pending" || profile.approvalMode !== "auto" || !allPassed) {
    return {
      ok: true,
      providerId,
      eligibilityStatus,
      autoApproved: false,
      unmetRequirementKeys: snapshot.unmetRequirementKeys,
    };
  }

  await updateProviderProfile(providerId, {
    status: "active",
    eligibilityStatus: "eligible",
    autoApprovedAt: now,
    approvedAt: now,
    approvedBy: null,
    approvalReason:
      "Automatically approved after completing the provider onboarding requirements.",
    rejectionReason: null,
  });

  await createAuditEvent({
    eventType: "provider.auto_approved",
    entityType: "provider_profile",
    entityId: providerId,
    actorType: "system",
    actorId: null,
    description: `Provider #${providerId} auto-approved after completing onboarding requirements.`,
    metadata: {
      activeProductCount,
    },
  });

  return {
    ok: true,
    providerId,
    eligibilityStatus: "eligible" as const,
    autoApproved: true,
    unmetRequirementKeys: [],
  };
}

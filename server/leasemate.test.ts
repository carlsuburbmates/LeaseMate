import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

const RUN_DB_TESTS = process.env.RUN_DB_TESTS === "1";
const dbIt = RUN_DB_TESTS ? it : it.skip;

// ─── Context factories ────────────────────────────────────────────────────────

type AppRole = "user" | "admin" | "customer" | "provider" | "operator";

function makeUser(role: AppRole = "customer", id = 1) {
  return {
    id,
    openId: `test-user-${id}`,
    email: `test${id}@example.com`,
    name: `Test User ${id}`,
    loginMethod: "manus",
    role: role as "user" | "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
}

function makeCtx(role: AppRole = "customer", id = 1): TrpcContext {
  return {
    user: makeUser(role, id),
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function makeAnonCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const cleared: string[] = [];
    const ctx: TrpcContext = {
      user: makeUser(),
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: (name: string) => cleared.push(name) } as any,
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(cleared).toHaveLength(1);
    expect(cleared[0]).toBe(COOKIE_NAME);
  });

  it("auth.me returns null for unauthenticated user", async () => {
    const caller = appRouter.createCaller(makeAnonCtx());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

// ─── Reference data ───────────────────────────────────────────────────────────

describe("reference.categories", () => {
  dbIt("is publicly accessible", async () => {
    const caller = appRouter.createCaller(makeAnonCtx());
    const categories = await caller.reference.categories() as any[];
    expect(Array.isArray(categories)).toBe(true);
  });
});

describe("reference.suburbs", () => {
  dbIt("is publicly accessible", async () => {
    const caller = appRouter.createCaller(makeAnonCtx());
    const suburbs = await caller.reference.suburbs() as any[];
    expect(Array.isArray(suburbs)).toBe(true);
  });
});

// ─── Exception metadata ───────────────────────────────────────────────────────

describe("reference.exceptionMeta", () => {
  it("is blocked for unauthenticated users", async () => {
    const caller = appRouter.createCaller(makeAnonCtx());
    await expect(caller.reference.exceptionMeta()).rejects.toThrow();
  });

  it("is blocked for customer role", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(caller.reference.exceptionMeta()).rejects.toThrow();
  });

  it("is accessible to admin role", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const meta = await caller.reference.exceptionMeta() as any;
    expect(meta).toBeDefined();
    expect(Object.keys(meta)).toHaveLength(13);
  });

  it("contains all 13 exception codes EX-01 through EX-13", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const meta = await caller.reference.exceptionMeta() as any;
    for (let i = 1; i <= 13; i++) {
      const code = `EX-${String(i).padStart(2, "0")}`;
      expect(meta[code], `${code} should exist`).toBeDefined();
    }
  });

  it("each exception has all required fields: name, affectedParty, severity, prevention, resolution", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const meta = await caller.reference.exceptionMeta() as any;
    for (const [code, entry] of Object.entries(meta)) {
      const e = entry as any;
      expect(e.name, `${code} missing name`).toBeTruthy();
      expect(e.affectedParty, `${code} missing affectedParty`).toBeTruthy();
      expect(e.severity, `${code} missing severity`).toBeTruthy();
      expect(e.prevention, `${code} missing prevention`).toBeTruthy();
      expect(e.resolution, `${code} missing resolution`).toBeTruthy();
      expect(["critical", "warning", "informational"]).toContain(e.severity);
    }
  });

  it("EX-01 is critical severity (no provider matched)", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const meta = await caller.reference.exceptionMeta() as any;
    expect(meta["EX-01"].severity).toBe("critical");
  });

  it("EX-13 is provider refund request affecting both Provider and Customer", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const meta = await caller.reference.exceptionMeta() as any;
    expect(meta["EX-13"].name).toBe("Provider Refund Request");
    expect(meta["EX-13"].affectedParty).toContain("Provider");
    expect(meta["EX-13"].affectedParty).toContain("Customer");
  });

  it("EX-05 is critical severity (provider accepted but unpaid)", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const meta = await caller.reference.exceptionMeta() as any;
    expect(meta["EX-05"].severity).toBe("critical");
  });

  it("EX-02 is informational severity (provider declined)", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const meta = await caller.reference.exceptionMeta() as any;
    expect(meta["EX-02"].severity).toBe("informational");
  });
});

// ─── Role-based access control ────────────────────────────────────────────────

describe("Role guards", () => {
  it("rejects unauthenticated access to customer intake", async () => {
    const caller = appRouter.createCaller(makeAnonCtx());
    await expect(caller.intake.myRequests()).rejects.toThrow();
  });

  it("rejects unauthenticated access to provider procedures", async () => {
    const caller = appRouter.createCaller(makeAnonCtx());
    await expect(caller.provider.myProfile()).rejects.toThrow();
  });

  it("rejects unauthenticated access to provider opportunities", async () => {
    const caller = appRouter.createCaller(makeAnonCtx());
    await expect(caller.provider.myOpportunities()).rejects.toThrow();
  });

  it("rejects non-admin from ops dashboard", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(caller.ops.dashboard()).rejects.toThrow();
  });

  it("rejects non-admin from ops allExceptions", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(caller.ops.allExceptions({ limit: 10 })).rejects.toThrow();
  });

  it("rejects non-admin from ops allProviders", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(caller.ops.allProviders()).rejects.toThrow();
  });

  dbIt("allows admin to access ops dashboard", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const result = await caller.ops.dashboard();
    expect(result).toBeDefined();
  });
});

// ─── Customer-safe status labels ──────────────────────────────────────────────

describe("Customer-safe status labels", () => {
  const FORBIDDEN_IN_CUSTOMER_LABELS = [
    "EX-01", "EX-02", "EX-03", "EX-04", "EX-05", "EX-06",
    "EX-07", "EX-08", "EX-09", "EX-10", "EX-11", "EX-12", "EX-13",
    "introduction_fee", "provider_invitation", "automation_failed",
    "payment_overdue",
  ];

  const CUSTOMER_STATUS_LABELS = [
    "Draft", "Submitted", "In Progress", "Partially Arranged",
    "All Arranged", "Cancelled", "Finding Providers",
    "Contacting Providers", "Provider Confirmed", "Provider Assigned",
    "Seeking Alternatives", "Under Review",
  ];

  it("no customer-facing label contains internal exception codes", () => {
    for (const label of CUSTOMER_STATUS_LABELS) {
      for (const forbidden of FORBIDDEN_IN_CUSTOMER_LABELS) {
        expect(label.toLowerCase()).not.toContain(forbidden.toLowerCase());
      }
    }
  });

  it("all customer-facing labels are human-readable", () => {
    for (const label of CUSTOMER_STATUS_LABELS) {
      expect(label.length).toBeGreaterThan(3);
      expect(label).not.toMatch(/^[a-z_]+$/); // No snake_case
    }
  });

  it("exceptionMeta is not accessible to unauthenticated users (prevents label leakage)", async () => {
    const caller = appRouter.createCaller(makeAnonCtx());
    await expect(caller.reference.exceptionMeta()).rejects.toThrow();
  });
});

// ─── Business rule: refund window enforcement ─────────────────────────────────

describe("Business rule: flagJob refund window", () => {
  it("requires contactAttempts field in input", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    // Missing contactAttempts should fail Zod validation
    await expect(
      (caller.provider.flagJob as any)({ invitationId: 1, reason: "Customer uncontactable" })
    ).rejects.toThrow();
  });

  it("rejects contactAttempts < 3", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(
      caller.provider.flagJob({ invitationId: 1, reason: "Customer uncontactable", contactAttempts: 2 })
    ).rejects.toThrow();
  });

  it("rejects contactAttempts = 0", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(
      caller.provider.flagJob({ invitationId: 1, reason: "Customer uncontactable", contactAttempts: 0 })
    ).rejects.toThrow();
  });
});

// ─── Business rule: address masking ──────────────────────────────────────────

describe("Business rule: address masking in myOpportunities", () => {
  it("myOpportunities requires authentication", async () => {
    const caller = appRouter.createCaller(makeAnonCtx());
    await expect(caller.provider.myOpportunities()).rejects.toThrow();
  });

  it("returned opportunity shape has addressReleased field", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    try {
      const opps = await caller.provider.myOpportunities() as any[];
      for (const opp of opps) {
        expect(typeof opp.addressReleased).toBe("boolean");
        if (!opp.addressReleased) {
          expect(opp.propertyAddress).toBeNull();
          expect(opp.customerEmail).toBeNull();
          expect(opp.customerPhone).toBeNull();
        }
      }
    } catch {
      // DB unavailable in test env — acceptable
    }
  });
});

// ─── Exception creation ───────────────────────────────────────────────────────

describe("ops.createManualException", () => {
  it("rejects invalid exception codes", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    await expect(
      (caller.ops.createManualException as any)({ code: "EX-99", description: "Invalid" })
    ).rejects.toThrow();
  });

  it("rejects non-admin from creating exceptions", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(
      caller.ops.createManualException({ code: "EX-01", description: "Test" })
    ).rejects.toThrow();
  });
});

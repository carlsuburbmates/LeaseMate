import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AppRole = "user" | "admin" | "customer" | "provider" | "operator";

function makeUser(role: AppRole = "customer", id = 1) {
  return {
    id,
    openId: `approval-test-user-${id}`,
    email: `approval${id}@example.com`,
    name: `Approval Test ${id}`,
    loginMethod: "local",
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

describe("provider approval ops routes", () => {
  it("rejects non-operator manual provider approval", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(
      caller.ops.approveProvider({ providerId: 1 })
    ).rejects.toThrow();
  });

  it("rejects non-operator provider rejection", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(
      caller.ops.rejectProvider({ providerId: 1, reason: "Missing ABN." })
    ).rejects.toThrow();
  });

  it("requires a reason when manually holding provider approval", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    await expect(
      caller.ops.rejectProvider({ providerId: 1, reason: "no" })
    ).rejects.toThrow();
  });
});

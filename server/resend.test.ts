import { describe, it, expect } from "vitest";

describe("Resend API key validation", () => {
  it("should have a valid RESEND_API_KEY that authenticates with Resend", async () => {
    const key = process.env.RESEND_API_KEY;
    expect(key, "RESEND_API_KEY must be set").toBeTruthy();
    expect(key!.startsWith("re_"), "RESEND_API_KEY must start with re_").toBe(true);

    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${key}` },
    });
    const data = (await res.json()) as any;
    expect(
      data.data !== undefined || res.status === 200,
      `Resend API returned error: ${JSON.stringify(data)}`
    ).toBe(true);
  });
});

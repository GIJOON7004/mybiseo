import { describe, it, expect } from "vitest";

describe("Microsoft Clarity Integration", () => {
  it("VITE_CLARITY_ID environment variable is set and non-empty", () => {
    const clarityId = process.env.VITE_CLARITY_ID;
    expect(clarityId).toBeDefined();
    expect(clarityId).not.toBe("");
    expect(clarityId).not.toBe("PLACEHOLDER");
    // Clarity project IDs are alphanumeric strings
    expect(clarityId).toMatch(/^[a-z0-9]+$/i);
  });
});

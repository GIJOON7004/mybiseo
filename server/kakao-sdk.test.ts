import { describe, it, expect } from "vitest";

describe("Kakao SDK Key", () => {
  const key = process.env.VITE_KAKAO_JS_KEY;

  it("should have VITE_KAKAO_JS_KEY env variable set (skipped if not available)", () => {
    if (!key) {
      console.warn("VITE_KAKAO_JS_KEY not set — skipping (배포 환경에서만 필요)");
      return;
    }
    expect(key).toBeDefined();
    expect(key!.length).toBeGreaterThan(10);
  });

  it("should be a valid hex string format (skipped if not available)", () => {
    if (!key) {
      console.warn("VITE_KAKAO_JS_KEY not set — skipping (배포 환경에서만 필요)");
      return;
    }
    expect(key).toMatch(/^[a-f0-9]{32}$/);
  });
});

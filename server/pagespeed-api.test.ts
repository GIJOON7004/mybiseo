import { describe, it, expect } from "vitest";

describe("Google PageSpeed Insights API Key Validation", () => {
  const key = process.env.GOOGLE_PAGESPEED_API_KEY;

  it("should have GOOGLE_PAGESPEED_API_KEY set (skipped if not available)", () => {
    if (!key) {
      console.warn("GOOGLE_PAGESPEED_API_KEY not set — skipping (배포 환경에서만 필요)");
      return;
    }
    expect(key).toBeDefined();
    expect(key!.length).toBeGreaterThan(10);
  });

  it("should successfully call PageSpeed API with the key", async () => {
    if (!key) {
      console.warn("GOOGLE_PAGESPEED_API_KEY not set, skipping API call test");
      return;
    }

    const url = `https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://example.com&key=${key}&category=PERFORMANCE&strategy=MOBILE`;
    const response = await fetch(url);
    expect(response.ok).toBe(true);

    const data = await response.json();
    expect(data.lighthouseResult).toBeDefined();
    expect(data.lighthouseResult.categories.performance).toBeDefined();
    expect(data.lighthouseResult.categories.performance.score).toBeGreaterThanOrEqual(0);
  }, 60000);
});

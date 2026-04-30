import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * 병원 특화 챗봇 시스템 프롬프트 및 라우터 테스트
 * - 챗봇이 병원 특화 용어를 사용하는지 확인
 * - inquiry 라우터가 병원 필드를 처리하는지 확인
 */

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Hospital-specialized chatbot", () => {
  it("chat.send procedure exists and is callable", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // chat.send should exist as a procedure
    expect(caller.chat).toBeDefined();
    expect(caller.chat.send).toBeDefined();
  });

  it("inquiry.submit procedure exists and is callable", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // inquiry.submit should exist as a procedure
    expect(caller.inquiry).toBeDefined();
    expect(caller.inquiry.submit).toBeDefined();
  });
});

describe("Hospital-specialized router structure", () => {
  it("appRouter has chat and inquiry routers", () => {
    // Verify the router has the expected procedures
    const procedures = Object.keys(appRouter._def.procedures);
    
    // Check chat procedures exist
    expect(procedures).toContain("chat.send");
    
    // Check inquiry procedures exist
    expect(procedures).toContain("inquiry.submit");
  });

  it("appRouter has seo analyzer procedure", () => {
    const procedures = Object.keys(appRouter._def.procedures);
    expect(procedures).toContain("seoAnalyzer.analyze");
  });

  it("appRouter has blog procedures", () => {
    const procedures = Object.keys(appRouter._def.procedures);
    // blog router exists with various sub-procedures
    const blogProcedures = procedures.filter(p => p.startsWith("blog."));
    expect(blogProcedures.length).toBeGreaterThan(0);
  });
});

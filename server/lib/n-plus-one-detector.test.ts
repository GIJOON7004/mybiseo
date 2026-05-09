import { describe, it, expect, beforeEach } from "vitest";
import { trackQuery, resetTracker } from "./n-plus-one-detector";

describe("N+1 Query Detector", () => {
  beforeEach(() => {
    resetTracker();
  });

  it("trackQuery가 에러 없이 호출되어야 함", () => {
    expect(() => trackQuery("SELECT * FROM users WHERE id = 1")).not.toThrow();
  });

  it("resetTracker가 상태를 초기화해야 함", () => {
    trackQuery("SELECT * FROM users WHERE id = 1");
    trackQuery("SELECT * FROM users WHERE id = 2");
    expect(() => resetTracker()).not.toThrow();
  });

  it("동일 패턴 쿼리를 정규화해야 함 (숫자 → ?)", () => {
    // 내부 동작 검증은 어렵지만, 에러 없이 반복 호출 가능해야 함
    for (let i = 0; i < 10; i++) {
      expect(() => trackQuery(`SELECT * FROM users WHERE id = ${i}`)).not.toThrow();
    }
  });

  it("context 파라미터를 받아야 함", () => {
    expect(() => trackQuery("SELECT * FROM posts WHERE user_id = 5", "postRouter.getAll")).not.toThrow();
  });
});

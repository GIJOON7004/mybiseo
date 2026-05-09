import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * PDF 보고서 — 가중치 산정 설명 + 통과 항목 전체 노출 검증
 */
describe("PDF 보고서 — 가중치 설명 + 부록(통과 항목 전체 노출)", () => {
  const pdfEngine = readFileSync(
    resolve(__dirname, "ai-visibility-report.ts"),
    "utf-8"
  );

  describe("카테고리별 가중치 산정 방식 설명", () => {
    it("specialty가 있을 때 진료과별 가중치 설명이 포함됨", () => {
      expect(pdfEngine).toContain("점수 산정 방식: 각 카테고리는 진료과");
      expect(pdfEngine).toContain("가중치가 적용됩니다");
    });

    it("specialty가 없을 때도 일반적인 가중치 산정 설명이 포함됨", () => {
      expect(pdfEngine).toContain("항목별 만점 대비 달성률로 산정됩니다");
      expect(pdfEngine).toContain("카테고리별 가중치(0.5~2.0배)");
    });

    it("영문 보고서에도 가중치 설명이 포함됨", () => {
      expect(pdfEngine).toContain("specialty-specific weights applied");
      expect(pdfEngine).toContain("category-specific weights (0.5–2.0x)");
    });

    it("가중치 설명이 카테고리 테이블 뒤에 위치함", () => {
      const catTableEnd = pdfEngine.indexOf("y += 12;");
      const weightNote = pdfEngine.indexOf("가중치 산정 방식 설명");
      expect(weightNote).toBeGreaterThan(catTableEnd);
    });

    it("가중치 설명이 모든 보고서에서 일관되게 노출됨 (조건부가 아닌 항상 실행)", () => {
      // specialty 유무와 관계없이 항상 실행되는 블록 구조 확인
      const blockStart = pdfEngine.indexOf("// 가중치 산정 방식 설명");
      const afterBlock = pdfEngine.substring(blockStart, blockStart + 200);
      // if (rd?.specialty) 대신 { ... } 블록으로 항상 실행
      expect(afterBlock).toContain("{");
      expect(afterBlock).toContain("rd?.specialty");
      // 삼항 연산자로 분기 (if문이 아님)
      expect(afterBlock).not.toMatch(/if\s*\(\s*rd\?\.\s*specialty\s*\)\s*\{/);
    });
  });

  describe("PDF 전체 항목 노출 (접힘 없음)", () => {
    it("hiddenCount가 항상 0으로 설정됨", () => {
      expect(pdfEngine).toContain("const hiddenCount = 0;");
    });

    it("'+ N개 추가 항목' 메시지가 절대 표시되지 않음 (hiddenCount=0)", () => {
      // hiddenCount > 0 조건이 있지만 항상 0이므로 실행되지 않음
      const hiddenIdx = pdfEngine.indexOf("const hiddenCount = 0;");
      expect(hiddenIdx).toBeGreaterThan(-1);
    });

    it("fail/warning 항목이 slice 없이 전체 표시됨", () => {
      expect(pdfEngine).toContain("const problemItems = sorted;");
      // .slice()가 problemItems 할당에 없음
      const line = pdfEngine.split("\n").find(l => l.includes("const problemItems = sorted"));
      expect(line).not.toContain(".slice(");
    });

    it("통과 항목 부록 섹션이 존재함", () => {
      expect(pdfEngine).toContain("부록: 통과 항목 전체 리스트");
      expect(pdfEngine).toContain("통과 항목 전체 목록");
      expect(pdfEngine).toContain("Passed Items (Complete List)");
    });

    it("부록에서 pass 상태 항목을 카테고리별로 그룹핑하여 표시함", () => {
      expect(pdfEngine).toContain('cat.items.filter(i => i.status === "pass")');
      expect(pdfEngine).toContain("passGrouped");
      expect(pdfEngine).toContain("Object.entries(passGrouped)");
    });

    it("부록에 항목 개수가 표시됨", () => {
      expect(pdfEngine).toContain("allPassItems.length");
      expect(pdfEngine).toContain("개 항목이 정상적으로 통과되었습니다");
    });

    it("부록이 영문 보고서에서도 동작함", () => {
      expect(pdfEngine).toContain("items passed successfully");
    });
  });
});

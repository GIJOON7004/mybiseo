import { describe, it, expect, beforeEach } from "vitest";
import { registerSection, getRegisteredSections, clearRegistry } from "./report-plugin-types";
import type { SectionPlugin, ReportContext } from "./report-plugin-types";

describe("Report Plugin Types & Registry", () => {
  beforeEach(() => {
    clearRegistry();
  });

  it("초기 레지스트리는 비어있어야 함", () => {
    expect(getRegisteredSections()).toHaveLength(0);
  });

  it("플러그인을 등록할 수 있어야 함", () => {
    const plugin: SectionPlugin = {
      id: "test-section",
      name: "테스트 섹션",
      order: 10,
      shouldRender: () => true,
      render: () => "<div>test</div>",
    };
    registerSection(plugin);
    expect(getRegisteredSections()).toHaveLength(1);
    expect(getRegisteredSections()[0].id).toBe("test-section");
  });

  it("플러그인이 order 순으로 정렬되어야 함", () => {
    registerSection({
      id: "second",
      name: "두번째",
      order: 20,
      shouldRender: () => true,
      render: () => "",
    });
    registerSection({
      id: "first",
      name: "첫번째",
      order: 5,
      shouldRender: () => true,
      render: () => "",
    });
    registerSection({
      id: "third",
      name: "세번째",
      order: 30,
      shouldRender: () => true,
      render: () => "",
    });

    const sections = getRegisteredSections();
    expect(sections[0].id).toBe("first");
    expect(sections[1].id).toBe("second");
    expect(sections[2].id).toBe("third");
  });

  it("clearRegistry가 모든 플러그인을 제거해야 함", () => {
    registerSection({
      id: "temp",
      name: "임시",
      order: 1,
      shouldRender: () => true,
      render: () => "",
    });
    expect(getRegisteredSections()).toHaveLength(1);
    clearRegistry();
    expect(getRegisteredSections()).toHaveLength(0);
  });

  it("shouldRender가 false면 렌더링하지 않아야 함", () => {
    const plugin: SectionPlugin = {
      id: "conditional",
      name: "조건부",
      order: 1,
      shouldRender: (ctx) => ctx.score > 50,
      render: () => "<div>high score</div>",
    };
    registerSection(plugin);

    const lowCtx = { score: 30 } as ReportContext;
    const highCtx = { score: 80 } as ReportContext;

    expect(plugin.shouldRender(lowCtx)).toBe(false);
    expect(plugin.shouldRender(highCtx)).toBe(true);
  });
});

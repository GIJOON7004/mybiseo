/**
 * 새 4개 탭 기능 테스트
 * - HospitalInfoTab (병원 정보 관리)
 * - DiagnosisTab (진단 보고서 대시보드)
 * - ConsultationStatsTab (상담 현황 대시보드)
 * - CrmTab (상담 CRM)
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { readRouterSource } from "./test-helpers";

function readPage(name: string): string {
  return readFileSync(
    resolve(__dirname, `../client/src/pages/${name}.tsx`),
    "utf-8"
  );
}

function readRouter(): string {
  return readRouterSource();
}

// ─── CrmTab 테스트 ───────────────────────────────────────
describe("CrmTab - 상담 CRM 탭", () => {
  const code = readPage("CrmTab");

  it("should import trpc for API calls", () => {
    expect(code).toContain('import { trpc }');
  });

  it("should use crm.pipeline query", () => {
    expect(code).toContain("trpc.crm.pipeline.useQuery()");
  });

  it("should use crm.list query", () => {
    expect(code).toContain("trpc.crm.list.useQuery(");
  });

  it("should have updateStatus mutation", () => {
    expect(code).toContain("trpc.crm.updateStatus.useMutation(");
  });

  it("should have updateNote mutation", () => {
    expect(code).toContain("trpc.crm.updateNote.useMutation(");
  });

  it("should access pipeline as object (not array)", () => {
    expect(code).toContain("pipeline?.total");
    expect(code).toContain("pipeline[status]");
  });

  it("should have status filter functionality", () => {
    expect(code).toContain("filterStatus");
    expect(code).toContain("setFilterStatus");
  });

  it("should have all 4 status types", () => {
    expect(code).toContain('"pending"');
    expect(code).toContain('"contacted"');
    expect(code).toContain('"completed"');
    expect(code).toContain('"cancelled"');
  });

  it("should have note editing capability", () => {
    expect(code).toContain("noteText");
    expect(code).toContain("setNoteText");
    expect(code).toContain("메모 저장");
  });

  it("should have expandable detail view", () => {
    expect(code).toContain("expandedId");
    expect(code).toContain("isExpanded");
  });
});

// ─── ConsultationStatsTab 테스트 ───────────────────────────
describe("ConsultationStatsTab - 상담 현황 대시보드 탭", () => {
  const code = readPage("ConsultationStatsTab");

  it("should import trpc for API calls", () => {
    expect(code).toContain('import { trpc }');
  });

  it("should use crm.pipeline query", () => {
    expect(code).toContain("trpc.crm.pipeline.useQuery()");
  });

  it("should use crm.list query for recent items", () => {
    expect(code).toContain("trpc.crm.list.useQuery(");
  });

  it("should access pipeline as object (not array)", () => {
    expect(code).toContain("pipeline.total");
    expect(code).toContain("pipeline.pending");
    expect(code).toContain("pipeline.contacted");
    expect(code).toContain("pipeline.completed");
    expect(code).toContain("pipeline.cancelled");
  });

  it("should calculate conversion rate", () => {
    expect(code).toContain("conversionRate");
  });

  it("should have pipeline visualization", () => {
    expect(code).toContain("상담 파이프라인");
  });

  it("should have recent consultation list", () => {
    expect(code).toContain("최근 상담 문의");
  });

  it("should have stat cards", () => {
    expect(code).toContain("전체 문의");
    expect(code).toContain("대기 중");
    expect(code).toContain("상담 중");
    expect(code).toContain("상담 완료");
  });
});

// ─── DiagnosisTab 테스트 ───────────────────────────────────
describe("DiagnosisTab - 진단 보고서 대시보드 탭", () => {
  const code = readPage("DiagnosisTab");

  it("should import trpc for API calls", () => {
    expect(code).toContain('import { trpc }');
  });

  it("should use myHospital.diagnosisHistory query", () => {
    expect(code).toContain("trpc.myHospital.diagnosisHistory.useQuery()");
  });

  it("should parse categoryScores JSON", () => {
    expect(code).toContain("categoryScores");
    expect(code).toContain("JSON.parse");
  });

  it("should use diagnosedAt for trend data labels", () => {
    expect(code).toContain("d.diagnosedAt");
    expect(code).toContain("getMonth");
  });

  it("should show score circle with grade", () => {
    expect(code).toContain("ScoreCircle");
    expect(code).toContain("getGrade");
  });

  it("should show AI exposure score", () => {
    expect(code).toContain("AI 노출 점수");
    expect(code).toContain("aiScore");
  });

  it("should have trend chart", () => {
    expect(code).toContain("TrendChart");
    expect(code).toContain("점수 변화 추이");
  });

  it("should show improvement recommendations", () => {
    expect(code).toContain("개선 추천 영역");
    expect(code).toContain("failedCategories");
  });

  it("should show empty state when no diagnosis", () => {
    expect(code).toContain("아직 진단 보고서가 없습니다");
  });

  it("should show category-specific bar charts", () => {
    expect(code).toContain("SimpleBar");
    expect(code).toContain("영역별 분석");
  });
});

// ─── HospitalInfoTab 테스트 ───────────────────────────────
describe("HospitalInfoTab - 병원 정보 관리 탭", () => {
  const code = readPage("HospitalInfoTab");

  it("should import trpc for API calls", () => {
    expect(code).toContain('import { trpc }');
  });

  it("should use hospitalInfo.list query", () => {
    expect(code).toContain("trpc.hospitalInfo.list.useQuery(");
  });

  it("should have create mutation", () => {
    expect(code).toContain("trpc.hospitalInfo.create.useMutation(");
  });

  it("should have update mutation", () => {
    expect(code).toContain("trpc.hospitalInfo.update.useMutation(");
  });

  it("should have delete mutation", () => {
    expect(code).toContain("trpc.hospitalInfo.delete.useMutation(");
  });

  it("should have all 5 categories", () => {
    expect(code).toContain('"price"');
    expect(code).toContain('"hours"');
    expect(code).toContain('"event"');
    expect(code).toContain('"faq"');
    expect(code).toContain('"notice"');
  });

  it("should have category labels", () => {
    expect(code).toContain("가격표");
    expect(code).toContain("진료시간");
    expect(code).toContain("이벤트");
    expect(code).toContain("자주 묻는 질문");
    expect(code).toContain("공지사항");
  });

  it("should have add form", () => {
    expect(code).toContain("isAdding");
    expect(code).toContain("항목 추가");
    expect(code).toContain("handleAdd");
  });

  it("should have edit functionality", () => {
    expect(code).toContain("editingId");
    expect(code).toContain("startEdit");
    expect(code).toContain("cancelEdit");
  });

  it("should have delete confirmation", () => {
    expect(code).toContain("정말 삭제하시겠습니까?");
  });
});

// ─── 서버 라우터 테스트 ───────────────────────────────────
describe("Server Router - 새 프로시저 확인", () => {
  const code = readRouter();

  it("should have myHospital.diagnosisHistory procedure", () => {
    expect(code).toContain("diagnosisHistory: protectedProcedure");
    expect(code).toContain("getDiagnosisHistoryByUrl(profile.hospitalUrl");
  });

  it("should have hospitalInfo router with CRUD", () => {
    expect(code).toContain("hospitalInfo: router({");
    expect(code).toContain("getHospitalInfoItems");
    expect(code).toContain("createHospitalInfoItem");
    expect(code).toContain("updateHospitalInfoItem");
    expect(code).toContain("deleteHospitalInfoItem");
  });

  it("should have crm router with pipeline and list", () => {
    expect(code).toContain("crm: router({");
    expect(code).toContain("getConsultationPipeline");
    expect(code).toContain("getRecentConsultations");
  });

  it("should have crm.updateStatus mutation", () => {
    expect(code).toContain("updateStatus: protectedProcedure");
    expect(code).toContain('z.enum(["pending", "contacted", "completed", "cancelled"])');
  });

  it("should have crm.updateNote mutation", () => {
    expect(code).toContain("updateNote: protectedProcedure");
    expect(code).toContain("updateConsultationNote");
  });
});

// ─── MyHospital 통합 테스트 ───────────────────────────────
describe("MyHospital - 탭 통합 확인", () => {
  const code = readFileSync(
    resolve(__dirname, "../client/src/pages/MyHospital.tsx"),
    "utf-8"
  );

  it("should import all 4 new tab components", () => {
    expect(code).toContain('import HospitalInfoTab from');
    expect(code).toContain('import DiagnosisTab from');
    expect(code).toContain('import ConsultationStatsTab from');
    expect(code).toContain('import CrmTab from');
  });

  it("should have tab triggers for new tabs", () => {
    expect(code).toContain('value="hospital-info"');
    expect(code).toContain('value="diagnosis"');
    expect(code).toContain('value="consultation-stats"');
    expect(code).toContain('value="crm"');
  });

  it("should render new tab components in TabsContent", () => {
    expect(code).toContain("<HospitalInfoTab />");
    expect(code).toContain("<DiagnosisTab />");
    expect(code).toContain("<ConsultationStatsTab />");
    expect(code).toContain("<CrmTab />");
  });

  it("should have tab labels", () => {
    expect(code).toContain("병원 정보");
    expect(code).toContain("진단 보고서");
    expect(code).toContain("상담 현황");
    expect(code).toContain("CRM");
  });
});

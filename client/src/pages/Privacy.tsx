import { useEffect } from "react";
import Navbar from "@/components/Navbar";

export default function Privacy() {
  useEffect(() => {
    document.title = "개인정보처리방침 | 마이비서(MY비서)";
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-8">개인정보처리방침</h1>
        <p className="text-muted-foreground mb-8">
          시행일: 2026년 5월 9일 | 최종 수정일: 2026년 5월 9일
        </p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">1. 개인정보의 처리 목적</h2>
            <p className="text-muted-foreground leading-relaxed">
              마이비서(MY비서, 이하 "회사")는 다음의 목적을 위하여 개인정보를 처리합니다.
              처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며,
              이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li>서비스 제공: AI 가시성 진단, 마케팅 컨설팅, 웹사이트 구축 등 서비스 이행</li>
              <li>상담 및 문의 처리: 고객 상담, 문의 접수 및 회신</li>
              <li>마케팅 활용 (선택 동의 시): 신규 서비스 안내, 이벤트 정보 제공</li>
              <li>서비스 개선: 이용 통계 분석, 서비스 품질 향상</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">2. 수집하는 개인정보 항목</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border text-sm">
                <thead>
                  <tr className="bg-muted/30">
                    <th className="border border-border px-4 py-2 text-left">구분</th>
                    <th className="border border-border px-4 py-2 text-left">수집 항목</th>
                    <th className="border border-border px-4 py-2 text-left">수집 방법</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr>
                    <td className="border border-border px-4 py-2">AI 진단 서비스</td>
                    <td className="border border-border px-4 py-2">병원명, 웹사이트 URL, 진료과, 지역, 이메일</td>
                    <td className="border border-border px-4 py-2">진단 폼 입력</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-4 py-2">상담 신청</td>
                    <td className="border border-border px-4 py-2">병원명, 담당자명, 연락처(전화/이메일), 문의 내용</td>
                    <td className="border border-border px-4 py-2">상담 폼 입력</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-4 py-2">뉴스레터 구독</td>
                    <td className="border border-border px-4 py-2">이메일, 병원명(선택), 진료과(선택)</td>
                    <td className="border border-border px-4 py-2">구독 폼 입력</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-4 py-2">자동 수집</td>
                    <td className="border border-border px-4 py-2">접속 IP, 브라우저 정보, 방문 일시, 서비스 이용 기록</td>
                    <td className="border border-border px-4 py-2">서비스 이용 시 자동 생성</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">3. 개인정보의 보유 및 이용 기간</h2>
            <p className="text-muted-foreground leading-relaxed">
              회사는 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.
              단, 관계 법령에 의해 보존할 필요가 있는 경우 해당 법령에서 정한 기간 동안 보관합니다.
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li>상담 및 서비스 이용 기록: 서비스 종료 후 3년 (전자상거래법)</li>
              <li>계약 또는 청약철회 기록: 5년 (전자상거래법)</li>
              <li>접속 로그 기록: 3개월 (통신비밀보호법)</li>
              <li>마케팅 동의 정보: 동의 철회 시까지</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">4. 개인정보의 제3자 제공</h2>
            <p className="text-muted-foreground leading-relaxed">
              회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.
              다만, 다음의 경우에는 예외로 합니다.
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li>이용자가 사전에 동의한 경우</li>
              <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">5. 개인정보의 파기 절차 및 방법</h2>
            <p className="text-muted-foreground leading-relaxed">
              회사는 개인정보 보유 기간의 경과, 처리 목적 달성 등 개인정보가 불필요하게 되었을 때에는
              지체 없이 해당 개인정보를 파기합니다.
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li>전자적 파일: 복구 불가능한 방법으로 영구 삭제</li>
              <li>종이 문서: 분쇄기로 분쇄 또는 소각</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">6. 정보주체의 권리와 행사 방법</h2>
            <p className="text-muted-foreground leading-relaxed">
              이용자는 개인정보주체로서 다음과 같은 권리를 행사할 수 있습니다.
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li>개인정보 열람 요구</li>
              <li>오류 등이 있을 경우 정정 요구</li>
              <li>삭제 요구</li>
              <li>처리 정지 요구</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              위 권리 행사는 이메일(cjw7004@naver.com) 또는 전화(010-7321-7004)로 연락하시면
              지체 없이 조치하겠습니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">7. 개인정보의 안전성 확보 조치</h2>
            <p className="text-muted-foreground leading-relaxed">
              회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li>관리적 조치: 내부 관리 계획 수립, 정기적 직원 교육</li>
              <li>기술적 조치: 개인정보 암호화, 접근 권한 관리, 보안 프로그램 설치</li>
              <li>물리적 조치: 전산실 접근 통제</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">8. 쿠키(Cookie)의 사용</h2>
            <p className="text-muted-foreground leading-relaxed">
              회사는 이용자에게 맞춤 서비스를 제공하기 위해 쿠키를 사용합니다.
              쿠키는 웹사이트 운영에 이용되는 서버가 이용자의 브라우저에 보내는 소량의 정보로,
              이용자의 컴퓨터 하드디스크에 저장됩니다.
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li>사용 목적: 로그인 상태 유지, 이용 패턴 분석, 서비스 개선</li>
              <li>쿠키 거부 방법: 브라우저 설정에서 쿠키 허용/차단 설정 가능</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">9. 개인정보 보호책임자</h2>
            <div className="bg-muted/20 rounded-lg p-6 text-muted-foreground">
              <p><strong>성명:</strong> 최지원</p>
              <p><strong>직위:</strong> 대표</p>
              <p><strong>이메일:</strong> cjw7004@naver.com</p>
              <p><strong>전화:</strong> 010-7321-7004</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">10. 개인정보 처리방침 변경</h2>
            <p className="text-muted-foreground leading-relaxed">
              이 개인정보처리방침은 2026년 5월 9일부터 적용됩니다.
              변경 사항이 있을 경우 웹사이트를 통해 공지합니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">11. 권익침해 구제 방법</h2>
            <p className="text-muted-foreground leading-relaxed">
              개인정보 침해로 인한 구제를 받기 위해 아래 기관에 분쟁 해결이나 상담을 신청할 수 있습니다.
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li>개인정보분쟁조정위원회: 1833-6972 (www.kopico.go.kr)</li>
              <li>개인정보침해신고센터: 118 (privacy.kisa.or.kr)</li>
              <li>대검찰청 사이버수사과: 1301 (www.spo.go.kr)</li>
              <li>경찰청 사이버안전국: 182 (ecrm.police.go.kr)</li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}

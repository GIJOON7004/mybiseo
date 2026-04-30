/*
 * v10: CEO 섹션 — 담담하고 간결한 파트너 톤
 * 글씨 크기/색/볼드 최소화, "연락주세요" → "파트너가 되고 싶다" 톤
 */
import { FadeInSection } from "@/components/FadeInSection";
import { Heart } from "lucide-react";

const CEO_PHOTO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663332229201/S97tugqt5Veqs3zDXgMceg/ceo-photo-new_7d2c97cb.jpeg";

export default function CEOSection() {
  return (
    <section id="ceo" className="py-10 lg:py-14">
      <div className="container">
        <div className="max-w-2xl mx-auto">
          <FadeInSection delay={0}>
            <div className="p-6 sm:p-10 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-8">
                <Heart className="w-4 h-4 text-brand" />
                <span className="text-xs text-brand font-medium">원장님께 드리는 편지</span>
              </div>

              {/* 대표 사진 + 이름 */}
              <div className="flex items-center gap-5 mb-8">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden shrink-0 ring-2 ring-brand/20">
                  <img
                    src={CEO_PHOTO}
                    alt="마이비서 대표 조종우"
                    className="w-full h-full object-cover object-center"
                  />
                </div>
                <div>
                  <p className="font-display font-semibold text-lg text-foreground">
                    마이비서 대표 조종우
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    11년차 경영자 · AI 엔지니어
                  </p>
                  <p className="text-xs text-muted-foreground/80 mt-1.5">
                    직접 운영한 회사 누적 매출 200억 원
                  </p>
                </div>
              </div>

              {/* 본문 — 담담한 톤, 강조 최소화 */}
              <div className="space-y-5 text-[14px] sm:text-[15px] text-foreground/80 leading-[1.9]">
                <p>안녕하세요, 마이비서 대표 조종우입니다.</p>

                <p>
                  저는 마케팅 대행사 직원 출신이 아닙니다.<br />
                  11년간 직접 대표로서 회사를 경영해 온 사람입니다.
                </p>

                <blockquote className="pl-4 border-l-2 border-border/60 space-y-3 text-foreground/60">
                  <p>
                    매달 나가는 고정비,<br />
                    고민되는 비수기 매출.
                  </p>
                  <p>
                    마케팅 대행사에 맡겼는데<br />
                    수치는 올랐다고 하지만<br />
                    실제 매출은 체감이 안 되는 답답함.
                  </p>
                  <p>
                    전부 제가 매일 해온 고민입니다.
                  </p>
                </blockquote>

                <p>
                  그래서 최저 비용으로 최고 효율을 내는 마케팅을<br />
                  누구보다 치열하게 연구해 왔고,<br />
                  그 결과 누적 매출 200억 원을 만들 수 있었습니다.
                </p>

                <p>
                  원장님의 고민을 제가 잘 아는 이유는 간단합니다.<br />
                  저도 회사를 운영하는 대표이기 때문입니다.
                </p>

                <p>
                  단순히 홈페이지를 만들어주는 업체가 아닙니다.<br />
                  네이버·구글은 물론, ChatGPT·Gemini 같은<br />
                  AI 답변에서도 병원이 노출되도록<br />
                  숫자와 결과를 함께 만들어가는 파트너가 되고 싶습니다.
                </p>

                <div className="pt-5 border-t border-border/40">
                  <p className="text-foreground/90">
                    마이비서 대표 조종우 드림
                  </p>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    010-7321-7004 · cjw7004@naver.com
                  </p>
                </div>
              </div>
            </div>
          </FadeInSection>
        </div>
      </div>
    </section>
  );
}

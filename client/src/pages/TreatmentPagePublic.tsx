import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { Shield, Clock, Star, Heart, Zap, CheckCircle, Award, Users, Phone, MessageCircle, ChevronDown, ChevronUp, ArrowRight, Sparkles, Target, Eye, Syringe, Stethoscope, Activity, TrendingUp, Layers, Gem, Leaf, Sun, Moon, Droplets, Flame, Wind, Brain, Smile, ThumbsUp, BadgeCheck, CircleDot, MapPin } from "lucide-react";

const iconMap: Record<string, any> = {
  shield: Shield, clock: Clock, star: Star, heart: Heart, zap: Zap,
  "check-circle": CheckCircle, award: Award, users: Users, sparkles: Sparkles,
  target: Target, eye: Eye, syringe: Syringe, stethoscope: Stethoscope,
  activity: Activity, "trending-up": TrendingUp, layers: Layers, gem: Gem,
  leaf: Leaf, sun: Sun, moon: Moon, droplets: Droplets, flame: Flame,
  wind: Wind, brain: Brain, smile: Smile, "thumbs-up": ThumbsUp,
  "badge-check": BadgeCheck, "circle-dot": CircleDot, "map-pin": MapPin,
  phone: Phone, "message-circle": MessageCircle, "arrow-right": ArrowRight,
};

function getIcon(name: string) {
  const Icon = iconMap[name?.toLowerCase()] || Star;
  return Icon;
}

// ===== Hero Section =====
function HeroSection({ page }: { page: any }) {
  const color = page.themeColor || "#6B46C1";
  return (
    <section className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${color}08 0%, ${color}15 50%, ${color}05 100%)` }}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-10" style={{ background: color }} />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full opacity-5" style={{ background: color }} />
      </div>
      <div className="relative max-w-5xl mx-auto px-4 py-20 md:py-28 text-center">
        {page.hospitalName && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-6" style={{ background: `${color}15`, color }}>
            {page.hospitalLogo ? <img src={page.hospitalLogo} alt="" className="w-5 h-5 rounded-full" /> : <Sparkles className="w-4 h-4" />}
            {page.hospitalName}
          </div>
        )}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight tracking-tight">
          {page.heroTitle || page.treatmentName}
        </h1>
        {page.heroSubtitle && (
          <p className="text-lg md:text-xl font-medium mb-4" style={{ color }}>{page.heroSubtitle}</p>
        )}
        {page.heroDescription && (
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed">{page.heroDescription}</p>
        )}
        <div className="flex flex-wrap justify-center gap-3">
          {page.ctaPhone && (
            <a href={`tel:${page.ctaPhone}`} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium shadow-lg hover:shadow-xl transition-all" style={{ background: color }}>
              <Phone className="w-4 h-4" /> 전화 상담
            </a>
          )}
          {page.ctaKakao && (
            <a href={page.ctaKakao} target="_blank" rel="noopener" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium border-2 transition-all hover:shadow-md" style={{ borderColor: color, color }}>
              <MessageCircle className="w-4 h-4" /> 카카오 상담
            </a>
          )}
          {!page.ctaPhone && !page.ctaKakao && (
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium shadow-lg" style={{ background: color }}>
              <Phone className="w-4 h-4" /> 상담 및 예약문의
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ===== Feature Section =====
function FeatureSection({ section, color, index }: { section: any; color: string; index: number }) {
  return (
    <section className={`py-16 md:py-24 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold tracking-widest uppercase mb-2" style={{ color }}>{section.subtitle}</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{section.title}</h2>
        </div>
        <div className="space-y-16">
          {section.items?.map((item: any, i: number) => {
            const Icon = getIcon(item.icon);
            const isReversed = i % 2 === 1;
            return (
              <div key={i} className={`flex flex-col ${isReversed ? "md:flex-row-reverse" : "md:flex-row"} items-center gap-8 md:gap-12`}>
                <div className="w-full md:w-1/2">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-white text-sm font-bold" style={{ background: color }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm font-medium uppercase tracking-wider" style={{ color }}>Feature {String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed text-base md:text-lg">{item.description}</p>
                </div>
                <div className="w-full md:w-1/2 flex justify-center">
                  <div className="w-48 h-48 md:w-56 md:h-56 rounded-3xl flex items-center justify-center" style={{ background: `${color}10` }}>
                    <Icon className="w-20 h-20 md:w-24 md:h-24" style={{ color }} strokeWidth={1} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ===== Comparison Section =====
function ComparisonSection({ section, color }: { section: any; color: string }) {
  if (!section.items || section.items.length < 2) return null;
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold tracking-widest uppercase mb-2" style={{ color }}>{section.subtitle}</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{section.title}</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {section.items.map((item: any, i: number) => {
            const Icon = getIcon(item.icon);
            return (
              <div key={i} className="rounded-2xl border-2 p-8 hover:shadow-lg transition-all" style={{ borderColor: i === 0 ? color : "#e5e7eb" }}>
                {i === 0 && <div className="text-xs font-bold uppercase tracking-wider mb-3 px-3 py-1 rounded-full inline-block text-white" style={{ background: color }}>RECOMMENDED</div>}
                <div className="flex items-center gap-3 mb-4">
                  <Icon className="w-8 h-8" style={{ color: i === 0 ? color : "#6b7280" }} />
                  <h3 className="text-xl font-bold text-gray-900">{item.title}</h3>
                </div>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ===== Benefits Section =====
function BenefitsSection({ section, color }: { section: any; color: string }) {
  const half = Math.ceil((section.items?.length || 0) / 2);
  const benefits = section.items?.slice(0, half) || [];
  const targets = section.items?.slice(half) || [];
  return (
    <section className="py-16 md:py-24 bg-gray-50/50">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold tracking-widest uppercase mb-2" style={{ color }}>{section.subtitle}</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{section.title}</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="rounded-2xl p-8" style={{ background: `${color}08` }}>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color }}>
              <CheckCircle className="w-5 h-5" /> 장점
            </h3>
            <div className="space-y-4">
              {benefits.map((item: any, i: number) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-white text-xs font-bold" style={{ background: color }}>{i + 1}</div>
                  <div>
                    <p className="font-semibold text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border-2 border-dashed p-8" style={{ borderColor: `${color}40` }}>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color }}>
              <Target className="w-5 h-5" /> 추천 대상
            </h3>
            <div className="space-y-4">
              {targets.map((item: any, i: number) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color }} />
                  <div>
                    <p className="font-semibold text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ===== Process Section =====
function ProcessSection({ section, color }: { section: any; color: string }) {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold tracking-widest uppercase mb-2" style={{ color }}>{section.subtitle}</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{section.title}</h2>
        </div>
        <div className="relative">
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5" style={{ background: `${color}20` }} />
          <div className="space-y-8 md:space-y-12">
            {section.items?.map((item: any, i: number) => {
              const Icon = getIcon(item.icon);
              const isLeft = i % 2 === 0;
              return (
                <div key={i} className={`relative flex flex-col ${isLeft ? "md:flex-row" : "md:flex-row-reverse"} items-center gap-4 md:gap-8`}>
                  <div className={`w-full md:w-5/12 ${isLeft ? "md:text-right" : "md:text-left"}`}>
                    <div className={`inline-flex items-center gap-2 mb-2 ${isLeft ? "md:flex-row-reverse" : ""}`}>
                      <span className="text-xs font-bold tracking-wider" style={{ color }}>STEP {String(i + 1).padStart(2, "0")}</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                  <div className="relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ background: color }}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="w-full md:w-5/12" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// ===== FAQ Section =====
function FAQSection({ section, color }: { section: any; color: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <section className="py-16 md:py-24 bg-gray-50/50" id="faq" itemScope itemType="https://schema.org/FAQPage">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold tracking-widest uppercase mb-2" style={{ color }}>{section.subtitle}</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{section.title}</h2>
        </div>
        <div className="space-y-3">
          {section.items?.map((item: any, i: number) => (
            <div key={i} className="rounded-xl border bg-white overflow-hidden" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
              <button onClick={() => setOpenIndex(openIndex === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors">
                <h3 className="font-semibold text-gray-900 pr-4 text-base" itemProp="name">{item.title}</h3>
                {openIndex === i ? <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${openIndex === i ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`} itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                <div className="px-5 pb-5 text-gray-600 leading-relaxed border-t pt-4" itemProp="text">{item.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===== Doctor Section =====
function DoctorSection({ section, page, color }: { section: any; page: any; color: string }) {
  const doctor = section.items?.[0];
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold tracking-widest uppercase mb-2" style={{ color }}>{section.subtitle}</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{section.title}</h2>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 max-w-3xl mx-auto">
          <div className="w-40 h-40 md:w-48 md:h-48 rounded-3xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}10` }}>
            {page.doctorImageUrl ? (
              <img src={page.doctorImageUrl} alt={page.doctorName || ""} className="w-full h-full rounded-3xl object-cover" />
            ) : (
              <Stethoscope className="w-20 h-20" style={{ color }} strokeWidth={1} />
            )}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{page.doctorName || doctor?.title || "전문 의료진"}</h3>
            <p className="text-base mb-4" style={{ color }}>{page.doctorTitle || doctor?.label || ""}</p>
            <p className="text-gray-600 leading-relaxed">{doctor?.description || ""}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ===== CTA Section =====
function CTASection({ page, color }: { page: any; color: string }) {
  return (
    <section className="py-16 md:py-24" style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)` }}>
      <div className="max-w-3xl mx-auto px-4 text-center text-white">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">상담 및 예약</h2>
        <p className="text-lg opacity-90 mb-8">궁금하신 점이 있으시면 편하게 문의해 주세요.</p>
        <div className="flex flex-wrap justify-center gap-4">
          {page.ctaPhone && (
            <a href={`tel:${page.ctaPhone}`} className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white font-bold text-lg shadow-lg hover:shadow-xl transition-all" style={{ color }}>
              <Phone className="w-5 h-5" /> {page.ctaPhone}
            </a>
          )}
          {page.ctaKakao && (
            <a href={page.ctaKakao} target="_blank" rel="noopener" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-white/30 font-bold text-lg hover:bg-white/10 transition-all text-white">
              <MessageCircle className="w-5 h-5" /> 카카오 상담
            </a>
          )}
          {page.ctaNaver && (
            <a href={page.ctaNaver} target="_blank" rel="noopener" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-white/30 font-bold text-lg hover:bg-white/10 transition-all text-white">
              <MapPin className="w-5 h-5" /> 네이버 예약
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

// ===== Footer =====
function PageFooter({ page, color }: { page: any; color: string }) {
  return (
    <footer className="py-8 bg-gray-900 text-gray-400 text-center text-sm">
      <p>{page.hospitalName || "MY비서"}</p>
      <p className="mt-1 text-xs">Powered by MY비서 - 글로벌 의료 마케팅 플랫폼</p>
    </footer>
  );
}

// ===== Section Router =====
function SectionRenderer({ section, page, color, index }: { section: any; page: any; color: string; index: number }) {
  switch (section.type) {
    case "feature": return <FeatureSection section={section} color={color} index={index} />;
    case "comparison": return <ComparisonSection section={section} color={color} />;
    case "benefits": return <BenefitsSection section={section} color={color} />;
    case "process": return <ProcessSection section={section} color={color} />;
    case "faq": return <FAQSection section={section} color={color} />;
    case "doctor": return <DoctorSection section={section} page={page} color={color} />;
    case "cta": return <CTASection page={page} color={color} />;
    default: return null;
  }
}

// ===== Main Page =====
export default function TreatmentPagePublic() {
  const { slug } = useParams<{ slug: string }>();
  const { data: page, isLoading } = trpc.treatmentPage.getBySlug.useQuery(
    { slug: slug || "" },
    { enabled: !!slug }
  );

  useEffect(() => {
    if (!page) return;
    // SEO title
    if (page.seoTitle) document.title = page.seoTitle;
    // Meta description
    const setMeta = (name: string, content: string, attr = "name") => {
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    if (page.seoDescription) {
      setMeta("description", page.seoDescription);
      setMeta("og:description", page.seoDescription, "property");
    }
    if (page.seoTitle) setMeta("og:title", page.seoTitle, "property");
    setMeta("og:type", "article", "property");
    if (page.seoKeywords) setMeta("keywords", page.seoKeywords);
    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) { canonical = document.createElement("link"); canonical.setAttribute("rel", "canonical"); document.head.appendChild(canonical); }
    canonical.href = window.location.href;

    // Schema.org MedicalProcedure JSON-LD
    const faqSection = (page.sections as any[])?.find((s: any) => s.type === "faq");
    const schemaData: any[] = [
      {
        "@context": "https://schema.org",
        "@type": "MedicalProcedure",
        "name": page.treatmentName,
        "description": page.seoDescription || page.heroDescription,
        ...(page.hospitalName && { "location": { "@type": "MedicalClinic", "name": page.hospitalName } }),
        ...(page.doctorName && { "performer": { "@type": "Physician", "name": page.doctorName, ...(page.doctorTitle && { "jobTitle": page.doctorTitle }) } }),
      }
    ];
    // FAQPage schema for AEO
    if (faqSection?.items?.length) {
      schemaData.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqSection.items.map((item: any) => ({
          "@type": "Question",
          "name": item.title,
          "acceptedAnswer": { "@type": "Answer", "text": item.description }
        }))
      });
    }
    let scriptEl = document.getElementById("aeo-schema-ld") as HTMLScriptElement;
    if (!scriptEl) { scriptEl = document.createElement("script"); scriptEl.id = "aeo-schema-ld"; scriptEl.type = "application/ld+json"; document.head.appendChild(scriptEl); }
    scriptEl.textContent = JSON.stringify(schemaData);

    return () => { scriptEl?.remove(); canonical?.remove(); };
  }, [page]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">페이지를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-300 mb-4">404</h1>
          <p className="text-gray-500">페이지를 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  if (page.status !== "published") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-400 mb-2">준비 중</h1>
          <p className="text-gray-500">이 페이지는 아직 공개되지 않았습니다.</p>
        </div>
      </div>
    );
  }

  const color = page.themeColor || "#6B46C1";
  const sections = (page.sections as any[]) || [];

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif" }}>
      <HeroSection page={page} />
      {sections.map((section, i) => (
        <SectionRenderer key={i} section={section} page={page} color={color} index={i} />
      ))}
      {!sections.find(s => s.type === "cta") && <CTASection page={page} color={color} />}
      <PageFooter page={page} color={color} />
    </div>
  );
}

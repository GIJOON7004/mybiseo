/**
 * 자동 웹사이트 최적화 엔진 (EXIT 로드맵 4번)
 * 진단 결과 기반으로 구체적인 수정 코드 스니펫을 자동 생성
 */

export interface OptimizationFix {
  id: string;
  category: string;
  itemName: string;
  priority: "high" | "medium" | "low";
  impact: string;
  currentIssue: string;
  fixDescription: string;
  codeSnippet: string;
  codeLanguage: "html" | "meta" | "json-ld" | "htaccess" | "robots" | "text";
  estimatedImprovement: number; // 예상 점수 향상
  difficulty: "easy" | "medium" | "hard";
  timeEstimate: string; // 예: "5분", "30분", "1시간"
}

export interface OptimizationPlan {
  url: string;
  currentScore: number;
  estimatedNewScore: number;
  totalFixes: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  fixes: OptimizationFix[];
  generatedAt: string;
}

interface SeoCheckItem {
  id: string;
  category: string;
  name: string;
  status: "pass" | "warning" | "fail" | "info";
  score: number;
  maxScore: number;
  detail: string;
  recommendation: string;
  impact: string;
}

interface SeoAnalysisResult {
  url: string;
  totalScore: number;
  grade: string;
  categories: {
    name: string;
    score: number;
    maxScore: number;
    items: SeoCheckItem[];
  }[];
}

// 항목별 자동 수정 코드 생성 규칙
const FIX_GENERATORS: Record<string, (item: SeoCheckItem, url: string) => OptimizationFix | null> = {
  "타이틀 태그 (Title Tag)": (item, url) => {
    if (item.status === "pass") return null;
    const domain = new URL(url).hostname.replace("www.", "");
    return {
      id: item.id,
      category: item.category,
      itemName: item.name,
      priority: "high",
      impact: "검색 결과 클릭률(CTR) 30~50% 향상",
      currentIssue: item.detail,
      fixDescription: "타이틀 태그를 30~60자로 최적화하고, 핵심 키워드를 앞쪽에 배치하세요.",
      codeSnippet: `<!-- 현재 문제: ${item.detail} -->
<!-- 아래 코드를 <head> 태그 안에 추가/수정하세요 -->
<title>[핵심키워드] - [병원명] | ${domain}</title>

<!-- 예시 -->
<title>강남 치과 임플란트 - OO치과의원 | 강남역 1분</title>`,
      codeLanguage: "html",
      estimatedImprovement: 3,
      difficulty: "easy",
      timeEstimate: "5분",
    };
  },

  "메타 설명 (Meta Description)": (item, url) => {
    if (item.status === "pass") return null;
    return {
      id: item.id,
      category: item.category,
      itemName: item.name,
      priority: "high",
      impact: "검색 결과 클릭률(CTR) 20~40% 향상",
      currentIssue: item.detail,
      fixDescription: "메타 설명을 70~160자로 작성하고, 행동 유도 문구를 포함하세요.",
      codeSnippet: `<!-- 아래 코드를 <head> 태그 안에 추가/수정하세요 -->
<meta name="description" content="[병원명]은 [진료과] 전문 병원입니다. [핵심 서비스]를 제공하며, [차별점]으로 환자분들의 만족도가 높습니다. 지금 무료 상담 예약하세요.">

<!-- 예시 (120자) -->
<meta name="description" content="강남 OO치과는 임플란트·치아교정 전문입니다. 20년 경력 원장 직접 진료, 무이자 할부 가능. 지금 무료 상담 예약하세요. ☎ 02-1234-5678">`,
      codeLanguage: "html",
      estimatedImprovement: 2,
      difficulty: "easy",
      timeEstimate: "5분",
    };
  },

  "H1 태그": (item, url) => {
    if (item.status === "pass") return null;
    return {
      id: item.id,
      category: item.category,
      itemName: item.name,
      priority: "high",
      impact: "검색엔진이 페이지 주제를 정확히 파악",
      currentIssue: item.detail,
      fixDescription: "페이지에 H1 태그를 정확히 1개만 사용하고, 핵심 키워드를 포함하세요.",
      codeSnippet: `<!-- H1 태그는 페이지당 1개만 사용하세요 -->
<h1>[지역] [진료과] [핵심 서비스] - [병원명]</h1>

<!-- 예시 -->
<h1>강남 치과 임플란트 전문 - OO치과의원</h1>

<!-- ❌ 잘못된 예 -->
<h1>환영합니다</h1> <!-- 키워드 없음 -->
<h1>치과</h1><h1>임플란트</h1> <!-- H1이 2개 -->`,
      codeLanguage: "html",
      estimatedImprovement: 2,
      difficulty: "easy",
      timeEstimate: "10분",
    };
  },

  "이미지 Alt 태그": (item, url) => {
    if (item.status === "pass") return null;
    return {
      id: item.id,
      category: item.category,
      itemName: item.name,
      priority: "medium",
      impact: "이미지 검색 노출 + 접근성 향상",
      currentIssue: item.detail,
      fixDescription: "모든 이미지에 설명적인 alt 태그를 추가하세요.",
      codeSnippet: `<!-- 모든 <img> 태그에 alt 속성을 추가하세요 -->

<!-- ✅ 좋은 예 -->
<img src="implant.jpg" alt="강남 OO치과 임플란트 시술 전후 비교 사진">
<img src="doctor.jpg" alt="OO치과 김OO 원장 프로필 사진">
<img src="clinic.jpg" alt="OO치과 내부 진료실 전경">

<!-- ❌ 나쁜 예 -->
<img src="implant.jpg"> <!-- alt 없음 -->
<img src="implant.jpg" alt="이미지"> <!-- 설명 없음 -->
<img src="implant.jpg" alt="img_001.jpg"> <!-- 파일명 그대로 -->`,
      codeLanguage: "html",
      estimatedImprovement: 1,
      difficulty: "easy",
      timeEstimate: "15분",
    };
  },

  "Open Graph 태그": (item, url) => {
    if (item.status === "pass") return null;
    const domain = new URL(url).hostname;
    return {
      id: item.id,
      category: item.category,
      itemName: item.name,
      priority: "medium",
      impact: "SNS 공유 시 미리보기 카드 표시 → 클릭률 향상",
      currentIssue: item.detail,
      fixDescription: "Open Graph 메타태그를 추가하여 카카오톡/페이스북 공유 시 미리보기를 최적화하세요.",
      codeSnippet: `<!-- <head> 태그 안에 아래 코드를 추가하세요 -->
<meta property="og:type" content="website">
<meta property="og:title" content="[병원명] - [핵심 서비스]">
<meta property="og:description" content="[병원 소개 + 핵심 서비스 + CTA]">
<meta property="og:image" content="https://${domain}/og-image.jpg">
<meta property="og:url" content="${url}">
<meta property="og:site_name" content="[병원명]">
<meta property="og:locale" content="ko_KR">

<!-- 카카오톡 전용 (선택) -->
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">

<!-- ⚠️ og:image는 1200x630px 권장, 파일 크기 300KB 이하 -->`,
      codeLanguage: "html",
      estimatedImprovement: 2,
      difficulty: "easy",
      timeEstimate: "10분",
    };
  },

  "구조화 데이터 (Schema.org)": (item, url) => {
    if (item.status === "pass") return null;
    const domain = new URL(url).hostname;
    return {
      id: item.id,
      category: item.category,
      itemName: item.name,
      priority: "high",
      impact: "검색 결과에 리치 스니펫 표시 → 클릭률 2~3배 향상",
      currentIssue: item.detail,
      fixDescription: "의료기관 구조화 데이터(JSON-LD)를 추가하세요. 구글이 병원 정보를 정확히 이해합니다.",
      codeSnippet: `<!-- <head> 또는 <body> 끝에 아래 JSON-LD를 추가하세요 -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "MedicalBusiness",
  "name": "[병원명]",
  "url": "${url}",
  "telephone": "+82-2-1234-5678",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "[상세주소]",
    "addressLocality": "[시/구]",
    "addressRegion": "[도/시]",
    "postalCode": "[우편번호]",
    "addressCountry": "KR"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 37.1234,
    "longitude": 127.1234
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"],
      "opens": "09:00",
      "closes": "18:00"
    }
  ],
  "medicalSpecialty": "[진료과]",
  "priceRange": "$$"
}
</script>`,
      codeLanguage: "json-ld",
      estimatedImprovement: 3,
      difficulty: "medium",
      timeEstimate: "20분",
    };
  },

  "의료기관 구조화 데이터": (item, url) => {
    if (item.status === "pass") return null;
    return {
      id: item.id,
      category: item.category,
      itemName: item.name,
      priority: "high",
      impact: "구글 지식 패널 + 리치 스니펫 노출",
      currentIssue: item.detail,
      fixDescription: "의료기관 전용 구조화 데이터를 추가하여 구글이 병원 정보를 정확히 파악하게 하세요.",
      codeSnippet: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Physician",
  "name": "[원장명]",
  "medicalSpecialty": "[전문 분야]",
  "worksFor": {
    "@type": "MedicalBusiness",
    "name": "[병원명]"
  },
  "alumniOf": "[출신 대학/병원]",
  "award": "[수상 경력]",
  "description": "[원장 소개 100자 이내]"
}
</script>`,
      codeLanguage: "json-ld",
      estimatedImprovement: 2,
      difficulty: "medium",
      timeEstimate: "15분",
    };
  },

  "robots.txt": (item, url) => {
    if (item.status === "pass") return null;
    const domain = new URL(url).hostname;
    return {
      id: item.id,
      category: item.category,
      itemName: item.name,
      priority: "high",
      impact: "검색엔진 크롤링 허용 → 인덱싱 가능",
      currentIssue: item.detail,
      fixDescription: "robots.txt 파일을 루트 디렉토리에 생성하세요.",
      codeSnippet: `# robots.txt - 웹사이트 루트(/)에 이 파일을 생성하세요
# 파일 위치: https://${domain}/robots.txt

User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /private/

# AI 크롤러 허용 (AI 인용용)
User-agent: GPTBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

# 사이트맵 위치
Sitemap: https://${domain}/sitemap.xml`,
      codeLanguage: "robots",
      estimatedImprovement: 3,
      difficulty: "easy",
      timeEstimate: "5분",
    };
  },

  "사이트맵 (sitemap.xml)": (item, url) => {
    if (item.status === "pass") return null;
    const domain = new URL(url).hostname;
    return {
      id: item.id,
      category: item.category,
      itemName: item.name,
      priority: "high",
      impact: "검색엔진이 모든 페이지를 발견 → 인덱싱 속도 향상",
      currentIssue: item.detail,
      fixDescription: "sitemap.xml 파일을 생성하고 구글 서치콘솔에 제출하세요.",
      codeSnippet: `<?xml version="1.0" encoding="UTF-8"?>
<!-- 파일 위치: https://${domain}/sitemap.xml -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://${domain}/</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://${domain}/about</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <!-- 모든 주요 페이지를 추가하세요 -->
</urlset>

<!-- 생성 후 구글 서치콘솔에서 사이트맵 제출:
1. https://search.google.com/search-console 접속
2. 사이트맵 메뉴 → URL 입력 → 제출 -->`,
      codeLanguage: "html",
      estimatedImprovement: 3,
      difficulty: "easy",
      timeEstimate: "15분",
    };
  },

  "SSL 인증서 (HTTPS)": (item, url) => {
    if (item.status === "pass") return null;
    return {
      id: item.id,
      category: item.category,
      itemName: item.name,
      priority: "high",
      impact: "보안 경고 제거 + 검색 순위 향상 (구글 공식 랭킹 요소)",
      currentIssue: item.detail,
      fixDescription: "SSL 인증서를 설치하여 HTTPS로 전환하세요. 호스팅 업체에서 무료 SSL(Let's Encrypt)을 제공합니다.",
      codeSnippet: `# 대부분의 호스팅 업체에서 무료 SSL 설치 가능합니다.

# 카페24 호스팅:
# 나의서비스관리 → 보안서버(SSL) → 무료 SSL 신청

# 가비아 호스팅:
# 서비스관리 → SSL 인증서 → Let's Encrypt 무료 발급

# AWS/클라우드:
# AWS Certificate Manager에서 무료 인증서 발급

# 설치 후 HTTP → HTTPS 리다이렉트 설정:
# .htaccess 파일에 추가
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]`,
      codeLanguage: "htaccess",
      estimatedImprovement: 3,
      difficulty: "medium",
      timeEstimate: "30분",
    };
  },

  "캐노니컬 URL (Canonical)": (item, url) => {
    if (item.status === "pass") return null;
    return {
      id: item.id,
      category: item.category,
      itemName: item.name,
      priority: "medium",
      impact: "중복 콘텐츠 문제 해결 → 검색 순위 보호",
      currentIssue: item.detail,
      fixDescription: "캐노니컬 태그를 추가하여 중복 페이지 문제를 방지하세요.",
      codeSnippet: `<!-- <head> 태그 안에 추가하세요 -->
<link rel="canonical" href="${url}">

<!-- ⚠️ 주의사항:
- 반드시 https://로 시작하는 절대 URL 사용
- 각 페이지마다 자기 자신의 URL을 canonical로 지정
- www와 non-www 중 하나로 통일 -->`,
      codeLanguage: "html",
      estimatedImprovement: 1,
      difficulty: "easy",
      timeEstimate: "5분",
    };
  },

  "AI 크롤러 접근 허용": (item, url) => {
    if (item.status === "pass") return null;
    const domain = new URL(url).hostname;
    return {
      id: item.id,
      category: item.category,
      itemName: item.name,
      priority: "high",
      impact: "ChatGPT/Gemini/Claude 등 AI 검색에서 병원 추천 가능",
      currentIssue: item.detail,
      fixDescription: "robots.txt에서 AI 크롤러 접근을 명시적으로 허용하세요.",
      codeSnippet: `# robots.txt에 아래 내용을 추가하세요
# 파일 위치: https://${domain}/robots.txt

# AI 크롤러 명시적 허용
User-agent: GPTBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Bytespider
Allow: /

# ⚠️ 일부 호스팅에서 기본적으로 AI 크롤러를 차단합니다.
# 반드시 Allow: / 로 명시적 허용이 필요합니다.`,
      codeLanguage: "robots",
      estimatedImprovement: 3,
      difficulty: "easy",
      timeEstimate: "5분",
    };
  },

  "E-E-A-T 신뢰도 신호": (item, url) => {
    if (item.status === "pass") return null;
    return {
      id: item.id,
      category: item.category,
      itemName: item.name,
      priority: "high",
      impact: "구글 E-E-A-T 평가 향상 → 의료 분야 검색 순위 직접 영향",
      currentIssue: item.detail,
      fixDescription: "의료진 정보, 자격증, 경력을 구조화된 형태로 표시하세요.",
      codeSnippet: `<!-- 의료진 소개 섹션 예시 -->
<section itemscope itemtype="https://schema.org/Physician">
  <h2>의료진 소개</h2>
  <div>
    <h3 itemprop="name">김OO 원장</h3>
    <p itemprop="description">서울대학교 치의학과 졸업, 20년 경력</p>
    <ul>
      <li itemprop="hasCredential">대한치과의사협회 정회원</li>
      <li itemprop="hasCredential">임플란트 전문의 자격</li>
      <li itemprop="award">2024 대한민국 명의 선정</li>
    </ul>
    <meta itemprop="medicalSpecialty" content="치과">
  </div>
</section>

<!-- JSON-LD로도 추가 권장 -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Physician",
  "name": "김OO",
  "medicalSpecialty": "치과",
  "alumniOf": "서울대학교 치의학과",
  "hasCredential": ["대한치과의사협회 정회원", "임플란트 전문의"]
}
</script>`,
      codeLanguage: "html",
      estimatedImprovement: 3,
      difficulty: "medium",
      timeEstimate: "30분",
    };
  },

  "FAQ (자주 묻는 질문)": (item, url) => {
    if (item.status === "pass") return null;
    return {
      id: item.id,
      category: item.category,
      itemName: item.name,
      priority: "medium",
      impact: "구글 FAQ 리치 스니펫 노출 + AI 검색 답변 소스로 활용",
      currentIssue: item.detail,
      fixDescription: "FAQ 섹션을 추가하고 FAQPage 구조화 데이터를 함께 넣으세요.",
      codeSnippet: `<!-- FAQ 섹션 HTML -->
<section>
  <h2>자주 묻는 질문</h2>
  <div>
    <h3>Q. 임플란트 비용은 얼마인가요?</h3>
    <p>A. 임플란트 비용은 개인 구강 상태에 따라 다르며, 정확한 비용은 무료 상담 후 안내드립니다.</p>
  </div>
  <div>
    <h3>Q. 치료 기간은 얼마나 걸리나요?</h3>
    <p>A. 일반적으로 3~6개월이 소요되며, 즉시 임플란트의 경우 당일 식립도 가능합니다.</p>
  </div>
</section>

<!-- FAQ 구조화 데이터 (JSON-LD) -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "임플란트 비용은 얼마인가요?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "임플란트 비용은 개인 구강 상태에 따라 다르며, 정확한 비용은 무료 상담 후 안내드립니다."
      }
    }
  ]
}
</script>`,
      codeLanguage: "html",
      estimatedImprovement: 2,
      difficulty: "easy",
      timeEstimate: "20분",
    };
  },

  "네이버 서치어드바이저 인증": (item, url) => {
    if (item.status === "pass") return null;
    return {
      id: item.id,
      category: item.category,
      itemName: item.name,
      priority: "high",
      impact: "네이버 검색 인덱싱 속도 향상 + 검색 분석 데이터 확보",
      currentIssue: item.detail,
      fixDescription: "네이버 서치어드바이저에 사이트를 등록하고 인증하세요.",
      codeSnippet: `<!-- 네이버 서치어드바이저 인증 방법 -->

<!-- 방법 1: HTML 메타태그 (가장 쉬움) -->
<!-- <head> 태그 안에 추가 -->
<meta name="naver-site-verification" content="[인증코드]">

<!-- 인증코드 받는 방법:
1. https://searchadvisor.naver.com 접속
2. 로그인 → 사이트 추가
3. 사이트 URL 입력
4. 인증 방법 선택 → HTML 태그
5. 제공된 메타태그를 <head>에 추가
6. 인증 완료 버튼 클릭 -->

<!-- 인증 후 추가 작업:
- 사이트맵 제출: 요청 → 사이트맵 제출 → URL 입력
- 수집 요청: 요청 → 웹 페이지 수집 → 메인 URL 입력 -->`,
      codeLanguage: "html",
      estimatedImprovement: 2,
      difficulty: "easy",
      timeEstimate: "10분",
    };
  },

  "AI 인용 가능 구조화 데이터": (item, url) => {
    if (item.status === "pass") return null;
    return {
      id: item.id,
      category: item.category,
      itemName: item.name,
      priority: "high",
      impact: "AI가 병원 정보를 정확히 인용 → AI 검색 추천 확률 향상",
      currentIssue: item.detail,
      fixDescription: "AI가 인용할 수 있는 구조화된 데이터를 추가하세요.",
      codeSnippet: `<!-- AI 인용 최적화 구조화 데이터 -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "MedicalBusiness",
  "name": "[병원명]",
  "description": "[병원 소개 200자]",
  "medicalSpecialty": "[진료과]",
  "availableService": [
    {
      "@type": "MedicalProcedure",
      "name": "[시술명 1]",
      "description": "[시술 설명]"
    },
    {
      "@type": "MedicalProcedure",
      "name": "[시술명 2]",
      "description": "[시술 설명]"
    }
  ],
  "review": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "150"
  }
}
</script>`,
      codeLanguage: "json-ld",
      estimatedImprovement: 2,
      difficulty: "medium",
      timeEstimate: "15분",
    };
  },

  "llms.txt (AI 전용 안내 파일)": (item, url) => {
    if (item.status === "pass") return null;
    const domain = new URL(url).hostname;
    return {
      id: item.id,
      category: item.category,
      itemName: item.name,
      priority: "medium",
      impact: "AI 모델이 병원 정보를 더 정확하게 이해",
      currentIssue: item.detail,
      fixDescription: "llms.txt 파일을 생성하여 AI에게 병원 정보를 구조화된 형태로 제공하세요.",
      codeSnippet: `# llms.txt - 웹사이트 루트에 이 파일을 생성하세요
# 파일 위치: https://${domain}/llms.txt

# [병원명]
> [병원 한줄 소개]

## 기본 정보
- 진료과: [진료과]
- 위치: [주소]
- 전화: [전화번호]
- 진료시간: 평일 09:00-18:00, 토요일 09:00-13:00

## 주요 진료 서비스
- [서비스 1]: [설명]
- [서비스 2]: [설명]
- [서비스 3]: [설명]

## 의료진
- [원장명]: [전문 분야], [경력]

## 특장점
- [차별점 1]
- [차별점 2]
- [차별점 3]`,
      codeLanguage: "text",
      estimatedImprovement: 1,
      difficulty: "easy",
      timeEstimate: "10분",
    };
  },

  "콘텐츠 텍스트 양": (item, url) => {
    if (item.status === "pass") return null;
    return {
      id: item.id,
      category: item.category,
      itemName: item.name,
      priority: "medium",
      impact: "검색엔진이 페이지 주제를 깊이 이해 → 롱테일 키워드 노출",
      currentIssue: item.detail,
      fixDescription: "메인 페이지에 최소 2,000자 이상의 유용한 콘텐츠를 추가하세요.",
      codeSnippet: `<!-- 콘텐츠 보강 가이드 -->

<!-- 1. 진료 서비스 상세 설명 (각 300자 이상) -->
<section>
  <h2>[진료과] 전문 진료 안내</h2>
  <h3>[시술명 1]</h3>
  <p>[시술 설명 - 적응증, 과정, 장점, 회복기간 등 상세히]</p>
  <h3>[시술명 2]</h3>
  <p>[시술 설명]</p>
</section>

<!-- 2. 의료진 소개 (각 200자 이상) -->
<section>
  <h2>의료진 소개</h2>
  <p>[원장 경력, 전문 분야, 학력, 수상 경력 등]</p>
</section>

<!-- 3. 환자 후기/사례 (각 100자 이상) -->
<section>
  <h2>치료 사례</h2>
  <p>[실제 치료 사례 설명]</p>
</section>

<!-- 💡 팁: 자연스러운 문장으로 작성하고, 
     키워드를 억지로 반복하지 마세요 -->`,
      codeLanguage: "html",
      estimatedImprovement: 2,
      difficulty: "medium",
      timeEstimate: "1시간",
    };
  },

  "보안 헤더 (CSP/HSTS)": (item, url) => {
    if (item.status === "pass") return null;
    return {
      id: item.id,
      category: item.category,
      itemName: item.name,
      priority: "low",
      impact: "보안 강화 + 검색엔진 신뢰도 향상",
      currentIssue: item.detail,
      fixDescription: "보안 헤더를 서버 설정에 추가하세요.",
      codeSnippet: `# .htaccess 또는 서버 설정에 추가하세요

# HSTS (HTTPS 강제)
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"

# XSS 보호
Header set X-Content-Type-Options "nosniff"
Header set X-Frame-Options "SAMEORIGIN"
Header set X-XSS-Protection "1; mode=block"

# Referrer 정책
Header set Referrer-Policy "strict-origin-when-cross-origin"

# Nginx 서버의 경우:
# add_header Strict-Transport-Security "max-age=31536000" always;
# add_header X-Content-Type-Options "nosniff" always;
# add_header X-Frame-Options "SAMEORIGIN" always;`,
      codeLanguage: "htaccess",
      estimatedImprovement: 1,
      difficulty: "medium",
      timeEstimate: "15분",
    };
  },

  "연락처/위치 정보": (item, url) => {
    if (item.status === "pass") return null;
    return {
      id: item.id,
      category: item.category,
      itemName: item.name,
      priority: "high",
      impact: "지역 검색(로컬 SEO) 순위 향상 + 환자 접근성 개선",
      currentIssue: item.detail,
      fixDescription: "연락처와 위치 정보를 구조화된 형태로 표시하세요.",
      codeSnippet: `<!-- 연락처/위치 정보 섹션 -->
<footer itemscope itemtype="https://schema.org/MedicalBusiness">
  <h2>오시는 길</h2>
  <address>
    <p itemprop="address" itemscope itemtype="https://schema.org/PostalAddress">
      <span itemprop="streetAddress">[상세주소]</span>,
      <span itemprop="addressLocality">[시/구]</span>
      <span itemprop="postalCode">[우편번호]</span>
    </p>
    <p>전화: <a href="tel:+8221234567" itemprop="telephone">02-1234-5678</a></p>
    <p>이메일: <a href="mailto:info@example.com" itemprop="email">info@example.com</a></p>
  </address>
  
  <!-- 구글 지도 임베드 -->
  <iframe src="https://www.google.com/maps/embed?pb=..." 
    width="100%" height="300" style="border:0;" 
    allowfullscreen loading="lazy">
  </iframe>
</footer>`,
      codeLanguage: "html",
      estimatedImprovement: 2,
      difficulty: "easy",
      timeEstimate: "15분",
    };
  },
};

/**
 * 진단 결과를 기반으로 자동 최적화 계획을 생성
 */
export function generateOptimizationPlan(analysisResult: SeoAnalysisResult): OptimizationPlan {
  const fixes: OptimizationFix[] = [];

  for (const category of analysisResult.categories) {
    for (const item of category.items) {
      if (item.status === "pass") continue;

      const generator = FIX_GENERATORS[item.name];
      if (generator) {
        const fix = generator(item, analysisResult.url);
        if (fix) fixes.push(fix);
      } else {
        // 제너레이터가 없는 항목은 일반적인 수정 제안 생성
        fixes.push({
          id: item.id,
          category: item.category,
          itemName: item.name,
          priority: item.impact === "높음" ? "high" : item.impact === "중간" ? "medium" : "low",
          impact: item.impact,
          currentIssue: item.detail,
          fixDescription: item.recommendation,
          codeSnippet: `/* ${item.name} 수정 필요 */\n/* ${item.recommendation} */`,
          codeLanguage: "text",
          estimatedImprovement: item.maxScore - item.score > 2 ? 2 : 1,
          difficulty: "medium",
          timeEstimate: "15분",
        });
      }
    }
  }

  // 우선순위 정렬: high → medium → low, 같은 우선순위 내에서는 예상 개선 점수 높은 순
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  fixes.sort((a, b) => {
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.estimatedImprovement - a.estimatedImprovement;
  });

  const totalImprovement = fixes.reduce((sum, f) => sum + f.estimatedImprovement, 0);
  const estimatedNewScore = Math.min(100, analysisResult.totalScore + totalImprovement);

  return {
    url: analysisResult.url,
    currentScore: analysisResult.totalScore,
    estimatedNewScore,
    totalFixes: fixes.length,
    highPriority: fixes.filter(f => f.priority === "high").length,
    mediumPriority: fixes.filter(f => f.priority === "medium").length,
    lowPriority: fixes.filter(f => f.priority === "low").length,
    fixes,
    generatedAt: new Date().toISOString(),
  };
}

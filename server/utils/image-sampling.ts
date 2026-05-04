/**
 * #16 이미지 최적화 샘플링 고정
 * 
 * 이미지가 많은 페이지에서 모든 이미지를 분석하면 시간이 오래 걸리므로
 * 크기순(파일 크기 또는 표시 크기)으로 정렬하여 상위 N개만 분석
 * 
 * 2단계에서 구현한 상위 50개 제한을 확장하여:
 * - 크기 기반 우선순위 정렬
 * - 뷰포트 내 이미지 우선
 * - 중복 이미지 제거
 */

export interface ImageInfo {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  /** 추정 파일 크기 (bytes) */
  estimatedSize?: number;
  /** 뷰포트 내 위치 여부 */
  aboveFold?: boolean;
  /** lazy loading 여부 */
  isLazy?: boolean;
}

export interface SamplingResult {
  /** 분석 대상 이미지 */
  sampled: ImageInfo[];
  /** 전체 이미지 수 */
  totalCount: number;
  /** 샘플링된 이미지 수 */
  sampledCount: number;
  /** 샘플링 비율 */
  samplingRatio: number;
}

const DEFAULT_SAMPLE_SIZE = 30;
const MAX_SAMPLE_SIZE = 50;

/**
 * 이미지 우선순위 점수 계산
 * 높을수록 분석 우선순위가 높음
 */
function calculatePriority(img: ImageInfo): number {
  let score = 0;

  // 1. 크기 기반 (큰 이미지일수록 최적화 효과 큼)
  if (img.width && img.height) {
    const area = img.width * img.height;
    score += Math.min(50, area / 10000); // 최대 50점
  }

  // 2. 추정 파일 크기 기반
  if (img.estimatedSize) {
    score += Math.min(30, img.estimatedSize / 50000); // 50KB당 1점, 최대 30점
  }

  // 3. 뷰포트 내 이미지 가점
  if (img.aboveFold) score += 20;

  // 4. lazy loading이 아닌 이미지 가점 (즉시 로딩되므로 성능 영향 큼)
  if (!img.isLazy) score += 10;

  // 5. alt 태그 없는 이미지 가점 (SEO 문제 가능성)
  if (!img.alt || img.alt.trim() === "") score += 5;

  return score;
}

/**
 * 이미지 목록에서 분석 대상을 샘플링
 */
export function sampleImages(images: ImageInfo[], sampleSize?: number): SamplingResult {
  const targetSize = Math.min(sampleSize || DEFAULT_SAMPLE_SIZE, MAX_SAMPLE_SIZE);
  const totalCount = images.length;

  if (totalCount <= targetSize) {
    return {
      sampled: images,
      totalCount,
      sampledCount: totalCount,
      samplingRatio: 1,
    };
  }

  // 중복 제거 (같은 src)
  const uniqueMap = new Map<string, ImageInfo>();
  for (const img of images) {
    const key = img.src.split("?")[0]; // 쿼리 파라미터 제거
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, img);
    }
  }
  const uniqueImages = Array.from(uniqueMap.values());

  // 우선순위 정렬
  const scored = uniqueImages.map(img => ({
    img,
    priority: calculatePriority(img),
  }));
  scored.sort((a, b) => b.priority - a.priority);

  // 상위 N개 선택
  const sampled = scored.slice(0, targetSize).map(s => s.img);

  return {
    sampled,
    totalCount,
    sampledCount: sampled.length,
    samplingRatio: sampled.length / totalCount,
  };
}

/**
 * HTML에서 이미지 정보 추출
 */
export function extractImagesFromHtml(html: string): ImageInfo[] {
  const images: ImageInfo[] = [];
  const imgRegex = /<img\s+([^>]*)>/gi;
  let match;
  let index = 0;

  while ((match = imgRegex.exec(html)) !== null) {
    const attrs = match[1];
    const src = attrs.match(/(?:src|data-src)="([^"]+)"/)?.[1] || "";
    if (!src || src.startsWith("data:")) continue; // data URI 제외

    const alt = attrs.match(/alt="([^"]*)"/)?.[1] || "";
    const width = parseInt(attrs.match(/width="(\d+)"/)?.[1] || "0") || undefined;
    const height = parseInt(attrs.match(/height="(\d+)"/)?.[1] || "0") || undefined;
    const isLazy = /loading="lazy"|data-src|data-lazy/i.test(attrs);

    images.push({
      src,
      alt,
      width,
      height,
      aboveFold: index < 5, // 처음 5개 이미지는 뷰포트 내로 추정
      isLazy,
    });
    index++;
  }

  return images;
}

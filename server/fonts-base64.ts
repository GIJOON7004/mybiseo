/**
 * 폰트 데이터 — S3에서 런타임 로드 (4.5MB 인라인 base64 제거)
 * 이전: export const krRegularBase64 = "..." (4.5MB 인라인)
 * 현재: 첫 호출 시 S3에서 fetch → Buffer 캐시
 */

const FONT_URLS = {
  krRegular: "/manus-storage/fontkr-regular_e90c5563.ttf",
  krBold: "/manus-storage/fontkr-bold_ff24055d.ttf",
  thRegular: "/manus-storage/fontth-regular_ee7a4e74.ttf",
  thBold: "/manus-storage/fontth-bold_473c38ff.ttf",
} as const;

// 캐시: 한 번 로드되면 메모리에 유지
let _fontCache: Record<string, Buffer> | null = null;

async function fetchFont(url: string): Promise<Buffer> {
  // NOTE: 서버 자기 자신에게 요청하므로 localhost 사용 (env.ts의 PORT는 없으므로 직접 참조)
  const baseUrl = `http://localhost:${process.env.PORT || 3000}`;
  const res = await fetch(`${baseUrl}${url}`);
  if (!res.ok) throw new Error(`Font fetch failed: ${url} (${res.status})`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * 폰트 버퍼를 비동기로 로드 (첫 호출 시 S3에서 fetch, 이후 캐시)
 */
export async function loadFonts(): Promise<{
  krRegular: Buffer;
  krBold: Buffer;
  thRegular: Buffer;
  thBold: Buffer;
}> {
  if (_fontCache) {
    return _fontCache as any;
  }
  const [krRegular, krBold, thRegular, thBold] = await Promise.all([
    fetchFont(FONT_URLS.krRegular),
    fetchFont(FONT_URLS.krBold),
    fetchFont(FONT_URLS.thRegular),
    fetchFont(FONT_URLS.thBold),
  ]);
  _fontCache = { krRegular, krBold, thRegular, thBold };
  return _fontCache as any;
}

// 하위 호환성: 동기 접근이 필요한 곳을 위한 deprecated export
/** @deprecated Use loadFonts() instead */
export const krRegularBase64 = "__DEPRECATED_USE_loadFonts__";
/** @deprecated Use loadFonts() instead */
export const krBoldBase64 = "__DEPRECATED_USE_loadFonts__";
/** @deprecated Use loadFonts() instead */
export const thRegularBase64 = "__DEPRECATED_USE_loadFonts__";
/** @deprecated Use loadFonts() instead */
export const thBoldBase64 = "__DEPRECATED_USE_loadFonts__";

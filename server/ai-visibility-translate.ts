/**
 * LLM-based batch translation for AI visibility report PDF.
 * Translates all dynamic text (detail, recommendation, impact) from Korean to English
 * using the built-in LLM API in a single batch call for efficiency.
 */
import { invokeLLM } from "./_core/llm";
import { translateCategoryName, translateItemName } from "./ai-visibility-i18n";

import { createLogger } from "./lib/logger";
const logger = createLogger("ai-visibility");

interface SeoCheckItem {
  id: string;
  category: string;
  name: string;
  status: "pass" | "fail" | "warning";
  score: number;
  maxScore: number;
  detail: string;
  recommendation: string;
  impact: string;
}

interface CategoryResult {
  name: string;
  score: number;
  maxScore: number;
  items: SeoCheckItem[];
}

interface SeoAnalysisResult {
  url: string;
  analyzedAt: string;
  totalScore: number;
  maxScore: number;
  grade: string;
  categories: CategoryResult[];
  summary: {
    passed: number;
    warnings: number;
    failed: number;
  };
}

/**
 * Translate all dynamic Korean text in AI visibility analysis result to English.
 * Uses LLM for accurate, context-aware translation.
 * Returns a new result object with all text translated.
 */
export async function translateResultToEnglish(
  result: SeoAnalysisResult,
): Promise<SeoAnalysisResult> {
  // Collect all unique Korean texts that need translation
  const textsToTranslate: string[] = [];
  const textIndexMap: Map<string, number> = new Map();

  function addText(text: string): number {
    if (!text || text.trim() === "") return -1;
    if (textIndexMap.has(text)) return textIndexMap.get(text)!;
    const idx = textsToTranslate.length;
    textIndexMap.set(text, idx);
    textsToTranslate.push(text);
    return idx;
  }

  // Map each item's fields to indices
  const itemFieldIndices: Array<{
    catIdx: number;
    itemIdx: number;
    detailIdx: number;
    recIdx: number;
    impactIdx: number;
  }> = [];

  for (let ci = 0; ci < result.categories.length; ci++) {
    for (let ii = 0; ii < result.categories[ci].items.length; ii++) {
      const item = result.categories[ci].items[ii];
      itemFieldIndices.push({
        catIdx: ci,
        itemIdx: ii,
        detailIdx: addText(item.detail),
        recIdx: addText(item.recommendation),
        impactIdx: addText(item.impact),
      });
    }
  }

  if (textsToTranslate.length === 0) return result;

  // Batch translate using LLM
  const translations = await batchTranslate(textsToTranslate);

  // Build translated result
  const translated: SeoAnalysisResult = {
    ...result,
    categories: result.categories.map((cat, ci) => ({
      ...cat,
      name: translateCategoryName(cat.name),
      items: cat.items.map((item, ii) => {
        const mapping = itemFieldIndices.find(
          (m) => m.catIdx === ci && m.itemIdx === ii,
        );
        if (!mapping) return { ...item, name: translateItemName(item.id, item.name) };
        return {
          ...item,
          name: translateItemName(item.id, item.name),
          detail: mapping.detailIdx >= 0 ? translations[mapping.detailIdx] || item.detail : item.detail,
          recommendation: mapping.recIdx >= 0 ? translations[mapping.recIdx] || item.recommendation : item.recommendation,
          impact: mapping.impactIdx >= 0 ? translations[mapping.impactIdx] || item.impact : item.impact,
        };
      }),
    })),
  };

  return translated;
}

/**
 * Batch translate Korean texts to English using LLM.
 * Splits into chunks if needed to stay within token limits.
 */
async function batchTranslate(texts: string[]): Promise<string[]> {
  const CHUNK_SIZE = 50; // Process 50 texts at a time
  const allTranslations: string[] = new Array(texts.length).fill("");

  // Build chunk descriptors
  const chunks: { start: number; texts: string[] }[] = [];
  for (let start = 0; start < texts.length; start += CHUNK_SIZE) {
    chunks.push({ start, texts: texts.slice(start, start + CHUNK_SIZE) });
  }

  // Execute all chunks in parallel for speed
  const results = await Promise.allSettled(
    chunks.map(c => translateChunk(c.texts))
  );

  for (let ci = 0; ci < chunks.length; ci++) {
    const chunk = chunks[ci];
    const result = results[ci];
    const translations = result.status === "fulfilled" ? result.value : chunk.texts;
    for (let i = 0; i < translations.length; i++) {
      allTranslations[chunk.start + i] = translations[i];
    }
  }

  return allTranslations;
}

/**
 * Translate a chunk of texts using a single LLM call.
 */
async function translateChunk(texts: string[]): Promise<string[]> {
  // Build numbered list for clear mapping
  const numberedTexts = texts.map((t, i) => `[${i}] ${t}`).join("\n");

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a professional AI visibility and digital marketing technical translator. Translate the following Korean AI visibility audit texts to English.

Rules:
- Translate each numbered line from Korean to English
- Keep the [number] prefix for each line
- Maintain technical AI visibility and web infrastructure terminology accurately
- Keep numbers, URLs, percentages, and technical terms (HTML tags, schema names) as-is
- Be concise and professional
- If a text is already in English, keep it as-is
- Output ONLY the translated lines, one per line, with their [number] prefix`,
        },
        {
          role: "user",
          content: numberedTexts,
        },
      ],
      maxTokens: 16000,
    });

    const content = typeof response.choices[0]?.message?.content === "string"
      ? response.choices[0].message.content
      : "";

    // Parse numbered responses
    const translations: string[] = new Array(texts.length).fill("");
    const lines = content.split("\n");

    for (const line of lines) {
      const match = line.match(/^\[(\d+)\]\s*(.+)$/);
      if (match) {
        const idx = parseInt(match[1], 10);
        if (idx >= 0 && idx < texts.length) {
          translations[idx] = match[2].trim();
        }
      }
    }

    // Fill in any missing translations with originals
    for (let i = 0; i < texts.length; i++) {
      if (!translations[i]) {
        translations[i] = texts[i];
      }
    }

    return translations;
  } catch (err) {
    logger.error("[seo-report-translate] LLM translation failed, using originals:", err);
    return texts; // Fallback to originals on error
  }
}

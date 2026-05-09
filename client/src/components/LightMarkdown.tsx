import DOMPurify from 'dompurify';
/**
 * LightMarkdown — streamdown 대체 경량 마크다운 렌더러
 * streamdown은 mermaid(2.3MB) + shiki(9.4MB)를 끌어오므로
 * 블로그 포스트에는 이 경량 렌더러를 사용합니다.
 * 
 * 지원: 제목(h1~h3), 볼드, 이탤릭, 링크, 리스트, 코드블록, 인라인코드, 이미지, 인용, 수평선
 */
import { useMemo } from "react";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function parseInline(text: string): string {
  let result = escapeHtml(text);
  // Bold
  result = result.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  result = result.replace(/__(.+?)__/g, "<strong>$1</strong>");
  // Italic
  result = result.replace(/\*(.+?)\*/g, "<em>$1</em>");
  result = result.replace(/_(.+?)_/g, "<em>$1</em>");
  // Inline code
  result = result.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-muted text-[0.9em] font-mono">$1</code>');
  // Links
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-brand underline underline-offset-2 hover:brightness-110" target="_blank" rel="noopener">$1</a>');
  // Images
  result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="rounded-lg max-w-full my-4" loading="lazy" />');
  return result;
}

function markdownToHtml(md: string): string {
  const lines = md.split("\n");
  const html: string[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let inList = false;
  let listType: "ul" | "ol" = "ul";

  const closeList = () => {
    if (inList) {
      html.push(`</${listType}>`);
      inList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        html.push(`<code>${codeLines.map(escapeHtml).join("\n")}</code></pre>`);
        codeLines = [];
        inCodeBlock = false;
      } else {
        closeList();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      closeList();
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      closeList();
      const level = headingMatch[1].length;
      const sizes: Record<number, string> = {
        1: "text-2xl font-bold mt-8 mb-4",
        2: "text-xl font-bold mt-6 mb-3",
        3: "text-lg font-semibold mt-5 mb-2",
        4: "text-base font-semibold mt-4 mb-2",
        5: "text-sm font-semibold mt-3 mb-1",
        6: "text-sm font-medium mt-3 mb-1",
      };
      html.push(`<h${level} class="${sizes[level] || sizes[3]}">${parseInline(headingMatch[2])}</h${level}>`);
      continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(line.trim())) {
      closeList();
      html.push('<hr class="my-6 border-border" />');
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      closeList();
      html.push(`<blockquote class="border-l-4 border-brand/30 pl-4 py-1 my-4 text-muted-foreground italic">${parseInline(line.slice(2))}</blockquote>`);
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^[\s]*[-*+]\s+(.+)/);
    if (ulMatch) {
      if (!inList || listType !== "ul") {
        closeList();
        html.push('<ul class="list-disc pl-6 my-3 space-y-1">');
        inList = true;
        listType = "ul";
      }
      html.push(`<li>${parseInline(ulMatch[1])}</li>`);
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^[\s]*\d+\.\s+(.+)/);
    if (olMatch) {
      if (!inList || listType !== "ol") {
        closeList();
        html.push('<ol class="list-decimal pl-6 my-3 space-y-1">');
        inList = true;
        listType = "ol";
      }
      html.push(`<li>${parseInline(olMatch[1])}</li>`);
      continue;
    }

    // Paragraph
    closeList();
    html.push(`<p class="my-3 leading-relaxed">${parseInline(line)}</p>`);
  }

  closeList();
  if (inCodeBlock) {
    html.push(`<code>${codeLines.map(escapeHtml).join("\n")}</code></pre>`);
  }

  return html.join("\n");
}

export function LightMarkdown({ children }: { children: string }) {
  const html = useMemo(() => markdownToHtml(children || ""), [children]);
  return (
    <div
      className="prose prose-invert max-w-none text-foreground"
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
    />
  );
}

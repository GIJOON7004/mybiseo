import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join } from "path";

describe("Performance Optimization", () => {
  const distDir = join(__dirname, "../dist/public/assets");
  const distExists = existsSync(distDir);

  it("framer-motion should not be imported in any source file", () => {
    const srcDir = join(__dirname, "../client/src");
    const checkDir = (dir: string): string[] => {
      const results: string[] = [];
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          results.push(...checkDir(fullPath));
        } else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) {
          const content = readFileSync(fullPath, "utf8");
          if (content.includes('from "framer-motion"') || content.includes("from 'framer-motion'")) {
            results.push(fullPath);
          }
        }
      }
      return results;
    };
    const filesWithFramer = checkDir(srcDir);
    expect(filesWithFramer).toEqual([]);
  });

  it("streamdown should not be imported in any source file", () => {
    const srcDir = join(__dirname, "../client/src");
    const result = execSync(
      `grep -rln "from \\"streamdown\\"\\|from 'streamdown'" ${srcDir} --include="*.tsx" --include="*.ts" 2>/dev/null || true`,
      { encoding: "utf8" }
    ).trim();
    expect(result).toBe("");
  });

  it("DemoSection.tsx should not exist (removed)", () => {
    const demoPath = join(__dirname, "../client/src/components/DemoSection.tsx");
    expect(existsSync(demoPath)).toBe(false);
  });

  it("FadeInSection component should exist as framer-motion replacement", () => {
    const fadePath = join(__dirname, "../client/src/components/FadeInSection.tsx");
    expect(existsSync(fadePath)).toBe(true);
    const content = readFileSync(fadePath, "utf8");
    expect(content).toContain("useInView");
    // Comment mentions framer-motion as what it replaces, but doesn't import it
    expect(content).not.toContain('from "framer-motion"');
  });

  it("LightMarkdown component should exist as streamdown replacement", () => {
    const lightMdPath = join(__dirname, "../client/src/components/LightMarkdown.tsx");
    expect(existsSync(lightMdPath)).toBe(true);
    const content = readFileSync(lightMdPath, "utf8");
    // File mentions streamdown in comments as what it replaces, but doesn't import it
    expect(content).not.toContain('from "streamdown"');
    expect(content).not.toContain('from "mermaid"');
    expect(content).not.toContain('from "shiki"');
  });

  it("useInView hook should exist for lightweight scroll detection", () => {
    const hookPath = join(__dirname, "../client/src/hooks/useInView.ts");
    expect(existsSync(hookPath)).toBe(true);
    const content = readFileSync(hookPath, "utf8");
    expect(content).toContain("IntersectionObserver");
  });

  it("CSS animation keyframes should be defined in index.css", () => {
    const cssPath = join(__dirname, "../client/src/index.css");
    const content = readFileSync(cssPath, "utf8");
    expect(content).toContain("@keyframes fadeIn");
    expect(content).toContain("@keyframes fadeInUp");
    expect(content).toContain("@keyframes slideUp");
    expect(content).toContain(".animate-fade-in");
    expect(content).toContain(".animate-fade-in-up");
    expect(content).toContain(".animate-slide-up");
  });

  it("App.tsx should use React.lazy for code splitting", () => {
    const appPath = join(__dirname, "../client/src/App.tsx");
    const content = readFileSync(appPath, "utf8");
    expect(content).toContain("lazy");
    expect(content).toContain("Suspense");
  });

  it("Home.tsx should use lazy loading for below-the-fold sections", () => {
    const homePath = join(__dirname, "../client/src/pages/Home.tsx");
    const content = readFileSync(homePath, "utf8");
    expect(content).toContain("lazy(");
  });

  it("vite.config.ts should have build output configuration", () => {
    const vitePath = join(__dirname, "../vite.config.ts");
    const content = readFileSync(vitePath, "utf8");
    expect(content).toContain("build");
    expect(content).toContain("outDir");
  });

  it("font loading should use preload and display=swap", () => {
    const htmlPath = join(__dirname, "../client/index.html");
    const content = readFileSync(htmlPath, "utf8");
    expect(content).toContain("rel=\"preload\"");
    expect(content).toContain("display=swap");
  });
});

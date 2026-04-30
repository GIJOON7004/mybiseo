/**
 * 테스트 헬퍼 - routers.ts가 routes/로 분할된 후에도
 * 기존 테스트가 전체 라우터 소스를 검사할 수 있도록 지원
 *
 * routers.ts의 "  X: XRouter," 참조줄을 routes/*.ts의 실제 코드로
 * 인라인 대체하여 원본 routers.ts와 동일한 형태로 반환
 */
import { readFileSync, readdirSync } from "fs";
import { resolve, join } from "path";

export function readRouterSource(): string {
  const serverDir = __dirname;
  let content = readFileSync(resolve(serverDir, "routers.ts"), "utf-8");

  const routesDir = resolve(serverDir, "routes");
  try {
    const files = readdirSync(routesDir).filter(
      (f) => f.endsWith(".ts") && f !== "_shared.ts"
    );

    // Build map: routerName -> original-style code
    const routerCodeMap: Record<string, string> = {};
    for (const file of files) {
      const fileContent = readFileSync(join(routesDir, file), "utf-8");
      // Find all "export const fooRouter = router({...});" blocks
      const regex = /export const (\w+)Router = router\(\{/g;
      let match;
      while ((match = regex.exec(fileContent)) !== null) {
        const name = match[1];
        // Extract the full router block using bracket matching
        const startIdx = match.index;
        let depth = 0;
        let endIdx = startIdx;
        for (let i = startIdx; i < fileContent.length; i++) {
          if (fileContent[i] === "{") depth++;
          else if (fileContent[i] === "}") {
            depth--;
            if (depth === 0) {
              // Find the end of the statement (});)
              endIdx = fileContent.indexOf(";", i) + 1;
              break;
            }
          }
        }
        let routerCode = fileContent.slice(startIdx, endIdx);
        // Convert "export const fooRouter = router({" → "  foo: router({"
        routerCode = routerCode.replace(
          `export const ${name}Router = router({`,
          `  ${name}: router({`
        );
        // Convert trailing "});" → "}),"
        routerCode = routerCode.replace(/\}\);$/, "}),");
        routerCodeMap[name] = routerCode;
      }
    }

    // Replace each "  X: XRouter," line with actual code
    for (const [name, code] of Object.entries(routerCodeMap)) {
      const refLine = `  ${name}: ${name}Router,`;
      content = content.replace(refLine, code);
    }
  } catch {
    // routes/ 디렉토리가 없으면 무시
  }

  return content;
}

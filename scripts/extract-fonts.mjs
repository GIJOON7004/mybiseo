import { readFileSync, writeFileSync, mkdirSync } from 'fs';

// fonts-base64.ts에서 base64 문자열 추출
const content = readFileSync('./server/fonts-base64.ts', 'utf-8');
const dir = '/home/ubuntu/webdev-static-assets';
mkdirSync(dir, { recursive: true });

// 각 export const 변수에서 base64 값 추출
const matches = [...content.matchAll(/export const (\w+)\s*=\s*"([^"]+)"/g)];
for (const [, name, base64] of matches) {
  const suffix = name.replace('Base64', '').replace(/([A-Z])/g, '-$1').toLowerCase();
  const filename = `font${suffix}.ttf`;
  writeFileSync(`${dir}/${filename}`, Buffer.from(base64, 'base64'));
  console.log(`Extracted: ${filename} (${(Buffer.from(base64, 'base64').length / 1024).toFixed(0)} KB)`);
}

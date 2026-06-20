import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', '..', 'data');

function readJson(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

function getChapter(id) {
  const { chapters } = readJson(join(dataDir, 'chapters.json'));
  return chapters.find((ch) => ch.id === id);
}

function getAverageChars(chapter) {
  const contentSlides = chapter.slides.filter((s) => s.type === 'content');
  if (contentSlides.length === 0) return 0;
  const total = contentSlides.reduce((sum, s) => sum + (s.content || '').length, 0);
  return total / contentSlides.length;
}

describe('Phase 2.2-2.5 content density', () => {
  const targetIds = ['ch4', 'ch7', 'ch8', 'ch9', 'ch10', 'ch13', 'ch15'];

  test.each(targetIds)('%s content slides average at least 180 characters', (id) => {
    const chapter = getChapter(id);
    expect(chapter).toBeDefined();
    expect(getAverageChars(chapter)).toBeGreaterThanOrEqual(180);
  });

  test('ch4 contains a decision tree slide', () => {
    const ch4 = getChapter('ch4');
    const found = ch4.slides.some(
      (s) =>
        (s.title && (s.title.includes('决策树') || s.title.includes('如何选范式'))) ||
        (s.content && (s.content.includes('决策树') || s.content.includes('如何选范式')))
    );
    expect(found).toBe(true);
  });

  test('ch10 contains JSON-RPC or Agent Card slide', () => {
    const ch10 = getChapter('ch10');
    const found = ch10.slides.some(
      (s) =>
        (s.title && (s.title.includes('JSON-RPC') || s.title.includes('Agent Card'))) ||
        (s.content && (s.content.includes('JSON-RPC') || s.content.includes('Agent Card')))
    );
    expect(found).toBe(true);
  });

  test('ch13 contains travel assistant step-by-step slide', () => {
    const ch13 = getChapter('ch13');
    const found = ch13.slides.some(
      (s) =>
        (s.title && (s.title.includes('跟着做') || s.title.includes('旅行助手'))) ||
        (s.content && (s.content.includes('跟着做') || s.content.includes('旅行助手')))
    );
    expect(found).toBe(true);
  });

  test('ch15 contains town running or batch vs realtime slide', () => {
    const ch15 = getChapter('ch15');
    const found = ch15.slides.some(
      (s) =>
        (s.title &&
          (s.title.includes('小镇') ||
            s.title.includes('跑起来') ||
            s.title.includes('批量生成'))) ||
        (s.content &&
          (s.content.includes('小镇') ||
            s.content.includes('跑起来') ||
            s.content.includes('批量生成')))
    );
    expect(found).toBe(true);
  });
});

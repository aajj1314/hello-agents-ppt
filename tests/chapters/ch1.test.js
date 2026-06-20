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

function getCh1() {
  const { chapters } = readJson(join(dataDir, 'chapters.json'));
  return chapters.find((ch) => ch.id === 'ch1');
}

describe('CH1 beginner-friendly rewrite', () => {
  const ch1 = getCh1();

  test('ch1 exists in chapters.json', () => {
    expect(ch1).toBeDefined();
  });

  test('ch1 has 30-33 slides', () => {
    expect(ch1.slides.length).toBeGreaterThanOrEqual(30);
    expect(ch1.slides.length).toBeLessThanOrEqual(33);
  });

  test('ch1 content slides average at least 180 characters', () => {
    const contentSlides = ch1.slides.filter((s) => s.type === 'content');
    expect(contentSlides.length).toBeGreaterThan(0);

    const totalChars = contentSlides.reduce((sum, slide) => {
      const text = slide.content || '';
      return sum + text.length;
    }, 0);
    const average = totalChars / contentSlides.length;
    expect(average).toBeGreaterThanOrEqual(180);
  });

  test('ch1 contains a "5 分钟体验" slide', () => {
    const found = ch1.slides.some((s) =>
      (s.title && s.title.includes('5 分钟体验')) ||
      (s.content && s.content.includes('5 分钟体验'))
    );
    expect(found).toBe(true);
  });

  test('ch1 contains a "10 件你能" slide', () => {
    const found = ch1.slides.some((s) =>
      (s.title && s.title.includes('10 件你能')) ||
      (s.content && s.content.includes('10 件你能'))
    );
    expect(found).toBe(true);
  });

  test('ch1 contains a "智能体 vs 程序" slide', () => {
    const found = ch1.slides.some((s) =>
      (s.title && s.title.includes('智能体 vs 程序')) ||
      (s.title && s.title.includes('智能体 vs 传统程序'))
    );
    expect(found).toBe(true);
  });

  test('ch1 still contains the ch1-agent-types animation slide', () => {
    const found = ch1.slides.some(
      (s) => s.type === 'animation' && s.animation === 'ch1-agent-types'
    );
    expect(found).toBe(true);
  });
});

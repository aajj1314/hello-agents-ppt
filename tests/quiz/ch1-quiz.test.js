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

const quizData = readJson(join(dataDir, 'quiz-data.json'));
const ch1Questions = quizData.ch1;

const { chapters } = readJson(join(dataDir, 'chapters.json'));
const ch1 = chapters.find((ch) => ch.id === 'ch1');

describe('CH1 quiz expansion', () => {
  test('ch1 has exactly 10 questions', () => {
    expect(ch1Questions).toHaveLength(10);
  });

  test('ch1 has at least one scenario question', () => {
    const scenarioTags = ['场景', 'scenario', '你正在', '假设', '某公司', '某电商', '某团队'];
    const hasScenario = ch1Questions.some((q) =>
      scenarioTags.some((tag) => q.question.toLowerCase().includes(tag.toLowerCase()))
    );
    expect(hasScenario).toBe(true);
  });

  test('ch1 has at least one multiple-choice question', () => {
    const hasMultiple = ch1Questions.some((q) => q.type === 'multiple');
    expect(hasMultiple).toBe(true);
  });

  test('ch1 has at least one judge/true_false question', () => {
    const hasJudge = ch1Questions.some((q) => q.type === 'judge');
    expect(hasJudge).toBe(true);
  });

  test('every ch1 question explanation is at least 50 characters', () => {
    for (const q of ch1Questions) {
      expect(q.explanation.length).toBeGreaterThanOrEqual(50);
    }
  });

  test('chapters.json ch1 slides contain a pitfalls/易错点 slide', () => {
    const found = ch1.slides.some(
      (s) => s.type === 'content' && s.title && s.title.includes('易错点')
    );
    expect(found).toBe(true);
  });
});

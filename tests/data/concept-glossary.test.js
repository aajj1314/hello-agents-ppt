import { describe, test, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', '..', 'data');

function readJson(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

describe('data/concept-map.json', () => {
  const filePath = join(dataDir, 'concept-map.json');

  test('exists and is valid JSON', () => {
    expect(existsSync(filePath)).toBe(true);
    const data = readJson(filePath);
    expect(data).toBeTypeOf('object');
    expect(Array.isArray(data.concepts)).toBe(true);
    expect(Array.isArray(data.chapter_links)).toBe(true);
  });

  test('contains at least 25 concepts', () => {
    const { concepts } = readJson(filePath);
    expect(concepts.length).toBeGreaterThanOrEqual(25);
  });

  test('each concept has required fields', () => {
    const { concepts } = readJson(filePath);
    const required = ['id', 'name', 'definition_short', 'first_appears', 'related'];
    concepts.forEach((concept) => {
      required.forEach((field) => {
        expect(concept[field], `concept ${concept.id || '?'} missing ${field}`).toBeDefined();
      });
      expect(Array.isArray(concept.related)).toBe(true);
    });
  });

  test('chapter_links is non-empty and each link has required fields', () => {
    const { chapter_links } = readJson(filePath);
    expect(chapter_links.length).toBeGreaterThan(0);
    chapter_links.forEach((link) => {
      expect(link.from).toBeDefined();
      expect(link.to).toBeDefined();
      expect(link.reason).toBeDefined();
    });
  });
});

describe('data/glossary.json', () => {
  const filePath = join(dataDir, 'glossary.json');

  test('exists and is valid JSON', () => {
    expect(existsSync(filePath)).toBe(true);
    const data = readJson(filePath);
    expect(data).toBeTypeOf('object');
    expect(Array.isArray(data.terms)).toBe(true);
  });

  test('contains at least 40 terms', () => {
    const { terms } = readJson(filePath);
    expect(terms.length).toBeGreaterThanOrEqual(40);
  });

  test('each term has required fields', () => {
    const { terms } = readJson(filePath);
    const required = ['term', 'plain_definition', 'analogy', 'chapter'];
    terms.forEach((item) => {
      required.forEach((field) => {
        expect(item[field], `term ${item.term || '?'} missing ${field}`).toBeDefined();
      });
    });
  });
});

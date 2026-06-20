import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sourceDir = join(__dirname, '..', '..', 'data', 'source');

function countH3(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  return content.split('\n').filter(line => /^### .+/.test(line)).length;
}

const specs = [
  { file: 'ch7.md', min: 8 },
  { file: 'ch10.md', min: 6 },
  { file: 'ch15.md', min: 6 },
  { file: 'ch9.md', min: 5 },
];

describe('source markdown structure', () => {
  specs.forEach(({ file, min }) => {
    test(`${file} has at least ${min} "###" subsections`, () => {
      const count = countH3(join(sourceDir, file));
      expect(count).toBeGreaterThanOrEqual(min);
    });
  });
});

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('responsive CSS breakpoints', () => {
    let css;
    beforeAll(() => {
        css = readFileSync(resolve(process.cwd(), 'css/main.css'), 'utf8');
    });

    it('main.css contains @media for ≤480', () => {
        expect(css).toMatch(/@media\s*\([^)]*max-width:\s*480/);
    });
    it('main.css contains @media for ≤768', () => {
        expect(css).toMatch(/@media\s*\([^)]*max-width:\s*768/);
    });
    it('main.css contains @media for ≤1024', () => {
        expect(css).toMatch(/@media\s*\([^)]*max-width:\s*1024/);
    });
    it('comparison-table has overflow-x container', () => {
        expect(css).toMatch(/\.comparison-table[\s\S]{0,500}overflow-x/);
    });
});

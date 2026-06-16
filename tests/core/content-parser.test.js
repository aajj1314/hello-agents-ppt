// tests/core/content-parser.test.js
import { describe, it, expect } from 'vitest';
import { ContentParser } from '../../js/core/content-parser.js';

describe('ContentParser', () => {
    const p = new ContentParser();

    it('parses simple paragraph', () => {
        expect(p.parse('hello world')).toBe('<p>hello world</p>');
    });

    it('parses bullet list', () => {
        const md = '• a\n• b\n• c';
        const html = p.parse(md);
        expect(html).toContain('<ul class="bullet-points">');
        expect(html).toContain('<li>a</li>');
        expect(html).toContain('<li>c</li>');
    });

    it('parses numbered list', () => {
        const md = '1. one\n2. two\n3. three';
        const html = p.parse(md);
        expect(html).toContain('<ol class="bullet-points">');
        expect(html).toContain('<li>one</li>');
    });

    it('parses info box', () => {
        const html = p.parse('[提示] 这是提示');
        expect(html).toContain('info-box');
        expect(html).toContain('这是提示');
    });

    it('parses warning box', () => {
        expect(p.parse('[警告] 危险').match(/warning-box/)).toBeTruthy();
    });

    it('parses success box', () => {
        expect(p.parse('[成功] 好的').match(/success-box/)).toBeTruthy();
    });

    it('parses table with separator row', () => {
        const md = '| A | B |\n|---|---|\n| 1 | 2 |';
        const html = p.parse(md);
        expect(html).toContain('<table');
        expect(html).toContain('<th>A</th>');
        expect(html).toContain('<td>1</td>');
    });

    it('inline **bold** renders <strong>', () => {
        expect(p.parse('**important**')).toContain('<strong>important</strong>');
    });

    it('inline `code` renders <code>', () => {
        expect(p.parse('use `x()`')).toContain('<code class="inline-code">x()</code>');
    });

    it('escapes HTML in content', () => {
        const html = p.parse('<script>alert(1)</script>');
        expect(html).not.toContain('<script>');
        expect(html).toContain('&lt;script&gt;');
    });
});

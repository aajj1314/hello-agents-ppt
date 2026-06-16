// tests/core/code-highlighter.test.js
import { describe, it, expect } from 'vitest';
import { highlightCode } from '../../js/core/code-highlighter.js';

describe('highlightCode', () => {
    it('highlights Python keywords', () => {
        const html = highlightCode('def foo():', 'python');
        expect(html).toMatch(/<span class="kw">def<\/span>/);
    });

    it('highlights Python comments', () => {
        const html = highlightCode('# comment', 'python');
        expect(html).toContain('<span class="comment"># comment</span>');
    });

    it('highlights Python strings', () => {
        const html = highlightCode('"hello"', 'python');
        expect(html).toContain('<span class="str">');
    });

    it('highlights numbers', () => {
        const html = highlightCode('x = 42', 'python');
        expect(html).toContain('<span class="num">42</span>');
    });

    it('handles JS keywords', () => {
        const html = highlightCode('const x = 1;', 'js');
        expect(html).toContain('<span class="kw">const</span>');
    });

    it('handles JSON', () => {
        const html = highlightCode('{"a": "hello"}', 'json');
        expect(html).toContain('<span class="str">');
    });

    it('handles unknown language as generic', () => {
        const html = highlightCode('# comment\n// other', 'unknown');
        expect(html).toContain('<span class="comment">');
    });

    it('returns empty string for null', () => {
        expect(highlightCode(null, 'python')).toBe('');
    });

    it('escapes HTML to prevent XSS', () => {
        const html = highlightCode('<script>', 'python');
        expect(html).not.toContain('<script>');
        expect(html).toContain('&lt;script&gt;');
    });
});

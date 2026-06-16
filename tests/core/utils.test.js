// tests/core/utils.test.js
import { describe, it, expect } from 'vitest';
import { $, $$, createElement, escapeHTML, throttle, debounce, loadJSON, getURLParams } from '../../js/core/utils.js';

describe('utils', () => {
    it('$ finds element', () => {
        document.body.innerHTML = '<div id="x"></div>';
        expect($('#x').id).toBe('x');
    });

    it('$$ returns array', () => {
        document.body.innerHTML = '<span class="y"></span><span class="y"></span>';
        expect($$('.y').length).toBe(2);
    });

    it('createElement handles className, dataset, children', () => {
        const el = createElement('div', { className: 'a b', dataset: { k: 'v' } }, 'hello', ' ', 'world');
        expect(el.className).toBe('a b');
        expect(el.dataset.k).toBe('v');
        expect(el.textContent).toBe('hello world');
    });

    it('escapeHTML escapes <, >, & (prevents XSS)', () => {
        expect(escapeHTML('<a href="x">"&</a>')).toBe('&lt;a href="x"&gt;"&amp;&lt;/a&gt;');
    });

    it('throttle limits calls', () => {
        let n = 0;
        const f = throttle(() => n++, 50);
        f(); f(); f();
        expect(n).toBe(1);
    });

    it('debounce delays call', async () => {
        let n = 0;
        const f = debounce(() => n++, 30);
        f(); f(); f();
        await new Promise(r => setTimeout(r, 60));
        expect(n).toBe(1);
    });

    it('loadJSON fetches and parses', async () => {
        globalThis.fetch = () => Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ a: 1 })
        });
        const data = await loadJSON('x.json');
        expect(data).toEqual({ a: 1 });
    });

    it('loadJSON throws on non-ok', async () => {
        globalThis.fetch = () => Promise.resolve({ ok: false, status: 404 });
        await expect(loadJSON('x.json')).rejects.toThrow('404');
    });

    it('getURLParams parses query string', () => {
        const original = window.location;
        delete window.location;
        window.location = { ...original, search: '?chapter=ch1&slide=3' };
        const p = getURLParams();
        window.location = original;
        expect(p).toEqual({ chapter: 'ch1', slide: '3' });
    });
});

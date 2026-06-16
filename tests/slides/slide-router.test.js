// tests/slides/slide-router.test.js
import { describe, it, expect } from 'vitest';
import { SlideRouter } from '../../js/slides/slide-router.js';

describe('SlideRouter', () => {
    it('registers and routes to handler', () => {
        const router = new SlideRouter();
        const handler = (slide, ctx) => 'result';
        router.register('cover', handler);
        expect(router.route({ type: 'cover' }, { chapter: {} })).toBe('result');
    });

    it('returns empty string for unknown type', () => {
        const router = new SlideRouter();
        expect(router.route({ type: 'unknown' }, { chapter: {} })).toBe('');
    });

    it('defaultFallback overrides empty return for unknown types', () => {
        const router = new SlideRouter();
        router.defaultFallback = (s, ctx) => `fallback:${s.type}`;
        expect(router.route({ type: 'mystery' }, { chapter: {} })).toBe('fallback:mystery');
    });
});

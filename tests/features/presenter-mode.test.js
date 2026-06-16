import { describe, it, expect } from 'vitest';
import { buildPresenterUrl, isPresenterOpen } from '../../js/features/presenter-mode.js';

describe('presenter-mode', () => {
    it('buildPresenterUrl encodes chapter and slide', () => {
        const url = buildPresenterUrl('ch1', 3);
        expect(url).toContain('chapter=ch1');
        expect(url).toContain('slide=4');
    });

    it('isPresenterOpen detects presenter URL', () => {
        expect(isPresenterOpen('presenter.html')).toBe(true);
        expect(isPresenterOpen('slides.html')).toBe(false);
    });
});

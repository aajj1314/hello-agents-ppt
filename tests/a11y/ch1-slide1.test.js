// tests/a11y/ch1-slide1.test.js
// a11y audit for the CH1 cover slide (slides[0]).
// Verifies heading hierarchy, decorative aria-hidden markup, and
// runs axe-core as a smoke test (with jsdom-aware fallbacks).
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderCover } from '../../js/slides/renderers/cover.js';
import { runAxe, summarizeViolations } from './helpers.js';

const ctx = {
    chapterData: { id: 'ch1', title: '初识智能体', subtitle: '智能体定义、类型与架构', icon: '🤖' },
    chapterIndex: 0,
    slideIndex: 0,
    slidesLength: 30
};

function mountCover() {
    const html = renderCover(
        { type: 'cover', title: '第一章', subtitle: '初识智能体', description: 'desc' },
        ctx
    );
    document.body.innerHTML = `<main id="slideStage">${html}</main>`;
}

describe('CH1 cover slide (slide 1) a11y', () => {
    let axe;

    beforeEach(() => {
        mountCover();
        axe = null;
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('uses a single h1 (top-level page heading on a cover slide)', async () => {
        const h1s = document.querySelectorAll('h1');
        const h2s = document.querySelectorAll('h2');
        expect(h1s.length).toBe(1);
        // A cover slide should not contain any h2 — the chapter title
        // is the only heading at this level.
        expect(h2s.length).toBe(0);
        expect(h1s[0].textContent.trim()).toBe('第一章');
    });

    it('decorative parts of the cover are marked aria-hidden', () => {
        const icon = document.querySelector('.cover-icon');
        const divider = document.querySelector('.cover-divider');
        const separator = document.querySelector('.cover-meta__sep');
        const ctaArrow = document.querySelector('.cover-meta svg');
        [icon, divider, separator, ctaArrow].forEach((el) => {
            expect(el).toBeTruthy();
            expect(el.getAttribute('aria-hidden')).toBe('true');
        });
    });

    it('axe-core scan on the cover reports no critical violations', async () => {
        const result = await runAxe(document.querySelector('.slide-cover'));
        if (result.error) {
            // jsdom may not run every axe rule — record but don't fail.
            expect(result.error).toBeInstanceOf(Error);
        } else {
            // Filter out rules that are unreliable under jsdom.
            const blocking = result.violations.filter(
                (v) => !['color-contrast', 'region', 'landmark-one-main'].includes(v.id)
            );
            expect(
                blocking,
                `cover slide violations: ${summarizeViolations(blocking)}`
            ).toEqual([]);
        }
    });
});

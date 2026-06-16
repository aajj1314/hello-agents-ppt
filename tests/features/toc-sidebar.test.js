import { describe, it, expect, beforeEach } from 'vitest';
import { mountTocSidebar, toggleToc } from '../../js/features/toc-sidebar.js';

const slides = [
    { type: 'cover', title: '封面' },
    { type: 'content', title: '什么是智能体' },
    { type: 'animation', title: '动画演示' },
    { type: 'quiz', title: '知识测验' }
];

describe('toc-sidebar', () => {
    beforeEach(() => { document.body.innerHTML = ''; });

    it('mountTocSidebar creates drawer', () => {
        mountTocSidebar(slides, 0, () => {});
        expect(document.querySelector('.toc-drawer')).toBeTruthy();
    });

    it('drawer collapsed by default', () => {
        mountTocSidebar(slides, 0, () => {});
        expect(document.querySelector('.toc-drawer').classList.contains('open')).toBe(false);
    });

    it('toggleToc opens drawer', () => {
        mountTocSidebar(slides, 0, () => {});
        toggleToc();
        expect(document.querySelector('.toc-drawer').classList.contains('open')).toBe(true);
    });

    it('renders one item per slide', () => {
        mountTocSidebar(slides, 0, () => {});
        expect(document.querySelectorAll('.toc-item').length).toBe(slides.length);
    });

    it('highlights current slide', () => {
        mountTocSidebar(slides, 2, () => {});
        expect(document.querySelectorAll('.toc-item')[2].classList.contains('active')).toBe(true);
    });

    it('clicking item calls navigate', () => {
        let called = null;
        mountTocSidebar(slides, 0, (i) => { called = i; });
        document.querySelectorAll('.toc-item')[3].click();
        expect(called).toBe(3);
    });
});

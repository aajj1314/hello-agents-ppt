// tests/slides/renderers.test.js
import { describe, it, expect } from 'vitest';
import { renderCover } from '../../js/slides/renderers/cover.js';
import { renderContent } from '../../js/slides/renderers/content.js';
import { renderCode } from '../../js/slides/renderers/code.js';
import { renderTimeline } from '../../js/slides/renderers/timeline.js';
import { renderFlow } from '../../js/slides/renderers/flow.js';
import { renderConcepts } from '../../js/slides/renderers/concepts.js';
import { renderComparison } from '../../js/slides/renderers/comparison.js';
import { renderQuiz } from '../../js/slides/renderers/quiz.js';
import { renderAnimation } from '../../js/slides/renderers/animation.js';

const ctx = { chapterData: { icon: '📖', title: 'T', subtitle: 'S' }, slidesLength: 3 };

describe('renderers', () => {
    it('renderCover', () => {
        const html = renderCover({ type: 'cover', title: 'T', subtitle: 'S' }, ctx);
        expect(html).toContain('slide-cover');
        expect(html).toContain('<h1>T</h1>');
    });

    it('renderContent', () => {
        const html = renderContent({ type: 'content', title: 'X', content: 'para' }, { ...ctx, slideIndex: 1 });
        expect(html).toContain('第 2 页');
        expect(html).toContain('X');
        expect(html).toContain('<p>para</p>');
    });

    it('renderCode', () => {
        const html = renderCode({ type: 'code', title: 'C', language: 'python', code: 'x=1', explanation: 'note' }, { ...ctx, slideIndex: 0 });
        expect(html).toContain('<pre');
        expect(html).toContain('info-box');
    });

    it('renderTimeline', () => {
        const html = renderTimeline({ type: 'timeline', title: 'TL', items: [{ year: '2020', title: 'A' }] }, { ...ctx, slideIndex: 0 });
        expect(html).toContain('timeline-item');
        expect(html).toContain('2020');
    });

    it('renderFlow', () => {
        const html = renderFlow({ type: 'flow', title: 'F', steps: [{ title: 'A' }, { title: 'B' }] }, { ...ctx, slideIndex: 0 });
        expect(html).toContain('flow-node');
        expect(html).toContain('flow-arrow');
    });

    it('renderConcepts', () => {
        const html = renderConcepts({ type: 'concepts', title: 'C', items: [{ icon: '✨', title: 'A', description: 'd' }] }, { ...ctx, slideIndex: 0 });
        expect(html).toContain('concept-card');
    });

    it('renderComparison', () => {
        const html = renderComparison({ type: 'comparison', title: 'Cmp', headers: ['A', 'B'], rows: [['1', '2']] }, { ...ctx, slideIndex: 0 });
        expect(html).toContain('<table');
        expect(html).toContain('<th>A</th>');
    });

    it('renderQuiz', () => {
        const html = renderQuiz({ type: 'quiz', title: 'Q' }, { ...ctx, slideIndex: 0 });
        expect(html).toContain('quiz-container');
    });

    it('renderAnimation (no media.video → no <video>)', () => {
        const html = renderAnimation({ type: 'animation', title: 'A', animation: 'ch1-x' }, { ...ctx, slideIndex: 0 });
        expect(html).toContain('animation-wrapper');
        expect(html).not.toContain('<video');
    });

    it('renderAnimation (with media.video → <video>)', () => {
        const html = renderAnimation({ type: 'animation', title: 'A', animation: 'ch1-x', media: { video: 'ch1/x.mp4' } }, { ...ctx, slideIndex: 0 });
        expect(html).toContain('<video');
        expect(html).toContain('ch1/x.mp4');
    });
});

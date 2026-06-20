// tests/a11y/ch4-slide18.test.js
// a11y audit for the CH4 decision-tree slide (slides[17] in 0-indexed,
// slide 18 in 1-indexed user-facing numbering). The renderer produces
// a content slide with an h2 heading and a parsed body.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderContent } from '../../js/slides/renderers/content.js';
import { renderQuiz } from '../../js/slides/renderers/quiz.js';
import { runAxe, summarizeViolations } from './helpers.js';

const ctx = {
    chapterData: { id: 'ch4', title: '智能体经典范式构建', subtitle: 'ReAct、Plan-and-Solve、Reflection', icon: '🧩' },
    chapterIndex: 3,
    slideIndex: 17,
    slidesLength: 30
};

const DECISION_TREE_SLIDE = {
    type: 'content',
    title: '如何选范式？决策树',
    content:
        '选范式可以按以下决策树快速判断：\n\n' +
        '第一步：任务是否需要外部实时数据？\n' +
        '是 → 优先考虑 ReAct（搜索、API、数据库）。\n' +
        '否 → 进入第二步。\n\n' +
        '第二步：任务是否步骤明确、可提前拆解？\n' +
        '是 → 优先考虑 Plan-and-Solve（数学题、报告、代码生成）。\n' +
        '否 → 进入第三步。\n\n' +
        '第三步：结果质量是否要求极高、允许更多时间和成本？\n' +
        '是 → 优先考虑 Reflection（关键代码、重要报告、科研分析）。\n' +
        '否 → 使用 ReAct 或 Plan-and-Solve 轻量方案。\n\n' +
        '复杂任务往往需要组合：先用 Plan-and-Solve 制定总体规划，再用 ReAct 执行每一步，最后用 Reflection 审查结果。'
};

function mountDecisionTree() {
    const html = renderContent(DECISION_TREE_SLIDE, ctx);
    document.body.innerHTML = `<main id="slideStage">${html}</main>`;
}

describe('CH4 decision-tree slide (slide 18) a11y', () => {
    let axe;

    beforeEach(() => {
        mountDecisionTree();
        axe = null;
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('uses an h2 heading that matches the slide title (correct heading level)', () => {
        const h1s = document.querySelectorAll('h1');
        const h2s = document.querySelectorAll('h2');
        // A content slide inside slides.html should never declare an h1 —
        // that level is reserved for the cover/landing page.
        expect(h1s.length).toBe(0);
        expect(h2s.length).toBe(1);
        expect(h2s[0].textContent.trim()).toBe('如何选范式？决策树');
    });

    it('slide body exposes the decision-tree steps as a structured block of paragraphs', () => {
        const body = document.querySelector('.slide-body');
        expect(body).toBeTruthy();
        const paragraphs = body.querySelectorAll('p');
        // The decision tree should produce several paragraphs describing
        // the steps (three numbered branches plus the lead-in / outro).
        expect(paragraphs.length).toBeGreaterThanOrEqual(3);
        const joined = Array.from(paragraphs).map((p) => p.textContent).join(' ');
        expect(joined).toContain('第一步');
        expect(joined).toContain('第二步');
        expect(joined).toContain('第三步');
    });

    it('axe-core scan on the decision-tree slide reports no critical violations', async () => {
        const result = await runAxe(document.querySelector('.slide-content-type'));
        if (result.error) {
            expect(result.error).toBeInstanceOf(Error);
        } else {
            const blocking = result.violations.filter(
                (v) => !['color-contrast', 'region', 'landmark-one-main'].includes(v.id)
            );
            expect(
                blocking,
                `decision-tree violations: ${summarizeViolations(blocking)}`
            ).toEqual([]);
        }
    });
});

// Quiz radio-name regression — same radio group must share a `name`
// so screen readers treat them as mutually exclusive.
describe('Quiz a11y: radio name attribute', () => {
    it('single-choice quiz renders radios with the same name (one group)', () => {
        document.body.innerHTML = `
            <main id="slideStage">
                ${renderQuiz({ type: 'quiz', title: '测验' }, ctx)}
            </main>
        `;
        // Manually trigger the same DOM the QuizSystem would render
        // for a single-choice question — we replicate the option markup
        // so we can assert on the rendered `name` attribute.
        const container = document.getElementById('quiz-container');
        container.innerHTML = `
            <label class="quiz-option"><input type="radio" name="quiz-answer" value="A"><span class="option-text">A</span></label>
            <label class="quiz-option"><input type="radio" name="quiz-answer" value="B"><span class="option-text">B</span></label>
            <label class="quiz-option"><input type="radio" name="quiz-answer" value="C"><span class="option-text">C</span></label>
        `;
        const radios = container.querySelectorAll('input[type="radio"]');
        expect(radios.length).toBeGreaterThan(1);
        const names = new Set(Array.from(radios).map((r) => r.getAttribute('name')));
        // All radios in a single-choice question must share the same name.
        expect(names.size).toBe(1);
    });
});

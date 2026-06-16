// tests/quiz/quiz-system.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { QuizSystem } from '../../js/quiz/quiz-system.js';

const sampleQuiz = {
    ch1: [
        { id: 'q1', type: 'single', question: '<Q1>', options: [{ id: 'A', text: '<a>' }, { id: 'B', text: 'b' }], answer: 'A', explanation: 'exp' },
        { id: 'q2', type: 'multiple', question: 'Q2', options: [{ id: 'X', text: 'x' }, { id: 'Y', text: 'y' }, { id: 'Z', text: 'z' }], answer: 'XY', explanation: 'exp2' },
        { id: 'q3', type: 'multiple', question: 'Q3 arr', options: [{ id: 'A1', text: 'a1' }, { id: 'B1', text: 'b1' }], answer: ['A1', 'B1'], explanation: 'exp3' },
        { id: 'q4', type: 'judge', question: 'JQ', answer: true, explanation: 'ej' }
    ]
};

describe('QuizSystem', () => {
    let container, system;
    beforeEach(() => {
        document.body.innerHTML = '<div id="c"></div>';
        container = document.getElementById('c');
        system = new QuizSystem('ch1', container);
        system.questions = sampleQuiz.ch1;
    });

    it('renders first question', () => {
        system.render();
        expect(container.querySelector('.quiz-question').textContent).toBe('<Q1>');
    });

    it('escapes HTML in question text (XSS)', () => {
        system.render();
        expect(container.innerHTML).toContain('&lt;Q1&gt;');
        expect(container.querySelector('.quiz-option').innerHTML).toContain('&lt;a&gt;');
    });

    it('handles multiple-choice with string answer "XY"', () => {
        system.currentIndex = 1;
        system.render();
        const options = container.querySelectorAll('.quiz-option');
        system.selectOption(options[0], 'X');
        system.selectOption(options[1], 'Y');
        system.submit();
        expect(system.answers[0].correct).toBe(true);
    });

    it('handles multiple-choice with array answer', () => {
        system.currentIndex = 2;
        system.render();
        const options = container.querySelectorAll('.quiz-option');
        system.selectOption(options[0], 'A1');
        system.selectOption(options[1], 'B1');
        system.submit();
        expect(system.answers[0].correct).toBe(true);
    });

    it('judge question answer=true is bool', () => {
        system.currentIndex = 3;
        system.render();
        const trueOption = container.querySelectorAll('.quiz-option')[0];
        system.selectOption(trueOption, 'true');
        system.submit();
        expect(system.answers[0].correct).toBe(true);
    });

    it('renderResult shows score', () => {
        system.score = 30;
        system.currentIndex = 4;
        system.render();
        expect(container.querySelector('.score').textContent).toBe('30');
    });
});

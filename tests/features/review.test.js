import { describe, it, expect, beforeEach } from 'vitest';
import { renderReviewList } from '../../js/features/review.js';
import { Storage } from '../../js/core/storage.js';

const sampleQuiz = { ch1: [{ id: 'q1', question: 'Q1', options: [{id:'A'},{id:'B'}], answer: 'B', explanation: 'exp1' }] };

describe('review', () => {
    beforeEach(() => { document.body.innerHTML = ''; localStorage.clear(); Storage._resetCache(); });

    it('shows empty state when no wrong answers', () => {
        renderReviewList(sampleQuiz, document.body);
        expect(document.body.textContent).toContain('暂无错题');
    });

    it('renders summary with wrong count', () => {
        Storage.addWrongAnswer('ch1', { questionId: 'q1', userAnswer: 'A', correctAnswer: 'B' });
        renderReviewList(sampleQuiz, document.body);
        expect(document.body.textContent).toContain('ch1');
        expect(document.body.textContent).toContain('1');
    });
});

import { Storage } from '../core/storage.js';
import { createElement, escapeHTML } from '../core/utils.js';

export function renderReviewList(quizData, container) {
    container.innerHTML = '';
    const total = Storage.getTotalWrongCount();
    if (total === 0) {
        container.appendChild(createElement('p', { className: 'empty' }, '暂无错题，做完测验后会记录在这里。'));
        return;
    }
    Object.entries(quizData).forEach(([chapterId, questions]) => {
        const wrong = Storage.getWrongAnswers(chapterId);
        if (wrong.length === 0) return;
        const section = createElement('section', { className: 'review-section' });
        section.appendChild(createElement('h2', {}, `${chapterId}（${wrong.length} 道错题）`));
        wrong.forEach(entry => {
            const q = questions.find(qq => qq.id === entry.questionId);
            if (!q) return;
            const card = createElement('div', { className: 'review-card' });
            card.innerHTML = `
                <div class="review-q">${escapeHTML(q.question)}</div>
                <div class="review-answers">
                    <div class="review-wrong">你的答案: ${escapeHTML(String(entry.userAnswer))}</div>
                    <div class="review-correct">正确答案: ${escapeHTML(String(entry.correctAnswer))}</div>
                </div>
                <div class="review-exp">${escapeHTML(q.explanation)}</div>`;
            section.appendChild(card);
        });
        container.appendChild(section);
    });
}

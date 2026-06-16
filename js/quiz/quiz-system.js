// js/quiz/quiz-system.js
import { $, $$, createElement, escapeHTML, loadJSON } from '../core/utils.js';
import { Storage } from '../core/storage.js';

export class QuizSystem {
    constructor(chapterId, container) {
        this.chapterId = chapterId;
        this.container = container;
        this.questions = [];
        this.currentIndex = 0;
        this.score = 0;
        this.answers = [];
        this.submitted = false;
        this.selectedIds = [];
    }

    async init() {
        console.log('[QuizSystem.init] loading quiz data for:', this.chapterId);
        const data = await loadJSON('data/quiz-data.json');
        this.questions = data[this.chapterId] || [];
        console.log('[QuizSystem.init] loaded', this.questions.length, 'questions for', this.chapterId, 'keys:', Object.keys(data));
        if (this.questions.length === 0) {
            this.container.innerHTML = '<p class="text-center text-muted">本章暂无测验题目</p>';
            return;
        }
        this.render();
    }

    render() {
        console.log('[QuizSystem.render] currentIndex:', this.currentIndex, 'total:', this.questions.length);
        if (this.currentIndex >= this.questions.length) { this.renderResult(); return; }
        const q = this.questions[this.currentIndex];
        console.log('[QuizSystem.render] question:', q.id, 'type:', q.type);
        this.submitted = false;
        this.selectedIds = [];
        this.container.innerHTML = '';

        this.container.appendChild(createElement('div', { className: 'quiz-progress' }, `第 ${this.currentIndex + 1} / ${this.questions.length} 题`));
        this.container.appendChild(createElement('div', { className: 'quiz-question' }, q.question));

        const optionsEl = createElement('div', { className: 'quiz-options' });
        if (q.type === 'judge') {
            ['true', 'false'].forEach((val, idx) => {
                const option = createElement('label', { className: 'quiz-option' });
                option.innerHTML = `
                    <input type="radio" name="quiz-answer" value="${val}">
                    <span class="option-label">${idx === 0 ? 'A' : 'B'}</span>
                    <span class="option-text">${val === 'true' ? '正确' : '错误'}</span>`;
                option.addEventListener('click', () => this.selectOption(option, val));
                optionsEl.appendChild(option);
            });
        } else {
            q.options.forEach(opt => {
                const option = createElement('label', { className: 'quiz-option' });
                const inputType = q.type === 'multiple' ? 'checkbox' : 'radio';
                option.innerHTML = `
                    <input type="${inputType}" name="quiz-answer" value="${escapeHTML(opt.id)}">
                    <span class="option-label">${escapeHTML(opt.id)}</span>
                    <span class="option-text">${escapeHTML(opt.text)}</span>`;
                option.addEventListener('click', () => this.selectOption(option, opt.id));
                optionsEl.appendChild(option);
            });
        }
        this.container.appendChild(optionsEl);

        const actionsEl = createElement('div', { className: 'quiz-actions' });
        const submitBtn = createElement('button', { className: 'btn btn-primary', id: 'btn-submit' }, '提交答案');
        submitBtn.addEventListener('click', () => this.submit());
        actionsEl.appendChild(submitBtn);
        this.container.appendChild(actionsEl);
        console.log('[QuizSystem.render] submit button added, innerHTML length:', this.container.innerHTML.length);
        this.container.appendChild(createElement('div', { className: 'quiz-explanation hidden', id: 'quiz-explanation' }));
    }

    selectOption(optionEl, id) {
        if (this.submitted) return;
        const q = this.questions[this.currentIndex];
        if (q.type === 'multiple') {
            const idx = this.selectedIds.indexOf(id);
            if (idx >= 0) {
                this.selectedIds.splice(idx, 1);
                optionEl.classList.remove('selected');
            } else {
                this.selectedIds.push(id);
                optionEl.classList.add('selected');
            }
        } else {
            this.selectedIds = [id];
            $$('.quiz-option.selected', this.container).forEach(el => el.classList.remove('selected'));
            optionEl.classList.add('selected');
        }
    }

    submit() {
        if (this.submitted || this.selectedIds.length === 0) return;
        this.submitted = true;
        const q = this.questions[this.currentIndex];

        // Normalize correct answer
        let correctAnswer;
        if (q.type === 'judge') {
            correctAnswer = q.answer === true ? 'true' : 'false';
        } else if (Array.isArray(q.answer)) {
            correctAnswer = q.answer.slice().sort().join('');
        } else {
            correctAnswer = String(q.answer);
        }

        // Normalize user answer
        let userAnswer;
        if (q.type === 'judge' || q.type === 'single') {
            userAnswer = this.selectedIds[0];
        } else {
            userAnswer = this.selectedIds.slice().sort().join('');
        }

        const isCorrect = userAnswer === correctAnswer;
        if (isCorrect) this.score += 10;

        this.answers.push({
            questionId: q.id,
            userAnswer,
            correctAnswer,
            correct: isCorrect
        });

        // Record wrong answer synchronously (no async gap)
        if (!isCorrect) {
            Storage.addWrongAnswer(this.chapterId, { questionId: q.id, userAnswer, correctAnswer });
        }

        // Update button FIRST before any DOM changes
        const submitBtn = document.getElementById('btn-submit');
        if (submitBtn) {
            submitBtn.textContent = this.currentIndex >= this.questions.length - 1 ? '查看成绩' : '下一题';
            submitBtn.onclick = () => {
                this.currentIndex++;
                this.render();
            };
        }

        // Show explanation
        const explanation = document.getElementById('quiz-explanation');
        if (explanation) {
            explanation.className = `quiz-explanation ${isCorrect ? 'correct' : 'wrong'}`;
            explanation.innerHTML = `
                <span class="quiz-result-icon">${isCorrect ? '✅ 正确' : '❌ 错误'}</span>
                <p>${escapeHTML(q.explanation || '')}</p>`;
        }

        // Highlight correct/wrong options
        $$('.quiz-option', this.container).forEach(el => {
            const input = el.querySelector('input');
            if (!input) return;
            const val = input.value;
            if (q.type === 'multiple') {
                if (correctAnswer.includes(val)) el.classList.add('correct-highlight');
                else if (this.selectedIds.includes(val)) el.classList.add('wrong-highlight');
            } else {
                if (val === correctAnswer) el.classList.add('correct-highlight');
                else if (val === userAnswer && val !== correctAnswer) el.classList.add('wrong-highlight');
            }
        });
    }

    renderResult() {
        const total = this.questions.length * 10;
        const pct = Math.round((this.score / total) * 100);
        Storage.setChapterProgress(this.chapterId, { quizScore: this.score, completed: pct >= 60 });

        this.container.innerHTML = `
            <div class="quiz-result">
                <h2>测验完成!</h2>
                <div class="score-circle">
                    <span class="score">${this.score}</span>
                    <span class="score-total">/ ${total}</span>
                </div>
                <p class="score-label">${pct >= 80 ? '优秀!' : pct >= 60 ? '及格!' : '继续加油!'}</p>
                <div class="quiz-summary">
                    ${this.answers.map((a, i) => `
                        <div class="quiz-summary-item ${a.correct ? 'correct' : 'wrong'}">第 ${i + 1} 题 ${a.correct ? '✅' : '❌'}</div>
                    `).join('')}
                </div>
            </div>`;
    }
}

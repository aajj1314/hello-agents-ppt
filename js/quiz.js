/**
 * Quiz System - Manages quiz rendering, answering, and scoring
 */
class QuizSystem {
    constructor(chapterId, container) {
        this.chapterId = chapterId;
        this.container = container;
        this.questions = [];
        this.currentIndex = 0;
        this.score = 0;
        this.answers = [];
        this.submitted = false;

        this.init();
    }

    async init() {
        const data = await loadJSON('data/quiz-data.json');
        this.questions = data[this.chapterId] || [];

        if (this.questions.length === 0) {
            this.container.innerHTML = '<p class="text-center text-muted">本章暂无测验题目</p>';
            return;
        }

        this.render();
    }

    render() {
        if (this.currentIndex >= this.questions.length) {
            this.renderResult();
            return;
        }

        const q = this.questions[this.currentIndex];
        this.submitted = false;

        this.container.innerHTML = '';

        // Progress
        const progressEl = createElement('div', { className: 'quiz-progress' },
            `第 ${this.currentIndex + 1} / ${this.questions.length} 题`
        );

        // Question
        const questionEl = createElement('div', { className: 'quiz-question' }, q.question);

        // Options
        const optionsEl = createElement('div', { className: 'quiz-options' });

        if (q.type === 'judge') {
            // True/False
            ['true', 'false'].forEach((val, idx) => {
                const option = createElement('label', { className: 'quiz-option' });
                option.innerHTML = `
                    <input type="radio" name="quiz-answer" value="${val}">
                    <span class="option-label">${idx === 0 ? 'A' : 'B'}</span>
                    <span class="option-text">${val === 'true' ? '正确' : '错误'}</span>
                `;
                option.addEventListener('click', () => this.selectOption(option, val));
                optionsEl.appendChild(option);
            });
        } else {
            // Single/Multiple choice
            q.options.forEach(opt => {
                const option = createElement('label', { className: 'quiz-option' });
                const inputType = q.type === 'multiple' ? 'checkbox' : 'radio';
                option.innerHTML = `
                    <input type="${inputType}" name="quiz-answer" value="${opt.id}">
                    <span class="option-label">${opt.id}</span>
                    <span class="option-text">${opt.text}</span>
                `;
                option.addEventListener('click', () => this.selectOption(option, opt.id));
                optionsEl.appendChild(option);
            });
        }

        // Actions
        const actionsEl = createElement('div', { className: 'quiz-actions' });
        const submitBtn = createElement('button', {
            className: 'btn btn-primary',
            id: 'btn-submit'
        }, '提交答案');
        submitBtn.addEventListener('click', () => this.submit());
        actionsEl.appendChild(submitBtn);

        // Explanation (hidden initially)
        const explanationEl = createElement('div', {
            className: 'quiz-explanation hidden',
            id: 'quiz-explanation'
        });

        this.container.appendChild(progressEl);
        this.container.appendChild(questionEl);
        this.container.appendChild(optionsEl);
        this.container.appendChild(actionsEl);
        this.container.appendChild(explanationEl);
    }

    selectOption(optionEl, value) {
        if (this.submitted) return;

        const q = this.questions[this.currentIndex];

        if (q.type === 'multiple') {
            optionEl.classList.toggle('selected');
        } else {
            $$('.quiz-option').forEach(el => el.classList.remove('selected'));
            optionEl.classList.add('selected');
        }
    }

    getSelectedAnswers() {
        const q = this.questions[this.currentIndex];
        const selected = $$('.quiz-option.selected');

        if (q.type === 'multiple') {
            return selected.map(el => {
                const input = el.querySelector('input');
                return input ? input.value : null;
            }).filter(Boolean);
        } else if (q.type === 'judge') {
            const selectedOption = selected[0];
            if (!selectedOption) return null;
            const input = selectedOption.querySelector('input');
            return input ? input.value === 'true' : null;
        } else {
            const selectedOption = selected[0];
            if (!selectedOption) return null;
            const input = selectedOption.querySelector('input');
            return input ? input.value : null;
        }
    }

    submit() {
        if (this.submitted) return;

        const answer = this.getSelectedAnswers();
        if (answer === null || (Array.isArray(answer) && answer.length === 0)) {
            alert('请先选择一个答案');
            return;
        }

        const q = this.questions[this.currentIndex];
        let isCorrect = false;

        if (q.type === 'multiple') {
            const correctAnswers = q.answer.split('');
            isCorrect = answer.length === correctAnswers.length &&
                       answer.every(a => correctAnswers.includes(a));
        } else if (q.type === 'judge') {
            isCorrect = answer === q.answer;
        } else {
            isCorrect = answer === q.answer;
        }

        this.submitted = true;
        this.answers.push({ questionId: q.id, correct: isCorrect });
        if (isCorrect) this.score += 10;

        // Update UI
        $$('.quiz-option').forEach((el, idx) => {
            const input = el.querySelector('input');
            const value = input ? input.value : null;
            let isThisCorrect = false;

            if (q.type === 'multiple') {
                isThisCorrect = q.answer.includes(value);
            } else if (q.type === 'judge') {
                isThisCorrect = (value === 'true') === q.answer;
            } else {
                isThisCorrect = value === q.answer;
            }

            if (isThisCorrect) {
                el.classList.add('correct');
            } else if (el.classList.contains('selected') && !isThisCorrect) {
                el.classList.add('wrong');
            }

            // Disable inputs
            input.disabled = true;
        });

        // Show explanation
        const explanationEl = $('#quiz-explanation');
        explanationEl.className = `quiz-explanation ${isCorrect ? 'correct' : 'wrong'}`;
        explanationEl.innerHTML = `
            <strong>${isCorrect ? '✅ 正确！' : '❌ 错误'}</strong>
            <p>${q.explanation}</p>
        `;
        explanationEl.classList.remove('hidden');

        // Change button
        const actionsEl = $('.quiz-actions');
        actionsEl.innerHTML = '';
        const nextBtn = createElement('button', { className: 'btn btn-primary' },
            this.currentIndex < this.questions.length - 1 ? '下一题 →' : '查看结果'
        );
        nextBtn.addEventListener('click', () => {
            this.currentIndex++;
            this.render();
        });
        actionsEl.appendChild(nextBtn);
    }

    renderResult() {
        const totalScore = this.score;
        const maxScore = this.questions.length * 10;
        const percentage = Math.round((totalScore / maxScore) * 100);

        let grade = '不及格';
        let gradeColor = 'var(--danger)';
        if (percentage >= 100) { grade = '优秀'; gradeColor = 'var(--success)'; }
        else if (percentage >= 80) { grade = '良好'; gradeColor = 'var(--info)'; }
        else if (percentage >= 60) { grade = '及格'; gradeColor = 'var(--warning)'; }

        // Save to storage
        Storage.setChapterProgress(this.chapterId, {
            completed: percentage >= 60,
            quizScore: totalScore
        });

        this.container.innerHTML = '';

        const resultEl = createElement('div', { className: 'quiz-result' });
        resultEl.innerHTML = `
            <div class="score" style="color: ${gradeColor}">${totalScore}</div>
            <div class="score-label">
                得分：${totalScore}/${maxScore} (${percentage}%)<br>
                评级：<strong style="color: ${gradeColor}">${grade}</strong>
            </div>
            <div class="quiz-actions">
                <button class="btn btn-secondary" id="btn-retry">重新测验</button>
                <a href="index.html" class="btn btn-primary">返回首页</a>
            </div>
        `;

        this.container.appendChild(resultEl);

        $('#btn-retry').addEventListener('click', () => {
            this.currentIndex = 0;
            this.score = 0;
            this.answers = [];
            this.render();
        });
    }
}

window.QuizSystem = QuizSystem;
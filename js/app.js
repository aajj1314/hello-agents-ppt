/**
 * Main Application - Chapter navigation and progress management
 */
class App {
    constructor() {
        this.chapters = [];
        this.grid = $('#chapterGrid');
        this.init();
    }

    async init() {
        const data = await loadJSON('data/chapters.json');
        this.chapters = data.chapters;
        this.render();
        this.setupEventListeners();
    }

    render() {
        this.grid.innerHTML = '';

        this.chapters.forEach(chapter => {
            const progress = Storage.getChapterProgress(chapter.id);
            const isCompleted = progress.completed;
            const quizScore = progress.quizScore || 0;

            const card = createElement('div', {
                className: `card chapter-card ${isCompleted ? 'completed' : ''}`,
                dataset: { chapterId: chapter.id }
            });

            const progressPercent = isCompleted ? 100 : (progress.slideIndex > 0 ? 50 : 0);
            const coverImage = chapter.id === 'ch1' ? 'assets/images/ch1-cover.jpg' : 
                              chapter.id === 'ch4' ? 'assets/images/ch4-cover.jpg' : '';

            const badges = [];
            if (chapter.hasAnimation) badges.push('<span class="ch-badge animation">动画</span>');
            if (chapter.hasQuiz) badges.push('<span class="ch-badge quiz">测验</span>');

            card.innerHTML = `
                ${coverImage ? `<img class="card-image" src="${coverImage}" alt="${escapeHTML(chapter.title)}">` : ''}
                <div class="card-content">
                    <div class="ch-title">${escapeHTML(chapter.title)}</div>
                    <div class="ch-subtitle">${escapeHTML(chapter.subtitle)}</div>
                    <div class="ch-meta">
                        <div class="ch-progress">
                            <div class="progress-bar-mini">
                                <div class="fill" style="width: ${progressPercent}%"></div>
                            </div>
                            <span>${progressPercent}%</span>
                        </div>
                        <div class="ch-badges">${badges.join('')}</div>
                    </div>
                    ${quizScore > 0 ? `<div style="margin-top: 8px; font-size: 0.8rem; color: var(--success)">测验得分: ${quizScore}</div>` : ''}
                </div>
            `;

            card.addEventListener('click', () => {
                window.location.href = `slides.html?chapter=${chapter.id}`;
            });

            this.grid.appendChild(card);
        });

        // Update hero progress
        const overallProgress = Storage.getOverallProgress(this.chapters.map(c => c.id));
        const heroFill = $('#heroProgressFill');
        const heroText = $('#heroProgressText');
        if (heroFill) heroFill.style.width = overallProgress + '%';
        if (heroText) heroText.textContent = overallProgress + '%';
    }

    setupEventListeners() {
        // Start learning button
        const btnStart = $('#btnStart');
        if (btnStart) {
            btnStart.addEventListener('click', () => {
                const firstChapter = this.chapters[0];
                if (firstChapter) {
                    window.location.href = `slides.html?chapter=${firstChapter.id}`;
                }
            });
        }

        // Continue button
        const btnContinue = $('#btnContinue');
        if (btnContinue) {
            btnContinue.addEventListener('click', () => {
                const last = Storage.getLastVisited();
                if (last.chapterId) {
                    window.location.href = `slides.html?chapter=${last.chapterId}`;
                } else {
                    alert('还没有学习记录，点击"开始学习"');
                }
            });
        }

        // Reset button
        const btnReset = $('#btnReset');
        if (btnReset) {
            btnReset.addEventListener('click', () => {
                if (confirm('确定要重置所有学习进度吗？此操作不可恢复。')) {
                    Storage.reset();
                    this.render();
                    alert('进度已重置');
                }
            });
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if ($('#chapterGrid')) {
        window.app = new App();
    }
});
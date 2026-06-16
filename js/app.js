/**
 * Main Application - Chapter navigation and progress management
 * Enhanced with hero stats and richer chapter cards
 */
class App {
    constructor() {
        this.chapters = [];
        this.grid = document.getElementById('chapterGrid');
        this.init();
    }

    async init() {
        const data = await loadJSON('data/chapters.json');
        this.chapters = data.chapters;
        this.renderStats();
        this.render();
        this.setupEventListeners();
    }

    renderStats() {
        const totalSlides = this.chapters.reduce((sum, c) => sum + (Array.isArray(c.slides) ? c.slides.length : 0), 0);
        const totalAnims = this.chapters.filter(c => c.hasAnimation).length;
        const totalQuizzes = this.chapters.filter(c => c.hasQuiz).length;

        const el = (id, val) => {
            const e = document.getElementById(id);
            if (!e) return;
            // Count-up animation
            const duration = 800;
            const start = 0;
            const startTime = performance.now();
            const step = (now) => {
                const progress = Math.min((now - startTime) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                e.textContent = Math.round(start + (val - start) * eased);
                if (progress < 1) requestAnimationFrame(step);
                else e.textContent = val;
            };
            requestAnimationFrame(step);
        };

        el('statChapters', this.chapters.length);
        el('statPages', totalSlides);
        el('statAnimations', totalAnims);
        el('statQuizzes', totalQuizzes);
    }

    render() {
        if (!this.grid) return;
        this.grid.innerHTML = '';

        this.chapters.forEach((chapter, index) => {
            const progress = Storage.getChapterProgress(chapter.id);
            const isCompleted = progress.completed;
            const quizScore = progress.quizScore || 0;

            const slideCount = Array.isArray(chapter.slides) ? chapter.slides.length : 0;
            const currentSlide = typeof progress.slideIndex === 'number' ? progress.slideIndex : 0;
            const progressPercent = slideCount > 0
                ? Math.round((currentSlide / (slideCount - 1)) * 100)
                : 0;

            const badges = [];
            if (chapter.hasAnimation) badges.push('<span class="ch-badge animation">✦ 动画</span>');
            if (chapter.hasQuiz) badges.push('<span class="ch-badge quiz">✎ 测验</span>');
            badges.push(`<span class="ch-badge pages">${slideCount} 页</span>`);

            const card = createElement('div', {
                className: `card chapter-card ${isCompleted ? 'completed' : ''}`,
                dataset: { chapterId: chapter.id }
            });

            card.innerHTML = `
                <div class="card-header">
                    <div class="ch-number">${String(index + 1).padStart(2, '0')}</div>
                    <div class="ch-icon">${escapeHTML(chapter.icon || '📘')}</div>
                    ${isCompleted ? '<div class="ch-card-check">✓</div>' : ''}
                </div>
                <div class="card-content">
                    <div class="ch-title">${escapeHTML(chapter.title)}</div>
                    <div class="ch-subtitle">${escapeHTML(chapter.subtitle || '')}</div>
                    <div class="ch-features">
                        ${chapter.features && chapter.features.length ?
                            chapter.features.map(f => `<span class="ch-feature">${escapeHTML(f)}</span>`).join('')
                            : ''}
                    </div>
                    <div class="ch-meta">
                        <div class="ch-progress">
                            <div class="progress-bar-mini">
                                <div class="fill" style="width: ${Math.max(5, progressPercent)}%"></div>
                            </div>
                            <span class="ch-progress-label">${progressPercent}%</span>
                        </div>
                        <div class="ch-badges">${badges.join('')}</div>
                    </div>
                    ${quizScore > 0 ? `<div class="ch-quiz-score">✎ 测验得分: <strong>${quizScore}</strong></div>` : ''}
                </div>
                <div class="ch-arrow">→</div>
            `;

            card.addEventListener('click', () => {
                window.location.href = `slides.html?chapter=${chapter.id}`;
            });

            this.grid.appendChild(card);
        });

        // Update hero progress
        const overallProgress = Storage.getOverallProgress(this.chapters.map(c => c.id));
        const heroFill = document.getElementById('heroProgressFill');
        const heroText = document.getElementById('heroProgressText');
        if (heroFill) {
            heroFill.style.width = overallProgress + '%';
            heroFill.style.transition = 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)';
        }
        if (heroText) heroText.textContent = overallProgress + '%';
    }

    setupEventListeners() {
        // Start
        const btnStart = document.getElementById('btnStart');
        if (btnStart) {
            btnStart.addEventListener('click', () => {
                const firstChapter = this.chapters[0];
                if (firstChapter) {
                    window.location.href = `slides.html?chapter=${firstChapter.id}`;
                }
            });
        }

        // Continue
        const btnContinue = document.getElementById('btnContinue');
        if (btnContinue) {
            btnContinue.addEventListener('click', () => {
                const last = Storage.getLastVisited();
                if (last.chapterId) {
                    window.location.href = `slides.html?chapter=${last.chapterId}`;
                } else {
                    // Start from first chapter
                    const firstChapter = this.chapters[0];
                    if (firstChapter) {
                        window.location.href = `slides.html?chapter=${firstChapter.id}`;
                    }
                }
            });
        }

        // Reset
        const btnReset = document.getElementById('btnReset');
        if (btnReset) {
            btnReset.addEventListener('click', () => {
                if (confirm('确定要重置所有学习进度吗？此操作不可恢复。')) {
                    Storage.reset();
                    this.renderStats();
                    this.render();
                    alert('进度已重置');
                }
            });
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('chapterGrid')) {
        window.app = new App();
    }
});

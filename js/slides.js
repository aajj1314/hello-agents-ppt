/**
 * Slide Engine - Manages slide rendering, navigation, and transitions
 */
class SlideEngine {
    constructor() {
        this.chapterId = null;
        this.chapterData = null;
        this.slides = [];
        this.currentIndex = 0;
        this.stage = $('#slideStage');
        this.titleEl = $('#chapterTitle');
        this.progressEl = $('#slideProgress');
        this.progressBar = $('#progressBar');
        this.notesEl = $('#slideNotes');
        this.btnPrev = $('#btnPrev');
        this.btnNext = $('#btnNext');

        this.init();
    }

    async init() {
        const params = getURLParams();
        this.chapterId = params.chapter;

        if (!this.chapterId) {
            window.location.href = 'index.html';
            return;
        }

        // Load chapter data
        const data = await loadJSON('data/chapters.json');
        this.chapterData = data.chapters.find(c => c.id === this.chapterId);

        if (!this.chapterData) {
            window.location.href = 'index.html';
            return;
        }

        this.slides = this.chapterData.slides;

        // Restore progress
        const progress = Storage.getChapterProgress(this.chapterId);
        this.currentIndex = Math.min(progress.slideIndex, this.slides.length - 1);

        this.setupEventListeners();
        this.render();
        this.updateUI();
    }

    setupEventListeners() {
        // Navigation buttons
        this.btnPrev.addEventListener('click', () => this.prev());
        this.btnNext.addEventListener('click', () => this.next());

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault();
                this.next();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.prev();
            } else if (e.key === 'f') {
                this.toggleFullscreen();
            }
        });

        // Touch/swipe support
        let touchStartX = 0;
        this.stage.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        }, { passive: true });

        this.stage.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const diff = touchStartX - touchEndX;
            if (Math.abs(diff) > 50) {
                diff > 0 ? this.next() : this.prev();
            }
        }, { passive: true });

        // Progress bar click
        this.progressBar.addEventListener('click', (e) => {
            const rect = this.progressBar.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            const index = Math.floor(ratio * this.slides.length);
            this.goTo(index);
        });
    }

    render() {
        this.titleEl.textContent = this.chapterData.title;
        this.stage.innerHTML = '';

        this.slides.forEach((slide, index) => {
            const slideEl = this.createSlideElement(slide, index);
            this.stage.appendChild(slideEl);
        });

        this.updateSlideVisibility();
    }

    createSlideElement(slide, index) {
        const el = createElement('div', {
            className: `slide slide-${slide.type}`,
            dataset: { index }
        });

        switch (slide.type) {
            case 'cover':
                el.innerHTML = `
                    <div class="slide-icon">${this.chapterData.icon}</div>
                    <h2>${escapeHTML(slide.title)}</h2>
                    <p class="slide-subtitle">${escapeHTML(slide.subtitle)}</p>
                `;
                break;

            case 'content':
                el.innerHTML = `
                    <h3>${escapeHTML(slide.title)}</h3>
                    <div class="content-body">
                        <p>${escapeHTML(slide.content)}</p>
                    </div>
                `;
                break;

            case 'animation':
                el.innerHTML = `
                    <h3>${escapeHTML(slide.title)}</h3>
                    <div class="animation-container" id="anim-${slide.animation}">
                        <canvas id="canvas-${slide.animation}"></canvas>
                    </div>
                    <div class="animation-controls">
                        <button id="btn-play-${slide.animation}">▶ 播放</button>
                        <button id="btn-step-${slide.animation}">⏭ 单步</button>
                        <button id="btn-reset-${slide.animation}">↺ 重置</button>
                        <div class="speed-slider">
                            <span>速度:</span>
                            <input type="range" min="0.5" max="2" step="0.5" value="1"
                                   id="speed-${slide.animation}">
                        </div>
                    </div>
                `;
                // Initialize animation after DOM insertion
                setTimeout(() => this.initAnimation(slide.animation), 0);
                break;

            case 'code':
                el.innerHTML = `
                    <h3>${escapeHTML(slide.title)}</h3>
                    <pre><code class="language-${slide.language}">${escapeHTML(slide.code)}</code></pre>
                `;
                setTimeout(() => Prism.highlightElement(el.querySelector('code')), 0);
                break;

            case 'quiz':
                el.innerHTML = `
                    <div class="quiz-container" id="quiz-container"></div>
                `;
                setTimeout(() => this.initQuiz(), 0);
                break;
        }

        return el;
    }

    initAnimation(animationId) {
        // Animation modules will be loaded dynamically
        if (window.Animations && window.Animations[animationId]) {
            const canvas = $(`#canvas-${animationId}`);
            const container = $(`#anim-${animationId}`);
            if (canvas && container) {
                canvas.width = container.clientWidth;
                canvas.height = container.clientHeight || 400;
                window.Animations[animationId].init(canvas);
            }
        }
    }

    initQuiz() {
        const container = $('#quiz-container');
        if (container && window.QuizSystem) {
            this.quiz = new QuizSystem(this.chapterId, container);
        }
    }

    updateSlideVisibility() {
        $$('.slide').forEach((el, index) => {
            el.classList.remove('active', 'prev');
            if (index === this.currentIndex) {
                el.classList.add('active');
            } else if (index < this.currentIndex) {
                el.classList.add('prev');
            }
        });
    }

    updateUI() {
        // Progress text
        this.progressEl.textContent = `${this.currentIndex + 1} / ${this.slides.length}`;

        // Progress bar
        const progress = ((this.currentIndex + 1) / this.slides.length) * 100;
        this.progressBar.innerHTML = `<div class="fill" style="width: ${progress}%"></div>`;

        // Button states
        this.btnPrev.disabled = this.currentIndex === 0;
        this.btnNext.disabled = this.currentIndex === this.slides.length - 1;

        // Notes
        const currentSlide = this.slides[this.currentIndex];
        if (currentSlide.notes) {
            this.notesEl.textContent = currentSlide.notes;
            this.notesEl.classList.remove('hidden');
        } else {
            this.notesEl.classList.add('hidden');
        }

        // Save progress
        Storage.setChapterProgress(this.chapterId, { slideIndex: this.currentIndex });
        Storage.setLastVisited(this.chapterId, this.currentIndex);
    }

    next() {
        if (this.currentIndex < this.slides.length - 1) {
            this.currentIndex++;
            this.updateSlideVisibility();
            this.updateUI();
        }
    }

    prev() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.updateSlideVisibility();
            this.updateUI();
        }
    }

    goTo(index) {
        if (index >= 0 && index < this.slides.length) {
            this.currentIndex = index;
            this.updateSlideVisibility();
            this.updateUI();
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if ($('#slideStage')) {
        window.slideEngine = new SlideEngine();
    }
});
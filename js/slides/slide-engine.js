// js/slides/slide-engine.js
import { $, createElement, loadJSON } from '../core/utils.js';
import { Storage } from '../core/storage.js';
import { SlideRouter } from './slide-router.js';
import { renderCover } from './renderers/cover.js';
import { renderContent } from './renderers/content.js';
import { renderCode } from './renderers/code.js';
import { renderQuiz } from './renderers/quiz.js';
import { renderAnimation } from './renderers/animation.js';
import { renderTimeline } from './renderers/timeline.js';
import { renderFlow } from './renderers/flow.js';
import { renderConcepts } from './renderers/concepts.js';
import { renderComparison } from './renderers/comparison.js';
import { renderGeneric } from './renderers/generic.js';
import { getAnimation } from '../animations/animation-registry.js';
import { VideoAnimation } from '../animations/video-animation.js';
import { QuizSystem } from '../quiz/quiz-system.js';

export class SlideEngine {
    constructor(params = null) {
        this.chapterId = null;
        this.chapterData = null;
        this.slides = [];
        this.currentIndex = 0;
        this.params = params;
        this.router = this._buildRouter();
        this.stage = $('#slideStage');
        this.titleEl = $('#chapterTitle');
        this.subtitleEl = $('#chapterSubtitle');
        this.progressEl = $('#slideProgress');
        this.progressBar = $('#progressBar');
        this.btnHome = $('#btnHome');
        this.btnPrev = $('#btnPrev');
        this.btnNext = $('#btnNext');
        this.btnPrevBottom = $('#btnPrevBottom');
        this.btnNextBottom = $('#btnNextBottom');
        this._animMounted = new Set();
    }

    _buildRouter() {
        const r = new SlideRouter();
        r.register('cover', renderCover);
        r.register('content', renderContent);
        r.register('code', renderCode);
        r.register('quiz', renderQuiz);
        r.register('animation', renderAnimation);
        r.register('timeline', renderTimeline);
        r.register('flow', renderFlow);
        r.register('concepts', renderConcepts);
        r.register('comparison', renderComparison);
        r.register('generic', renderGeneric);
        r.defaultFallback = renderGeneric;
        return r;
    }

    async init() {
        const params = this.params ?? Object.fromEntries(new URLSearchParams(window.location.search).entries());
        this.chapterId = params.chapter;
        if (!this.chapterId) { window.location.href = 'index.html'; return; }

        const data = await loadJSON('data/chapters.json');
        this.chapterData = data.chapters.find(c => c.id === this.chapterId);
        if (!this.chapterData) { window.location.href = 'index.html'; return; }

        this.slides = this.chapterData.slides;
        const progress = Storage.getChapterProgress(this.chapterId);
        if (params.slide !== undefined) {
            this.currentIndex = Math.max(0, Math.min(parseInt(params.slide, 10) - 1, this.slides.length - 1));
        } else {
            this.currentIndex = Math.min(progress.slideIndex || 0, this.slides.length - 1);
        }
        if (this.subtitleEl) this.subtitleEl.textContent = this.chapterData.subtitle || '';
        this._bindEvents();
        this.render();
        this.updateUI();
    }

    _bindEvents() {
        if (this.btnHome) this.btnHome.addEventListener('click', () => { window.location.href = 'index.html'; });
        if (this.btnPrev) this.btnPrev.addEventListener('click', () => this.prev());
        if (this.btnNext) this.btnNext.addEventListener('click', () => this.next());
        if (this.btnPrevBottom) this.btnPrevBottom.addEventListener('click', () => this.prev());
        if (this.btnNextBottom) this.btnNextBottom.addEventListener('click', () => this.next());

        document.addEventListener('keydown', (e) => {
            const tag = (e.target && e.target.tagName) || '';
            if (tag === 'INPUT' || tag === 'TEXTAREA') return;
            if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); this.next(); }
            else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); this.prev(); }
        });

        if (this.progressBar) {
            this.progressBar.addEventListener('click', (e) => {
                const rect = this.progressBar.getBoundingClientRect();
                const ratio = (e.clientX - rect.left) / rect.width;
                const index = Math.max(0, Math.min(this.slides.length - 1, Math.floor(ratio * this.slides.length)));
                this.goTo(index);
            });
        }
    }

    render() {
        if (this.titleEl) this.titleEl.textContent = this.chapterData.title;
        if (this.subtitleEl) this.subtitleEl.textContent = this.chapterData.subtitle || '';
        this.stage.innerHTML = '';
        this._animMounted.clear();
        this.slides.forEach((slide, index) => {
            const el = createElement('div', {
                className: `slide-content slide-${slide.type}`,
                dataset: { index }
            });
            const html = this.router.route(slide, {
                chapterData: this.chapterData,
                slideIndex: index,
                slidesLength: this.slides.length
            });
            el.innerHTML = html;
            this.stage.appendChild(el);
            if (slide.type === 'animation') setTimeout(() => this._mountAnimation(slide), 0);
            if (slide.type === 'quiz') setTimeout(() => this._mountQuiz(), 0);
        });
        this.updateSlideVisibility();
    }

    _mountAnimation(slide) {
        const id = slide.animation;
        const container = document.getElementById(`anim-${id}`);
        const canvas = document.getElementById(`canvas-${id}`);
        if (!container || !canvas) return;

        const videoSrc = slide.media?.video;
        const factory = getAnimation(id);

        if (videoSrc) {
            const v = container.querySelector('video');
            if (v) {
                v.addEventListener('error', () => this._initCanvasAnimation(id, canvas, factory), { once: true });
                v.addEventListener('canplay', () => this._wireAnimationControls(id, { play: () => v.play(), pause: () => v.pause(), step: () => { v.currentTime = Math.min(v.duration || 0, v.currentTime + 1); }, reset: () => { v.currentTime = 0; }, isPlaying: () => !v.paused }), { once: true });
            }
        }
        if (factory) this._initCanvasAnimation(id, canvas, factory);
    }

    _initCanvasAnimation(id, canvas, factory) {
        const anim = factory();
        try { anim.init(canvas); } catch (e) { console.warn('anim init failed', e); }
        window.Animations = window.Animations || {};
        window.Animations[id] = anim;
        this._animMounted.add(id);
        this._wireAnimationControls(id, anim);
    }

    _wireAnimationControls(id, anim) {
        const btnPlay = document.getElementById(`btn-play-${id}`);
        const btnStep = document.getElementById(`btn-step-${id}`);
        const btnReset = document.getElementById(`btn-reset-${id}`);
        const speedInput = document.getElementById(`speed-${id}`);
        const speedVal = document.getElementById(`speed-val-${id}`);
        if (btnPlay && anim.play) btnPlay.addEventListener('click', () => {
            anim.play();
            btnPlay.textContent = anim.isPlaying?.() ? '⏸ 暂停' : '▶ 播放';
        });
        if (btnStep && anim.step) btnStep.addEventListener('click', () => anim.step());
        if (btnReset && anim.reset) btnReset.addEventListener('click', () => { anim.reset(); if (btnPlay) btnPlay.textContent = '▶ 播放'; });
        if (speedInput) speedInput.addEventListener('input', () => {
            const v = parseFloat(speedInput.value);
            if (speedVal) speedVal.textContent = v.toFixed(2) + 'x';
            anim.setSpeed?.(v);
        });
    }

    _mountQuiz() {
        const container = document.getElementById('quiz-container');
        if (container) {
            this.quiz = new QuizSystem(this.chapterId, container);
            this.quiz.init();
        }
    }

    updateSlideVisibility() {
        const all = this.stage.querySelectorAll('.slide-content');
        all.forEach((el, i) => {
            el.classList.toggle('active', i === this.currentIndex);
        });
    }

    updateUI() {
        if (this.progressEl) this.progressEl.textContent = `${this.currentIndex + 1} / ${this.slides.length}`;
        if (this.progressBar) {
            const pct = ((this.currentIndex + 1) / this.slides.length) * 100;
            this.progressBar.innerHTML = `<div class="fill" style="width: ${pct}%"></div>`;
        }
        const first = this.currentIndex === 0, last = this.currentIndex === this.slides.length - 1;
        if (this.btnPrev) this.btnPrev.disabled = first;
        if (this.btnNext) this.btnNext.disabled = last;
        if (this.btnPrevBottom) this.btnPrevBottom.disabled = first;
        if (this.btnNextBottom) this.btnNextBottom.disabled = last;
        Storage.setChapterProgress(this.chapterId, { slideIndex: this.currentIndex });
        Storage.setLastVisited(this.chapterId, this.currentIndex);
    }

    next() { if (this.currentIndex < this.slides.length - 1) { this.currentIndex++; this.updateSlideVisibility(); this.updateUI(); } }
    prev() { if (this.currentIndex > 0) { this.currentIndex--; this.updateSlideVisibility(); this.updateUI(); } }
    goTo(i) { if (i >= 0 && i < this.slides.length) { this.currentIndex = i; this.updateSlideVisibility(); this.updateUI(); } }
}

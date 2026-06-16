// js/app.js - index.html page logic
import { $, $$, createElement, escapeHTML, loadJSON } from './core/utils.js';
import { Storage } from './core/storage.js';
import { bindThemeToggle } from './theme.js';

class App {
    constructor() {
        this.chapters = [];
        this.grid = $('#chapterGrid');
        this.init();
    }

    async init() {
        const data = await loadJSON('data/chapters.json');
        this.chapters = data.chapters;
        this.renderStats();
        this.render();
        this.bindButtons();
        bindThemeToggle();
    }

    renderStats() {
        const totalSlides = this.chapters.reduce((s, c) => s + (Array.isArray(c.slides) ? c.slides.length : 0), 0);
        const totalAnims = this.chapters.filter(c => c.hasAnimation).length;
        const totalQuizzes = this.chapters.filter(c => c.hasQuiz).length;
        const animate = (id, val) => {
            const e = document.getElementById(id);
            if (!e) return;
            const start = performance.now();
            const step = (now) => {
                const p = Math.min((now - start) / 800, 1);
                const eased = 1 - Math.pow(1 - p, 3);
                e.textContent = Math.round(val * eased);
                if (p < 1) requestAnimationFrame(step);
                else e.textContent = val;
            };
            requestAnimationFrame(step);
        };
        animate('statChapters', this.chapters.length);
        animate('statPages', totalSlides);
        animate('statAnimations', totalAnims);
        animate('statQuizzes', totalQuizzes);
    }

    render() {
        if (!this.grid) return;
        this.grid.innerHTML = '';
        this.chapters.forEach((chapter, index) => {
            const progress = Storage.getChapterProgress(chapter.id);
            const isCompleted = progress.completed;
            const slideCount = Array.isArray(chapter.slides) ? chapter.slides.length : 0;
            const currentSlide = progress.slideIndex || 0;
            const progressPercent = slideCount > 0 ? Math.round((currentSlide / (slideCount - 1)) * 100) : 0;
            const badges = [];
            if (chapter.hasAnimation) badges.push('<span class="ch-badge animation">✦ 动画</span>');
            if (chapter.hasQuiz) badges.push('<span class="ch-badge quiz">✎ 测验</span>');
            badges.push(`<span class="ch-badge pages">${slideCount} 页</span>`);

            const card = createElement('div', { className: `card chapter-card ${isCompleted ? 'completed' : ''}` });
            card.innerHTML = `
                <div class="card-header">
                    <div class="ch-number">${String(index + 1).padStart(2, '0')}</div>
                    <div class="ch-icon">${escapeHTML(chapter.icon || '📘')}</div>
                    ${isCompleted ? '<div class="ch-card-check">✓</div>' : ''}
                </div>
                <div class="card-content">
                    <div class="ch-title">${escapeHTML(chapter.title)}</div>
                    <div class="ch-subtitle">${escapeHTML(chapter.subtitle || '')}</div>
                    <div class="ch-meta">
                        <div class="ch-progress">
                            <div class="progress-bar-mini"><div class="fill" style="width: ${Math.max(5, progressPercent)}%"></div></div>
                            <span class="ch-progress-label">${progressPercent}%</span>
                        </div>
                        <div class="ch-badges">${badges.join('')}</div>
                    </div>
                </div>
                <div class="ch-arrow">→</div>`;
            card.addEventListener('click', () => { window.location.href = `slides.html?chapter=${chapter.id}`; });
            this.grid.appendChild(card);
        });

        const overall = Storage.getOverallProgress(this.chapters.map(c => c.id));
        const heroFill = document.getElementById('heroProgressFill');
        const heroText = document.getElementById('heroProgressText');
        if (heroFill) { heroFill.style.width = overall + '%'; heroFill.style.transition = 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'; }
        if (heroText) heroText.textContent = overall + '%';
    }

    bindButtons() {
        const btnStart = document.getElementById('btnStart');
        if (btnStart) btnStart.addEventListener('click', () => {
            if (this.chapters[0]) window.location.href = `slides.html?chapter=${this.chapters[0].id}`;
        });
        const btnContinue = document.getElementById('btnContinue');
        if (btnContinue) btnContinue.addEventListener('click', () => {
            const last = Storage.getLastVisited();
            if (last.chapterId) window.location.href = `slides.html?chapter=${last.chapterId}`;
            else if (this.chapters[0]) window.location.href = `slides.html?chapter=${this.chapters[0].id}`;
        });
        const btnReset = document.getElementById('btnReset');
        if (btnReset) btnReset.addEventListener('click', () => {
            if (confirm('确定要重置所有学习进度吗？此操作不可恢复。')) {
                Storage.reset();
                this.renderStats();
                this.render();
                alert('进度已重置');
            }
        });
    }
}

if (document.getElementById('chapterGrid')) {
    document.addEventListener('DOMContentLoaded', () => new App());
}

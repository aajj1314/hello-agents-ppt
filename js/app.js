// js/app.js - index.html page logic (Aurora + Glassmorphism edition)
import { $, $$, createElement, escapeHTML, loadJSON } from './core/utils.js';
import { Storage } from './core/storage.js';
import { bindThemeToggle, syncThemeIcons } from './theme.js';
import { ICONS, resolveIcon } from './core/icons.js';

const prefersReducedMotion = () =>
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

class App {
    constructor() {
        this.chapters = [];
        this.grid = $('#chapterGrid');
        this.chipsHost = $('#chapterChips');
        this.stickyNav = $('#stickyNav');
        this.scrollBar = $('#scrollProgressBar');
        this.init();
    }

    async init() {
        const data = await loadJSON('data/chapters.json');
        this.chapters = data.chapters;
        this.renderStats();
        this.renderChips();
        this.render();
        this.bindButtons();
        this.bindScrollHandlers();
        bindThemeToggle();
        syncThemeIcons();
        this.initRevealOnScroll();
    }

    renderStats() {
        const totalSlides = this.chapters.reduce((s, c) => s + (Array.isArray(c.slides) ? c.slides.length : 0), 0);
        const totalAnims = this.chapters.filter(c => c.hasAnimation).length;
        const totalQuizzes = this.chapters.filter(c => c.hasQuiz).length;
        const animate = (id, val) => {
            const e = document.getElementById(id);
            if (!e) return;
            if (prefersReducedMotion()) { e.textContent = val; return; }
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

    renderChips() {
        if (!this.chipsHost) return;
        this.chipsHost.innerHTML = '';
        this.chapters.forEach((c, i) => {
            const progress = Storage.getChapterProgress(c.id);
            const isDone = progress.completed;
            const chip = createElement('button', {
                type: 'button',
                className: `nav-chip${isDone ? ' is-completed' : ''}`,
                'data-target': `chapter-${c.id}`,
                'aria-label': `跳转到第 ${i + 1} 章：${c.title}`,
                'aria-selected': 'false',
                role: 'tab'
            });
            chip.innerHTML = `<span class="nav-chip__dot" aria-hidden="true"></span><span>${i + 1}. ${escapeHTML(c.title)}</span>`;
            chip.addEventListener('click', () => {
                const target = document.getElementById(`chapter-${c.id}`);
                if (target) target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
            });
            this.chipsHost.appendChild(chip);
        });
    }

    render() {
        if (!this.grid) return;
        this.grid.innerHTML = '';
        this.chapters.forEach((chapter, index) => {
            const progress = Storage.getChapterProgress(chapter.id);
            const isCompleted = progress.completed;
            const slideCount = Array.isArray(chapter.slides) ? chapter.slides.length : 0;
            const currentSlide = progress.slideIndex || 0;
            const progressPercent = slideCount > 1
                ? Math.round((currentSlide / (slideCount - 1)) * 100)
                : (isCompleted ? 100 : 0);

            const badges = [];
            if (chapter.hasAnimation) badges.push(`<span class="ch-badge animation">${ICONS.sparkles}<span>动画</span></span>`);
            if (chapter.hasQuiz) badges.push(`<span class="ch-badge quiz">${ICONS.quiz}<span>测验</span></span>`);
            badges.push(`<span class="ch-badge pages">${ICONS.pages}<span>${slideCount} 页</span></span>`);

            const card = createElement('article', {
                className: `chapter-card reveal${isCompleted ? ' completed' : ''}`,
                id: `chapter-${chapter.id}`,
                tabIndex: 0,
                role: 'link',
                'aria-label': `${chapter.title}：${chapter.subtitle || ''}（${progressPercent}% 完成）`
            });
            card.innerHTML = `
                <div class="card-header">
                    <div class="ch-number">CH ${String(index + 1).padStart(2, '0')}</div>
                    <div class="ch-icon" aria-hidden="true">${resolveIcon(chapter.icon)}</div>
                    ${isCompleted ? `<div class="ch-card-check" aria-label="已完成">${ICONS.check}</div>` : ''}
                </div>
                <div class="card-content">
                    <h3 class="ch-title">${escapeHTML(chapter.title)}</h3>
                    <p class="ch-subtitle">${escapeHTML(chapter.subtitle || '')}</p>
                    <div class="ch-features">${badges.join('')}</div>
                    <div class="ch-meta">
                        <div class="ch-progress">
                            <div class="progress-bar-mini" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progressPercent}" aria-label="${chapter.title} 进度">
                                <div class="fill" style="width: ${Math.max(isCompleted ? 100 : 4, progressPercent)}%"></div>
                            </div>
                            <div class="ch-progress-label">
                                <span>学习进度</span>
                                <span>${progressPercent}%</span>
                            </div>
                        </div>
                        <div class="ch-arrow" aria-hidden="true">${ICONS.arrow}</div>
                    </div>
                </div>`;
            const go = () => { window.location.href = `slides.html?chapter=${chapter.id}`; };
            card.addEventListener('click', go);
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
            });
            this.grid.appendChild(card);
        });

        const overall = Storage.getOverallProgress(this.chapters.map(c => c.id));
        this.updateOverallProgress(overall);
    }

    updateOverallProgress(percent) {
        const safe = Math.max(0, Math.min(100, percent || 0));
        const heroFill = document.getElementById('heroProgressFill');
        const heroText = document.getElementById('heroProgressText');
        const heroBar = document.getElementById('heroProgressBar');
        const navText = document.getElementById('navProgressText');
        const navRing = document.getElementById('navProgressRing');

        if (heroFill) heroFill.style.width = safe + '%';
        if (heroText) heroText.textContent = safe + '%';
        if (heroBar) heroBar.setAttribute('aria-valuenow', safe);
        if (navText) navText.textContent = safe + '%';
        if (navRing) {
            const circumference = 2 * Math.PI * 15; // 94.2
            const offset = circumference * (1 - safe / 100);
            navRing.style.transition = prefersReducedMotion() ? 'none' : 'stroke-dashoffset 600ms cubic-bezier(0.4, 0, 0.2, 1)';
            navRing.setAttribute('stroke-dasharray', String(circumference));
            navRing.setAttribute('stroke-dashoffset', String(offset));
        }
    }

    bindScrollHandlers() {
        // Scroll progress bar
        const onScroll = () => {
            const doc = document.documentElement;
            const max = (doc.scrollHeight - window.innerHeight) || 1;
            const pct = Math.min(100, Math.max(0, (window.scrollY / max) * 100));
            if (this.scrollBar) this.scrollBar.style.width = pct + '%';

            // Sticky nav elevated state
            if (this.stickyNav) this.stickyNav.classList.toggle('is-scrolled', window.scrollY > 8);

            // Scroll-spy
            this.updateActiveChip();
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    updateActiveChip() {
        if (!this.chipsHost) return;
        const cards = $$('.chapter-card', this.grid || document);
        if (!cards.length) return;
        const triggerY = window.innerHeight * 0.4;
        let activeId = null;
        for (const card of cards) {
            const rect = card.getBoundingClientRect();
            if (rect.top <= triggerY && rect.bottom > 0) {
                activeId = card.id;
            }
        }
        const chips = $$('.nav-chip', this.chipsHost);
        chips.forEach((chip) => {
            const isActive = activeId && chip.dataset.target === activeId;
            chip.classList.toggle('is-active', !!isActive);
            chip.setAttribute('aria-selected', isActive ? 'true' : 'false');
            if (isActive) {
                // Bring chip into view inside scrollable chip strip (without affecting page scroll)
                const host = this.chipsHost;
                const cRect = chip.getBoundingClientRect();
                const hRect = host.getBoundingClientRect();
                if (cRect.left < hRect.left || cRect.right > hRect.right) {
                    chip.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'nearest', inline: 'center' });
                }
            }
        });
    }

    initRevealOnScroll() {
        if (!('IntersectionObserver' in window) || prefersReducedMotion()) {
            $$('.reveal').forEach(el => el.classList.add('is-visible'));
            return;
        }
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    io.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
        $$('.reveal').forEach((el, i) => {
            // Slight stagger for chapter cards only
            if (el.classList.contains('chapter-card')) {
                el.style.transitionDelay = (Math.min(i, 8) * 60) + 'ms';
            }
            io.observe(el);
        });
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
                this.renderChips();
                this.render();
                this.updateActiveChip();
                alert('进度已重置');
            }
        });
    }
}

if (document.getElementById('chapterGrid')) {
    document.addEventListener('DOMContentLoaded', () => new App());
}

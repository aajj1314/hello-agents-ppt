// js/app.js - index.html page logic (Aurora + Glassmorphism edition)
import { $, $$, createElement, escapeHTML, loadJSON } from './core/utils.js';
import { Storage } from './core/storage.js';
import { bindThemeToggle, syncThemeIcons } from './theme.js';
import { ICONS, resolveIcon } from './core/icons.js';

const GUIDE_ICONS = {
    brain: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    tools: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
    game: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h4"/><path d="M8 10v4"/><circle cx="17" cy="12" r="1.5"/></svg>',
    code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>'
};

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
        await this.renderHomeGuide();
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

    async renderHomeGuide() {
        const container = document.getElementById('guideGrid');
        if (!container) return;

        let guide;
        try {
            guide = await loadJSON('data/home-guide.json');
        } catch (e) {
            // 数据缺失或损坏时静默跳过，不影响首页
            container.closest('.hero-guide')?.classList.add('is-hidden');
            return;
        }

        const fragment = document.createDocumentFragment();
        fragment.appendChild(this._buildIntroCard(guide.agent_intro));
        fragment.appendChild(this._buildPathCard(guide.learning_path));
        fragment.appendChild(this._buildCapabilitiesCard(guide.capabilities));
        container.appendChild(fragment);
    }

    _buildIntroCard(intro) {
        const card = createElement('article', {
            className: 'guide-card',
            'aria-labelledby': 'guide-intro-title'
        });
        card.innerHTML = `
            <div class="guide-card__icon" aria-hidden="true">${GUIDE_ICONS[intro.icon] || ''}</div>
            <h3 class="guide-card__title" id="guide-intro-title">${escapeHTML(intro.title)}</h3>
            <p class="guide-card__lead">${escapeHTML(intro.definition)}</p>
            <p class="guide-card__analogy">${escapeHTML(intro.analogy)}</p>
            <p class="guide-card__note">${escapeHTML(intro.difference)}</p>
            <a class="guide-card__link" href="slides.html?chapter=${encodeURIComponent(intro.link.chapter)}&slide=${intro.link.slide}">${escapeHTML(intro.link.text)} →</a>
        `;
        return card;
    }

    _buildPathCard(path) {
        const card = createElement('article', {
            className: 'guide-card',
            'aria-labelledby': 'guide-path-title'
        });

        const stepsHtml = path.steps.map((step, index) => {
            const status = this._getStepStatus(step);
            const firstIncomplete = this._getFirstIncompleteChapter(step.chapters);
            const href = `slides.html?chapter=${encodeURIComponent(firstIncomplete || step.chapters[0])}&slide=1`;
            const statusLabel = status === 'completed' ? '已完成' : status === 'active' ? '进行中' : '未开始';
            return `
                <li class="guide-step guide-step--${status}">
                    <a class="guide-step__link" href="${href}" aria-label="${escapeHTML(step.title)}，${statusLabel}">
                        <span class="guide-step__marker" aria-hidden="true">
                            ${status === 'completed' ? '✓' : index + 1}
                        </span>
                        <span class="guide-step__body">
                            <span class="guide-step__title">${escapeHTML(step.title)}</span>
                            <span class="guide-step__desc">${escapeHTML(step.description)}</span>
                        </span>
                    </a>
                </li>
            `;
        }).join('');

        card.innerHTML = `
            <h3 class="guide-card__title" id="guide-path-title">${escapeHTML(path.title)}</h3>
            <ol class="guide-path">${stepsHtml}</ol>
        `;
        return card;
    }

    _getStepStatus(step) {
        const completed = step.chapters.every(ch => {
            const p = Storage.getChapterProgress(ch);
            return p && p.completed;
        });
        const started = step.chapters.some(ch => {
            const p = Storage.getChapterProgress(ch);
            return p && (p.slideIndex || 0) > 0;
        });
        if (completed) return 'completed';
        if (started) return 'active';
        return 'pending';
    }

    _getFirstIncompleteChapter(chapters) {
        for (const ch of chapters) {
            const p = Storage.getChapterProgress(ch);
            if (!p || !p.completed) return ch;
        }
        return null;
    }

    _buildCapabilitiesCard(capabilities) {
        const card = createElement('article', {
            className: 'guide-card',
            'aria-labelledby': 'guide-capabilities-title'
        });
        const itemsHtml = capabilities.items.map(item => `
            <div class="guide-capability">
                <span class="guide-capability__icon" aria-hidden="true">${GUIDE_ICONS[item.icon] || ''}</span>
                <span class="guide-capability__name">${escapeHTML(item.name)}</span>
                <span class="guide-capability__desc">${escapeHTML(item.desc)}</span>
            </div>
        `).join('');

        card.innerHTML = `
            <h3 class="guide-card__title" id="guide-capabilities-title">${escapeHTML(capabilities.title)}</h3>
            <div class="guide-capabilities">${itemsHtml}</div>
        `;
        return card;
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

export { App };

if (document.getElementById('chapterGrid')) {
    document.addEventListener('DOMContentLoaded', () => new App());
}

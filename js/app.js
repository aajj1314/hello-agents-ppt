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
        this.chapterTitleById = new Map();
        this.grid = $('#chapterGrid');
        this.chipsHost = $('#chapterChips');
        this.stickyNav = $('#stickyNav');
        this.scrollBar = $('#scrollProgressBar');
        this.glossaryHost = $('#glChips');
        this.glossaryDetail = $('#glDetail');
        this.glossarySearch = $('#glSearch');
        this.glossaryCount = $('#glCount');
        this.init();
    }

    async init() {
        const data = await loadJSON('data/chapters.json');
        this.chapters = data.chapters;
        this.chapterTitleById = new Map(this.chapters.map(c => [c.id, c.title]));
        this.renderStats();
        this.renderChips();
        await this.renderHomeGuide();
        await this.renderConceptMap();
        this.render();
        this.renderGlossary();
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

    async renderConceptMap() {
        const section = document.getElementById('conceptMap');
        if (!section) return;
        const canvas = document.getElementById('cmCanvas');
        const legend = document.getElementById('cmLegend');
        const countEl = document.getElementById('cmCount');
        if (!canvas) return;

        let data;
        try {
            data = await loadJSON('data/concept-map.json');
        } catch (e) {
            section.classList.add('is-hidden');
            return;
        }

        const concepts = Array.isArray(data.concepts) ? data.concepts : [];
        const chapterLinks = Array.isArray(data.chapter_links) ? data.chapter_links : [];

        const CHAPTER_GROUPS = [
            { id: 'g1', label: 'CH1–CH3 基础', color: '#7C3AED', chapters: ['ch1', 'ch2', 'ch3'] },
            { id: 'g2', label: 'CH4–CH7 范式', color: '#06B6D4', chapters: ['ch4', 'ch5', 'ch6', 'ch7'] },
            { id: 'g3', label: 'CH8–CH10 协议', color: '#10B981', chapters: ['ch8', 'ch9', 'ch10'] },
            { id: 'g4', label: 'CH11–CH14 训练', color: '#F59E0B', chapters: ['ch11', 'ch12', 'ch13', 'ch14'] },
            { id: 'g5', label: 'CH15–CH16 实战', color: '#EC4899', chapters: ['ch15', 'ch16'] }
        ];

        if (countEl) countEl.textContent = String(concepts.length);

        const W = 1200;
        const H = 460;
        const cx = W / 2;
        const cy = H / 2;

        const nonEmptyGroups = CHAPTER_GROUPS
            .map(g => ({ ...g, concepts: concepts.filter(c => g.chapters.includes(c.first_appears)) }))
            .filter(g => g.concepts.length > 0);

        const positions = {};
        nonEmptyGroups.forEach((g, ringIdx) => {
            const baseR = 70 + ringIdx * 75;
            const n = g.concepts.length;
            g.concepts.forEach((c, i) => {
                const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
                const jitter = (i % 2 === 0) ? 0 : 12;
                const r = baseR + jitter;
                positions[c.id] = {
                    x: cx + Math.cos(angle) * r,
                    y: cy + Math.sin(angle) * r,
                    concept: c,
                    group: g
                };
            });
        });

        const tooltip = document.createElement('div');
        tooltip.className = 'cm-tooltip';
        tooltip.setAttribute('role', 'tooltip');
        canvas.appendChild(tooltip);

        const NS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        svg.setAttribute('role', 'img');
        svg.setAttribute('aria-label', 'Hello-Agents 核心概念关系图');

        const anchorOf = (chapter) => {
            const list = concepts.filter(c => c.first_appears === chapter);
            if (!list.length) return null;
            return list.reduce((a, b) =>
                ((a.related || []).length >= (b.related || []).length) ? a : b
            );
        };

        const edgeLayer = document.createElementNS(NS, 'g');
        edgeLayer.setAttribute('class', 'cm-edges');
        chapterLinks.forEach(link => {
            const a = anchorOf(link.from);
            const b = anchorOf(link.to);
            if (!a || !b || a.id === b.id) return;
            const p1 = positions[a.id];
            const p2 = positions[b.id];
            if (!p1 || !p2) return;
            const line = document.createElementNS(NS, 'line');
            line.setAttribute('x1', String(p1.x));
            line.setAttribute('y1', String(p1.y));
            line.setAttribute('x2', String(p2.x));
            line.setAttribute('y2', String(p2.y));
            line.setAttribute('class', 'cm-edge');
            line.setAttribute('data-from', link.from);
            line.setAttribute('data-to', link.to);
            const title = document.createElementNS(NS, 'title');
            title.textContent = link.reason || `${link.from} → ${link.to}`;
            line.appendChild(title);
            edgeLayer.appendChild(line);
        });
        svg.appendChild(edgeLayer);

        const maxRelated = Math.max(1, ...concepts.map(c => (c.related || []).length));
        const minR = 6;
        const maxR = 14;

        const nodeLayer = document.createElementNS(NS, 'g');
        nodeLayer.setAttribute('class', 'cm-nodes');
        Object.values(positions).forEach(p => {
            const { concept, x, y, group } = p;
            const relatedCount = (concept.related || []).length;
            const radius = minR + (relatedCount / maxRelated) * (maxR - minR);

            const node = document.createElementNS(NS, 'g');
            node.setAttribute('class', 'cm-node');
            node.setAttribute('data-id', concept.id);
            node.setAttribute('data-chapter', concept.first_appears || '');
            node.setAttribute('transform', `translate(${x},${y})`);
            node.setAttribute('tabindex', '0');
            node.setAttribute('role', 'button');
            node.setAttribute('aria-label', `${concept.name || concept.id}：${concept.definition_short || ''}`);

            const circle = document.createElementNS(NS, 'circle');
            circle.setAttribute('r', String(radius));
            circle.setAttribute('fill', group.color);
            circle.setAttribute('class', 'cm-node__circle');
            node.appendChild(circle);

            const label = document.createElementNS(NS, 'text');
            label.setAttribute('class', 'cm-node__label');
            label.setAttribute('text-anchor', 'middle');
            label.setAttribute('dy', String(radius + 11));
            label.textContent = concept.name || concept.id;
            node.appendChild(label);

            const showTip = (clientX, clientY) => {
                const def = concept.definition_short || concept.definition_long || '';
                const ch = concept.first_appears || '';
                tooltip.innerHTML = `<strong>${escapeHTML(concept.name || concept.id)}</strong>${escapeHTML(def)}${ch ? `<br><small>${escapeHTML(ch)}</small>` : ''}`;
                tooltip.classList.add('is-visible');
                const rect = canvas.getBoundingClientRect();
                tooltip.style.left = (clientX - rect.left) + 'px';
                tooltip.style.top = (clientY - rect.top) + 'px';
            };
            const hideTip = () => tooltip.classList.remove('is-visible');
            const go = () => {
                const target = document.getElementById(`chapter-${concept.first_appears}`);
                if (target) target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
            };

            node.addEventListener('mouseenter', (e) => showTip(e.clientX, e.clientY));
            node.addEventListener('mousemove', (e) => {
                const rect = canvas.getBoundingClientRect();
                tooltip.style.left = (e.clientX - rect.left) + 'px';
                tooltip.style.top = (e.clientY - rect.top) + 'px';
            });
            node.addEventListener('mouseleave', hideTip);
            node.addEventListener('focus', () => {
                const def = concept.definition_short || '';
                tooltip.innerHTML = `<strong>${escapeHTML(concept.name || concept.id)}</strong>${escapeHTML(def)}`;
                tooltip.classList.add('is-visible');
            });
            node.addEventListener('blur', hideTip);
            node.addEventListener('click', go);
            node.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    go();
                }
            });

            nodeLayer.appendChild(node);
        });
        svg.appendChild(nodeLayer);
        canvas.appendChild(svg);

        if (legend) {
            legend.innerHTML = CHAPTER_GROUPS.map(g =>
                `<li class="cm-legend__item"><span class="cm-legend__dot" style="background:${g.color};color:${g.color}"></span>${escapeHTML(g.label)}</li>`
            ).join('');
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

    async renderGlossary() {
        if (!this.glossaryHost) return;
        let payload;
        try {
            payload = await loadJSON('data/glossary.json');
        } catch (e) {
            const section = document.getElementById('glossary');
            if (section) section.classList.add('is-hidden');
            return;
        }

        const terms = Array.isArray(payload.terms) ? payload.terms : [];
        if (this.glossaryCount) this.glossaryCount.textContent = String(terms.length);

        this._renderGlossaryChips(terms);
        this._bindGlossarySearch();
    }

    _renderGlossaryChips(terms) {
        if (!this.glossaryHost) return;
        this.glossaryHost.innerHTML = '';

        const byChapter = new Map();
        terms.forEach((t) => {
            const ch = t.chapter || 'other';
            if (!byChapter.has(ch)) byChapter.set(ch, []);
            byChapter.get(ch).push(t);
        });

        const chapterOrder = this.chapters.map(c => c.id);
        const sortedChapters = Array.from(byChapter.keys()).sort((a, b) => {
            const ai = chapterOrder.indexOf(a);
            const bi = chapterOrder.indexOf(b);
            if (ai === -1 && bi === -1) return a.localeCompare(b);
            if (ai === -1) return 1;
            if (bi === -1) return -1;
            return ai - bi;
        });

        const fragment = document.createDocumentFragment();
        sortedChapters.forEach((chId) => {
            const heading = createElement('div', {
                className: 'gl-chapter',
                role: 'presentation'
            });
            const title = this.chapterTitleById.get(chId) || chId;
            heading.textContent = title;
            fragment.appendChild(heading);

            byChapter.get(chId).forEach((term) => {
                const chip = createElement('button', {
                    type: 'button',
                    className: 'gl-chip',
                    role: 'listitem',
                    'data-term': term.term,
                    'data-chapter': term.chapter || '',
                    'data-search': this._buildGlossarySearchBlob(term),
                    'aria-label': `查看术语：${term.term}`
                });
                chip.textContent = term.term;
                chip.addEventListener('click', () => this._showGlossaryDetail(term, chip));
                fragment.appendChild(chip);
            });
        });

        this.glossaryHost.appendChild(fragment);
    }

    _buildGlossarySearchBlob(term) {
        const aliases = Array.isArray(term.aliases) ? term.aliases : [];
        return [term.term, term.plain_definition || '', term.analogy || '', ...aliases]
            .join(' ')
            .toLowerCase();
    }

    _showGlossaryDetail(term, chip) {
        if (!this.glossaryDetail) return;
        $$('.gl-chip.is-active', this.glossaryHost || document).forEach((el) => el.classList.remove('is-active'));
        if (chip) chip.classList.add('is-active');

        const aliases = Array.isArray(term.aliases) ? term.aliases : [];
        const chapterTitle = this.chapterTitleById.get(term.chapter) || term.chapter || '';
        this.glossaryDetail.classList.add('is-active');
        this.glossaryDetail.innerHTML = `
            <h3 class="gl-detail__term">
                <span>${escapeHTML(term.term)}</span>
                ${chapterTitle ? `<span class="gl-detail__chapter">${escapeHTML(chapterTitle)}</span>` : ''}
            </h3>
            ${aliases.length ? `<p class="gl-detail__aliases">别名：${aliases.map(a => escapeHTML(a)).join('、')}</p>` : ''}
            <p class="gl-detail__definition">${escapeHTML(term.plain_definition || '')}</p>
            <p class="gl-detail__analogy">${escapeHTML(term.analogy || '')}</p>
        `;
    }

    onGlossarySearch(event) {
        const value = (event && event.target && event.target.value || '').trim().toLowerCase();
        const chips = $$('.gl-chip', this.glossaryHost || document);
        chips.forEach((chip) => {
            const blob = chip.dataset.search || '';
            const match = !value || blob.includes(value);
            chip.style.display = match ? '' : 'none';
        });
        $$('.gl-chapter', this.glossaryHost || document).forEach((heading) => {
            let next = heading.nextElementSibling;
            let hasVisible = false;
            while (next && !next.classList.contains('gl-chapter')) {
                if (next.classList.contains('gl-chip') && next.style.display !== 'none') {
                    hasVisible = true;
                    break;
                }
                next = next.nextElementSibling;
            }
            heading.style.display = hasVisible ? '' : 'none';
        });
        if (value && this.glossaryDetail) {
            this.glossaryDetail.classList.remove('is-active');
            $$('.gl-chip.is-active', this.glossaryHost || document).forEach((el) => el.classList.remove('is-active'));
        }
    }

    _bindGlossarySearch() {
        if (!this.glossarySearch) return;
        this.glossarySearch.addEventListener('input', (e) => this.onGlossarySearch(e));
    }
}

export { App };

if (document.getElementById('chapterGrid')) {
    document.addEventListener('DOMContentLoaded', () => new App());
}

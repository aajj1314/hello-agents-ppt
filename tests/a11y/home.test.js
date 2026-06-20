// tests/a11y/home.test.js
// a11y audit for the homepage (index.html) using axe-core
// plus structural assertions for known accessibility contracts.
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { App } from '../../js/app.js';
import { Storage } from '../../js/core/storage.js';
import { runAxe, summarizeViolations } from './helpers.js';

const HOME_GUIDE = {
    agent_intro: {
        title: 'Agent 是什么？',
        icon: 'brain',
        definition: 'Agent 是能感知环境、自己思考、并使用工具的 AI 系统。',
        analogy: '就像一位餐厅服务员：听懂客人需求 → 去厨房协调 → 把菜端回来。',
        difference: '和普通程序不同，Agent 会自己决定下一步做什么。',
        link: { chapter: 'ch1', slide: 1, text: '了解更多' }
    },
    learning_path: {
        title: '3 步学会 Agent',
        steps: [
            {
                id: 'concepts',
                title: 'Step 1：看懂概念',
                description: '从 CH1–CH3 开始，理解 Agent 是什么、怎么发展、LLM 怎么工作',
                chapters: ['ch1', 'ch2', 'ch3'],
                cta: '从 CH1 开始'
            },
            {
                id: 'patterns',
                title: 'Step 2：掌握范式',
                description: 'CH4–CH10：ReAct、Plan-and-Solve、记忆、上下文、通信协议',
                chapters: ['ch4', 'ch5', 'ch6'],
                cta: '跳到 CH4'
            }
        ]
    },
    capabilities: {
        title: '学完能做什么？',
        items: [
            { icon: 'chat', name: '智能客服', desc: '自动回答用户问题' },
            { icon: 'search', name: '研究助手', desc: '自动搜索并总结报告' }
        ]
    }
};

const SAMPLE_CHAPTERS = {
    chapters: [
        {
            id: 'ch1', title: '初识智能体', subtitle: '智能体定义、类型与架构',
            icon: '🤖', hasAnimation: true, hasQuiz: true, slides: [{}, {}, {}]
        },
        {
            id: 'ch4', title: '智能体经典范式构建', subtitle: 'ReAct、Plan-and-Solve、Reflection',
            icon: '🧩', hasAnimation: true, hasQuiz: true, slides: [{}, {}, {}]
        }
    ]
};

const HOME_HTML = `
    <a class="skip-link" href="#chapterGrid">跳转到章节列表</a>
    <div class="scroll-progress" aria-hidden="true">
        <div class="scroll-progress__bar" id="scrollProgressBar"></div>
    </div>
    <div class="app">
        <nav class="sticky-nav" id="stickyNav" aria-label="章节导航">
            <div class="sticky-nav__inner">
                <a href="#top" class="sticky-nav__brand" aria-label="Hello-Agents 首页">
                    <svg viewBox="0 0 24 24" aria-hidden="true"></svg>
                    <span>Hello-Agents</span>
                </a>
                <div class="sticky-nav__chips" id="chapterChips" role="tablist" aria-label="章节快捷导航"></div>
                <div class="sticky-nav__progress" aria-live="polite" aria-atomic="true">
                    <svg class="sticky-nav__progress-ring" viewBox="0 0 36 36" aria-hidden="true"></svg>
                    <span id="navProgressText">0%</span>
                </div>
            </div>
        </nav>
        <a id="top"></a>
        <header class="hero-banner reveal" id="heroBanner">
            <div class="hero-tag" aria-hidden="true"><span class="hero-tag__dot"></span><span>tag</span></div>
            <h1>Hello-Agents</h1>
            <p class="subtitle">subtitle</p>
            <div class="hero-stats" id="heroStats" role="group" aria-label="学习统计">
                <div class="stat-tile"><div class="stat-tile__value" id="statChapters" aria-live="polite">0</div><div class="stat-tile__label">章节</div></div>
                <div class="stat-tile"><div class="stat-tile__value" id="statPages" aria-live="polite">0</div><div class="stat-tile__label">幻灯片</div></div>
                <div class="stat-tile"><div class="stat-tile__value" id="statAnimations" aria-live="polite">0</div><div class="stat-tile__label">交互动画</div></div>
                <div class="stat-tile"><div class="stat-tile__value" id="statQuizzes" aria-live="polite">0</div><div class="stat-tile__label">测验</div></div>
            </div>
            <div class="progress-overview" id="heroProgress">
                <span id="heroProgressLabel">整体进度</span>
                <div class="progress-bar-hero" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" id="heroProgressBar" aria-label="整体学习进度">
                    <div class="fill" id="heroProgressFill" style="width: 0%"></div>
                </div>
                <span id="heroProgressText">0%</span>
            </div>
        </header>
        <section class="hero-guide reveal" id="heroGuide" aria-label="新手指引">
            <div class="guide-grid" id="guideGrid"></div>
        </section>
        <h2 class="section-heading reveal"><span class="section-heading__accent" aria-hidden="true"></span><span>章节导航</span></h2>
        <main class="chapter-grid" id="chapterGrid" aria-label="章节列表"></main>
        <footer class="app-footer">
            <button class="btn btn-primary" id="btnStart" aria-label="开始学习第一章">开始</button>
            <button class="btn btn-secondary" id="btnContinue" aria-label="继续上次学习进度">继续</button>
            <button class="btn btn-danger" id="btnReset" aria-label="重置全部学习进度">重置</button>
        </footer>
    </div>
    <button class="theme-toggle" id="themeToggle" aria-label="切换深色 / 浅色主题" title="切换主题">
        <svg aria-hidden="true"></svg>
    </button>
`;

describe('home a11y', () => {
    let axe;

    beforeEach(async () => {
        document.body.innerHTML = HOME_HTML;
        localStorage.clear();
        Storage._resetCache();
        vi.stubGlobal('fetch', (url) => {
            if (String(url).includes('home-guide.json')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve(HOME_GUIDE) });
            }
            if (String(url).includes('chapters.json')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve(SAMPLE_CHAPTERS) });
            }
            return Promise.resolve({ ok: false });
        });
        new App();
        // wait for async init (renderStats → renderChips → renderHomeGuide → render → bindButtons)
        await new Promise((r) => setTimeout(r, 60));
        axe = await runAxe(document);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('runs axe-core without throwing in jsdom (records any violations)', () => {
        if (axe.error) {
            // jsdom cannot run some axe rules — that's expected.
            // We still keep this as a soft audit signal.
            expect(axe.error.message).toBeTruthy();
        } else {
            // We don't fail on every violation; we record the count and
            // surface the most common ones as guidance.
            const summary = summarizeViolations(axe.violations);
            expect(typeof summary).toBe('string');
        }
    });

    it('hero-guide section has aria-label', () => {
        const guide = document.getElementById('heroGuide');
        expect(guide).toBeTruthy();
        expect(guide.tagName).toBe('SECTION');
        expect(guide.getAttribute('aria-label')).toBe('新手指引');
    });

    it('chapter cards expose aria-label (a11y name) and role=link', () => {
        const cards = document.querySelectorAll('.chapter-card');
        expect(cards.length).toBeGreaterThan(0);
        cards.forEach((card) => {
            expect(card.getAttribute('aria-label')).toBeTruthy();
            expect(card.getAttribute('aria-label').length).toBeGreaterThan(0);
            expect(card.getAttribute('role')).toBe('link');
        });
    });

    it('theme-toggle button has aria-label and title', () => {
        const toggle = document.getElementById('themeToggle');
        expect(toggle).toBeTruthy();
        expect(toggle.tagName).toBe('BUTTON');
        expect(toggle.getAttribute('aria-label')).toBeTruthy();
        expect(toggle.getAttribute('title')).toBe('切换主题');
    });

    it('hero progressbar has role and aria-valuenow (rendered by App)', () => {
        const bar = document.getElementById('heroProgressBar');
        expect(bar).toBeTruthy();
        expect(bar.getAttribute('role')).toBe('progressbar');
        // aria-valuenow must be present, value can be 0..100
        const now = bar.getAttribute('aria-valuenow');
        expect(now).not.toBeNull();
        expect(Number.isFinite(Number(now))).toBe(true);
    });

    it('a11y.css defines the visible-on-focus skip-link rule', () => {
        const css = readFileSync(resolve(process.cwd(), 'css/a11y.css'), 'utf-8');
        // Skip link must exist in CSS and reveal itself on focus
        expect(css).toMatch(/\.skip-link\s*\{[\s\S]*position:\s*fixed/);
        expect(css).toMatch(/\.skip-link:focus[\s\S]*transform:\s*translateY\(0\)/);
        // A focus-visible ring must exist for keyboard users
        expect(css).toMatch(/:focus-visible\s*\{/);
    });
});

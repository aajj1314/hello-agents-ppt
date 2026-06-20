import { describe, it, expect, beforeEach, vi } from 'vitest';
import { App } from '../../js/app.js';
import { Storage, STORAGE_KEY } from '../../js/core/storage.js';

const GUIDE_DATA = {
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
                chapters: ['ch4', 'ch5', 'ch6', 'ch7', 'ch8', 'ch9', 'ch10'],
                cta: '跳到 CH4'
            },
            {
                id: 'practice',
                title: 'Step 3：动手实战',
                description: 'CH13–CH16：旅行助手、DeepResearch、赛博小镇、毕业设计',
                chapters: ['ch13', 'ch14', 'ch15', 'ch16'],
                cta: '跳到 CH13'
            }
        ]
    },
    capabilities: {
        title: '学完能做什么？',
        items: [
            { icon: 'chat', name: '智能客服', desc: '自动回答用户问题' },
            { icon: 'search', name: '研究助手', desc: '自动搜索并总结报告' },
            { icon: 'calendar', name: '日程管家', desc: '理解邮件自动安排日程' },
            { icon: 'tools', name: '工具助手', desc: '调用 API、查天气、算数据' },
            { icon: 'game', name: '游戏 NPC', desc: '有记忆、会互动的角色' },
            { icon: 'code', name: '代码助手', desc: '自动审代码、跑测试' }
        ]
    }
};

describe('home guide', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <header class="hero-banner" id="heroBanner"></header>
            <section class="hero-guide reveal" id="heroGuide" aria-label="新手指引">
                <div class="guide-grid" id="guideGrid"></div>
            </section>
            <main class="chapter-grid" id="chapterGrid"></main>
        `;
        const style = document.createElement('style');
        style.textContent = '.guide-grid { display: grid; }';
        document.head.appendChild(style);
        localStorage.clear();
        Storage._resetCache();
        vi.stubGlobal('fetch', (url) => {
            if (url.includes('home-guide.json')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve(GUIDE_DATA) });
            }
            if (url.includes('chapters.json')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve({ chapters: [] }) });
            }
            return Promise.resolve({ ok: false });
        });
    });

    it('renders three guide cards', async () => {
        const app = new App();
        await new Promise(r => setTimeout(r, 50));
        const cards = document.querySelectorAll('.guide-card');
        expect(cards.length).toBe(3);
    });

    it('renders intro card content', async () => {
        const app = new App();
        await new Promise(r => setTimeout(r, 50));
        const card = document.querySelectorAll('.guide-card')[0];
        expect(card.textContent).toContain('Agent 是什么？');
        expect(card.textContent).toContain('餐厅服务员');
        expect(card.querySelector('.guide-card__link').getAttribute('href')).toBe('slides.html?chapter=ch1&slide=1');
    });

    it('renders capabilities card with six items', async () => {
        const app = new App();
        await new Promise(r => setTimeout(r, 50));
        const items = document.querySelectorAll('.guide-capability');
        expect(items.length).toBe(6);
        expect(items[0].textContent).toContain('智能客服');
        expect(items[5].textContent).toContain('代码助手');
    });

    it('marks step as active when one chapter has progress', async () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            chapters: { ch1: { slideIndex: 2, completed: false } }
        }));
        Storage._resetCache();
        const app = new App();
        await new Promise(r => setTimeout(r, 50));
        const step = document.querySelector('.guide-step');
        expect(step.classList.contains('guide-step--active')).toBe(true);
    });

    it('marks step as completed when all chapters are completed', async () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            chapters: {
                ch1: { slideIndex: 19, completed: true },
                ch2: { slideIndex: 22, completed: true },
                ch3: { slideIndex: 25, completed: true }
            }
        }));
        Storage._resetCache();
        const app = new App();
        await new Promise(r => setTimeout(r, 50));
        const step = document.querySelector('.guide-step');
        expect(step.classList.contains('guide-step--completed')).toBe(true);
    });

    it('hides guide when home-guide.json fails to load', async () => {
        vi.stubGlobal('fetch', (url) => {
            if (url.includes('home-guide.json')) {
                return Promise.resolve({ ok: false, status: 404 });
            }
            if (url.includes('chapters.json')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve({ chapters: [] }) });
            }
            return Promise.resolve({ ok: false });
        });
        const app = new App();
        await new Promise(r => setTimeout(r, 50));
        expect(document.getElementById('heroGuide').classList.contains('is-hidden')).toBe(true);
    });

    it('keeps container responsive with guide-grid', async () => {
        const app = new App();
        await new Promise(r => setTimeout(r, 50));
        const grid = document.getElementById('guideGrid');
        expect(grid).not.toBeNull();
        expect(getComputedStyle(grid).display).toBe('grid');
    });
});

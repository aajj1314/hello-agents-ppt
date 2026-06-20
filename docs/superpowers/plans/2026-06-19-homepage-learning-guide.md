# 首页学习导览 Implementation Plan

> **For agentic workers:** REQUIRED SUB-TOOL: Use Task with subagent_type=general_purpose_task or execute tasks inline. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 Hello-Agents 首页 Hero 区新增一个面向普通人的三卡片学习导览（Agent 是什么 / 3 步学习路径 / 学完能做什么），数据驱动、响应式、与学习进度联动。

**Architecture:** 新增 `data/home-guide.json` 承载导览内容；`js/app.js` 增加 `renderHomeGuide()` 在首页初始化时读取数据并渲染；`index.html` 插入容器；`css/main.css` 增加卡片样式。状态计算复用现有 `Storage` 模块。

**Tech Stack:** 纯静态 HTML/CSS/JS，零新依赖，Vitest + jsdom 测试。

---

## 文件结构

| 文件 | 用途 |
|------|------|
| `data/home-guide.json` | 导览区数据：Agent 介绍、3 步路径、6 个应用场景 |
| `index.html` | 在 Hero 与章节导航之间插入 `<section id="heroGuide">` |
| `js/app.js` | 新增 `renderHomeGuide()` 方法并在 `init()` 中调用 |
| `css/main.css` | 新增 `.hero-guide`、`.guide-grid`、`.guide-card` 等样式 |
| `tests/features/home-guide.test.js` | 渲染、状态计算、错误降级测试 |

---

## Task 1: 创建导览数据文件

**Files:**
- Create: `data/home-guide.json`

**说明：** 该文件为纯数据，前端通过 `fetch` 读取。所有文本内容直接面向"普通人"，避免术语堆砌。

- [ ] **Step 1: 写入 `data/home-guide.json`**

```json
{
  "agent_intro": {
    "title": "Agent 是什么？",
    "icon": "brain",
    "definition": "Agent 是能感知环境、自己思考、并使用工具的 AI 系统。",
    "analogy": "就像一位餐厅服务员：听懂客人需求 → 去厨房协调 → 把菜端回来。",
    "difference": "和普通程序不同，Agent 会自己决定下一步做什么。",
    "link": { "chapter": "ch1", "slide": 1, "text": "了解更多" }
  },
  "learning_path": {
    "title": "3 步学会 Agent",
    "steps": [
      {
        "id": "concepts",
        "title": "Step 1：看懂概念",
        "description": "从 CH1–CH3 开始，理解 Agent 是什么、怎么发展、LLM 怎么工作",
        "chapters": ["ch1", "ch2", "ch3"],
        "cta": "从 CH1 开始"
      },
      {
        "id": "patterns",
        "title": "Step 2：掌握范式",
        "description": "CH4–CH10：ReAct、Plan-and-Solve、记忆、上下文、通信协议",
        "chapters": ["ch4", "ch5", "ch6", "ch7", "ch8", "ch9", "ch10"],
        "cta": "跳到 CH4"
      },
      {
        "id": "practice",
        "title": "Step 3：动手实战",
        "description": "CH13–CH16：旅行助手、DeepResearch、赛博小镇、毕业设计",
        "chapters": ["ch13", "ch14", "ch15", "ch16"],
        "cta": "跳到 CH13"
      }
    ]
  },
  "capabilities": {
    "title": "学完能做什么？",
    "items": [
      { "icon": "chat", "name": "智能客服", "desc": "自动回答用户问题" },
      { "icon": "search", "name": "研究助手", "desc": "自动搜索并总结报告" },
      { "icon": "calendar", "name": "日程管家", "desc": "理解邮件自动安排日程" },
      { "icon": "tools", "name": "工具助手", "desc": "调用 API、查天气、算数据" },
      { "icon": "game", "name": "游戏 NPC", "desc": "有记忆、会互动的角色" },
      { "icon": "code", "name": "代码助手", "desc": "自动审代码、跑测试" }
    ]
  }
}
```

- [ ] **Step 2: 验证 JSON 格式**

Run:
```bash
python3 -m json.tool data/home-guide.json > /dev/null
```

Expected: 无输出（表示 JSON 合法）

- [ ] **Step 3: Commit**

```bash
git add data/home-guide.json
git commit -m "data: add homepage learning guide content"
```

---

## Task 2: 首页 HTML 插入容器

**Files:**
- Modify: `index.html`

**说明：** 在 `</header>`（hero-banner 结束）和 `<h2 class="section-heading reveal">`（"章节导航"标题）之间插入容器。容器初始为空，由 JS 填充。

- [ ] **Step 1: 在 `index.html` 第 84 行后插入导览容器**

Locate this closing tag in `index.html`:
```html
</header>
```

Insert immediately after it:
```html

<section class="hero-guide reveal" id="heroGuide" aria-label="新手指引">
    <div class="guide-grid" id="guideGrid"></div>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat(home): add learning guide container"
```

---

## Task 3: 实现 `renderHomeGuide()` 渲染逻辑

**Files:**
- Modify: `js/app.js`

**说明：** 新增独立方法负责读取 `data/home-guide.json`、计算路径状态、生成 3 张卡片。失败时静默跳过，不影响现有首页。

- [ ] **Step 1: 在 `js/app.js` 顶部导入后添加 SVG 图标映射（局部）**

在 `js/app.js` 第 6 行后插入：

```javascript
const GUIDE_ICONS = {
    brain: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    tools: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
    game: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h4"/><path d="M8 10v4"/><circle cx="17" cy="12" r="1.5"/></svg>',
    code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>'
};
```

- [ ] **Step 2: 在 `App` 类中添加 `renderHomeGuide()` 方法**

在 `js/app.js` 第 138 行 `updateOverallProgress` 方法之后，插入以下方法：

```javascript
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
```

- [ ] **Step 3: 在 `init()` 中调用 `renderHomeGuide()`**

将 `js/app.js` 第 20–31 行的 `init()` 方法改为：

```javascript
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
```

- [ ] **Step 4: Commit**

```bash
git add js/app.js
git commit -m "feat(home): render learning guide from data/home-guide.json"
```

---

## Task 4: 添加 CSS 样式

**Files:**
- Modify: `css/main.css`

**说明：** 样式延续现有 Aurora + Glassmorphism 风格，复用变量（如 `--surface`、`--primary`、`--text-primary` 等）。

- [ ] **Step 1: 在 `css/main.css` 末尾追加导览区样式**

```css
/* Home guide section */
.hero-guide {
    padding: 2rem 1rem 3rem;
    max-width: 1200px;
    margin: 0 auto;
}

.hero-guide.is-hidden {
    display: none;
}

.guide-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
    align-items: stretch;
}

.guide-card {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 1rem;
    padding: 1.75rem;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    transition: transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease;
}

.guide-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
    border-color: rgba(124, 58, 237, 0.35);
}

.guide-card__icon {
    width: 2.5rem;
    height: 2.5rem;
    color: #A78BFA;
    margin-bottom: 1rem;
}

.guide-card__icon svg {
    width: 100%;
    height: 100%;
}

.guide-card__title {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0 0 0.75rem;
    color: var(--text-primary, #F8FAFC);
}

.guide-card__lead {
    font-size: 1rem;
    line-height: 1.6;
    margin: 0 0 0.75rem;
    color: var(--text-primary, #F8FAFC);
}

.guide-card__analogy {
    font-size: 0.9375rem;
    line-height: 1.6;
    margin: 0 0 0.5rem;
    padding: 0.75rem 1rem;
    background: rgba(167, 139, 250, 0.1);
    border-left: 3px solid #A78BFA;
    border-radius: 0 0.5rem 0.5rem 0;
    color: var(--text-secondary, #CBD5E1);
}

.guide-card__note {
    font-size: 0.875rem;
    line-height: 1.5;
    margin: 0 0 1rem;
    color: var(--text-secondary, #CBD5E1);
}

.guide-card__link {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.9375rem;
    font-weight: 600;
    color: #A78BFA;
    text-decoration: none;
}

.guide-card__link:hover {
    text-decoration: underline;
}

/* Learning path */
.guide-path {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.guide-step {
    position: relative;
}

.guide-step__link {
    display: flex;
    align-items: flex-start;
    gap: 0.875rem;
    padding: 0.875rem;
    border-radius: 0.75rem;
    text-decoration: none;
    border: 1px solid transparent;
    transition: background 150ms ease, border-color 150ms ease;
}

.guide-step__link:hover,
.guide-step__link:focus-visible {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(124, 58, 237, 0.3);
}

.guide-step__marker {
    flex-shrink: 0;
    width: 1.75rem;
    height: 1.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: 0.875rem;
    font-weight: 700;
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-secondary, #CBD5E1);
}

.guide-step--active .guide-step__marker {
    background: #7C3AED;
    color: #fff;
    box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.2);
}

.guide-step--completed .guide-step__marker {
    background: #22C55E;
    color: #fff;
}

.guide-step__body {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.guide-step__title {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--text-primary, #F8FAFC);
}

.guide-step__desc {
    font-size: 0.8125rem;
    line-height: 1.5;
    color: var(--text-secondary, #CBD5E1);
}

.guide-step--completed .guide-step__title,
.guide-step--completed .guide-step__desc {
    opacity: 0.65;
}

/* Capabilities grid */
.guide-capabilities {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.875rem;
}

.guide-capability {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 0.625rem;
}

.guide-capability__icon {
    width: 1.5rem;
    height: 1.5rem;
    color: #A78BFA;
}

.guide-capability__icon svg {
    width: 100%;
    height: 100%;
}

.guide-capability__name {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary, #F8FAFC);
}

.guide-capability__desc {
    font-size: 0.75rem;
    line-height: 1.4;
    color: var(--text-secondary, #CBD5E1);
}

/* Responsive */
@media (min-width: 768px) {
    .guide-grid {
        grid-template-columns: repeat(2, 1fr);
    }
    .guide-card:last-child {
        grid-column: 1 / -1;
    }
}

@media (min-width: 1024px) {
    .guide-grid {
        grid-template-columns: repeat(3, 1fr);
    }
    .guide-card:last-child {
        grid-column: auto;
    }
    .guide-capabilities {
        grid-template-columns: 1fr;
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add css/main.css
git commit -m "style(home): add learning guide card styles"
```

---

## Task 5: 添加测试

**Files:**
- Create: `tests/features/home-guide.test.js`

**说明：** 测试覆盖数据解析、渲染、状态计算、降级。

- [ ] **Step 1: 创建测试文件**

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { App } from '../../js/app.js';

const GUIDE_DATA = {
    agent_intro: {
        title: 'Agent 是什么？',
        icon: 'brain',
        definition: 'Agent 是能感知环境、自己思考、并使用工具的 AI 系统。',
        analogy: '就像服务员。',
        difference: '和普通程序不同。',
        link: { chapter: 'ch1', slide: 1, text: '了解更多' }
    },
    learning_path: {
        title: '3 步学会 Agent',
        steps: [
            {
                id: 'concepts',
                title: 'Step 1',
                description: '看懂概念',
                chapters: ['ch1', 'ch2', 'ch3'],
                cta: '开始'
            }
        ]
    },
    capabilities: {
        title: '学完能做什么？',
        items: [
            { icon: 'chat', name: '智能客服', desc: '自动回答' }
        ]
    }
};

describe('home guide', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <header class="hero-banner" id="heroBanner"></header>
            <section class="hero-guide" id="heroGuide"><div class="guide-grid" id="guideGrid"></div></section>
            <main class="chapter-grid" id="chapterGrid"></main>
        `;
        localStorage.clear();
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

    it('marks step as active when one chapter has progress', async () => {
        localStorage.setItem('hello-agents-progress', JSON.stringify({
            ch1: { slideIndex: 2, completed: false }
        }));
        const app = new App();
        await new Promise(r => setTimeout(r, 50));
        const step = document.querySelector('.guide-step');
        expect(step.classList.contains('guide-step--active')).toBe(true);
    });

    it('marks step as completed when all chapters are completed', async () => {
        localStorage.setItem('hello-agents-progress', JSON.stringify({
            ch1: { slideIndex: 19, completed: true },
            ch2: { slideIndex: 22, completed: true },
            ch3: { slideIndex: 25, completed: true }
        }));
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
});
```

- [ ] **Step 2: 运行测试**

Run:
```bash
npx vitest run tests/features/home-guide.test.js
```

Expected: 4 tests passed

- [ ] **Step 3: 运行全量测试**

Run:
```bash
npm test
```

Expected: 所有测试通过（含之前已存在的测试）

- [ ] **Step 4: Commit**

```bash
git add tests/features/home-guide.test.js
git commit -m "test(home): add learning guide tests"
```

---

## Task 6: 手动验证

- [ ] **Step 1: 启动本地服务器**

```bash
python3 -m http.server 8080
```

- [ ] **Step 2: 浏览器访问 `http://localhost:8080/`**

Expected:
- Hero 下方出现 3 张卡片
- 卡片 1 显示定义、类比、区别、"了解更多"链接
- 卡片 2 显示 3 步路径，初始均为 pending
- 卡片 3 显示 6 个应用场景

- [ ] **Step 3: 模拟学习进度**

在浏览器控制台执行：
```javascript
localStorage.setItem('hello-agents-progress', JSON.stringify({
    ch1: { slideIndex: 5, completed: false }
}));
location.reload();
```

Expected:
- Step 1 变为 active 状态（高亮 + 脉冲点）

- [ ] **Step 4: 点击路径节点**

Expected:
- 跳转到 `slides.html?chapter=ch1&slide=1`

---

## Task 7: 最终提交

- [ ] **Step 1: 全量测试通过**

```bash
npm test
```

- [ ] **Step 2: 提交最终版本**

```bash
git status
git add .
git commit -m "feat(home): add beginner-friendly learning guide to homepage

- Add data/home-guide.json with intro, 3-step path, and capabilities
- Render guide cards in index.html hero section
- Link learning path states to localStorage progress
- Add responsive glassmorphism styles
- Add unit tests for rendering, state, and graceful degradation"
```

---

## Self-Review

### Spec Coverage

| Spec Section | 对应 Task |
|--------------|-----------|
| 3 张卡片布局 | Task 2 HTML + Task 4 CSS |
| Agent 定义/类比/区别 | Task 1 JSON + Task 3 `_buildIntroCard` |
| 3 步学习路径 | Task 1 JSON + Task 3 `_buildPathCard` |
| 进度状态 completed/active/pending | Task 3 `_getStepStatus` + Task 5 tests |
| 6 个应用场景 | Task 1 JSON + Task 3 `_buildCapabilitiesCard` |
| 响应式 3/2/1 列 | Task 4 CSS media queries |
| 错误降级 | Task 3 `renderHomeGuide` catch + Task 5 test |
| 可访问性 | Task 2 `aria-label`/`aria-labelledby` + Task 4 focus styles |

### Placeholder Scan

- [x] 无 TBD/TODO
- [x] 无 "add appropriate error handling" 等模糊表述
- [x] 每步包含具体代码/命令
- [x] 文件路径精确

### 一致性检查

- `loadJSON` 复用现有工具函数
- `Storage.getChapterProgress` 复用现有存储模块
- `--text-primary`/`--text-secondary` 复用现有 CSS 变量，无则回退

---

## Execution Handoff

Plan saved to: `docs/superpowers/plans/2026-06-19-homepage-learning-guide.md`

执行方式：
1. **Subagent 分任务执行** — 每个 Task 派一个独立子代理，完成后 review
2. **Inline 顺序执行** — 在当前会话按 Task 1 → 7 逐步执行

请选择执行方式。
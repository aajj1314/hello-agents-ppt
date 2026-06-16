# Phase 3: 体验增强 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把项目从"能看的网页 PPT"变成"能上课/能自学的工具"。包含：全局搜索、章节目录侧边栏、错题本、演讲者模式、完整键盘导航。

**Architecture:** 在 Phase 1 架构上以 `js/features/` 目录新增独立特性模块。演讲者模式用 `window.open` + `BroadcastChannel` 跨窗口同步。键盘导航统一在 `js/features/keyboard-shortcuts.js` 注册。

**Tech Stack:** 同 Phase 1 + 浏览器原生 `BroadcastChannel`。

**前置依赖:** Phase 1 + Phase 2（搜索索引依赖章节内容完整）。

---

## Task 1: 搜索索引构建器

**Files:**
- Create: `js/features/search-index.js`
- Test: `tests/features/search-index.test.js`

- [ ] **Step 1: 写失败测试**

```js
// tests/features/search-index.test.js
import { describe, it, expect } from 'vitest';
import { buildSearchIndex, search } from '../../js/features/search-index.js';

const sampleChapters = {
    chapters: [
        { id: 'ch1', title: '初识智能体', subtitle: '智能体定义',
          slides: [
            { type: 'cover', title: '第一章' },
            { type: 'content', title: '什么是智能体', content: '能够感知环境、推理决策、采取行动' }
          ]
        }
    ]
};

const sampleQuiz = { ch1: [{ id: 'q1', question: '智能体的核心组件是什么？' }] };

describe('search-index', () => {
    it('buildSearchIndex returns flat result list', () => {
        const idx = buildSearchIndex(sampleChapters, sampleQuiz);
        expect(idx.length).toBeGreaterThan(0);
        expect(idx[0]).toHaveProperty('chapterId');
        expect(idx[0]).toHaveProperty('text');
    });
    it('includes chapter title', () => {
        const idx = buildSearchIndex(sampleChapters, sampleQuiz);
        expect(idx.some(r => r.text.includes('初识智能体'))).toBe(true);
    });
    it('includes slide content', () => {
        const idx = buildSearchIndex(sampleChapters, sampleQuiz);
        expect(idx.some(r => r.text.includes('感知环境'))).toBe(true);
    });
    it('includes quiz questions', () => {
        const idx = buildSearchIndex(sampleChapters, sampleQuiz);
        expect(idx.some(r => r.type === 'quiz' && r.text.includes('核心组件'))).toBe(true);
    });
    it('search() empty for no match', () => {
        const idx = buildSearchIndex(sampleChapters, sampleQuiz);
        expect(search(idx, 'nonexistent_xyz_term')).toEqual([]);
    });
    it('search() ranks title matches higher', () => {
        const idx = buildSearchIndex(sampleChapters, sampleQuiz);
        const results = search(idx, '智能体');
        expect(results[0].text).toContain('智能体');
    });
    it('search() caps at 50 results', () => {
        const big = { chapters: Array.from({ length: 100 }, (_, i) => ({
            id: `ch${i}`, title: `match ${i}`, slides: [{ title: `match ${i}`, content: 'x' }]
        })) };
        const idx = buildSearchIndex(big, {});
        expect(search(idx, 'match').length).toBeLessThanOrEqual(50);
    });
});
```

- [ ] **Step 2: 跑测试确认失败**

```bash
npm test -- tests/features/search-index.test.js
```

Expected: FAIL

- [ ] **Step 3: 实现 search-index.js**

```js
// js/features/search-index.js
export function buildSearchIndex(chapters, quiz) {
    const idx = [];
    chapters.chapters.forEach(ch => {
        idx.push({ chapterId: ch.id, slideIndex: 0, text: ch.title, type: 'chapter-title', weight: 3 });
        if (ch.subtitle) idx.push({ chapterId: ch.id, slideIndex: 0, text: ch.subtitle, type: 'chapter-subtitle', weight: 2 });
        ch.slides.forEach((s, i) => {
            if (s.title) idx.push({ chapterId: ch.id, slideIndex: i, text: s.title, type: 'slide-title', weight: 3 });
            if (s.content) {
                s.content.split('\n').filter(p => p.trim().length > 5).forEach(p => {
                    idx.push({ chapterId: ch.id, slideIndex: i, text: p, type: 'slide-content', weight: 1 });
                });
            }
            if (s.speakerNotes) idx.push({ chapterId: ch.id, slideIndex: i, text: s.speakerNotes, type: 'speaker-notes', weight: 1 });
        });
    });
    Object.entries(quiz).forEach(([chapterId, questions]) => {
        questions.forEach((q, i) => {
            idx.push({ chapterId, slideIndex: -1, quizIndex: i, text: q.question, type: 'quiz', weight: 2 });
        });
    });
    return idx;
}

export function search(index, query) {
    if (!query) return [];
    const q = query.toLowerCase().trim();
    const scored = [];
    index.forEach(r => {
        const text = r.text.toLowerCase();
        const idx = text.indexOf(q);
        if (idx < 0) return;
        const score = (r.weight || 1) * 10 - idx * 0.1;
        scored.push({ ...r, score });
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 50);
}
```

- [ ] **Step 4: 跑测试 + Commit**

```bash
npm test -- tests/features/search-index.test.js
git add js/features/search-index.js tests/features/search-index.test.js
git commit -m "feat(search): index builder with case-insensitive substring + ranking"
```

---

## Task 2: 搜索 UI

**Files:**
- Create: `js/features/search.js`
- Test: `tests/features/search.test.js`

- [ ] **Step 1: 写测试**

```js
// tests/features/search.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { mountSearch, openSearch, closeSearch } from '../../js/features/search.js';

describe('search UI', () => {
    beforeEach(() => { document.body.innerHTML = ''; });

    it('mountSearch adds toggle to header', () => {
        document.body.innerHTML = '<header></header>';
        mountSearch(() => [], () => {});
        expect(document.querySelector('.search-toggle')).toBeTruthy();
    });

    it('openSearch creates modal', () => {
        document.body.innerHTML = '<header></header>';
        mountSearch(() => [], () => {});
        openSearch();
        expect(document.querySelector('.search-modal')).toBeTruthy();
    });

    it('closeSearch removes modal', () => {
        document.body.innerHTML = '<header></header>';
        mountSearch(() => [], () => {});
        openSearch();
        closeSearch();
        expect(document.querySelector('.search-modal')).toBeFalsy();
    });
});
```

- [ ] **Step 2: 跑测试 + 实现**

```bash
npm test -- tests/features/search.test.js
```

`js/features/search.js`:
```js
import { buildSearchIndex, search as searchIndex } from './search-index.js';
import { loadJSON, createElement, escapeHTML } from '../core/utils.js';

let _index = null;
let _navigate = null;

export async function ensureIndex() {
    if (_index) return _index;
    const [chapters, quiz] = await Promise.all([
        loadJSON('data/chapters.json'),
        loadJSON('data/quiz-data.json')
    ]);
    _index = buildSearchIndex(chapters, quiz);
    return _index;
}

export function mountSearch(getIndex, navigate) {
    _navigate = navigate;
    const header = document.querySelector('header');
    if (!header) return;
    const btn = createElement('button', { className: 'search-toggle', 'aria-label': '搜索' }, '🔍');
    btn.addEventListener('click', () => openSearch());
    header.appendChild(btn);
}

export async function openSearch() {
    const idx = await ensureIndex();
    if (document.querySelector('.search-modal')) return;
    const modal = createElement('div', { className: 'search-modal' });
    const input = createElement('input', { className: 'search-input', type: 'text', placeholder: '搜索章节、slide、题目…' });
    const list = createElement('div', { className: 'search-list' });
    modal.appendChild(input);
    modal.appendChild(list);
    document.body.appendChild(modal);

    let activeIdx = -1;
    const render = (q) => {
        const results = searchIndex(idx, q);
        list.innerHTML = '';
        results.forEach((r, i) => {
            const el = createElement('div', { className: 'search-result' + (i === activeIdx ? ' active' : '') });
            el.innerHTML = `<div class="search-chapter">${escapeHTML(r.chapterId)}${r.slideIndex >= 0 ? ` · 第 ${r.slideIndex + 1} 页` : ''}</div><div class="search-text">${escapeHTML(r.text.slice(0, 100))}</div>`;
            el.addEventListener('click', () => go(r));
            list.appendChild(el);
        });
    };
    const go = (r) => {
        closeSearch();
        _navigate?.({ chapterId: r.chapterId, slideIndex: r.slideIndex });
    };
    input.addEventListener('input', () => { activeIdx = -1; render(input.value); });
    input.addEventListener('keydown', (e) => {
        const items = list.querySelectorAll('.search-result');
        if (e.key === 'ArrowDown') { e.preventDefault(); activeIdx = Math.min(items.length - 1, activeIdx + 1); render(input.value); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); activeIdx = Math.max(0, activeIdx - 1); render(input.value); }
        else if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); go(searchIndex(idx, input.value)[activeIdx]); }
        else if (e.key === 'Escape') { e.preventDefault(); closeSearch(); }
    });
    modal.addEventListener('click', (e) => { if (e.target === modal) closeSearch(); });
    input.focus();
}

export function closeSearch() {
    document.querySelector('.search-modal')?.remove();
}
```

- [ ] **Step 3: 在 slides-main.js 与 main.js 集成**

`js/slides-main.js`：
```js
import { mountSearch, openSearch } from './features/search.js';
mountSearch(null, (target) => {
    window.location.href = `slides.html?chapter=${target.chapterId}&slide=${target.slideIndex + 1}`;
});
```

`js/main.js`：
```js
import { mountSearch } from './features/search.js';
mountSearch(null, (target) => {
    window.location.href = `slides.html?chapter=${target.chapterId}&slide=${target.slideIndex + 1}`;
});
```

- [ ] **Step 4: 测试 + Commit**

```bash
npm test
git add js/features/search.js tests/features/search.test.js js/slides-main.js js/main.js
git commit -m "feat(search): modal UI with keyboard navigation"
```

---

## Task 3: 章节目录侧边栏

**Files:**
- Create: `js/features/toc-sidebar.js`
- Test: `tests/features/toc-sidebar.test.js`

- [ ] **Step 1: 写测试**

```js
// tests/features/toc-sidebar.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { mountTocSidebar, toggleToc } from '../../js/features/toc-sidebar.js';

const slides = [
    { type: 'cover', title: '封面' },
    { type: 'content', title: '什么是智能体' },
    { type: 'animation', title: '动画演示' },
    { type: 'quiz', title: '知识测验' }
];

describe('toc-sidebar', () => {
    beforeEach(() => { document.body.innerHTML = ''; });

    it('mountTocSidebar creates drawer', () => {
        mountTocSidebar(slides, 0, () => {});
        expect(document.querySelector('.toc-drawer')).toBeTruthy();
    });

    it('drawer collapsed by default', () => {
        mountTocSidebar(slides, 0, () => {});
        expect(document.querySelector('.toc-drawer').classList.contains('open')).toBe(false);
    });

    it('toggleToc opens drawer', () => {
        mountTocSidebar(slides, 0, () => {});
        toggleToc();
        expect(document.querySelector('.toc-drawer').classList.contains('open')).toBe(true);
    });

    it('renders one item per slide', () => {
        mountTocSidebar(slides, 0, () => {});
        expect(document.querySelectorAll('.toc-item').length).toBe(slides.length);
    });

    it('highlights current slide', () => {
        mountTocSidebar(slides, 2, () => {});
        expect(document.querySelectorAll('.toc-item')[2].classList.contains('active')).toBe(true);
    });

    it('clicking item calls navigate', () => {
        let called = null;
        mountTocSidebar(slides, 0, (i) => { called = i; });
        document.querySelectorAll('.toc-item')[3].click();
        expect(called).toBe(3);
    });
});
```

- [ ] **Step 2: 跑测试 + 实现**

```js
// js/features/toc-sidebar.js
import { createElement, escapeHTML } from '../core/utils.js';

const ICONS = { cover: '📖', content: '📝', code: '💻', quiz: '✎', animation: '✦', timeline: '⏳', flow: '🔀', concepts: '💡', comparison: '⚖️' };

let _navigate = null;

export function mountTocSidebar(slides, currentIndex, navigate) {
    _navigate = navigate;
    const drawer = createElement('aside', { className: 'toc-drawer' });
    const list = createElement('div', { className: 'toc-list' });
    slides.forEach((s, i) => {
        const item = createElement('div', { className: 'toc-item' + (i === currentIndex ? ' active' : ''), dataset: { index: i } });
        item.innerHTML = `<span class="toc-icon">${ICONS[s.type] || '•'}</span><span class="toc-title">${escapeHTML(s.title || s.type)}</span><span class="toc-num">${i + 1}</span>`;
        item.addEventListener('click', () => { _navigate?.(i); drawer.classList.remove('open'); });
        list.appendChild(item);
    });
    drawer.appendChild(list);
    document.body.appendChild(drawer);
    return drawer;
}

export function toggleToc() {
    document.querySelector('.toc-drawer')?.classList.toggle('open');
}

export function updateTocHighlight(currentIndex) {
    document.querySelectorAll('.toc-item').forEach((el, i) => el.classList.toggle('active', i === currentIndex));
}
```

- [ ] **Step 3: 在 slides-main.js 集成**

```js
import { mountTocSidebar, toggleToc, updateTocHighlight } from './features/toc-sidebar.js';
mountTocSidebar(engine.slides, engine.currentIndex, (i) => engine.goTo(i));
const origUpdateUI = engine.updateUI.bind(engine);
engine.updateUI = function() { origUpdateUI(); updateTocHighlight(this.currentIndex); };
```

- [ ] **Step 4: 测试 + Commit**

```bash
npm test -- tests/features/toc-sidebar.test.js
git add js/features/toc-sidebar.js tests/features/toc-sidebar.test.js js/slides-main.js
git commit -m "feat(toc): slide outline drawer with current highlight"
```

---

## Task 4: 错题本

**Files:**
- Modify: `js/core/storage.js`
- Create: `js/features/review.js`
- Test: `tests/features/review.test.js`
- Modify: `js/quiz/quiz-system.js`

- [ ] **Step 1: 扩 Storage 测试 + 实现**

`tests/core/storage.test.js` 追加：
```js
import { addWrongAnswer, getWrongAnswers, clearWrong } from '../../js/core/storage.js';
describe('wrong answer book', () => {
    beforeEach(() => { Storage._resetCache(); localStorage.clear(); });

    it('addWrongAnswer stores entry', () => {
        addWrongAnswer('ch1', { questionId: 'q1', userAnswer: 'A', correctAnswer: 'B' });
        expect(getWrongAnswers('ch1').length).toBe(1);
    });

    it('getWrongAnswers returns empty for unknown chapter', () => {
        expect(getWrongAnswers('ch99')).toEqual([]);
    });

    it('clearWrong removes entries', () => {
        addWrongAnswer('ch1', { questionId: 'q1' });
        clearWrong('ch1');
        expect(getWrongAnswers('ch1')).toEqual([]);
    });

    it('caps at 50 per chapter', () => {
        for (let i = 0; i < 60; i++) addWrongAnswer('ch1', { questionId: `q${i}` });
        expect(getWrongAnswers('ch1').length).toBe(50);
    });
});
```

`js/core/storage.js` 在 export 对象中加方法：
```js
addWrongAnswer(chapterId, entry) {
    const state = this.get();
    if (!state.wrongAnswers) state.wrongAnswers = {};
    if (!state.wrongAnswers[chapterId]) state.wrongAnswers[chapterId] = [];
    state.wrongAnswers[chapterId].push({ ...entry, ts: Date.now() });
    state.wrongAnswers[chapterId] = state.wrongAnswers[chapterId].slice(-50);
    this.set(state);
},
getWrongAnswers(chapterId) {
    return this.get().wrongAnswers?.[chapterId] || [];
},
getTotalWrongCount() {
    const wa = this.get().wrongAnswers || {};
    return Object.values(wa).reduce((s, arr) => s + arr.length, 0);
},
clearWrong(chapterId) {
    const state = this.get();
    if (state.wrongAnswers?.[chapterId]) { delete state.wrongAnswers[chapterId]; this.set(state); }
},
clearAllWrong() {
    const state = this.get();
    state.wrongAnswers = {};
    this.set(state);
}
```

- [ ] **Step 2: 写 review 测试**

```js
// tests/features/review.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { renderReviewList } from '../../js/features/review.js';
import { addWrongAnswer, Storage } from '../../js/core/storage.js';

const sampleQuiz = { ch1: [{ id: 'q1', question: 'Q1', options: [{id:'A'},{id:'B'}], answer: 'B', explanation: 'exp1' }] };

describe('review', () => {
    beforeEach(() => { document.body.innerHTML = ''; Storage._resetCache(); localStorage.clear(); });

    it('shows empty state when no wrong answers', () => {
        renderReviewList(sampleQuiz, document.body);
        expect(document.body.textContent).toContain('暂无错题');
    });

    it('renders summary with wrong count', () => {
        addWrongAnswer('ch1', { questionId: 'q1', userAnswer: 'A', correctAnswer: 'B' });
        renderReviewList(sampleQuiz, document.body);
        expect(document.body.textContent).toContain('ch1');
        expect(document.body.textContent).toContain('1');
    });
});
```

- [ ] **Step 3: 实现 review.js**

```js
// js/features/review.js
import { getWrongAnswers, getTotalWrongCount } from '../core/storage.js';
import { createElement, escapeHTML } from '../core/utils.js';

export function renderReviewList(quizData, container) {
    container.innerHTML = '';
    const total = getTotalWrongCount();
    if (total === 0) {
        container.appendChild(createElement('p', { className: 'empty' }, '暂无错题，做完测验后会记录在这里。'));
        return;
    }
    Object.entries(quizData).forEach(([chapterId, questions]) => {
        const wrong = getWrongAnswers(chapterId);
        if (wrong.length === 0) return;
        const section = createElement('section', { className: 'review-section' });
        section.appendChild(createElement('h2', {}, `${chapterId}（${wrong.length} 道错题）`));
        wrong.forEach(entry => {
            const q = questions.find(qq => qq.id === entry.questionId);
            if (!q) return;
            const card = createElement('div', { className: 'review-card' });
            card.innerHTML = `
                <div class="review-q">${escapeHTML(q.question)}</div>
                <div class="review-answers">
                    <div class="review-wrong">你的答案: ${escapeHTML(String(entry.userAnswer))}</div>
                    <div class="review-correct">正确答案: ${escapeHTML(String(entry.correctAnswer))}</div>
                </div>
                <div class="review-exp">${escapeHTML(q.explanation)}</div>`;
            section.appendChild(card);
        });
        container.appendChild(section);
    });
}
```

- [ ] **Step 4: 修改 QuizSystem.submit 记录错题**

`js/quiz/quiz-system.js` 的 `submit()` 里在 `this.submitted = true` 之前加：
```js
if (!isCorrect) {
    const { addWrongAnswer } = await import('../core/storage.js');
    addWrongAnswer(this.chapterId, { questionId: q.id, userAnswer: answer, correctAnswer: q.answer });
}
```

- [ ] **Step 5: 测试 + Commit**

```bash
npm test
git add js/core/storage.js tests/core/storage.test.js js/features/review.js tests/features/review.test.js js/quiz/quiz-system.js
git commit -m "feat(review): wrong-answer book with storage integration"
```

---

## Task 5: 演讲者模式

**Files:**
- Create: `js/features/presenter-mode.js`
- Create: `presenter.html`
- Create: `js/presenter-main.js`
- Test: `tests/features/presenter-mode.test.js`

- [ ] **Step 1: 写测试 + 实现**

```js
// tests/features/presenter-mode.test.js
import { describe, it, expect } from 'vitest';
import { buildPresenterUrl, isPresenterOpen } from '../../js/features/presenter-mode.js';

describe('presenter-mode', () => {
    it('buildPresenterUrl encodes chapter and slide', () => {
        const url = buildPresenterUrl('ch1', 3);
        expect(url).toContain('chapter=ch1');
        expect(url).toContain('slide=4');
    });

    it('isPresenterOpen detects presenter URL', () => {
        expect(isPresenterOpen('presenter.html')).toBe(true);
        expect(isPresenterOpen('slides.html')).toBe(false);
    });
});
```

`js/features/presenter-mode.js`:
```js
export function buildPresenterUrl(chapterId, slideIndex) {
    return `presenter.html?chapter=${chapterId}&slide=${slideIndex + 1}`;
}
export function isPresenterOpen(url) { return url.includes('presenter.html'); }
export function openPresenter(chapterId, slideIndex) {
    return window.open(buildPresenterUrl(chapterId, slideIndex), 'presenter', 'width=1280,height=720');
}
export function bindPresenterChannel(onMessage) {
    if (typeof BroadcastChannel === 'undefined') return null;
    const ch = new BroadcastChannel('presenter');
    ch.onmessage = (e) => onMessage(e.data);
    return ch;
}
```

- [ ] **Step 2: 创建 presenter.html + js/presenter-main.js**

`presenter.html`:
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>演讲者模式</title>
    <link rel="stylesheet" href="css/main.css">
    <link rel="stylesheet" href="css/slides.css">
    <link rel="stylesheet" href="css/presenter.css">
</head>
<body>
    <div class="presenter-app">
        <main class="presenter-stage" id="presenterStage"></main>
        <aside class="presenter-side">
            <div class="presenter-timer" id="timer">00:00</div>
            <div class="presenter-notes" id="notes"></div>
            <div class="presenter-next" id="next"></div>
        </aside>
    </div>
    <script type="module" src="js/presenter-main.js"></script>
</body>
</html>
```

`js/presenter-main.js`:
```js
import { loadJSON } from './core/utils.js';
import { bindPresenterChannel } from './features/presenter-mode.js';

bindPresenterChannel((msg) => { if (msg.type === 'slide') update(msg); });

const params = Object.fromEntries(new URLSearchParams(window.location.search).entries());
const chapterId = params.chapter;
let chapter = null, slides = [], currentIdx = 0;
const start = Date.now();

const stage = document.getElementById('presenterStage');
const notes = document.getElementById('notes');
const next = document.getElementById('next');
const timer = document.getElementById('timer');

setInterval(() => {
    const sec = Math.floor((Date.now() - start) / 1000);
    timer.textContent = `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
}, 1000);

async function init() {
    if (!chapterId) { stage.textContent = '未指定章节'; return; }
    const data = await loadJSON('data/chapters.json');
    chapter = data.chapters.find(c => c.id === chapterId);
    if (!chapter) { stage.textContent = '章节不存在'; return; }
    slides = chapter.slides;
    currentIdx = Math.max(0, Math.min((parseInt(params.slide, 10) || 1) - 1, slides.length - 1));
    render();
}

function update(msg) {
    if (msg.chapterId !== chapterId) return;
    currentIdx = msg.slideIndex;
    render(msg.notes);
}

function render(notesText) {
    const slide = slides[currentIdx];
    stage.innerHTML = `<h1>${slide.title || ''}</h1><pre>${slide.content || slide.caption || ''}</pre>`;
    notes.textContent = notesText || slide.speakerNotes || '（无备注）';
    const nxt = slides[currentIdx + 1];
    next.innerHTML = nxt ? `<div>下一页</div><div>${nxt.title || nxt.type}</div>` : '<div>已到末尾</div>';
}

init();
```

- [ ] **Step 3: 测试 + Commit**

```bash
npm test -- tests/features/presenter-mode.test.js
git add js/features/presenter-mode.js tests/features/presenter-mode.test.js presenter.html js/presenter-main.js
git commit -m "feat(presenter): P-key triggers presenter window via BroadcastChannel"
```

---

## Task 6: 演讲者模式在 SlideEngine 集成

- [ ] **Step 1: 修改 SlideEngine**

`js/slides/slide-engine.js` 加方法：
```js
_broadcastSlide() {
    if (typeof BroadcastChannel === 'undefined') return;
    if (!this._channel) this._channel = new BroadcastChannel('presenter');
    const slide = this.slides[this.currentIndex];
    this._channel.postMessage({
        type: 'slide',
        chapterId: this.chapterId,
        slideIndex: this.currentIndex,
        notes: slide.speakerNotes || ''
    });
}
```

`updateUI()` 末尾追加 `this._broadcastSlide();`

- [ ] **Step 2: 加 P 键 + 按钮**

`js/slides/slide-engine.js` 的 keydown 里追加：
```js
else if (e.key === 'p' || e.key === 'P') {
    e.preventDefault();
    window.open(`presenter.html?chapter=${this.chapterId}&slide=${this.currentIndex + 1}`, 'presenter', 'width=1280,height=720');
}
```

`slides.html` 导航栏加：
```html
<button class="nav-btn" id="btnPresenter" title="演讲者模式 (P)">🎤</button>
```

`js/slides-main.js` 加：
```js
document.getElementById('btnPresenter')?.addEventListener('click', () => {
    window.open(`presenter.html?chapter=${window.slideEngine.chapterId}&slide=${window.slideEngine.currentIndex + 1}`, 'presenter', 'width=1280,height=720');
});
```

- [ ] **Step 3: 测试 + Commit**

```bash
npm test
git add js/slides/slide-engine.js js/slides-main.js slides.html
git commit -m "feat(presenter): integrate with SlideEngine broadcast + nav button"
```

---

## Task 7: 键盘导航完整化

**Files:**
- Create: `js/features/keyboard-shortcuts.js`
- Test: `tests/features/keyboard-shortcuts.test.js`

- [ ] **Step 1: 写测试 + 实现**

```js
// tests/features/keyboard-shortcuts.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { registerShortcut, bindShortcuts } from '../../js/features/keyboard-shortcuts.js';

describe('keyboard shortcuts', () => {
    beforeEach(() => { document.body.innerHTML = ''; });

    it('registerShortcut + dispatch triggers handler', () => {
        bindShortcuts();
        let called = false;
        registerShortcut('F1', () => { called = true; });
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'F1' }));
        expect(called).toBe(true);
    });

    it('? opens help modal', () => {
        bindShortcuts();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }));
        expect(document.querySelector('.help-modal')).toBeTruthy();
    });
});
```

`js/features/keyboard-shortcuts.js`:
```js
import { Storage } from '../core/storage.js';
import { openSearch, closeSearch } from './search.js';
import { toggleToc } from './toc-sidebar.js';

let _handlers = {};

export function registerShortcut(key, handler) { _handlers[key] = handler; }

export function bindShortcuts() {
    document.addEventListener('keydown', (e) => {
        const tag = (e.target && e.target.tagName) || '';
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        const ctrl = e.ctrlKey || e.metaKey;

        if (ctrl && e.key === 'k') { e.preventDefault(); openSearch(); return; }
        if (e.key === '?') { e.preventDefault(); showHelp(); return; }
        if (e.key === 't' || e.key === 'T') { e.preventDefault(); toggleToc(); return; }
        if (e.key === 'd' || e.key === 'D') {
            e.preventDefault();
            const cur = Storage.getTheme();
            Storage.setTheme(cur === 'light' ? 'dark' : 'light');
            return;
        }
        if (_handlers[e.key]) { e.preventDefault(); _handlers[e.key](); }
    });
}

function showHelp() {
    let help = document.querySelector('.help-modal');
    if (help) { help.remove(); return; }
    help = document.createElement('div');
    help.className = 'help-modal';
    help.innerHTML = `
        <div class="help-content">
            <h2>快捷键</h2>
            <table>
                <tr><td><kbd>Ctrl/Cmd</kbd>+<kbd>K</kbd></td><td>搜索</td></tr>
                <tr><td><kbd>T</kbd></td><td>章节目录</td></tr>
                <tr><td><kbd>D</kbd></td><td>暗色模式</td></tr>
                <tr><td><kbd>←/→</kbd></td><td>翻页</td></tr>
                <tr><td><kbd>Home/End</kbd></td><td>首页/末页</td></tr>
                <tr><td><kbd>P</kbd></td><td>演讲者模式</td></tr>
                <tr><td><kbd>Esc</kbd></td><td>关闭弹层</td></tr>
                <tr><td><kbd>?</kbd></td><td>本帮助</td></tr>
            </table>
            <div class="help-hint">按 ? 关闭</div>
        </div>`;
    help.addEventListener('click', (e) => { if (e.target === help) help.remove(); });
    document.body.appendChild(help);
}
```

- [ ] **Step 2: 在 slides-main.js / main.js 集成**

```js
import { bindShortcuts, registerShortcut } from './features/keyboard-shortcuts.js';
bindShortcuts();
registerShortcut('Home', () => window.slideEngine?.goTo(0));
registerShortcut('End', () => window.slideEngine?.goTo(window.slideEngine.slides.length - 1));
```

- [ ] **Step 3: 测试 + Commit**

```bash
npm test
git add js/features/keyboard-shortcuts.js tests/features/keyboard-shortcuts.test.js js/slides-main.js js/main.js
git commit -m "feat(keyboard): global shortcuts (Ctrl+K / T / D / ? / P / Home / End)"
```

---

## Task 8: 端到端验证

- [ ] **Step 1: 全测试通过**

```bash
npm test
```

- [ ] **Step 2: 启动服务器 + 验证**

```bash
python3 -m http.server 8080
```

人工验证：
- `Ctrl+K` 搜索
- `T` 目录抽屉
- `?` 帮助
- `D` 暗色切换
- 错题记录
- 演讲者模式：开 ch1，按 P，演讲者窗口同步

- [ ] **Step 3: 最终 commit**

```bash
git add -A
git commit -m "feat(ux): phase 3 complete"
```

---

## Phase 3 验收门槛

- ✅ `Ctrl+K` 搜索 < 100ms 出结果
- ✅ 目录抽屉可正常开关
- ✅ 错题本能正确累积
- ✅ 演讲者模式 P 键触发新窗口，BroadcastChannel 实时同步
- ✅ `?` 帮助浮层列出所有快捷键
- ✅ `npm test` 全部通过

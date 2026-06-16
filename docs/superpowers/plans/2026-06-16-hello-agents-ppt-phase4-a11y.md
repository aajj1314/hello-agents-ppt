# Phase 4: 可访问性 / 响应式 / PDF 导出 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把项目提升到生产级品质：A11y ≥ AA、移动端可用、PDF 可导出、性能优化。

**Architecture:** HTML 语义化重构（`<div onclick>` → `<button>` / `<a>`）+ 焦点管理 + `@media print` 打印样式 + 虚拟化与 print-mode 桥接。

**Tech Stack:** 同 Phase 1-3，零新依赖。

**前置依赖:** Phase 1-3 全部完成。

---

## Task 1: 焦点管理

**Files:**
- Create: `js/features/focus-manager.js`
- Test: `tests/features/focus-manager.test.js`

- [ ] **Step 1: 写失败测试**

```js
// tests/features/focus-manager.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { trapFocus, releaseFocus, moveFocusTo } from '../../js/features/focus-manager.js';

describe('focus-manager', () => {
    beforeEach(() => { document.body.innerHTML = ''; });

    it('moveFocusTo focuses an element', () => {
        document.body.innerHTML = '<button id="x">x</button>';
        moveFocusTo('#x');
        expect(document.activeElement.id).toBe('x');
    });

    it('trapFocus cycles Tab within container', () => {
        document.body.innerHTML = `
            <div id="modal"><button id="a">a</button><button id="b">b</button></div>
            <button id="outside">outside</button>`;
        const release = trapFocus('#modal');
        document.getElementById('a').focus();
        const ev = new KeyboardEvent('keydown', { key: 'Tab' });
        document.getElementById('b').dispatchEvent(ev);
        release();
    });

    it('releaseFocus restores previously focused element', () => {
        document.body.innerHTML = '<button id="orig">o</button><div id="modal"></div>';
        document.getElementById('orig').focus();
        const release = trapFocus('#modal');
        release();
        expect(document.activeElement.id).toBe('orig');
    });
});
```

- [ ] **Step 2: 跑测试 + 实现**

```js
// js/features/focus-manager.js
let _previouslyFocused = null;

export function moveFocusTo(selector) {
    const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
    el?.focus();
}

export function trapFocus(containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return () => {};
    _previouslyFocused = document.activeElement;
    const focusable = () => Array.from(container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )).filter(el => !el.disabled);
    const onKey = (e) => {
        if (e.key !== 'Tab') return;
        const items = focusable();
        if (items.length === 0) return;
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    container.addEventListener('keydown', onKey);
    if (focusable()[0]) focusable()[0].focus();
    return () => {
        container.removeEventListener('keydown', onKey);
        _previouslyFocused?.focus();
    };
}

export function releaseFocus() {
    _previouslyFocused?.focus();
}
```

- [ ] **Step 3: 测试 + Commit**

```bash
npm test -- tests/features/focus-manager.test.js
git add js/features/focus-manager.js tests/features/focus-manager.test.js
git commit -m "feat(a11y): focus trap + restore for modals"
```

---

## Task 2: HTML 语义化（div→button/a + ARIA）

**Files:**
- Modify: `js/app.js` (chapter card 改 a)
- Modify: `js/slides/slide-engine.js` (导航按钮加 aria-label)
- Modify: `index.html` (hero stats 加 aria)
- Modify: `slides.html` (导航加 aria)

- [ ] **Step 1: 改 chapter 卡片为链接**

`js/app.js` 的 `render()`：
```js
// 改 createElement('div', ...) → createElement('a', { href: `slides.html?chapter=${chapter.id}`, className: `card chapter-card ${isCompleted ? 'completed' : ''}` })
// 删除 card.addEventListener('click', ...) 因为 a 标签自带导航
```

- [ ] **Step 2: 改 SlideEngine 导航按钮**

`js/slides/slide-engine.js` 构造时给每个按钮加 `aria-label`：
```js
this.btnHome = $('#btnHome'); if (this.btnHome) this.btnHome.setAttribute('aria-label', '返回首页');
this.btnPrev = $('#btnPrev'); if (this.btnPrev) this.btnPrev.setAttribute('aria-label', '上一页');
// ... 同样给 btnNext / btnPrevBottom / btnNextBottom 加
this.progressBar?.setAttribute('role', 'progressbar');
this.progressBar?.setAttribute('aria-valuemin', '0');
this.progressBar?.setAttribute('aria-valuemax', this.slides.length);
// updateUI() 里设 aria-valuenow
this.progressBar?.setAttribute('aria-valuenow', this.currentIndex + 1);
```

- [ ] **Step 3: 在 slides.html 章节容器加 role**

`slides.html` 的 `<main class="slide-container">` 改为：
```html
<main class="slide-container" id="slideStage" role="region" aria-label="幻灯片内容"></main>
```

- [ ] **Step 4: 改 index.html hero stats**

```html
<div class="hero-stats" id="heroStats" role="group" aria-label="学习统计">
    <div class="stat-card"><div class="stat-value" id="statChapters" aria-live="polite">0</div><div class="stat-label">章节</div></div>
    ...
</div>
<div class="progress-overview" id="heroProgress">
    <span id="heroProgressLabel">整体进度</span>
    <div class="progress-bar-hero" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" id="heroProgressBar">
        <div class="fill" id="heroProgressFill" style="width: 0%"></div>
    </div>
    <span id="heroProgressText">0%</span>
</div>
```

`js/app.js` 的 `render()` 中同步 aria-valuenow：
```js
const heroBar = document.getElementById('heroProgressBar');
if (heroBar) heroBar.setAttribute('aria-valuenow', overall);
```

- [ ] **Step 5: 跑测试 + Commit**

```bash
npm test
git add js/app.js js/slides/slide-engine.js index.html slides.html
git commit -m "feat(a11y): semantic HTML + ARIA roles/labels"
```

---

## Task 3: 焦点环样式

**Files:**
- Create: `css/a11y.css`

- [ ] **Step 1: 写全局焦点环 CSS**

`css/a11y.css`:
```css
:focus-visible {
    outline: 3px solid #4F46E5;
    outline-offset: 2px;
    border-radius: 4px;
}
button:focus-visible,
a:focus-visible {
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.4);
}
```

- [ ] **Step 2: 在 index.html 与 slides.html 引入**

```html
<link rel="stylesheet" href="css/a11y.css">
```

`presenter.html` 同样添加。

- [ ] **Step 3: Commit**

```bash
git add css/a11y.css index.html slides.html presenter.html
git commit -m "feat(a11y): visible focus ring for keyboard navigation"
```

---

## Task 4: 响应式断点

**Files:**
- Modify: `css/main.css`
- Modify: `css/slides.css`
- Create: `tests/responsive.test.js`

- [ ] **Step 1: 写响应式测试**

```js
// tests/responsive.test.js
import { describe, it, expect } from 'vitest';

describe('responsive CSS breakpoints', () => {
    it('main.css contains @media for ≤480', async () => {
        const fs = await import('fs');
        const css = fs.readFileSync('/home/anan/桌面/hello-agents-ppt/css/main.css', 'utf8');
        expect(css).toMatch(/@media\s*\([^)]*max-width:\s*480/);
    });
    it('main.css contains @media for ≤768', async () => {
        const fs = await import('fs');
        const css = fs.readFileSync('/home/anan/桌面/hello-agents-ppt/css/main.css', 'utf8');
        expect(css).toMatch(/@media\s*\([^)]*max-width:\s*768/);
    });
    it('main.css contains @media for ≤1024', async () => {
        const fs = await import('fs');
        const css = fs.readFileSync('/home/anan/桌面/hello-agents-ppt/css/main.css', 'utf8');
        expect(css).toMatch(/@media\s*\([^)]*max-width:\s*1024/);
    });
    it('comparison-table has overflow-x container', async () => {
        const fs = await import('fs');
        const css = fs.readFileSync('/home/anan/桌面/hello-agents-ppt/css/main.css', 'utf8');
        expect(css).toMatch(/\.comparison-table[\s\S]{0,500}overflow-x/);
    });
});
```

- [ ] **Step 2: 在 main.css 末尾追加**

```css
/* === 响应式断点 === */
@media (max-width: 1024px) {
    .toc-drawer { width: 260px; }
}
@media (max-width: 768px) {
    .chapter-grid { grid-template-columns: 1fr; }
    .top-nav { padding: 0.5rem; }
    .comparison-table { display: block; overflow-x: auto; }
    .canvas-wrapper { height: 320px !important; }
    .hero-stats { grid-template-columns: repeat(2, 1fr); }
    .slide-cover h1 { font-size: 1.75rem; }
}
@media (max-width: 480px) {
    html { font-size: 14px; }
    .chapter-card { padding: 0.75rem; }
    .toc-drawer { width: 100%; bottom: 0; top: auto; height: 60vh; }
    button, a { min-height: 44px; }
    .kbd-shortcuts { display: none; }
}
```

- [ ] **Step 3: 跑测试 + Commit**

```bash
npm test -- tests/responsive.test.js
git add css/main.css tests/responsive.test.js
git commit -m "feat(responsive): 1024/768/480 breakpoints + overflow containers"
```

---

## Task 5: PDF 导出（含虚拟化桥接）

**Files:**
- Create: `css/print.css`
- Create: `js/features/print.js`
- Modify: `js/slides/slide-engine.js`
- Test: `tests/features/print.test.js`

- [ ] **Step 1: 写 print 测试**

```js
// tests/features/print.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { renderAllForPrint, restoreFromPrint } from '../../js/features/print.js';

describe('print mode', () => {
    beforeEach(() => { document.body.innerHTML = ''; });

    it('renderAllForPrint adds print-mode class to body', () => {
        document.body.innerHTML = '<div class="slide-content"></div><div class="slide-content"></div>';
        renderAllForPrint();
        expect(document.body.classList.contains('print-mode')).toBe(true);
    });

    it('restoreFromPrint removes print-mode class', () => {
        renderAllForPrint();
        restoreFromPrint();
        expect(document.body.classList.contains('print-mode')).toBe(false);
    });
});
```

- [ ] **Step 2: 写 print.css**

`css/print.css`:
```css
@media print {
    body { background: white !important; color: #0F172A !important; }
    .slides-nav, .slides-bottom-nav, .theme-toggle, .search-toggle, .toc-drawer { display: none !important; }
    .slide-content {
        display: block !important;
        page-break-inside: avoid;
        break-inside: avoid;
        margin-bottom: 1rem;
        border: 1px solid #ddd;
        padding: 1rem;
    }
    .slide-content.active { display: block !important; }
    canvas { display: none !important; }
    canvas.print-static { display: block !important; }
    .quiz-explanation { display: block !important; }
    .code-block { white-space: pre-wrap; word-break: break-all; }
    a { color: #4F46E5 !important; }
}
```

- [ ] **Step 3: 实现 print.js**

```js
// js/features/print.js

export function renderAllForPrint() {
    if (document.body.classList.contains('print-mode')) return;
    document.body.classList.add('print-mode');
    // canvas → 静态图
    document.querySelectorAll('canvas').forEach(c => {
        try {
            const dataUrl = c.toDataURL('image/png');
            const img = document.createElement('img');
            img.src = dataUrl;
            img.className = 'print-static';
            img.style.width = '100%';
            c.parentNode.insertBefore(img, c);
        } catch (e) { /* 跨域 canvas 可能失败，忽略 */ }
    });
}

export function restoreFromPrint() {
    if (!document.body.classList.contains('print-mode')) return;
    document.body.classList.remove('print-mode');
    document.querySelectorAll('img.print-static').forEach(img => img.remove());
}

export function setupAfterPrint() {
    window.addEventListener('afterprint', restoreFromPrint);
}
```

- [ ] **Step 4: 修改 SlideEngine 加打印入口**

`js/slides/slide-engine.js` 加方法：
```js
printCurrent() {
    import('../features/print.js').then(({ renderAllForPrint, setupAfterPrint }) => {
        renderAllForPrint();
        setupAfterPrint();
        window.print();
    });
}
```

- [ ] **Step 5: 在 slides.html 加按钮 + 引入 print.css**

`slides.html` 导航栏加：
```html
<button class="nav-btn" id="btnPrint" title="导出 PDF">📄</button>
```

引入：
```html
<link rel="stylesheet" href="css/print.css">
```

`js/slides-main.js`：
```js
document.getElementById('btnPrint')?.addEventListener('click', () => {
    window.slideEngine?.printCurrent();
});
```

- [ ] **Step 6: 跑测试 + Commit**

```bash
npm test -- tests/features/print.test.js
git add css/print.css js/features/print.js tests/features/print.test.js js/slides/slide-engine.js js/slides-main.js slides.html
git commit -m "feat(print): canvas-to-image + print-mode bridge for PDF export"
```

---

## Task 6: 虚拟化渲染

**Files:**
- Modify: `js/slides/slide-engine.js`

**注意**：虚拟化与 §5 打印是**互斥**的。实现方式：默认虚拟化；`printCurrent()` 用 print.js 桥接全量渲染。

- [ ] **Step 1: 修改 SlideEngine**

`js/slides/slide-engine.js` 的 `render()`：
- 默认行为改为只渲染当前 slide（虚拟化）
- 加 `renderAll()` 方法做"全量渲染 + 当前页高亮"（仅 print 路径调用）

```js
render() {
    if (this.titleEl) this.titleEl.textContent = this.chapterData.title;
    if (this.subtitleEl) this.subtitleEl.textContent = this.chapterData.subtitle || '';
    if (this._isPrinting) { return this._renderAll(); }
    this._renderCurrent();
}

_renderCurrent() {
    this.stage.innerHTML = '';
    this._animMounted.clear();
    const slide = this.slides[this.currentIndex];
    const el = createElement('div', {
        className: `slide-content slide-${slide.type} active`,
        dataset: { index: this.currentIndex }
    });
    el.innerHTML = this.router.route(slide, this._ctxFor(this.currentIndex));
    this.stage.appendChild(el);
    if (slide.type === 'animation') setTimeout(() => this._mountAnimation(slide), 0);
    if (slide.type === 'quiz') setTimeout(() => this._mountQuiz(), 0);
}

_renderAll() {
    this.stage.innerHTML = '';
    this._animMounted.clear();
    this.slides.forEach((slide, index) => {
        const el = createElement('div', {
            className: `slide-content slide-${slide.type}` + (index === this.currentIndex ? ' active' : ''),
            dataset: { index }
        });
        el.innerHTML = this.router.route(slide, this._ctxFor(index));
        this.stage.appendChild(el);
        if (slide.type === 'animation') this._mountAnimation(slide);
        if (slide.type === 'quiz' && index === this.currentIndex) this._mountQuiz();
    });
}

_ctxFor(index) {
    return { chapterData: this.chapterData, slideIndex: index, slidesLength: this.slides.length };
}
```

- [ ] **Step 2: 修改 printCurrent 用 _renderAll**

```js
printCurrent() {
    this._isPrinting = true;
    import('../features/print.js').then(({ renderAllForPrint, setupAfterPrint }) => {
        this._renderAll();
        renderAllForPrint();
        setupAfterPrint();
        window.print();
        setTimeout(() => { this._isPrinting = false; this._renderCurrent(); }, 100);
    });
}
```

- [ ] **Step 3: 跑测试 + Commit**

```bash
npm test
git add js/slides/slide-engine.js
git commit -m "perf(slides): virtualize render (current slide only); print path renders all"
```

---

## Task 7: 性能：lazy mount 动画

**Files:**
- Modify: `js/slides/slide-engine.js`

- [ ] **Step 1: 加 mount guard**

`js/slides/slide-engine.js` 的 `_mountAnimation` 入口加：
```js
if (this._animMounted.has(id)) return; // 已 mount 不重做
```

- [ ] **Step 2: leavePage 时 destroy**

加方法：
```js
destroyAnimation(id) {
    if (window.Animations?.[id]?.destroy) window.Animations[id].destroy();
    this._animMounted.delete(id);
}
```

修改 `_renderCurrent`：进入前 `this.slides.forEach((s, i) => { if (s.type === 'animation' && i !== this.currentIndex) this.destroyAnimation(s.animation); });`

- [ ] **Step 3: 跑测试 + Commit**

```bash
npm test
git add js/slides/slide-engine.js
git commit -m "perf(animations): lazy mount + destroy on slide leave"
```

---

## Task 8: Lighthouse 端到端

- [ ] **Step 1: 跑全部测试**

```bash
npm test
```

- [ ] **Step 2: 启动服务器 + Chrome DevTools Lighthouse**

```bash
python3 -m http.server 8080
```

Chrome → `http://localhost:8080/` → DevTools → Lighthouse → 跑 Performance / Accessibility / Best Practices / SEO

目标：Performance ≥ 90，Accessibility ≥ 95。

如不达标：检查 Largest Contentful Paint（最可能由 canvas 太大导致）、Accessibility 缺 aria、Best Practices 缺 https（本地 http 正常）。

- [ ] **Step 3: 移动端验证（iPhone SE 视口）**

Chrome DevTools → Toggle device toolbar → iPhone SE (375×667)：
- 首页应单列布局、触摸目标 ≥44px
- 进入 ch1 翻页正常
- canvas 高度变 320px

- [ ] **Step 4: PDF 导出验证**

Chrome → `http://localhost:8080/slides.html?chapter=ch1` → 点 📄 按钮 → 打印对话框 → 另存为 PDF：
- PDF 应包含全部 ch1 slide
- canvas 应是静态截图
- quiz 答案与解析展开

在 Firefox、Edge 重复验证。

- [ ] **Step 5: A11y 辅助技术测试（可选项）**

如有 NVDA/VoiceOver：开 ch1，验证屏幕阅读器朗读"幻灯片内容 区域"、每张 slide 标题被读出、动画 canvas 有 aria-label。

如无条件，至少跑 axe-core 浏览器扩展确认无 critical 违规。

- [ ] **Step 6: 最终 commit**

```bash
git add -A
git commit -m "chore: phase 4 complete - a11y, responsive, PDF, performance"
```

---

## Phase 4 验收门槛

- ✅ `npm test` 全部通过
- ✅ Chrome DevTools Lighthouse: Perf ≥ 90、A11y ≥ 95
- ✅ iPhone SE (375×667) 视口下首页 + ch1 翻页可用
- ✅ 导出 PDF（Chrome/Firefox/Edge）包含全部 ch1 slide + canvas 静态截图 + quiz 答案
- ✅ 键盘 Tab 走完首页 + 1 章无焦点黑洞
- ✅ 章节抽屉在 < 480px 屏幕自动变为 bottom sheet
- ✅ axe-core 无 critical 违规

完成后项目处于"生产级"状态，可发布。

---

## 端到端验收（4 阶段合并）

按 spec §9 验收门槛：

**阶段一交付：**
- ✅ 用户视角完全等价
- ✅ `slide-engine.js` 职责单一
- ✅ 新增动画零 HTML 改动

**阶段二交付：**
- ✅ 16 章完整
- ✅ 每章 ≥ 20 slide / ≥ 5 quiz
- ✅ 动画亮/暗主题正确
- ✅ 每章完成技术准确性 QA

**阶段三交付：**
- ✅ Ctrl+K 搜索 < 100ms
- ✅ 演讲者模式可用
- ✅ 错题本闭环
- ✅ ? 帮助浮层

**阶段四交付：**
- ✅ axe 无 critical
- ✅ iPhone SE 可用
- ✅ PDF 三浏览器可导出（含全部 slide，虚拟化桥接正确）
- ✅ Lighthouse Perf ≥ 90、A11y ≥ 95

---

## 不在本阶段实施（YAGNI）

- PWA / Service Worker（增加复杂度，本地 HTTP 已够用）
- IndexedDB（localStorage 容量足够学习进度）
- WebSocket / 实时协作
- 多语言切换 UI

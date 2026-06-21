# Claude-Inspired 前端重设计实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 hello-agents-ppt 整体换皮为 Claude(Anthropic)风格的设计语言(暖米 canvas + coral CTA + Source Serif 4 editorial 大标题),保留 0 运行时依赖、103 测试通过、纯静态部署的硬约束。

**Architecture:** 5 阶段分阶段提交(token → chrome → 16 动画 → 暗色 → 文档),每阶段独立可回退。`css/main.css` 顶部 `:root` 作为唯一 token 来源,16 个 Canvas 动画通过扩展 `js/animations/canvas-animation.js` 基类的 `theme()` 工具读 token,不再硬编码 hex。类名不动以保护 103 个测试。

**Tech Stack:** 纯静态 HTML/CSS/JS · 0 运行时依赖 · Source Serif 4 + Inter + JetBrains Mono(全部 Google Fonts 免费可商用)· vitest + jsdom 测试 · GitHub Pages 部署

**Spec:** [2026-06-21-claude-inspired-redesign-design.md](file:///workspace/docs/superpowers/specs/2026-06-21-claude-inspired-redesign-design.md)

**Branch:** `feat/claude-inspired-redesign`(HEAD `d9aed83`,从 main `fc84b7d` 开)

---

## 文件结构与职责

### 修改的 CSS 文件

| 文件 | 职责 |
|------|------|
| `css/main.css` | token 体系 + 基础元素 + chrome(导航/按钮/卡片) |
| `css/slides.css` | 9 种 slide type 的视觉样式 |
| `css/themes.css` | light/dark 主题切换 |
| `css/a11y.css` | focus 环 + A11y 辅助 |
| `css/animations.css` | 关键帧动画 |
| `css/print.css` | 打印模式(基本不动) |

### 修改的 JS 文件

| 文件 | 职责 |
|------|------|
| `js/animations/canvas-animation.js` | **基类,扩展 `theme()` 工具** |
| `js/animations/ch1-agent-types.js` ~ `ch16-capstone.js` | **16 个动画的色值重映射** |
| `js/animations/video-animation.js` | 视频占位(基本不动) |

### 修改的 HTML 文件

| 文件 | 职责 |
|------|------|
| `index.html` | 首页 hero + 章节卡 + 统计 + CTA + footer |
| `slides.html` | 播放器顶部 + 容器(基本不动) |
| `presenter.html` | 演讲者页(基本不动) |

### 新增文件

| 文件 | 职责 |
|------|------|
| `docs/DESIGN.md` | design source of truth(从 Claude DESIGN.md 摘录) |
| `docs/ANIMATION-THEME-MAP.md` | 16 个动画的原色→token 映射表 |

### 不动的事(YAGNI)

- 9 个 slide renderer(`js/slides/renderers/`)
- `js/core/`:Storage / Utils / ContentParser / CodeHighlighter
- `js/quiz/QuizSystem` 行为
- `data/chapters.json` / `data/quiz-data.json` 内容
- `BroadcastChannel` 跨窗口逻辑
- Canvas animation 行为(play/pause/step/speed)
- 所有类名

---

## 阶段 1:Token 体系 + main.css 重写(预计 1-2 天)

### Task 1.1: 备份现有 main.css

**Files:**
- Read: `css/main.css`

- [ ] **Step 1: 记录当前 main.css 关键信息**

Run: `wc -l css/main.css`
Expected: 1560 css/main.css

Run: `grep -c "^:root\|^\[data-theme" css/main.css`
Expected: 2(根选择器 + dark 主题)

Run: `grep -c "var(--" css/main.css`
Expected: 0(0 运行时依赖,自检当前是否使用 CSS 变量)

> 注:如果 main.css 已经在用 `var(--*)`,记录所有引用名,Task 1.4 之后会保留这些引用名。

- [ ] **Step 2: 暂存原 main.css 作为参考**

Run: `cp css/main.css /tmp/main.css.bak`
Expected: 0 退出

### Task 1.2: 重写 main.css 的字体引入

**Files:**
- Modify: `css/main.css:1-12`(顶部注释 + @import)

- [ ] **Step 1: 替换顶部注释**

替换文件顶部 1-9 行的注释块:

```css
/* ============================================================
 * Hello-Agents Design System
 * Style: Claude-Inspired · warm editorial · cream + coral + serif
 * Palette: Warm Cream / Coral / Dark Navy
 * Type:    Source Serif 4 400 (display) + Inter 400/500 (body)
 * Motion:  400ms cubic-bezier(0.4, 0, 0.2, 1)
 * ============================================================ */
```

- [ ] **Step 2: 替换 @import 行**

替换 `css/main.css` 的 `@import` 行:

```css
/* --- Web Fonts --- */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Source+Serif+4:opsz,wght@8..60,400;8..60,500&display=swap');
```

- [ ] **Step 3: 验证本地服务能正常加载字体**

Run: `python3 -m http.server 8080 &` (后台启动)
Run: `curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/css/main.css`
Expected: 200

Run: `curl -s http://localhost:8080/css/main.css | head -15`
Expected: 看到新的注释 + @import

- [ ] **Step 4: 手动验证(打开浏览器)**

打开 `http://localhost:8080/`,检查 Network 面板是否成功加载 `Source+Serif+4` 字体文件。

- [ ] **Step 5: 提交**

Run:
```bash
git add css/main.css
git commit -m "style(main): replace Sora with Source Serif 4 in @import"
```

### Task 1.3: 重写 main.css 的 :root token

**Files:**
- Modify: `css/main.css`(整个 `:root` 块)

- [ ] **Step 1: 替换 :root 块**

找到现有 `:root { ... }`(大约 11-79 行),整体替换为:

```css
:root {
    /* === Claude colors (light) === */
    --canvas: #faf9f5;
    --canvas-soft: #f5f0e8;
    --surface-card: #efe9de;
    --surface-cream-strong: #e8e0d2;
    --surface-dark: #181715;
    --surface-dark-elevated: #252320;
    --surface-dark-soft: #1f1e1b;
    --hairline: #e6dfd8;
    --hairline-soft: #ebe6df;

    --primary: #cc785c;
    --primary-active: #a9583e;
    --primary-disabled: #e6dfd8;
    --accent-teal: #5db8a6;
    --accent-amber: #e8a55a;

    --ink: #141413;
    --body-strong: #252523;
    --body: #3d3d3a;
    --muted: #6c6a64;
    --muted-soft: #8e8b82;
    --on-primary: #ffffff;
    --on-dark: #faf9f5;
    --on-dark-soft: #a09d96;

    --success: #5db872;
    --warning: #d4a017;
    --error: #c64545;

    /* === Typography === */
    --font-display: "Source Serif 4", "EB Garamond", "Tiempos Headline", Garamond, serif;
    --font-body: "Inter", "StyreneB", -apple-system, system-ui, sans-serif;
    --font-mono: "JetBrains Mono", ui-monospace, monospace;

    /* === Radii === */
    --radius-xs: 4px;
    --radius-sm: 6px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-xl: 16px;
    --radius-pill: 9999px;

    /* === Spacing (4px base) === */
    --space-xxs: 4px;
    --space-xs: 8px;
    --space-sm: 12px;
    --space-md: 16px;
    --space-lg: 24px;
    --space-xl: 32px;
    --space-xxl: 48px;
    --space-section: 96px;

    /* === Shadows (Claude: 极少用) === */
    --shadow-1: 0 1px 3px rgba(20, 20, 19, 0.08);
    --shadow-2: 0 8px 24px rgba(20, 20, 19, 0.12), 0 2px 6px rgba(20, 20, 19, 0.06);

    /* === Motion === */
    --ease: cubic-bezier(0.4, 0, 0.2, 1);
    --t-fast: 200ms var(--ease);
    --t-base: 400ms var(--ease);
    --t-slow: 600ms var(--ease);
}
```

- [ ] **Step 2: 验证 token 解析**

Run: `grep -c "^    --" css/main.css`
Expected: ≥ 35(所有 token 名)

Run: `grep -c "var(--" css/main.css`
Expected: 0(token 还没被引用,这是预期的)

- [ ] **Step 3: 提交**

Run:
```bash
git add css/main.css
git commit -m "style(tokens): rewrite :root with Claude palette + Source Serif 4"
```

### Task 1.4: 重写 main.css 的 dark mode token

**Files:**
- Modify: `css/main.css`(`[data-theme="dark"]` 块)

- [ ] **Step 1: 替换 dark mode 块**

找到现有 `[data-theme="dark"] { ... }`(大约 81-105 行),整体替换为:

```css
[data-theme="dark"] {
    --canvas: #0d253d;
    --canvas-soft: #0a1929;
    --surface-card: #1c1e54;
    --surface-dark: #0a1929;
    --surface-dark-elevated: #1c2a40;
    --surface-dark-soft: #142235;
    --hairline: rgba(255, 255, 255, 0.08);
    --ink: #faf9f5;
    --body: #cbd5e1;
    --muted: #94a3b8;
    --on-dark: #faf9f5;
    --on-dark-soft: #a09d96;
}
```

- [ ] **Step 2: 验证 dark 模式 token**

Run: `grep -A 12 "data-theme=\"dark\"" css/main.css | head -13`
Expected: 看到新 token

- [ ] **Step 3: 提交**

Run:
```bash
git add css/main.css
git commit -m "style(tokens): rewrite dark mode as claude.ai deep-navy variant"
```

### Task 1.5: 移除 main.css 的 glassmorphism 与 aurora

**Files:**
- Modify: `css/main.css`(`body::before`、`backdrop-filter` 相关、所有 `--gradient-aurora-*`)

- [ ] **Step 1: 找到 aurora 引用**

Run: `grep -n "aurora\|backdrop-filter\|gradient-aurora" css/main.css`
Expected: 列出所有 aurora 渐变、backdrop-filter 使用位置

- [ ] **Step 2: 移除 `body::before` aurora 渐变**

找到 `body::before { ... }` 块,删除或注释掉(整段)。

如果希望保留但简化,可替换为:

```css
body::before {
    content: none;
}
```

- [ ] **Step 3: 替换所有 backdrop-filter**

Run: `grep -n "backdrop-filter" css/main.css`

每个 `backdrop-filter: blur(*px)` 改为:

```css
backdrop-filter: none;
```

或删除该属性。

- [ ] **Step 4: 移除 `--gradient-aurora-*` 变量**

找到 `:root` 里的 aurora 渐变变量,删除。

- [ ] **Step 5: 验证移除完成**

Run: `grep -n "aurora\|backdrop-filter" css/main.css`
Expected: 0 匹配

- [ ] **Step 6: 提交**

Run:
```bash
git add css/main.css
git commit -m "refactor(main): remove glassmorphism and aurora gradient"
```

### Task 1.6: 验证阶段 1 完成

**Files:** N/A

- [ ] **Step 1: 跑测试**

Run: `npm test 2>&1 | tail -10`
Expected: 103 passed | 1 skipped(可能因 main.css 改动出现 ≤5 个失败)

- [ ] **Step 2: 手动验证首页**

打开 `http://localhost:8080/`,确认:
- 页面能加载(没有 CSS 解析错误)
- 字体切换到 Source Serif 4(可能还有 fallback 字体,后续阶段会替换)
- 颜色仍是旧 aurora 色(此阶段只改 token,组件还没改)

- [ ] **Step 3: 记录已知问题**

如果测试有失败,记录在 `/tmp/phase1-test-failures.txt`。后续阶段会修复。

- [ ] **Step 4: 阶段 1 总结**

记录此阶段 commit 列表:
```bash
git log --oneline fc84b7d..HEAD
```

---

## 阶段 2:Chrome 重塑(预计 2-3 天)

### Task 2.1: 重写 main.css 的基础元素(body / typography)

**Files:**
- Modify: `css/main.css`(`body`、`h1`-`h6`、排版基础)

- [ ] **Step 1: 替换 body 样式**

找到 `body { ... }` 块,替换为:

```css
body {
    font-family: var(--font-body);
    font-size: 16px;
    line-height: 1.55;
    color: var(--ink);
    background-color: var(--canvas);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    transition: background-color var(--t-base), color var(--t-base);
}
```

- [ ] **Step 2: 替换 h1-h6 样式**

找到所有 `h1`-`h6` 块,替换为:

```css
h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-display);
    font-weight: 400;
    color: var(--ink);
    line-height: 1.2;
    letter-spacing: -0.02em;
}

h1 { font-size: 48px; letter-spacing: -0.03em; }
h2 { font-size: 36px; letter-spacing: -0.015em; }
h3 { font-size: 28px; }
h4 { font-size: 22px; }
h5 { font-size: 18px; font-family: var(--font-body); font-weight: 500; }
h6 { font-size: 16px; font-family: var(--font-body); font-weight: 500; }

@media (min-width: 1024px) {
    h1 { font-size: 64px; }
    h2 { font-size: 48px; }
}
```

- [ ] **Step 3: 手动验证**

打开 `http://localhost:8080/`,检查:
- body 背景变为暖米
- 标题字体变为 Source Serif 4 衬线
- 颜色对比度足够

- [ ] **Step 4: 提交**

Run:
```bash
git add css/main.css
git commit -m "style(typography): body + h1-h6 use Source Serif 4 with negative tracking"
```

### Task 2.2: 重写按钮样式(替换 glass 风)

**Files:**
- Modify: `css/main.css`(.btn-primary / .btn-secondary / .btn-danger / 相关 hover 状态)

- [ ] **Step 1: 找到所有按钮类**

Run: `grep -n "\.btn" css/main.css`
Expected: 列出 .btn-primary, .btn-secondary, .btn-danger 等

- [ ] **Step 2: 替换 .btn-primary**

找到 `.btn-primary` 规则,替换为:

```css
.btn-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background-color: var(--primary);
    color: var(--on-primary);
    font-family: var(--font-body);
    font-size: 14px;
    font-weight: 500;
    line-height: 1.0;
    height: 40px;
    padding: 12px 20px;
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background-color var(--t-fast);
}
.btn-primary:hover { background-color: var(--primary-active); }
.btn-primary:disabled { background-color: var(--primary-disabled); color: var(--muted); cursor: not-allowed; }
```

- [ ] **Step 3: 替换 .btn-secondary**

```css
.btn-secondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background-color: var(--canvas);
    color: var(--ink);
    font-family: var(--font-body);
    font-size: 14px;
    font-weight: 500;
    line-height: 1.0;
    height: 40px;
    padding: 12px 20px;
    border: 1px solid var(--hairline);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: border-color var(--t-fast), background-color var(--t-fast);
}
.btn-secondary:hover { border-color: var(--primary); color: var(--primary); }
```

- [ ] **Step 4: 替换 .btn-danger(如有)**

```css
.btn-danger {
    background-color: var(--canvas);
    color: var(--error);
    border: 1px solid var(--hairline);
    border-radius: var(--radius-md);
    padding: 12px 20px;
    height: 40px;
}
.btn-danger:hover { border-color: var(--error); }
```

- [ ] **Step 5: 验证按钮视觉**

打开浏览器,看 index.html 上的"开始学习/继续上次"按钮:
- coral 背景 + 白字
- 8px 圆角(不是 pill)
- 12px×20px padding
- 40px 高

- [ ] **Step 6: 提交**

Run:
```bash
git add css/main.css
git commit -m "style(buttons): replace glass buttons with Claude flat pills"
```

### Task 2.3: 重写导航/章节卡(sticky-nav / chapter-card)

**Files:**
- Modify: `css/main.css`(.sticky-nav / .chapter-card / .stat-tile)

- [ ] **Step 1: 替换 .sticky-nav**

找到 `.sticky-nav` 规则,替换为:

```css
.sticky-nav {
    position: sticky;
    top: 0;
    z-index: 100;
    background-color: var(--canvas);
    border-bottom: 1px solid var(--hairline);
    height: 64px;
    padding: 0 var(--space-xl);
    display: flex;
    align-items: center;
    justify-content: space-between;
}
```

- [ ] **Step 2: 替换 .chapter-card**

找到 `.chapter-card` 规则,替换为:

```css
.chapter-card {
    background-color: var(--surface-card);
    border: none;
    border-radius: var(--radius-lg);
    padding: var(--space-xl);
    transition: background-color var(--t-fast);
    cursor: pointer;
    text-decoration: none;
    color: inherit;
    display: block;
}
.chapter-card:hover {
    background-color: var(--surface-cream-strong);
}
.chapter-card h3 {
    margin: 0 0 var(--space-sm) 0;
    color: var(--ink);
}
.chapter-card p {
    margin: 0;
    color: var(--body);
    font-size: 14px;
    line-height: 1.55;
}
```

- [ ] **Step 3: 替换 .stat-tile**

```css
.stat-tile {
    background-color: var(--canvas);
    border: 1px solid var(--hairline);
    border-radius: var(--radius-lg);
    padding: var(--space-xl);
    text-align: center;
}
.stat-tile .stat-number {
    font-family: var(--font-display);
    font-size: 36px;
    font-weight: 400;
    color: var(--ink);
    letter-spacing: -0.5px;
    line-height: 1.15;
    display: block;
}
.stat-tile .stat-label {
    font-size: 14px;
    color: var(--muted);
    margin-top: var(--space-sm);
}
```

- [ ] **Step 4: 验证首页视觉**

打开 `http://localhost:8080/`:
- 顶部 nav:暖米底 + 1px hairline 底边
- 16 章卡片:暖米 cream 底(`#efe9de`)、12px 圆角、无 shadow、hover 时变深一点
- 统计区:白底 + hairline 边框 + 12px 圆角,数字用 Source Serif 4 衬线

- [ ] **Step 5: 提交**

Run:
```bash
git add css/main.css
git commit -m "style(chrome): replace glass nav/cards with Claude flat cream surfaces"
```

### Task 2.4: 重写 index.html 的 hero 区

**Files:**
- Modify: `index.html`(hero banner section)

- [ ] **Step 1: 找到 hero 部分**

Run: `grep -n "hero\|hero-banner\|hero-stats" index.html`
Expected: 列出所有 hero 相关类

- [ ] **Step 2: 添加新 hero 类到 main.css**

在 `css/main.css` 添加:

```css
.hero-band {
    background-color: var(--canvas);
    padding: var(--space-section) var(--space-xl);
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-xl);
    max-width: 1200px;
    margin: 0 auto;
}
@media (min-width: 1024px) {
    .hero-band {
        grid-template-columns: 1fr 1fr;
        align-items: center;
    }
}
.hero-content h1 {
    font-size: 64px;
    font-weight: 400;
    letter-spacing: -1.5px;
    line-height: 1.05;
    margin-bottom: var(--space-lg);
    color: var(--ink);
}
.hero-content p {
    font-size: 16px;
    line-height: 1.55;
    color: var(--body);
    margin-bottom: var(--space-xl);
    max-width: 540px;
}
.hero-eyebrow {
    display: inline-block;
    background-color: var(--primary);
    color: var(--on-primary);
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 1.5px;
    padding: 4px 12px;
    border-radius: var(--radius-pill);
    margin-bottom: var(--space-md);
    text-transform: uppercase;
}
.hero-cta {
    display: flex;
    gap: var(--space-md);
    align-items: center;
}
.hero-illustration-card {
    background-color: var(--surface-dark);
    color: var(--on-dark);
    border-radius: var(--radius-xl);
    padding: var(--space-xl);
    min-height: 360px;
    font-family: var(--font-mono);
    font-size: 14px;
    line-height: 1.6;
    overflow: hidden;
}
```

- [ ] **Step 3: 修改 index.html 的 hero 结构**

将现有的 hero 区域包装为:

```html
<section class="hero-band">
    <div class="hero-content">
        <span class="hero-eyebrow">AI AGENTS · 16 章</span>
        <h1>Meet your thinking partner for building Agents</h1>
        <p>16 章交互式学习 · 338 张幻灯片 · 20 个 Canvas 动画</p>
        <div class="hero-cta">
            <button class="btn-primary" onclick="...">开始学习</button>
            <button class="btn-text-link" onclick="...">继续上次 →</button>
        </div>
    </div>
    <div class="hero-illustration-card">
        <!-- 显示 ReAct 循环示意或 agent 对话截图 -->
        <pre style="margin: 0; color: var(--on-dark-soft);"><code>// agent loop
while (true) {
  thought = llm(observation)
  action = tool(thought)
  observation = env(action)
}</code></pre>
    </div>
</section>
```

- [ ] **Step 4: 验证 hero 视觉**

打开 `http://localhost:8080/`:
- 左 50%:coral eyebrow + 衬线大标题 + body-md 副标题 + coral CTA
- 右 50%:深 navy 卡片,内含 monospace 代码

- [ ] **Step 5: 提交**

Run:
```bash
git add index.html css/main.css
git commit -m "feat(home): redesign hero with cream + serif + coral + dark mockup"
```

### Task 2.5: 重写 index.html 的 CTA Band + Footer

**Files:**
- Modify: `index.html`(进度 callout / pre-footer CTA / footer)
- Modify: `css/main.css`(新增 .callout-card-coral / .cta-band-coral / .footer-dark)

- [ ] **Step 1: 在 main.css 添加 CTA 块样式**

```css
.callout-card-coral {
    background-color: var(--primary);
    color: var(--on-primary);
    border-radius: var(--radius-lg);
    padding: var(--space-xxl);
    max-width: 1200px;
    margin: var(--space-section) auto;
    text-align: center;
}
.callout-card-coral h2 {
    color: var(--on-primary);
    font-size: 28px;
    margin-bottom: var(--space-md);
}
.callout-card-coral p {
    color: var(--on-primary);
    opacity: 0.9;
    margin-bottom: var(--space-xl);
}
.cta-band-coral {
    background-color: var(--primary);
    color: var(--on-primary);
    padding: 64px var(--space-xl);
    text-align: center;
    margin: var(--space-section) 0 0 0;
}
.cta-band-coral h2 {
    color: var(--on-primary);
    font-size: 28px;
    margin-bottom: var(--space-md);
    letter-spacing: -0.3px;
}
.cta-band-coral .btn-primary {
    background-color: var(--canvas);
    color: var(--primary);
}
.cta-band-coral .btn-primary:hover {
    background-color: var(--canvas-soft);
}

footer.site-footer {
    background-color: var(--surface-dark);
    color: var(--on-dark-soft);
    padding: 64px var(--space-xl);
    font-size: 14px;
}
footer.site-footer .footer-grid {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-xl);
}
@media (max-width: 768px) {
    footer.site-footer .footer-grid { grid-template-columns: 1fr; }
}
footer.site-footer h4 {
    color: var(--on-dark);
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin-bottom: var(--space-md);
}
footer.site-footer a {
    color: var(--on-dark-soft);
    text-decoration: none;
    display: block;
    padding: 4px 0;
}
footer.site-footer a:hover { color: var(--on-dark); }
footer.site-footer .footer-brand {
    font-family: var(--font-display);
    color: var(--on-dark);
    font-size: 18px;
    margin-bottom: var(--space-sm);
}
```

- [ ] **Step 2: 修改 index.html 的 CTA 与 footer**

将现有的进度条改为 `callout-card-coral`,新增 pre-footer `cta-band-coral`,重写 footer。

- [ ] **Step 3: 验证全站视觉**

打开 `http://localhost:8080/`:
- 进度区域:coral 填充,white text
- 章节卡下方:全宽 coral CTA band
- 页脚:深 navy + cream text,4 列链接

- [ ] **Step 4: 跑测试**

Run: `npm test 2>&1 | tail -10`
Expected: ≤5 个失败(类名应该不动,失败可能因颜色字面量断言)

- [ ] **Step 5: 提交**

Run:
```bash
git add index.html css/main.css
git commit -m "style(home): add coral callout + CTA band + dark footer"
```

### Task 2.6: 更新 slides.html / presenter.html 的 chrome

**Files:**
- Modify: `slides.html`(顶部 nav)
- Modify: `presenter.html`(计时器卡)
- Modify: `css/main.css`(补充 .nav / .timer-card 样式)

- [ ] **Step 1: 修改 slides.html 的顶部 nav**

将现有的 sticky-nav 元素保留,但确认类名是 `.sticky-nav` 已被 Task 2.3 重写。视觉会自动更新。

- [ ] **Step 2: 修改 presenter.html 的计时器卡**

找到 presenter.html 的计时器元素,添加 `product-mockup-card-dark` 或 `code-window-card` 类(参考 Task 1.3 的样式)。

如果已存在类似类,在 main.css 中把它们的样式改为新风格。

- [ ] **Step 3: 验证两个页面**

打开 `http://localhost:8080/slides.html`:
- 顶部 nav:暖米底,无 backdrop-filter
- slide 容器:暖米 + hairline

打开 `http://localhost:8080/presenter.html`:
- 计时器卡:深 navy,衬线大字,tabular 数字
- 下一页预览:深 navy 缩略

- [ ] **Step 4: 提交**

Run:
```bash
git add slides.html presenter.html css/main.css
git commit -m "style(slides/presenter): apply Claude dark surfaces to chrome"
```

### Task 2.7: 更新搜索、TOC、键盘帮助浮层

**Files:**
- Modify: `css/main.css`(更新 .search-panel / .toc-drawer / .keyboard-help 等)

- [ ] **Step 1: 找到相关类**

Run: `grep -n "search\|toc-drawer\|keyboard" css/main.css | head -20`

- [ ] **Step 2: 替换为新风格**

参照 spec §3.3 组件规范,把所有 chrome(搜索面板、TOC drawer、键盘帮助浮层)改用:
- bg=`--canvas`(暖米)
- border 1px `--hairline`
- shadow-2 浮层
- 12px 圆角
- coral focus 环

- [ ] **Step 3: 验证**

打开浏览器,按 Ctrl+K / T / ? 测试对应浮层。

- [ ] **Step 4: 提交**

Run:
```bash
git add css/main.css
git commit -m "style(overlays): search/TOC/keyboard help use Claude cream surfaces"
```

### Task 2.8: 验证阶段 2 完成

**Files:** N/A

- [ ] **Step 1: 跑测试**

Run: `npm test 2>&1 | tail -10`
Expected: ≤5 个失败

- [ ] **Step 2: 手动走 3 个页面**

按顺序验证:
1. `http://localhost:8080/`(首页)
2. 点击"开始学习" → `http://localhost:8080/slides.html`
3. 走完第 1 章 20 张 slide
4. 切换主题(D 键)
5. 打开搜索(Ctrl+K)
6. 打开 TOC(T)
7. 打开演讲者模式(P)
8. 关闭

记录所有视觉问题到 `/tmp/phase2-visual-issues.txt`。

- [ ] **Step 3: 阶段 2 总结**

```bash
git log --oneline fc84b7d..HEAD
```

---

## 阶段 3:16 个 Canvas 动画统一配色(预计 5-7 天)

### Task 3.0: 扩展 canvas-animation.js 基类

**Files:**
- Modify: `js/animations/canvas-animation.js`

- [ ] **Step 1: 阅读现有基类**

Run: `cat js/animations/canvas-animation.js`
Expected: 看到基类的 render / onResize / onThemeChange 等方法

- [ ] **Step 2: 添加 theme() 方法**

在 `CanvasAnimation` 类中新增方法:

```javascript
/**
 * Returns current theme tokens, reading from CSS custom properties.
 * Falls back to Claude default palette if a token is missing.
 */
theme() {
    const cs = getComputedStyle(document.documentElement);
    const get = (name, fallback) => {
        const v = cs.getPropertyValue(name).trim();
        return v || fallback;
    };
    return {
        primary:           get('--primary', '#cc785c'),
        primaryActive:     get('--primary-active', '#a9583e'),
        ink:               get('--ink', '#141413'),
        body:              get('--body', '#3d3d3a'),
        muted:             get('--muted', '#6c6a64'),
        mutedSoft:         get('--muted-soft', '#8e8b82'),
        canvas:            get('--canvas', '#faf9f5'),
        surfaceCard:       get('--surface-card', '#efe9de'),
        surfaceDark:       get('--surface-dark', '#181715'),
        surfaceDarkSoft:   get('--surface-dark-soft', '#1f1e1b'),
        accentTeal:        get('--accent-teal', '#5db8a6'),
        accentAmber:       get('--accent-amber', '#e8a55a'),
        hairline:          get('--hairline', '#e6dfd8'),
        onDark:            get('--on-dark', '#faf9f5'),
        onDarkSoft:        get('--on-dark-soft', '#a09d96'),
        success:           get('--success', '#5db872'),
        warning:           get('--warning', '#d4a017'),
        error:             get('--error', '#c64545'),
    };
}
```

- [ ] **Step 3: 添加主题监听**

在 `CanvasAnimation` 类的 `init()` 或构造函数中,添加 `MutationObserver` 监听 `data-theme`:

```javascript
_observeTheme() {
    const observer = new MutationObserver(() => {
        if (typeof this.render === 'function') {
            this.render();
        }
    });
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
    });
    this._themeObserver = observer;
}
```

并在类的 `destroy()` 方法中:`this._themeObserver?.disconnect();`

- [ ] **Step 4: 验证基类修改**

Run: `grep -n "theme()\|_observeTheme" js/animations/canvas-animation.js`
Expected: 看到新增的方法

- [ ] **Step 5: 跑测试**

Run: `npm test 2>&1 | tail -10`
Expected: 103 passed(基类修改不应破坏测试)

- [ ] **Step 6: 提交**

Run:
```bash
git add js/animations/canvas-animation.js
git commit -m "feat(animation-base): add theme() helper + auto-redraw on theme switch"
```

### Task 3.1-3.16: 重写 16 个动画

> **执行模式**:每个动画一个 Task,模式相同。
> 1. 读动画当前实现
> 2. 找到所有硬编码 hex
> 3. 替换为 `this.theme().*` 调用
> 4. 手动验证视觉
> 5. 提交

**通用方法**(每个动画都执行):

```javascript
// 之前
ctx.fillStyle = '#7C3AED';
ctx.strokeStyle = '#06B6D4';
ctx.fillStyle = '#EC4899';

// 之后
const t = this.theme();
ctx.fillStyle = t.primary;
ctx.strokeStyle = t.accentTeal;
ctx.fillStyle = t.primary; // 珊瑚替代粉色
```

**色值替换规则**:
| 原色 | 替换为 |
|------|--------|
| `#7C3AED` (violet) | `t.primary` (coral) |
| `#06B6D4` (cyan) | `t.accentTeal` |
| `#EC4899` (pink) | `t.primary` (coral) |
| `#10B981` (emerald) | `t.success` |
| `#FBBF24` (amber) | `t.accentAmber` |
| `#FFFFFF` (white) | `t.canvas` 或 `t.onDark` (依背景) |
| `#000000` (black) | `t.ink` 或 `t.surfaceDark` (依背景) |
| 任何 `rgba(*, *, *, *)` 灰阶 | `t.ink` / `t.muted` / `t.mutedSoft` 之一 |

### Task 3.1: 重写 ch1-agent-types.js

**Files:**
- Modify: `js/animations/ch1-agent-types.js`

- [ ] **Step 1: 读现有实现**

Run: `cat js/animations/ch1-agent-types.js`

- [ ] **Step 2: 找到所有 hex 颜色**

Run: `grep -nE "#[0-9A-Fa-f]{3,6}|rgba?\(" js/animations/ch1-agent-types.js`
Expected: ~27 行匹配

- [ ] **Step 3: 替换颜色(参考通用方法的色值规则)**

在 render() 或 paint() 方法开头添加:
```javascript
const t = this.theme();
```

把所有硬编码颜色替换为 `t.*` 引用。

**色彩策略**(本动画 4 类 agent 区分):
- 主分类: `t.ink`
- 副分类 1: `t.muted`
- 副分类 2: `t.mutedSoft`
- 高亮分类: `t.primary`(coral)

- [ ] **Step 4: 验证视觉**

打开 `http://localhost:8080/slides.html`,进入 CH1,确认:
- 4 类 agent 用 ink / muted / mutedSoft / coral 区分
- 暖米背景上的线条和文字清晰

- [ ] **Step 5: 切换主题测试**

按 D 键,确认动画自动重绘,深 navy 背景下线条可见。

- [ ] **Step 6: 提交**

Run:
```bash
git add js/animations/ch1-agent-types.js
git commit -m "style(ch1): unify colors to Claude palette (ink/muted/coral)"
```

### Task 3.2: 重写 ch2-history-timeline.js

**Files:**
- Modify: `js/animations/ch2-history-timeline.js`

- [ ] **Step 1-5: 按 Task 3.1 模式执行**

**色彩策略**(时间线):
- 8 个里程碑节点: `t.primary`(coral)
- 主时间线: `t.ink`
- 辅助线: `t.muted`
- 年代标签: `t.body`
- 当前节点高亮: `t.primary-active`

- [ ] **Step 6: 提交**

Run:
```bash
git add js/animations/ch2-history-timeline.js
git commit -m "style(ch2): unify timeline colors to Claude palette"
```

### Task 3.3: 重写 ch3-attention.js

**Files:**
- Modify: `js/animations/ch3-attention.js`

- [ ] **Step 1-5: 按 Task 3.1 模式执行**

**色彩策略**(注意力热图):
- 低注意力: `t.mutedSoft`
- 中注意力: `t.accentAmber`
- 高注意力: `t.primary`(coral)
- 网格线: `t.hairline`
- hover 高亮: `t.primary-active`

- [ ] **Step 6: 提交**

Run:
```bash
git add js/animations/ch3-attention.js
git commit -m "style(ch3): unify heatmap colors to Claude palette"
```

### Task 3.4: 重写 ch4-react-loop.js

**Files:**
- Modify: `js/animations/ch4-react-loop.js`

- [ ] **Step 1-5: 按 Task 3.1 模式执行**

**色彩策略**(ReAct 循环):
- Thought 节点: `t.ink`(深)
- Action 节点: `t.primary`(coral)
- Observation 节点: `t.muted`
- 循环箭头: `t.body`
- 当前步骤高亮: `t.primary-active`

- [ ] **Step 6: 提交**

Run:
```bash
git add js/animations/ch4-react-loop.js
git commit -m "style(ch4): unify ReAct loop colors to Claude palette"
```

### Task 3.5: 重写 ch5-lowcode.js

**Files:**
- Modify: `js/animations/ch5-lowcode.js`

- [ ] **Step 1-5: 按 Task 3.1 模式执行**

**色彩策略**(Canvas 占位):
- 提示框边框: `t.primary`
- 提示文字: `t.ink`
- 占位背景: `t.surface-card`
- "video fallback" 标签: `t.muted`

- [ ] **Step 6: 提交**

Run:
```bash
git add js/animations/ch5-lowcode.js
git commit -m "style(ch5): unify lowcode placeholder colors to Claude palette"
```

### Task 3.6: 重写 ch6-frameworks.js

**Files:**
- Modify: `js/animations/ch6-frameworks.js`

- [ ] **Step 1-5: 按 Task 3.1 模式执行**

**色彩策略**(框架调用栈):
- 调用栈层级: `t.ink` 不同 alpha(`#14141326` = `t.ink` 0.15 alpha)
- 当前栈帧: `t.primary`
- 调用箭头: `t.muted`
- 函数名: `t.body`

- [ ] **Step 6: 提交**

Run:
```bash
git add js/animations/ch6-frameworks.js
git commit -m "style(ch6): unify frameworks colors to Claude palette"
```

### Task 3.7: 重写 ch7-framework.js

**Files:**
- Modify: `js/animations/ch7-framework.js`

- [ ] **Step 1-5: 按 Task 3.1 模式执行**

**色彩策略**(框架组件关系):
- 组件节点: `t.surface-card` 填充 + `t.ink` 边框
- 当前组件: `t.primary` 填充
- 关系线: `t.muted`
- 组件标签: `t.body`

- [ ] **Step 6: 提交**

Run:
```bash
git add js/animations/ch7-framework.js
git commit -m "style(ch7): unify framework relations colors to Claude palette"
```

### Task 3.8: 重写 ch8-memory.js

**Files:**
- Modify: `js/animations/ch8-memory.js`

- [ ] **Step 1-5: 按 Task 3.1 模式执行**

**色彩策略**(记忆流):
- 记忆节点: `t.primary`(coral)
- 流动线条: `t.ink`
- 强调记忆: `t.accentTeal`
- 失活记忆: `t.mutedSoft`

- [ ] **Step 6: 提交**

Run:
```bash
git add js/animations/ch8-memory.js
git commit -m "style(ch8): unify memory flow colors to Claude palette"
```

### Task 3.9: 重写 ch9-context-window.js

**Files:**
- Modify: `js/animations/ch9-context-window.js`

- [ ] **Step 1-5: 按 Task 3.1 模式执行**

**色彩策略**(上下文窗口):
- 窗口边框: `t.primary`
- 已填充区域: `t.surface-card`
- 当前 token: `t.accentAmber`
- 截断标记: `t.warning`

- [ ] **Step 6: 提交**

Run:
```bash
git add js/animations/ch9-context-window.js
git commit -m "style(ch9): unify context window colors to Claude palette"
```

### Task 3.10: 重写 ch10-protocol.js

**Files:**
- Modify: `js/animations/ch10-protocol.js`

- [ ] **Step 1-5: 按 Task 3.1 模式执行**

**色彩策略**(协议时序):
- 时间轴: `t.ink`
- 协议节点: `t.muted`
- 当前事件: `t.primary`
- 消息箭头: `t.body`
- 错误状态: `t.error`

- [ ] **Step 6: 提交**

Run:
```bash
git add js/animations/ch10-protocol.js
git commit -m "style(ch10): unify protocol timing colors to Claude palette"
```

### Task 3.11: 重写 ch11-rl-feedback.js

**Files:**
- Modify: `js/animations/ch11-rl-feedback.js`

- [ ] **Step 1-5: 按 Task 3.1 模式执行**

**色彩策略**(奖励信号):
- 正向奖励: `t.primary`(coral)
- 负向惩罚: `t.muted`
- 中性反馈: `t.body`
- 奖励箭头: `t.success`

- [ ] **Step 6: 提交**

Run:
```bash
git add js/animations/ch11-rl-feedback.js
git commit -m "style(ch11): unify RL feedback colors to Claude palette"
```

### Task 3.12: 重写 ch12-radar.js

**Files:**
- Modify: `js/animations/ch12-radar.js`

- [ ] **Step 1-5: 按 Task 3.1 模式执行**

**色彩策略**(雷达图 6 维):
- 6 维填充: 从 `t.ink` 到 `t.mutedSoft` 渐变(6 档明度)
- 当前维度高亮: `t.primary`(coral)
- 网格线: `t.hairline`
- 轴标签: `t.muted`

实现提示:6 档明度可以用 `t.ink` + alpha 渐变(0.2, 0.35, 0.5, 0.65, 0.8, 1.0),或使用 `globalAlpha`。

- [ ] **Step 6: 提交**

Run:
```bash
git add js/animations/ch12-radar.js
git commit -m "style(ch12): unify radar chart colors to Claude palette (6 ink alpha + coral)"
```

### Task 3.13: 重写 ch13-travel.js

**Files:**
- Modify: `js/animations/ch13-travel.js`

- [ ] **Step 1-5: 按 Task 3.1 模式执行**

**色彩策略**(多智能体协作):
- 4 个 agent: `t.ink` / `t.primary` / `t.accentTeal` / `t.muted`
- 协作线: `t.body`
- 任务节点: `t.surface-card` 填充 + `t.ink` 边框
- 完成任务: `t.success`

- [ ] **Step 6: 提交**

Run:
```bash
git add js/animations/ch13-travel.js
git commit -m "style(ch13): unify travel agent colors to Claude palette"
```

### Task 3.14: 重写 ch14-task-tree.js

**Files:**
- Modify: `js/animations/ch14-task-tree.js`

- [ ] **Step 1-5: 按 Task 3.1 模式执行**

**色彩策略**(任务树):
- 树节点: `t.surface-card` 填充 + `t.ink` 边框
- 当前节点: `t.primary` 填充
- 树线: `t.muted`
- 子任务: `t.body`

- [ ] **Step 6: 提交**

Run:
```bash
git add js/animations/ch14-task-tree.js
git commit -m "style(ch14): unify task tree colors to Claude palette"
```

### Task 3.15: 重写 ch15-cybertown.js

**Files:**
- Modify: `js/animations/ch15-cybertown.js`

- [ ] **Step 1-5: 按 Task 3.1 模式执行**

**色彩策略**(小镇网格):
- 网格线: `t.hairline`
- Agent 在地图上: `t.ink` / `t.primary` / `t.accentTeal`
- 当前选中: `t.primary-active`
- 路径: `t.muted`

- [ ] **Step 6: 提交**

Run:
```bash
git add js/animations/ch15-cybertown.js
git commit -m "style(ch15): unify cybertown colors to Claude palette"
```

### Task 3.16: 重写 ch16-capstone.js

**Files:**
- Modify: `js/animations/ch16-capstone.js`

- [ ] **Step 1-5: 按 Task 3.1 模式执行**

**色彩策略**(Canvas 占位):
- 提示框边框: `t.primary`
- 提示文字: `t.ink`
- 占位背景: `t.surface-card`
- "video fallback" 标签: `t.muted`

替换示例(假设原代码有):
```javascript
// 之前
ctx.strokeStyle = '#7C3AED';
ctx.fillStyle = '#FFFFFF';

// 之后
const t = this.theme();
ctx.strokeStyle = t.primary;
ctx.fillStyle = t.surfaceCard;
```

- [ ] **Step 6: 提交**

Run:
```bash
git add js/animations/ch16-capstone.js
git commit -m "style(ch16): unify capstone placeholder colors to Claude palette"
```

### Task 3.17: 验证阶段 3 完成

**Files:** N/A

- [ ] **Step 1: 跑测试**

Run: `npm test 2>&1 | tail -10`
Expected: ≤10 个失败

- [ ] **Step 2: 走 16 章**

打开 `http://localhost:8080/slides.html`,逐章查看动画:
- 暖米背景上的对比度足够
- 16 个动画都使用 ink / muted / coral / accentTeal / accentAmber
- 没有遗留的 violet / cyan / pink 颜色

- [ ] **Step 3: 切换主题测试**

按 D 键,确认 16 个动画都自动重绘,深 navy 背景下都清晰可见。

- [ ] **Step 4: 记录测试失败**

如果测试失败,把颜色字面量断言的位置找出来:

```bash
npm test 2>&1 | grep -B2 "Expected"
```

更新这些测试文件,把字面量替换为新的色值(不要改类名)。

- [ ] **Step 5: 阶段 3 总结**

```bash
git log --oneline fc84b7d..HEAD | wc -l
```
Expected: ~18-20 commits(token + chrome + 16 动画 + 基类)

---

## 阶段 4:暗色主题 + 测试回归(预计 2 天)

### Task 4.1: 验证 dark mode token 切换

**Files:** N/A

- [ ] **Step 1: 浏览器测试**

打开 `http://localhost:8080/`,按 D 键切换暗色:
- 暖米 → 深 navy
- ink 文字 → cream
- coral CTA 保持
- 16 个动画自动重绘

- [ ] **Step 2: 修复发现的问题**

如果某些组件在暗色下对比度不足,在对应 CSS 类中添加 `[data-theme="dark"]` 覆盖。

- [ ] **Step 3: 跑测试**

Run: `npm test 2>&1 | tail -10`
Expected: 失败数应该与阶段 3 末尾一致(此阶段不引入新失败)

### Task 4.2: 验证响应式断点

**Files:** N/A

- [ ] **Step 1: 测试 4 个断点**

用浏览器 DevTools 模拟:
- 1440px (desktop)
- 1024px (tablet landscape)
- 768px (tablet portrait)
- 480px (mobile)

确认每个断点下:
- 章节卡 3-up → 2-up → 1-up
- 统计区不溢出
- CTA 不被截断
- 动画 canvas 不变形

- [ ] **Step 2: 修复发现的问题**

- [ ] **Step 3: 提交(如有修复)**

```bash
git add css/*.css
git commit -m "fix(responsive): adjust breakpoints for Claude layout"
```

### Task 4.3: A11y 检查(focus 环 / 对比度 / 键盘导航)

**Files:**
- Modify: `css/a11y.css`(focus 环颜色)

- [ ] **Step 1: 替换 focus 环颜色**

找到 `.focus-ring` 或 `:focus-visible` 规则,把 `outline-color` 从 violet 改为 coral:

```css
:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
}
```

- [ ] **Step 2: 验证键盘导航**

打开 `http://localhost:8080/`,按 Tab 键走完所有可聚焦元素,确认:
- 每个元素都有可见 focus 环(coral)
- focus 环不与元素重叠

- [ ] **Step 3: 检查对比度**

用 Chrome DevTools Lighthouse 跑 a11y 检查:
- 目标:对比度全部 ≥ 4.5:1(正文)/ 3:1(大字号)

- [ ] **Step 4: 提交**

```bash
git add css/a11y.css
git commit -m "fix(a11y): use coral focus ring for WCAG AA contrast"
```

### Task 4.4: 跑全部测试 + 修复

**Files:** N/A

- [ ] **Step 1: 跑 npm test**

Run: `npm test 2>&1 | tail -20`
Expected: 全部通过,或 ≤5 个失败(因颜色字面量断言)

- [ ] **Step 2: 修复测试失败**

对于每个失败:
- 如果是颜色字面量断言,更新测试中的字面量为新色值
- 如果是结构断言(类名/选择器),**不要修改**类名,改测试

- [ ] **Step 3: 再跑**

Run: `npm test 2>&1 | tail -10`
Expected: 103 passed | 1 skipped

- [ ] **Step 4: 提交**

```bash
git add tests/
git commit -m "test: update color literal assertions for Claude palette"
```

### Task 4.5: 阶段 4 完整回归

**Files:** N/A

- [ ] **Step 1: 启动本地服务**

Run: `python3 -m http.server 8080 &`

- [ ] **Step 2: 完整路径回归**

按顺序:
1. 打开 `http://localhost:8080/`
2. 检查首页:hero / 16 章卡 / 统计 / CTA / footer
3. 点击"开始学习" → slides.html
4. 走完 16 章(每章至少看 1 张 cover + 1 张 content + 1 张 code + 1 张 animation)
5. 按 D 键切换暗色
6. 再走 1-2 章确认暗色下动画可见
7. 按 Ctrl+K 搜索
8. 按 T 打开 TOC
9. 按 P 演讲者模式
10. 按 ? 键盘帮助
11. 关闭

- [ ] **Step 3: 修复发现的所有问题**

- [ ] **Step 4: 提交最终修复**

```bash
git add .
git commit -m "fix: phase 4 final regression fixes"
```

---

## 阶段 5:文档收尾(预计 1 天)

### Task 5.1: 撰写 docs/DESIGN.md

**Files:**
- Create: `docs/DESIGN.md`

- [ ] **Step 1: 创建文件**

```bash
touch docs/DESIGN.md
```

- [ ] **Step 2: 写入 design source of truth**

写入以下结构(参考 [2026-06-21-claude-inspired-redesign-design.md §3-7](file:///workspace/docs/superpowers/specs/2026-06-21-claude-inspired-redesign-design.md)):

```markdown
# Hello-Agents Design System

> **Style: Claude-Inspired** — warm editorial · cream + coral + serif
>
> This document is the single source of truth for the project's design language.
> Inspired by [Anthropic Claude DESIGN.md](https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/claude/DESIGN.md).

## Tokens

### Colors (light)
[复制 spec §3.1 的 light token 表]

### Colors (dark)
[复制 spec §7.2 的 dark token 表]

### Typography
[复制 spec §3.2 的 typography 层级表]

### Spacing
[复制 spec §3.1 的 spacing token]

### Radii
[复制 spec §3.1 的 radii token]

## Components
[复制 spec §3.3 的组件规范表]

## Do's and Don'ts
- **Do** 用 Source Serif 4 衬线做 display
- **Do** 保留 coral 给主 CTA + coral callout
- **Do** cream canvas + dark surface 节奏交替
- **Don't** 用 backdrop-filter
- **Don't** 引入超出 token 的色值
- **Don't** 把 Sora 字体加回来
```

- [ ] **Step 3: 提交**

```bash
git add docs/DESIGN.md
git commit -m "docs: add DESIGN.md as Claude-inspired design source of truth"
```

### Task 5.2: 撰写 docs/ANIMATION-THEME-MAP.md

**Files:**
- Create: `docs/ANIMATION-THEME-MAP.md`

- [ ] **Step 1: 创建文件**

```bash
touch docs/ANIMATION-THEME-MAP.md
```

- [ ] **Step 2: 写入 16 动画的色值映射**

写入 spec §5.3 的表格 + 每个动画的具体色值说明:

```markdown
# Animation Theme Map

> 16 个 Canvas 动画的"原色 → Claude palette"映射表

## 通用色值替换规则

| 原色 | 替换为 token |
|------|--------------|
| `#7C3AED` (violet) | `t.primary` |
| `#06B6D4` (cyan) | `t.accentTeal` |
| `#EC4899` (pink) | `t.primary` |
| `#10B981` (emerald) | `t.success` |
| `#FBBF24` (amber 自定义) | `t.accentAmber` |
| `#FFFFFF` | `t.canvas` 或 `t.onDark` |
| `#000000` | `t.ink` 或 `t.surfaceDark` |

## 16 个动画的语义策略

[复制 spec §5.3 的表格]

## 添加新动画的 checklist

1. 只能在 `t.*` token 中选色
2. 暖米背景上对比度 ≥ 4.5:1
3. 暗色主题下重新跑一遍确认可见
4. 提交时附上截图
```

- [ ] **Step 3: 提交**

```bash
git add docs/ANIMATION-THEME-MAP.md
git commit -m "docs: add ANIMATION-THEME-MAP.md for 16 animations"
```

### Task 5.3: 更新 CLAUDE.md 顶部注释

**Files:**
- Modify: `CLAUDE.md`(顶部风格描述)

- [ ] **Step 1: 找到当前描述**

Run: `head -10 CLAUDE.md`
Expected: "Style: Glassmorphism + Aurora Gradient" 等

- [ ] **Step 2: 替换风格描述**

把 "Style: Glassmorphism + Aurora Gradient" 改为 "Style: Claude-Inspired · warm editorial · cream + coral + serif"。

- [ ] **Step 3: 提交**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with new style description"
```

### Task 5.4: 阶段 5 总结 + 推送到 origin

**Files:** N/A

- [ ] **Step 1: 查看完整 commit 历史**

```bash
git log --oneline fc84b7d..HEAD
```

- [ ] **Step 2: 推送分支到 origin**

```bash
git push -u origin feat/claude-inspired-redesign
```

- [ ] **Step 3: 在 GitHub 上创建 PR(可选)**

- [ ] **Step 4: 通知用户**

报告:
- 总 commit 数
- 测试通过数
- 已知遗留问题

---

## 成功标准(再次强调)

- [ ] `index.html` 视觉与 Claude editorial 调性对齐
- [ ] 16 个 Canvas 动画在 light/dark 主题下都使用 Claude palette
- [ ] `npm test` 全部通过(允许 ≤10 个颜色字面量测试更新)
- [ ] 三个 HTML 入口在 light/dark 主题下视觉都自洽
- [ ] Glassmorphism 完全移除
- [ ] 字体从 Sora 切到 Source Serif 4 + Inter
- [ ] 文档 `docs/DESIGN.md` + `docs/ANIMATION-THEME-MAP.md` 完成
- [ ] 0 运行时依赖保持
- [ ] GitHub Pages 可直接部署

---

## 回退策略

如果阶段 1-4 任一阶段发现不可行:
```bash
git reset --hard <上一阶段最后 commit>
```

每个阶段 commit 独立可回退。

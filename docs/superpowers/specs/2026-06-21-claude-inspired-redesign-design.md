# Claude-Inspired 前端彻底重设计文档

> 设计主题:把 hello-agents-ppt 整体换皮为 Claude(Anthropic)风格的设计语言(暖米 canvas + coral CTA + 衬线 editorial 大标题 + cream→dark 节奏),保留 0 运行时依赖、纯静态部署、103 测试通过的核心约束。
>
> 创建日期:2026-06-21
> 替代关系:supersedes [2026-06-21-stripe-inspired-redesign-design.md](file:///workspace/docs/superpowers/specs/2026-06-21-stripe-inspired-redesign-design.md)(已标 deferred)
> 设计范围:CSS token 体系重写 · 三大 HTML 入口重塑 · 16 个 chapter Canvas 动画统一到 Claude 调色板 · Glassmorphism 完全拆除 · 暗色重设计为 claude.ai 风格 · 字体从 Sora 切到 Source Serif 4 + Inter
> 预计工期:2-3 周(其中 60% 工作量为 16 个 Canvas 动画逐个重画)

---

## 1. 背景与目标

### 1.1 现状问题

当前设计系统([css/main.css](file:///workspace/css/main.css#L1-L78))是"Glassmorphism + Aurora Gradient"风格,核心特征:
- 字体:Sora 600/800(标题)+ Inter 400/500(正文)
- 调色板:Deep Indigo `#0B0A2A` + Violet Aurora `#7C3AED` + Cyan `#06B6D4` + Pink `#EC4899`
- 视觉语言:`backdrop-filter: blur(12px)` + 半透明玻璃 + 多层 aurora 渐变
- 暗色:`body::before` 强化 aurora,白底镜像

**具体痛点**:
1. **首页冲击与可读性失衡**:hero 玻璃 + aurora 渐变 + Sora 800 重标题同时出现,首次访问者视线无法聚焦
2. **16 个 Canvas 动画全部硬编码 hex**(`js/animations/ch*.js` 合计 ~500 个色值),与 token 解耦,改色必须逐文件改
3. **暗色主题只是白底镜像**,没有自己的视觉叙事
4. **CSS 缺乏 token 文档化**,3400 行 CSS 中 token 与组件混在一起
5. **品牌识别度弱**:Sora 800 + aurora + 玻璃是 2023-2024 通用 AI 工具的同质化风格,缺乏 editorial 文学气质

### 1.2 借用 awesome-design-md 的意图

[VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) 提供 74 个真实网站的 DESIGN.md 规范。我们**借用其格式与一个具体的语言**——Claude(Anthropic 官网),而不是其视觉。

借用的两件事:
- **结构**:colors / typography / rounded / spacing / components 五大 token 分类
- **语汇**:Claude 那种"warm editorial、literary publication、humanist"的 AI 教学调性,与 Hello-Agents 作为"系统性教程"的定位高度契合

不借用的事:
- **Copernicus / Tiempos Headline 字体**(付费,改用免费 Source Serif 4)
- **Anthropic spike-mark logo**(用现有 Hello-Agents 文字 logo 替代)
- **claude.ai 产品 chrome 细节**(chat 界面、文件上传 chips 等超出 marketing 表面)

### 1.3 设计目标

1. 视觉语言从"重玻璃 + 重渐变"切换为"暖米 + 衬线 + coral + cream→dark 节奏"
2. 把 ~500 个硬编码 hex 收编到 token 体系,且**统一到 Claude 调色板**(无领域语义例外)
3. 暗色重设计为 claude.ai 实际暗色风格(deep navy + cream text + coral CTA 保留)
4. 103 个测试大部分不动;类名不动
5. 0 运行时依赖、纯静态部署的硬约束保留

---

## 2. 用户决策记录

| 决策项 | 选择 | 备注 |
|--------|------|------|
| 优化方向 | C 范围 | token + 16 动画 + 拆 Glassmorphism + 暗色重设计 |
| 设计参考 | Claude DESIGN.md(替代原 Stripe) | 74 个候选里与"AI 教学"主题契合度最高 |
| 字体策略 | Source Serif 4 替代 Copernicus | 免费可商用,保留 ~75% 视觉;最"学术教材" |
| Glassmorphism | 完全拆除 | 包括 `.sticky-nav` / `.modal` 的 `backdrop-filter` |
| 暗色策略 | 重设计为 claude.ai 暗色 | deep navy base + cream text + coral CTA |
| 动画配色 | **统一到 Claude 调色板** | 雷达 6 维 / 时间线 / 热图均归到 coral/teal/amber/grayscale |
| 视觉节奏 | cream → cream-card → dark-mockup 交替 | Claude 招牌的色块对比 |
| 类名 | 全部保留 | 减少测试断裂与组件耦合改动 |
| 工作分支 | `feat/claude-inspired-redesign` | 从 main `fc84b7d` 开 |

---

## 3. 设计系统骨架

### 3.1 Token 体系(`css/main.css` 顶部 `:root`)

```css
:root {
  /* === Claude colors (light) === */
  --canvas: #faf9f5;          /* 暖米 - 整页氛围 */
  --canvas-soft: #f5f0e8;     /* section 分隔 */
  --surface-card: #efe9de;    /* feature cards */
  --surface-cream-strong: #e8e0d2;
  --surface-dark: #181715;    /* code/产品/页脚 */
  --surface-dark-elevated: #252320;
  --surface-dark-soft: #1f1e1b;
  --hairline: #e6dfd8;
  --hairline-soft: #ebe6df;

  --primary: #cc785c;          /* coral - 唯一填充色 CTA */
  --primary-active: #a9583e;
  --primary-disabled: #e6dfd8;
  --accent-teal: #5db8a6;
  --accent-amber: #e8a55a;

  --ink: #141413;             /* warm dark, 不用纯黑 */
  --body-strong: #252523;
  --body: #3d3d3a;
  --muted: #6c6a64;
  --muted-soft: #8e8b82;
  --on-primary: #ffffff;
  --on-dark: #faf9f5;         /* cream-tinted white */
  --on-dark-soft: #a09d96;

  --success: #5db872;
  --warning: #d4a017;
  --error: #c64545;

  /* === Typography === */
  --font-display: "Source Serif 4", "EB Garamond", "Tiempos Headline", Garamond, serif;
  --font-body: "Inter", "StyreneB", -apple-system, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;

  /* === Radii === */
  --radius-xs: 4px; --radius-sm: 6px; --radius-md: 8px;
  --radius-lg: 12px; --radius-xl: 16px; --radius-pill: 9999px;

  /* === Spacing (4px base) === */
  --space-xxs: 4px; --space-xs: 8px; --space-sm: 12px;
  --space-md: 16px; --space-lg: 24px; --space-xl: 32px;
  --space-xxl: 48px; --space-section: 96px;

  /* === Shadows (Claude: 极少用) === */
  --shadow-1: 0 1px 3px rgba(20, 20, 19, 0.08);
  --shadow-2: 0 8px 24px rgba(20, 20, 19, 0.12), 0 2px 6px rgba(20, 20, 19, 0.06);
}

[data-theme="dark"] {
  --canvas: #0d253d;          /* claude.ai 暗色 base */
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

### 3.2 Typography 层级(从 Claude DESIGN.md 翻译)

| Token | Size | Weight | Line Height | Letter Spacing | 用途 | 字体 |
|-------|------|--------|-------------|----------------|------|------|
| `display-xl` | 64px | 400 | 1.05 | -1.5px | 首页 h1 | Source Serif 4 |
| `display-lg` | 48px | 400 | 1.1 | -1px | 区段大标 | Source Serif 4 |
| `display-md` | 36px | 400 | 1.15 | -0.5px | 子区段、模型名 | Source Serif 4 |
| `display-sm` | 28px | 400 | 1.2 | -0.3px | pricing tier、callout | Source Serif 4 |
| `title-lg` | 22px | 500 | 1.3 | 0 | pricing plan | Inter |
| `title-md` | 18px | 500 | 1.4 | 0 | feature 标题 | Inter |
| `title-sm` | 16px | 500 | 1.4 | 0 | list 标签 | Inter |
| `body-md` | 16px | 400 | 1.55 | 0 | 默认正文 | Inter |
| `body-sm` | 14px | 400 | 1.55 | 0 | 页脚正文 | Inter |
| `caption` | 13px | 500 | 1.4 | 0 | 标签 | Inter |
| `caption-uppercase` | 12px | 500 | 1.4 | 1.5px | 全大写 eyebrow | Inter |
| `code` | 14px | 400 | 1.6 | 0 | 代码块 | JetBrains Mono |
| `button` | 14px | 500 | 1.0 | 0 | 按钮 | Inter |
| `nav-link` | 14px | 500 | 1.4 | 0 | 导航 | Inter |

> **衬线细体(400)是品牌签名**。display 层级永远 400,不要 bold。负字距(letter-spacing: -1.5px → -0.3px)不可妥协。
> **正文 humanist sans**(Inter 在没有 StyreneB 时是最佳替代)。永远不要用 Helvetica 或 Arial。

### 3.3 组件规范

| 组件 | 规格 | 现状对照 |
|------|------|----------|
| `button-primary` | bg=`--primary`, text=`--on-primary`, padding=`12px 20px`, height=`40px`, radius=`--radius-md`(8px) | 替换现有 `.btn-primary` 玻璃风 |
| `button-primary-active` | bg=`--primary-active`, text=`--on-primary` | press 状态 |
| `button-secondary` | bg=`--canvas`, text=`--ink`, 1px hairline 边框, 同 geometry | 替换现有 `.btn-secondary` |
| `button-secondary-on-dark` | bg=`--surface-dark-elevated`, text=`--on-dark` | 演讲者模式按钮 |
| `button-text-link` | transparent, text=`--ink` | "继续上次" 用 |
| `text-link` | transparent, text=`--primary`(coral), body-md 16px | 行内链接 |
| `top-nav` | bg=`--canvas`, height=`64px`, text=`--ink` | slides/presenter 顶部 |
| `hero-band` | bg=`--canvas`, padding=`--space-section`(96px), display-xl | index.html hero |
| `feature-card` | bg=`--surface-card`, padding=`32px`, radius=`--radius-lg`(12px), 无 shadow | 16 章卡片 |
| `product-mockup-card-dark` | bg=`--surface-dark`, text=`--on-dark`, padding=`32px`, radius=`--radius-lg` | 演讲者预览 / hero 右侧 |
| `code-window-card` | bg=`--surface-dark`, code=`--surface-dark-soft`, text=`--on-dark`, padding=`24px`, radius=`--radius-lg` | code slide / 产品 mockup |
| `model-comparison-card` | bg=`--canvas` + 1px hairline, padding=`32px`, radius=`--radius-lg` | 统计区 3 张卡 |
| `callout-card-coral` | bg=`--primary`, text=`--on-primary`, padding=`48px`, radius=`--radius-lg` | 学习进度 callout |
| `cta-band-coral` | bg=`--primary`, text=`--on-primary`, padding=`64px`, radius=`--radius-lg` | pre-footer CTA |
| `cta-band-dark` | bg=`--surface-dark`, text=`--on-dark`, padding=`64px` | 备选 pre-footer |
| `text-input` | bg=`--canvas`, text=`--ink`, padding=`10px 14px`, height=`40px`, radius=`--radius-md`(8px), 1px hairline | 搜索框 |
| `text-input-focused` | border 变 `--primary` + 3px coral-at-15%-alpha 外环 | 焦点态 |
| `badge-pill` | bg=`--surface-card`, text=`--ink`, caption 13px, radius=`--radius-pill` | 分类标签 |
| `badge-coral` | bg=`--primary`, text=`--on-primary`, caption-uppercase 12px +1.5px tracking, pill | "NEW" |
| `category-tab` / `-active` | transparent / `--surface-card` 底, padding=`8px 14px`, radius=`--radius-md` | 章节过滤 |
| `footer` | bg=`--surface-dark`, text=`--on-dark-soft`, padding=`64px` | 全站页脚 |

### 3.4 不动的事(避免越界)

- **9 个 slide renderer**(`js/slides/renderers/`):DOM 结构、虚拟化逻辑、行为
- **`js/core/`**:Storage / Utils / ContentParser / CodeHighlighter
- **`js/quiz/QuizSystem`**:行为逻辑,只改其视觉 token
- **章节内容数据**(`data/chapters.json` / `data/quiz-data.json`):内容本身
- **演讲者模式跨窗口逻辑**(`BroadcastChannel`):只改视觉
- **Canvas animation 行为**:`play/pause/step/speed` 控制,只改其配色

---

## 4. 三大入口页面的具体形态

### 4.1 [index.html](file:///workspace/index.html)(首页)

**Hero(`hero-band`)**:
- bg=`--canvas`(暖米)
- 6-6 网格:左 50% 内容 / 右 50% 视觉
- 左侧(1200px 容器内):
  - eyebrow `badge-coral` "AI AGENTS · 16 章"
  - H1 `display-xl 64px` "Meet your thinking partner for building Agents"(Source Serif 4 衬线 400, letter-spacing -1.5px)
  - 副标题 `body-md 16px` "16 章交互式学习 · 338 张幻灯片 · 20 个 Canvas 动画"
  - CTA 行:1 个 `button-primary` coral "开始学习" + 1 个 `button-text-link` "继续上次 →"
- 右侧:`product-mockup-card-dark` 深 navy 卡片,内部展示一段 agent 对话或 ReAct 循环代码
- 垂直 padding `96px`

**16 章卡片网格**:
- 3-up(desktop) / 2-up(tablet) / 1-up(mobile)
- 每张:`feature-card` 风格(bg=`--surface-card` 暖米、32px padding、12px 圆角、**无 shadow**)
- 内容:章号 eyebrow + `title-md 18px` 标题 + `body-sm 14px` 描述 + 学习状态 badge-pill
- section 上下 padding `96px`

**学习进度 callout**:
- 整宽 `callout-card-coral`,coral 填充 + white text
- 显示当前学习进度 + 1 个 `button-secondary`(cream 底) "继续学习"

**统计区(338/110/20)**:
- 3 张 `model-comparison-card` 风格(白底 + 1px hairline + 12px 圆角)
- 数字 `display-md 36px` **衬线 + 紧字距 -0.5px**
- 标签 `body-sm 14px` muted

**Pre-footer CTA**:
- `cta-band-coral` 风格(全宽 coral,64px padding,white text)
- H2 `display-sm 28px` 衬线 "开始构建你的第一个 Agent"
- 1 个 `button-secondary`(cream 底) "立即开始"

**Footer**:
- `footer` 风格(深 navy `#181715`,64px padding)
- 4 列:章节索引 / 学习资源 / 关于 / 法律
- 顶部 spike-mark + "Hello-Agents" 衬线 wordmark + `on-dark` 文字
- 底部版权行 `on-dark-soft` 文字

### 4.2 [slides.html](file:///workspace/index.html)(幻灯片播放器)

**不放 mesh**(阅读区,避免分散)。`body::before` 改为 `var(--canvas)` 实色。

**Top nav**:
- `top-nav` 风格(cream 底,64px 高,1px hairline 底边)
- 左:小型 spike-mark + "Hello-Agents" 衬线 logo
- 中:16 章快速切换下拉
- 右:进度文字、主题切换(D 键)、搜索图标(Ctrl+K)

**slide 容器**:
- bg=`--canvas`(暖米,继承页面)
- 内部 card:bg=`--canvas` + 1px `--hairline` 边框 + 12px 圆角
- 32px padding
- **不加 backdrop-filter**

**slide 类型视觉**:
- `cover`:cover 卡片用 `--surface-cream-strong` 底
- `content`:白底卡片,内部用 `feature-card` 风格排版
- `code`:**`code-window-card` 风格**(深 navy 底,JetBrains Mono,行号用 `--on-dark-soft`)
- `animation`:独立卡片,bg=`--canvas`,无 hairline,canvas 撑满
- `timeline`:横向时间线,里程碑用 `--primary` coral,年代用 `--muted`
- `flow`:流程图,主线 `--ink`,节点 `--primary` coral
- `concepts`:3-up 概念卡,`feature-card` 风格
- `comparison`:对比表,1px hairline 边框,header `--surface-cream-strong`
- `quiz`:`badge-pill` 题目类型,选项 `text-input` 风格(8px 圆角)

**TOC drawer(T 键)**:
- 左侧抽屉,bg=`--canvas`,1px hairline 右侧
- 章节标题 `title-sm 16px` Inter 500
- 当前章节用 `category-tab-active` 风格(--surface-card 底)

**搜索面板(Ctrl+K)**:
- 顶部居中,bg=`--canvas`,shadow-2,12px 圆角
- `text-input` 风格输入框(focus 时 coral 焦点环)
- 结果列表 `body-md`,group header `caption-uppercase` 全大写

**键盘帮助浮层**:
- 居中卡片,bg=`--canvas`,shadow-2
- 快捷键表格 `body-sm` Inter

### 4.3 [presenter.html](file:///workspace/index.html)(演讲者页)

**不放 mesh**。`body::before` 改为 `var(--canvas-soft)` 实色。

**计时器卡片**:
- `code-window-card` 风格(bg=`--surface-dark` 深 navy,JetBrains Mono)
- 大数字 `display-xl 64px` 衬线 + tabular + 紧字距 -1.5px
- 副信息 `body-md 16px` `on-dark` text,opacity 0.7

**下一页预览**:
- `product-mockup-card-dark` 风格
- 缩略至 30% 大小,保持 16:9 比例
- `body-sm` 标题 + 模糊内容预览

**演讲备注**:
- `feature-card` 风格(暖米)
- `body-md` 16px,行高 1.55

**控制按钮**:
- `button-secondary-on-dark` 风格(bg=`--surface-dark-elevated` + `on-dark` text)

---

## 5. 16 个 Canvas 动画的统一配色

### 5.1 改造方案

**核心原则**:所有动画从 `this.theme()` 工具读 token,仅使用 Claude 调色板定义的色值集合,无领域例外。

**允许的色值集合**:
- 中性:`--ink`、`--body-strong`、`--body`、`--muted`、`--muted-soft`
- 强调:`--primary`(coral)、`--accent-teal`、`--accent-amber`
- 暗色表面:`--surface-dark`、`--surface-dark-elevated`、`--surface-dark-soft`
- 状态:`--success`、`--warning`、`--error`
- 反色文字:`--on-primary`、`--on-dark`、`--on-dark-soft`

**禁止的色值**(替换为 Claude 调色板):
- ❌ `#06B6D4` cyan(→ `--accent-teal`)
- ❌ `#EC4899` pink(→ `--primary` coral)
- ❌ `#7C3AED` violet(→ `--primary` coral)
- ❌ `#10B981` emerald(→ `--success`)
- ❌ `#FBBF24` amber 自定义(→ `--accent-amber`)
- ❌ 任何非 token 直写的 hex

### 5.2 执行方式

**Step 1:扩展 `js/animations/canvas-animation.js` 基类**

新增 `theme()` 方法:
```js
theme() {
  const cs = getComputedStyle(document.documentElement);
  return {
    primary:        cs.getPropertyValue('--primary').trim()        || '#cc785c',
    primaryActive:  cs.getPropertyValue('--primary-active').trim()  || '#a9583e',
    ink:            cs.getPropertyValue('--ink').trim()            || '#141413',
    body:           cs.getPropertyValue('--body').trim()           || '#3d3d3a',
    muted:          cs.getPropertyValue('--muted').trim()          || '#6c6a64',
    mutedSoft:      cs.getPropertyValue('--muted-soft').trim()     || '#8e8b82',
    canvas:         cs.getPropertyValue('--canvas').trim()         || '#faf9f5',
    surfaceCard:    cs.getPropertyValue('--surface-card').trim()   || '#efe9de',
    surfaceDark:    cs.getPropertyValue('--surface-dark').trim()   || '#181715',
    surfaceDarkSoft:cs.getPropertyValue('--surface-dark-soft').trim()|| '#1f1e1b',
    accentTeal:     cs.getPropertyValue('--accent-teal').trim()    || '#5db8a6',
    accentAmber:    cs.getPropertyValue('--accent-amber').trim()   || '#e8a55a',
    hairline:       cs.getPropertyValue('--hairline').trim()       || '#e6dfd8',
    onDark:         cs.getPropertyValue('--on-dark').trim()        || '#faf9f5',
    onDarkSoft:     cs.getPropertyValue('--on-dark-soft').trim()   || '#a09d96',
    success:        cs.getPropertyValue('--success').trim()        || '#5db872',
    warning:        cs.getPropertyValue('--warning').trim()        || '#d4a017',
    error:          cs.getPropertyValue('--error').trim()          || '#c64545',
  };
}
```

**Step 2:监听 `data-theme` 变化**

基类 `_observeTheme()` 钩子,主题切换时调用 `this.render()`,自动重绘。

**Step 3:逐文件改写 `js/animations/ch*.js`**

把 `ctx.fillStyle = "#7C3AED"` 替换为 `ctx.fillStyle = this.theme().primary`。
把 `ctx.fillStyle = "#06B6D4"` 替换为 `ctx.fillStyle = this.theme().accentTeal`。

### 5.3 动画清单与统一映射(共 16 个)

| 文件 | 当前主色 | 目标主色(统一) | 领域语义处理 |
|------|----------|---------------|------------|
| ch1-agent-types.js | violet/cyan/pink | ink/muted/coral | 4 类 agent 用 ink/muted-soft/coral 区分,主分类用 ink |
| ch2-history-timeline.js | violet | primary(coral) + ink | 8 个里程碑节点用 coral,年代线用 ink,辅助线 muted |
| ch3-attention.js | red/yellow 自定义 | primary(coral)→accent-amber 渐变 | 热图梯度统一 coral→amber,无其他色 |
| ch4-react-loop.js | violet/cyan/pink | primary(coral) + ink + muted | Thought/Action/Observation 三态用 coral/ink/muted |
| ch5-lowcode.js | violet/pink | primary(coral) + ink | 占位提示用 coral + ink |
| ch6-frameworks.js | violet | primary(coral) + ink | 调用栈层级用 ink 不同明度 |
| ch7-framework.js | violet | primary(coral) + ink | 组件关系用 ink + coral 高亮当前 |
| ch8-memory.js | violet/cyan | primary(coral) + accent-teal | 记忆流用 ink 线条 + coral 节点 + teal 强调点 |
| ch9-context-window.js | violet/cyan | primary(coral) + ink | 上下文窗口用 ink 填充 + coral 边框 |
| ch10-protocol.js | violet/muted | primary(coral) + ink | 协议时序用 ink + coral 当前事件 |
| ch11-rl-feedback.js | violet/emerald | primary(coral) + success | 奖励信号正向 coral、负向 muted |
| ch12-radar.js | 6 维独立色 | ink 不同明度 + coral 高亮当前维 | 6 维用 ink→muted-soft 渐变,当前维用 coral |
| ch13-travel.js | violet/cyan | primary(coral) + accent-teal | 4 个 agent 用 ink/coral/teal/muted 区分 |
| ch14-task-tree.js | violet/muted | primary(coral) + ink | 任务树用 ink 线条 + coral 节点 |
| ch15-cybertown.js | violet/cyan/pink | primary(coral) + ink + accent-teal | 小镇网格用 ink 浅线 + coral/teal agent |
| ch16-capstone.js | violet | primary(coral) + ink | 占位提示同 ch5 |

**注**:ch5 和 ch16 是视频回退 Canvas,改色时需保留"占位提示"语义。

### 5.4 暗色模式行为

主题切换时,基类自动调用 `this.render()`。`--ink` 变为 cream、`--canvas` 变为 deep navy,所有动画自然适配:
- 浅色动画(深色线条在 cream 上)→ 暗色动画(浅色线条在 navy 上)
- coral CTA 在两种主题下都突出(对比度足够)
- 状态色 success/warning/error 在两种主题下都保持区分度

---

## 6. CSS 文件重写计划

### 6.1 [css/main.css](file:///workspace/css/main.css)(1560 行 → 预计 900-1000 行)

**改动**:
- 顶部注释从 "Style: Glassmorphism + Aurora Gradient" 改为 "Style: Claude-Inspired · warm editorial · cream + coral + serif"
- `:root` token 全部替换(第 3.1 节)
- `[data-theme="dark"]` token 全部替换为 claude.ai 暗色
- 移除所有 `backdrop-filter`、`rgba(*, *, *, 0.5*)` 玻璃效果
- `body::before` 改为 `var(--canvas)` 实色
- `box-shadow` 极少用(Claude 偏好 color-block 替代 shadow),仅保留 `--shadow-1` / `--shadow-2` 用于浮层
- `border-radius` 全部改用 `--radius-*` token
- 移除 `--gradient-aurora-*` 变量
- 字体从 Sora 600/800 改为 Source Serif 4 400 / Inter 400
- 移除 `@import url(Sora)`,改为 `@import url(Source Serif 4 + Inter)`

**新增**:
- `.display-xl/lg/md/sm` 排印工具类(全部用 Source Serif 4 衬线)
- `.hero-band` / `.feature-card` / `.product-mockup-card-dark` / `.code-window-card` 等组件类
- `.callout-card-coral` / `.cta-band-coral` 满版 coral 块
- `.badge-coral` / `.badge-pill` 标签

### 6.2 [css/slides.css](file:///workspace/css/slides.css)(1549 行 → 预计 850 行)

**改动**:
- 移除所有 glassmorphism 效果
- slide 容器改为 `--canvas` 暖米 + 1px hairline + 12px 圆角
- 9 种 slide type 的视觉 token 全部更新:
  - `code` slide 用 `code-window-card` 深 navy 风格
  - `comparison` slide 表格用 `model-comparison-card` 风格
  - `concepts` slide 用 `feature-card` 风格
- `animation-controls` 改用 flat + 8px 圆角 + hairline

### 6.3 [css/themes.css](file:///workspace/css/themes.css)(78 行 → 预计 60 行)

**改动**:
- `[data-theme="dark"]` 改用 claude.ai 暗色(deep navy base)
- `body::before` dark 模式加强改为深 navy 实色
- sticky-nav 玻璃感完全移除(按 Claude 风格)
- quiz 反馈区在 dark 模式保持高对比度

### 6.4 [css/a11y.css](file:///workspace/css/a11y.css)(83 行)

**改动**:
- `--focus-ring` 颜色从 violet 改 coral
- `:focus-visible` 焦点环改用 coral

### 6.5 [css/animations.css](file:///workspace/css/animations.css)(81 行)

**改动**:
- keyframe 中的颜色引用更新为 token
- 暗色模式适配

### 6.6 [css/print.css](file:///workspace/css/print.css)(18 行)

**改动**:基本不动。

---

## 7. 暗色主题设计(参考 claude.ai 实际暗色)

### 7.1 视觉叙事

**亮色**:暖米 canvas + coral CTA + 衬线大标题 + cream→dark 色块节奏
**暗色**:deep navy base(`#0d253d`)+ elevated surface(`#1c2a40`)+ card surface(`#1c1e54` 紫色调)+ cream text + coral CTA 保留

**关键洞察**:coral CTA 在暗色上反而更突出,无需调整。

### 7.2 token 切换表

| Token | Light | Dark |
|-------|-------|------|
| `--canvas` | `#faf9f5` | `#0d253d` |
| `--canvas-soft` | `#f5f0e8` | `#0a1929` |
| `--surface-card` | `#efe9de` | `#1c1e54` |
| `--surface-dark` | `#181715` | `#0a1929` |
| `--surface-dark-elevated` | `#252320` | `#1c2a40` |
| `--surface-dark-soft` | `#1f1e1b` | `#142235` |
| `--hairline` | `#e6dfd8` | `rgba(255,255,255,0.08)` |
| `--ink` | `#141413` | `#faf9f5` |
| `--body` | `#3d3d3a` | `#cbd5e1` |
| `--muted` | `#6c6a64` | `#94a3b8` |
| `--on-dark` | `#faf9f5` | `#faf9f5` |
| `--primary` | `#cc785c` | `#cc785c`(不变) |

---

## 8. 字体策略

### 8.1 决策

- **删除 Sora**(其 600/800 重感与 Claude editorial 调性冲突)
- **新增 Source Serif 4**(免费,Google Fonts):display 层级用,weight 400,负字距
- **保留 Inter**:body / nav / button / caption
- **保留 JetBrains Mono**:代码块

### 8.2 @import 更新

```css
/* 之前 */
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap');

/* 之后 */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Source+Serif+4:opsz,wght@8..60,400;8..60,500&display=swap');
```

### 8.3 视觉损失评估

| 项 | 之前(Sora 800) | 之后(Source Serif 4 400) | 损失/获得 |
|----|----------------|--------------------------|----------|
| Hero H1 视觉重量 | 重(工业感) | 轻(editorial 学术感) | 失去"重工业感",获得"文学教科书"感 |
| 章节卡标题 | 中 | 轻(serif) | 更加"严肃系统" |
| 整体可读性 | 高 | 高(衬线大字号 + 紧字距阅读距离足够) | 持平 |
| 品牌识别 | 自有特色 | 偏 Claude/editorial | 这是有意的 |

---

## 9. 测试 / 回归

### 9.1 自动化测试

跑 `npm test`(103 用例),定位:
- `tests/quiz/` 下的 quiz 视觉断言
- `tests/slides/` 下的 slide 渲染断言
- `tests/features/` 下的 search/TOC/presenter 断言

**类名保留**,所以大部分测试应该通过。**预计 ≤10 个**测试因颜色字面量断言失败,需更新。

### 9.2 手动回归清单

按顺序:
1. `python3 -m http.server 8080` 启动本地服务
2. 打开 `http://localhost:8080/`
3. 检查 index.html:暖米 hero、衬线大标题、coral CTA、章节卡 cream、统计卡、pre-footer coral callout、深 navy 页脚
4. 点击"开始学习" → 进入 slides.html
5. 走完第 1 章 20 张 slide
6. 特别验证 `code` slide 的深 navy 代码窗口可读性
7. 验证 Canvas 动画在暖米背景上的对比度(线条、节点、文字)
8. 测试快捷键:Ctrl+K(搜索)、T(TOC)、D(主题切换)、P(演讲者)、?(帮助)
9. 切换暗色主题,确认全站切换、16 个动画自动重绘
10. 打开演讲者模式,确认计时器卡片深 navy 衬线大字、tabular 数字
11. 触发打印预览(Ctrl+P),确认 print.css 生效
12. 回到 index.html,走完 16 章入口,确认每张卡 hover/focus 行为

### 9.3 性能基线

- 103 测试全部通过
- 首屏 LCP < 2.5s(纯静态,无 JS 框架,基本不会退化)
- 16 个动画在主题切换时 < 200ms 完成重绘

---

## 10. 风险与回退

### 10.1 主要风险

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| 字体替代视觉损失(Copernicus→Source Serif 4) | 100% | 中(预计 20-25% 质感损失) | 已确认接受;Source Serif 4 比 EB Garamond 更"学术" |
| 暖米 canvas 上 slide 可读性 | 中 | 中 | 米色 + ink 对比度 >12:1(WCAG AAA) |
| 16 个动画统一配色后领域语义丢失 | 中 | 中(已确认) | 用户接受此 trade-off;通过 token 命名补救语义 |
| 16 个动画在暖米背景上的对比度问题 | 中 | 中 | 每个动画 review + 暗色重绘测试 |
| 暗色模式 coral CTA 在 navy 上过亮 | 低 | 低 | 已知 claude.ai 也保留 coral,接受 |
| 现有深色背景动画(深 navy)与新暖米 canvas 视觉过渡 | 中 | 低 | 暗色动画继续用深 navy surface-card,与 canvas 形成 cream→dark 节奏 |
| 测试回归失败 >10 个 | 中 | 低 | 类名不动原则已规避大部分 |
| print.css 在新配色下渲染异常 | 低 | 低 | 打印模式独立测试 |

### 10.2 回退策略

- 所有变更按"**token → chrome → 动画**"分阶段提交
- 中间任何一步可独立 `git revert` 回退
- 备份原 `Sora` 字体引用(留作后续升级 Copernicus 路径)
- 备份 `body::before` aurora 实现(留作 dark mode 备选)

### 10.3 不入范围(YAGNI)

- **Copernicus / Tiempos 字体付费授权**(保持免费 Source Serif 4)
- **TypeScript 化**(保持纯 JS)
- **构建工具引入**(保持 0 依赖)
- **i18n / 用户账号**
- **多设备同步**

---

## 11. 文档输出与协作

### 11.1 输出文档

- 本 spec:`docs/superpowers/specs/2026-06-21-claude-inspired-redesign-design.md`
- 配套 `docs/DESIGN.md`:项目的 design source of truth(从 Claude DESIGN.md 摘录,加入我们的项目专属 token)
- 配套 `docs/ANIMATION-THEME-MAP.md`:16 个动画的"原色 → Claude token"映射表
- 旧 Stripe spec 标注 `**Status: deferred — superseded by Claude direction**` 保留备查

### 11.2 分支与协作节奏

**分支**:`feat/claude-inspired-redesign`(从 main `fc84b7d` 开,当前 HEAD 含 Stripe spec commit)
**main**:不动

**实施阶段**:
- 阶段 1:token + main.css 重写(预计 2 天)
- 阶段 2:chrome 重塑(index/slides/presenter 的非 slide 部分,预计 3 天)
- 阶段 3:16 个动画重画(预计 7-10 天)
- 阶段 4:暗色重设计 + 测试回归(预计 3 天)
- 阶段 5:文档收尾(预计 1 天)

每个 phase 结束,提交一次 commit 到 `feat/claude-inspired-redesign` 分支。

---

## 12. 成功标准

- [ ] `index.html` 视觉与 Claude editorial 调性对齐(暖米 + 衬线 + coral + cream→dark 节奏)
- [ ] 16 个 Canvas 动画在 light/dark 主题下都使用 Claude palette
- [ ] `npm test` 全部通过(允许 ≤10 个测试因颜色字面量断言更新)
- [ ] 三个 HTML 入口在 light/dark 主题下视觉都自洽
- [ ] Glassmorphism 完全移除
- [ ] 字体从 Sora 切到 Source Serif 4 + Inter
- [ ] 文档 `docs/DESIGN.md` + `docs/ANIMATION-THEME-MAP.md` 完成
- [ ] 0 运行时依赖保持
- [ ] GitHub Pages 可直接部署(无构建步骤)
- [ ] 暖米 canvas 上 16 章 slide 可读性验证通过

---

## 13. 下一步

本 spec 通过 review 后,调用 `writing-plans` 技能生成 5 阶段实施计划,然后进入实施。

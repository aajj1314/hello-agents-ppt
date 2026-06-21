# Stripe-Inspired 前端彻底重设计文档

> **Status: DEFERRED — superseded by 2026-06-21-claude-inspired-redesign-design.md**
>
> 保留此文档作为决策历史备查。不再实施。

> 设计主题:把 hello-agents-ppt 整体换皮为 Stripe 风格的设计语言(electric indigo + cream mesh + 细体字 + flat hairline),保留 0 运行时依赖、纯静态部署、103 测试通过的核心约束。
>
> 创建日期:2026-06-21
> 设计范围:CSS token 体系重写 · 三大 HTML 入口重塑 · 16 个 chapter Canvas 动画色值重映射(+ 2 个 video fallback 占位) · Glassmorphism 拆除 · 暗色主题重设计 · 字体从 Sora/Inter 切到 Inter 300
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

### 1.2 借用 awesome-design-md 的意图

[VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) 提供 74 个真实网站的 DESIGN.md 规范(colors/typography/rounded/spacing/components 全部结构化)。我们**只借用其格式与一个具体的语言**——Stripe,而不是其视觉。

借用的两件事:
- **结构**:colors / typography / rounded / spacing / components 五大 token 分类
- **语汇**:Stripe 那种"专业、克制、有细节"的金融基础设施调性,与 Hello-Agents 作为"系统性教程"的定位契合

不借用的事:
- **Sohne 字体**(付费,改用 Inter 300)
- **Composited Dashboard Mockup 签名组件**(我们没有 dashboard 场景)
- **Dashboard track 极性翻转**(我们是教学工具,不是产品 app)

### 1.3 设计目标

1. 视觉语言从"重玻璃 + 重渐变"切换为"细字 + flat + 1px hairline + cream 暖色 interlude"
2. 把 ~500 个硬编码 hex 收编到 token 体系
3. 暗色重设计为 Stripe Dashboard 风格(deep navy app shell),而非白底镜像
4. 103 个测试大部分不动;类名不动
5. 0 运行时依赖、纯静态部署的硬约束保留

---

## 2. 用户决策记录

| 决策项 | 选择 | 备注 |
|--------|------|------|
| 优化方向 | C 范围 | token + 20 动画 + 拆 Glassmorphism + 暗色重设计 |
| 设计参考 | Stripe DESIGN.md | 74 个候选里最低风险、最契合教学调性 |
| 字体策略 | Inter 300 替代 Sohne | 免费可商用,保留 ~80% 视觉 |
| Glassmorphism | 大部分拆除 | 保留 `.sticky-nav` / `.modal` 的 `backdrop-filter` |
| 暗色策略 | 重新设计为 deep navy app shell | 不沿用"白底镜像" |
| 渐变网底 | 仅 index.html 用 | slides/presenter 不用(避免分散阅读) |
| 类名 | 全部保留 | 减少测试断裂与组件耦合改动 |

---

## 3. 设计系统骨架

### 3.1 Token 体系(`css/main.css` 顶部 `:root`)

```css
:root {
  /* === Stripe colors (light) === */
  --ink: #0d253d;
  --ink-secondary: #273951;
  --ink-mute: #64748d;
  --primary: #533afd;          /* electric indigo - 唯一填充色 CTA */
  --primary-deep: #4434d4;
  --primary-press: #2e2b8c;
  --primary-soft: #665efd;
  --primary-subdued: #b9b9f9;
  --canvas: #ffffff;
  --canvas-soft: #f6f9fc;
  --canvas-cream: #f5e9d4;     /* 暖色 interlude */
  --hairline: #e3e8ee;
  --hairline-input: #a8c3de;
  --ruby: #ea2261;
  --magenta: #f96bee;
  --brand-dark-900: #1c1e54;   /* 演讲者计时卡片用 */

  /* === Stripe radii === */
  --radius-xs: 4px; --radius-sm: 6px; --radius-md: 8px;
  --radius-lg: 12px; --radius-xl: 16px; --radius-pill: 9999px;

  /* === Stripe spacing (8px base) === */
  --space-xxs: 2px; --space-xs: 4px; --space-sm: 8px;
  --space-md: 12px; --space-lg: 16px; --space-xl: 24px;
  --space-xxl: 32px; --space-huge: 64px;

  /* === Typography === */
  --font-display: "Inter", "Sohne", system-ui, -apple-system, sans-serif;
  --font-body: "Inter", "Sohne", system-ui, -apple-system, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;

  /* === Shadows (Stripe 两级) === */
  --shadow-1: 0 1px 3px rgba(0, 55, 112, 0.08);
  --shadow-2: 0 8px 24px rgba(0, 55, 112, 0.08), 0 2px 6px rgba(0, 55, 112, 0.04);
}

[data-theme="dark"] {
  --canvas: #0a1929;          /* deep navy app shell */
  --canvas-soft: #0d253d;
  --canvas-cream: #1c1e54;
  --ink: #f6f9fc;
  --ink-secondary: #cbd5e1;
  --ink-mute: #94a3b8;
  --hairline: rgba(255, 255, 255, 0.08);
  --primary-soft: #8a7dff;
}

body { font-feature-settings: "ss01", "tnum"; }
```

### 3.2 Typography 层级(从 Stripe DESIGN.md 翻译)

| Token | Size | Weight | Line Height | Letter Spacing | 用途 |
|-------|------|--------|-------------|----------------|------|
| `display-xxl` | 56px | 300 | 1.03 | -1.4px | Hero 标题 |
| `display-xl` | 48px | 300 | 1.15 | -0.96px | 区段大标 |
| `display-lg` | 32px | 300 | 1.1 | -0.64px | 卡片标题 |
| `display-md` | 26px | 300 | 1.12 | -0.26px | 紧凑卡片标题 |
| `heading-lg` | 22px | 300 | 1.1 | -0.22px | slide 标题 |
| `heading-md` | 20px | 300 | 1.4 | -0.2px | 子标题 |
| `body-lg` | 16px | 400 | 1.4 | 0 | UI 正文 |
| `body-md` | 15px | 300 | 1.4 | 0 | 默认正文 |
| `body-tabular` | 14px | 300 | 1.4 | -0.42px | 数字(tnum) |
| `button-md` | 16px | 400 | 1.0 | 0 | 按钮 |
| `caption` | 13px | 400 | 1.4 | -0.39px | 辅助文字 |
| `micro-cap` | 10px | 400 | 1.15 | 0.1px | 全大写 eyebrow |

> **负字距(negative letter-spacing)**是 Stripe 排印的核心签名。display 层级必须保留 `letter-spacing: -1.4px → -0.2px` 的负值。
> **细体(weight 300)**是品牌的"编辑感空气"。display 一律 300,bumping 到 400+ 失去品牌。

### 3.3 组件规范

| 组件 | 规格 | 现状对照 |
|------|------|----------|
| `button-primary-pill` | bg=`--primary`, text=`--on-primary`, padding=`8px 16px`, radius=`--radius-pill` | 替换现有 `.btn-primary` 的 glass 风 |
| `button-secondary` | bg=`--canvas`, text=`--primary`, 1px `--primary` 边框, pill 几何 | 替换现有 `.btn-secondary` |
| `button-on-dark` | bg=`--brand-dark-900`, text=`--on-primary`, pill | 演讲者计时器按钮用 |
| `card-feature-light` | bg=`--canvas`, padding=`--space-xxl`(32px), radius=`--radius-lg`(12px), 1px `--hairline` 边框, shadow-1 | 替换现有 `.chapter-card` 玻璃风 |
| `card-cream-band` | bg=`--canvas-cream`, text=`--ink`, padding=`32px`, radius=`--radius-lg` | 16 章章节卡用,作为暖色 interlude |
| `card-dashboard-mockup` | bg=`--canvas`, type=`body-tabular`(tnum), padding=`24px`, radius=`--radius-lg`, shadow-2 | 演讲者计时卡片用 |
| `text-input` | bg=`--canvas`, text=`--ink`, padding=`8px 12px`, radius=`--radius-sm`(6px), 1px `--hairline-input` | 搜索框用 |
| `nav-bar-on-mesh` | bg=`--canvas`, text=`--ink`, padding=`16px 24px` | slides.html 顶部导航 |
| `pill-tag-soft` | bg=`--primary-subdued`, text=`--primary-deep`, padding=`4px 8px`, radius=`--radius-pill` | 章节卡 eyebrow 用 |
| `gradient-mesh-hero` | 5 段渐变 cream→sherbet→lavender→indigo→ruby,横向,SVG 实现 | index.html hero 专用 |

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

**Hero 区**:
- 背景:`.gradient-mesh-hero`,5 段渐变(`#f5e9d4 cream` → `#fbcaa7 sherbet` → `#c8b5ff lavender` → `#533afd indigo` → `#ea2261 ruby`)水平延伸,SVG 实现有机 blob 形状而非纯 CSS 渐变
- 内容居中 ~1200px 容器
- H1:`display-xxl 56px` "Hello-Agents",letter-spacing `-1.4px`,weight 300
- 副标题:`body-lg 16px` "从零开始构建智能体的交互式学习"
- CTA:1 个 `button-primary-pill` "开始学习" + 1 个 `button-secondary` "继续上次"
- 1 个 `pill-tag-soft` "AI Agents · 16 章" eyebrow 在 H1 上方

**16 章卡片网格**:
- 用 `card-cream-band` 风格(暖色打破 indigo/white 节奏)
- 3 列网格(1024px+)、2 列(768-1023px)、1 列(<768px)
- 每张卡:H2 `display-md 26px` 章号 + 标题 + 描述 + 学习状态
- 间距:`--space-xxl`(32px)卡片间,`--space-huge`(64px)section padding

**统计区(338/110/20)**:
- 改用 `card-dashboard-mockup` 风格
- 数字用 `body-tabular` 14px + `tnum` 特性 + 紧字距
- 3 张并排卡片,白底 + 1px hairline + shadow-1

**页脚**:
- `footer-light` 风格:64px 上下 padding,4-6 列链接,版权信息

### 4.2 [slides.html](file:///workspace/index.html)(幻灯片播放器)

**不放 mesh**(阅读区,避免分散)。`body::before` 改为 `var(--canvas-soft)` 实色。

**顶部 nav**:
- `nav-bar-on-mesh` 风格:白底(`--canvas`)、1px `--hairline` 底边、16px 24px padding
- 左:Logo "Hello-Agents"
- 中:16 章快速切换下拉
- 右:进度文字、主题切换按钮(D 键)、搜索图标(Ctrl+K)

**slide 容器**:
- 白底 + 1px `--hairline` + 12px 圆角 + shadow-1
- 去掉所有 `backdrop-filter`
- 内部 padding 32px

**TOC drawer(T 键)**:
- 左侧抽屉,白底,1px hairline 右侧
- 章节用 `heading-sm` 18px + 紧字距
- 章节间分隔用 1px hairline

**搜索面板(Ctrl+K)**:
- 顶部居中,白底,shadow-2,12px 圆角
- `text-input` 风格输入框(6px 圆角,hairline-input 边框,focus 时变 `--primary`)
- 结果列表 `body-md 15px`,group header `micro-cap 10px` 全大写

**键盘帮助浮层**:
- 居中卡片,shadow-2
- 快捷键表格用 `body-tabular` 14px + tnum

### 4.3 [presenter.html](file:///workspace/index.html)(演讲者页)

**不放 mesh**。`body::before` 改为实色 `--canvas-soft`。

**计时器卡片**:
- `card-dashboard-mockup` 风格
- bg=`--brand-dark-900` deep navy,text=`--on-primary`
- 数字用 `display-xl 48px` weight 300 + `tnum` + 紧字距 `-0.96px`
- 副信息 `body-md 15px` opacity 0.7

**下一页预览**:
- `card-feature-light` 风格,白底,1px hairline,12px 圆角
- 缩略至 30% 大小,保持 16:9 比例

**控制按钮**:
- `button-on-dark` 风格(bg=`--brand-dark-900`,text=`--on-primary`)

---

## 5. 20 个 Canvas 动画的色值重映射

### 5.1 改造方案

**核心原则**:每个动画从 `this.theme()` 工具读 token,不再硬编码 hex。

**Step 1:扩展 `js/animations/canvas-animation.js` 基类**

新增 `theme()` 方法:
```js
theme() {
  const cs = getComputedStyle(document.documentElement);
  return {
    primary:    cs.getPropertyValue('--primary').trim()      || '#533afd',
    primarySoft:cs.getPropertyValue('--primary-soft').trim() || '#665efd',
    ink:        cs.getPropertyValue('--ink').trim()          || '#0d253d',
    inkMute:    cs.getPropertyValue('--ink-mute').trim()     || '#64748d',
    canvas:     cs.getPropertyValue('--canvas').trim()       || '#ffffff',
    canvasSoft: cs.getPropertyValue('--canvas-soft').trim()  || '#f6f9fc',
    hairline:   cs.getPropertyValue('--hairline').trim()     || '#e3e8ee',
    ruby:       cs.getPropertyValue('--ruby').trim()         || '#ea2261',
    canvasCream:cs.getPropertyValue('--canvas-cream').trim() || '#f5e9d4',
  };
}
```

**Step 2:监听 `data-theme` 变化**

基类增加 `_observeTheme()` 钩子,主题切换时调用 `this.render()`,自动重绘。

**Step 3:逐文件改写 `js/animations/ch*.js`**

把 `ctx.fillStyle = "#7C3AED"` 替换为 `ctx.fillStyle = this.theme().primary`。
把 `ctx.fillStyle = "#06B6D4"` 替换为 `ctx.fillStyle = this.theme().primarySoft`。

### 5.2 动画清单(共 20 个)

| 文件 | 当前硬编码 | 目标主色 | 领域语义色 | 备注 |
|------|-----------|----------|-----------|------|
| ch1-agent-types.js | 27 | primary/primarySoft | - | 智能体类型图 |
| ch2-history-timeline.js | 17 | primary/ink | ruby(milestone) | 时间线里程碑点缀 |
| ch3-attention.js | 9 | ruby/magenta | - | 注意力热图(红黄渐变) |
| ch4-react-loop.js | 54 | primary/inkMute | ruby(observation)/emerald(action) | ReAct 循环 |
| ch5-lowcode.js | 30 | primarySoft | - | Canvas 占位 |
| ch6-frameworks.js | 27 | primary | - | 框架调用栈 |
| ch7-framework.js | 24 | primary | - | 框架组件关系 |
| ch8-memory.js | 26 | primarySoft/ruby | - | 记忆流 |
| ch9-context-window.js | 29 | primary/ruby | - | 上下文窗口 |
| ch10-protocol.js | 21 | primary/inkMute | - | 协议时序图 |
| ch11-rl-feedback.js | 20 | primary | emerald/ruby | 奖励信号 |
| ch12-radar.js | 12 | primary/primarySoft | 6 维独立色 | 雷达图,允许独立色 |
| ch13-travel.js | 36 | primary/primarySoft | - | 多智能体协作 |
| ch14-task-tree.js | 31 | primary/inkMute | - | 任务树 |
| ch15-cybertown.js | 38 | primarySoft/ruby | - | 小镇网格 |
| ch16-capstone.js | 29 | primary | - | Canvas 占位 |
| ch5-video-fallback | - | - | - | 视频占位(非 Canvas) |
| ch16-video-fallback | - | - | - | 视频占位(非 Canvas) |

**注**:ch5 和 ch16 是视频回退 Canvas,改色时需保留"占位提示"语义。

### 5.3 领域语义色策略

**原则**:可以保留少数领域语义色(超过 6 个的需要登记),但**必须从 token 读**,不能野生成。

允许保留的语义色:
- `accent-warm` = `--ruby` 用于"错误/警告/热"
- `accent-cool` = `--primary-soft` 用于"提示/冷"
- `accent-success` = `#10b981`(从 main.css 现有 `--emerald-500` 沿用)用于"正确/成功"

登记位置:`css/main.css` 的 `:root` 注释区。

---

## 6. CSS 文件重写计划

### 6.1 [css/main.css](file:///workspace/css/main.css)(1560 行 → 预计 900-1000 行)

**改动**:
- 顶部注释从 "Style: Glassmorphism + Aurora Gradient" 改为 "Style: Stripe-Inspired · flat + hairline + cream mesh"
- `:root` token 全部替换(第 3.1 节)
- `[data-theme="dark"]` token 全部替换
- 移除所有 `backdrop-filter`、`rgba(*, *, *, 0.5*)` 玻璃效果
- `body::before` aurora 改为 SVG mesh 背景(仅 light 默认,index.html 专用)
- `box-shadow` 全部改为 `--shadow-1` / `--shadow-2`
- `border-radius` 全部改用 `--radius-*` token
- 移除 `--gradient-aurora-*` 变量
- 字体从 Sora 600/800 改为 Inter 300/400
- 移除 `@import url(Sora)`,只留 `@import url(Inter)`

**新增**:
- `.gradient-mesh-hero` 类(SVG mesh 背景)
- `.display-xxl/xl/lg/md` 排印工具类
- `.pill-tag-soft` 组件类

### 6.2 [css/slides.css](file:///workspace/css/slides.css)(1549 行 → 预计 900 行)

**改动**:
- 移除所有 glassmorphism 效果
- slide 容器改为白底 + 1px hairline + 12px 圆角
- 9 种 slide type 的视觉 token 全部更新
- `animation-controls` 改用 Stripe flat 风格
- 移除 cyan/pink/violet 引用,改用 primary/primarySoft

### 6.3 [css/themes.css](file:///workspace/css/themes.css)(78 行 → 预计 50 行)

**改动**:
- 移除 `.sticky-nav` 玻璃感(保留 backdrop-filter)
- `[data-theme="dark"]` 改用 deep navy
- `body::before` dark mode 加强改为深 navy 实色

### 6.4 [css/a11y.css](file:///workspace/css/a11y.css)(83 行)

**改动**:基本不动,只更新 `--focus-ring` 颜色从 violet 改 indigo。

### 6.5 [css/animations.css](file:///workspace/css/animations.css)(81 行)

**改动**:基本不动,只更新 keyframe 中的颜色引用。

### 6.6 [css/print.css](file:///workspace/css/print.css)(18 行)

**改动**:基本不动。

---

## 7. 暗色主题设计

### 7.1 视觉叙事

**亮色**:cream mesh hero + 白底 + 1px hairline + indigo CTA + 暖色 interlude
**暗色**:deep navy app shell(`#0a1929`)+ navy-elevated surface(`#0d253d`)+ indigo soft CTA(`#8a7dff`)+ 低对比 hairline(`rgba(255,255,255,0.08)`)

**不放 mesh**:`body::before` 在 dark 模式下改为深色径向渐变(stripe 风格),不沿用 5 段彩色 mesh。

### 7.2 token 切换表

| Token | Light | Dark |
|-------|-------|------|
| `--canvas` | `#ffffff` | `#0a1929` |
| `--canvas-soft` | `#f6f9fc` | `#0d253d` |
| `--canvas-cream` | `#f5e9d4` | `#1c1e54` |
| `--ink` | `#0d253d` | `#f6f9fc` |
| `--ink-secondary` | `#273951` | `#cbd5e1` |
| `--ink-mute` | `#64748d` | `#94a3b8` |
| `--hairline` | `#e3e8ee` | `rgba(255,255,255,0.08)` |
| `--primary` | `#533afd` | `#665efd` (亮一档) |
| `--primary-soft` | `#665efd` | `#8a7dff` |
| `--brand-dark-900` | `#1c1e54` | `#1c1e54`(不变) |

---

## 8. 字体策略

### 8.1 决策

- **删除 Sora**(其 600/800 重感是当前风格的核心,与 Stripe 细体调性冲突)
- **保留 Inter**,但:
  - display 层级改用 weight 300 + 紧字距
  - body 层级保持 400
- **保留 JetBrains Mono**(代码块用)

### 8.2 @import 简化

```css
/* 之前 */
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap');

/* 之后 */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
```

### 8.3 视觉损失评估

| 项 | 之前(Sora 800) | 之后(Inter 300) | 损失 |
|----|----------------|-----------------|------|
| Hero H1 视觉重量 | 重 | 轻(编辑感) | ~30% |
| 章节卡标题 | 中 | 轻 | ~20% |
| 整体可读性 | 高 | 高(细体大字阅读距离足够) | ~0% |
| 品牌识别 | 自有特色 | 偏 Stripe | 这是有意的 |

---

## 9. 测试 / 回归

### 9.1 自动化测试

跑 `npm test`(103 用例),定位:
- `tests/quiz/` 下的 quiz 视觉断言
- `tests/slides/` 下的 slide 渲染断言
- `tests/features/` 下的 search/TOC/presenter 断言

**类名保留**,所以大部分测试应该通过。**预计 5-10 个**测试因颜色字面量断言失败,需更新。

### 9.2 手动回归清单

按顺序:
1. `python3 -m http.server 8080` 启动本地服务
2. 打开 `http://localhost:8080/`
3. 检查 index.html:hero mesh 渲染、章节卡布局、统计卡、CTA 颜色
4. 点击"开始学习" → 进入 slides.html
5. 走完第 1 章 20 张 slide
6. 测试快捷键:Ctrl+K(搜索)、T(TOC)、D(主题切换)、P(演讲者)、?(帮助)
7. 切换暗色主题,确认全站切换、动画重绘
8. 打开演讲者模式,确认计时器卡片 deep navy 配色
9. 触发打印预览(Ctrl+P),确认 print.css 生效
10. 回到 index.html,走完 16 章入口,确认每张卡 hover/focus 行为

### 9.3 性能基线

- 103 测试全部通过
- 首屏 LCP < 2.5s(纯静态,无 JS 框架,基本不会退化)
- 16 个动画在主题切换时 < 200ms 完成重绘

---

## 10. 风险与回退

### 10.1 主要风险

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| 字体替代视觉损失(Sora→Inter 300) | 100% | 中(预计 20-30% 质感损失) | 已确认接受;后续可付费升级 Sohne |
| 20 个动画逐个重画有遗漏 | 中 | 中(动画会与 chrome 脱节) | 每个动画 review + 暗色模式重绘测试 |
| 测试回归失败 >10 个 | 中 | 低(可改断言) | 类名不动原则已规避大部分 |
| Glassmorphism 拆除后部分组件扁平感 | 低 | 低 | sticky-nav/modal 保留 backdrop-filter |
| 渐变 mesh SVG 性能 | 低 | 低 | 单页静态背景,无动画 |
| 暗色模式对比度不达标 | 中 | 高(A11y) | 手动 a11y 检查 + 对比度工具验证 |

### 10.2 回退策略

- 所有变更按"**token → chrome → 动画**"分阶段提交
- 中间任何一步可独立 `git revert` 回退
- 备份原 `Sora` 字体引用(留作后续升级 Sohne 路径)
- 备份 `body::before` aurora 实现(留作 dark mode 备选)

### 10.3 不入范围(YAGNI)

- **Sohne 字体付费授权**(保持免费 Inter)
- **TypeScript 化**(保持纯 JS)
- **构建工具引入**(保持 0 依赖)
- **i18n / 用户账号**
- **多设备同步**

---

## 11. 文档输出与协作

### 11.1 输出文档

- 本 spec:`docs/superpowers/specs/2026-06-21-stripe-inspired-redesign-design.md`
- 配套 `docs/DESIGN.md`:项目的 design source of truth(从 Stripe DESIGN.md 摘录,去除其品牌专属部分,加入我们的项目专属 token)
- 配套 `docs/ANIMATION-THEME-MAP.md`:20 个动画的"原色 → 新色"映射表

### 11.2 协作节奏

- 每个 phase 结束,提交一次 commit
- 阶段 1:token + main.css 重写(预计 2 天)
- 阶段 2:chrome 重塑(index/slides/presenter 的非 slide 部分,预计 3 天)
- 阶段 3:20 个动画重画(预计 7-10 天)
- 阶段 4:暗色重设计 + 测试回归(预计 3 天)
- 阶段 5:文档收尾(预计 1 天)

---

## 12. 成功标准

- [ ] `index.html` 视觉与 Stripe 调性对齐(electric indigo + cream mesh + 细体大标题)
- [ ] 16 个 Canvas 动画在 light/dark 主题下都使用 token 配色,与 chrome 一致
- [ ] `npm test` 全部通过(允许 ≤5 个测试因颜色字面量断言更新)
- [ ] 三个 HTML 入口在 light/dark 主题下视觉都自洽
- [ ] Glassmorphism 仅存在于 `.sticky-nav` / `.modal`
- [ ] 字体从 Sora 完全切换到 Inter
- [ ] 文档 `docs/DESIGN.md` + `docs/ANIMATION-THEME-MAP.md` 完成
- [ ] 0 运行时依赖保持
- [ ] GitHub Pages 可直接部署(无构建步骤)

---

## 13. 下一步

本 spec 通过 review 后,调用 `writing-plans` 技能生成 5 阶段实施计划,然后进入实施。

# Hello-Agents 交互式学习 PPT 全面优化设计

**日期**：2026-06-16
**作者**：Brainstorm 协作产出
**状态**：已批准设计，待生成实施计划

---

## 1. 背景与现状

`hello-agents-ppt` 是一个纯静态 HTML/CSS/JS 实现的交互式学习 PPT，对应原书《Hello-Agents》16 章内容。当前仓库经评审存在以下核心缺陷：

### 1.1 内容缺陷
- 原书 16 章，仅实现 6 章（ch1, ch4, ch7, ch8, ch10, ch13），ch2/ch3/ch5/ch6/ch9/ch11/ch12/ch14/ch15/ch16 全部缺失。
- 已实现章节为骨架版，每章 12-14 张 slide，相对原书一万字以上的内容是高度压缩的。
- `js/animations/ch1-agent-types.js:23` 文案 "世界模型，记录..." 缺右括号。

### 1.2 代码质量缺陷
- 缺少 `package.json` 与项目级 `README.md`。
- `js/slides.js`（642 行）单文件承担路由、9 种 slide 类型渲染、内容解析、代码高亮、动画挂载、事件绑定，违反单一职责。
- `slides.html` 用 `<script src>` 硬编码加载 6 个动画文件，无法仅通过数据驱动新增动画。
- 自实现 `highlightCode` 用正则做语法高亮，对嵌套字符串/注释不健壮。
- 全局污染：所有工具函数挂 `window`，动画用 `window.Animations`，无 ES Modules。
- `Storage.set` 每次写都全量 JSON.parse + serialize，写入开销随章节进度线性增长。

### 1.3 用户体验缺陷
- 无搜索、无章节内目录跳转。
- `js/quiz.js:148` 用 `q.answer.split('')` 解析多选答案；当选项 ID 非单字符时错乱。
- `js/quiz.js:71` 选项文本直接 innerHTML 拼接，未转义。
- 用 `alert()` 弹原生对话框，与 Neural Canvas 设计语言冲突。
- 缺 ESC 退出、PageUp/PageDown、演讲者模式 / 全屏。
- canvas 动画硬编码颜色（如 `#1F2937`），暗色主题切换不自适应。
- 测验完成后无错题回顾。

### 1.4 可访问性与性能缺陷
- 大量 `<div>` 当按钮，缺 `role`/`aria-label`/`tabindex`。
- canvas 动画无文字替代描述。
- 进度条无 `aria-valuenow`。
- 所有 slide 一次性 `innerHTML` 渲染到 DOM，章节变长后初次加载会卡顿。
- 6 个动画 JS 在 slides.html 无条件加载（即使只看 ch1）。
- 无任何测试。

---

## 2. 总体目标

将本仓库从"骨架版交互 PPT"升级为：
1. **完整教材**：16 章全覆盖，每章 20-30 张 slide + 5-8 道 quiz + 至少 1 个动画。
2. **可扩展架构**：ES Modules + 动画注册中心 + 视频接口约定，新增章节/动画零侵入 HTML。
3. **教学级体验**：搜索、目录侧边栏、错题本、演讲者模式、键盘导航完整化。
4. **生产级品质**：可访问性 ≥ AA、移动端可用、可导出 PDF、Lighthouse ≥ 90。

技术栈不变：纯静态 HTML/CSS/JS，零构建、零依赖。仅以 ES Modules 取代全局污染。

**运行方式约束（重要）**：本项目**必须通过本地 HTTP 服务器运行**（如 `python3 -m http.server`），不能双击 `index.html` 用 `file://` 协议打开。原因：
- 当前代码已用 `fetch('data/chapters.json')` 加载数据，`fetch()` 在 `file://` 下被 CORS 拦截（即现状下双击打开已是白屏）。
- ES Modules（`<script type="module">`）在 `file://` 下同样被浏览器 CORS 策略拦截。
- 视频动画存在性判断也依赖 HTTP。

因此 README 与所有验收标准均以"本地 HTTP 服务器"为前提，不再承诺"双击即开"。

---

## 3. 实施阶段总览

按"架构 → 内容 → 体验 → 完善"顺序，分四个独立可交付阶段：

| 阶段 | 主题 | 可单独交付 |
|---|---|---|
| 1 | 架构地基 + Bug 修复 + 视频动画接口 | ✓ 与现有功能等价的干净架构版 |
| 2 | 补齐 10 章内容 + 8 个新 Canvas 动画 + 视频占位 | ✓ 16 章完整教材版 |
| 3 | 搜索 / 目录 / 错题本 / 演讲者模式 / 键盘导航 | ✓ 教学级演示工具 |
| 4 | A11y / 响应式 / PDF 导出 / 性能 | ✓ 生产级版本 |

每阶段完成后即可独立提交并停止，项目都不会处于半成品坏掉状态。阶段之间有依赖（详见各阶段"前置依赖"），必须按序执行。

---

## 4. 阶段一：架构地基

### 4.1 目标
在不改变任何用户可见功能的前提下，把"全局污染 + 单文件 642 行 + 硬编码动画"重构为可扩展的 ES Modules 架构，并修复所有已识别紧急 Bug，建立视频动画接口约定。

### 4.2 目标目录结构

```
hello-agents-ppt/
├── index.html                       入口（只引一个 module）
├── slides.html                      入口（只引一个 module）
├── assets/
│   └── animations/                  视频动画约定目录
│       ├── ch1/                     ch1/agent-types.mp4
│       ├── ch2/...                  使用者放对应文件名即生效
│       └── README.md                命名约定说明
├── css/                             保持，按需拆分一次 main.css
├── data/
│   ├── chapters.json                扩展：每章 video/canvas/none 元数据
│   ├── quiz-data.json
│   └── source/                      新增：从原始文档抽取的 markdown
├── js/
│   ├── main.js                      index.html 入口
│   ├── slides-main.js               slides.html 入口
│   ├── core/
│   │   ├── storage.js               命名导出
│   │   ├── utils.js                 DOM 助手 / debounce / throttle
│   │   ├── content-parser.js        从 slides.js 抽出
│   │   └── code-highlighter.js      从 slides.js 抽出 + 修复 bug
│   ├── slides/
│   │   ├── slide-engine.js          路由 + 生命周期，<200 行
│   │   ├── slide-router.js          类型 → renderer 注册表
│   │   └── renderers/
│   │       ├── cover.js
│   │       ├── content.js
│   │       ├── code.js
│   │       ├── quiz.js
│   │       ├── animation.js
│   │       ├── timeline.js
│   │       ├── flow.js
│   │       ├── concepts.js
│   │       └── comparison.js
│   ├── animations/
│   │   ├── animation-registry.js    注册中心
│   │   ├── canvas-animation.js      基类：resize / dpr / dark-theme
│   │   ├── video-animation.js       视频回退
│   │   └── ch{n}-{name}.js          各章动画
│   ├── quiz/
│   │   └── quiz-system.js
│   ├── app.js                       首页逻辑
│   └── theme.js                     主题切换
├── docs/
│   ├── README.md                    使用与开发指南
│   ├── ARCHITECTURE.md              架构图（mermaid）
│   ├── ANIMATION-GUIDE.md           如何添加动画/视频
│   └── superpowers/specs/           本设计文档所在
└── tests/                           占位（阶段 4 启用）
```

### 4.3 关键架构决策

#### 4.3.1 动画注册中心

```js
// js/animations/animation-registry.js
export const AnimationRegistry = new Map();
export function registerAnimation(id, factory) {
    AnimationRegistry.set(id, factory);
}
export function getAnimation(id) {
    return AnimationRegistry.get(id);
}
```

每个动画文件自注册：
```js
// js/animations/ch1-agent-types.js
import { CanvasAnimation } from './canvas-animation.js';
import { registerAnimation } from './animation-registry.js';
class Ch1AgentTypes extends CanvasAnimation { /* ... */ }
registerAnimation('ch1-agent-types', () => new Ch1AgentTypes());
```

#### 4.3.2 视频接口约定

为避免脆弱的主动探测（每张动画 slide 发 HEAD 请求会有延迟、在 `file://` 下失败、404 刷红 console），采用**显式声明 + onerror 回退**策略：

`renderers/animation.js` 渲染流程：
1. 读取 `slide.media.video`（如 `ch3/transformer.mp4`）。若未声明则跳到第 4 步。
2. 直接渲染 `<video src="assets/animations/ch3/transformer.mp4">`，不主动探测存在性。
3. 监听 `<video onerror>`：加载失败（文件不存在）时，按 `canvasFallback` 决定是否回退到第 4 步。
4. 查 `AnimationRegistry`，存在对应 id 则用 Canvas 动画。
5. 都没有 → 占位提示"动画建设中，可在 `assets/animations/<chapter>/<name>.mp4` 放置视频启用"。

约定：`media.video` 字段的存在即表示"作者打算用视频"；是否真的有文件由 `onerror` 在运行时决定。使用者放入 mp4 即生效，删除则自动回退 Canvas。

`chapters.json` 新增字段（向后兼容，旧字段不变）：
```json
{ "type": "animation", "title": "...", "animation": "ch3-transformer",
  "media": { "video": "ch3/transformer.mp4", "canvasFallback": true },
  "speakerNotes": "讲到这里强调 Q/K/V 的三角关系" }
```

#### 4.3.3 CanvasAnimation 基类

把所有动画里重复的 `_resize` / dpr / `_isDarkTheme` / `_roundRect` / `_wrapText` 上提到基类。子类只实现 `init / draw / play / step / reset / setSpeed`。基类用 `MutationObserver` 监听 `data-theme` 切换自动重绘，修当前的"暗色不适配"问题。

#### 4.3.4 Storage 内存缓存

```js
class Storage {
    static _cache = null;
    static get() {
        if (!this._cache) this._cache = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        return this._cache;
    }
    static set(data) {
        this._cache = data;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
}
// 关键：跨窗口缓存失效。演讲者模式用 window.open 开第二窗口共享同一 localStorage，
// 必须监听 storage 事件让缓存失效，否则副窗口读到的是过期 _cache，导致进度 desync。
window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) Storage._cache = null;
});
```

注意：`storage` 事件只在**其他**窗口写入时触发，本窗口写入不触发，因此本窗口靠 `set()` 主动更新 `_cache`、其他窗口靠事件失效，两端都能拿到最新值。

### 4.4 紧急 Bug 修复清单

| 位置 | 问题 | 修复 |
|---|---|---|
| `js/animations/ch1-agent-types.js:23` | 错别字 "世界模型，记录..." 缺右括号 | 补 ）|
| `js/quiz.js:148` | `q.answer.split('')` 仅支持单字符选项 ID | 接受 `q.answer` 既可数组也可字符串 |
| `js/quiz.js:71` | 选项 text 未转义 | 用 `escapeHTML(opt.text)` |
| 各 canvas 动画 | 硬编码颜色不随主题变 | 抽到 CSS variables / 基类里读 `getComputedStyle` |
| `js/storage.js` | 每次 set 都 JSON.parse + serialize 全量 | 加内存缓存层 |

### 4.5 验收标准

- 用户视角功能完全等价：6 章正常浏览、6 个动画都正常、quiz 正常、暗色切换正常。
- `slides.html` 只 import 一个 module。
- `slide-engine.js` 职责单一：只做路由分发与生命周期管理，不含具体渲染/解析/高亮逻辑（这些已拆到独立模块）。
- 新增动画或新增章节只需改 data/JSON + 加一个 renderer/animation 文件，不需要改 HTML。
- README 写明：用 `python3 -m http.server` 启动后访问 `http://localhost:8000`（不支持双击 `file://` 打开，原因见 §2）。

---

## 5. 阶段二：内容补全

### 5.1 目标
按"详尽型"标准补齐 10 章缺失内容，使 16 章皆可作为完整教材。每章需 20-30 张 slide + 5-8 道 quiz + 至少 1 个动画。

**前置依赖**：必须在阶段一完成后进行——依赖 AnimationRegistry、CanvasAnimation 基类、chapters.json 扩展 schema。否则每加一章都要在旧架构上返工。

### 5.2 章节规划

| 章 | 标题 | slide 数 | 核心内容 | 动画方案 |
|---|---|---|---|---|
| ch2 | 智能体发展史 | ~22 | 符号主义→连接主义→深度学习→LLM-Agent；图灵测试、ELIZA、AlphaGo、AutoGPT 等里程碑 | Canvas：交互式时间线（点击节点看详情） |
| ch3 | 大语言模型基础 | ~28 | Transformer / 注意力机制 / 主流 LLM / 提示工程 / 局限性 | Canvas：注意力权重热图 + token-by-token 生成动画 |
| ch5 | 低代码平台搭建 | ~20 | Coze / Dify / FastGPT 对比、可视化编排、知识库接入 | 视频占位（产品截屏更直观） |
| ch6 | 框架开发实践 | ~22 | LangChain / LlamaIndex / AutoGen / CrewAI 横评 | Canvas：框架调用栈对比图 |
| ch9 | 上下文工程 | ~24 | 上下文窗口 / 长上下文压缩 / 滑动窗口 / 摘要策略 | Canvas：上下文窗口可视化（token 流入流出） |
| ch11 | Agentic-RL | ~26 | SFT / RLHF / DPO / GRPO / 工具学习 | Canvas：奖励信号反馈环（Policy↔Reward） |
| ch12 | 性能评估 | ~22 | 准确率 / 鲁棒性 / 工具调用率 / 基准（AgentBench, GAIA） | Canvas：六维评估雷达图（可拖动权重） |
| ch13 | （已有）智能旅行助手 | 增补到 25 | 多 Agent 架构、MCP 接入、协作流程 | 现有 + 增强 |
| ch14 | DeepResearch | ~24 | 任务分解 / 并行检索 / 报告生成 / 引用追溯 | Canvas：任务树展开动画（递归分解） |
| ch15 | 赛博小镇 | ~22 | Generative Agents / 记忆-反思-规划 / 社交模拟 | Canvas：小镇网格 + Agent 移动 + 关系图 |
| ch16 | 毕业设计 | ~20 | 项目模板 / 评估标准 / 案例分析 | 静态图 + 视频占位 |

合计新增约 230 张 slide + 60 道题 + 8 个新 Canvas 动画 + 多个视频占位。

### 5.3 内容生产工作流

对每一章：
1. 从 `原始文档/Hello-Agents.html` 抽取该章正文（按 `class="chapter-title"` 切片到 `data/source/ch{n}.md`）。
2. 按结构化模板填入 `chapters.json`：
   封面 → 引入(为什么) → 核心定义 → 子概念分页 → 案例 → 代码 → 对比/时间线 → 动画 → 小结 → quiz。
3. 编写对应动画（按上表）注册到 `AnimationRegistry`。
4. 在 `quiz-data.json` 添加 5-8 道题。
5. **技术准确性 QA（关键）**：对照 `data/source/ch{n}.md` 逐条核对该章所有技术陈述——概念定义、代码可运行性、quiz 答案与解析、术语英文。AI 生成 230 张技术 slide 最大的风险是细节错误（讲错 GRPO、标错注意力机制等），此步独立于"翻一遍能看"，必须显式做。
6. 验证：手动翻完该章 + 做完 quiz + 确认动画亮/暗主题正常。

### 5.4 chapters.json schema 扩展

```json
{
  "id": "ch3",
  "title": "大语言模型基础",
  "subtitle": "Transformer、提示工程与主流模型",
  "icon": "🧠",
  "estimatedMinutes": 35,
  "tags": ["LLM", "Transformer", "基础"],
  "slides": [
    { "type": "animation", "title": "...", "animation": "ch3-attention",
      "media": { "video": "ch3/attention.mp4", "canvasFallback": true },
      "speakerNotes": "讲到这里强调 Q/K/V 的三角关系" }
  ],
  "hasAnimation": true,
  "hasQuiz": true
}
```

新增字段（`estimatedMinutes` / `tags` / `media` / `speakerNotes`）均为可选，不破坏旧 6 章。

### 5.5 内容质量基线

每章必须满足：
- 至少 1 张代码 slide（Python，紧贴章节主题）。
- 至少 1 张对比/表格 slide。
- 小结 slide 4-6 条要点。
- quiz 题目要有真实迷惑项，而非显然错误的填充选项。
- 中文术语首次出现配上英文原文。
- 引用原书图表时标注"参考 Hello-Agents 第 X 章"。

### 5.6 验收标准

- 16 章全部出现在首页且 slide 数全 ≥ 20。
- 每章 quiz 题数 ≥ 5。
- 每章已完成技术准确性 QA（对照 source 核对，无概念/代码/答案错误）。
- 所有 Canvas 动画在亮/暗主题下都正确显示。
- 视频占位章节有清晰的"放入 mp4 即可启用"提示。
- "开始学习"按钮可顺序通读 16 章。

---

## 6. 阶段三：体验增强

### 6.1 全局搜索（Ctrl/Cmd + K）

- 范围：所有 chapters.json 的 title/subtitle/slides[].title/slides[].content + quiz-data.json 的 question。
- 索引：首次打开时建立内存索引（Map<token, slideRef[]>），无后端依赖。
- 匹配：忽略大小写、中英混合、子串匹配，结果带高亮。
- 跳转：点击结果 → `slides.html?chapter=chX&slide=N`。
  - **注意**：`SlideEngine.init()` 当前只读 `?chapter=`，需扩展为同时读 `?slide=`，命中后跳过"恢复上次进度"逻辑直接跳到指定 slide。这条对阶段三搜索功能是硬性依赖，必须在阶段一就修。
- 快捷键：↑/↓ 选择，Enter 跳转，Esc 关闭。
- UI：居中浮层 + 搜索框 + 按章分组结果。
- 实现：`js/features/search.js`，挂载到所有页面。索引 lazy build（首次打开搜索时再建）。

### 6.2 章节内目录侧边栏

- 位置：`slides.html` 左侧抽屉，默认收起；按 T 或点 ☰ 展开。
- 内容：当前章所有 slide 的 type-icon + 标题 + 当前页高亮。
- 点击：跳到该 slide。
- 实现：`js/features/toc-sidebar.js`，订阅 `SlideEngine.currentIndex`。

### 6.3 错题本

- 触发：quiz 答完自动记录错题到 Storage。
- 存储：`state.wrongAnswers = { chapterId: [{questionId, userAnswer, correctAnswer, ts}] }`。
- 入口：
  - 首页新增"错题回顾"按钮（仅在有错题时显示，带数字徽标）。
  - 章节卡片右下角显示"X 道错题"。
- 回顾页：复用 `QuizSystem`，过滤为只显示错题；答对则从错题本移除。
- 重置：与"重置进度"按钮同步清空。
- 实现：扩展 `Storage` 加 `addWrongAnswer / getWrongAnswers / clearWrong`，新增 `js/features/review.js`。

### 6.4 演讲者模式

- 触发：专用"演讲者模式"按钮，或键盘 `P` 键进入 / Esc 退出。**不使用 F5**（F5 是浏览器刷新键，劫持它要么失效要么误触发刷新丢状态），也不使用 F11（系统接管）。
- 双屏方案：`window.open` 打开第二窗口 + `BroadcastChannel` 同步状态。
  - 主窗口（投影仪）：全屏当前 slide。
  - 副窗口（讲者本机）：当前 slide + 计时器 + speakerNotes + 下一页缩略图。
  - 进度同步依赖 §4.3.4 的跨窗口缓存失效（两窗口通过 BroadcastChannel 传当前页码，通过 storage 事件失效 Storage 缓存）。
- 单屏退化：下方 PiP 模式（计时器 + 备注 + 下一页缩略图浮于角落）。
- 辅助键：B = 黑屏，W = 白屏，数字+Enter = 跳页。
- 实现：`js/features/presenter-mode.js` + `css/presenter.css`。speakerNotes 来自 chapters.json 的 `speakerNotes` 字段，缺省时回退为 slide.title。

### 6.5 键盘导航完整化

全局：
- Ctrl/Cmd+K 搜索
- ? 打开快捷键帮助浮层
- T 切换章节目录抽屉
- D 切换暗色主题

slides.html：
- ←/→/PgUp/PgDn 翻页
- Home/End 首页/末页
- 数字+Enter 跳到第 N 页
- P 演讲者模式
- Esc 退出演讲者模式 / 关闭抽屉
- B/W 黑屏/白屏（演讲者模式）

### 6.6 验收标准

- Ctrl+K 能在 < 100ms 出搜索结果。
- 章节抽屉在 < 480px 屏幕自动变为 bottom sheet。
- 错题本能正确累积、回顾、清理。
- 演讲者模式在 1080p 投影仪 + 笔记本双屏下可用，单屏可退化。
- 所有快捷键不与浏览器/IME 冲突。
- 帮助浮层可在任何页面通过 ? 唤起。

---

## 7. 阶段四：可访问性 / 响应式 / 导出

### 7.1 可访问性 (A11y)

**语义化重构**
- 所有装饰性 `<div>` 按钮 → `<button type="button">`。
- quiz 选项 `<label>` 包 `<input>` + `aria-checked` 反映选中态。
- canvas 动画外层 `role="img"` + `aria-label="<动画描述>"`，每个动画提供文本备选。
- 进度条 `role="progressbar"` + `aria-valuenow/min/max`。
- 章节卡片改为 `<a href>`。
- 主标题层级修正：每个 slide 内只能有一个 h1（封面），其余 h2/h3。

**焦点管理**
- 翻页后焦点自动移到 `slide-content[aria-current]`。
- 演讲者模式 / 抽屉 / 搜索浮层 focus trap，Esc 关闭后焦点回到触发元素。
- 全局 `:focus-visible` 焦点环（深紫 outline）。

**色彩对比**
- axe DevTools 扫描，把所有 < AA 的配色调整。
- 重点：`text-muted` 在浅色背景 ≥ 4.5、quiz 选项已选中边框对比。

**屏幕阅读器测试**
- 用 NVDA / VoiceOver 走：首页 → ch1 → 翻 3 页 → 做 quiz。

### 7.2 响应式 / 移动端

断点策略：
```
≥1280px  完整布局，侧边栏固定可见
1024-1279 侧边栏抽屉化
768-1023  导航栏简化，章节卡片 2 列
480-767   单列，底部导航固定，演讲者模式禁用
<480px    字号下调，触摸目标 ≥44px
```

关键修复：
- canvas 动画在 < 768 时高度 420 → 320。
- slide-flow / slide-concepts 网格 → 移动端单列。
- 顶部导航在小屏折叠为汉堡菜单。
- 触摸滑动翻页增加视觉反馈。
- `.comparison-table` 加 `overflow-x: auto` 容器。

字号系统统一为 `clamp()`：
```css
h1 { font-size: clamp(1.75rem, 4vw, 2.5rem); }
```

### 7.3 打印 / 导出 PDF

策略：浏览器原生 `window.print()` + 专门 `@media print` 样式，不引入 jsPDF。

```css
@media print {
  /* 所有 slide 同时显示，每个 break-inside: avoid */
  /* 隐藏导航栏、侧边栏、按钮、quiz 提交按钮 */
  /* canvas → 截图为 dataURL 嵌入 <img>（打印前 toDataURL 替换）*/
  /* quiz 选项展开显示正确答案与解析 */
  /* 页眉页脚：章节标题 + 页码 */
  /* 配色降为打印友好：深色文本 + 白色背景 */
}
```

入口：
- 章节内导航栏 "📄 导出 PDF" 按钮 → `window.print()`。
- 提示："使用浏览器另存为 PDF 即可获得本章 PDF"。
- 首页 "导出全书 PDF"：临时构造 print-all.html 串联 16 章 → 一键打印。

**与 §7.4 虚拟化的桥接**：虚拟化只渲染当前 ±1 张，DOM 里其他 slide 不存在，打印 PDF 会只有 3 张。

桥接方案：`SlideEngine` 暴露 `renderAllForPrint()` 方法，
- 调用前临时禁用虚拟化，挂一个 `.print-mode` class 到 `<body>`。
- 在 `print-mode` 下渲染所有 slide（用 `DocumentFragment` 一次性插入，不触发 N 次 reflow）。
- canvas 元素在插入后立刻 `toDataURL` 抓成 PNG，把 `<canvas>` 替换为 `<img src="data:image/png;...">`，保证打印静态化。
- 触发 `window.print()`，监听 `afterprint` 事件还原：移除 `.print-mode`、重新挂回虚拟化（只保留当前 ±1 张）、恢复 canvas。
- 用户按"取消"打印时也走 `afterprint` 清理路径，避免 DOM 残留。

`@media print` 配合：让 `.print-mode` 下隐藏的所有 chrome（导航、按钮）保持隐藏；普通模式下不被影响。

### 7.4 性能优化

- slide 渲染从"全部 innerHTML"改为虚拟化：只渲染当前 ± 1 张。**注：与 §7.3 打印互斥，已在 §7.3 用 `.print-mode` 桥接**。
- canvas 动画 lazy mount：进入该 slide 才 init，离开 destroy。
- 视频动画 `<video preload="none">`，进入 slide 才 load。
- 章节级懒加载：首页只加载 metadata，进入章节才加载该章 slides（如果 chapters.json 单文件超 100KB）。

### 7.5 验收标准

- axe-core 扫描无 critical/serious 违规。
- 键盘 Tab 走完首页 + 1 章无焦点黑洞。
- iPhone SE (375×667) 下可正常学习一章。
- 单章导出 PDF 在 Chrome / Edge / Firefox 都能产出可用 PDF。
- 打印 PDF 中代码块保持高亮、quiz 显示答案、动画显示静态截图。
- Lighthouse Performance ≥ 90，Accessibility ≥ 95。

---

## 8. 风险与缓解

| 风险 | 影响 | 缓解 |
|---|---|---|
| 内容准确性（AI 生成 230 张技术 slide 细节错误） | 阶段二质量失败 | 阶段二工作流 §5.3 第 5 步显式做"技术准确性 QA"（对照 source 逐条核对概念/代码/答案） |
| 8 个新 Canvas 动画工作量大 | 阶段二延期 | 统一基类后单动画 200-300 行，集中在原型阶段并行编写 |
| 双屏演讲者模式浏览器兼容性 | 跨浏览器失效 | `window.open` + `BroadcastChannel` 跨浏览器稳定，单屏可退化 |
| 搜索索引体积 | 首屏慢 | Lazy build，首次打开搜索时再建 |
| canvas 截图暗色错位 | PDF 颜色错 | 打印前强制切回浅色（`document.documentElement.setAttribute('data-theme', 'light')`） |
| 全书 PDF 体积过大 | 用户难下载 | 提供"分章下载 ZIP"备选 |
| 虚拟化与打印冲突 | 打印只出 3 张 | §7.3 桥接：`renderAllForPrint()` 临时挂 `.print-mode` 全量渲染，afterprint 还原 |

---

## 9. 验收门槛（端到端）

阶段一交付：
- 用户视角完全等价；`slide-engine.js` 职责单一（仅路由 + 生命周期，不含具体渲染逻辑）；新增动画零 HTML 改动。

阶段二交付：
- 16 章完整；每章 ≥ 20 slide / ≥ 5 quiz；动画亮/暗主题正确。

阶段三交付：
- Ctrl+K 搜索 < 100ms；演讲者模式可用；错题本闭环；? 帮助浮层可用。

阶段四交付：
- axe 无 critical 违规；iPhone SE 可用；PDF 三浏览器可导出且**包含全部 slide**（虚拟化桥接正确工作）；Lighthouse Perf ≥ 90、A11y ≥ 95。

---

## 10. 不在本设计范围内（YAGNI）

明确不做：
- TypeScript 化（保持 ES Modules + JSDoc 即可）。
- 引入 React/Vue 等框架。
- 后端服务（搜索/进度均在浏览器本地完成）。
- 用户账号 / 多设备同步（localStorage 足够）。
- 自动化 PDF 服务端生成（浏览器打印足够）。
- 国际化 i18n（产品定位是中文教学，UI 文案量小且为辅，逐处手动改即可；前期抽 i18n 是过度设计）。
- 实时协作 / 评论系统。

---

## 11. 后续步骤

本设计批准后，进入 `writing-plans` 阶段，将四个实施阶段拆解为粒度更细、可逐步执行的实施计划（plan），随后才进入实际编码。

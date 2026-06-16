# Hello-Agents 交互式学习 PPT

> 基于 **[Datawhale Hello-Agents](https://github.com/datawhalechina/hello-agents)** 开源教程构建的纯前端交互式学习平台。16 章、338 张幻灯片、20 个 Canvas 动画、110 道测验题，零运行时依赖。

## 关于本项目

[Hello-Agents](https://github.com/datawhalechina/hello-agents) 是 Datawhale 社区出品的《从零开始构建智能体》开源教程，系统讲解 LLM Agent 的原理、框架与实战。本项目将其 16 章核心内容转化为浏览器端的交互式 HTML 演示，兼顾课堂教学与个人自学场景。

### 与原始教程的关系

- **内容来源**：16 章内容均来自 [Hello-Agents 教程](https://github.com/datawhalechina/hello-agents)，每章源文提取为 `data/source/ch*.md`
- **表现形式**：将纯文本教程转化为结构化幻灯片 + 交互式 Canvas 动画 + 知识测验
- **技术独立**：纯前端实现，不依赖原始教程的任何后端服务或构建工具

## 快速开始

```bash
git clone https://github.com/aajj1314/hello-agents-ppt.git
cd hello-agents-ppt
python3 -m http.server 8080
```

浏览器访问 `http://localhost:8080/`。

> **不能双击 `index.html` 打开** — 项目使用 `fetch()` + ES Modules，在 `file://` 协议下会被浏览器 CORS 拦截。

### 开发测试

```bash
npm install
npm test        # 103 tests (vitest + jsdom)
```

## 项目总览

| 指标 | 数值 | 说明 |
|------|------|------|
| 章节 | 16 | 覆盖 Hello-Agents 全部 16 章 |
| 幻灯片 | 338 | 每章 20-26 张 |
| 测验题 | 110 | 单选 / 多选 / 判断 |
| Canvas 动画 | 20 | 暗色主题自适应 |
| 测试用例 | 103 | vitest + jsdom |
| 运行时依赖 | 0 | 纯静态，GitHub Pages 可直接部署 |

## 16 章内容

| 章 | 标题 | 幻灯片 | 测验 | 动画 |
|----|------|--------|------|------|
| CH1 | 初识智能体 | 20 | 6 | 智能体类型交互图 |
| CH2 | 智能体发展史 | 23 | 7 | 可点击时间线（8 个里程碑） |
| CH3 | 大语言模型基础 | 26 | 7 | 注意力权重热图 |
| CH4 | 智能体经典范式构建 | 20 | 7 | ReAct 循环动画 |
| CH5 | 低代码平台搭建 | 20 | 7 | 视频占位（可启用） |
| CH6 | 框架开发实践 | 20 | 6 | 框架调用栈对比图 |
| CH7 | 构建你的 Agent 框架 | 20 | 6 | 框架组件关系图 |
| CH8 | 记忆与检索 | 20 | 6 | 记忆流动画 |
| CH9 | 上下文工程 | 20 | 6 | 上下文窗口可视化 |
| CH10 | 智能体通信协议 | 20 | 6 | 协议时序图 |
| CH11 | Agentic-RL | 21 | 8 | 奖励信号反馈环 |
| CH12 | 性能评估 | 20 | 8 | 六维评估雷达图 |
| CH13 | 智能旅行助手 | 25 | 6 | 多智能体协作图 |
| CH14 | DeepResearch | 20 | 8 | 任务树递归展开 |
| CH15 | 赛博小镇 | 21 | 8 | 小镇网格 + Agent 移动 |
| CH16 | 毕业设计 | 22 | 8 | 视频占位（可启用） |

## 核心功能

### 学习体验
- **结构化幻灯片**：每章 cover → 概念引入 → 核心讲解 → 动画演示 → 代码示例 → 概念对比 → 进阶实践 → 章节小结 → 知识测验
- **9 种幻灯片类型**：`cover` 封面 / `content` 内容（支持 Markdown-like 语法） / `code` 代码（语法高亮） / `animation` 动画 / `timeline` 时间线 / `flow` 流程图 / `concepts` 概念卡片 / `comparison` 对比表 / `quiz` 测验
- **进度持久化**：学习进度和测验成绩保存在 localStorage，刷新不丢失

### Canvas 交互动画
- **ReAct 循环动画**（CH4）：播放/暂停/单步/变速，展示 Thought → Action → Observation 完整流程
- **注意力热图**（CH3）：hover 查看 token 间注意力权重，对角线脉冲动画
- **交互式时间线**（CH2）：点击节点查看详情，年代色带
- **雷达图**（CH12）：可拖动权重调整六维评估模型
- **任务树展开**（CH14）：点击父任务递归分解子任务
- 所有动画支持亮色/暗色主题自适应、播放/暂停/单步/变速控制

### 知识测验
- 单选 / 多选 / 判断三种题型
- 即时反馈：正确/错误高亮 + 解析说明
- 自动计分（每题 10 分），章节满分 100 分
- **错题本**：答错的题目自动记录，支持按章节回顾复习
- 60 分及格，80 分良好，100 分优秀

### 全局搜索 (Ctrl+K)
- 搜索范围：章节标题、幻灯片标题/正文、测验题目、讲师备注
- 内存索引，<100ms 响应
- ↑↓ 选择，Enter 跳转，Esc 关闭
- 按章节分组结果，点击直接跳转到对应 slide

### 演讲者模式 (P 键)
- 双屏方案：主屏全屏当前 slide，副屏显示计时器 + 演讲备注 + 下一页预览
- BroadcastChannel 跨窗口实时同步
- 演讲计时器自动启动
- 辅助键：B 黑屏 / W 白屏 / 数字+Enter 跳页

### PDF 导出
- 单章导出：当前章节的所有 slide，代码块保留高亮，Canvas 自动转为静态截图
- 全书导出：串联 16 章一键打印
- 虚拟化渲染与打印模式自动桥接（打印时全量渲染，打印后恢复）
- 支持 Chrome / Firefox / Edge

### 键盘快捷键

| 键 | 功能 |
|----|------|
| `←` `→` `PgUp` `PgDn` | 翻页 |
| `Home` `End` | 首页 / 末页 |
| `Ctrl+K` | 全局搜索 |
| `T` | 章节目录抽屉 |
| `D` | 亮色/暗色切换 |
| `P` | 演讲者模式 |
| `?` | 快捷键帮助浮层 |
| `Esc` | 关闭弹层 / 退出模式 |

### 可访问性 (A11y)
- ARIA 语义标签（`role` / `aria-label` / `aria-valuenow`）
- 焦点管理（focus trap + 恢复）
- `:focus-visible` 可见焦点环
- 键盘完全可达（Tab 导航无障碍）
- 响应式断点：480px / 768px / 1024px
- 触摸目标 ≥44px（移动端）

## 技术架构

```
index.html     ──> js/main.js     ──> js/app.js + js/theme.js
slides.html    ──> js/slides-main.js ──> js/slides/slide-engine.js
presenter.html ──> js/presenter-main.js
```

**核心设计**：
- **SlideRouter**：按 `slide.type` 派发到 9 个独立渲染器函数
- **AnimationRegistry**：Map 注册中心，动画文件自注册，零 HTML 改动
- **CanvasAnimation 基类**：DPR 自适应 + 暗色主题监听 + 圆角矩形/文字换行工具方法
- **虚拟化渲染**：正常模式只渲染当前 slide（性能优化），打印模式全量渲染
- **Storage 缓存**：内存缓存 + `storage` 事件跨窗口失效 + 深拷贝防污染

### 目录结构

```
hello-agents-ppt/
├── index.html                    # 首页
├── slides.html                   # 幻灯片播放器
├── presenter.html                # 演讲者页面
├── css/                          # main, slides, themes, animations, a11y, print
├── js/
│   ├── core/                     # storage, utils, content-parser, code-highlighter
│   ├── slides/                   # slide-engine, slide-router, renderers/ (9 种)
│   ├── animations/               # animation-registry, canvas-animation, video-animation, ch*.js (20 个)
│   ├── quiz/quiz-system.js       # 测验引擎
│   └── features/                 # search, toc-sidebar, review, presenter-mode, keyboard, focus, print
├── data/
│   ├── chapters.json             # 16 章 338 张幻灯片
│   ├── quiz-data.json            # 110 道测验题
│   └── source/                   # 原书章节源文 (Markdown)
├── assets/animations/            # 视频动画目录（放 mp4 自动启用）
├── docs/                         # README, ARCHITECTURE, ANIMATION-GUIDE, superpowers/
└── tests/                        # 103 tests
```

### 添加新章节

1. 在 `data/chapters.json` 追加章节对象（含 slides 数组）
2. 在 `data/quiz-data.json` 添加 `"chN": [...]` 题目数组
3. 如需动画：在 `js/animations/` 创建文件，继承 `CanvasAnimation`，调用 `registerAnimation()`
4. 在 `js/slides-main.js` 中 `import` 该动画文件
5. 刷新首页即可看到新章节

### 幻灯片内容语法

`content` 类型 slide 的 `content` 字段支持类 Markdown 语法：

```
**粗体文本**、`行内代码`
• 无序列表项
1. 有序列表项
[提示] 蓝色提示框
[警告] 黄色警告框
[成功] 绿色成功框
| 表头A | 表头B |
|--------|--------|
| 单元格1 | 单元格2 |
```

`code` 类型 slide 支持 Python / JavaScript / JSON 语法高亮。

## 开源协议

- 本项目代码采用 [MIT License](LICENSE)
- 原始 Hello-Agents 教程内容版权归 [Datawhale](https://github.com/datawhalechina) 及原作者所有
- 基于 [hello-agents](https://github.com/datawhalechina/hello-agents) 项目的教程内容改编

## 致谢

- **[Datawhale](https://github.com/datawhalechina)** — 开源社区与教程维护
- **[Hello-Agents](https://github.com/datawhalechina/hello-agents) 原作者** — 16 章教程内容
- **所有贡献者** — 代码、设计、测试与反馈

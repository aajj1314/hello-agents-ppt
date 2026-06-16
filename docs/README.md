# Hello-Agents 交互式学习 PPT

> 对应 Datawhale《Hello-Agents》教程 16 章，纯静态 HTML/CSS/JS 实现的交互式学习平台。

## 快速开始

```bash
git clone <repo-url> && cd hello-agents-ppt
python3 -m http.server 8080
# 浏览器访问 http://localhost:8080/
```

> 不支持 `file://` 双击打开 —— `fetch()` + ES Modules 在 `file://` 协议下会被 CORS 拦截。

## 运行测试

```bash
npm install        # 仅首次
npm test           # 103 tests (vitest + jsdom)
```

## 项目数据

| 指标 | 数值 |
|------|------|
| 章节 | 16 |
| 幻灯片 | 338 |
| 测验题 | 110 |
| Canvas 动画 | 20 |
| 测试 | 103 PASS / 1 skipped |
| 运行时依赖 | 0 |

## 功能

### 学习与导航
- **16 章完整教材**：从智能体定义到毕业设计，每章 20+ 张幻灯片
- **9 种幻灯片类型**：封面、内容、代码、测验、动画、时间线、流程图、概念卡、对比表
- **键盘导航**：← → 翻页，T 目录，D 暗色切换，? 帮助

### 交互与测验
- **20 个 Canvas 交互动画**：ReAct 循环、注意力热图、时间线、雷达图等
- **110 道测验题**：单选/多选/判断，即时反馈，自动计分
- **错题本**：答错的题目自动记录，可回顾复习
- **学习进度**：localStorage 持久化，刷新不丢失

### 工具
- **全局搜索** (Ctrl+K)：搜索章节标题、幻灯片内容、测验题目
- **演讲者模式** (P 键)：双屏同步，计时器 + 备注 + 下一页预览
- **PDF 导出**：单章或全书打印，Canvas 自动转静态图
- **暗色主题** (D 键)：所有动画自适应

### 可访问性
- ARIA 语义标签、焦点管理、键盘完全可达
- 响应式布局 (480/768/1024 断点)
- 打印样式优化

## 目录结构

```
hello-agents-ppt/
├── index.html                 # 首页（章节列表 + 学习统计）
├── slides.html                # 幻灯片播放器
├── presenter.html             # 演讲者模式页面
├── css/                       # 样式（main, slides, themes, animations, a11y, print）
├── js/
│   ├── main.js                # 首页入口
│   ├── slides-main.js         # 幻灯片入口（动画 import + 功能集成）
│   ├── presenter-main.js      # 演讲者入口
│   ├── app.js                 # 首页逻辑
│   ├── theme.js               # 主题切换
│   ├── core/                  # 基础设施
│   │   ├── storage.js         # localStorage 缓存 + 跨窗口同步
│   │   ├── utils.js           # DOM 助手 / escapeHTML / throttle
│   │   ├── content-parser.js  # Markdown → HTML
│   │   └── code-highlighter.js# 占位符式语法高亮
│   ├── slides/                # 幻灯片引擎
│   │   ├── slide-engine.js    # 路由 + 生命周期 + 虚拟化渲染
│   │   ├── slide-router.js    # type → renderer 注册表
│   │   └── renderers/         # 9 种幻灯片渲染器
│   ├── animations/            # 动画系统
│   │   ├── animation-registry.js  # 自注册中心
│   │   ├── canvas-animation.js    # 基类 (DPR + 暗色主题)
│   │   ├── video-animation.js     # 视频 + Canvas 回退
│   │   └── ch*.js                 # 20 个章节动画
│   ├── quiz/
│   │   └── quiz-system.js     # 测验引擎
│   └── features/              # Phase 3 功能模块
│       ├── search.js / search-index.js  # 全局搜索
│       ├── toc-sidebar.js              # 章节目录
│       ├── review.js                   # 错题回顾
│       ├── presenter-mode.js           # 演讲者模式
│       ├── keyboard-shortcuts.js       # 键盘快捷键
│       ├── focus-manager.js            # 焦点管理
│       └── print.js                    # PDF 导出
├── data/
│   ├── chapters.json          # 16 章幻灯片数据
│   ├── quiz-data.json         # 110 道测验题
│   └── source/                # 原书章节源文 (Markdown)
├── assets/animations/         # 视频动画（可选，放 mp4 自动启用）
├── docs/                      # 文档
│   ├── README.md              # 本文件
│   ├── ARCHITECTURE.md        # 架构图
│   ├── ANIMATION-GUIDE.md     # 动画扩展指南
│   └── superpowers/           # 设计文档与实施计划
└── tests/                     # 103 个测试
```

## 幻灯片类型

| type | 用途 | 示例字段 |
|------|------|----------|
| `cover` | 章节封面 | title, subtitle |
| `content` | 概念讲解 | title, content（支持 Markdown-like 语法） |
| `code` | 代码展示 | title, language, code, explanation |
| `quiz` | 知识测验 | title（题目数据在 quiz-data.json） |
| `animation` | 交互动画 | title, animation, media.video (可选) |
| `timeline` | 时间线 | title, items[{year, title, description}] |
| `flow` | 流程图 | title, steps[{title, description}] |
| `concepts` | 概念卡片 | title, items[{icon, title, description}] |
| `comparison` | 对比表 | title, headers[], rows[][] |

## 添加新章节

1. 在 `data/chapters.json` 的 `chapters` 数组追加章节对象（含 slides）
2. 在 `data/quiz-data.json` 添加 `"chN": [...]` 题目数组
3. 如需动画：在 `js/animations/` 创建文件，调用 `registerAnimation()`
4. 在 `js/slides-main.js` 中 `import` 该动画文件
5. 刷新首页即可看到新章节

## 已知问题

### Quiz "下一题" 按钮偶发失效
答题后点击"下一题"有时无反应，根因仍在排查（`submit()` 已改为同步，按钮 onclick 更新时机已修复，但问题仍存）。当前绕过方式：刷新页面后重新进入 quiz slide。

## 技术栈约束

- 零运行时依赖（仅 devDependencies: vitest + jsdom）
- 纯静态文件，GitHub Pages 可直接部署
- ES Modules
- 需 HTTP 服务器运行

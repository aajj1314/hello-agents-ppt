# hello-agents-ppt

纯静态 HTML/CSS/JS 交互式学习 PPT，对应 Datawhale《Hello-Agents》教程。

**当前状态：4 阶段全部完成。16 章 304 slides + 98 quiz + 14 动画 + 搜索/TOC/错题本/演讲者/快捷键 + A11y/响应式/PDF/虚拟化。**

## 运行

```bash
python3 -m http.server 8080   # 访问 http://localhost:8080/
npm test                       # 103 tests (vitest + jsdom)
```

> 不支持 `file://` 双击打开 — fetch + ES Modules 需要 HTTP。

## 架构

```
index.html ──> js/main.js ──> js/app.js + js/theme.js
slides.html ──> js/slides-main.js ──> js/slides/slide-engine.js
                                    ├── js/slides/slide-router.js → js/slides/renderers/
                                    ├── js/quiz/quiz-system.js
                                    └── js/animations/animation-registry.js → CanvasAnimation/VideoAnimation
js/core/: storage.js, utils.js, content-parser.js, code-highlighter.js
```

核心模式：`SlideRouter` 按 slide.type 派发到独立 renderer（cover/content/code/quiz/animation/timeline/flow/concepts/comparison）。动画通过 `AnimationRegistry` 自注册。

## 待处理问题

### 1. 浏览器端功能等价性验证未做
需 `python3 -m http.server` 启动后人工验证 16 章。

### 2. 6 个旧动画文件迁移中（子代理工作中）
旧动画 `ch1-agent-types`, `ch4-react-loop`, `ch7-framework`, `ch8-memory`, `ch10-protocol`, `ch13-travel` 正在改造为 CanvasAnimation + registerAnimation。

### 3. 原有 5 章 slide 扩展中（子代理工作中）
ch1(12→20), ch4(13→20), ch7(14→20), ch8(13→20), ch10(14→20) 正在扩充。

## 已修复
- ✅ Storage 缓存 Bug：`_cache` 从模块级 `let` 改为 `Storage._cache` 属性 + deep copy nested defaults
- ✅ 旧核心文件已删除：`js/utils.js`, `js/storage.js`, `js/quiz.js`, `js/slides.js`
- ✅ ch5/ch16 视频占位：添加 Canvas 占位动画 + `canvasFallback: true`

## 技术栈约束

- 零运行时依赖（仅 devDependencies: vitest + jsdom）
- 纯静态，GitHub Pages 可直接托管
- ES Modules
- 需 HTTP 服务器运行

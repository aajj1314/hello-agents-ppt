# hello-agents-ppt

纯静态 HTML/CSS/JS 交互式学习 PPT，对应 Datawhale《Hello-Agents》教程。

**当前状态：4 阶段全部完成。16 章 304 slides + 98 quiz + 14 动画 + 搜索/TOC/错题本/演讲者/快捷键 + A11y/响应式/PDF/虚拟化。**

## 运行

```bash
python3 -m http.server 8080   # 访问 http://localhost:8080/
npm test                       # 68 tests (vitest + jsdom)
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

### 1. Storage 跨测试隔离 Bug
`tests/slides/slide-engine.test.js` 中 `it.skip('next/prev navigate and stay within bounds')` — 单独运行通过，与其他测试同跑时失败。根因待排查。

### 2. 6 个旧动画文件未迁移
旧动画仍用全局 `window.Animations` + `<script src>` 加载。需改为 `CanvasAnimation` 子类 + `registerAnimation()`：
`ch1-agent-types`, `ch4-react-loop`, `ch7-framework`, `ch8-memory`, `ch10-protocol`, `ch13-travel`

### 3. 旧核心文件待删除
`js/utils.js`, `js/storage.js`, `js/quiz.js`, `js/slides.js` — 新架构已替代，等浏览器验证后删除。

### 4. 浏览器端功能等价性验证未做
需启动 HTTP 服务器人工验证。

### 5. 原有 6 章 slide 数偏少
ch1(12), ch4(13), ch7(14), ch8(13), ch10(14) — 都低于 20 张。Phase 2 新增的 10 章均已达到 20+。

### 6. ch5 和 ch16 为视频占位
animation slide 使用 `media.video` + `canvasFallback: false`，无实际 mp4 文件。

## 技术栈约束

- 零运行时依赖（仅 devDependencies: vitest + jsdom）
- 纯静态，GitHub Pages 可直接托管
- ES Modules
- 需 HTTP 服务器运行

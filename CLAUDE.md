# hello-agents-ppt

纯静态 HTML/CSS/JS 交互式学习 PPT，对应 Datawhale《Hello-Agents》教程。

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

核心模式：`SlideRouter` 按 slide.type 派发到独立 renderer（cover/content/code/quiz/animation/timeline/flow/concepts/comparison）。动画通过 `AnimationRegistry` 自注册，CanvasAnimation 基类提供 DPR + 暗色主题支持。

## 待处理问题

### 1. Storage 跨测试隔离 Bug（tests/slides/slide-engine.test.js:62）

`it.skip('next/prev navigate and stay within bounds')` — 单独运行通过，与其他测试同跑时失败。`Storage.setChapterProgress()` 在测试 A 中写入的缓存，在测试 B 的 `beforeEach` 中调用 `localStorage.clear()` + `Storage._resetCache()` 后仍能被 `Storage.get()` 读到。Storage 自身的单元测试全部通过，问题仅在 SlideEngine 集成测试中触发。根因待排查。

### 2. 6 个旧动画文件未迁移到新架构

旧动画仍用全局 `window.Animations` 模式 + `<script src>` 加载（`slides.html`）。需逐一改为 `CanvasAnimation` 子类 + `registerAnimation()`，删掉 `<script>` 标签后从 `js/slides-main.js` import：
- `js/animations/ch1-agent-types.js`
- `js/animations/ch4-react-loop.js`
- `js/animations/ch7-framework.js`
- `js/animations/ch8-memory.js`
- `js/animations/ch10-protocol.js`
- `js/animations/ch13-travel.js`

### 3. 4 个旧核心文件待删除

新架构已完全替代，但尚未做浏览器端人工验证，暂保留：
- `js/utils.js`, `js/storage.js`, `js/quiz.js`, `js/slides.js`

### 4. 浏览器端功能等价性验证未做

新架构从未在浏览器中运行过。需 `python3 -m http.server` 启动后人工验证：6 章浏览、6 个动画、quiz 答题、暗色主题、进度持久化。验证通过后方可删除旧文件。

## 技术栈约束

- 零依赖（仅 devDependencies: vitest + jsdom）
- 纯静态，GitHub Pages 可直接托管
- ES Modules，不再使用全局变量挂 window

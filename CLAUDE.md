# hello-agents-ppt

纯静态 HTML/CSS/JS 交互式学习 PPT，对应 Datawhale《Hello-Agents》教程。

**当前状态：全部完成。16 章 338 slides + 110 quiz + 20 动画。所有 6 个遗留问题已修复。**

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

## 待处理

### 浏览器端验证
需 `python3 -m http.server 8080` 启动后人工验证所有 16 章功能。

## 技术栈约束

- 零运行时依赖（仅 devDependencies: vitest + jsdom）
- 纯静态，GitHub Pages 可直接托管
- ES Modules
- 需 HTTP 服务器运行

# hello-agents-ppt

纯静态 HTML/CSS/JS 交互式学习 PPT，对应 Datawhale《Hello-Agents》16 章教程。

**数据**: 338 slides · 110 quiz · 20 Canvas 动画 · 103 tests · 0 运行时依赖

## 运行

```bash
python3 -m http.server 8080   # 访问 http://localhost:8080/
npm test                       # 103 tests (vitest + jsdom)
```

> `file://` 协议不可用 — fetch + ES Modules 需要 HTTP。

## 架构

```
index.html     ──> js/main.js     ──> js/app.js + js/theme.js
slides.html    ──> js/slides-main.js ──> js/slides/slide-engine.js
presenter.html ──> js/presenter-main.js
```

**SlideEngine** 是核心：`SlideRouter` 按 slide.type 派发到 9 个独立 renderer，`AnimationRegistry` 做动画自注册，`CanvasAnimation` 基类提供 DPR + 暗色主题支持。

**数据流**: `chapters.json` + `quiz-data.json` → SlideEngine → renderer 渲染 → DOM

**虚拟化渲染**: 正常模式只渲染当前 ±0 张 slide；打印时全量渲染 + canvas→img 截图。

## 关键模块

| 目录 | 职责 |
|------|------|
| `js/core/` | Storage(缓存+跨窗口), Utils(DOM/XSS), ContentParser(MD→HTML), CodeHighlighter |
| `js/slides/` | SlideEngine(虚拟化+PDF), SlideRouter(类型派发), renderers/(9种) |
| `js/animations/` | AnimationRegistry(Map), CanvasAnimation(DPR+暗色), VideoAnimation(回退), ch*.js(20个) |
| `js/quiz/` | QuizSystem(单选/多选/判断, XSS安全, 错题记录) |
| `js/features/` | search, toc-sidebar, review, presenter-mode, keyboard-shortcuts, focus-manager, print |

## 已知问题

### Quiz 答题后无法切换下一题
`submit()` 已从 async 改为同步，`submitBtn.onclick` 在 submit 内第一时间更新为下一题处理器，但问题仍存。有待进一步用浏览器 DevTools 断点调试 submit 的完整调用链和 onclick 触发时序。

### 其余 5 个遗留问题已全部修复
- ✅ Storage 缓存 Bug（`_cache` 属性化 + 深拷贝嵌套默认值）
- ✅ 6 个旧动画迁移到 CanvasAnimation + registerAnimation
- ✅ 旧全局 JS 文件已删除
- ✅ 5 个原有章节扩展到 20+ slides
- ✅ ch5/ch16 视频占位添加 Canvas fallback

## 不在范围内 (YAGNI)

- TypeScript 化 · React/Vue 框架 · 后端服务 · 用户账号/多设备同步 · i18n · 实时协作

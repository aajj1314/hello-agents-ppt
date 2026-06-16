# 架构

## 模块依赖

```mermaid
graph TD
    A[index.html] --> M1[js/main.js]
    B[slides.html] --> M2[js/slides-main.js]
    M1 --> App[js/app.js]
    M1 --> Theme[js/theme.js]
    M2 --> SlideEngine[js/slides/slide-engine.js]
    SlideEngine --> Router[js/slides/slide-router.js]
    Router --> Renderers[js/slides/renderers/]
    SlideEngine --> Quiz[js/quiz/quiz-system.js]
    SlideEngine --> AnimRegistry[js/animations/animation-registry.js]
    AnimRegistry --> CanvasAnim[js/animations/canvas-animation.js]
    AnimRegistry --> VideoAnim[js/animations/video-animation.js]
    App --> Storage[js/core/storage.js]
    SlideEngine --> Storage
    App --> Utils[js/core/utils.js]
    SlideEngine --> Utils
```

## 渲染流程

1. `slides.html` 加载 `js/slides-main.js`
2. 实例化 `SlideEngine`，读取 `?chapter=&slide=` URL 参数
3. `loadJSON('data/chapters.json')` 拉取章节
4. 根据 slide `type` 通过 `SlideRouter` 派发到对应 renderer
5. `animation` 类型额外异步 mount canvas
6. `quiz` 类型额外 mount `QuizSystem`

## Storage 跨窗口同步

`Storage` 用内存缓存加速读；`window.addEventListener('storage', ...)` 监听其他窗口的写入并失效缓存。

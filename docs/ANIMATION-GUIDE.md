# 动画扩展指南

## Canvas 动画

在 `js/animations/ch{N}-{name}.js`：

```js
import { CanvasAnimation } from './canvas-animation.js';
import { registerAnimation } from './animation-registry.js';

class Ch99Demo extends CanvasAnimation {
    init(canvas) { super.init(canvas); this.draw(); }
    draw() { /* 渲染逻辑 */ }
    play() {}
    step() {}
    reset() { this.draw(); }
    setSpeed(v) {}
}
registerAnimation('ch99-demo', () => new Ch99Demo());
```

在 `data/chapters.json` 添加：
```json
{ "type": "animation", "animation": "ch99-demo" }
```

## 视频动画

把 mp4 放进 `assets/animations/ch99/demo.mp4`，在 `chapters.json` 声明：

```json
{ "type": "animation", "animation": "ch99-demo",
  "media": { "video": "ch99/demo.mp4", "canvasFallback": true } }
```

- 文件存在 → 播放视频
- 文件不存在（`onerror`）→ 回退到 Canvas 动画
- 都没有 → 显示占位提示

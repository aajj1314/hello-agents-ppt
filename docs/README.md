# Hello-Agents 交互式学习 PPT

> 对应原书《Hello-Agents》16 章内容，纯静态 HTML/CSS/JS 实现。

## 启动

```bash
python3 -m http.server 8080
# 访问 http://localhost:8080/
```

> **不能双击 `index.html` 打开**。本项目用 `fetch()` 加载数据 + ES Modules，二者在 `file://` 协议下被浏览器 CORS 拦截。必须通过 HTTP 协议访问。

## 目录

- `index.html` — 首页（章节列表 + 学习统计）
- `slides.html` — 章节学习页
- `js/` — ES Modules 源码
- `data/` — 章节内容（`chapters.json`）与题库（`quiz-data.json`）
- `assets/animations/` — 视频动画（可选；缺失时自动回退到 Canvas 动画）
- `css/` — 样式
- `docs/ARCHITECTURE.md` — 架构说明
- `docs/ANIMATION-GUIDE.md` — 动画扩展指南

## 运行测试

```bash
npm test
```

## 添加新章节

1. 在 `data/chapters.json` 的 `chapters` 数组追加。
2. 在 `data/quiz-data.json` 添加对应题库。
3. 刷新首页，新章即出现。

支持 slide 类型：`cover` / `content` / `code` / `quiz` / `animation` / `timeline` / `flow` / `concepts` / `comparison`。

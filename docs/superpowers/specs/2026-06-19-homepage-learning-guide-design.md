# 首页学习导览设计文档

> 设计主题：让普通人一打开 Hello-Agents PPT 首页就能理解"Agent 是什么、我要怎么学、学完能做什么"。
>
> 创建日期：2026-06-19
> 设计范围：首页 Hero 区扩展 + 新增数据文件 + 少量前端渲染逻辑

---

## 1. 背景与目标

### 1.1 现状问题

当前首页 ([index.html](file:///workspace/index.html)) 包含：
- Hero 大标题 + 统计数字 + 整体进度条
- 16 章章节网格
- "开始学习 / 继续上次 / 重置进度" 三个按钮

但缺少对"普通人"至关重要的入口信息：
- **Agent 是什么？** — 没有任何大白话解释
- **学习路径是什么？** — 16 章平铺，看不出学习顺序和阶段
- **学完能做什么？** — 没有应用场景预览

### 1.2 设计目标

让首次访问的用户在 30 秒内获得三个认知：
1. Agent 是能感知、思考、行动的 AI 系统（用生活类比）
2. 学习分 3 个阶段：看懂概念 → 掌握范式 → 动手实战
3. 学完可以做智能客服、研究助手、日程管家等 6 类应用

---

## 2. 用户决策记录

| 决策项 | 用户选择 | 备注 |
|--------|----------|------|
| 导览位置 | A | 首页 Hero 区扩展 |
| 导览内容 | A+B+D | Agent 定义 + 学习路径 + 学完能做什么 |
| 呈现形式 | A | 一页长板，滚动即看完 |
| 设计方案 | 方案一 | 三栏卡片式 |
| 数据方式 | B | 数据驱动（新增 `data/home-guide.json`） |

---

## 3. 布局与组件结构

### 3.1 插入位置

在 `index.html` 的 `hero-banner` 与 `section-heading`（"章节导航"标题）之间，新增：

```html
<section class="hero-guide" id="heroGuide" aria-label="新手指引">
  <div class="guide-grid">
    <article class="guide-card" aria-labelledby="guide-intro-title">...</article>
    <article class="guide-card" aria-labelledby="guide-path-title">...</article>
    <article class="guide-card" aria-labelledby="guide-capabilities-title">...</article>
  </div>
</section>
```

### 3.2 视觉布局

- **桌面端（≥1024px）**：3 张卡片横向等宽，gap 24px
- **平板（768–1023px）**：前 2 张并排，第 3 张整行
- **移动端（<768px）**：3 张垂直堆叠
- **样式**：延续 Aurora + Glassmorphism（半透明毛玻璃、圆角 16px、紫色/靛蓝渐变边框）
- **高度**：`grid-auto-rows: 1fr` 保证等高

### 3.3 与现有元素关系

- 导览区位于 Hero stats / 进度条下方
- "开始学习 / 继续上次 / 重置进度" 三个按钮位置不变，在导览区下方
- 不遮挡原有章节网格

---

## 4. 三张卡片内容

### 4.1 卡片 1：Agent 是什么？

| 元素 | 内容 |
|------|------|
| 标题 | Agent 是什么？ |
| 图标 | 机器人/大脑 SVG |
| 一句话定义 | Agent 是能感知环境、自己思考、并使用工具的 AI 系统。 |
| 生活类比 | 就像一位餐厅服务员：听懂客人需求 → 去厨房协调 → 把菜端回来。 |
| 关键区别 | 和普通程序不同，Agent 会自己决定下一步做什么。 |
| 跳转 | "了解更多 →" 跳转 CH1 初识智能体 |

### 4.2 卡片 2：3 步学习路径

| 步骤 | 标题 | 描述 | 关联章节 | 跳转行为 |
|------|------|------|----------|----------|
| Step 1 | 看懂概念 | 从 CH1–CH3 开始，理解 Agent 是什么、怎么发展、LLM 怎么工作 | ch1, ch2, ch3 | 跳 CH1 |
| Step 2 | 掌握范式 | CH4–CH10：ReAct、Plan-and-Solve、记忆、上下文、通信协议 | ch4–ch10 | 跳该阶段第一个未完成章节；全完成则跳 CH4 |
| Step 3 | 动手实战 | CH13–CH16：旅行助手、DeepResearch、赛博小镇、毕业设计 | ch13, ch14, ch15, ch16 | 跳 CH13 |

**状态样式**：
- `completed`：绿色勾 + 文字变淡
- `active`：高亮边框 + 脉冲点 + "继续"按钮
- `pending`：灰色占位

### 4.3 卡片 3：学完能做什么？

| 图标 | 场景 | 描述 |
|------|------|------|
| chat | 智能客服 | 自动回答用户问题 |
| search | 研究助手 | 自动搜索并总结报告 |
| calendar | 日程管家 | 理解邮件自动安排日程 |
| tools | 工具助手 | 调用 API、查天气、算数据 |
| game | 游戏 NPC | 有记忆、会互动的角色 |
| code | 代码助手 | 自动审代码、跑测试 |

---

## 5. 数据模型

新增文件：`data/home-guide.json`

```json
{
  "agent_intro": {
    "title": "Agent 是什么？",
    "icon": "brain",
    "definition": "Agent 是能感知环境、自己思考、并使用工具的 AI 系统。",
    "analogy": "就像一位餐厅服务员：听懂客人需求 → 去厨房协调 → 把菜端回来。",
    "difference": "和普通程序不同，Agent 会自己决定下一步做什么。",
    "link": { "chapter": "ch1", "slide": 1, "text": "了解更多" }
  },
  "learning_path": {
    "title": "3 步学会 Agent",
    "steps": [
      {
        "id": "concepts",
        "title": "Step 1：看懂概念",
        "description": "从 CH1–CH3 开始，理解 Agent 是什么、怎么发展、LLM 怎么工作",
        "chapters": ["ch1", "ch2", "ch3"],
        "cta": "从 CH1 开始"
      },
      {
        "id": "patterns",
        "title": "Step 2：掌握范式",
        "description": "CH4–CH10：ReAct、Plan-and-Solve、记忆、上下文、通信协议",
        "chapters": ["ch4", "ch5", "ch6", "ch7", "ch8", "ch9", "ch10"],
        "cta": "跳到 CH4"
      },
      {
        "id": "practice",
        "title": "Step 3：动手实战",
        "description": "CH13–CH16：旅行助手、DeepResearch、赛博小镇、毕业设计",
        "chapters": ["ch13", "ch14", "ch15", "ch16"],
        "cta": "跳到 CH13"
      }
    ]
  },
  "capabilities": {
    "title": "学完能做什么？",
    "items": [
      { "icon": "chat", "name": "智能客服", "desc": "自动回答用户问题" },
      { "icon": "search", "name": "研究助手", "desc": "自动搜索并总结报告" },
      { "icon": "calendar", "name": "日程管家", "desc": "理解邮件自动安排日程" },
      { "icon": "tools", "name": "工具助手", "desc": "调用 API、查天气、算数据" },
      { "icon": "game", "name": "游戏 NPC", "desc": "有记忆、会互动的角色" },
      { "icon": "code", "name": "代码助手", "desc": "自动审代码、跑测试" }
    ]
  }
}
```

---

## 6. 交互与行为

### 6.1 渲染时机

- `DOMContentLoaded` 后执行 `renderHomeGuide()`
- 在 `renderChapterGrid()` 之前渲染
- `fetch('data/home-guide.json')`，失败则静默跳过

### 6.2 学习进度状态计算

```javascript
function getStepStatus(step, progress) {
  const completed = step.chapters.every(ch => progress[ch]?.completed);
  const started = step.chapters.some(ch => progress[ch]?.lastSlide > 0);
  if (completed) return 'completed';
  if (started) return 'active';
  return 'pending';
}
```

### 6.3 点击跳转

| 元素 | 目标 URL |
|------|----------|
| "了解更多" | `slides.html?chapter=ch1&slide=1` |
| Step 1 节点 | `slides.html?chapter=ch1&slide=1` |
| Step 2 节点 | 该阶段第一个未完成章节；全完成则 CH4 |
| Step 3 节点 | `slides.html?chapter=ch13&slide=1` |
| 能力清单项 | 仅展示，暂不跳转 |

### 6.4 降级与容错

- `home-guide.json` 缺失/解析失败：隐藏 `hero-guide`，首页保持原样
- 无 localStorage 进度：全部显示 pending
- 进度数据损坏：按 pending 处理

---

## 7. 响应式与可访问性

### 7.1 响应式

复用现有 CSS 断点：
- `≥1024px`：3 列
- `768–1023px`：2 列（卡片 3 占满第二行）
- `<768px`：1 列

### 7.2 性能

- 数据文件 < 5KB
- 全部使用 SVG 图标，无新图片资源
- 同步渲染，不阻塞

### 7.3 可访问性

- 使用 `<article>` + `aria-labelledby`
- 路径节点使用 `<ol>` / `<li>`，每个节点为 `<a>` 或 `<button>`
- 图标 `aria-hidden="true"`
- `:focus-visible` 焦点环
- 尊重 `prefers-reduced-motion`

---

## 8. 前端改动清单

| 文件 | 改动 |
|------|------|
| `index.html` | 在 Hero 与章节导航之间插入 `<section class="hero-guide">` 容器 |
| `js/app.js` | 新增 `renderHomeGuide()`；在初始化流程中调用 |
| `data/home-guide.json` | 新增导览数据 |
| `css/main.css` | 新增 `.hero-guide`、`.guide-grid`、`.guide-card` 样式 |
| `tests/features/home-guide.test.js` | 新增测试（可选，建议） |

---

## 9. 测试策略

| 测试项 | 方式 |
|--------|------|
| JSON 格式有效 | 断言 `data/home-guide.json` 可解析 |
| 渲染后 DOM 存在 | 验证 `#heroGuide` 包含 3 张 `.guide-card` |
| 进度联动 | mock localStorage，验证 step 状态计算 |
| 响应式 | 检查 3 列/2 列/1 列断点 |
| 错误降级 | 模拟 fetch 失败，验证首页不崩溃 |

---

## 10. 不在范围内（YAGNI）

- 不改现有章节网格
- 不改 slide 播放器
- 不新增后端
- 不新增 npm 依赖
- 不做多语言
- 不做复杂的动画效果

---

## 11. 验收标准

- [ ] 首页出现 3 张 glassmorphism 导览卡片
- [ ] 卡片 1 包含 Agent 定义 + 类比 + 区别 + 跳转链接
- [ ] 卡片 2 显示 3 步路径，并根据学习进度显示 completed/active/pending
- [ ] 卡片 3 显示 6 个应用场景
- [ ] 点击路径节点正确跳转对应章节
- [ ] 无 `home-guide.json` 时首页保持原样
- [ ] 桌面/平板/移动端布局正确
- [ ] `npm test` 全部通过

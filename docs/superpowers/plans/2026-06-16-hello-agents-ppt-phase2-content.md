# Phase 2: 内容补全 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把缺失的 10 章按"详尽型"标准补齐，使 16 章皆可作为完整教材。每章 20-30 张 slide + 5-8 道 quiz + 至少 1 个动画。

**Architecture:** 沿用 Phase 1 建立的 ES Modules 架构。新增章节只需改 `data/chapters.json` 与 `data/quiz-data.json`；新动画只需在 `js/animations/` 加文件 + 在 `js/slides-main.js` 加 import；视频动画把 mp4 放入 `assets/animations/<ch>/<name>.mp4` 自动接管。

**Tech Stack:** 同 Phase 1。无需新依赖。

**前置依赖:** Phase 1 完成（AnimationRegistry、CanvasAnimation 基类、chapters.json 扩展 schema、AnimationRegistry 工厂签名）。

**后续依赖:** Phase 3 搜索功能依赖本阶段补全的标题/正文；Phase 4 验收依赖本阶段所有 chapter 的 slide 数 ≥ 20。

---

## 关键约定（执行每章前先读完）

- 每章 20-30 张 slide，严格按这个结构顺序：
  1. `cover` — 章节封面
  2. `content` — 为什么需要本章（引入）
  3-7. `content` — 核心定义/子概念分页
  8. `animation` — 核心机制演示
  9-12. `content` / `code` — 案例 + 代码
  13. `concepts` / `comparison` — 概念卡 / 对比表
  14-17. `content` — 进阶、陷阱、最佳实践
  18-19. `content` / `timeline` / `flow` — 发展历程/工作流程
  20. `code` — 完整可运行示例
  21-22. `content` — 小结（4-6 条要点）
  23. `quiz` — 章节测验
- 至少 1 张代码 slide（Python，紧贴主题）
- 至少 1 张 `concepts` 或 `comparison` slide
- quiz 至少 5 题、真实迷惑项、中英术语
- **技术准确性 QA（关键）**：每章写完后必须对照 `data/source/ch{n}.md` 核对所有技术陈述、代码可运行性、quiz 答案

---

## Task 1: ch2 — 智能体发展史（完整样板）

**Files:**
- Create: `data/source/ch2.md`
- Modify: `data/chapters.json`
- Modify: `data/quiz-data.json`
- Create: `js/animations/ch2-history-timeline.js`
- Modify: `js/slides-main.js`

- [ ] **Step 1: 抽取 ch2 源文**

```bash
python3 -c "
import re
html = open('/home/anan/桌面/hello-agents-ppt/原始文档/Hello-Agents.html').read()
m = re.search(r'第二章 智能体发展史(.*?)第三章 大语言模型基础', html, re.DOTALL)
if m:
    open('/home/anan/桌面/hello-agents-ppt/data/source/ch2.md', 'w').write(m.group(1))
    print('ch2 extracted')
else:
    print('selector failed, check HTML structure')
"
```

清理 markdown。

- [ ] **Step 2: 在 chapters.json 追加 ch2**

在 `chapters` 数组最前插入 ch2：

```json
{
  "id": "ch2",
  "title": "智能体发展史",
  "subtitle": "从符号主义到 LLM 驱动的智能体演进",
  "icon": "📜",
  "estimatedMinutes": 30,
  "tags": ["历史", "演进", "基础"],
  "slides": [
    { "type": "cover", "title": "第二章", "subtitle": "智能体发展史", "speakerNotes": "用 7 个里程碑事件串起 70 年" },
    { "type": "content", "title": "为什么要了解历史？",
      "content": "理解智能体 70 年的演进不是考古，而是看清**当下技术选择的来路**。\n\n每一次范式跃迁都回应了前一代的核心局限：\n• 符号主义 → 知识获取瓶颈\n• 专家系统 → 维护成本\n• 强化学习 → 样本效率\n• 深度学习 → 缺乏可解释推理\n• LLM Agent → 幻觉与工具使用" },
    { "type": "content", "title": "1950s：图灵测试与达特茅斯会议",
      "content": "**1950 年**：图灵发表《计算机器与智能》，提出'图灵测试'——如果机器的回答与人类无法区分，则认为它具有智能。\n\n**1956 年**：达特茅斯会议首次提出'人工智能'这一术语，参会者包括 McCarthy、Minsky、Shannon 等先驱。\n\n[提示] 图灵测试至今仍是衡量机器智能的参考标准，但批评者指出它只测试行为相似性，不要求真正理解。" },
    { "type": "content", "title": "1960s：ELIZA 与第一个聊天机器人",
      "content": "**1966 年**：MIT 的 Weizenbaum 创建 **ELIZA**，模拟罗杰斯心理治疗师。\n\n工作原理：\n• 用模式匹配识别关键词\n• 把用户陈述转回问句\n• 没有真正的'理解'\n\n但 ELIZA 让 Weizenbaum 的秘书深信它在理解自己——这暴露了人类对机器智能的过度拟人化倾向。\n\n[警告] 现代 LLM Agent 比 ELIZA 强大得多，但同样存在'用户误以为它在理解'的风险。" },
    { "type": "content", "title": "1980s：专家系统的兴衰",
      "content": "**专家系统**（Expert System）是 80 年代 AI 商业化的代表，如 MYCIN（医疗诊断）、XCON（计算机配置）。\n\n工作方式：\n• 知识库：人工编写的 if-then 规则（数千条）\n• 推理机：基于规则做前向/后向推理\n\n**衰落原因**：\n• 知识获取瓶颈：每加一条规则都需要知识工程师介入\n• 维护成本爆炸：规则之间相互矛盾\n• 脆弱性：遇到规则外的输入就失效\n\n教训：知识应该可学习，而非全部硬编码。" },
    { "type": "content", "title": "1990s-2010s：强化学习与游戏 AI",
      "content": "**1997 年**：IBM **Deep Blue** 以 3.5:2.5 战胜国际象棋世界冠军卡斯帕罗夫，靠暴力搜索 + 手工评估函数。\n\n**2016 年**：DeepMind **AlphaGo** 以 4:1 战胜围棋冠军李世石。\n\nAlphaGo 颠覆了范式：\n• 策略网络：从人类棋谱学习'像人一样下'\n• 价值网络：评估局面胜率\n• 蒙特卡洛树搜索（MCTS）\n\n这是**学习驱动的智能体**第一次在复杂博弈中超越人类。\n\n[成功] AlphaGo 启发了后续所有 RL-based Agent。" },
    { "type": "content", "title": "2017：Transformer 革命",
      "content": "**2017 年**：Google 发表《Attention Is All You Need》，提出 **Transformer** 架构。\n\n核心创新：\n• 抛弃 RNN 的序列依赖，用**自注意力**让每个 token 直接看所有其他 token\n• 支持大规模并行训练\n• 训练出的表示（embedding）成为通用特征\n\nTransformer 统治了 NLP，**也成了今天所有 LLM Agent 的基础**：LLM 用它推理、视觉 Transformer（ViT）让它进入视觉、多模态把它扩展到图文音。\n\n没有 Transformer 就没有 ChatGPT，没有 LLM Agent。" },
    { "type": "content", "title": "2020s：LLM Agent 爆发",
      "content": "**2020 年**：GPT-3（175B 参数）展现少样本学习能力。\n\n**2022 年 11 月**：ChatGPT 上线，2 个月内月活突破 1 亿。\n\n**2023 年**：**AutoGPT**、**BabyAGI** 让 LLM 自主规划任务、调用工具——**LLM Agent** 概念正式兴起。\n\n**2024-2026**：\n• Agent 框架爆发：LangChain、AutoGen、CrewAI\n• 多模态 Agent：能看、能听、能动手\n• 协议标准化：MCP、A2A\n\n我们正处在 LLM Agent 时代的早期。\n\n[提示] 接下来章节会展开这些技术。" },
    { "type": "animation", "title": "智能体发展时间线", "animation": "ch2-history-timeline",
      "media": { "video": "ch2/history-timeline.mp4", "canvasFallback": true },
      "caption": "点击每个里程碑查看详情" },
    { "type": "content", "title": "三次范式跃迁",
      "content": "回顾 70 年历史，可以总结出**三次范式跃迁**：\n\n**1. 符号主义 → 统计学习（1990s）**\n从硬编码规则到从数据中学习参数。代表：SVM、HMM。\n\n**2. 统计学习 → 深度学习（2012）**\n从手工特征到端到端表示学习。代表：AlexNet、ResNet。\n\n**3. 深度学习 → LLM Agent（2023+）**\n从专用模型到通用基础模型 + 工具调用。代表：GPT-4、Claude。\n\n每次跃迁都源于**对前一代局限的突破**。" },
    { "type": "content", "title": "案例：Siri 的 13 年演进",
      "content": "**2011**：Siri 第一代，基于 Nuance 语音识别 + 手工命令模板。\n\n**2018**：加入神经网络语音识别，错误率下降 50%。\n\n**2024**：Siri 接入 Apple Intelligence，引入 LLM 对话与工具调用。\n\n**启示**：\n• 同一个产品，13 年间技术栈完全换血\n• 今天用的 Agent 方案，5 年后看可能同样原始" },
    { "type": "code", "title": "ELIZA 的极简 Python 实现",
      "language": "python",
      "code": "import re\nimport random\n\nclass SimpleEliza:\n    \"\"\"简化版 ELIZA：用模式匹配把用户陈述转为问句\"\"\"\n    def __init__(self):\n        self.patterns = [\n            (r\"I need (.*)\", [\"Why do you need {0}?\", \"What would happen if you got {0}?\"]),\n            (r\"I am (.*)\", [\"How long have you been {0}?\", \"Why are you {0}?\"]),\n            (r\"my (.*)\", [\"Your {0}?\", \"Why do you say your {0}?\"]),\n            (r\"hello|hi\", [\"Hello. How are you feeling today?\"]),\n        ]\n\n    def respond(self, user_input):\n        for pattern, responses in self.patterns:\n            match = re.search(pattern, user_input, re.IGNORECASE)\n            if match:\n                template = random.choice(responses)\n                return template.format(*match.groups()) if match.groups() else template\n        return \"Tell me more about that.\"\n\n# 演示\neliza = SimpleEliza()\nprint(eliza.respond(\"I am sad\"))     # How long have you been sad?\nprint(eliza.respond(\"I need help\"))  # Why do you need help?",
      "explanation": "虽然只有 30 行，但 ELIZA 核心机制齐全：模式匹配 + 模板填充。1966 年 Lisp 版本 200 行；今天 LLM 几行就能更自然——但代价是失去对输出的可控性。" },
    { "type": "content", "title": "历史给我们的教训",
      "content": "70 年历史反复印证了几个设计原则：\n\n• **不要硬编码知识**——专家系统的失败\n• **学习优于规则**——AlphaGo 战胜 Deep Blue\n• **通用优于专用**——LLM 取代专用 NLP\n• **Agent = 模型 + 工具 + 记忆 + 规划**\n\n[提示] 这些原则贯穿后续所有章节。" },
    { "type": "content", "title": "本章小结",
      "content": "智能体发展历经 70 年，跨越**符号主义、专家系统、强化学习、深度学习、LLM Agent** 五个阶段。\n\n关键里程碑：图灵测试（1950）、ELIZA（1966）、专家系统（1980s）、Deep Blue（1997）、AlphaGo（2016）、Transformer（2017）、GPT-3（2020）、ChatGPT（2022）、AutoGPT（2023）。\n\n核心教训：**可学习 > 硬编码**，**通用 > 专用**，**能力 = 模型 + 工具 + 记忆**。\n\n参考 Hello-Agents 第二章" },
    { "type": "quiz", "title": "知识测验" }
  ],
  "hasAnimation": true,
  "hasQuiz": true
}
```

- [ ] **Step 3: 创建 ch2 Canvas 动画**

`js/animations/ch2-history-timeline.js`:
```js
import { CanvasAnimation } from './canvas-animation.js';
import { registerAnimation } from './animation-registry.js';

const MILESTONES = [
    { year: '1950', name: '图灵测试', desc: '图灵提出"机器能思考吗？"' },
    { year: '1956', name: '达特茅斯', desc: 'AI 学科诞生' },
    { year: '1966', name: 'ELIZA', desc: '第一个聊天机器人' },
    { year: '1980', name: '专家系统', desc: 'AI 商业化尝试' },
    { year: '1997', name: 'Deep Blue', desc: '战胜国际象棋冠军' },
    { year: '2016', name: 'AlphaGo', desc: '强化学习突破' },
    { year: '2017', name: 'Transformer', desc: '"Attention Is All You Need"' },
    { year: '2022', name: 'ChatGPT', desc: 'LLM Agent 时代开启' }
];

class Ch2HistoryTimeline extends CanvasAnimation {
    constructor() { super(); this.selectedIndex = -1; }
    init(canvas) {
        super.init(canvas);
        this.canvas.addEventListener('click', (e) => this._handleClick(e));
        this.draw();
    }
    play() {} step() {}
    reset() { this.selectedIndex = -1; this.draw(); }
    setSpeed(v) {}

    _handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left, y = e.clientY - rect.top;
        const positions = this._getPositions();
        for (let i = 0; i < positions.length; i++) {
            const dx = x - positions[i].x, dy = y - positions[i].y;
            if (Math.sqrt(dx*dx + dy*dy) <= 22) { this.selectedIndex = this.selectedIndex === i ? -1 : i; this.draw(); return; }
        }
    }

    _getPositions() {
        const padX = 60;
        const usableW = this.width - 2 * padX;
        return MILESTONES.map((_, i) => ({
            x: padX + (i / (MILESTONES.length - 1)) * usableW,
            y: this.height * 0.45
        }));
    }

    draw() {
        const ctx = this.ctx, w = this.width, h = this.height;
        const dark = this.isDarkTheme();
        const bg = dark ? '#1E293B' : '#F8FAFC';
        const text = dark ? '#F8FAFC' : '#0F172A';
        const sub = dark ? '#CBD5E1' : '#475569';
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        const positions = this._getPositions();
        ctx.strokeStyle = dark ? '#475569' : '#CBD5E1';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(positions[0].x, positions[0].y);
        ctx.lineTo(positions[positions.length - 1].x, positions[positions.length - 1].y);
        ctx.stroke();

        positions.forEach((p, i) => {
            const m = MILESTONES[i], sel = this.selectedIndex === i;
            ctx.beginPath();
            ctx.arc(p.x, p.y, sel ? 26 : 20, 0, Math.PI * 2);
            ctx.fillStyle = sel ? '#4F46E5' : (dark ? '#8B5CF6' : '#A78BFA');
            ctx.fill();
            ctx.strokeStyle = dark ? '#0F172A' : '#FFFFFF';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.fillStyle = text;
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(m.year, p.x, p.y + 30);
            ctx.font = '11px sans-serif';
            ctx.fillText(m.name, p.x, p.y - 50);
        });

        if (this.selectedIndex >= 0) {
            const m = MILESTONES[this.selectedIndex];
            ctx.fillStyle = dark ? '#334155' : '#FFFFFF';
            ctx.strokeStyle = '#4F46E5';
            ctx.lineWidth = 2;
            this.roundRect(ctx, 40, h - 100, w - 80, 70, 8);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = text;
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(`${m.year} · ${m.name}`, 60, h - 85);
            ctx.font = '12px sans-serif';
            ctx.fillStyle = sub;
            ctx.fillText(m.desc, 60, h - 60);
        } else {
            ctx.fillStyle = sub;
            ctx.font = '13px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('点击时间线节点查看详情', w / 2, h - 30);
        }
    }
}

registerAnimation('ch2-history-timeline', () => new Ch2HistoryTimeline());
```

- [ ] **Step 4: 在 slides-main.js 添加 import**

```js
import './animations/ch2-history-timeline.js';
```

- [ ] **Step 5: 在 quiz-data.json 添加 ch2 题库**

```json
"ch2": [
    {
        "id": "ch2-q1",
        "type": "single",
        "question": "图灵测试的核心思想是什么？",
        "options": [
            { "id": "A", "text": "机器必须通过图灵编写的考试" },
            { "id": "B", "text": "如果人类无法区分机器与人类的回答，则认为机器具有智能" },
            { "id": "C", "text": "机器能下棋战胜人类冠军" },
            { "id": "D", "text": "机器能在数学竞赛中得满分" }
        ],
        "answer": "B",
        "explanation": "图灵测试的核心是行为相似性判断——如果人类与机器对话后无法可靠地区分，则认为机器通过测试。"
    },
    {
        "id": "ch2-q2",
        "type": "multiple",
        "question": "以下哪些是专家系统衰落的原因？（多选）",
        "options": [
            { "id": "A", "text": "知识获取瓶颈——每条规则都需要人工编写" },
            { "id": "B", "text": "维护成本高——规则之间容易相互矛盾" },
            { "id": "C", "text": "对规则外的输入表现脆弱" },
            { "id": "D", "text": "硬件速度太慢" }
        ],
        "answer": "ABC",
        "explanation": "硬件速度不是专家系统的瓶颈（80 年代已有足够算力），真正的瓶颈是知识工程成本与系统的脆弱性。"
    },
    {
        "id": "ch2-q3",
        "type": "judge",
        "question": "AlphaGo 战胜李世石主要靠暴力搜索，与 Deep Blue 本质相同。",
        "answer": false,
        "explanation": "AlphaGo 的关键创新是用策略网络和价值网络做'学习驱动的搜索'，而非像 Deep Blue 那样靠手工评估函数。两者方法论截然不同。"
    },
    {
        "id": "ch2-q4",
        "type": "single",
        "question": "Transformer 架构最重要的贡献是什么？",
        "options": [
            { "id": "A", "text": "首次让神经网络在 ImageNet 上超越人类" },
            { "id": "B", "text": "用自注意力替代 RNN，让 token 之间可直接交互" },
            { "id": "C", "text": "发明了反向传播算法" },
            { "id": "D", "text": "首次让机器通过图灵测试" }
        ],
        "answer": "B",
        "explanation": "Transformer 的核心创新是用 self-attention 取代 RNN 的序列依赖，让所有 token 可以并行计算并直接相互 attention。"
    },
    {
        "id": "ch2-q5",
        "type": "single",
        "question": "ELIZA 之所以'骗'了用户，根本原因是什么？",
        "options": [
            { "id": "A", "text": "它真正理解了用户" },
            { "id": "B", "text": "它能调用外部数据库" },
            { "id": "C", "text": "它通过模式匹配把陈述转为问句，引发用户自我投射" },
            { "id": "D", "text": "它有强大的语音识别能力" }
        ],
        "answer": "C",
        "explanation": "ELIZA 没有真实理解，但通过把用户陈述转回问句（如'我难过'→'你为什么难过？'），引导用户自己填充意义——这是心理学上'反射式倾听'的副作用。"
    },
    {
        "id": "ch2-q6",
        "type": "multiple",
        "question": "本章提到的'三次范式跃迁'包括哪些？（多选）",
        "options": [
            { "id": "A", "text": "符号主义 → 统计学习" },
            { "id": "B", "text": "统计学习 → 深度学习" },
            { "id": "C", "text": "深度学习 → LLM Agent" },
            { "id": "D", "text": "CPU → GPU" }
        ],
        "answer": "ABC",
        "explanation": "CPU 到 GPU 是硬件跃迁，不算范式。三次范式跃迁都涉及'知识表示与获取方式'的根本变化。"
    }
]
```

- [ ] **Step 6: 验证 + 技术 QA**

```bash
npm test
cd /home/anan/桌面/hello-agents-ppt && python3 -m http.server 8080
```

浏览器打开 `http://localhost:8080/slides.html?chapter=ch2`，验证：17 张 slide、时间线点击、quiz 可作答。

**QA**：对照 `data/source/ch2.md` 核对所有年份（1950/1956/1966/1980/1997/2016/2017/2020/2022/2023）、ELIZA/专家系统/AlphaGo 描述准确性、quiz 答案与解析。

- [ ] **Step 7: Commit**

```bash
git add data/chapters.json data/quiz-data.json data/source/ch2.md js/animations/ch2-history-timeline.js js/slides-main.js
git commit -m "feat(content): add ch2 智能体发展史 (17 slides, 6 quiz, timeline animation)"
```

---

## Task 2: ch3 — 大语言模型基础

复用 Task 1 模板，章节特定内容：
- 概念：Token、Embedding、Transformer、Attention、Prompt、上下文窗口
- 代码：1 张 Python 用 HuggingFace `transformers` 调用 GPT-2
- 动画：**Canvas 注意力权重热图**（点击查询词看对其他词的注意力强度）
- quiz：8 题

## Task 3: ch5 — 低代码平台搭建

复用 Task 1 模板：
- 概念：Coze、Dify、FastGPT、可视化编排、知识库
- 代码：1 张 Coze Bot DSL（YAML）
- 动画：**视频占位**（`media.video: "ch5/coze-demo.mp4"`，canvas 占位提示"放入视频即可"）
- quiz：5 题

## Task 4: ch6 — 框架开发实践

复用 Task 1 模板：
- 概念：LangChain、LlamaIndex、AutoGen、CrewAI
- 代码：1 张 LangChain LCEL 示例
- 动画：**Canvas 框架调用栈对比图**（4 个框架并排点击查看）
- quiz：6 题

## Task 5: ch9 — 上下文工程

复用 Task 1 模板：
- 概念：上下文窗口、KV 缓存、滑动窗口、摘要、检索增强
- 代码：1 张 Python 滑动窗口示例
- 动画：**Canvas 上下文窗口可视化**（token 流入/流出动画）
- quiz：7 题

## Task 6: ch11 — Agentic-RL

复用 Task 1 模板：
- 概念：SFT、RLHF、DPO、GRPO、奖励建模
- 代码：1 张简化 PPO 训练循环
- 动画：**Canvas 奖励信号反馈环**（Policy↔Reward 流动）
- quiz：7 题

## Task 7: ch12 — 性能评估

复用 Task 1 模板：
- 概念：准确率、鲁棒性、AgentBench、GAIA、HELM
- 代码：1 张 Python 评估指标计算
- 动画：**Canvas 六维评估雷达图**（可拖动权重）
- quiz：6 题

## Task 8: ch13 — 智能旅行助手（增强到 25 slides）

复用 Task 1 模板：
- 现有 ch13（13 slides）保留并扩展
- 新增 12 张：MCP 接入、多 Agent 协作流程、Planner/Booking/Advisor Agent 详解
- 代码：1 张 Python 多 Agent 编排
- 动画：**复用现有 + 增强**（为新增的协作流程做一个小动画）
- quiz：从 3 题扩展到 6 题

## Task 9: ch14 — DeepResearch

复用 Task 1 模板：
- 概念：任务分解、并行检索、报告生成、引用追溯
- 代码：1 张 Python 任务树展开
- 动画：**Canvas 任务树展开**（点击父任务展开子任务）
- quiz：6 题

## Task 10: ch15 — 赛博小镇

复用 Task 1 模板：
- 概念：Generative Agents、记忆-反思-规划、社交模拟
- 代码：1 张 Python Agent 反思循环
- 动画：**Canvas 小镇网格**（Agent 移动 + 关系图）
- quiz：6 题

## Task 11: ch16 — 毕业设计

复用 Task 1 模板：
- 概念：项目模板、评估标准、案例分析
- 代码：1 张完整项目骨架
- 动画：**视频占位**（优秀毕设 demo 视频）
- quiz：5 题

---

## Task 12: 端到端验证

- [ ] **Step 1: 全测试通过**

```bash
npm test
```

- [ ] **Step 2: 启动服务器 + 全章过一遍**

```bash
python3 -m http.server 8080
```

人工操作：首页 16 章、每章 20+ slide、至少 1 个动画、暗色主题正常、ch1/ch4/ch10 做完 quiz 验证分数。

- [ ] **Step 3: 数据完整性自检**

```bash
node -e "
const data = require('/home/anan/桌面/hello-agents-ppt/data/chapters.json');
const errors = [];
data.chapters.forEach(c => {
  if (c.slides.length < 20) errors.push(\`\${c.id}: 仅 \${c.slides.length} 张 slide\`);
  if (c.hasQuiz && !c.slides.some(s => s.type === 'quiz')) errors.push(\`\${c.id}: 标记 hasQuiz 但无 quiz slide\`);
  if (c.hasAnimation && !c.slides.some(s => s.type === 'animation')) errors.push(\`\${c.id}: 标记 hasAnimation 但无 animation slide\`);
});
if (errors.length) { console.error('FAIL:'); errors.forEach(e => console.error('  ' + e)); process.exit(1); }
console.log('All 16 chapters pass structural check');
"
```

Expected: `All 16 chapters pass structural check`

- [ ] **Step 4: 最终 commit**

```bash
git add -A
git commit -m "feat(content): complete all 16 chapters (230+ slides, 60+ quiz, 8 new animations)"
```

---

## Phase 2 验收门槛

- ✅ 16 章全部出现在首页且每章 slide 数 ≥ 20
- ✅ 每章 quiz 题数 ≥ 5
- ✅ 每章完成技术准确性 QA
- ✅ 8 个新 Canvas 动画在亮/暗主题下都正常显示
- ✅ 视频占位章节有清晰的"放入 mp4 即可启用"提示
- ✅ "开始学习"按钮可顺序通读 16 章
- ✅ `npm test` 全部通过

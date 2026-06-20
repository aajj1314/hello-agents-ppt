/**
 * CH8: Memory Hierarchy + RAG Pipeline — Dual-View Interactive Canvas
 *
 * Visual concept (matches ch8.md "第八章 记忆与检索"):
 *   - Top half    · 人类记忆层次图 (认知心理学):
 *                    长期记忆 (LLM 知识库 + 长期 RAG 索引)
 *                      ↑ 强化/整合 (consolidate)
 *                    工作记忆 (messages[] 当前对话 context window · 7±2)
 *                      ↑ 注意/编码 (encode)
 *                    感觉记忆 (当前 query · 原始输入)
 *                  每层右侧映射到"Agent 里的实现"。
 *                  播放时 4 s 的"记忆强化"动画: 三层依次被点亮,
 *                  强化粒子 (小圆点) 从感觉层逐级上升到长期层。
 *   - Bottom half · RAG 流水线 (重点):
 *                    Query → Embedding → 向量库检索 → Top-K 片段
 *                          → 拼接 prompt → LLM 生成
 *                  6 步横向排列, 每步: 圆角矩形 + 首字母 icon + 标签。
 *                  流动粒子 (小圆点) 从左向右穿过, 模拟数据流。
 *                  鼠标 hover 任意步骤 → 高亮 + 弹 tooltip
 *                  (显示该步骤的代码片段或耗时)。
 *   - Play mode   · 上半部 "记忆强化" 4 s + 下半部 "数据流" 4 s,
 *                  整体循环, 通过 phase 变量切换。
 *   - Step mode   · 推进 1 个 phase。
 *   - Hover       · RAG 步骤高亮 + tooltip;
 *                  记忆层次被 hover 时也高亮对应层。
 */
import { CanvasAnimation } from './canvas-animation.js';
import { registerAnimation } from './animation-registry.js';

class Ch8Memory extends CanvasAnimation {
    constructor() {
        super();
        this.isPlaying = false;
        this.speed = 1;
        this.animId = null;
        this.lastStepTime = 0;
        this.hover = { type: 'none', index: -1 };

        // 0 = 初始, 1..3 = 感觉/工作/长期记忆被强化中, 4 = 强化完成
        // 5..7 = RAG 流水线 1..3 阶段, 8 = 全部完成
        this.phase = 0;
        this.cycleStart = 0;   // timestamp for the current 4 s sub-cycle
        this.particles = [];   // RAG 数据流粒子
        this.ascendParticles = [];  // 记忆层次上升粒子
        this.lastSpawn = 0;

        // 人类记忆三层 (自下而上: 感觉 → 工作 → 长期)
        this.memLayers = [
            {
                key: 'sensory', title: '感觉记忆', color: '#F59E0B',
                meta: '0.5-3 秒 · 容量巨大',
                agent: '当前 query / 用户输入',
                code: 'user_input = "注意力机制"'
            },
            {
                key: 'working', title: '工作记忆', color: '#3B82F6',
                meta: '15-30 秒 · 7±2 项',
                agent: 'messages[] 上下文窗口',
                code: 'messages.append(\n  {"role":"user","content":q})'
            },
            {
                key: 'longterm', title: '长期记忆', color: '#10B981',
                meta: '可持续终生 · 几乎无限',
                agent: 'LLM 知识 + 长期 RAG 索引',
                code: 'ltm.add(\n  item, importance=0.8)'
            }
        ];

        // RAG 流水线 6 步
        this.ragSteps = [
            {
                key: 'query', letter: 'Q', title: 'Query',
                desc: '用户问题',
                code: 'q = "什么是 RAG?"',
                time: '~1 ms',
                color: '#6366F1'
            },
            {
                key: 'embed', letter: 'E', title: 'Embedding',
                desc: '向量化',
                code: 'vec = embedder.encode(q)\n# shape=(1, 1024)',
                time: '~80 ms',
                color: '#8B5CF6'
            },
            {
                key: 'retrieve', letter: 'R', title: '向量库检索',
                desc: 'Top-K 召回',
                code: 'hits = qdrant.search(\n  vec, top_k=20)',
                time: '~30 ms',
                color: '#0EA5E9'
            },
            {
                key: 'topk', letter: 'K', title: 'Top-K 片段',
                desc: '重排序 / 截断',
                code: 'topk = rerank(\n  hits, k=5)',
                time: '~120 ms',
                color: '#10B981'
            },
            {
                key: 'prompt', letter: 'P', title: '拼接 Prompt',
                desc: '上下文 + 问题',
                code: 'prompt = sys + ctx\n + "\\nQ: " + q',
                time: '~2 ms',
                color: '#F59E0B'
            },
            {
                key: 'llm', letter: 'G', title: 'LLM 生成',
                desc: '流式回答',
                code: 'for tok in llm.stream(\n  prompt):\n  yield tok',
                time: '~1.5 s',
                color: '#EC4899'
            }
        ];

        // 强化描述 (按 phase 切换)
        this.memPhaseLabels = [
            '阶段 0: 准备 — 等待 query 注入',
            '阶段 1: 感觉记忆 — 原始输入被暂存 (0.5-3 秒)',
            '阶段 2: 工作记忆 — 重要信息被注意/编码进 messages[]',
            '阶段 3: 长期记忆 — consolidate() 后写入 LTM 索引',
            '阶段 4: 记忆强化完成 — 可被 RAG 召回'
        ];
        this.ragPhaseLabels = [
            'RAG 阶段 0: 待机 — 等待 query',
            'RAG 阶段 1: Q → E — query 被向量化',
            'RAG 阶段 2: E → R → K — 检索 Top-K 片段',
            'RAG 阶段 3: K → P — 上下文拼接到 prompt',
            'RAG 阶段 4: P → G — LLM 流式生成回答'
        ];
    }

    init(canvas) {
        super.init(canvas);
        this._setupControls();
        this._setupCanvasEvents();
        window.addEventListener('resize', () => { this._resize(); this.draw(); });
        this.draw();
    }

    _setupControls() {
        const animId = 'ch8-memory';
        const playBtn = document.getElementById('btn-play-' + animId);
        const resetBtn = document.getElementById('btn-reset-' + animId);
        const stepBtn = document.getElementById('btn-step-' + animId);
        const speedSlider = document.getElementById('speed-' + animId);
        if (playBtn) playBtn.addEventListener('click', () => this.togglePlay());
        if (resetBtn) resetBtn.addEventListener('click', () => this.reset());
        if (stepBtn) stepBtn.addEventListener('click', () => this.stepForward());
        if (speedSlider) speedSlider.addEventListener('input', (e) => {
            this.speed = parseFloat(e.target.value) || 1;
        });
    }

    _setupCanvasEvents() {
        if (!this.canvas) return;
        this.canvas.addEventListener('mousemove', (e) => this._handleHover(e));
        this.canvas.addEventListener('mouseleave', () => {
            if (this.hover.type !== 'none') {
                this.hover = { type: 'none', index: -1 };
                this.canvas.style.cursor = 'default';
                this.draw();
            } else {
                this.canvas.style.cursor = 'default';
            }
        });
    }

    _handleHover(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const hit = this._hitTest(mx, my);
        const changed = hit.type !== this.hover.type || hit.index !== this.hover.index;
        this.hover = hit;
        this.canvas.style.cursor = hit.type !== 'none' ? 'pointer' : 'default';
        if (changed) this.draw();
    }

    _hitTest(mx, my) {
        const layout = this._computeLayout();
        for (let i = 0; i < layout.ragRects.length; i++) {
            const r = layout.ragRects[i];
            if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
                return { type: 'rag', index: i };
            }
        }
        for (let i = 0; i < layout.memRects.length; i++) {
            const r = layout.memRects[i];
            if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
                return { type: 'mem', index: i };
            }
        }
        return { type: 'none', index: -1 };
    }

    togglePlay() {
        this.isPlaying = !this.isPlaying;
        const btn = document.getElementById('btn-play-ch8-memory');
        if (btn) btn.textContent = this.isPlaying ? '⏸ 暂停' : '▶ 播放';
        if (this.isPlaying) {
            this.lastStepTime = 0;
            this.cycleStart = performance.now();
            this._loop();
        } else {
            cancelAnimationFrame(this.animId);
        }
    }

    _loop() {
        if (!this.isPlaying) return;
        const now = performance.now();
        const subDur = 4000 / this.speed;  // 每段 4 秒
        if (!this.cycleStart) this.cycleStart = now;

        // 上半部 (4s): phase 1..4
        // 下半部 (4s): phase 5..8
        const elapsed = now - this.cycleStart;
        const total = subDur * 2;
        if (elapsed >= total) {
            // loop
            this.cycleStart = now;
            this.particles = [];
            this.ascendParticles = [];
            this.lastSpawn = 0;
        }

        const inMem = elapsed < subDur;
        if (inMem) {
            // 上半部 phase: 0..4
            const t = elapsed / subDur;
            this.phase = Math.min(4, Math.floor(t * 4) + 1);
        } else {
            // 下半部 phase: 5..8
            const t = (elapsed - subDur) / subDur;
            this.phase = 5 + Math.min(3, Math.floor(t * 4));
        }

        // Spawn RAG 流水线粒子 (持续流动)
        this._spawnRagParticles(now);
        this._advanceRagParticles();

        // 强化阶段生成上升粒子
        this._spawnAscendParticles(now);
        this._advanceAscendParticles();

        this.draw();
        this.animId = requestAnimationFrame(() => this._loop());
    }

    _spawnRagParticles(now) {
        if (now - this.lastSpawn < 320 / this.speed) return;
        this.lastSpawn = now;
        const layout = this._computeLayout();
        const step = this.phase - 5; // 0..3
        // 粒子从第一个步骤开始, 但被锁定在 step 之后才显出"激活"色
        this.particles.push({
            segIdx: 0,
            seg: 0,
            stepReached: -1,
            color: '#6366F1'
        });
    }

    _advanceRagParticles() {
        const layout = this._computeLayout();
        const stepCount = this.ragSteps.length;
        const stepW = layout.ragStepW;
        const baseX = layout.ragBaseX;
        const yMid = layout.ragY + layout.ragH / 2;
        const stepActive = this.phase - 5; // 当前激活到第几步 (0..5)
        for (const p of this.particles) {
            p.seg += 0.012 * this.speed;
            if (p.seg >= 1) {
                p.seg = 0;
                p.segIdx++;
            }
            if (p.segIdx >= stepCount - 1) {
                p.done = true;
                continue;
            }
            p.x = baseX + p.segIdx * stepW + p.seg * stepW;
            p.y = yMid;
            p.stepReached = p.segIdx;
        }
        // 保留最新的 ~24 个粒子避免无限增长
        if (this.particles.length > 24) {
            this.particles = this.particles.filter(p => !p.done).slice(-24);
        } else {
            this.particles = this.particles.filter(p => !p.done);
        }
    }

    _spawnAscendParticles(now) {
        const layout = this._computeLayout();
        // 仅在 phase 1..3 期间从底层向上发送粒子
        if (this.phase < 1 || this.phase > 3) return;
        if (!this._lastAscend) this._lastAscend = 0;
        if (now - this._lastAscend < 600 / this.speed) return;
        this._lastAscend = now;
        // 从 phase-1 层 (即已点亮的最高层) 的中心发射
        const fromIdx = this.phase - 1;
        const from = layout.memRects[fromIdx];
        this.ascendParticles.push({
            fromIdx,
            t: 0,
            color: this.memLayers[fromIdx].color
        });
    }

    _advanceAscendParticles() {
        const layout = this._computeLayout();
        for (const p of this.ascendParticles) {
            p.t += 0.012 * this.speed;
        }
        this.ascendParticles = this.ascendParticles.filter(p => p.t < 1.0);
    }

    stepForward() {
        this.phase = Math.min(this.phase + 1, 8);
        // step 也清掉粒子, 让用户能逐段查看
        if (this.phase <= 4) {
            this.ascendParticles = [];
        } else {
            this.particles = [];
        }
        this.draw();
    }

    reset() {
        this.isPlaying = false;
        this.phase = 0;
        this.particles = [];
        this.ascendParticles = [];
        this.cycleStart = 0;
        this.lastStepTime = 0;
        this.lastSpawn = 0;
        this._lastAscend = 0;
        cancelAnimationFrame(this.animId);
        const btn = document.getElementById('btn-play-ch8-memory');
        if (btn) btn.textContent = '▶ 播放';
        this.draw();
    }

    setSpeed(v) { this.speed = v; }

    play() { if (!this.isPlaying) this.togglePlay(); }
    pause() { if (this.isPlaying) this.togglePlay(); }
    step() { this.stepForward(); }

    // ============================================================
    // Layout
    // ============================================================
    _computeLayout() {
        const w = this.width;
        const h = this.height;
        const titleH = 30;
        const bottomH = 30;
        const padX = 16;
        const top = titleH + 10;
        const bot = h - bottomH;
        const mainH = bot - top;

        // 上半部 (记忆) 占 45%, 下半部 (RAG) 占 55%
        const memH = mainH * 0.45;
        const ragH = mainH * 0.55;

        // --- 记忆层次布局 ---
        const memLeftW = Math.max(180, w * 0.36);
        const memRightW = Math.max(140, w * 0.22);
        const memGap = 12;
        const memCardX = padX;
        const memCardW = memLeftW;
        const agentX = memCardX + memCardW + memGap;
        const agentW = memRightW;

        const layerCount = this.memLayers.length;
        const memGapY = 8;
        const layerH = (memH - memGapY * (layerCount - 1)) / layerCount;
        const memRects = this.memLayers.map((m, i) => {
            // i=0 感觉记忆 (底), i=2 长期记忆 (顶)
            // 视觉上 i=0 在最下, i=2 在最上
            const y = top + (layerCount - 1 - i) * (layerH + memGapY);
            return { x: memCardX, y, w: memCardW, h: layerH, data: m, index: i };
        });

        // 强化箭头 (感觉→工作, 工作→长期)
        const arrows = [];
        for (let i = 0; i < layerCount - 1; i++) {
            const fromRect = memRects[i];
            const toRect = memRects[i + 1];
            arrows.push({
                x1: fromRect.x + fromRect.w / 2,
                y1: fromRect.y,
                x2: toRect.x + toRect.w / 2,
                y2: toRect.y + toRect.h,
                color: this.memLayers[i + 1].color
            });
        }

        // --- RAG 流水线布局 ---
        const ragY = top + memH + 10;
        const ragCardX = padX;
        const ragCardW = w - padX * 2;
        const ragCardH = ragH - 10;

        const stepCount = this.ragSteps.length;
        const stepGap = 10;
        const stepW = (ragCardW - stepGap * (stepCount - 1)) / stepCount;
        const ragStepH = ragCardH * 0.55;
        const ragRects = this.ragSteps.map((s, i) => ({
            x: ragCardX + i * (stepW + stepGap),
            y: ragY,
            w: stepW,
            h: ragStepH,
            data: s,
            index: i
        }));

        return {
            title: { x: w / 2, y: 16 },
            memSectionY: top,
            memH,
            memRects,
            arrows,
            agentX,
            agentW,
            agentItems: this.memLayers.map((m, i) => ({
                x: agentX,
                y: memRects[i].y,
                w: agentW,
                h: memRects[i].h,
                data: m,
                index: i
            })),
            // RAG
            ragY,
            ragH: ragCardH,
            ragBaseX: ragCardX + stepW / 2,
            ragStepW: stepW + stepGap,
            ragRects,
            stepGap
        };
    }

    // ============================================================
    // 绘制
    // ============================================================
    draw() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        const isDark = this.isDarkTheme();
        const bg = isDark ? '#0F172A' : '#F8FAFC';
        const textColor = isDark ? '#F1F5F9' : '#0F172A';
        const subColor = isDark ? '#94A3B8' : '#475569';
        const cardBg = isDark ? '#1E293B' : '#FFFFFF';
        const cardBorder = isDark ? '#334155' : '#E2E8F0';
        const innerBg = isDark ? '#0B1220' : '#F1F5F9';

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        const layout = this._computeLayout();

        // Title
        ctx.fillStyle = textColor;
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('人类记忆层次 ↔ Agent RAG 流水线', layout.title.x, layout.title.y);

        // Section labels
        ctx.fillStyle = subColor;
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('人类记忆层次 (认知心理学)', layout.memRects[0].x, layout.memSectionY - 4);
        ctx.fillText('RAG 流水线 (重点)', layout.ragRects[0].x, layout.ragY - 4);

        this._drawMemorySection(ctx, layout, { isDark, textColor, subColor, cardBg, cardBorder, innerBg });
        this._drawRagSection(ctx, layout, { isDark, textColor, subColor, cardBg, cardBorder, innerBg });

        // Tooltip
        this._drawTooltip(ctx, layout, { isDark, textColor, subColor, cardBg, cardBorder, innerBg });

        // Footer
        this._drawFooter(ctx, w, h, subColor, textColor);
    }

    _drawMemorySection(ctx, layout, theme) {
        const { isDark, textColor, subColor, cardBg, cardBorder, innerBg } = theme;

        // 三层卡
        layout.memRects.forEach((r) => this._drawMemoryLayer(ctx, r, theme));

        // Agent 实现映射 (右侧)
        layout.agentItems.forEach((r) => this._drawAgentMapping(ctx, r, theme));

        // 强化箭头
        layout.arrows.forEach((arr) => this._drawReinforceArrow(ctx, arr, theme));

        // 上升粒子
        this._drawAscendParticles(ctx, layout, theme);
    }

    _drawMemoryLayer(ctx, r, theme) {
        const { isDark, textColor, subColor, cardBg, cardBorder, innerBg } = theme;
        const lit = this.phase >= r.index + 1 && this.phase <= 4;   // 上半部阶段 (0..4)
        const isHover = this.hover.type === 'mem' && this.hover.index === r.index;
        const dim = (this.hover.type === 'mem' || this.hover.type === 'rag') && !isHover;

        ctx.globalAlpha = dim ? 0.5 : 1;

        // 卡
        ctx.fillStyle = cardBg;
        this.roundRect(ctx, r.x, r.y, r.w, r.h, 10);
        ctx.fill();

        const borderColor = isHover ? r.data.color : (lit ? r.data.color : cardBorder);
        const lineW = (isHover || lit) ? 1.8 : 1;
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = lineW;
        this.roundRect(ctx, r.x, r.y, r.w, r.h, 10);
        ctx.stroke();

        // 左侧色条
        ctx.fillStyle = r.data.color;
        ctx.fillRect(r.x, r.y + 6, 5, r.h - 12);

        // 文字
        ctx.fillStyle = textColor;
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(r.data.title, r.x + 14, r.y + 8);

        ctx.fillStyle = subColor;
        ctx.font = '10px sans-serif';
        ctx.fillText(r.data.meta, r.x + 14, r.y + 26);

        // "已强化" 角标
        if (lit) {
            ctx.fillStyle = r.data.color;
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText('✓ 已强化', r.x + r.w - 12, r.y + 8);
        }

        // 小代码片段预览
        ctx.fillStyle = subColor;
        ctx.font = '9px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(r.data.code, r.x + 14, r.y + r.h - 8);

        ctx.globalAlpha = 1;
    }

    _drawAgentMapping(ctx, r, theme) {
        const { isDark, textColor, subColor, cardBg, cardBorder, innerBg } = theme;
        const lit = this.phase >= r.index + 1 && this.phase <= 4;
        const isHover = this.hover.type === 'mem' && this.hover.index === r.index;
        const dim = (this.hover.type === 'mem' || this.hover.type === 'rag') && !isHover;

        ctx.globalAlpha = dim ? 0.5 : 1;

        // 标签标题
        ctx.fillStyle = subColor;
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('Agent 实现', r.x, r.y + 4);

        // 卡
        const cardY = r.y + 16;
        const cardH = r.h - 20;
        ctx.fillStyle = innerBg;
        this.roundRect(ctx, r.x, cardY, r.w, cardH, 6);
        ctx.fill();
        ctx.strokeStyle = lit ? r.data.color : cardBorder;
        ctx.lineWidth = 1;
        this.roundRect(ctx, r.x, cardY, r.w, cardH, 6);
        ctx.stroke();

        // Agent 文字
        ctx.fillStyle = textColor;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(r.data.agent, r.x + 8, cardY + 8);

        // 小图标
        ctx.fillStyle = r.data.color;
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        const icon = r.index === 0 ? '⌨' : (r.index === 1 ? '🧠' : '📚');
        ctx.fillText(icon, r.x + r.w - 8, cardY + 6);

        ctx.globalAlpha = 1;
    }

    _drawReinforceArrow(ctx, arr, theme) {
        const { isDark } = theme;
        const fromPhase = this.phase;
        // 箭头在 phase >= 2 时显示"工作→长期"被强化
        // 箭头在 phase >= 1 时显示"感觉→工作"被强化
        // 总体: phase >= fromPhase+1 时高亮
        const active = fromPhase >= 2 && arr.color === this.memLayers[1].color
                    || fromPhase >= 1 && arr.color === this.memLayers[2].color
                    || fromPhase >= 3;

        ctx.save();
        ctx.strokeStyle = active ? arr.color : (isDark ? '#475569' : '#CBD5E1');
        ctx.lineWidth = active ? 2.2 : 1.4;
        ctx.setLineDash(active ? [] : [4, 4]);

        // 贝塞尔
        const midY = (arr.y1 + arr.y2) / 2;
        ctx.beginPath();
        ctx.moveTo(arr.x1, arr.y1);
        ctx.bezierCurveTo(arr.x1, midY, arr.x2, midY, arr.x2, arr.y2);
        ctx.stroke();

        // 箭头头部
        if (active) {
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(arr.x2, arr.y2);
            ctx.lineTo(arr.x2 - 5, arr.y2 - 8);
            ctx.lineTo(arr.x2 + 5, arr.y2 - 8);
            ctx.closePath();
            ctx.fillStyle = arr.color;
            ctx.fill();
        }
        ctx.restore();

        // 标签
        ctx.fillStyle = active ? arr.color : theme.subColor;
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const labelX = Math.max(arr.x1, arr.x2) + 12;
        const labelY = midY;
        const label = arr.color === this.memLayers[2].color ? 'consolidate →' : 'encode →';
        ctx.fillText(label, labelX, labelY);
    }

    _drawAscendParticles(ctx, layout, theme) {
        for (const p of this.ascendParticles) {
            const fromRect = layout.memRects[p.fromIdx];
            const toRect = layout.memRects[p.fromIdx + 1];
            if (!toRect) continue;
            const midY = (fromRect.y + toRect.y + toRect.h) / 2;
            // 贝塞尔插值
            const t = p.t;
            const x1 = fromRect.x + fromRect.w / 2;
            const y1 = fromRect.y;
            const x2 = toRect.x + toRect.w / 2;
            const y2 = toRect.y + toRect.h;
            const u = 1 - t;
            const x = u * u * u * x1 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x2;
            const y = u * u * u * y1 + 3 * u * u * t * midY + 3 * u * t * t * midY + t * t * t * y2;
            const alpha = 1 - t * 0.3;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();
        }
    }

    _drawRagSection(ctx, layout, theme) {
        const { isDark, textColor, subColor, cardBg, cardBorder, innerBg } = theme;
        const stepActive = Math.max(0, this.phase - 5);  // 0..3 in RAG phase
        // 每阶段激活 2 步: phase 1 -> 步骤 0-1, phase 2 -> 步骤 2-3, phase 3 -> 步骤 4-5
        const litSteps = (stepActive + 1) * 2;

        // 步骤卡片
        layout.ragRects.forEach((r) => this._drawRagStep(ctx, r, theme, r.index < litSteps));

        // 连接箭头 (横向)
        for (let i = 0; i < layout.ragRects.length - 1; i++) {
            const a = layout.ragRects[i];
            const b = layout.ragRects[i + 1];
            const x1 = a.x + a.w;
            const x2 = b.x;
            const y = a.y + a.h / 2;
            const lit = i + 1 < litSteps;
            ctx.save();
            ctx.strokeStyle = lit ? a.data.color : (isDark ? '#475569' : '#CBD5E1');
            ctx.lineWidth = lit ? 2 : 1.2;
            ctx.setLineDash(lit ? [] : [3, 3]);
            ctx.beginPath();
            ctx.moveTo(x1, y);
            ctx.lineTo(x2 - 6, y);
            ctx.stroke();
            ctx.setLineDash([]);
            // 箭头头
            ctx.beginPath();
            ctx.moveTo(x2, y);
            ctx.lineTo(x2 - 6, y - 4);
            ctx.lineTo(x2 - 6, y + 4);
            ctx.closePath();
            ctx.fillStyle = lit ? a.data.color : (isDark ? '#475569' : '#CBD5E1');
            ctx.fill();
            ctx.restore();
        }

        // 流动粒子
        this._drawRagParticles(ctx, layout, theme);
    }

    _drawRagStep(ctx, r, theme, lit) {
        const { isDark, textColor, subColor, cardBg, cardBorder, innerBg } = theme;
        const isHover = this.hover.type === 'rag' && this.hover.index === r.index;
        const dim = (this.hover.type === 'rag' || this.hover.type === 'mem') && !isHover;

        ctx.globalAlpha = dim ? 0.55 : 1;

        // 卡
        ctx.fillStyle = cardBg;
        this.roundRect(ctx, r.x, r.y, r.w, r.h, 10);
        ctx.fill();

        const borderColor = isHover ? r.data.color : (lit ? r.data.color : cardBorder);
        const lineW = (isHover || lit) ? 1.8 : 1;
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = lineW;
        this.roundRect(ctx, r.x, r.y, r.w, r.h, 10);
        ctx.stroke();

        // 高亮 glow
        if (isHover) {
            ctx.save();
            ctx.shadowColor = r.data.color;
            ctx.shadowBlur = 12;
            ctx.strokeStyle = r.data.color;
            ctx.lineWidth = 2;
            this.roundRect(ctx, r.x, r.y, r.w, r.h, 10);
            ctx.stroke();
            ctx.restore();
        }

        // 圆形 icon (首字母)
        const iconR = 14;
        const iconY = r.y + 22;
        const iconX = r.x + 24;
        ctx.beginPath();
        ctx.arc(iconX, iconY, iconR, 0, Math.PI * 2);
        ctx.fillStyle = r.data.color;
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(r.data.letter, iconX, iconY + 1);

        // 标题
        ctx.fillStyle = textColor;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(r.data.title, r.x + 46, r.y + 10);

        // 描述
        ctx.fillStyle = subColor;
        ctx.font = '9px sans-serif';
        ctx.fillText(r.data.desc, r.x + 46, r.y + 24);

        // 步骤编号
        ctx.fillStyle = subColor;
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText('STEP ' + (r.index + 1), r.x + r.w - 8, r.y + 6);

        // 耗时
        ctx.fillStyle = r.data.color;
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(r.data.time, r.x + r.w - 8, r.y + r.h - 6);

        // 底部进度条
        const barY = r.y + r.h - 4;
        const barW = r.w - 12;
        ctx.fillStyle = isDark ? '#1E293B' : '#E2E8F0';
        ctx.fillRect(r.x + 6, barY, barW, 2);
        if (lit) {
            ctx.fillStyle = r.data.color;
            ctx.fillRect(r.x + 6, barY, barW, 2);
        }

        ctx.globalAlpha = 1;
    }

    _drawRagParticles(ctx, layout, theme) {
        const { isDark } = theme;
        const stepActive = Math.max(0, this.phase - 5);
        for (const p of this.particles) {
            // 让粒子在"被激活"的步骤上高亮
            const isActive = p.stepReached <= stepActive * 2 + 1;
            ctx.save();
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = isActive ? p.color : (isDark ? '#475569' : '#94A3B8');
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1.4;
            ctx.stroke();
            ctx.restore();
        }
    }

    _drawTooltip(ctx, layout, theme) {
        const { isDark, textColor, subColor, cardBg, cardBorder, innerBg } = theme;
        if (this.hover.type === 'rag') {
            const r = layout.ragRects[this.hover.index];
            const step = this.ragSteps[this.hover.index];
            const tipW = 200;
            const tipH = 80;
            // 优先向上/右侧
            let tx = r.x + r.w / 2 - tipW / 2;
            let ty = r.y - tipH - 8;
            if (ty < 30) ty = r.y + r.h + 8;
            if (tx + tipW > this.width - 4) tx = this.width - tipW - 4;
            if (tx < 4) tx = 4;

            ctx.save();
            ctx.fillStyle = isDark ? '#0B1220' : '#FFFFFF';
            this.roundRect(ctx, tx, ty, tipW, tipH, 8);
            ctx.fill();
            ctx.strokeStyle = step.color;
            ctx.lineWidth = 1.5;
            this.roundRect(ctx, tx, ty, tipW, tipH, 8);
            ctx.stroke();

            // 标题
            ctx.fillStyle = step.color;
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(step.title + ' · ' + step.time, tx + 8, ty + 6);

            // 代码片段
            ctx.fillStyle = textColor;
            ctx.font = '9px monospace';
            const lines = step.code.split('\n');
            for (let li = 0; li < Math.min(lines.length, 4); li++) {
                ctx.fillText(lines[li], tx + 8, ty + 22 + li * 11);
            }
            ctx.restore();
        } else if (this.hover.type === 'mem') {
            const r = layout.memRects[this.hover.index];
            const layer = this.memLayers[this.hover.index];
            const tipW = 200;
            const tipH = 56;
            let tx = r.x + r.w + 6;
            let ty = r.y + r.h / 2 - tipH / 2;
            if (tx + tipW > this.width - 4) tx = r.x - tipW - 6;
            if (ty < 30) ty = 30;
            if (ty + tipH > this.height - 30) ty = this.height - tipH - 30;

            ctx.save();
            ctx.fillStyle = isDark ? '#0B1220' : '#FFFFFF';
            this.roundRect(ctx, tx, ty, tipW, tipH, 8);
            ctx.fill();
            ctx.strokeStyle = layer.color;
            ctx.lineWidth = 1.5;
            this.roundRect(ctx, tx, ty, tipW, tipH, 8);
            ctx.stroke();

            ctx.fillStyle = layer.color;
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(layer.title, tx + 8, ty + 6);
            ctx.fillStyle = textColor;
            ctx.font = '9px monospace';
            ctx.fillText(layer.code, tx + 8, ty + 22);
            ctx.fillStyle = subColor;
            ctx.font = '9px sans-serif';
            ctx.fillText(layer.agent, tx + 8, ty + 42);
            ctx.restore();
        }
    }

    _drawFooter(ctx, w, h, subColor, textColor) {
        ctx.fillStyle = subColor;
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        const phaseLabel = this.phase <= 4
            ? this.memPhaseLabels[Math.min(this.phase, 4)]
            : this.ragPhaseLabels[Math.min(this.phase - 4, 4)];
        ctx.fillText(phaseLabel, 12, h - 10);

        ctx.textAlign = 'right';
        const tag = this.isPlaying
            ? '播放中 · 4 s 强化 + 4 s 数据流 · hover 步骤查看代码'
            : '点击播放观看 双视图 8 秒循环 / step 推进单阶段';
        ctx.fillText(tag, w - 12, h - 10);
    }
}

registerAnimation('ch8-memory', () => new Ch8Memory());

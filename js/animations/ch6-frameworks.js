/**
 * CH6: Framework Architecture Comparison + Selection Matrix
 *
 * Visual concept:
 *   - Four vertical columns (LangChain / AutoGen / CrewAI / 传统手写).
 *   - Each column stacks four architecture layers (应用层 → Agent 编排层 →
 *     模型/工具层 → 运行时) drawn as rounded rectangles with gradient fills
 *     and arrow connectors.
 *   - Below each column a "call-stack" panel shows the equivalent line count
 *     ("用 X 行代码搞定").
 *   - Hovering any layer reveals a tooltip listing the four implementations
 *     for that layer side-by-side.
 *   - On the right a "选型矩阵" card rates each of LangChain / AutoGen /
 *     CrewAI on (多 Agent / 工具链 / 易用性 / 性能) using filled dots (1-5).
 *   - In play mode the focus highlight cycles between the four frameworks
 *     every 3 s; the others fade to grayscale.
 */
import { CanvasAnimation } from './canvas-animation.js';
import { registerAnimation } from './animation-registry.js';

class Ch6Frameworks extends CanvasAnimation {
    constructor() {
        super();
        this.step = 0;          // 0..3 = framework index, 4 = reset state
        this.isPlaying = false;
        this.speed = 1;
        this.lastStepTime = 0;
        this.animId = null;

        this.focusIndex = 0;    // current highlighted framework in play mode
        this.tickPhase = 0;     // 0..1 progress within current step (for arrows)
        this.autoHighlight = true;  // play mode auto-cycles; step mode locks
        this._hover = { fw: -1, layer: -1 };

        // Four framework columns. The 4th is the "handwritten" baseline.
        this.frameworks = [
            {
                name: 'LangChain',
                color: '#3B82F6',
                bgColor: 'rgba(59,130,246,0.12)',
                codeLines: 5,
                tagline: '链式组合 (LCEL)',
                layers: [
                    { title: '应用层',     impl: 'Runnable Sequence' },
                    { title: 'Agent编排',  impl: 'AgentExecutor'    },
                    { title: '模型/工具',  impl: 'Models + Tools'    },
                    { title: '运行时',     impl: 'Memory + Retriever' }
                ]
            },
            {
                name: 'AutoGen',
                color: '#8B5CF6',
                bgColor: 'rgba(139,92,246,0.12)',
                codeLines: 8,
                tagline: '对话驱动协作',
                layers: [
                    { title: '应用层',     impl: 'Conversation Loop'  },
                    { title: 'Agent编排',  impl: 'GroupChat Manager'  },
                    { title: '模型/工具',  impl: 'AssistantAgent'     },
                    { title: '运行时',     impl: 'UserProxy + Term'   }
                ]
            },
            {
                name: 'CrewAI',
                color: '#10B981',
                bgColor: 'rgba(16,185,129,0.12)',
                codeLines: 6,
                tagline: '角色化任务委派',
                layers: [
                    { title: '应用层',     impl: 'Crew.kickoff()'     },
                    { title: 'Agent编排',  impl: 'Task Pipeline'      },
                    { title: '模型/工具',  impl: 'Agent (role+goal)'  },
                    { title: '运行时',     impl: 'Sequential Process' }
                ]
            },
            {
                name: '传统手写',
                color: '#64748B',
                bgColor: 'rgba(100,116,139,0.12)',
                codeLines: 32,
                tagline: '原生代码 (CH4 基线)',
                layers: [
                    { title: '应用层',     impl: 'main() loop'        },
                    { title: 'Agent编排',  impl: 'while + parse'      },
                    { title: '模型/工具',  impl: 'LLM() + tools[]'    },
                    { title: '运行时',     impl: 'manual state mgmt'  }
                ]
            }
        ];

        // Tooltip data keyed by layer row (0 = 应用层, 1 = 编排, 2 = 模型/工具, 3 = 运行时).
        this.layerTooltips = [
            {
                title: '应用层 · 入口调用',
                details: [
                    { name: 'LangChain', text: '`prompt | llm | parser` 三段管道' },
                    { name: 'AutoGen',   text: '`initiate_chat(manager)` 启动对话' },
                    { name: 'CrewAI',    text: '`Crew.kickoff(inputs=...)` 一键开机' },
                    { name: '传统手写',  text: '手写 `main()` + `while not done` 循环' }
                ]
            },
            {
                title: 'Agent 编排层 · 控制流',
                details: [
                    { name: 'LangChain', text: '`AgentExecutor(max_iterations=...)`' },
                    { name: 'AutoGen',   text: '`GroupChat(speaker_selection_method)`' },
                    { name: 'CrewAI',    text: '`Task` 顺序 / 分层 Pipeline' },
                    { name: '传统手写',  text: '自己实现状态机 + action 解析' }
                ]
            },
            {
                title: '模型 / 工具层 · LLM & Tools',
                details: [
                    { name: 'LangChain', text: '`ChatOpenAI` + `@tool` 装饰器' },
                    { name: 'AutoGen',   text: '`AssistantAgent` + `function_call`' },
                    { name: 'CrewAI',    text: '`Agent(role, goal, tools=...)`' },
                    { name: '传统手写',  text: '手写 `llm(messages)` + `tools[i].run()`' }
                ]
            },
            {
                title: '运行时 · 状态 & 终止',
                details: [
                    { name: 'LangChain', text: '`ConversationBufferMemory` + Retriever 缓存' },
                    { name: 'AutoGen',   text: '`is_termination_msg` 关键词/轮次终止' },
                    { name: 'CrewAI',    text: '`verbose=True` + `max_rpm` 限流' },
                    { name: '传统手写',  text: '手动维护 `messages` 列表 / 日志' }
                ]
            }
        ];

        // 选型矩阵 (3 frameworks × 4 dimensions). Score 1-5 rendered as dots.
        this.matrixHeaders = ['多Agent', '工具链', '易用性', '性能'];
        this.matrixRows = [
            { name: 'LangChain', color: '#3B82F6', scores: [2, 5, 3, 4] },
            { name: 'AutoGen',   color: '#8B5CF6', scores: [5, 3, 3, 3] },
            { name: 'CrewAI',    color: '#10B981', scores: [4, 4, 5, 4] }
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
        const animId = 'ch6-frameworks';
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
            this._hover = { fw: -1, layer: -1 };
            this.canvas.style.cursor = 'default';
            this.draw();
        });
    }

    _handleHover(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const hit = this._hitTest(mx, my);
        const changed = hit.fw !== this._hover.fw || hit.layer !== this._hover.layer;
        this._hover = hit;
        this.canvas.style.cursor = hit.fw >= 0 && hit.layer >= 0 ? 'pointer' : 'default';
        if (changed) this.draw();
    }

    _hitTest(mx, my) {
        const layout = this._computeLayout();
        for (let f = 0; f < this.frameworks.length; f++) {
            const col = layout.columns[f];
            for (let l = 0; l < col.layers.length; l++) {
                const r = col.layers[l];
                if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
                    return { fw: f, layer: l };
                }
            }
        }
        return { fw: -1, layer: -1 };
    }

    togglePlay() {
        this.isPlaying = !this.isPlaying;
        const btn = document.getElementById('btn-play-ch6-frameworks');
        if (btn) btn.textContent = this.isPlaying ? '⏸ 暂停' : '▶ 播放';
        if (this.isPlaying) {
            this.lastStepTime = 0;
            this.autoHighlight = true;
            this._loop();
        } else {
            cancelAnimationFrame(this.animId);
        }
    }

    _loop() {
        if (!this.isPlaying) return;
        const now = performance.now();
        if (!this.lastStepTime) this.lastStepTime = now;
        const dur = 3000 / this.speed;     // 3s per framework highlight
        if (now - this.lastStepTime >= dur) {
            this.focusIndex = (this.focusIndex + 1) % this.frameworks.length;
            this.lastStepTime = now;
        }
        this.tickPhase = ((now - this.lastStepTime) / dur) % 1;
        this.draw();
        this.animId = requestAnimationFrame(() => this._loop());
    }

    stepForward() {
        // Step lock: stop auto cycling and advance by 1 column.
        this.autoHighlight = false;
        this.focusIndex = (this.focusIndex + 1) % this.frameworks.length;
        this.tickPhase = 1;
        this.draw();
    }

    reset() {
        this.step = 0;
        this.focusIndex = 0;
        this.isPlaying = false;
        this.lastStepTime = 0;
        this.tickPhase = 0;
        this.autoHighlight = true;
        this._hover = { fw: -1, layer: -1 };
        cancelAnimationFrame(this.animId);
        const btn = document.getElementById('btn-play-ch6-frameworks');
        if (btn) btn.textContent = '▶ 播放';
        this.draw();
    }

    setSpeed(v) {
        this.speed = v;
    }

    play() {
        if (!this.isPlaying) this.togglePlay();
    }

    pause() {
        if (this.isPlaying) this.togglePlay();
    }

    /**
     * Compute layout rectangles for the four columns and the right matrix card.
     * Returns object: { title, columns: [ { x,y,w,h, nameY, layers:[...], stack }, ... ], matrix }
     * Coordinates are logical (CSS) pixels, NOT DPR-scaled.
     */
    _computeLayout() {
        const w = this.width;
        const h = this.height;
        const isDark = this.isDarkTheme();
        void isDark; // currently not needed in layout, kept for parity with other anims

        // Top title band
        const titleH = 32;

        // Right side: matrix card
        const matrixGap = 14;
        const matrixW = Math.min(220, Math.max(180, w * 0.27));
        const matrixX = w - matrixW - 16;
        const matrixY = titleH + 6;
        const matrixH = h - matrixY - 36;

        // Left side: 4 framework columns
        const leftX = 16;
        const leftW = matrixX - leftX - matrixGap;
        const colGap = 10;
        const colW = (leftW - colGap * (this.frameworks.length - 1)) / this.frameworks.length;
        const colY = titleH + 6;
        const colH = h - colY - 36;

        // Internal layer stack
        const headerH = 46;          // framework name + tagline
        const stackH = 56;           // call-stack panel
        const stackGap = 8;
        const layersAreaY = colY + headerH;
        const layersAreaH = colH - headerH - stackH - stackGap;
        const layerGap = 4;
        const layerH = (layersAreaH - layerGap * 3) / 4;
        const layerXPad = 6;

        const columns = this.frameworks.map((fw, fi) => {
            const x = leftX + fi * (colW + colGap);
            const layers = [];
            for (let li = 0; li < 4; li++) {
                const ly = layersAreaY + li * (layerH + layerGap);
                layers.push({
                    x: x + layerXPad,
                    y: ly,
                    w: colW - layerXPad * 2,
                    h: layerH
                });
            }
            const stackY = layersAreaY + layersAreaH + stackGap;
            return {
                x, y: colY, w: colW, h: colH,
                headerH, nameY: colY + 8, taglineY: colY + 28,
                layers, stack: { x, y: stackY, w: colW, h: stackH }
            };
        });

        return {
            title: { x: w / 2, y: 14 },
            columns,
            matrix: { x: matrixX, y: matrixY, w: matrixW, h: matrixH }
        };
    }

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
        ctx.fillText('三大框架架构对比 + 选型矩阵', layout.title.x, layout.title.y);

        // Draw framework columns
        this.frameworks.forEach((fw, fi) => {
            const col = layout.columns[fi];
            const isFocus = this.isPlaying ? (this.focusIndex === fi) : (this.autoHighlight ? false : (this.focusIndex === fi));
            const dimmed = this.isPlaying && !isFocus;
            this._drawFrameworkColumn(ctx, fw, fi, col, {
                isDark, textColor, subColor, cardBg, cardBorder, innerBg,
                isFocus, dimmed
            });
        });

        // Right matrix card
        this._drawMatrix(ctx, layout.matrix, { isDark, textColor, subColor, cardBg, cardBorder, innerBg });

        // Hover tooltip (last so it draws on top)
        this._drawTooltip(ctx);

        // Bottom info bar
        const fw = this.frameworks[this.focusIndex];
        const focusName = fw ? fw.name : '';
        const focusTag = fw ? fw.tagline : '';
        const playTag = this.isPlaying
            ? '播放中 · 每 3 秒高亮一个框架'
            : (this.autoHighlight ? '点击“播放”自动轮播 4 个框架' : `当前聚焦：${focusName} — ${focusTag}`);

        ctx.fillStyle = subColor;
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(playTag, 16, h - 12);

        ctx.textAlign = 'right';
        const stepLabel = this.isPlaying
            ? `高亮 ${this.focusIndex + 1} / 4`
            : `聚焦 ${this.focusIndex + 1} / 4`;
        ctx.fillText(stepLabel + '   ·   鼠标 hover 层查看实现差异', w - 16, h - 12);
    }

    _drawFrameworkColumn(ctx, fw, fi, col, theme) {
        const { isDark, textColor, subColor, cardBg, cardBorder, innerBg, isFocus, dimmed } = theme;

        // Column card
        const alpha = dimmed ? 0.45 : 1;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = cardBg;
        this.roundRect(ctx, col.x, col.y, col.w, col.h, 10);
        ctx.fill();

        if (isFocus) {
            ctx.save();
            ctx.shadowColor = fw.color;
            ctx.shadowBlur = 14;
            ctx.strokeStyle = fw.color;
            ctx.lineWidth = 2;
            this.roundRect(ctx, col.x, col.y, col.w, col.h, 10);
            ctx.stroke();
            ctx.restore();
        } else {
            ctx.strokeStyle = cardBorder;
            ctx.lineWidth = 1;
            this.roundRect(ctx, col.x, col.y, col.w, col.h, 10);
            ctx.stroke();
        }

        // Header strip with framework color
        const grad = ctx.createLinearGradient(col.x, col.y, col.x, col.y + col.headerH);
        grad.addColorStop(0, fw.color + (isFocus ? 'CC' : '33'));
        grad.addColorStop(1, fw.color + '00');
        ctx.fillStyle = grad;
        this.roundRect(ctx, col.x, col.y, col.w, col.headerH, 10);
        ctx.fill();

        // Framework name
        ctx.fillStyle = isFocus ? '#FFFFFF' : (isDark ? '#F8FAFC' : fw.color);
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(fw.name, col.x + col.w / 2, col.nameY + 6);

        // Tagline
        ctx.fillStyle = isFocus ? 'rgba(255,255,255,0.85)' : subColor;
        ctx.font = '10px sans-serif';
        ctx.fillText(fw.tagline, col.x + col.w / 2, col.taglineY + 4);

        // Layers
        fw.layers.forEach((layer, li) => {
            const r = col.layers[li];
            const isHover = this._hover.fw === fi && this._hover.layer === li;
            this._drawLayerBox(ctx, fw, layer, li, r, {
                isDark, textColor, subColor, innerBg,
                isFocus, dimmed, isHover
            });
        });

        // Call-stack panel ("用 X 行代码")
        this._drawCallStack(ctx, fw, col.stack, { isDark, textColor, subColor, innerBg, dimmed, isFocus });

        ctx.globalAlpha = 1;
    }

    _drawLayerBox(ctx, fw, layer, li, r, theme) {
        const { isDark, textColor, subColor, innerBg, isFocus, dimmed, isHover } = theme;
        const x = r.x, y = r.y, w = r.w, h = r.h;

        // Background with vertical gradient
        let bgTop, bgBot;
        if (isHover) {
            bgTop = fw.color;
            bgBot = fw.color + 'DD';
        } else if (isFocus) {
            bgTop = fw.bgColor.replace(/[\d.]+\)$/, '0.25)');
            bgBot = fw.bgColor;
        } else {
            bgTop = innerBg;
            bgBot = isDark ? '#0F172A' : '#E2E8F0';
        }
        const grad = ctx.createLinearGradient(x, y, x, y + h);
        grad.addColorStop(0, bgTop);
        grad.addColorStop(1, bgBot);
        ctx.fillStyle = grad;
        this.roundRect(ctx, x, y, w, h, 6);
        ctx.fill();

        // Border
        ctx.strokeStyle = isHover
            ? fw.color
            : (isFocus ? fw.color : (isDark ? '#334155' : '#CBD5E1'));
        ctx.lineWidth = isHover ? 2 : (isFocus ? 1.5 : 1);
        this.roundRect(ctx, x, y, w, h, 6);
        ctx.stroke();

        // Layer index pill
        const idxW = 16;
        ctx.fillStyle = fw.color;
        this.roundRect(ctx, x + 4, y + (h - 16) / 2, idxW, 16, 4);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('L' + (li + 1), x + 4 + idxW / 2, y + h / 2 + 0.5);

        // Title + impl
        const textX = x + 4 + idxW + 6;
        const textW = w - (textX - x) - 6;
        ctx.fillStyle = isHover ? '#FFFFFF' : textColor;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(layer.title, textX, y + h / 2 - 6);

        ctx.fillStyle = isHover ? 'rgba(255,255,255,0.92)' : subColor;
        ctx.font = '10px sans-serif';
        const implLines = this.wrapText(ctx, layer.impl, textX, 0, textW, 11);
        if (implLines.length === 1) {
            ctx.fillText(implLines[0], textX, y + h / 2 + 8);
        } else {
            // For 2 lines, place them under title
            ctx.fillText(implLines[0], textX, y + h / 2 + 7);
            if (implLines[1]) ctx.fillText(implLines[1], textX, y + h / 2 + 18);
        }

        // Arrow connector to next layer
        if (li < 3) {
            const ax = x + w / 2;
            const ay = y + h;
            const ah = 4;
            ctx.strokeStyle = isFocus ? fw.color : (isDark ? '#475569' : '#CBD5E1');
            ctx.lineWidth = isFocus ? 1.5 : 1;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(ax, ay + ah);
            ctx.stroke();
            // Arrow head
            ctx.beginPath();
            ctx.moveTo(ax - 3, ay + ah - 1);
            ctx.lineTo(ax, ay + ah + 2);
            ctx.lineTo(ax + 3, ay + ah - 1);
            ctx.closePath();
            ctx.fillStyle = isFocus ? fw.color : (isDark ? '#64748B' : '#94A3B8');
            ctx.fill();
        }
    }

    _drawCallStack(ctx, fw, stack, theme) {
        const { isDark, textColor, subColor, innerBg, dimmed, isFocus } = theme;
        const x = stack.x, y = stack.y, w = stack.w, h = stack.h;

        // Panel background
        ctx.fillStyle = isDark ? '#0B1220' : '#F8FAFC';
        this.roundRect(ctx, x, y, w, h, 8);
        ctx.fill();
        ctx.strokeStyle = isDark ? '#334155' : '#CBD5E1';
        ctx.lineWidth = 1;
        this.roundRect(ctx, x, y, w, h, 8);
        ctx.stroke();

        // Title
        ctx.fillStyle = subColor;
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('调用栈 · 等效代码行数', x + 8, y + 6);

        // Big number
        ctx.fillStyle = fw.color;
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const numStr = (fw.codeLines >= 30 ? '30+' : String(fw.codeLines));
        ctx.fillText(numStr, x + 8, y + h / 2 + 6);

        // Label
        ctx.fillStyle = isFocus ? textColor : subColor;
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        const label = fw.codeLines >= 30 ? '行手写 (CH4)' : '行代码搞定';
        ctx.fillText(label, x + w - 8, y + h / 2 + 6);

        // Mini bar (proportional visual)
        const maxLines = 32;
        const barX = x + 8;
        const barY = y + h - 10;
        const barW = w - 16;
        const barH = 4;
        ctx.fillStyle = isDark ? '#1E293B' : '#E2E8F0';
        this.roundRect(ctx, barX, barY, barW, barH, 2);
        ctx.fill();
        const fillW = Math.max(6, (fw.codeLines / maxLines) * barW);
        ctx.fillStyle = fw.color;
        this.roundRect(ctx, barX, barY, Math.min(fillW, barW), barH, 2);
        ctx.fill();
    }

    _drawMatrix(ctx, m, theme) {
        const { isDark, textColor, subColor, cardBg, cardBorder, innerBg } = theme;
        const x = m.x, y = m.y, w = m.w, h = m.h;

        // Card background
        ctx.fillStyle = cardBg;
        this.roundRect(ctx, x, y, w, h, 10);
        ctx.fill();
        ctx.strokeStyle = cardBorder;
        ctx.lineWidth = 1;
        this.roundRect(ctx, x, y, w, h, 10);
        ctx.stroke();

        // Title
        ctx.fillStyle = textColor;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('选型矩阵 (1-5 圆点评分)', x + 10, y + 10);

        // Subtitle hint
        ctx.fillStyle = subColor;
        ctx.font = '9px sans-serif';
        ctx.fillText('分越高越擅长该维度', x + 10, y + 26);

        // Layout grid
        const gridX = x + 10;
        const gridY = y + 42;
        const gridW = w - 20;
        const labelW = 60;             // left "framework" column
        const colsW = gridW - labelW;
        const colW0 = colsW / this.matrixHeaders.length;
        const headerH = 18;
        const rowH = (h - 42 - headerH - 16) / this.matrixRows.length;

        // Header row
        ctx.fillStyle = innerBg;
        this.roundRect(ctx, gridX, gridY, gridW, headerH, 4);
        ctx.fill();
        ctx.fillStyle = subColor;
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let c = 0; c < this.matrixHeaders.length; c++) {
            const cx = gridX + labelW + colW0 * c + colW0 / 2;
            ctx.fillText(this.matrixHeaders[c], cx, gridY + headerH / 2);
        }
        // First cell (corner) — leave blank
        ctx.fillStyle = subColor;
        ctx.textAlign = 'left';
        ctx.fillText('框架', gridX + 6, gridY + headerH / 2);

        // Rows
        this.matrixRows.forEach((row, ri) => {
            const ry = gridY + headerH + 4 + ri * rowH;
            // Row background (alternate)
            if (ri % 2 === 0) {
                ctx.fillStyle = isDark ? 'rgba(148,163,184,0.06)' : 'rgba(100,116,139,0.05)';
                this.roundRect(ctx, gridX, ry, gridW, rowH - 2, 4);
                ctx.fill();
            }
            // Framework name + color dot
            ctx.fillStyle = row.color;
            ctx.beginPath();
            ctx.arc(gridX + 10, ry + rowH / 2 - 1, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = textColor;
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(row.name, gridX + 18, ry + rowH / 2 - 1);

            // Score cells
            for (let c = 0; c < row.scores.length; c++) {
                const cellCx = gridX + labelW + colW0 * c + colW0 / 2;
                const cy = ry + rowH / 2 - 1;
                const score = row.scores[c];
                this._drawDots(ctx, cellCx, cy, score, row.color, subColor);
            }
        });
    }

    _drawDots(ctx, cx, cy, score, fillColor, emptyColor) {
        const r = 2.4;
        const gap = 6;
        const totalW = (5 - 1) * gap;
        const startX = cx - totalW / 2;
        for (let i = 0; i < 5; i++) {
            const dx = startX + i * gap;
            ctx.beginPath();
            ctx.arc(dx, cy, r, 0, Math.PI * 2);
            if (i < score) {
                ctx.fillStyle = fillColor;
                ctx.fill();
            } else {
                ctx.fillStyle = emptyColor + '55';
                ctx.fill();
            }
        }
    }

    /**
     * Draw a tooltip near a hovered layer showing how each framework implements
     * that layer. Uses a small box with the layer title + 4 detail lines.
     */
    _drawTooltip(ctx) {
        if (this._hover.fw < 0 || this._hover.layer < 0) return;
        const layout = this._computeLayout();
        const col = layout.columns[this._hover.fw];
        const r = col.layers[this._hover.layer];
        const tip = this.layerTooltips[this._hover.layer];
        if (!tip) return;

        const padding = 10;
        const lineH = 13;
        const titleH = 16;
        const w = 260;
        const detailRows = tip.details.length;
        const h = padding * 2 + titleH + detailRows * lineH + 4;

        // Position: prefer to the right of the layer box; flip left if no room.
        let tx = r.x + r.w + 8;
        let ty = r.y + r.h / 2 - h / 2;
        if (tx + w > this.width - 8) tx = r.x - w - 8;
        if (tx < 8) tx = 8;
        if (ty + h > this.height - 28) ty = this.height - 28 - h;
        if (ty < 8) ty = 8;

        const isDark = this.isDarkTheme();
        const tipBg = isDark ? '#0B1220' : '#FFFFFF';
        const tipBorder = isDark ? '#475569' : '#CBD5E1';
        const textColor = isDark ? '#F1F5F9' : '#0F172A';
        const subColor = isDark ? '#94A3B8' : '#475569';

        // Background + border
        ctx.fillStyle = tipBg;
        this.roundRect(ctx, tx, ty, w, h, 8);
        ctx.fill();
        ctx.strokeStyle = tipBorder;
        ctx.lineWidth = 1;
        this.roundRect(ctx, tx, ty, w, h, 8);
        ctx.stroke();

        // Title
        ctx.fillStyle = textColor;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(tip.title, tx + padding, ty + padding);

        // Divider
        ctx.strokeStyle = tipBorder;
        ctx.beginPath();
        ctx.moveTo(tx + padding, ty + padding + titleH);
        ctx.lineTo(tx + w - padding, ty + padding + titleH);
        ctx.stroke();

        // Each detail row
        const isHoveredFw = this._hover.fw;
        tip.details.forEach((d, i) => {
            const ry = ty + padding + titleH + 4 + i * lineH;
            const fw = this.frameworks[i];
            // Color dot
            ctx.fillStyle = fw.color;
            ctx.beginPath();
            ctx.arc(tx + padding + 4, ry + 5, 3, 0, Math.PI * 2);
            ctx.fill();

            // Highlight hovered row
            const isThisRow = (i === isHoveredFw);
            ctx.fillStyle = isThisRow ? textColor : subColor;
            ctx.font = (isThisRow ? 'bold ' : '') + '10px sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';

            const label = d.name + '：';
            const labelW = ctx.measureText(label).width;
            ctx.fillText(label, tx + padding + 12, ry + 5);

            ctx.font = '10px sans-serif';
            ctx.fillStyle = isThisRow ? fw.color : textColor;
            ctx.fillText(d.text, tx + padding + 12 + labelW, ry + 5);
        });
    }
}

registerAnimation('ch6-frameworks', () => new Ch6Frameworks());

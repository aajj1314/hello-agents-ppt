/**
 * CH14: DeepResearch — Plan → Search → Read → Write Paradigm + Task Tree
 *
 * Visual concept:
 *   - Top: horizontal 4-step progress bar (Plan → Search → Read → Write).
 *     Current step highlighted with progress arc, completed steps marked with ✓,
 *     hover any step → floating tooltip with that step's description.
 *   - Main body (left ~65%): task tree
 *       Root: "研究问题：对比 LoRA 与全参数微调"
 *       4 sub-questions: 什么是 LoRA / 什么是全参数微调 / 显存与成本对比 / 常见误区
 *       2-3 search results per sub-question with source URL and a status badge
 *       (搜索 → 已读 → ✓) that updates as playback walks the 4 steps.
 *   - Right sidebar (~32%): code / prompt snippet that matches the current step.
 *   - Playback: walks through the 4 steps, progressively revealing the tree.
 */
import { CanvasAnimation } from './canvas-animation.js';
import { registerAnimation } from './animation-registry.js';

class Ch14DeepResearch extends CanvasAnimation {
    constructor() {
        super();
        this.animId = 'ch14-task-tree';

        // 4-step paradigm
        this.steps = [
            {
                key: 'Plan',
                label: 'Plan 规划',
                color: '#6366F1',
                shortDesc: '把大问题拆成 5-7 个可搜索子任务',
                detail: 'Plan 阶段: 让 LLM 把研究问题拆成可被搜索引擎直接回答的子任务, 输出 JSON 列表.',
                snippet: [
                    '# Plan: 任务分解 Prompt',
                    '你是资深研究助理. 把下面的',
                    '研究问题拆成 5-7 个独立、可',
                    '搜索的子问题, 以 JSON 数组',
                    '返回, 每项含 id + query.',
                    '',
                    'Topic: 对比 LoRA 与全参数微调',
                    '→ 4 个子任务已生成',
                    '{ id:1, q:"什么是 LoRA" },',
                    '{ id:2, q:"什么是全参数微调" },',
                    '{ id:3, q:"显存与成本对比" },',
                    '{ id:4, q:"常见误区" }'
                ]
            },
            {
                key: 'Search',
                label: 'Search 检索',
                color: '#3B82F6',
                shortDesc: '调搜索 API, 每个子任务拿 Top-5 链接',
                detail: 'Search 阶段: 对每个子任务用搜索引擎 API 拿 Top-5 链接, 必要时改写查询 (加年份/英文/site:).',
                snippet: [
                    '# Search: 检索查询 (改写后)',
                    'search("LoRA low-rank',
                    '       adaptation arxiv 2021")',
                    '',
                    '→ Top 5 URLs:',
                    '[1] arxiv.org/abs/2106.09685',
                    '[2] huggingface.co/docs/peft',
                    '[3] github.com/microsoft/LoRA',
                    '[4] paperswithcode.com/lora',
                    '[5] blog.paperspace.com/lora'
                ]
            },
            {
                key: 'Read',
                label: 'Read 阅读',
                color: '#10B981',
                shortDesc: '从每篇网页抽取 3-5 个事实点',
                detail: 'Read 阶段: 把每篇网页喂给 LLM, 让它抽取 3-5 个事实点, 每点带 [n] 编号, 方便整合与去重.',
                snippet: [
                    '# Read: 抽取 Prompt',
                    '请从以下网页抽取 3-5 个',
                    '关键事实, 每条 ≤ 30 字,',
                    '句末用 [n] 标来源.',
                    '',
                    '→ 已抽取 4 条事实:',
                    '- LoRA 参数量 ~0.1% [1]',
                    '- 显存可降至 1/3 [2]',
                    '- 推理时无额外开销 [1]',
                    '- 与全参数微调可叠加 [3]'
                ]
            },
            {
                key: 'Write',
                label: 'Write 写作',
                color: '#F59E0B',
                shortDesc: '整合所有要点为带引用的结构化报告',
                detail: 'Write 阶段: 把所有抽取的事实按 5 段式骨架 (背景/方法/发现/对比/结论) 整合, 关键数字加 [n] 引用.',
                snippet: [
                    '# Write: 整合 Prompt',
                    '将以下笔记整合为 5 段报告:',
                    '① 背景与意义 (150字)',
                    '② 方法与数据源 (100字)',
                    '③ 核心发现 (500字)',
                    '④ 对比与权衡 (三列表)',
                    '⑤ 结论与建议 (200字)',
                    '',
                    '→ 报告草稿 v1 已生成',
                    '→ 反思轮询: 抓出 3 处待修'
                ]
            }
        ];

        // Task tree structure
        this.rootQuestion = '研究问题: 对比 LoRA 与全参数微调';
        this.subQuestions = [
            {
                title: '什么是 LoRA',
                icon: '🔍',
                color: '#6366F1',
                results: [
                    { domain: 'arxiv.org',           url: '/abs/2106.09685',  title: 'LoRA: Low-Rank Adaptation' },
                    { domain: 'huggingface.co',      url: '/docs/peft',       title: 'PEFT / LoRA 文档' }
                ]
            },
            {
                title: '什么是全参数微调',
                icon: '🔍',
                color: '#3B82F6',
                results: [
                    { domain: 'openai.com',          url: '/docs/guides/fine-tuning', title: 'OpenAI Fine-tuning Guide' },
                    { domain: 'cs224n.stanford.edu', url: '/notes',                   title: 'Stanford CS224N Notes' }
                ]
            },
            {
                title: '显存与成本对比',
                icon: '💰',
                color: '#10B981',
                results: [
                    { domain: 'huggingface.co',      url: '/blog/lora',        title: 'HF Blog: LoRA 显存分析' },
                    { domain: 'developer.nvidia.com',url: '/blog',             title: 'NVIDIA: 大模型微调' },
                    { domain: 'arxiv.org',           url: '/abs/2104.09673',   title: 'ZeRO + LoRA 实践' }
                ]
            },
            {
                title: '常见误区',
                icon: '⚠️',
                color: '#F59E0B',
                results: [
                    { domain: 'reddit.com',          url: '/r/MachineLearning', title: 'r/ML: LoRA 误区讨论' },
                    { domain: 'medium.com',          url: '/@lora-misconceptions', title: 'LoRA 5 大误区' }
                ]
            }
        ];

        // Playback state
        this._currentStep  = 0;   // 0..3
        this._stepProgress = 0;   // 0..1 within the current step
        this._playing      = false;
        this._rafId        = null;
        this.speed         = 1;

        // Hover state for the step bar
        this._hoverStep   = -1;   // index of hovered step, or -1
        this._stepHitRects = [];  // hit-test circles for the step bar
    }

    // ---------------- lifecycle ----------------
    init(canvas) {
        super.init(canvas);
        this._setupControls();
        this._setupCanvasEvents();
        window.addEventListener('resize', () => { this._resize(); this.draw(); });
        this.draw();
    }

    _setupControls() {
        const playBtn  = document.getElementById('btn-play-'  + this.animId);
        const resetBtn = document.getElementById('btn-reset-' + this.animId);
        const stepBtn  = document.getElementById('btn-step-'  + this.animId);
        const speedSld = document.getElementById('speed-'     + this.animId);
        if (playBtn)  playBtn.addEventListener('click',  () => this.togglePlay());
        if (resetBtn) resetBtn.addEventListener('click', () => this.reset());
        if (stepBtn)  stepBtn.addEventListener('click',  () => this.stepForward());
        if (speedSld) speedSld.addEventListener('input',  (e) => {
            this.speed = parseFloat(e.target.value) || 1;
        });
    }

    _setupCanvasEvents() {
        this.canvas.addEventListener('mousemove',  (e) => this._onMouseMove(e));
        this.canvas.addEventListener('mouseleave', ()  => this._onMouseLeave());
    }

    // ---------------- playback API ----------------
    togglePlay() {
        if (this._playing) {
            this._playing = false;
            cancelAnimationFrame(this._rafId);
            this._setPlayButtonLabel('▶ 播放');
            return;
        }
        this._playing = true;
        this._setPlayButtonLabel('⏸ 暂停');
        this._loop();
    }

    _loop() {
        if (!this._playing) return;

        this._stepProgress += 0.012 * (this.speed || 1);
        if (this._stepProgress >= 1) {
            this._stepProgress = 1;
            this.draw();

            if (this._currentStep < this.steps.length - 1) {
                // Brief pause, then advance to next step
                setTimeout(() => {
                    if (!this._playing) return;
                    this._currentStep  += 1;
                    this._stepProgress = 0;
                    this._loop();
                }, 350);
            } else {
                // All steps done
                this._playing = false;
                cancelAnimationFrame(this._rafId);
                this._setPlayButtonLabel('▶ 播放');
            }
            return;
        }
        this.draw();
        this._rafId = requestAnimationFrame(() => this._loop());
    }

    stepForward() {
        if (this._currentStep < this.steps.length - 1) {
            this._currentStep  += 1;
            this._stepProgress = 1;
        } else {
            // Already at last step - just snap progress to 1
            this._stepProgress = 1;
        }
        this.draw();
    }

    reset() {
        this._playing = false;
        cancelAnimationFrame(this._rafId);
        this._currentStep  = 0;
        this._stepProgress = 0;
        this._setPlayButtonLabel('▶ 播放');
        this.draw();
    }

    setSpeed(v) { this.speed = v; }
    play()      { if (!this._playing) this.togglePlay(); }
    pause()     { if (this._playing)  this.togglePlay(); }
    step()      { this.stepForward(); }

    _setPlayButtonLabel(label) {
        const btn = document.getElementById('btn-play-' + this.animId);
        if (btn) btn.textContent = label;
    }

    // ---------------- hover / tooltip ----------------
    _canvasPoint(e) {
        const rect = this.canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    _onMouseMove(e) {
        const { x, y } = this._canvasPoint(e);
        let newHover = -1;
        for (const r of this._stepHitRects) {
            const dx = x - r.x, dy = y - r.y;
            if (dx * dx + dy * dy <= r.r * r.r) {
                newHover = r.idx;
                break;
            }
        }
        if (newHover !== this._hoverStep) {
            this._hoverStep = newHover;
            this.canvas.style.cursor = newHover >= 0 ? 'pointer' : 'default';
            this.draw();
        }
    }

    _onMouseLeave() {
        if (this._hoverStep !== -1) {
            this._hoverStep = -1;
            this.canvas.style.cursor = 'default';
            this.draw();
        }
    }

    // ---------------- main draw ----------------
    draw() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        const dark      = this.isDarkTheme();
        const bg        = dark ? '#0F172A' : '#F8FAFC';
        const textColor = dark ? '#F1F5F9' : '#0F172A';
        const subColor  = dark ? '#94A3B8' : '#475569';
        const borderCol = dark ? 'rgba(148,163,184,0.25)' : 'rgba(100,116,139,0.25)';
        const panelBg   = dark ? 'rgba(30,41,59,0.6)' : 'rgba(241,245,249,0.85)';

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        // Title row
        ctx.fillStyle = textColor;
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('DeepResearch 经典四步范式  ·  任务树 + 多源验证', 16, 8);
        ctx.fillStyle = subColor;
        ctx.font = '10px sans-serif';
        ctx.fillText('悬停步骤查看说明  ·  播放自动演示 Plan → Search → Read → Write', 16, 26);

        // Layout regions
        const stepBarTop = 44;
        const stepBarH   = 46;
        const bodyTop    = stepBarTop + stepBarH + 8;     // 98
        const footerH    = 26;
        const bodyBottom = h - footerH;
        const bodyH      = bodyBottom - bodyTop;

        // Sidebar (right) + tree (left) widths
        const padX     = 14;
        const sidebarW = Math.max(190, Math.min(240, w * 0.32));
        const sidebarX = w - sidebarW - padX;
        const treeX    = padX;
        const treeW    = Math.max(280, sidebarX - padX - 14);

        // Step bar
        this._drawStepBar(ctx, 0, stepBarTop, w, stepBarH, textColor, subColor, borderCol, dark);

        // Main task tree
        this._drawTaskTree(ctx, treeX, bodyTop, treeW, bodyH, textColor, subColor, borderCol, panelBg, dark);

        // Right sidebar (snippet)
        this._drawSidebar(ctx, sidebarX, bodyTop, sidebarW, bodyH, textColor, subColor, borderCol, panelBg, dark);

        // Footer
        this._drawFooter(ctx, w, h, subColor, textColor);

        // Tooltip drawn last (on top of everything)
        if (this._hoverStep >= 0) {
            this._drawTooltip(ctx, w, h, textColor, subColor, borderCol, dark);
        }
    }

    // ---------------- step bar ----------------
    _drawStepBar(ctx, x, y, w, h, textColor, subColor, borderCol, dark) {
        this._stepHitRects = [];
        const n = this.steps.length;
        const margin = 70;
        const innerW = w - margin * 2;
        const stepSpacing = innerW / (n - 1);
        const cy = y + 18;
        const r  = 15;

        // Background track
        ctx.strokeStyle = borderCol;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(margin, cy);
        ctx.lineTo(w - margin, cy);
        ctx.stroke();

        // Filled progress line up to current step
        const progressX = this._currentStep >= n - 1
            ? w - margin
            : margin + stepSpacing * (this._currentStep + this._stepProgress);
        const grad = ctx.createLinearGradient(margin, 0, w - margin, 0);
        for (let i = 0; i < n; i++) {
            const stop = i / (n - 1);
            grad.addColorStop(stop, this.steps[i].color);
        }
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(margin, cy);
        ctx.lineTo(progressX, cy);
        ctx.stroke();

        // Arrow head at the end
        const headX = w - margin;
        ctx.beginPath();
        ctx.moveTo(headX, cy);
        ctx.lineTo(headX - 6, cy - 4);
        ctx.lineTo(headX - 6, cy + 4);
        ctx.closePath();
        ctx.fillStyle = this.steps[n - 1].color;
        ctx.fill();

        // Circles + labels
        for (let i = 0; i < n; i++) {
            const cx       = margin + i * stepSpacing;
            const isDone   = i < this._currentStep;
            const isCurrent = i === this._currentStep;
            const isHover  = i === this._hoverStep;
            const color    = this.steps[i].color;

            // Outer halo on current / hover
            if (isCurrent || isHover) {
                ctx.beginPath();
                ctx.arc(cx, cy, r + (isCurrent ? 7 : 5), 0, Math.PI * 2);
                ctx.fillStyle = color + (isCurrent ? '33' : '22');
                ctx.fill();
            }

            // Solid circle
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            if (isDone) {
                ctx.fillStyle = color;
                ctx.fill();
            } else if (isCurrent) {
                ctx.fillStyle = dark ? '#1E293B' : '#FFFFFF';
                ctx.fill();
                ctx.strokeStyle = color;
                ctx.lineWidth = 3;
                ctx.stroke();
                // Inner progress arc
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.arc(cx, cy, r - 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * this._stepProgress);
                ctx.closePath();
                ctx.fillStyle = color + 'BB';
                ctx.fill();
            } else {
                ctx.fillStyle = dark ? '#1E293B' : '#FFFFFF';
                ctx.fill();
                ctx.strokeStyle = borderCol;
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            // Check or step number
            ctx.fillStyle = isDone ? '#FFFFFF' : (isCurrent ? color : subColor);
            ctx.font = (isDone || isCurrent) ? 'bold 13px sans-serif' : 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            if (isDone) {
                ctx.fillText('✓', cx, cy + 1);
            } else {
                ctx.fillText(String(i + 1), cx, cy + 1);
            }

            // Step label below circle
            ctx.fillStyle = isCurrent ? color : (isDone ? textColor : subColor);
            ctx.font = (isCurrent ? 'bold ' : '') + '11px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(this.steps[i].label, cx, cy + r + 4);

            // Save hit-test rect
            this._stepHitRects.push({ idx: i, x: cx, y: cy, r: r + 6 });
        }
    }

    // ---------------- task tree ----------------
    _drawTaskTree(ctx, x, y, w, h, textColor, subColor, borderCol, panelBg, dark) {
        // Panel background
        ctx.fillStyle = panelBg;
        this.roundRect(ctx, x, y, w, h, 10);
        ctx.fill();
        ctx.strokeStyle = borderCol;
        ctx.lineWidth = 1;
        this.roundRect(ctx, x, y, w, h, 10);
        ctx.stroke();

        const padX   = 14;
        const innerX = x + padX;
        const innerW = w - padX * 2;
        const innerY = y + 12;

        // Reveal coefficients (per step)
        //   Step 0 (Plan):    sub-questions fade in
        //   Step 1 (Search):  search results fade in with stagger
        //   Step 2 (Read):    result badge transitions to "已读" (with brief flash)
        //   Step 3 (Write):   result badge transitions to "✓"  (with brief flash)
        const subAlpha = (this._currentStep === 0)
            ? Math.min(1, 0.25 + this._stepProgress * 0.95)
            : 1;
        const resultsReveal = (this._currentStep === 1)
            ? this._stepProgress
            : ((this._currentStep > 1) ? 1 : 0);

        // Layout
        const rootW = Math.min(300, innerW);
        const rootH = 38;
        const rootCx = innerX + innerW / 2;
        const rootCy = innerY + rootH / 2;

        // --- Root node ---
        this._drawRootNode(ctx, rootCx, rootCy, rootW, rootH, dark);

        // --- Sub-questions ---
        const subY      = innerY + rootH + 32;
        const subW      = Math.min(120, (innerW - 24) / 4);
        const subH      = 44;
        const subSpacing = (innerW - subW * 4) / 3;
        const firstSubX = innerX;

        const subCenters = [];
        for (let i = 0; i < this.subQuestions.length; i++) {
            const sx = firstSubX + i * (subW + subSpacing) + subW / 2;
            const sy = subY + subH / 2;
            subCenters.push(sx);

            // Connection from root to sub-question
            this._drawConnection(
                ctx,
                rootCx, rootCy + rootH / 2,
                sx,     sy - subH / 2,
                this.subQuestions[i].color, dark, subAlpha
            );

            // Sub-question box
            ctx.save();
            ctx.globalAlpha = subAlpha;
            this._drawSubNode(ctx, sx, sy, subW, subH, this.subQuestions[i], textColor, subColor, dark);
            ctx.restore();
        }

        // --- Search results ---
        const resultsTopY = subY + subH + 18;
        const rowH = 26;
        const resultSpacing = 4;

        for (let i = 0; i < this.subQuestions.length; i++) {
            const sq     = this.subQuestions[i];
            const sx     = subCenters[i];
            const baseX  = firstSubX + i * (subW + subSpacing);

            for (let j = 0; j < sq.results.length; j++) {
                const r = sq.results[j];
                // Per-result reveal with a small stagger
                const stagger = 0.18 * j;
                const reveal  = Math.max(0, Math.min(1, (resultsReveal - stagger) / 0.55));
                if (reveal <= 0) continue;

                const ry = resultsTopY + j * (rowH + resultSpacing);

                // Connection from sub-question to this result
                this._drawConnection(
                    ctx, sx, subY + subH,
                    baseX + subW / 2, ry,
                    sq.color, dark, reveal
                );

                ctx.save();
                ctx.globalAlpha = reveal;
                this._drawResultNode(
                    ctx, baseX, ry, subW, rowH, r,
                    sq.color, textColor, subColor, dark
                );
                ctx.restore();
            }
        }

        // --- Bottom progress bar (overall walkthrough progress) ---
        const progressPct = ((this._currentStep + this._stepProgress) / this.steps.length) * 100;
        const barX = innerX;
        const barW = innerW;
        const barH = 6;
        const barY = y + h - 18;

        ctx.fillStyle = dark ? 'rgba(148,163,184,0.18)' : 'rgba(100,116,139,0.18)';
        this.roundRect(ctx, barX, barY, barW, barH, 3);
        ctx.fill();
        const fillW = Math.max(0, Math.min(barW, (progressPct / 100) * barW));
        if (fillW > 0) {
            const g = ctx.createLinearGradient(barX, 0, barX + barW, 0);
            for (let k = 0; k < this.steps.length; k++) {
                g.addColorStop(k / (this.steps.length - 1), this.steps[k].color);
            }
            ctx.fillStyle = g;
            this.roundRect(ctx, barX, barY, fillW, barH, 3);
            ctx.fill();
        }
    }

    _drawRootNode(ctx, cx, cy, w, h, dark) {
        // Soft outer halo
        ctx.beginPath();
        ctx.ellipse(cx, cy, w / 2 + 8, h / 2 + 8, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#6366F133';
        ctx.fill();

        this.roundRect(ctx, cx - w / 2, cy - h / 2, w, h, 10);
        const g = ctx.createLinearGradient(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2);
        g.addColorStop(0, '#6366F1');
        g.addColorStop(1, '#8B5CF6');
        ctx.fillStyle = g;
        ctx.fill();

        // Inner highlight
        this.roundRect(ctx, cx - w / 2 + 2, cy - h / 2 + 2, w - 4, h - 4, 8);
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎯  ' + this.rootQuestion, cx, cy);
    }

    _drawSubNode(ctx, cx, cy, w, h, sq, textColor, subColor, dark) {
        this.roundRect(ctx, cx - w / 2, cy - h / 2, w, h, 8);
        ctx.fillStyle = dark ? '#1E293B' : '#FFFFFF';
        ctx.fill();
        ctx.strokeStyle = sq.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Color stripe at top
        this.roundRect(ctx, cx - w / 2, cy - h / 2, w, 5, 2);
        ctx.fillStyle = sq.color;
        ctx.fill();

        // Title
        ctx.fillStyle = textColor;
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sq.icon + ' ' + sq.title, cx, cy - 5);

        // Result count
        ctx.fillStyle = sq.color;
        ctx.font = '9px sans-serif';
        ctx.fillText(sq.results.length + ' 个搜索结果', cx, cy + 9);
    }

    _drawResultNode(ctx, x, y, w, h, r, color, textColor, subColor, dark) {
        const rx = x;
        const ry = y;
        const rw = w;
        const rh = h;

        // Flash intensity: a brief flash on the result when Read/Write badges change
        let flashAlpha = 0;
        if (this._currentStep === 2 || this._currentStep === 3) {
            // Pulse goes 0 → 1 → 0 over the step
            const t = this._stepProgress;
            flashAlpha = (t < 0.5 ? t * 2 : (1 - t) * 2) * 0.35;
        }

        this.roundRect(ctx, rx, ry, rw, rh, 5);
        ctx.fillStyle = dark ? 'rgba(30,41,59,0.85)' : 'rgba(255,255,255,0.96)';
        ctx.fill();
        if (flashAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = flashAlpha;
            ctx.fillStyle = this.steps[this._currentStep].color;
            ctx.fill();
            ctx.restore();
        }
        ctx.strokeStyle = color + '99';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Domain label (truncated if too long)
        let domain = r.domain;
        if (domain.length > 14) domain = domain.substring(0, 12) + '…';
        ctx.fillStyle = color;
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(domain, rx + 6, ry + 4);

        // URL suffix
        ctx.fillStyle = subColor;
        ctx.font = '8px sans-serif';
        ctx.fillText(r.url, rx + 6, ry + rh - 10);

        // Right-side status badge (text changes by current step)
        const badgeText = (this._currentStep >= 3) ? '✓' : (this._currentStep >= 2 ? '已读' : '搜索');
        const badgeBg   = (this._currentStep >= 3) ? '#10B981' : (this._currentStep >= 2 ? '#10B981' : color);
        this._drawBadge(ctx, rx + rw - 4, ry + rh / 2, badgeText, badgeBg, '#FFFFFF', dark, 'right');
    }

    _drawBadge(ctx, anchorX, anchorY, text, bg, fg, dark, align = 'right') {
        ctx.font = 'bold 8px sans-serif';
        const textW = ctx.measureText(text).width;
        const bw = textW + 8;
        const bh = 12;
        const bx = align === 'right' ? anchorX - bw : anchorX;
        const by = anchorY - bh / 2;
        this.roundRect(ctx, bx, by, bw, bh, 4);
        ctx.fillStyle = bg;
        ctx.fill();
        ctx.fillStyle = fg;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, bx + bw / 2, by + bh / 2 + 0.5);
    }

    _drawConnection(ctx, x1, y1, x2, y2, color, dark, alpha = 1) {
        ctx.save();
        ctx.globalAlpha = (alpha === undefined ? 1 : alpha);
        ctx.beginPath();
        const midY = (y1 + y2) / 2;
        ctx.moveTo(x1, y1);
        ctx.bezierCurveTo(x1, midY, x2, midY, x2, y2);
        ctx.strokeStyle = dark ? color + '99' : color + 'BB';
        ctx.lineWidth = 1.3;
        ctx.stroke();
        // Small dot at the child end
        ctx.beginPath();
        ctx.arc(x2, y2, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();
    }

    // ---------------- right sidebar (snippet) ----------------
    _drawSidebar(ctx, x, y, w, h, textColor, subColor, borderCol, panelBg, dark) {
        ctx.fillStyle = panelBg;
        this.roundRect(ctx, x, y, w, h, 10);
        ctx.fill();
        ctx.strokeStyle = borderCol;
        ctx.lineWidth = 1;
        this.roundRect(ctx, x, y, w, h, 10);
        ctx.stroke();

        const padX = 12;
        let cursorY = y + 12;

        // Section title
        const step = this.steps[this._currentStep];
        ctx.fillStyle = step.color;
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('▸ ' + step.label, x + padX, cursorY);
        cursorY += 18;

        // Short description (wrapped)
        ctx.fillStyle = subColor;
        ctx.font = '10px sans-serif';
        const descLines = this._wrapCJK(ctx, step.shortDesc, w - padX * 2);
        for (const line of descLines) {
            ctx.fillText(line, x + padX, cursorY);
            cursorY += 13;
        }
        cursorY += 4;

        // Separator
        ctx.strokeStyle = borderCol;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + padX, cursorY);
        ctx.lineTo(x + w - padX, cursorY);
        ctx.stroke();
        cursorY += 8;

        // Code snippet panel
        const snippetH = h - (cursorY - y) - 12;
        this._drawCodePanel(ctx, x + padX, cursorY, w - padX * 2, snippetH, step.snippet, dark);
    }

    _drawCodePanel(ctx, x, y, w, h, lines, dark) {
        // Dark code-like background
        const codeBg = dark ? '#0B1220' : '#1E293B';
        const codeFg = dark ? '#E2E8F0' : '#F1F5F9';
        const kwColor  = '#8B5CF6';
        const strColor = '#10B981';
        const numColor = '#F59E0B';
        const comColor = '#94A3B8';

        this.roundRect(ctx, x, y, w, h, 8);
        ctx.fillStyle = codeBg;
        ctx.fill();

        // Window dots
        ctx.beginPath();
        ctx.arc(x + 12, y + 12, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#EF4444';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 22, y + 12, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#F59E0B';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 32, y + 12, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#10B981';
        ctx.fill();

        // Code text
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        let lineY = y + 26;
        const lineH = 13;
        const maxLines = Math.floor((h - 32) / lineH);

        for (let i = 0; i < lines.length && i < maxLines; i++) {
            const line = lines[i];
            // Simple syntax highlighting
            if (line.trim().startsWith('#')) {
                ctx.fillStyle = comColor;
            } else if (line.trim().startsWith('→') || line.includes('=>')) {
                ctx.fillStyle = numColor;
            } else if (line.trim().startsWith('[') || /^\s*\d+\)/.test(line) || /^\s*[①②③④⑤]/.test(line)) {
                ctx.fillStyle = kwColor;
            } else if (line.indexOf('"') >= 0 || line.indexOf("'") >= 0) {
                ctx.fillStyle = strColor;
            } else {
                ctx.fillStyle = codeFg;
            }
            ctx.fillText(line, x + 8, lineY);
            lineY += lineH;
        }
    }

    // CJK-aware character wrap
    _wrapCJK(ctx, text, maxWidth) {
        const chars = text.split('');
        const lines = [];
        let line = '';
        for (const ch of chars) {
            const test = line + ch;
            if (ctx.measureText(test).width > maxWidth && line.length > 0) {
                lines.push(line);
                line = ch;
            } else {
                line = test;
            }
        }
        if (line) lines.push(line);
        return lines;
    }

    // ---------------- footer ----------------
    _drawFooter(ctx, w, h, subColor, textColor) {
        ctx.fillStyle = subColor;
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';

        const step    = this.steps[this._currentStep];
        const stepNum = this._currentStep + 1;
        const status  = '阶段 ' + stepNum + '/4: ' + step.label +
                        '  ·  ' + (this._playing ? '播放中' : '已暂停') +
                        '  ·  速度 ×' + (this.speed || 1).toFixed(1);

        ctx.fillText(status, 16, h - 6);
        ctx.textAlign = 'right';
        ctx.fillText('CH14  ·  DeepResearch 经典四步范式  ·  任务树 + 引用追溯', w - 16, h - 6);
        ctx.textAlign = 'left';
    }

    // ---------------- tooltip ----------------
    _drawTooltip(ctx, w, h, textColor, subColor, borderCol, dark) {
        const i = this._hoverStep;
        if (i < 0 || i >= this.steps.length) return;
        const step = this.steps[i];

        // Position the tooltip just below the step bar; center on the hovered
        // step, clamp to the canvas. The tooltip will overlap the top of the
        // tree panel, but it has an opaque background so the overlap is clean.
        const margin     = 70;
        const innerW     = w - margin * 2;
        const stepSpacing = innerW / (this.steps.length - 1);
        const stepCx     = margin + i * stepSpacing;
        const tipW       = 240;
        const tipH       = 70;
        const tipX       = Math.max(8, Math.min(w - tipW - 8, stepCx - tipW / 2));
        const tipY       = 98;

        // Opaque background
        ctx.fillStyle = dark ? 'rgba(15,23,42,0.98)' : 'rgba(255,255,255,0.98)';
        this.roundRect(ctx, tipX, tipY, tipW, tipH, 8);
        ctx.fill();
        ctx.strokeStyle = step.color;
        ctx.lineWidth = 1.5;
        this.roundRect(ctx, tipX, tipY, tipW, tipH, 8);
        ctx.stroke();

        // Step label header
        ctx.fillStyle = step.color;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(step.label, tipX + 10, tipY + 8);

        // Status marker on the right
        const isCurrent = i === this._currentStep;
        const isDone    = i < this._currentStep;
        if (isCurrent) {
            ctx.fillStyle = step.color;
            ctx.font = '9px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText('● 进行中', tipX + tipW - 10, tipY + 10);
        } else if (isDone) {
            ctx.fillStyle = '#10B981';
            ctx.textAlign = 'right';
            ctx.fillText('✓ 已完成', tipX + tipW - 10, tipY + 10);
        } else {
            ctx.fillStyle = subColor;
            ctx.textAlign = 'right';
            ctx.fillText('○ 待执行', tipX + tipW - 10, tipY + 10);
        }
        ctx.textAlign = 'left';

        // Detail text (wrapped)
        const detailLines = this._wrapCJK(ctx, step.detail, tipW - 20);
        ctx.fillStyle = subColor;
        ctx.font = '10px sans-serif';
        let lineY = tipY + 30;
        for (const line of detailLines) {
            ctx.fillText(line, tipX + 10, lineY);
            lineY += 13;
        }

        // Pointer triangle (toward the step circle)
        ctx.beginPath();
        ctx.moveTo(stepCx, tipY - 5);
        ctx.lineTo(stepCx - 5, tipY);
        ctx.lineTo(stepCx + 5, tipY);
        ctx.closePath();
        ctx.fillStyle = step.color;
        ctx.fill();
    }
}

registerAnimation('ch14-task-tree', () => new Ch14DeepResearch());

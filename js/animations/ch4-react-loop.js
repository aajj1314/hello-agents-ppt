/**
 * CH4: Three Agent Paradigms Comparison
 * Tabbed visualizer for ReAct / Plan-and-Solve / Reflection loops
 */
import { CanvasAnimation } from './canvas-animation.js';
import { registerAnimation } from './animation-registry.js';

class Ch4Paradigms extends CanvasAnimation {
    constructor() {
        super();
        this.paradigm = 0;
        this.subStep = 0;
        this._playing = false;
        this._rafId = null;
        this.speed = 1;
        this.lastStepTime = 0;

        this.tabs = [
            { id: 0, label: 'ReAct', tagline: 'Reason + Act' },
            { id: 1, label: 'Plan-and-Solve', tagline: 'Plan, then Solve' },
            { id: 2, label: 'Reflection', tagline: 'Execute, Reflect, Refine' }
        ];

        this.reactSteps = [
            {
                thought: '需要查询华为最新手机，自身知识可能不足。',
                action: 'Search["华为最新手机"]',
                observation: '搜索结果: HUAWEI Pura 80 Pro+ / Mate 70 等。'
            },
            {
                thought: '需要进一步了解具体卖点。',
                action: 'Search["Pura 80 Pro+ 卖点"]',
                observation: '麒麟 9010 · 超聚光影像 · 100W 快充。'
            },
            {
                thought: '已收集足够信息，可以汇总回答。',
                action: 'Finish["综合回答"]',
                observation: '任务完成 — 输出最终答案。'
            }
        ];

        this.planSteps = [
            { id: 1, text: '计算周一销量: 15 个' },
            { id: 2, text: '计算周二销量: 15 × 2 = 30' },
            { id: 3, text: '计算周三销量: 30 − 5 = 25' },
            { id: 4, text: '求和: 15 + 30 + 25 = 70' }
        ];

        this.reflectionSteps = [
            {
                phase: '初稿 (试除法)',
                artifact: 'def find_primes(n):\n  for i in range(2, n):\n    for j in range(2, i): ...',
                feedback: '时间复杂度 O(n√n)，存在重复试除。',
                verdict: '需改进'
            },
            {
                phase: '反思',
                artifact: '当前为试除法；建议改用埃拉托斯特尼筛法。',
                feedback: '筛法可达 O(n log log n)。',
                verdict: '可优化'
            },
            {
                phase: '优化稿 (筛法)',
                artifact: 'def find_primes(n):\n  is_prime = [True] * (n+1)\n  p = 2\n  while p*p <= n: ...',
                feedback: '算法复杂度已最优，无需进一步改进。',
                verdict: '通过'
            }
        ];

        this.comparison = [
            { label: '触发条件', values: ['需外部实时数据', '任务步骤明确', '结果质量要求极高'] },
            { label: '循环结构', values: ['思考 → 行动 → 观察', '规划 → 逐步执行', '执行 → 反思 → 优化'] },
            { label: '适用场景', values: ['搜索 / API / 数据库', '数学题 / 长报告 / 代码生成', '关键代码 / 论文 / 科研分析'] },
            { label: '代价', values: ['多次 LLM 调用', '需重规划机制', '成本与延迟成倍'] }
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
        const animId = 'ch4-react-loop';
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
        this.canvas.addEventListener('click', (e) => this._onCanvasClick(e));
    }

    _onCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const tab = this._hitTestTab(x, y);
        if (tab !== -1 && tab !== this.paradigm) {
            this.paradigm = tab;
            this.subStep = 0;
            this.draw();
        }
    }

    _hitTestTab(x, y) {
        if (y < 8 || y > 42) return -1;
        const tabW = 130;
        const gap = 12;
        const totalW = this.tabs.length * tabW + (this.tabs.length - 1) * gap;
        const startX = (this.width - totalW) / 2;
        for (let i = 0; i < this.tabs.length; i++) {
            const tx = startX + i * (tabW + gap);
            if (x >= tx && x <= tx + tabW) return i;
        }
        return -1;
    }

    togglePlay() {
        if (this._playing) {
            this._playing = false;
            cancelAnimationFrame(this._rafId);
            const btn = document.getElementById('btn-play-ch4-react-loop');
            if (btn) btn.textContent = '▶ 播放';
            return;
        }
        this._playing = true;
        const btn = document.getElementById('btn-play-ch4-react-loop');
        if (btn) btn.textContent = '⏸ 暂停';
        this.lastStepTime = 0;
        this._loop();
    }

    _loop() {
        if (!this._playing) return;
        const now = performance.now();
        if (!this.lastStepTime) this.lastStepTime = now;
        const subDur = 1600 / this.speed;
        if (now - this.lastStepTime >= subDur) {
            this.subStep++;
            // Each paradigm cycles through 3 sub-steps; 3 sub-steps ≈ 5 seconds at speed 1
            if (this.subStep > 2) {
                this.subStep = 0;
                this.paradigm = (this.paradigm + 1) % this.tabs.length;
            }
            this.lastStepTime = now;
            this.draw();
        }
        this._rafId = requestAnimationFrame(() => this._loop());
    }

    stepForward() {
        this.subStep++;
        if (this.subStep > 2) {
            this.subStep = 0;
            this.paradigm = (this.paradigm + 1) % this.tabs.length;
        }
        this.draw();
    }

    reset() {
        this._playing = false;
        cancelAnimationFrame(this._rafId);
        this.paradigm = 0;
        this.subStep = 0;
        this.lastStepTime = 0;
        const btn = document.getElementById('btn-play-ch4-react-loop');
        if (btn) btn.textContent = '▶ 播放';
        this.draw();
    }

    setSpeed(v) {
        this.speed = v;
    }

    play() {
        if (!this._playing) this.togglePlay();
    }

    pause() {
        if (this._playing) this.togglePlay();
    }

    step() {
        this.stepForward();
    }

    _withAlpha(hex, alpha) {
        if (typeof hex !== 'string' || hex[0] !== '#' || hex.length < 7) return hex;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /** Returns a darkened variant of a hex color (amount in [-1, 0]). */
    _shade(hex, amount) {
        if (typeof hex !== 'string' || hex[0] !== '#' || hex.length < 7) return hex;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const t = amount < 0 ? 0 : 255;
        const p = Math.abs(amount);
        const nr = Math.round((t - r) * p + r);
        const ng = Math.round((t - g) * p + g);
        const nb = Math.round((t - b) * p + b);
        return '#' + [nr, ng, nb].map(v => v.toString(16).padStart(2, '0')).join('');
    }

    draw() {
        const ctx = this.ctx, w = this.width, h = this.height;
        const t = this.theme();
        const dark = this.isDarkTheme();
        const bg = dark ? t.surfaceDarkSoft : t.canvas;
        const textColor = t.ink;
        const subColor = t.muted;
        const panelBg = dark ? t.surfaceDark : t.canvas;
        const border = t.hairline;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        this._drawTabs(ctx, w, textColor, subColor, border, t);
        this._drawParadigm(ctx, w, h, textColor, subColor, panelBg, border, t);
        this._drawComparison(ctx, w, h, textColor, subColor, panelBg, border, t);
        this._drawStatusBar(ctx, w, h, subColor, t);
    }

    // Accent key per paradigm: 0 → primary (coral), 1 → accentTeal, 2 → accentAmber
    _paradigmAccent(i, t) {
        if (i === 0) return t.primary;
        if (i === 1) return t.accentTeal;
        return t.accentAmber;
    }

    _drawTabs(ctx, w, textColor, subColor, border, t) {
        const tabW = 130;
        const tabH = 32;
        const gap = 12;
        const totalW = this.tabs.length * tabW + (this.tabs.length - 1) * gap;
        const startX = (w - totalW) / 2;
        const y = 8;
        const dark = this.isDarkTheme();

        for (let i = 0; i < this.tabs.length; i++) {
            const tab = this.tabs[i];
            const x = startX + i * (tabW + gap);
            const active = i === this.paradigm;
            const accent = this._paradigmAccent(i, t);

            // background
            ctx.fillStyle = active
                ? (dark ? t.surfaceDark : t.canvas)
                : this._withAlpha(t.muted, dark ? 0.15 : 0.12);
            this.roundRect(ctx, x, y, tabW, tabH, 8);
            ctx.fill();

            // accent bar
            ctx.fillStyle = accent;
            if (active) {
                this.roundRect(ctx, x, y, 4, tabH, 2);
                ctx.fill();
            }

            // border
            ctx.strokeStyle = active ? accent : border;
            ctx.lineWidth = active ? 2 : 1;
            this.roundRect(ctx, x, y, tabW, tabH, 8);
            ctx.stroke();

            // label
            ctx.fillStyle = active ? textColor : subColor;
            ctx.font = active ? 'bold 13px sans-serif' : '600 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(tab.label, x + tabW / 2 + (active ? 4 : 0), y + 12);

            // tagline
            ctx.fillStyle = active ? accent : subColor;
            ctx.font = '9px sans-serif';
            ctx.fillText(tab.tagline, x + tabW / 2, y + 25);
        }
    }

    _drawParadigm(ctx, w, h, textColor, subColor, panelBg, border, t) {
        // Left main panel for paradigm visualization
        const mainX = 16;
        const mainY = 52;
        const mainW = w * 0.58;
        const mainH = h - mainY - 38;

        ctx.fillStyle = panelBg;
        this.roundRect(ctx, mainX, mainY, mainW, mainH, 10);
        ctx.fill();
        ctx.strokeStyle = border;
        ctx.lineWidth = 1;
        ctx.stroke();

        const titleMap = [
            'ReAct: 思考 → 行动 → 观察',
            'Plan-and-Solve: 规划 → 逐步执行',
            'Reflection: 执行 → 反思 → 优化'
        ];
        ctx.fillStyle = textColor;
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(titleMap[this.paradigm], mainX + 14, mainY + 10);

        if (this.paradigm === 0) this._drawReActViz(ctx, mainX, mainY, mainW, mainH, textColor, subColor, panelBg, border, t);
        else if (this.paradigm === 1) this._drawPlanSolveViz(ctx, mainX, mainY, mainW, mainH, textColor, subColor, panelBg, border, t);
        else this._drawReflectionViz(ctx, mainX, mainY, mainW, mainH, textColor, subColor, panelBg, border, t);
    }

    _drawReActViz(ctx, x, y, w, h, textColor, subColor, panelBg, border, t) {
        const idx = Math.min(this.subStep, this.reactSteps.length - 1);
        const step = this.reactSteps[idx];
        const phase = this.subStep % 3; // 0 thought, 1 action, 2 observation
        const dark = this.isDarkTheme();
        const reactAccent = this._paradigmAccent(0, t); // primary (coral)
        const toolAccent  = this._paradigmAccent(1, t); // accentTeal
        const obsAccent   = t.success;                  // green
        const thoughtAccent = this._paradigmAccent(2, t); // accentAmber

        // Layout
        const cx = x + w / 2;
        const topY = y + 44;
        const brainY = y + h * 0.45;
        const toolY = y + h * 0.78;

        // Question box
        ctx.fillStyle = this._withAlpha(reactAccent, dark ? 0.18 : 0.10);
        this.roundRect(ctx, x + 16, topY, w - 32, 30, 6);
        ctx.fill();
        ctx.strokeStyle = reactAccent;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = textColor;
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('问题: 华为最新手机是什么？', x + 26, topY + 15);

        // LLM circle
        this._drawCircle(ctx, cx, brainY, 30, 'LLM', reactAccent, phase === 0, textColor, t);

        // Tool box
        const toolColor = phase === 1 ? toolAccent : t.muted;
        ctx.fillStyle = this._withAlpha(toolAccent, dark ? 0.18 : 0.10);
        this.roundRect(ctx, cx - 90, toolY - 20, 180, 40, 6);
        ctx.fill();
        ctx.strokeStyle = toolColor;
        ctx.lineWidth = phase === 1 ? 2.5 : 1.2;
        ctx.stroke();
        ctx.fillStyle = textColor;
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const actionText = step.action.length > 28 ? step.action.substring(0, 28) + '…' : step.action;
        ctx.fillText(actionText, cx, toolY - 6);
        ctx.fillStyle = subColor;
        ctx.font = '9px sans-serif';
        ctx.fillText('Tool Executor', cx, toolY + 10);

        // Arrows: brain -> tool
        const arrowAlpha = phase >= 1 ? 1 : 0.25;
        ctx.beginPath();
        ctx.moveTo(cx, brainY + 30);
        ctx.lineTo(cx, toolY - 20);
        ctx.strokeStyle = this._withAlpha(toolAccent, arrowAlpha);
        ctx.lineWidth = 2.5;
        ctx.stroke();
        if (phase >= 1) this._arrowHead(ctx, cx, toolY - 20, cx, toolY - 28, toolAccent);

        // Observation arrow: tool -> brain (curved)
        const obsAlpha = phase === 2 ? 1 : 0.25;
        ctx.beginPath();
        ctx.moveTo(cx + 30, toolY - 5);
        ctx.quadraticCurveTo(cx + 90, (brainY + toolY) / 2, cx + 30, brainY + 18);
        ctx.strokeStyle = this._withAlpha(obsAccent, obsAlpha);
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        if (phase === 2) this._arrowHead(ctx, cx + 30, brainY + 18, cx + 30, brainY + 8, obsAccent);

        // Thought bubble (right of brain)
        ctx.fillStyle = this._withAlpha(thoughtAccent, dark ? 0.18 : 0.10);
        this.roundRect(ctx, cx + 50, brainY - 18, w - 80, 36, 6);
        ctx.fill();
        ctx.strokeStyle = phase === 0 ? thoughtAccent : this._shade(thoughtAccent, -0.2);
        ctx.lineWidth = phase === 0 ? 2 : 1.2;
        ctx.stroke();
        ctx.fillStyle = dark ? thoughtAccent : this._shade(thoughtAccent, -0.4);
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const tShort = step.thought.length > 36 ? step.thought.substring(0, 36) + '…' : step.thought;
        ctx.fillText('Thought: ' + tShort, cx + 58, brainY);

        // Observation bubble (left of brain)
        if (phase >= 2 || this.subStep > 0) {
            ctx.fillStyle = this._withAlpha(obsAccent, dark ? 0.18 : 0.10);
            this.roundRect(ctx, x + 16, brainY - 18, w * 0.32, 36, 6);
            ctx.fill();
            ctx.strokeStyle = phase === 2 ? obsAccent : this._shade(obsAccent, 0.2);
            ctx.lineWidth = phase === 2 ? 2 : 1.2;
            ctx.stroke();
            ctx.fillStyle = dark ? obsAccent : this._shade(obsAccent, -0.3);
            ctx.font = '9px sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            const obs = step.observation.length > 30 ? step.observation.substring(0, 30) + '…' : step.observation;
            ctx.fillText('Obs: ' + obs, x + 24, brainY);
        }

        // Phase indicator
        const phases = ['Thought 思考', 'Action 行动', 'Observation 观察'];
        const phaseColors = [thoughtAccent, toolAccent, obsAccent];
        const py = y + h - 22;
        for (let i = 0; i < 3; i++) {
            const active = i === phase;
            ctx.fillStyle = active ? phaseColors[i] : (dark ? t.muted : t.hairline);
            ctx.beginPath();
            ctx.arc(x + 30 + i * 110, py, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = active ? phaseColors[i] : subColor;
            ctx.font = active ? 'bold 10px sans-serif' : '9px sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(phases[i], x + 40 + i * 110, py);
        }
    }

    _drawPlanSolveViz(ctx, x, y, w, h, textColor, subColor, panelBg, border, t) {
        const phase = this.subStep % 3; // 0 plan, 1 execute, 2 done
        const dark = this.isDarkTheme();
        const planAccent = this._paradigmAccent(1, t); // accentTeal
        const doneAccent = t.success;

        // Plan node (top) with 4 sub-tasks listed
        const planX = x + 16;
        const planY = y + 40;
        const planW = w - 32;
        const planH = 56;

        ctx.fillStyle = this._withAlpha(planAccent, dark ? 0.18 : 0.10);
        this.roundRect(ctx, planX, planY, planW, planH, 8);
        ctx.fill();
        ctx.strokeStyle = phase === 0 ? planAccent : this._shade(planAccent, 0.2);
        ctx.lineWidth = phase === 0 ? 2 : 1.2;
        ctx.stroke();

        ctx.fillStyle = textColor;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('Plan: [ 分解问题 ]', planX + 10, planY + 8);

        ctx.fillStyle = subColor;
        ctx.font = '10px sans-serif';
        const completedCount = phase === 0 ? 0 : (phase === 1 ? Math.min(this.subStep, this.planSteps.length) : this.planSteps.length);
        const completedSteps = this.planSteps.slice(0, completedCount).map(s => s.text).join('  →  ');
        const remainingSteps = this.planSteps.slice(completedCount).map(s => s.text).join('  →  ');
        if (remainingSteps) {
            const lines = this._inlineList(planW - 20, completedSteps, remainingSteps);
            ctx.fillStyle = dark ? planAccent : this._shade(planAccent, -0.3);
            ctx.fillText(lines[0] || completedSteps, planX + 10, planY + 26);
            if (lines[1]) {
                ctx.fillStyle = subColor;
                ctx.fillText(lines[1], planX + 10, planY + 40);
            }
        } else {
            ctx.fillStyle = dark ? planAccent : this._shade(planAccent, -0.3);
            ctx.fillText(completedSteps, planX + 10, planY + 28);
        }

        // Solve stages: 4 vertical step boxes
        const stageY = planY + planH + 16;
        const stageH = (y + h - 30) - stageY;
        const stageW = (planW - 24) / 4;

        for (let i = 0; i < this.planSteps.length; i++) {
            const sx = planX + i * (stageW + 8);
            const isDone = i < completedCount;
            const isActive = phase === 1 && i === completedCount;
            const stageColor = isActive ? planAccent : (isDone ? doneAccent : (dark ? t.muted : t.hairline));

            ctx.fillStyle = isActive
                ? this._withAlpha(planAccent, dark ? 0.18 : 0.10)
                : (isDone
                    ? this._withAlpha(doneAccent, dark ? 0.18 : 0.10)
                    : (dark ? t.surfaceDark : t.surfaceCard));
            this.roundRect(ctx, sx, stageY, stageW, stageH, 6);
            ctx.fill();
            ctx.strokeStyle = stageColor;
            ctx.lineWidth = isActive ? 2 : 1;
            ctx.stroke();

            // step number
            ctx.fillStyle = isActive ? planAccent : (isDone ? doneAccent : subColor);
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText('步骤 ' + (i + 1), sx + stageW / 2, stageY + 8);

            // check mark / active pulse
            if (isDone) {
                ctx.fillStyle = doneAccent;
                ctx.beginPath();
                ctx.arc(sx + stageW / 2, stageY + 28, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = t.onPrimary;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(sx + stageW / 2 - 4, stageY + 28);
                ctx.lineTo(sx + stageW / 2 - 1, stageY + 31);
                ctx.lineTo(sx + stageW / 2 + 4, stageY + 25);
                ctx.stroke();
            } else if (isActive) {
                ctx.fillStyle = planAccent;
                ctx.beginPath();
                ctx.arc(sx + stageW / 2, stageY + 28, 7, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.strokeStyle = subColor;
                ctx.beginPath();
                ctx.arc(sx + stageW / 2, stageY + 28, 7, 0, Math.PI * 2);
                ctx.stroke();
            }

            // text
            ctx.fillStyle = isActive || isDone ? textColor : subColor;
            ctx.font = '9px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            const txt = this.planSteps[i].text;
            const lines = this.wrapText(ctx, txt, sx + stageW / 2, stageY + 44, stageW - 10, 11);
            // wrapText returns array of strings; render them
        }

        // Connectors between stages
        for (let i = 0; i < this.planSteps.length - 1; i++) {
            const x1 = planX + (i + 1) * stageW + i * 8;
            const x2 = planX + (i + 1) * (stageW + 8);
            const isDone = i + 1 <= completedCount;
            ctx.beginPath();
            ctx.moveTo(x1, stageY + 28);
            ctx.lineTo(x2, stageY + 28);
            ctx.strokeStyle = isDone ? doneAccent : subColor;
            ctx.lineWidth = isDone ? 2 : 1;
            ctx.stroke();
        }
    }

    _inlineList(maxWidth, done, rest) {
        // Helper: not strictly needed; returns the strings as a list for two-line layout
        return [done, rest].filter(Boolean);
    }

    _drawReflectionViz(ctx, x, y, w, h, textColor, subColor, panelBg, border, t) {
        const phase = this.subStep % 3;
        const step = this.reflectionSteps[Math.min(phase, this.reflectionSteps.length - 1)];
        const dark = this.isDarkTheme();
        const prodAccent = this._paradigmAccent(0, t); // primary (coral)
        const critAccent = this._paradigmAccent(2, t); // accentAmber
        const loopActiveColor = t.accentAmber;
        const doneAccent = t.success;

        // Producer box (top-left), Critic box (top-right)
        const boxH = 50;
        const topY = y + 40;
        const leftX = x + 16;
        const rightX = x + w / 2 + 6;
        const boxW = w / 2 - 22;

        // Producer
        const prodColor = phase === 0 ? prodAccent : (phase === 2 ? doneAccent : this._shade(prodAccent, 0.1));
        ctx.fillStyle = phase === 0
            ? this._withAlpha(prodAccent, dark ? 0.18 : 0.10)
            : this._withAlpha(prodAccent, dark ? 0.10 : 0.06);
        this.roundRect(ctx, leftX, topY, boxW, boxH, 8);
        ctx.fill();
        ctx.strokeStyle = prodColor;
        ctx.lineWidth = phase === 0 ? 2.5 : 1.5;
        ctx.stroke();
        ctx.fillStyle = textColor;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('Producer (执行者)', leftX + 10, topY + 8);
        ctx.fillStyle = subColor;
        ctx.font = '9px sans-serif';
        ctx.fillText('生成初稿 / 优化稿', leftX + 10, topY + 24);
        ctx.fillStyle = prodColor;
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(step.phase, leftX + 10, topY + 36);

        // Critic
        const critActive = phase === 1;
        const critColor = critActive ? critAccent : (phase === 2 && step.verdict === '通过' ? doneAccent : this._shade(critAccent, -0.15));
        ctx.fillStyle = critActive
            ? this._withAlpha(critAccent, dark ? 0.18 : 0.10)
            : (dark ? t.surfaceDark : t.surfaceCard);
        this.roundRect(ctx, rightX, topY, boxW, boxH, 8);
        ctx.fill();
        ctx.strokeStyle = critColor;
        ctx.lineWidth = critActive ? 2.5 : 1.5;
        ctx.stroke();
        ctx.fillStyle = textColor;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('Critic (评审员)', rightX + 10, topY + 8);
        ctx.fillStyle = subColor;
        ctx.font = '9px sans-serif';
        ctx.fillText('审视输出，产出反馈', rightX + 10, topY + 24);
        ctx.fillStyle = critColor;
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(critActive ? '正在反思…' : step.verdict, rightX + 10, topY + 36);

        // Arrow Producer -> Critic
        ctx.beginPath();
        ctx.moveFrom && ctx.moveFrom(); // (placeholder to keep linter happy)
        ctx.moveTo(leftX + boxW, topY + boxH / 2);
        ctx.lineTo(rightX, topY + boxH / 2);
        ctx.strokeStyle = phase >= 1 ? prodAccent : (dark ? t.muted : t.hairline);
        ctx.lineWidth = phase >= 1 ? 2 : 1;
        ctx.stroke();
        if (phase >= 1) this._arrowHead(ctx, rightX, topY + boxH / 2, rightX - 6, topY + boxH / 2, prodAccent);

        // Loop arrow Critic -> Producer (curved)
        const loopY = topY + boxH + 16;
        const loopActive = step.verdict === '需改进' || step.verdict === '可优化' || critActive;
        ctx.beginPath();
        ctx.moveTo(rightX + boxW / 2, topY + boxH);
        ctx.quadraticCurveTo(rightX + boxW / 2, loopY + 30, rightX - 20, loopY + 30);
        ctx.quadraticCurveTo(leftX + boxW / 2 - 20, loopY + 30, leftX + boxW / 2, topY + boxH);
        ctx.strokeStyle = loopActive ? loopActiveColor : (dark ? t.muted : t.hairline);
        ctx.lineWidth = loopActive ? 2 : 1;
        ctx.setLineDash(loopActive ? [5, 4] : []);
        ctx.stroke();
        ctx.setLineDash([]);
        if (loopActive) this._arrowHead(ctx, leftX + boxW / 2, topY + boxH, leftX + boxW / 2, topY + boxH + 6, loopActiveColor);

        // Loop label
        if (loopActive) {
            ctx.fillStyle = loopActiveColor;
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('回环重做 (不满意)', (leftX + rightX + boxW) / 2, loopY + 30);
        } else {
            ctx.fillStyle = doneAccent;
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('满意，停止迭代', (leftX + rightX + boxW) / 2, loopY + 30);
        }

        // Artifact + feedback panel (bottom)
        const codeY = loopY + 46;
        const codeH = (y + h - 24) - codeY;

        // code panel
        ctx.fillStyle = dark ? t.surfaceDark : t.surfaceCard;
        this.roundRect(ctx, leftX, codeY, w - 32, codeH, 8);
        ctx.fill();
        ctx.strokeStyle = dark ? t.muted : t.hairline;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = dark ? t.onDarkSoft : t.muted;
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('▍ 产出物', leftX + 10, codeY + 8);

        ctx.fillStyle = textColor;
        ctx.font = '10px monospace';
        const artifact = step.artifact;
        const lines = artifact.split('\n');
        let lineY = codeY + 24;
        for (let i = 0; i < Math.min(lines.length, 3); i++) {
            const line = lines[i];
            const truncated = line.length > 50 ? line.substring(0, 50) + '…' : line;
            ctx.fillText(truncated, leftX + 10, lineY);
            lineY += 13;
        }

        if (step.feedback) {
            ctx.fillStyle = critActive ? critAccent : (dark ? critAccent : this._shade(critAccent, -0.4));
            ctx.font = '9px sans-serif';
            ctx.fillText('反馈: ' + step.feedback, leftX + 10, codeY + codeH - 16);
        }
    }

    _drawComparison(ctx, w, h, textColor, subColor, panelBg, border, t) {
        const rx = w * 0.6 + 12;
        const ry = 52;
        const rw = w * 0.4 - 28;
        const rh = h - ry - 38;
        const dark = this.isDarkTheme();
        const accent = this._paradigmAccent(this.paradigm, t);

        ctx.fillStyle = panelBg;
        this.roundRect(ctx, rx, ry, rw, rh, 10);
        ctx.fill();
        ctx.strokeStyle = border;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Title
        ctx.fillStyle = textColor;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('范式对比', rx + 12, ry + 8);

        // Table header
        const colNames = ['维度', this.tabs[0].label, this.tabs[1].label, this.tabs[2].label];
        const colXs = [rx + 12, rx + 70, rx + 130, rx + 200];
        const headerY = ry + 32;
        ctx.font = 'bold 9px sans-serif';
        ctx.fillStyle = subColor;
        colNames.forEach((name, i) => {
            ctx.fillText(name, colXs[i], headerY);
        });

        // Header underline
        ctx.beginPath();
        ctx.moveTo(rx + 8, headerY + 14);
        ctx.lineTo(rx + rw - 8, headerY + 14);
        ctx.strokeStyle = border;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Rows
        let rowY = headerY + 22;
        for (let r = 0; r < this.comparison.length; r++) {
            const row = this.comparison[r];
            // row label
            ctx.fillStyle = textColor;
            ctx.font = 'bold 9px sans-serif';
            ctx.textBaseline = 'top';
            ctx.fillText(row.label, colXs[0], rowY);

            // values
            for (let c = 0; c < 3; c++) {
                const isActive = c === this.paradigm;
                if (isActive) {
                    ctx.fillStyle = this._withAlpha(accent, dark ? 0.18 : 0.10);
                    this.roundRect(ctx, colXs[c + 1] - 4, rowY - 3, rw - (colXs[c + 1] - rx) - 4, 32, 4);
                    ctx.fill();
                }
                ctx.fillStyle = isActive ? textColor : subColor;
                ctx.font = isActive ? 'bold 9px sans-serif' : '9px sans-serif';
                const val = row.values[c];
                const lines = this.wrapText(ctx, val, colXs[c + 1], rowY, rw - (colXs[c + 1] - rx) - 8, 11);
            }

            rowY += 38;
        }
    }

    _drawStatusBar(ctx, w, h, subColor, t) {
        const tabs = this.tabs;
        const phaseNames = {
            0: ['Thought', 'Action', 'Observation'],
            1: ['Plan', 'Solve', 'Done'],
            2: ['Execute', 'Reflect', 'Refine']
        };
        const subPhase = phaseNames[this.paradigm][Math.min(this.subStep, 2)];
        const text = `当前范式: ${tabs[this.paradigm].label}   ·   阶段: ${subPhase}   ·   进度: ${this.subStep + 1}/3`;
        ctx.fillStyle = subColor;
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(text, 18, h - 12);

        // paradigm index dots
        const dotY = h - 16;
        const dark = this.isDarkTheme();
        for (let i = 0; i < tabs.length; i++) {
            const isCurrent = i === this.paradigm;
            ctx.fillStyle = isCurrent
                ? this._paradigmAccent(i, t)
                : (dark ? t.muted : t.hairline);
            ctx.beginPath();
            ctx.arc(w - 80 + i * 14, dotY, 3.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    _drawCircle(ctx, x, y, r, label, color, active, textColor, t) {
        if (active) {
            ctx.beginPath();
            ctx.arc(x, y, r + 8, 0, Math.PI * 2);
            ctx.fillStyle = this._withAlpha(color, 0.3);
            ctx.fill();
        }
        const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.2, x, y, r);
        grad.addColorStop(0, t.surfaceCard);
        grad.addColorStop(1, color);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = active ? 2.5 : 1.5;
        ctx.stroke();
        ctx.fillStyle = t.onPrimary;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x, y);
    }

    _arrowHead(ctx, fromX, fromY, toX, toY, color) {
        const ang = Math.atan2(toY - fromY, toX - fromX);
        const headLen = 7;
        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headLen * Math.cos(ang - 0.4), toY - headLen * Math.sin(ang - 0.4));
        ctx.lineTo(toX - headLen * Math.cos(ang + 0.4), toY - headLen * Math.sin(ang + 0.4));
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    }
}

registerAnimation('ch4-react-loop', () => new Ch4Paradigms());

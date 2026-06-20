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

    draw() {
        const ctx = this.ctx, w = this.width, h = this.height;
        const dark = this.isDarkTheme();
        const bg = dark ? '#0F172A' : '#F8FAFC';
        const textColor = dark ? '#F1F5F9' : '#0F172A';
        const subColor = dark ? '#94A3B8' : '#475569';
        const panelBg = dark ? '#1E293B' : '#FFFFFF';
        const border = dark ? '#334155' : '#CBD5E1';

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        this._drawTabs(ctx, w, textColor, subColor, border);
        this._drawParadigm(ctx, w, h, textColor, subColor, panelBg, border);
        this._drawComparison(ctx, w, h, textColor, subColor, panelBg, border);
        this._drawStatusBar(ctx, w, h, subColor);
    }

    _drawTabs(ctx, w, textColor, subColor, border) {
        const tabW = 130;
        const tabH = 32;
        const gap = 12;
        const totalW = this.tabs.length * tabW + (this.tabs.length - 1) * gap;
        const startX = (w - totalW) / 2;
        const y = 8;
        const accentPalette = ['#6366F1', '#0EA5E9', '#F59E0B'];

        for (let i = 0; i < this.tabs.length; i++) {
            const t = this.tabs[i];
            const x = startX + i * (tabW + gap);
            const active = i === this.paradigm;
            const accent = accentPalette[i];

            // background
            ctx.fillStyle = active
                ? (this.isDarkTheme() ? '#1E293B' : '#FFFFFF')
                : (this.isDarkTheme() ? 'rgba(30,41,59,0.5)' : 'rgba(241,245,249,0.6)');
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
            ctx.fillText(t.label, x + tabW / 2 + (active ? 4 : 0), y + 12);

            // tagline
            ctx.fillStyle = active ? accent : subColor;
            ctx.font = '9px sans-serif';
            ctx.fillText(t.tagline, x + tabW / 2, y + 25);
        }
    }

    _drawParadigm(ctx, w, h, textColor, subColor, panelBg, border) {
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

        if (this.paradigm === 0) this._drawReActViz(ctx, mainX, mainY, mainW, mainH, textColor, subColor, panelBg, border);
        else if (this.paradigm === 1) this._drawPlanSolveViz(ctx, mainX, mainY, mainW, mainH, textColor, subColor, panelBg, border);
        else this._drawReflectionViz(ctx, mainX, mainY, mainW, mainH, textColor, subColor, panelBg, border);
    }

    _drawReActViz(ctx, x, y, w, h, textColor, subColor, panelBg, border) {
        const idx = Math.min(this.subStep, this.reactSteps.length - 1);
        const step = this.reactSteps[idx];
        const phase = this.subStep % 3; // 0 thought, 1 action, 2 observation

        // Layout
        const cx = x + w / 2;
        const topY = y + 44;
        const brainY = y + h * 0.45;
        const toolY = y + h * 0.78;

        // Question box
        ctx.fillStyle = this.isDarkTheme() ? '#1E1B4B' : '#EEF2FF';
        this.roundRect(ctx, x + 16, topY, w - 32, 30, 6);
        ctx.fill();
        ctx.strokeStyle = '#6366F1';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = textColor;
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('问题: 华为最新手机是什么？', x + 26, topY + 15);

        // LLM circle
        this._drawCircle(ctx, cx, brainY, 30, 'LLM', '#6366F1', phase === 0, textColor);

        // Tool box
        const toolColor = phase === 1 ? '#3B82F6' : '#64748B';
        ctx.fillStyle = this.isDarkTheme() ? '#1E3A8A' : '#DBEAFE';
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
        ctx.strokeStyle = `rgba(59,130,246,${arrowAlpha})`;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        if (phase >= 1) this._arrowHead(ctx, cx, toolY - 20, cx, toolY - 28, '#3B82F6');

        // Observation arrow: tool -> brain (curved)
        const obsAlpha = phase === 2 ? 1 : 0.25;
        ctx.beginPath();
        ctx.moveTo(cx + 30, toolY - 5);
        ctx.quadraticCurveTo(cx + 90, (brainY + toolY) / 2, cx + 30, brainY + 18);
        ctx.strokeStyle = `rgba(16,185,129,${obsAlpha})`;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        if (phase === 2) this._arrowHead(ctx, cx + 30, brainY + 18, cx + 30, brainY + 8, '#10B981');

        // Thought bubble (right of brain)
        ctx.fillStyle = this.isDarkTheme() ? '#422006' : '#FEF3C7';
        this.roundRect(ctx, cx + 50, brainY - 18, w - 80, 36, 6);
        ctx.fill();
        ctx.strokeStyle = phase === 0 ? '#D97706' : '#A16207';
        ctx.lineWidth = phase === 0 ? 2 : 1.2;
        ctx.stroke();
        ctx.fillStyle = this.isDarkTheme() ? '#FCD34D' : '#78350F';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const t = step.thought.length > 36 ? step.thought.substring(0, 36) + '…' : step.thought;
        ctx.fillText('Thought: ' + t, cx + 58, brainY);

        // Observation bubble (left of brain)
        if (phase >= 2 || this.subStep > 0) {
            ctx.fillStyle = this.isDarkTheme() ? '#064E3B' : '#D1FAE5';
            this.roundRect(ctx, x + 16, brainY - 18, w * 0.32, 36, 6);
            ctx.fill();
            ctx.strokeStyle = phase === 2 ? '#059669' : '#A7F3D0';
            ctx.lineWidth = phase === 2 ? 2 : 1.2;
            ctx.stroke();
            ctx.fillStyle = this.isDarkTheme() ? '#6EE7B7' : '#065F46';
            ctx.font = '9px sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            const obs = step.observation.length > 30 ? step.observation.substring(0, 30) + '…' : step.observation;
            ctx.fillText('Obs: ' + obs, x + 24, brainY);
        }

        // Phase indicator
        const phases = ['Thought 思考', 'Action 行动', 'Observation 观察'];
        const phaseColors = ['#D97706', '#3B82F6', '#10B981'];
        const py = y + h - 22;
        for (let i = 0; i < 3; i++) {
            const active = i === phase;
            ctx.fillStyle = active ? phaseColors[i] : (this.isDarkTheme() ? '#334155' : '#E2E8F0');
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

    _drawPlanSolveViz(ctx, x, y, w, h, textColor, subColor, panelBg, border) {
        const phase = this.subStep % 3; // 0 plan, 1 execute, 2 done

        // Plan node (top) with 4 sub-tasks listed
        const planX = x + 16;
        const planY = y + 40;
        const planW = w - 32;
        const planH = 56;

        ctx.fillStyle = this.isDarkTheme() ? '#0C4A6E' : '#E0F2FE';
        this.roundRect(ctx, planX, planY, planW, planH, 8);
        ctx.fill();
        ctx.strokeStyle = phase === 0 ? '#0EA5E9' : '#7DD3FC';
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
            ctx.fillStyle = this.isDarkTheme() ? '#7DD3FC' : '#0369A1';
            ctx.fillText(lines[0] || completedSteps, planX + 10, planY + 26);
            if (lines[1]) {
                ctx.fillStyle = subColor;
                ctx.fillText(lines[1], planX + 10, planY + 40);
            }
        } else {
            ctx.fillStyle = this.isDarkTheme() ? '#7DD3FC' : '#0369A1';
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
            const stageColor = isActive ? '#0EA5E9' : (isDone ? '#10B981' : (this.isDarkTheme() ? '#334155' : '#CBD5E1'));

            ctx.fillStyle = isActive
                ? (this.isDarkTheme() ? '#0C4A6E' : '#E0F2FE')
                : (isDone
                    ? (this.isDarkTheme() ? '#064E3B' : '#D1FAE5')
                    : (this.isDarkTheme() ? '#1E293B' : '#F1F5F9'));
            this.roundRect(ctx, sx, stageY, stageW, stageH, 6);
            ctx.fill();
            ctx.strokeStyle = stageColor;
            ctx.lineWidth = isActive ? 2 : 1;
            ctx.stroke();

            // step number
            ctx.fillStyle = isActive ? '#0EA5E9' : (isDone ? '#10B981' : subColor);
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText('步骤 ' + (i + 1), sx + stageW / 2, stageY + 8);

            // check mark / active pulse
            if (isDone) {
                ctx.fillStyle = '#10B981';
                ctx.beginPath();
                ctx.arc(sx + stageW / 2, stageY + 28, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(sx + stageW / 2 - 4, stageY + 28);
                ctx.lineTo(sx + stageW / 2 - 1, stageY + 31);
                ctx.lineTo(sx + stageW / 2 + 4, stageY + 25);
                ctx.stroke();
            } else if (isActive) {
                ctx.fillStyle = '#0EA5E9';
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
            ctx.strokeStyle = isDone ? '#10B981' : subColor;
            ctx.lineWidth = isDone ? 2 : 1;
            ctx.stroke();
        }
    }

    _inlineList(maxWidth, done, rest) {
        // Helper: not strictly needed; returns the strings as a list for two-line layout
        return [done, rest].filter(Boolean);
    }

    _drawReflectionViz(ctx, x, y, w, h, textColor, subColor, panelBg, border) {
        const phase = this.subStep % 3;
        const step = this.reflectionSteps[Math.min(phase, this.reflectionSteps.length - 1)];

        // Producer box (top-left), Critic box (top-right)
        const boxH = 50;
        const topY = y + 40;
        const leftX = x + 16;
        const rightX = x + w / 2 + 6;
        const boxW = w / 2 - 22;

        // Producer
        const prodColor = phase === 0 ? '#8B5CF6' : (phase === 2 ? '#10B981' : '#6366F1');
        ctx.fillStyle = phase === 0
            ? (this.isDarkTheme() ? '#3B0764' : '#F3E8FF')
            : (this.isDarkTheme() ? '#1E1B4B' : '#EEF2FF');
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
        const critColor = critActive ? '#F59E0B' : (phase === 2 && step.verdict === '通过' ? '#10B981' : '#A16207');
        ctx.fillStyle = critActive
            ? (this.isDarkTheme() ? '#451A03' : '#FEF3C7')
            : (this.isDarkTheme() ? '#1E293B' : '#F1F5F9');
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
        ctx.moveTo(leftX + boxW, topY + boxH / 2);
        ctx.lineTo(rightX, topY + boxH / 2);
        ctx.strokeStyle = phase >= 1 ? '#6366F1' : (this.isDarkTheme() ? '#475569' : '#CBD5E1');
        ctx.lineWidth = phase >= 1 ? 2 : 1;
        ctx.stroke();
        if (phase >= 1) this._arrowHead(ctx, rightX, topY + boxH / 2, rightX - 6, topY + boxH / 2, '#6366F1');

        // Loop arrow Critic -> Producer (curved)
        const loopY = topY + boxH + 16;
        const loopActive = step.verdict === '需改进' || step.verdict === '可优化' || critActive;
        ctx.beginPath();
        ctx.moveTo(rightX + boxW / 2, topY + boxH);
        ctx.quadraticCurveTo(rightX + boxW / 2, loopY + 30, rightX - 20, loopY + 30);
        ctx.quadraticCurveTo(leftX + boxW / 2 - 20, loopY + 30, leftX + boxW / 2, topY + boxH);
        ctx.strokeStyle = loopActive ? '#F59E0B' : (this.isDarkTheme() ? '#475569' : '#CBD5E1');
        ctx.lineWidth = loopActive ? 2 : 1;
        ctx.setLineDash(loopActive ? [5, 4] : []);
        ctx.stroke();
        ctx.setLineDash([]);
        if (loopActive) this._arrowHead(ctx, leftX + boxW / 2, topY + boxH, leftX + boxW / 2, topY + boxH + 6, '#F59E0B');

        // Loop label
        if (loopActive) {
            ctx.fillStyle = '#F59E0B';
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('回环重做 (不满意)', (leftX + rightX + boxW) / 2, loopY + 30);
        } else {
            ctx.fillStyle = '#10B981';
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('满意，停止迭代', (leftX + rightX + boxW) / 2, loopY + 30);
        }

        // Artifact + feedback panel (bottom)
        const codeY = loopY + 46;
        const codeH = (y + h - 24) - codeY;

        // code panel
        ctx.fillStyle = this.isDarkTheme() ? '#0F172A' : '#F8FAFC';
        this.roundRect(ctx, leftX, codeY, w - 32, codeH, 8);
        ctx.fill();
        ctx.strokeStyle = this.isDarkTheme() ? '#334155' : '#CBD5E1';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = this.isDarkTheme() ? '#94A3B8' : '#475569';
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
            ctx.fillStyle = critActive ? '#F59E0B' : (this.isDarkTheme() ? '#FBBF24' : '#92400E');
            ctx.font = '9px sans-serif';
            ctx.fillText('反馈: ' + step.feedback, leftX + 10, codeY + codeH - 16);
        }
    }

    _drawComparison(ctx, w, h, textColor, subColor, panelBg, border) {
        const rx = w * 0.6 + 12;
        const ry = 52;
        const rw = w * 0.4 - 28;
        const rh = h - ry - 38;

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
                    ctx.fillStyle = this.isDarkTheme() ? 'rgba(99,102,241,0.18)' : 'rgba(99,102,241,0.10)';
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

    _drawStatusBar(ctx, w, h, subColor) {
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
        for (let i = 0; i < tabs.length; i++) {
            ctx.fillStyle = i === this.paradigm ? '#6366F1' : (this.isDarkTheme() ? '#475569' : '#CBD5E1');
            ctx.beginPath();
            ctx.arc(w - 80 + i * 14, dotY, 3.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    _drawCircle(ctx, x, y, r, label, color, active, textColor) {
        if (active) {
            ctx.beginPath();
            ctx.arc(x, y, r + 8, 0, Math.PI * 2);
            ctx.fillStyle = `${color}30`;
            ctx.fill();
        }
        const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.2, x, y, r);
        grad.addColorStop(0, '#E0E7FF');
        grad.addColorStop(1, color);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = active ? 2.5 : 1.5;
        ctx.stroke();
        ctx.fillStyle = textColor || '#FFFFFF';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x, y);
    }

    _arrowHead(ctx, x, y, fromX, fromY, color) {
        const angle = Math.atan2(y - fromY, x - fromX);
        const headLen = 8;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - headLen * Math.cos(angle - Math.PI / 6), y - headLen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(x - headLen * Math.cos(angle + Math.PI / 6), y - headLen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    }
}

registerAnimation('ch4-react-loop', () => new Ch4Paradigms());

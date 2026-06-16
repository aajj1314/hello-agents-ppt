/**
 * CH4: ReAct Loop Animation
 * Visualizes Thought → Action → Observation cycle with step-by-step demo
 */
import { CanvasAnimation } from './canvas-animation.js';
import { registerAnimation } from './animation-registry.js';

class Ch4ReActLoop extends CanvasAnimation {
    constructor() {
        super();
        this.step = 0;
        this.isPlaying = false;
        this.speed = 1;
        this.animationId = null;
        this.lastStepTime = 0;

        this.demoSteps = [
            {
                thought: '用户问：华为最新手机是什么？',
                action: 'Search["华为最新手机型号"]',
                observation: '华为 Mate 系列、Pura 系列是最新旗舰手机。'
            },
            {
                thought: '需要了解具体型号和卖点，才能给出更完整回答。',
                action: 'Search["华为 Pura 70 卖点与参数"]',
                observation: 'Pura 70：麒麟9010芯片 · 超聚光影像 · 100W 快充。'
            },
            {
                thought: '已收集足够信息，汇总后回答用户。',
                action: 'Finish["综合回答"]',
                observation: ''
            }
        ];
    }

    init(canvas) {
        super.init(canvas);
        this._setupControls();
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

    togglePlay() {
        this.isPlaying = !this.isPlaying;
        const btn = document.getElementById('btn-play-ch4-react-loop');
        if (btn) btn.textContent = this.isPlaying ? '⏸ 暂停' : '▶ 播放';
        if (this.isPlaying) this._loop();
        else cancelAnimationFrame(this.animationId);
    }

    _loop() {
        if (!this.isPlaying) return;
        const now = performance.now();
        if (!this.lastStepTime) this.lastStepTime = now;
        const stepDur = 1800 / this.speed;
        if (now - this.lastStepTime >= stepDur) {
            if (this.step < this.demoSteps.length * 3 - 1) {
                this.step++;
                this.draw();
            } else {
                this.isPlaying = false;
                const btn = document.getElementById('btn-play-ch4-react-loop');
                if (btn) btn.textContent = '▶ 播放';
            }
            this.lastStepTime = now;
        }
        this.animationId = requestAnimationFrame(() => this._loop());
    }

    stepForward() {
        if (this.step < this.demoSteps.length * 3 - 1) this.step++;
        this.draw();
    }

    reset() {
        this.step = 0;
        this.isPlaying = false;
        this.lastStepTime = 0;
        cancelAnimationFrame(this.animationId);
        const btn = document.getElementById('btn-play-ch4-react-loop');
        if (btn) btn.textContent = '▶ 播放';
        this.draw();
    }

    play() {
        this.togglePlay();
    }

    setSpeed(v) {
        this.speed = v;
    }

    draw() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        const isDark = this.isDarkTheme();
        const bg = isDark ? '#1E293B' : '#F8FAFC';
        const textColor = isDark ? '#F8FAFC' : '#0F172A';
        const subTextColor = isDark ? '#CBD5E1' : '#475569';
        const cardBg = isDark ? '#334155' : '#FFFFFF';

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        const cx = w / 2;
        const brainY = h * 0.28;
        const toolY = h * 0.55;
        const memX = w - 120;
        const memY = h * 0.55;

        const demoIdx = Math.floor(this.step / 3);
        const phase = this.step % 3;
        const step = this.demoSteps[demoIdx] || this.demoSteps[0];

        // User question (top)
        this._drawBox(ctx, cx - 160, 10, 320, 36, '用户问题：' + step.thought.substring(0, 22) + (step.thought.length > 22 ? '...' : ''),
            '#E0E7FF', '#4F46E5', textColor);

        // Brain (LLM)
        const brainColor = '#6366F1';
        this._drawCircle(ctx, cx, brainY, 46, 'LLM', brainColor,
            phase === 0, isDark, textColor);

        // Thought bubble above-right of brain
        if (phase === 0 || this.step > 0) {
            const tbx = cx + 70;
            const tby = brainY - 40;
            this._drawCallout(ctx, tbx, tby, 200, 40, step.thought, '#FEF3C7', '#D97706', '#78350F');
        }

        // Action arrow: brain -> tool
        const activeArrowColor = '#3B82F6';
        if (phase >= 1 || this.step > 0) {
            this._drawArrow(ctx, cx, brainY + 46, cx, toolY - 40,
                activeArrowColor, (phase === 1 && this.step === demoIdx * 3 + 1) ? 1 : (phase >= 1 ? 1 : 0.3));
        }

        // Tool box
        this._drawBox(ctx, cx - 90, toolY - 30, 180, 60, 'Tool: ' + step.action,
            '#DBEAFE', '#2563EB', textColor, (phase === 1 && this.step === demoIdx * 3 + 1));

        // Observation arrow: tool -> brain (back)
        const obsColor = '#10B981';
        if (phase >= 2 || this.step > 0) {
            this._drawArrow(ctx, cx + 30, toolY - 30, cx + 30, brainY + 46, obsColor,
                (phase === 2 && this.step === demoIdx * 3 + 2) ? 1 : 0.4, true);
        }

        // Memory column (right side), show history
        const memW = 180;
        const memH = 260;
        this._drawBox(ctx, memX - memW / 2, memY - memH / 2, memW, memH,
            '短期记忆', '#ECFDF5', '#059669', textColor);

        // History entries
        const entryH = 48;
        const entryTop = memY - memH / 2 + 40;
        for (let i = 0; i <= demoIdx; i++) {
            const s = this.demoSteps[i];
            const ey = entryTop + i * entryH;
            const isCurrent = i === demoIdx && phase >= 2;
            ctx.fillStyle = isDark ? '#475569' : '#D1FAE5';
            this.roundRect(ctx, memX - memW / 2 + 12, ey, memW - 24, entryH - 8, 8);
            ctx.fill();
            ctx.fillStyle = textColor;
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText('Step ' + (i + 1), memX - memW / 2 + 20, ey + 14);
            ctx.fillStyle = subTextColor;
            ctx.font = '10px sans-serif';
            const actionText = s.action.length > 26 ? s.action.substring(0, 26) + '...' : s.action;
            ctx.fillText(actionText, memX - memW / 2 + 20, ey + 30);
        }

        // Step indicator (bottom-left)
        ctx.fillStyle = subTextColor;
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('当前步骤：' + (phase === 0 ? 'Thought 思考' : phase === 1 ? 'Action 行动' : 'Observation 观察') +
            '   ·   Cycle ' + (demoIdx + 1) + ' / ' + this.demoSteps.length, 16, h - 18);

        // Legend
        const legendY = h - 40;
        this._drawLegend(ctx, 16, legendY, brainColor, 'Thought');
        this._drawLegend(ctx, 120, legendY, '#3B82F6', 'Action');
        this._drawLegend(ctx, 220, legendY, '#10B981', 'Observation');
    }

    _drawBox(ctx, x, y, w, h, label, bg, border, textColor, highlight) {
        ctx.fillStyle = bg;
        this.roundRect(ctx, x, y, w, h, 8);
        ctx.fill();
        ctx.strokeStyle = highlight ? border : (this.isDarkTheme() ? '#475569' : '#CBD5E1');
        ctx.lineWidth = highlight ? 3 : 1.5;
        ctx.stroke();

        ctx.fillStyle = textColor;
        ctx.font = '13px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        this._wrapText(ctx, label, x + w / 2, y + h / 2, w - 20, 16);
    }

    _drawCircle(ctx, x, y, r, label, color, active, isDark, textColor) {
        if (active) {
            ctx.beginPath();
            ctx.arc(x, y, r + 12, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(79,70,229,0.18)';
            ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.2, x, y, r);
        grad.addColorStop(0, '#E0E7FF');
        grad.addColorStop(1, color);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = active ? 3 : 2;
        ctx.stroke();

        ctx.fillStyle = textColor || '#1F2937';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x, y);
    }

    _drawArrow(ctx, x1, y1, x2, y2, color, progress, dashed) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        const ex = x1 + (x2 - x1) * progress;
        const ey = y1 + (y2 - y1) * progress;
        ctx.lineTo(ex, ey);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        if (dashed) ctx.setLineDash([6, 6]); else ctx.setLineDash([]);
        ctx.stroke();
        ctx.setLineDash([]);

        if (progress >= 0.99) {
            const angle = Math.atan2(y2 - y1, x2 - x1);
            const headLen = 10;
            ctx.beginPath();
            ctx.moveTo(ex, ey);
            ctx.lineTo(ex - headLen * Math.cos(angle - Math.PI / 6),
                ey - headLen * Math.sin(angle - Math.PI / 6));
            ctx.lineTo(ex - headLen * Math.cos(angle + Math.PI / 6),
                ey - headLen * Math.sin(angle + Math.PI / 6));
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
        }
    }

    _drawCallout(ctx, x, y, w, h, text, bg, border, textColor) {
        ctx.fillStyle = bg;
        ctx.strokeStyle = border;
        ctx.lineWidth = 1.5;
        this.roundRect(ctx, x, y, w, h, 8);
        ctx.fill();
        ctx.stroke();
        // Tail triangle pointing back to brain
        ctx.beginPath();
        ctx.moveTo(x - 8, y + h / 2 - 6);
        ctx.lineTo(x - 16, y + h / 2);
        ctx.lineTo(x - 8, y + h / 2 + 6);
        ctx.closePath();
        ctx.fillStyle = bg;
        ctx.fill();
        ctx.strokeStyle = border;
        ctx.stroke();

        ctx.fillStyle = textColor;
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        this._wrapText(ctx, text, x + 10, y + h / 2, w - 20, 16);
    }

    _drawLegend(ctx, x, y, color, label) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 12, 12);
        ctx.fillStyle = this.isDarkTheme() ? '#CBD5E1' : '#475569';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(label, x + 18, y - 1);
    }

    _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split('');
        let line = '';
        const lines = [];
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n];
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
                lines.push(line);
                line = words[n];
            } else {
                line = testLine;
            }
        }
        lines.push(line);
        const totalH = lines.length * lineHeight;
        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], x, y - totalH / 2 + (i + 0.5) * lineHeight);
        }
    }
}

registerAnimation('ch4-react-loop', () => new Ch4ReActLoop());

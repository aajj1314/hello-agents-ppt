/**
 * CH11: Agentic RL - Reward Signal Feedback Loop
 * Animated Canvas showing SFT -> RLHF -> DPO -> GRPO training flow with reward feedback
 */
import { CanvasAnimation } from './canvas-animation.js';
import { registerAnimation } from './animation-registry.js';

class Ch11RLFeedback extends CanvasAnimation {
    constructor() {
        super();
        this.phase = 0;
        this.phases = 4;
        this.progress = 0;
        this.arrowPulse = 0;
    }

    init(canvas) {
        super.init(canvas);
        this._setupControls();
        window.addEventListener('resize', () => { this._resize(); this.draw(); });
        this.draw();
    }

    _setupControls() {
        const animId = 'ch11-rl-feedback';
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
        if (this._playing) {
            this._playing = false;
            cancelAnimationFrame(this._rafId);
            const btn = document.getElementById('btn-play-ch11-rl-feedback');
            if (btn) btn.textContent = '▶ 播放';
            return;
        }
        this._playing = true;
        const btn = document.getElementById('btn-play-ch11-rl-feedback');
        if (btn) btn.textContent = '⏸ 暂停';
        this._loop();
    }

    _loop() {
        if (!this._playing) return;
        this.progress += 0.008 * (this.speed || 1);
        if (this.progress >= 1) {
            this.progress = 0;
            this.phase = (this.phase + 1) % this.phases;
        }
        this.arrowPulse = (this.arrowPulse + 0.04 * (this.speed || 1)) % (Math.PI * 2);
        this.draw();
        this._rafId = requestAnimationFrame(() => this._loop());
    }

    stepForward() {
        this.progress = 0;
        this.phase = (this.phase + 1) % this.phases;
        this.draw();
    }

    reset() {
        this._playing = false;
        cancelAnimationFrame(this._rafId);
        this.phase = 0;
        this.progress = 0;
        this.arrowPulse = 0;
        const btn = document.getElementById('btn-play-ch11-rl-feedback');
        if (btn) btn.textContent = '▶ 播放';
        this.draw();
    }

    setSpeed(v) {
        this.speed = v;
    }

    play() {
        this._playing = true;
        this._loop();
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
        const accentColors = ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981'];

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        const cx = w / 2;
        const cy = h / 2;
        const radius = Math.min(w, h) * 0.3;

        // Draw four training method nodes in a circle
        const labels = ['SFT', 'RLHF', 'DPO', 'GRPO'];
        const descriptions = [
            '监督微调\n学习格式与基础',
            '人类反馈强化\n奖励模型训练',
            '直接偏好优化\n无需奖励模型',
            '组相对策略优化\n简化PPO流程'
        ];

        // Draw feedback loop ring
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 20, 0, Math.PI * 2);
        ctx.strokeStyle = dark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.1)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw connecting arrows between phases
        for (let i = 0; i < 4; i++) {
            const angle1 = (i / 4) * Math.PI * 2 - Math.PI / 2;
            const angle2 = ((i + 1) / 4) * Math.PI * 2 - Math.PI / 2;
            const x1 = cx + radius * Math.cos(angle1);
            const y1 = cy + radius * Math.sin(angle1);
            const x2 = cx + radius * Math.cos(angle2);
            const y2 = cy + radius * Math.sin(angle2);

            const isActive = i === this.phase;
            const alpha = isActive ? 0.9 : 0.25;
            const pulse = Math.sin(this.arrowPulse) * 0.3 + 0.7;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = isActive
                ? `rgba(239, 68, 68, ${alpha * pulse})`
                : (dark ? `rgba(148,163,184,${alpha})` : `rgba(100,116,139,${alpha})`);
            ctx.lineWidth = isActive ? 3 : 1.5;
            ctx.stroke();

            // Arrow head at midpoint
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            const dirX = x2 - x1;
            const dirY = y2 - y1;
            const len = Math.sqrt(dirX * dirX + dirY * dirY);
            const ux = dirX / len;
            const uy = dirY / len;

            ctx.beginPath();
            ctx.moveTo(midX + ux * 8, midY + uy * 8);
            ctx.lineTo(midX - ux * 4 + uy * 6, midY - uy * 4 - ux * 6);
            ctx.lineTo(midX - ux * 4 - uy * 6, midY - uy * 4 + ux * 6);
            ctx.closePath();
            ctx.fillStyle = isActive
                ? `rgba(239, 68, 68, ${alpha * pulse})`
                : (dark ? '#64748B' : '#94A3B8');
            ctx.fill();

            // Arrow label
            const labelAngle = (angle1 + angle2) / 2;
            const labelR = radius * 0.6;
            const lx = cx + labelR * Math.cos(labelAngle);
            const ly = cy + labelR * Math.sin(labelAngle);

            const arrowLabels = ['模仿学习', '奖励反馈', '偏好对齐', '组优化'];
            ctx.fillStyle = isActive ? accentColors[i] : subColor;
            ctx.font = isActive ? 'bold 11px sans-serif' : '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(arrowLabels[i], lx, ly);
        }

        // Draw phase nodes
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2 - Math.PI / 2;
            const x = cx + radius * Math.cos(angle);
            const y = cy + radius * Math.sin(angle);
            const isActive = i === this.phase;

            const nodeR = isActive ? 42 : 36;

            // Glow for active node
            if (isActive) {
                ctx.beginPath();
                ctx.arc(x, y, nodeR + 6, 0, Math.PI * 2);
                ctx.fillStyle = accentColors[i] + '30';
                ctx.fill();
            }

            // Node circle
            ctx.beginPath();
            ctx.arc(x, y, nodeR, 0, Math.PI * 2);
            const grad = ctx.createRadialGradient(x - 8, y - 8, 2, x, y, nodeR);
            grad.addColorStop(0, isActive ? accentColors[i] : (dark ? '#334155' : '#E2E8F0'));
            grad.addColorStop(1, isActive ? accentColors[i] + 'CC' : (dark ? '#1E293B' : '#CBD5E1'));
            ctx.fillStyle = grad;
            ctx.fill();

            if (isActive) {
                ctx.strokeStyle = accentColors[i];
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            // Label
            ctx.fillStyle = isActive ? '#FFFFFF' : textColor;
            ctx.font = isActive ? 'bold 14px sans-serif' : '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(labels[i], x, y - 4);

            // Description (smaller text below)
            ctx.fillStyle = isActive ? '#E0E7FF' : subColor;
            ctx.font = '8px sans-serif';
            const descLines = descriptions[i].split('\n');
            descLines.forEach((line, li) => {
                ctx.fillText(line, x, y + 12 + li * 10);
            });
        }

        // Central reward signal
        ctx.beginPath();
        ctx.arc(cx, cy, 28, 0, Math.PI * 2);
        const centerGrad = ctx.createRadialGradient(cx - 5, cy - 5, 2, cx, cy, 28);
        centerGrad.addColorStop(0, '#F59E0B');
        centerGrad.addColorStop(1, '#D97706');
        ctx.fillStyle = centerGrad;
        ctx.fill();

        // Reward pulse ring
        const pulseR = 28 + Math.sin(this.arrowPulse) * 8;
        ctx.beginPath();
        ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('奖励', cx, cy - 5);
        ctx.fillText('信号', cx, cy + 7);

        // Phase title at bottom
        const phaseTitles = [
            'Phase 1: SFT - 监督微调，学习基础格式',
            'Phase 2: RLHF - 人类反馈，训练奖励模型',
            'Phase 3: DPO - 直接偏好优化，简化流程',
            'Phase 4: GRPO - 组相对优化，高效训练'
        ];
        ctx.fillStyle = accentColors[this.phase];
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(phaseTitles[this.phase], cx, h - 14);

        // Footer
        ctx.fillStyle = subColor;
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('阶段: ' + (this.phase + 1) + ' / ' + this.phases, 12, h - 10);
    }
}

registerAnimation('ch11-rl-feedback', () => new Ch11RLFeedback());

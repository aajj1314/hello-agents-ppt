/**
 * CH12: Agent Performance Evaluation - 6-Dimension Radar Chart
 * Animated Canvas showing six evaluation dimensions with animated scoring
 */
import { CanvasAnimation } from './canvas-animation.js';
import { registerAnimation } from './animation-registry.js';

class Ch12Radar extends CanvasAnimation {
    constructor() {
        super();
        this.score = 0;
        this.targetScores = [85, 70, 60, 75, 80, 65];
        this.currentScores = [0, 0, 0, 0, 0, 0];
        this.dimensions = [
            '准确率', '鲁棒性', '工具调用', '任务完成', '推理能力', '效率'
        ];
        this._playing = false;
        this._rafId = null;
        this.speed = 1;
    }

    init(canvas) {
        super.init(canvas);
        this._setupControls();
        window.addEventListener('resize', () => { this._resize(); this.draw(); });
        this.draw();
    }

    _setupControls() {
        const animId = 'ch12-radar';
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
            const btn = document.getElementById('btn-play-ch12-radar');
            if (btn) btn.textContent = '▶ 播放';
            return;
        }
        this._playing = true;
        const btn = document.getElementById('btn-play-ch12-radar');
        if (btn) btn.textContent = '⏸ 暂停';
        this._loop();
    }

    _loop() {
        if (!this._playing) return;
        let allDone = true;
        for (let i = 0; i < 6; i++) {
            if (this.currentScores[i] < this.targetScores[i]) {
                this.currentScores[i] = Math.min(
                    this.currentScores[i] + 0.6 * (this.speed || 1),
                    this.targetScores[i]
                );
                allDone = false;
            }
        }
        this.draw();

        if (allDone) {
            this._playing = false;
            cancelAnimationFrame(this._rafId);
            const btn = document.getElementById('btn-play-ch12-radar');
            if (btn) btn.textContent = '▶ 播放';
        } else {
            this._rafId = requestAnimationFrame(() => this._loop());
        }
    }

    stepForward() {
        for (let i = 0; i < 6; i++) {
            this.currentScores[i] = Math.min(
                this.currentScores[i] + 15,
                this.targetScores[i]
            );
        }
        this.draw();
    }

    reset() {
        this._playing = false;
        cancelAnimationFrame(this._rafId);
        this.currentScores = [0, 0, 0, 0, 0, 0];
        const btn = document.getElementById('btn-play-ch12-radar');
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
        const gridColor = dark ? 'rgba(148,163,184,0.15)' : 'rgba(100,116,139,0.15)';
        const dataColor = '#6366F1';
        const fillColor = dark ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.15)';

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        const cx = w / 2;
        const cy = h / 2 + 10;
        const maxR = Math.min(w, h) * 0.36;

        // Draw grid circles
        for (let ring = 1; ring <= 5; ring++) {
            const r = (maxR / 5) * ring;
            ctx.beginPath();
            for (let i = 0; i <= 6; i++) {
                const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
                const x = cx + r * Math.cos(angle);
                const y = cy + r * Math.sin(angle);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.strokeStyle = gridColor;
            ctx.lineWidth = 1;
            ctx.stroke();

            // Percentage labels on first axis
            if (ring < 5) {
                ctx.fillStyle = subColor;
                ctx.font = '9px sans-serif';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                const labelX = cx + r * Math.cos(-Math.PI / 2);
                const labelY = cy + r * Math.sin(-Math.PI / 2);
                ctx.fillText((ring * 20) + '%', labelX + 6, labelY);
            }
        }

        // Draw dimension axes
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
            const x = cx + maxR * Math.cos(angle);
            const y = cy + maxR * Math.sin(angle);

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(x, y);
            ctx.strokeStyle = gridColor;
            ctx.lineWidth = 1;
            ctx.stroke();

            // Dimension label
            const labelR = maxR + 28;
            const lx = cx + labelR * Math.cos(angle);
            const ly = cy + labelR * Math.sin(angle);
            ctx.fillStyle = textColor;
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.dimensions[i], lx, ly);
        }

        // Draw data polygon
        ctx.beginPath();
        for (let i = 0; i <= 6; i++) {
            const idx = i % 6;
            const angle = (idx / 6) * Math.PI * 2 - Math.PI / 2;
            const val = this.currentScores[idx] / 100;
            const r = maxR * val;
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.strokeStyle = dataColor;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Draw data points
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
            const val = this.currentScores[i] / 100;
            const r = maxR * val;
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);

            if (r > 2) {
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fillStyle = '#FFFFFF';
                ctx.fill();
                ctx.strokeStyle = dataColor;
                ctx.lineWidth = 2;
                ctx.stroke();

                // Score label
                const labelR2 = r + 16;
                const lx2 = cx + labelR2 * Math.cos(angle);
                const ly2 = cy + labelR2 * Math.sin(angle);
                ctx.fillStyle = dataColor;
                ctx.font = 'bold 10px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(Math.round(this.currentScores[i]) + '%', lx2, ly2);
            }
        }

        // Title
        ctx.fillStyle = textColor;
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('智能体六维评估雷达图', cx, 12);

        // Legend
        const legendY = h - 18;
        ctx.fillStyle = dataColor;
        ctx.fillRect(cx - 120, legendY - 4, 14, 8);
        ctx.fillStyle = subColor;
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('当前评估得分 (动画填充中...)', cx - 100, legendY + 2);
    }
}

registerAnimation('ch12-radar', () => new Ch12Radar());

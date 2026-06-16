/**
 * CH7: Agent Framework Architecture Animation
 * Shows data flow between LLM / Memory / Planner / ToolManager / Executor
 */
import { CanvasAnimation } from './canvas-animation.js';
import { registerAnimation } from './animation-registry.js';

class Ch7Framework extends CanvasAnimation {
    constructor() {
        super();
        this.step = 0;
        this.isPlaying = false;
        this.speed = 1;
        this.animationId = null;
        this.lastStepTime = 0;
        this.particles = [];

        this.components = [
            { key: 'llm',   name: 'LLM',        color: '#6366F1', rel: { x: 0.5, y: 0.18 } },
            { key: 'planner', name: 'Planner',   color: '#F59E0B', rel: { x: 0.25, y: 0.46 } },
            { key: 'memory',  name: 'Memory',    color: '#10B981', rel: { x: 0.5, y: 0.46 } },
            { key: 'tool',    name: 'ToolMgr',   color: '#3B82F6', rel: { x: 0.75, y: 0.46 } },
            { key: 'exec',    name: 'Executor',  color: '#EF4444', rel: { x: 0.5, y: 0.78 } }
        ];

        this.flows = [
            { from: 0, to: 1, label: '目标' },
            { from: 1, to: 2, label: '检索' },
            { from: 2, to: 1, label: '上下文' },
            { from: 1, to: 3, label: '工具' },
            { from: 3, to: 4, label: '执行' },
            { from: 4, to: 2, label: '结果' },
            { from: 4, to: 0, label: '反馈' }
        ];
    }

    init(canvas) {
        super.init(canvas);
        this._setupControls();
        window.addEventListener('resize', () => { this._resize(); this.draw(); });
        this.draw();
    }

    _setupControls() {
        const animId = 'ch7-framework';
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
        const btn = document.getElementById('btn-play-ch7-framework');
        if (btn) btn.textContent = this.isPlaying ? '⏸ 暂停' : '▶ 播放';
        if (this.isPlaying) this._loop();
        else cancelAnimationFrame(this.animationId);
    }

    _loop() {
        if (!this.isPlaying) return;
        const now = performance.now();
        if (!this.lastStepTime) this.lastStepTime = now;
        const dur = 1400 / this.speed;
        if (now - this.lastStepTime >= dur) {
            this.step = (this.step + 1) % (this.flows.length + 2);
            this.lastStepTime = now;
            // spawn particle
            const flow = this.flows[this.step % this.flows.length];
            if (flow) {
                const from = this._compPos(flow.from);
                const to = this._compPos(flow.to);
                this.particles.push({
                    from, to, t: 0, color: this.components[flow.to].color, label: flow.label
                });
            }
        }
        // particle animation tick
        this.particles.forEach(p => p.t += 0.008 * this.speed);
        this.particles = this.particles.filter(p => p.t < 1);
        this.draw();
        this.animationId = requestAnimationFrame(() => this._loop());
    }

    stepForward() {
        this.step = (this.step + 1) % (this.flows.length + 2);
        const flow = this.flows[this.step % this.flows.length];
        if (flow) {
            const from = this._compPos(flow.from);
            const to = this._compPos(flow.to);
            this.particles.push({
                from, to, t: 0, color: this.components[flow.to].color, label: flow.label
            });
        }
        this.draw();
    }

    reset() {
        this.step = 0;
        this.isPlaying = false;
        this.lastStepTime = 0;
        this.particles = [];
        cancelAnimationFrame(this.animationId);
        const btn = document.getElementById('btn-play-ch7-framework');
        if (btn) btn.textContent = '▶ 播放';
        this.draw();
    }

    play() {
        this.togglePlay();
    }

    setSpeed(v) {
        this.speed = v;
    }

    _compPos(i) {
        const c = this.components[i];
        return { x: this.width * c.rel.x, y: this.height * c.rel.y };
    }

    draw() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        const isDark = this.isDarkTheme();
        const bg = isDark ? '#1E293B' : '#F8FAFC';
        const textColor = isDark ? '#F8FAFC' : '#0F172A';
        const subTextColor = isDark ? '#CBD5E1' : '#475569';

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        const activeFlow = this.flows[this.step % this.flows.length];
        // Draw connections
        this.flows.forEach((f, idx) => {
            const a = this._compPos(f.from);
            const b = this._compPos(f.to);
            const isActive = activeFlow && f === activeFlow;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = isActive ? this.components[f.to].color : (isDark ? 'rgba(148,163,184,0.35)' : 'rgba(100,116,139,0.35)');
            ctx.lineWidth = isActive ? 3 : 1.5;
            ctx.setLineDash(isActive ? [] : [6, 6]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Arrow head
            const angle = Math.atan2(b.y - a.y, b.x - a.x);
            const headLen = 10;
            const hx = b.x - 55 * Math.cos(angle);
            const hy = b.y - 55 * Math.sin(angle);
            ctx.beginPath();
            ctx.moveTo(hx, hy);
            ctx.lineTo(hx - headLen * Math.cos(angle - Math.PI / 7),
                hy - headLen * Math.sin(angle - Math.PI / 7));
            ctx.lineTo(hx - headLen * Math.cos(angle + Math.PI / 7),
                hy - headLen * Math.sin(angle + Math.PI / 7));
            ctx.closePath();
            ctx.fillStyle = isActive ? this.components[f.to].color : (isDark ? '#64748B' : '#94A3B8');
            ctx.fill();
        });

        // Draw components as rounded cards
        const boxW = 130;
        const boxH = 44;
        this.components.forEach((c, i) => {
            const p = this._compPos(i);
            const isActive = activeFlow && (activeFlow.from === i || activeFlow.to === i);
            // glow
            if (isActive) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, 60, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(79,70,229,0.12)';
                ctx.fill();
            }
            // card
            ctx.fillStyle = c.color;
            this.roundRect(ctx, p.x - boxW / 2, p.y - boxH / 2, boxW, boxH, 10);
            ctx.fill();
            ctx.strokeStyle = isActive ? '#1E293B' : (isDark ? '#1E293B' : '#1E293B');
            ctx.lineWidth = isActive ? 3 : 1.5;
            ctx.stroke();

            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 15px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(c.name, p.x, p.y);
        });

        // Particles
        this.particles.forEach(p => {
            const x = p.from.x + (p.to.x - p.from.x) * p.t;
            const y = p.from.y + (p.to.y - p.from.y) * p.t;
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        // Step indicator & title
        ctx.fillStyle = subTextColor;
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('架构数据流（当前：' + (activeFlow ? activeFlow.label : '—') + '），共 ' + this.flows.length + ' 条通道', 16, h - 18);
    }
}

registerAnimation('ch7-framework', () => new Ch7Framework());

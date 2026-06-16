/**
 * CH10: Agent Communication Protocol Animation
 * Sequential message exchange between Host <-> Client <-> Server
 */
import { CanvasAnimation } from './canvas-animation.js';
import { registerAnimation } from './animation-registry.js';

class Ch10Protocol extends CanvasAnimation {
    constructor() {
        super();
        this.step = 0;
        this.isPlaying = false;
        this.speed = 1;
        this.animationId = null;
        this.lastStepTime = 0;

        this.actors = [
            { key: 'host',   name: 'Host',   color: '#6366F1' },
            { key: 'client', name: 'Client', color: '#3B82F6' },
            { key: 'server', name: 'Server', color: '#10B981' }
        ];

        this.messages = [
            { from: 0, to: 1, text: 'Initialize()' },
            { from: 1, to: 2, text: 'Connect()' },
            { from: 2, to: 1, text: 'ACK()' },
            { from: 1, to: 0, text: 'Ready()' },
            { from: 0, to: 1, text: 'ToolCall()' },
            { from: 1, to: 2, text: 'Invoke()' },
            { from: 2, to: 1, text: 'Result()' },
            { from: 1, to: 0, text: 'Return()' }
        ];
    }

    init(canvas) {
        super.init(canvas);
        this._setupControls();
        window.addEventListener('resize', () => { this._resize(); this.draw(); });
        this.draw();
    }

    _setupControls() {
        const animId = 'ch10-protocol';
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
        const btn = document.getElementById('btn-play-ch10-protocol');
        if (btn) btn.textContent = this.isPlaying ? '⏸ 暂停' : '▶ 播放';
        if (this.isPlaying) this._loop();
        else cancelAnimationFrame(this.animationId);
    }

    _loop() {
        if (!this.isPlaying) return;
        const now = performance.now();
        if (!this.lastStepTime) this.lastStepTime = now;
        const dur = 1300 / this.speed;
        if (now - this.lastStepTime >= dur) {
            this.step = (this.step + 1) % this.messages.length;
            this.lastStepTime = now;
        }
        this.draw();
        this.animationId = requestAnimationFrame(() => this._loop());
    }

    stepForward() {
        this.step = (this.step + 1) % this.messages.length;
        this.draw();
    }

    reset() {
        this.step = 0;
        this.isPlaying = false;
        this.lastStepTime = 0;
        cancelAnimationFrame(this.animationId);
        const btn = document.getElementById('btn-play-ch10-protocol');
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

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        const colXs = [w * 0.18, w * 0.5, w * 0.82];
        const headerH = 40;

        // Actor boxes
        this.actors.forEach((a, i) => {
            const x = colXs[i];
            ctx.fillStyle = a.color;
            this.roundRect(ctx, x - 55, 8, 110, 32, 8);
            ctx.fill();
            ctx.strokeStyle = '#1E293B';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(a.name, x, 24);
        });

        // Lifelines
        colXs.forEach((x) => {
            ctx.beginPath();
            ctx.moveTo(x, headerH + 10);
            ctx.lineTo(x, h - 30);
            ctx.strokeStyle = isDark ? 'rgba(148,163,184,0.5)' : 'rgba(100,116,139,0.5)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 6]);
            ctx.stroke();
            ctx.setLineDash([]);
        });

        // Messages (already delivered = dim; current = bold & animated)
        const rowH = (h - headerH - 50) / this.messages.length;
        const current = this.messages[this.step];
        this.messages.forEach((m, i) => {
            const y = headerH + 20 + i * rowH;
            const ax = colXs[m.from];
            const bx = colXs[m.to];
            const isActive = m === current;
            const isDone = i < this.step || (this.step >= this.messages.length);

            ctx.beginPath();
            ctx.moveTo(ax, y);
            ctx.lineTo(bx, y);
            ctx.strokeStyle = isActive ? '#EF4444' : (isDark ? 'rgba(148,163,184,0.55)' : 'rgba(100,116,139,0.55)');
            ctx.lineWidth = isActive ? 3 : 1.5;
            ctx.stroke();

            // Arrow head
            const dir = bx > ax ? 1 : -1;
            ctx.beginPath();
            ctx.moveTo(bx - dir * 8, y - 5);
            ctx.lineTo(bx, y);
            ctx.lineTo(bx - dir * 8, y + 5);
            ctx.closePath();
            ctx.fillStyle = isActive ? '#EF4444' : (isDark ? '#64748B' : '#94A3B8');
            ctx.fill();

            // Label
            ctx.fillStyle = isActive ? '#EF4444' : subTextColor;
            ctx.font = isActive ? 'bold 12px sans-serif' : '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText(m.text, (ax + bx) / 2, y - 6);
        });

        // Footer
        ctx.fillStyle = subTextColor;
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('消息序号: ' + (this.step + 1) + ' / ' + this.messages.length + ' 当前: ' + current.text, 16, h - 10);
    }
}

registerAnimation('ch10-protocol', () => new Ch10Protocol());

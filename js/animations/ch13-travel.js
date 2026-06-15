/**
 * CH13: Multi-Agent Travel Assistant Collaboration
 * Task allocation from Planner -> Booking / Advisor
 */
const Ch13Travel = {
    canvas: null, ctx: null, width: 0, height: 0,
    step: 0, isPlaying: false, speed: 1, animationId: null, lastStepTime: 0,
    particles: [],

    agents: [
        { key: 'planner', name: 'Planner', desc: '行程规划', color: '#6366F1', rel: { x: 0.5, y: 0.22 } },
        { key: 'booking', name: 'Booking', desc: '预订服务',   color: '#3B82F6', rel: { x: 0.22, y: 0.72 } },
        { key: 'advisor', name: 'Advisor', desc: '旅行建议',   color: '#10B981', rel: { x: 0.78, y: 0.72 } }
    ],

    tasks: [
        { from: 0, to: 1, text: 'Task: 预订机票 & 酒店' },
        { from: 0, to: 2, text: 'Task: 推荐景点 & 餐厅' },
        { from: 1, to: 0, text: 'Result: 预订完成' },
        { from: 2, to: 0, text: 'Result: 建议清单' }
    ],

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this._resize();
        this._setupControls();
        window.addEventListener('resize', () => this._resize());
        this.draw();
    },

    _resize() {
        if (!this.canvas) return;
        const container = this.canvas.parentElement;
        const dpr = window.devicePixelRatio || 1;
        const logicalW = container.clientWidth;
        const logicalH = container.clientHeight || 420;
        this.canvas.style.width = logicalW + 'px';
        this.canvas.style.height = logicalH + 'px';
        this.canvas.width = logicalW * dpr;
        this.canvas.height = logicalH * dpr;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.width = logicalW;
        this.height = logicalH;
        this.draw();
    },

    _setupControls() {
        const animId = 'ch13-travel';
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
    },

    togglePlay() {
        this.isPlaying = !this.isPlaying;
        const btn = document.getElementById('btn-play-ch13-travel');
        if (btn) btn.textContent = this.isPlaying ? '⏸ 暂停' : '▶ 播放';
        if (this.isPlaying) this._loop();
        else cancelAnimationFrame(this.animationId);
    },

    _loop() {
        if (!this.isPlaying) return;
        const now = performance.now();
        if (!this.lastStepTime) this.lastStepTime = now;
        const dur = 1500 / this.speed;
        if (now - this.lastStepTime >= dur) {
            this.step = (this.step + 1) % this.tasks.length;
            this.lastStepTime = now;
            const t = this.tasks[this.step];
            const from = { x: this.agents[t.from].rel.x * this.width, y: this.agents[t.from].rel.y * this.height };
            const to = { x: this.agents[t.to].rel.x * this.width, y: this.agents[t.to].rel.y * this.height };
            this.particles.push({ from, to, t: 0, color: this.agents[t.to].color });
        }
        // update particles
        this.particles.forEach(p => p.t += 0.012 * this.speed);
        this.particles = this.particles.filter(p => p.t < 1);
        this.draw();
        this.animationId = requestAnimationFrame(() => this._loop());
    },

    stepForward() {
        this.step = (this.step + 1) % this.tasks.length;
        const t = this.tasks[this.step];
        const from = { x: this.agents[t.from].rel.x * this.width, y: this.agents[t.from].rel.y * this.height };
        const to = { x: this.agents[t.to].rel.x * this.width, y: this.agents[t.to].rel.y * this.height };
        this.particles.push({ from, to, t: 0, color: this.agents[t.to].color });
        this.draw();
    },

    reset() {
        this.step = 0;
        this.isPlaying = false;
        this.lastStepTime = 0;
        this.particles = [];
        cancelAnimationFrame(this.animationId);
        const btn = document.getElementById('btn-play-ch13-travel');
        if (btn) btn.textContent = '▶ 播放';
        this.draw();
    },

    _isDarkTheme() {
        return document.documentElement.getAttribute('data-theme') === 'dark';
    },

    draw() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        const isDark = this._isDarkTheme();
        const bg = isDark ? '#1E293B' : '#F8FAFC';
        const textColor = isDark ? '#F8FAFC' : '#0F172A';
        const subTextColor = isDark ? '#CBD5E1' : '#475569';

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        const positions = this.agents.map(a => ({
            name: a.name, desc: a.desc, color: a.color,
            x: a.rel.x * w, y: a.rel.y * h
        }));

        // Draw connection lines
        this.tasks.forEach((t, i) => {
            const a = positions[t.from];
            const b = positions[t.to];
            const isCurrent = i === this.step;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = isCurrent ? this.agents[t.to].color : (isDark ? 'rgba(148,163,184,0.35)' : 'rgba(100,116,139,0.35)');
            ctx.lineWidth = isCurrent ? 3 : 1.5;
            ctx.setLineDash(isCurrent ? [] : [5, 7]);
            ctx.stroke();
            ctx.setLineDash([]);

            // arrow head
            const angle = Math.atan2(b.y - a.y, b.x - a.x);
            const headLen = 12;
            const hx = a.x + (b.x - a.x) * 0.9;
            const hy = a.y + (b.y - a.y) * 0.9;
            ctx.beginPath();
            ctx.moveTo(hx, hy);
            ctx.lineTo(hx - headLen * Math.cos(angle - Math.PI / 7),
                       hy - headLen * Math.sin(angle - Math.PI / 7));
            ctx.lineTo(hx - headLen * Math.cos(angle + Math.PI / 7),
                       hy - headLen * Math.sin(angle + Math.PI / 7));
            ctx.closePath();
            ctx.fillStyle = isCurrent ? this.agents[t.to].color : (isDark ? '#64748B' : '#94A3B8');
            ctx.fill();
        });

        // Agents as circles with labels
        const r = 48;
        positions.forEach((p, i) => {
            // outer glow
            ctx.beginPath();
            ctx.arc(p.x, p.y, r + 16, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(79,70,229,0.10)';
            ctx.fill();
            // circle
            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            const grad = ctx.createRadialGradient(p.x - r * 0.3, p.y - r * 0.3, r * 0.2, p.x, p.y, r);
            grad.addColorStop(0, '#FFFFFF');
            grad.addColorStop(1, p.color);
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.strokeStyle = '#1E293B';
            ctx.lineWidth = 2;
            ctx.stroke();
            // labels
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 15px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.name, p.x, p.y - 7);
            ctx.font = '12px sans-serif';
            ctx.fillText(p.desc, p.x, p.y + 10);
        });

        // Particles
        this.particles.forEach(p => {
            const x = p.from.x + (p.to.x - p.from.x) * p.t;
            const y = p.from.y + (p.to.y - p.from.y) * p.t;
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        // Footer
        ctx.fillStyle = subTextColor;
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'left';
        const cur = this.tasks[this.step];
        ctx.fillText('当前任务 (' + (this.step + 1) + '/' + this.tasks.length + '): ' + cur.text, 16, h - 14);
    }
};

window.Animations = window.Animations || {};
window.Animations['ch13-travel'] = Ch13Travel;

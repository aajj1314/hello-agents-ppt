/**
 * CH8: Memory & Retrieval Animation
 * Visualizes data flowing: Input → Short-Term Memory → Long-Term Memory → Retrieval → LLM
 */
const Ch8Memory = {
    canvas: null, ctx: null, width: 0, height: 0,
    isPlaying: false, speed: 1, animationId: null,
    particles: [],
    lastSpawnTime: 0,

    stages: [
        { key: 'input', name: '输入', color: '#6366F1', x: 0.08, y: 0.5 },
        { key: 'stm', name: 'STM', color: '#3B82F6', x: 0.32, y: 0.5 },
        { key: 'ltm', name: 'LTM', color: '#10B981', x: 0.62, y: 0.5 },
        { key: 'retrieval', name: '检索', color: '#F59E0B', x: 0.62, y: 0.2 },
        { key: 'llm', name: 'LLM', color: '#8B5CF6', x: 0.88, y: 0.5 }
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
        const animId = 'ch8-memory';
        const playBtn = document.getElementById('btn-play-' + animId);
        const resetBtn = document.getElementById('btn-reset-' + animId);
        const stepBtn = document.getElementById('btn-step-' + animId);
        const speedSlider = document.getElementById('speed-' + animId);
        if (playBtn) playBtn.addEventListener('click', () => this.togglePlay());
        if (resetBtn) resetBtn.addEventListener('click', () => this.reset());
        if (stepBtn) stepBtn.addEventListener('click', () => this._spawnFromInput());
        if (speedSlider) speedSlider.addEventListener('input', (e) => {
            this.speed = parseFloat(e.target.value) || 1;
        });
    },

    togglePlay() {
        this.isPlaying = !this.isPlaying;
        const btn = document.getElementById('btn-play-ch8-memory');
        if (btn) btn.textContent = this.isPlaying ? '⏸ 暂停' : '▶ 播放';
        if (this.isPlaying) this._loop();
        else cancelAnimationFrame(this.animationId);
    },

    reset() {
        this.isPlaying = false;
        this.particles = [];
        cancelAnimationFrame(this.animationId);
        const btn = document.getElementById('btn-play-ch8-memory');
        if (btn) btn.textContent = '▶ 播放';
        this.draw();
    },

    _loop() {
        if (!this.isPlaying) return;
        const now = performance.now();
        const spawnDur = 900 / this.speed;
        if (now - (this.lastSpawnTime || 0) >= spawnDur) {
            this._spawnFromInput();
            this.lastSpawnTime = now;
        }
        // advance particles
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            const path = p.path;
            p.seg += 0.01 * this.speed;
            if (p.seg >= 1 && p.segIdx < path.length - 2) {
                p.segIdx++;
                p.seg = 0;
            }
            const a = path[p.segIdx];
            const b = path[p.segIdx + 1];
            p.x = a.x + (b.x - a.x) * p.seg;
            p.y = a.y + (b.y - a.y) * p.seg;
        }
        this.particles = this.particles.filter(p => !(p.segIdx >= p.path.length - 2 && p.seg >= 1));
        this.draw();
        this.animationId = requestAnimationFrame(() => this._loop());
    },

    _spawnFromInput() {
        const input = { x: this.stages[0].x * this.width, y: this.stages[0].y * this.height };
        const stm = { x: this.stages[1].x * this.width, y: this.stages[1].y * this.height };
        const ltm = { x: this.stages[2].x * this.width, y: this.stages[2].y * this.height };
        const ret = { x: this.stages[3].x * this.width, y: this.stages[3].y * this.height };
        const llm = { x: this.stages[4].x * this.width, y: this.stages[4].y * this.height };

        // main path: input -> STM -> LTM -> retrieval -> LLM
        this.particles.push({
            x: input.x, y: input.y, segIdx: 0, seg: 0,
            path: [input, stm, ltm, ret, llm],
            color: '#6366F1', kind: 'main'
        });
        // a random retrieval particle (LTM -> retrieval -> LLM)
        this.particles.push({
            x: ltm.x, y: ltm.y, segIdx: 0, seg: 0,
            path: [ltm, ret, llm],
            color: '#F59E0B', kind: 'retrieve'
        });
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

        // Compute absolute positions
        const positions = this.stages.map(s => ({
            name: s.name,
            color: s.color,
            x: s.x * w,
            y: s.y * h
        }));

        // Draw flow arrows
        const flowLines = [
            { a: 0, b: 1, label: '感知输入' },
            { a: 1, b: 2, label: '存入 LTM' },
            { a: 2, b: 3, label: '检索' },
            { a: 3, b: 4, label: '注入 LLM' },
            { a: 1, b: 4, label: '短期上下文' }
        ];

        flowLines.forEach((f, i) => {
            const a = positions[f.a];
            const b = positions[f.b];
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.bezierCurveTo((a.x + b.x) / 2, a.y - (i === 4 ? 80 : 40), (a.x + b.x) / 2, b.y + 20, b.x, b.y);
            ctx.strokeStyle = isDark ? 'rgba(148,163,184,0.5)' : 'rgba(100,116,139,0.45)';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 6]);
            ctx.stroke();
            ctx.setLineDash([]);
        });

        // Draw boxes
        const boxW = 100, boxH = 52;
        positions.forEach((p) => {
            // glow
            ctx.beginPath();
            ctx.arc(p.x, p.y, 40, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(79,70,229,0.08)';
            ctx.fill();
            // card
            ctx.fillStyle = p.color;
            this._roundRect(ctx, p.x - boxW / 2, p.y - boxH / 2, boxW, boxH, 10);
            ctx.fill();
            ctx.strokeStyle = '#1E293B';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.name, p.x, p.y);
        });

        // Draw particles
        this.particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        // Footer description
        ctx.fillStyle = subTextColor;
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('数据流动：输入 → 短期记忆 → 长期记忆 → 检索增强 → 注入 LLM 上下文', 16, h - 18);
    },

    _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }
};

window.Animations = window.Animations || {};
window.Animations['ch8-memory'] = Ch8Memory;

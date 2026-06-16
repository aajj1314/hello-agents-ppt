/**
 * CH6: Framework Architecture Comparison
 * Visual comparison of four agent frameworks: AutoGen, AgentScope, CAMEL, LangGraph
 */
import { CanvasAnimation } from './canvas-animation.js';
import { registerAnimation } from './animation-registry.js';

class Ch6Frameworks extends CanvasAnimation {
    constructor() {
        super();
        this.step = 0;
        this.isPlaying = false;
        this.speed = 1;
        this.lastStepTime = 0;
        this.animId = null;
        this.highlightStep = -1;
        this.particles = [];

        this.frameworks = [
            {
                name: 'AutoGen',
                color: '#6366F1',
                bgColor: 'rgba(99,102,241,0.12)',
                desc: '对话驱动协作',
                layers: ['UserProxy', 'AssistantAgent', 'GroupChat', 'LLM Backend'],
                conns: [0, 1, 2, 3]
            },
            {
                name: 'AgentScope',
                color: '#10B981',
                bgColor: 'rgba(16,185,129,0.12)',
                desc: '消息驱动架构',
                layers: ['AgentBase', 'MsgHub', 'Pipeline', 'Distributed Runtime'],
                conns: [0, 1, 2, 3]
            },
            {
                name: 'CAMEL',
                color: '#F59E0B',
                bgColor: 'rgba(245,158,11,0.12)',
                desc: '角色扮演协作',
                layers: ['AI User', 'AI Assistant', 'Inception Prompt', 'Task Solver'],
                conns: [0, 1, 2, 3]
            },
            {
                name: 'LangGraph',
                color: '#EF4444',
                bgColor: 'rgba(239,68,68,0.12)',
                desc: '状态机图结构',
                layers: ['State', 'Nodes', 'Edges', 'Graph Executor'],
                conns: [0, 1, 2, 3]
            }
        ];

        this.tracing = [];
        this.traceProgress = 0;
    }

    init(canvas) {
        super.init(canvas);
        this._setupControls();
        window.addEventListener('resize', () => { this._resize(); this.draw(); });
        this.draw();
    }

    _setupControls() {
        const animId = 'ch6-frameworks';
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
        const btn = document.getElementById('btn-play-ch6-frameworks');
        if (btn) btn.textContent = this.isPlaying ? '⏸ 暂停' : '▶ 播放';
        if (this.isPlaying) this._loop();
        else cancelAnimationFrame(this.animId);
    }

    _loop() {
        if (!this.isPlaying) return;
        const now = performance.now();
        if (!this.lastStepTime) this.lastStepTime = now;
        const dur = 1800 / this.speed;
        if (now - this.lastStepTime >= dur) {
            this.step = (this.step + 1) % 5;
            this.highlightStep = this.step;
            this.lastStepTime = now;
            if (this.step < 4) {
                const fw = this.frameworks[this.step];
                this.tracing.push({ fw, t: 0 });
            } else {
                this.tracing = [];
            }
        }
        this.tracing.forEach(t => t.t += 0.01 * this.speed);
        this.tracing = this.tracing.filter(t => t.t < 1);
        this.draw();
        this.animId = requestAnimationFrame(() => this._loop());
    }

    stepForward() {
        this.step = (this.step + 1) % 5;
        this.highlightStep = this.step;
        if (this.step < 4) {
            this.tracing.push({ fw: this.frameworks[this.step], t: 0 });
        } else {
            this.tracing = [];
        }
        this.draw();
    }

    reset() {
        this.step = 0;
        this.highlightStep = -1;
        this.isPlaying = false;
        this.lastStepTime = 0;
        this.tracing = [];
        cancelAnimationFrame(this.animId);
        const btn = document.getElementById('btn-play-ch6-frameworks');
        if (btn) btn.textContent = '▶ 播放';
        this.draw();
    }

    setSpeed(v) {
        this.speed = v;
    }

    play() {
        this.togglePlay();
    }

    draw() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        const isDark = this.isDarkTheme();
        const bg = isDark ? '#1E293B' : '#F8FAFC';
        const textColor = isDark ? '#F8FAFC' : '#0F172A';
        const subColor = isDark ? '#CBD5E1' : '#475569';

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        // Title
        ctx.fillStyle = textColor;
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('智能体框架对比：架构与协作模式', w / 2, 12);

        const boxW = Math.min(170, (w - 80) / 4);
        const boxH = 180;
        const gap = (w - 4 * boxW - 60) / 3;
        const startX = 30;

        // Draw four framework cards
        this.frameworks.forEach((fw, idx) => {
            const x = startX + idx * (boxW + gap);
            const y = 48;
            const isHighlighted = this.highlightStep === idx;

            // Card background
            ctx.fillStyle = isDark ? '#334155' : '#FFFFFF';
            this.roundRect(ctx, x, y, boxW, boxH, 12);
            ctx.fill();
            ctx.strokeStyle = isHighlighted ? fw.color : (isDark ? '#475569' : '#E2E8F0');
            ctx.lineWidth = isHighlighted ? 3 : 1.5;
            ctx.stroke();

            // Glow effect when highlighted
            if (isHighlighted) {
                ctx.save();
                ctx.shadowColor = fw.color;
                ctx.shadowBlur = 20;
                this.roundRect(ctx, x, y, boxW, boxH, 12);
                ctx.strokeStyle = fw.color;
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.restore();
            }

            // Framework name
            ctx.fillStyle = fw.color;
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(fw.name, x + boxW / 2, y + 10);

            // Description
            ctx.fillStyle = subColor;
            ctx.font = '13px sans-serif';
            ctx.fillText(fw.desc, x + boxW / 2, y + 32);

            // Separator
            ctx.strokeStyle = isDark ? '#475569' : '#E2E8F0';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x + 10, y + 54);
            ctx.lineTo(x + boxW - 10, y + 54);
            ctx.stroke();

            // Layers
            fw.layers.forEach((layer, li) => {
                const ly = y + 62 + li * 26;
                const lh = 22;
                const lw = boxW - 20;

                ctx.fillStyle = isHighlighted
                    ? fw.bgColor
                    : (isDark ? '#1E293B' : '#F1F5F9');
                this.roundRect(ctx, x + 10, ly, lw, lh, 6);
                ctx.fill();

                ctx.fillStyle = textColor;
                ctx.font = '12px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(layer, x + boxW / 2, ly + lh / 2);

                // Connection arrows between layers
                if (li < fw.layers.length - 1) {
                    ctx.strokeStyle = isDark ? '#64748B' : '#CBD5E1';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(x + boxW / 2, ly + lh);
                    ctx.lineTo(x + boxW / 2, ly + lh + 4);
                    ctx.stroke();
                }
            });

            // Tracing particle
            const tracing = this.tracing.find(t => t.fw === fw);
            if (tracing) {
                const totalH = 62 + fw.layers.length * 26;
                const py = y + 62 + (tracing.t * (fw.layers.length * 26 - 4));
                ctx.beginPath();
                ctx.arc(x + boxW / 2, py, 5, 0, Math.PI * 2);
                ctx.fillStyle = fw.color;
                ctx.fill();
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });

        // Bottom info bar
        ctx.fillStyle = subColor;
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        const info = this.highlightStep >= 0 && this.highlightStep < 4
            ? '当前展示：' + this.frameworks[this.highlightStep].name + ' — ' + this.frameworks[this.highlightStep].desc
            : '点击“步进”或“播放”查看各框架架构层级';
        ctx.fillText(info, 16, h - 14);

        // Step indicator
        ctx.textAlign = 'right';
        ctx.fillText('步骤 ' + (this.highlightStep + 1) + ' / 5', w - 16, h - 14);
    }
}

registerAnimation('ch6-frameworks', () => new Ch6Frameworks());

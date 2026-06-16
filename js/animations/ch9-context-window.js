/**
 * CH9: Context Window Visualization
 * Visualizes the context window, token budget, and context rot phenomenon
 */
import { CanvasAnimation } from './canvas-animation.js';
import { registerAnimation } from './animation-registry.js';

class Ch9ContextWindow extends CanvasAnimation {
    constructor() {
        super();
        this.step = 0;
        this.isPlaying = false;
        this.speed = 1;
        this.lastStepTime = 0;
        this.animId = null;
        this.fillLevel = 0.3;
        this.targetFill = 0.3;
        this.attentionDots = [];
        this.rotIndicator = 0;
        this.showLabels = true;

        // Sample context items
        this.items = [
            { label: '系统指令', type: 'system', tokens: 200 },
            { label: '用户问询', type: 'query', tokens: 50 },
            { label: '工具调用结果', type: 'tool', tokens: 300 },
            { label: '对话历史（早期）', type: 'history', tokens: 400 },
            { label: '对话历史（近期）', type: 'history', tokens: 250 },
            { label: '检索文档（1）', type: 'rag', tokens: 350 },
            { label: '检索文档（2）', type: 'rag', tokens: 280 },
            { label: '检索文档（3）', type: 'rag', tokens: 310 },
            { label: '记忆（短期）', type: 'memory', tokens: 150 },
            { label: '记忆（长期）', type: 'memory', tokens: 180 },
            { label: 'Context Packet A', type: 'custom', tokens: 120 },
            { label: 'Context Packet B', type: 'custom', tokens: 90 }
        ];

        this.typeColors = {
            system: '#6366F1',
            query: '#10B981',
            tool: '#F59E0B',
            history: '#3B82F6',
            rag: '#8B5CF6',
            memory: '#EC4899',
            custom: '#14B8A6'
        };
    }

    init(canvas) {
        super.init(canvas);
        this._setupControls();
        window.addEventListener('resize', () => { this._resize(); this.draw(); });
        this._initDots();
        this.draw();
    }

    _initDots() {
        this.attentionDots = [];
        for (let i = 0; i < 60; i++) {
            this.attentionDots.push({
                x: Math.random(),
                y: Math.random(),
                size: 1 + Math.random() * 3,
                alpha: 0.2 + Math.random() * 0.5,
                speed: 0.002 + Math.random() * 0.005
            });
        }
    }

    _setupControls() {
        const animId = 'ch9-context-window';
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
        const btn = document.getElementById('btn-play-ch9-context-window');
        if (btn) btn.textContent = this.isPlaying ? '⏸ 暂停' : '▶ 播放';
        if (this.isPlaying) this._loop();
        else cancelAnimationFrame(this.animId);
    }

    _loop() {
        if (!this.isPlaying) return;
        const now = performance.now();
        if (!this.lastStepTime) this.lastStepTime = now;
        const dur = 2000 / this.speed;
        if (now - this.lastStepTime >= dur) {
            this.step = (this.step + 1) % 4;
            this.lastStepTime = now;

            switch (this.step) {
                case 0:
                    this.targetFill = 0.3;
                    this.rotIndicator = 0;
                    break;
                case 1:
                    this.targetFill = 0.55;
                    this.rotIndicator = 0.2;
                    break;
                case 2:
                    this.targetFill = 0.78;
                    this.rotIndicator = 0.5;
                    break;
                case 3:
                    this.targetFill = 0.95;
                    this.rotIndicator = 0.8;
                    break;
            }
        }

        // Smooth fill transition
        this.fillLevel += (this.targetFill - this.fillLevel) * 0.03;

        // Animate dots
        this.attentionDots.forEach(d => {
            d.x += d.speed * this.speed * (this.fillLevel > 0.6 ? -1 : 1);
            if (d.x < 0 || d.x > 1) d.x = Math.random();
            d.alpha = this.fillLevel > 0.7
                ? Math.max(0.1, d.alpha - 0.005)
                : Math.min(0.5, d.alpha + 0.003);
        });

        this.draw();
        this.animId = requestAnimationFrame(() => this._loop());
    }

    stepForward() {
        this.step = (this.step + 1) % 4;
        switch (this.step) {
            case 0: this.targetFill = 0.3; this.rotIndicator = 0; break;
            case 1: this.targetFill = 0.55; this.rotIndicator = 0.2; break;
            case 2: this.targetFill = 0.78; this.rotIndicator = 0.5; break;
            case 3: this.targetFill = 0.95; this.rotIndicator = 0.8; break;
        }
        this.draw();
    }

    reset() {
        this.step = 0;
        this.fillLevel = 0.3;
        this.targetFill = 0.3;
        this.rotIndicator = 0;
        this.isPlaying = false;
        this.lastStepTime = 0;
        cancelAnimationFrame(this.animId);
        const btn = document.getElementById('btn-play-ch9-context-window');
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

        // === Context Window Frame ===
        const cwX = 40;
        const cwY = 50;
        const cwW = w - 80;
        const cwH = Math.min(200, h - 160);

        // Window outer frame
        ctx.strokeStyle = isDark ? '#64748B' : '#CBD5E1';
        ctx.lineWidth = 2;
        this.roundRect(ctx, cwX, cwY, cwW, cwH, 12);
        ctx.stroke();

        // Window background
        ctx.fillStyle = isDark ? '#334155' : '#FFFFFF';
        this.roundRect(ctx, cwX, cwY, cwW, cwH, 12);
        ctx.fill();

        // Fill level indicator (how full the context window is)
        const fillW = (cwW - 20) * this.fillLevel;
        ctx.fillStyle = isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.10)';
        this.roundRect(ctx, cwX + 10, cwY + 10, fillW, cwH - 20, 8);
        ctx.fill();

        // Token items inside the window
        const itemsY = cwY + 16;
        let itemX = cwX + 16;
        const itemH = 20;
        const maxItemW = 120;

        this.items.forEach((item, idx) => {
            const visible = idx / this.items.length < this.fillLevel + 0.1;
            if (!visible) return;

            const itemW = Math.min(maxItemW, Math.max(50, item.tokens / 5));
            if (itemX + itemW > cwX + cwW - 16) return;

            const color = this.typeColors[item.type] || '#94A3B8';
            ctx.fillStyle = isDark ? color + 'CC' : color + '99';
            this.roundRect(ctx, itemX, itemsY + (idx % 3) * (itemH + 4), itemW, itemH, 6);
            ctx.fill();

            // Item label
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '9px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(item.tokens + 't', itemX + itemW / 2, itemsY + (idx % 3) * (itemH + 4) + itemH / 2);

            // Move to next row if needed
            if ((idx + 1) % 3 === 0) {
                itemX = cwX + 16;
            } else {
                itemX += itemW + 6;
            }
        });

        // === Attention Distribution (right side) ===
        const chartX = w - 180;
        const chartY = cwY;
        const chartW = 150;
        const chartH = cwH;

        // Chart label
        ctx.fillStyle = textColor;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('注意力分布', chartX + chartW / 2, chartY + 4);

        // Attention dots visualization
        this.attentionDots.forEach(d => {
            const dx = chartX + 10 + d.x * (chartW - 20);
            const dy = chartY + 24 + d.y * (chartH - 40);
            ctx.beginPath();
            ctx.arc(dx, dy, d.size, 0, Math.PI * 2);

            const dotColor = this.fillLevel > 0.7
                ? (isDark ? '#EF4444' : '#FCA5A5')
                : (isDark ? '#6366F1' : '#818CF8');
            ctx.fillStyle = dotColor;
            ctx.globalAlpha = d.alpha;
            ctx.fill();
            ctx.globalAlpha = 1;
        });

        // === Context Rot Indicator ===
        if (this.rotIndicator > 0.1) {
            const rotX = cwX + cwW + 20;
            const rotY = cwY + cwH + 30;
            const rotW = 120;
            const rotH = 40;

            ctx.fillStyle = isDark ? '#450A0A' : '#FEF2F2';
            this.roundRect(ctx, rotX, rotY, rotW, rotH, 8);
            ctx.fill();
            ctx.strokeStyle = isDark ? '#EF4444' : '#FCA5A5';
            ctx.lineWidth = 1.5;
            this.roundRect(ctx, rotX, rotY, rotW, rotH, 8);
            ctx.stroke();

            ctx.fillStyle = isDark ? '#FCA5A5' : '#EF4444';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                '↑ 上下文腐蚀 ' + Math.round(this.rotIndicator * 100) + '%',
                rotX + rotW / 2, rotY + rotH / 2
            );
        }

        // === Step description ===
        const stepLabels = [
            '步骤 1：轻量级上下文 — 注意力集中，回忆精确',
            '步骤 2：中等上下文 — 注意力开始分散',
            '步骤 3：高密度上下文 — 信息点开始模糊',
            '步骤 4：拥堵上下文 — 严重腐蚀，关键信息丢失'
        ];

        ctx.fillStyle = textColor;
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(stepLabels[this.step], 40, cwY + cwH + 16);

        // Token usage bar
        const barY = cwY + cwH + 52;
        const barW = cwW - 40;
        ctx.fillStyle = isDark ? '#334155' : '#E2E8F0';
        this.roundRect(ctx, 60, barY, barW, 16, 8);
        ctx.fill();

        const fillColor = this.fillLevel > 0.8 ? '#EF4444' : (this.fillLevel > 0.6 ? '#F59E0B' : '#6366F1');
        ctx.fillStyle = fillColor;
        this.roundRect(ctx, 60, barY, barW * this.fillLevel, 16, 8);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(Math.round(this.fillLevel * 100) + '% Token 使用率', 60 + barW / 2, barY + 8);

        // Info text
        ctx.fillStyle = subColor;
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText('✅ 上下文窗口是有限资源，每个 token 都消耗注意力预算。随着填充率上升，模型回忆精度下降。', 16, h - 10);
    }
}

registerAnimation('ch9-context-window', () => new Ch9ContextWindow());

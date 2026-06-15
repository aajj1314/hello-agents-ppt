/**
 * CH4: ReAct Loop Animation
 * Visualizes the Thought -> Action -> Observation cycle
 */
const ReActAnimation = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    step: 0,
    isPlaying: false,
    speed: 1,
    animationId: null,

    // Demo data
    demoSteps: [
        { thought: '用户问：华为最新手机是什么？', action: 'Search["华为最新手机"]', observation: '华为 Pura 70 系列是最新旗舰手机...' },
        { thought: '需要了解具体型号和卖点', action: 'Search["华为 Pura 70 卖点"]', observation: 'Pura 70 搭载麒麟9010芯片，超聚光影像系统...' },
        { thought: '已收集足够信息，可以回答', action: 'Finish', observation: '' }
    ],

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        // Setup controls
        this.setupControls();

        // Initial render
        this.draw();
    },

    setupControls() {
        const animId = 'ch4-react-loop';
        const playBtn = $(`#btn-play-${animId}`);
        const stepBtn = $(`#btn-step-${animId}`);
        const resetBtn = $(`#btn-reset-${animId}`);
        const speedSlider = $(`#speed-${animId}`);

        if (playBtn) {
            playBtn.addEventListener('click', () => this.togglePlay());
        }
        if (stepBtn) {
            stepBtn.addEventListener('click', () => this.stepForward());
        }
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.reset());
        }
        if (speedSlider) {
            speedSlider.addEventListener('input', (e) => {
                this.speed = parseFloat(e.target.value);
            });
        }
    },

    togglePlay() {
        this.isPlaying = !this.isPlaying;
        const playBtn = $('#btn-play-ch4-react-loop');
        if (playBtn) {
            playBtn.textContent = this.isPlaying ? '⏸ 暂停' : '▶ 播放';
        }

        if (this.isPlaying) {
            this.playLoop();
        } else {
            cancelAnimationFrame(this.animationId);
        }
    },

    playLoop() {
        if (!this.isPlaying) return;

        const now = Date.now();
        if (!this.lastStepTime) this.lastStepTime = now;

        const stepDuration = 2000 / this.speed;
        if (now - this.lastStepTime >= stepDuration) {
            this.stepForward();
            this.lastStepTime = now;
        }

        this.animationId = requestAnimationFrame(() => this.playLoop());
    },

    stepForward() {
        if (this.step < this.demoSteps.length * 3) {
            this.step++;
            this.draw();
        } else {
            this.isPlaying = false;
            const playBtn = $('#btn-play-ch4-react-loop');
            if (playBtn) playBtn.textContent = '▶ 播放';
        }
    },

    reset() {
        this.step = 0;
        this.isPlaying = false;
        this.lastStepTime = null;
        cancelAnimationFrame(this.animationId);
        const playBtn = $('#btn-play-ch4-react-loop');
        if (playBtn) playBtn.textContent = '▶ 播放';
        this.draw();
    },

    draw() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;

        // Clear
        ctx.clearRect(0, 0, w, h);

        // Background
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim() || '#ffffff';
        ctx.fillRect(0, 0, w, h);

        // Layout positions
        const centerX = w / 2;
        const centerY = h / 2;
        const brainY = centerY - 80;
        const toolY = centerY + 80;
        const memoryX = w - 150;

        // Draw User Question (top)
        this.drawBox(ctx, centerX - 100, 20, 200, 40, '用户问题', '#E0E7FF', this.step >= 1);

        // Draw LLM Brain (center top)
        this.drawCircle(ctx, centerX, brainY, 50, 'LLM大脑', '#6366F1', this.step >= 2);

        // Draw Thought bubble
        if (this.step >= 2) {
            const stepIndex = Math.floor((this.step - 2) / 3);
            const phase = (this.step - 2) % 3;
            if (stepIndex < this.demoSteps.length && phase === 0) {
                this.drawBubble(ctx, centerX + 60, brainY - 30, this.demoSteps[stepIndex].thought);
            }
        }

        // Draw Action arrow (brain -> tool)
        if (this.step >= 3) {
            const stepIndex = Math.floor((this.step - 3) / 3);
            const phase = (this.step - 3) % 3;
            const progress = phase === 0 ? 0.5 : 1;
            this.drawArrow(ctx, centerX, brainY + 50, centerX, toolY - 40, '#3B82F6', progress);
        }

        // Draw Tool box (center bottom)
        this.drawBox(ctx, centerX - 60, toolY - 30, 120, 60, '工具', '#DBEAFE', this.step >= 4);

        // Draw Action label
        if (this.step >= 4) {
            const stepIndex = Math.floor((this.step - 4) / 3);
            if (stepIndex < this.demoSteps.length) {
                ctx.fillStyle = '#3B82F6';
                ctx.font = '12px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(this.demoSteps[stepIndex].action, centerX, toolY + 50);
            }
        }

        // Draw Observation arrow (tool -> brain)
        if (this.step >= 5) {
            const stepIndex = Math.floor((this.step - 5) / 3);
            const phase = (this.step - 5) % 3;
            const progress = phase === 0 ? 0.5 : 1;
            this.drawArrow(ctx, centerX - 20, toolY - 30, centerX - 20, brainY + 50, '#10B981', progress);
        }

        // Draw Observation label
        if (this.step >= 5) {
            const stepIndex = Math.floor((this.step - 5) / 3);
            if (stepIndex < this.demoSteps.length) {
                ctx.fillStyle = '#10B981';
                ctx.font = '12px sans-serif';
                ctx.textAlign = 'right';
                const text = this.demoSteps[stepIndex].observation;
                if (text) {
                    ctx.fillText(text.substring(0, 30) + '...', centerX - 30, centerY);
                }
            }
        }

        // Draw Memory (right side)
        this.drawBox(ctx, memoryX - 60, centerY - 60, 120, 120, '记忆', '#F3F4F6', true);

        // Draw memory entries
        const stepIndex = Math.floor(this.step / 3);
        for (let i = 0; i < Math.min(stepIndex, this.demoSteps.length); i++) {
            const y = centerY - 40 + i * 25;
            ctx.fillStyle = '#E5E7EB';
            ctx.fillRect(memoryX - 50, y, 100, 20);
            ctx.fillStyle = '#6B7280';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`Step ${i + 1}`, memoryX, y + 14);
        }

        // Draw step indicator
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`Step: ${this.step} / ${this.demoSteps.length * 3}`, 20, h - 20);

        // Draw legend
        const legendY = h - 60;
        this.drawLegend(ctx, 20, legendY, '#6366F1', 'Thought');
        this.drawLegend(ctx, 120, legendY, '#3B82F6', 'Action');
        this.drawLegend(ctx, 220, legendY, '#10B981', 'Observation');
    },

    drawCircle(ctx, x, y, r, label, color, active) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = active ? color : '#E5E7EB';
        ctx.fill();
        ctx.strokeStyle = active ? color : '#D1D5DB';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = active ? '#FFFFFF' : '#9CA3AF';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x, y);
    },

    drawBox(ctx, x, y, w, h, label, color, active) {
        ctx.fillStyle = active ? color : '#F3F4F6';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = active ? color : '#D1D5DB';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = active ? '#1F2937' : '#9CA3AF';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x + w / 2, y + h / 2);
    },

    drawArrow(ctx, x1, y1, x2, y2, color, progress = 1) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        const endX = x1 + dx * progress;
        const endY = y1 + dy * progress;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Arrowhead
        if (progress >= 1) {
            const angle = Math.atan2(dy, dx);
            const headLen = 10;
            ctx.beginPath();
            ctx.moveTo(endX, endY);
            ctx.lineTo(endX - headLen * Math.cos(angle - Math.PI / 6), endY - headLen * Math.sin(angle - Math.PI / 6));
            ctx.lineTo(endX - headLen * Math.cos(angle + Math.PI / 6), endY - headLen * Math.sin(angle + Math.PI / 6));
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
        }
    },

    drawBubble(ctx, x, y, text) {
        const padding = 10;
        ctx.font = '12px sans-serif';
        const metrics = ctx.measureText(text);
        const w = metrics.width + padding * 2;
        const h = 30;

        ctx.fillStyle = '#FEF3C7';
        ctx.fillRect(x, y - h / 2, w, h);
        ctx.strokeStyle = '#F59E0B';
        ctx.strokeRect(x, y - h / 2, w, h);

        ctx.fillStyle = '#92400E';
        ctx.textAlign = 'left';
        ctx.fillText(text, x + padding, y + 4);
    },

    drawLegend(ctx, x, y, color, label) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 15, 15);
        ctx.fillStyle = '#374151';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(label, x + 20, y + 12);
    }
};

// Register animation
window.Animations = window.Animations || {};
window.Animations['ch4-react-loop'] = ReActAnimation;
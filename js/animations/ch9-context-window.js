/**
 * CH9: Context Engineering — GSSC Pipeline + Context Window Water Level
 * Visualizes the four-stage Gather → Select → Structure → Compress pipeline
 * alongside a real-time context window token budget gauge.
 */
import { CanvasAnimation } from './canvas-animation.js';
import { registerAnimation } from './animation-registry.js';

const ANIM_ID = 'ch9-context-window';
const MAX_TOKENS = 8000;

const PIPELINE = [
    {
        key: 'gather',
        letter: 'G',
        title: 'Gather',
        subtitle: '收集',
        desc: '从多源汇集候选信息',
        colorKey: 'accentTeal',
        tools: 'MemoryTool · RAGTool · NoteTool · Terminal',
        inject: { system: 200, history: 200, tools: 300, rag: 400 }
    },
    {
        key: 'select',
        letter: 'S',
        title: 'Select',
        subtitle: '筛选',
        desc: '相关性与新近性加权',
        colorKey: 'primary',
        tools: 'relevance × recency · min_relevance 过滤',
        inject: { history: 200, rag: 300 }
    },
    {
        key: 'structure',
        letter: 'S',
        title: 'Structure',
        subtitle: '结构化',
        desc: '按 [Role/Task/Evidence/Context/Output] 分区',
        colorKey: 'success',
        tools: '[Role] · [Task] · [Evidence] · [Context] · [Output]',
        inject: { system: 200, history: 200 }
    },
    {
        key: 'compress',
        letter: 'C',
        title: 'Compress',
        subtitle: '压缩',
        desc: '超限分区截断 + 摘要',
        colorKey: 'accentAmber',
        tools: '_compress · _truncate_text · 保持结构完整',
        inject: { compress: -1500 }
    }
];

class Ch9Context extends CanvasAnimation {
    constructor() {
        super();
        this.step = 0;
        this.isPlaying = false;
        this.speed = 1;
        this.lastStepTime = 0;
        this.animId = null;

        // Animated state
        this.usedTokens = 800;     // current token usage
        this.targetTokens = 800;
        this.wavePhase = 0;
        this.particles = [];
        this.bubbles = [];
        this.pulse = 0;
        this.hoverIndex = -1;
        this.tooltip = null;

        // Active step highlight
        this._setupHover();
    }

    _setupHover() {
        this._onMove = (e) => {
            if (!this.canvas) return;
            const rect = this.canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            this.hoverIndex = this._hitStep(mx, my);
            const tip = this.hoverIndex >= 0 ? PIPELINE[this.hoverIndex] : null;
            this.tooltip = tip ? { x: mx, y: my, ...tip } : null;
            this.canvas.style.cursor = tip ? 'pointer' : 'default';
            this.draw();
        };
        this._onLeave = () => {
            this.hoverIndex = -1;
            this.tooltip = null;
            this.canvas.style.cursor = 'default';
            this.draw();
        };
    }

    _hitStep(mx, my) {
        if (!this._stepRects) return -1;
        for (let i = 0; i < this._stepRects.length; i++) {
            const r = this._stepRects[i];
            if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
                return i;
            }
        }
        return -1;
    }

    init(canvas) {
        super.init(canvas);
        this._setupControls();
        this._initParticles();
        window.addEventListener('resize', () => { this._resize(); this.draw(); });
        canvas.addEventListener('mousemove', this._onMove);
        canvas.addEventListener('mouseleave', this._onLeave);
        this.draw();
    }

    _setupControls() {
        const playBtn = document.getElementById('btn-play-' + ANIM_ID);
        const resetBtn = document.getElementById('btn-reset-' + ANIM_ID);
        const stepBtn = document.getElementById('btn-step-' + ANIM_ID);
        const speedSlider = document.getElementById('speed-' + ANIM_ID);
        if (playBtn) playBtn.addEventListener('click', () => this.togglePlay());
        if (resetBtn) resetBtn.addEventListener('click', () => this.reset());
        if (stepBtn) stepBtn.addEventListener('click', () => this.stepForward());
        if (speedSlider) speedSlider.addEventListener('input', (e) => {
            this.speed = parseFloat(e.target.value) || 1;
        });
    }

    _initParticles() {
        this.particles = [];
        for (let i = 0; i < 24; i++) {
            this.particles.push({
                t: Math.random(),
                speed: 0.4 + Math.random() * 0.6,
                size: 1.5 + Math.random() * 2.5,
                alpha: 0.5 + Math.random() * 0.5
            });
        }
        this.bubbles = [];
        for (let i = 0; i < 18; i++) {
            this.bubbles.push({
                x: 0.1 + Math.random() * 0.8,
                y: 0.5 + Math.random() * 0.5,
                r: 1 + Math.random() * 3,
                vy: 0.001 + Math.random() * 0.003,
                drift: (Math.random() - 0.5) * 0.0008
            });
        }
    }

    togglePlay() {
        this.isPlaying = !this.isPlaying;
        const btn = document.getElementById('btn-play-' + ANIM_ID);
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
            this._applyStep(this.step);
            this.step = (this.step + 1) % PIPELINE.length;
            this.lastStepTime = now;
        }

        this.wavePhase += 0.04 * this.speed;
        this.pulse = (this.pulse + 0.06 * this.speed) % (Math.PI * 2);

        // Smooth token count interpolation
        this.usedTokens += (this.targetTokens - this.usedTokens) * 0.06;

        // Advance pipeline particles
        for (const p of this.particles) {
            p.t += p.speed * 0.004 * this.speed;
            if (p.t > 1) p.t -= 1;
        }
        // Animate bubbles (only visible when window is filling)
        for (const b of this.bubbles) {
            b.y -= b.vy * this.speed;
            b.x += b.drift * this.speed;
            if (b.y < 0) {
                b.y = 1;
                b.x = 0.1 + Math.random() * 0.8;
            }
            if (b.x < 0.05 || b.x > 0.95) b.drift *= -1;
        }

        this.draw();
        this.animId = requestAnimationFrame(() => this._loop());
    }

    _applyStep(idx) {
        const stage = PIPELINE[idx];
        const inc = stage.inject;
        for (const k in inc) {
            this.targetTokens = Math.max(200, Math.min(MAX_TOKENS + 200, this.targetTokens + inc[k]));
        }
    }

    stepForward() {
        this._applyStep(this.step);
        this.step = (this.step + 1) % PIPELINE.length;
        this.draw();
    }

    reset() {
        this.step = 0;
        this.usedTokens = 800;
        this.targetTokens = 800;
        this.wavePhase = 0;
        this.pulse = 0;
        this.isPlaying = false;
        this.lastStepTime = 0;
        this._initParticles();
        cancelAnimationFrame(this.animId);
        const btn = document.getElementById('btn-play-' + ANIM_ID);
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
        if (!this.ctx) return;
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        const t = this.theme();
        const isDark = this.isDarkTheme();
        const bg = isDark ? t.surfaceDarkSoft : t.canvas;
        const panelBg = isDark ? t.surfaceDark : t.canvas;
        const border = t.hairline;
        const textColor = t.ink;
        const subColor = t.muted;
        const grid = this._withAlpha(t.muted, isDark ? 0.15 : 0.18);
        // Resolve the pipeline stage color tokens to actual hex
        for (let i = 0; i < PIPELINE.length; i++) {
            const base = t[PIPELINE[i].colorKey];
            PIPELINE[i].color = base;
            PIPELINE[i].colorDark = this._shade(base, isDark ? 0.15 : 0.25);
        }

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        // ===== Title =====
        ctx.fillStyle = textColor;
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('上下文工程 · GSSC 流水线', 16, 12);
        ctx.fillStyle = subColor;
        ctx.font = '11px sans-serif';
        ctx.fillText('Gather → Select → Structure → Compress   |   实时水位: ' +
            this.usedTokens.toFixed(0) + ' / ' + MAX_TOKENS + ' tokens', 16, 32);

        // ===== Layout split =====
        const padding = 16;
        const topOffset = 54;
        const leftW = Math.max(240, w * 0.38);
        const rightX = padding + leftW + 16;
        const rightW = w - rightX - padding;
        const bottomY = h - 36;

        this._drawWindowPanel(ctx, padding, topOffset, leftW, bottomY - topOffset, panelBg, border, textColor, subColor, grid, isDark, t);
        this._drawPipeline(ctx, rightX, topOffset, rightW, bottomY - topOffset, panelBg, border, textColor, subColor, isDark);

        // ===== Footer status =====
        const stage = PIPELINE[this.step];
        const overCap = this.usedTokens > MAX_TOKENS;
        const statusColor = overCap ? t.error : (this.usedTokens > MAX_TOKENS * 0.8 ? t.warning : stage.color);
        ctx.fillStyle = statusColor;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(
            `▶ 步骤 ${this.step + 1}/${PIPELINE.length} · ${stage.title} (${stage.subtitle}) — ${stage.desc}`,
            padding, h - 14
        );
        ctx.fillStyle = subColor;
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        if (overCap) {
            ctx.fillStyle = t.error;
            ctx.fillText('⚠ 上下文超限 — Compress 阶段将兜底压缩', w - padding, h - 14);
        } else {
            ctx.fillText('提示: 鼠标悬停步骤可查看对应工具/方法', w - padding, h - 14);
        }

        // ===== Tooltip =====
        if (this.tooltip) {
            this._drawTooltip(ctx, this.tooltip, w, h, panelBg, border, textColor, subColor, isDark, t);
        }
    }

    // ----- Left: Context Window as water tank -----
    _drawWindowPanel(ctx, x, y, w, h, panelBg, border, textColor, subColor, grid, isDark, t) {
        // Panel background
        ctx.fillStyle = panelBg;
        this.roundRect(ctx, x, y, w, h, 12);
        ctx.fill();
        ctx.strokeStyle = border;
        ctx.lineWidth = 1;
        this.roundRect(ctx, x, y, w, h, 12);
        ctx.stroke();

        // Header
        ctx.fillStyle = textColor;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('上下文窗口 (Context Window)', x + 14, y + 12);
        ctx.fillStyle = subColor;
        ctx.font = '10px sans-serif';
        ctx.fillText('容量: ' + MAX_TOKENS + ' tokens', x + 14, y + 28);

        // Tank geometry
        const tankX = x + 28;
        const tankY = y + 56;
        const tankW = w - 56;
        const tankH = h - 130;
        const tankR = 14;

        // Tank shell
        ctx.fillStyle = isDark ? t.surfaceDark : t.surfaceCard;
        this.roundRect(ctx, tankX, tankY, tankW, tankH, tankR);
        ctx.fill();
        ctx.strokeStyle = isDark ? t.muted : t.hairline;
        ctx.lineWidth = 2;
        this.roundRect(ctx, tankX, tankY, tankW, tankH, tankR);
        ctx.stroke();

        // Grid lines (capacity markers)
        ctx.strokeStyle = grid;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 4]);
        for (let i = 1; i <= 4; i++) {
            const ly = tankY + (tankH / 5) * i;
            ctx.beginPath();
            ctx.moveTo(tankX + 8, ly);
            ctx.lineTo(tankX + tankW - 8, ly);
            ctx.stroke();
        }
        ctx.setLineDash([]);

        // Water fill
        const fillRatio = Math.min(1, this.usedTokens / MAX_TOKENS);
        const waterH = (tankH - 10) * fillRatio;
        const waterY = tankY + tankH - 5 - waterH;
        const overflow = this.usedTokens > MAX_TOKENS;

        if (waterH > 0) {
            ctx.save();
            this.roundRect(ctx, tankX + 4, waterY, tankW - 8, waterH + 4, tankR - 4);
            ctx.clip();

            // Gradient water
            const grad = ctx.createLinearGradient(0, waterY, 0, waterY + waterH);
            const low = t.accentTeal;          // calm / safe state
            const high = t.warning;            // getting near the cap
            const danger = t.error;            // overflow
            if (overflow) {
                grad.addColorStop(0, this._withAlpha(danger, 0.85));
                grad.addColorStop(1, this._shade(danger, -0.15));
            } else if (fillRatio > 0.8) {
                grad.addColorStop(0, this._withAlpha(high, 0.75));
                grad.addColorStop(1, this._shade(high, -0.15));
            } else {
                grad.addColorStop(0, this._withAlpha(low, 0.70));
                grad.addColorStop(1, this._shade(low, -0.20));
            }
            ctx.fillStyle = grad;
            ctx.fillRect(tankX + 4, waterY, tankW - 8, waterH + 4);

            // Wave overlay
            ctx.beginPath();
            const amp = overflow ? 3 : 5;
            const segW = 4;
            ctx.moveTo(tankX + 4, waterY + 4);
            for (let wx = tankX + 4; wx <= tankX + tankW - 4; wx += segW) {
                const wy = waterY + 4 + Math.sin((wx + this.wavePhase * 18) / 14) * amp;
                ctx.lineTo(wx, wy);
            }
            ctx.lineTo(tankX + tankW - 4, waterY + 4);
            ctx.closePath();
            ctx.fillStyle = overflow
                ? this._withAlpha(t.surfaceCard, 0.55)
                : (fillRatio > 0.8
                    ? this._withAlpha(t.surfaceCard, 0.55)
                    : this._withAlpha(t.surfaceCard, 0.55));
            ctx.fill();

            // Bubbles in water
            for (const b of this.bubbles) {
                const bx = tankX + 4 + b.x * (tankW - 8);
                const by = tankY + 4 + b.y * (tankH - 8);
                if (by < waterY) continue;
                ctx.beginPath();
                ctx.arc(bx, by, b.r, 0, Math.PI * 2);
                ctx.fillStyle = this._withAlpha(t.onPrimary, 0.45);
                ctx.fill();
            }
            ctx.restore();
        }

        // Tank label & percentage
        ctx.fillStyle = textColor;
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const pct = (this.usedTokens / MAX_TOKENS) * 100;
        ctx.fillText(pct.toFixed(0) + '%', x + w / 2, tankY + tankH / 2 - 4);
        ctx.font = '10px sans-serif';
        ctx.fillStyle = overflow ? t.error : subColor;
        ctx.fillText(Math.round(this.usedTokens).toLocaleString() + ' / ' + MAX_TOKENS + ' tok', x + w / 2, tankY + tankH / 2 + 14);

        if (overflow) {
            ctx.fillStyle = t.error;
            ctx.font = 'bold 10px sans-serif';
            ctx.fillText('⚠ 上下文腐蚀风险', x + w / 2, tankY + tankH / 2 + 30);
        }

        // Composition legend (4 categories)
        const legendY = tankY + tankH + 16;
        const cats = this._composition(t);
        const totalShown = cats.reduce((s, c) => s + c.value, 0) || 1;
        const barX = x + 14;
        const barW = w - 28;
        const barH = 14;
        const segGap = 1;
        let runX = barX;
        ctx.fillStyle = isDark ? t.surfaceDark : t.surfaceCard;
        this.roundRect(ctx, barX, legendY, barW, barH, 4);
        ctx.fill();
        for (const c of cats) {
            const segW = (barW - segGap * (cats.length - 1)) * (c.value / totalShown);
            ctx.fillStyle = c.color;
            ctx.fillRect(runX, legendY, segW, barH);
            runX += segW + segGap;
        }
        // Legend items
        let lx = x + 14;
        const ly = legendY + 22;
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        for (const c of cats) {
            ctx.fillStyle = c.color;
            ctx.fillRect(lx, ly + 3, 8, 8);
            ctx.fillStyle = subColor;
            ctx.fillText(c.label + ' ' + c.value + 't', lx + 12, ly);
            lx += 78;
        }
    }

    _composition(t) {
        // Derive composition from current step (mock realistic numbers).
        // Each category maps to one of the pipeline-stage accents.
        const stepMul = [0.25, 0.45, 0.65, 0.5][this.step] || 0.4;
        const overflow = this.usedTokens > MAX_TOKENS;
        return [
            { label: 'System', value: Math.round(220 * (overflow ? 0.9 : 1)), colorKey: 'accentTeal' },
            { label: 'History', value: Math.round(900 * stepMul * (overflow ? 0.7 : 1)), colorKey: 'primary' },
            { label: 'Tools', value: Math.round(600 * (0.4 + stepMul * 0.5)), colorKey: 'accentAmber' },
            { label: 'RAG', value: Math.round(1100 * (0.3 + stepMul * 0.6) * (overflow ? 0.55 : 1)), colorKey: 'success' }
        ].map((c) => { c.color = t[c.colorKey]; return c; });
    }

    // ----- Right: GSSC Pipeline -----
    _drawPipeline(ctx, x, y, w, h, panelBg, border, textColor, subColor, isDark) {
        // Panel background
        ctx.fillStyle = panelBg;
        this.roundRect(ctx, x, y, w, h, 12);
        ctx.fill();
        ctx.strokeStyle = border;
        ctx.lineWidth = 1;
        this.roundRect(ctx, x, y, w, h, 12);
        ctx.stroke();

        // Header
        ctx.fillStyle = textColor;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('GSSC 流水线 (ContextBuilder)', x + 14, y + 12);
        ctx.fillStyle = subColor;
        ctx.font = '10px sans-serif';
        ctx.fillText('Gather-Select-Structure-Compress · 鼠标悬停查看工具', x + 14, y + 28);

        const stagesAreaY = y + 50;
        const stagesAreaH = h - 60;
        const stepsCount = PIPELINE.length;
        const colGap = 18;
        const stepW = (w - 28 - colGap * (stepsCount - 1)) / stepsCount;
        const stepH = Math.min(150, stagesAreaH * 0.62);
        const stepY = stagesAreaY;

        this._stepRects = [];
        const positions = [];
        for (let i = 0; i < stepsCount; i++) {
            const sx = x + 14 + i * (stepW + colGap);
            positions.push({ x: sx, y: stepY, w: stepW, h: stepH });
        }

        // Draw arrows + particles between steps
        for (let i = 0; i < stepsCount - 1; i++) {
            const ax = positions[i].x + positions[i].w;
            const ay = positions[i].y + positions[i].h / 2;
            const bx = positions[i + 1].x;
            const by = positions[i + 1].y + positions[i + 1].h / 2;
            this._drawConnector(ctx, ax, ay, bx, by, isDark, i === this.step || i + 1 === this.step, t);
        }

        // Draw step cards
        for (let i = 0; i < stepsCount; i++) {
            const active = i === this.step;
            const hover = i === this.hoverIndex;
            this._drawStepCard(ctx, positions[i], PIPELINE[i], active, hover, textColor, subColor, isDark, t);
            this._stepRects.push(positions[i]);
        }

        // Pipeline particles (flowing from current step forward)
        const cur = positions[this.step];
        const next = positions[(this.step + 1) % stepsCount];
        if (cur && next) {
            const ax = cur.x + cur.w;
            const ay = cur.y + cur.h / 2;
            const bx = next.x;
            const by = next.y + next.h / 2;
            const stageColor = isDark ? PIPELINE[this.step].colorDark : PIPELINE[this.step].color;
            for (const p of this.particles) {
                const px = ax + (bx - ax) * p.t;
                const py = ay + (by - ay) * p.t + Math.sin(p.t * Math.PI * 2 + this.wavePhase) * 4;
                ctx.beginPath();
                ctx.arc(px, py, p.size, 0, Math.PI * 2);
                ctx.fillStyle = stageColor;
                ctx.globalAlpha = p.alpha;
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        }

        // Step description below cards
        const stage = PIPELINE[this.step];
        const descY = positions[0].y + stepH + 18;
        ctx.fillStyle = isDark ? stage.colorDark : stage.color;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(stage.title + ' · ' + stage.subtitle, x + 14, descY);
        ctx.fillStyle = subColor;
        ctx.font = '10px sans-serif';
        const wrapLines = this.wrapText(ctx, stage.desc + '   →   ' + stage.tools, x + 14, descY + 16, w - 28, 13);
        wrapLines.forEach((ln, i) => ctx.fillText(ln, x + 14, descY + 16 + i * 13));
    }

    _drawStepCard(ctx, r, stage, active, hover, textColor, subColor, isDark, t) {
        const fill = isDark ? t.surfaceDark : t.canvas;
        const stroke = isDark ? stage.colorDark : stage.color;
        const pulse = 0.5 + 0.5 * Math.sin(this.pulse + active ? 0 : 1);

        // Card body
        ctx.save();
        ctx.fillStyle = fill;
        this.roundRect(ctx, r.x, r.y, r.w, r.h, 10);
        ctx.fill();

        // Border (highlighted when active/hover)
        const borderW = active || hover ? 2.5 : 1.2;
        ctx.strokeStyle = active || hover ? stroke : (isDark ? t.muted : t.hairline);
        ctx.lineWidth = borderW;
        this.roundRect(ctx, r.x, r.y, r.w, r.h, 10);
        ctx.stroke();

        // Active glow
        if (active) {
            ctx.shadowColor = stroke;
            ctx.shadowBlur = 12 * pulse + 4;
            ctx.strokeStyle = stroke;
            ctx.lineWidth = 2;
            this.roundRect(ctx, r.x, r.y, r.w, r.h, 10);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // Letter badge
        const badgeR = Math.min(22, r.w / 5);
        const bx = r.x + 18 + badgeR;
        const by = r.y + 22;
        const grad = ctx.createLinearGradient(0, by - badgeR, 0, by + badgeR);
        grad.addColorStop(0, stage.color);
        grad.addColorStop(1, isDark ? stage.colorDark : stage.color);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(bx, by, badgeR, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = t.onDark;
        ctx.font = 'bold ' + Math.round(badgeR * 1.1) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(stage.letter, bx, by);

        // Title
        ctx.fillStyle = textColor;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(stage.title, r.x + 18 + badgeR * 2 + 8, r.y + 10);
        ctx.fillStyle = subColor;
        ctx.font = '10px sans-serif';
        ctx.fillText(stage.subtitle, r.x + 18 + badgeR * 2 + 8, r.y + 26);

        // Description (wrapped)
        ctx.fillStyle = textColor;
        ctx.font = '10px sans-serif';
        const desc = stage.desc;
        const maxW = r.w - 20;
        const lines = this.wrapText(ctx, desc, 0, 0, maxW, 12);
        let cy = r.y + 56;
        for (let i = 0; i < Math.min(lines.length, 3); i++) {
            ctx.fillText(lines[i], r.x + 10, cy);
            cy += 13;
        }

        // Active marker
        if (active) {
            ctx.fillStyle = stroke;
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText('● ACTIVE', r.x + r.w - 8, r.y + 8);
        }
        ctx.restore();
    }

    _drawConnector(ctx, ax, ay, bx, by, isDark, highlight, t) {
        const margin = 8;
        const sx = ax + margin;
        const sy = ay;
        const ex = bx - margin;
        const ey = by;

        // Base line
        ctx.strokeStyle = isDark ? t.muted : t.hairline;
        ctx.lineWidth = highlight ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();

        // Arrowhead
        ctx.fillStyle = highlight ? (isDark ? t.mutedSoft : t.body) : (isDark ? t.muted : t.hairline);
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - 7, ey - 4);
        ctx.lineTo(ex - 7, ey + 4);
        ctx.closePath();
        ctx.fill();
    }

    _drawTooltip(ctx, tip, w, h, panelBg, border, textColor, subColor, isDark) {
        const lines = [tip.title + ' · ' + tip.subtitle, tip.desc, '🛠 ' + tip.tools];
        ctx.font = '11px sans-serif';
        let maxLineW = 0;
        for (const ln of lines) {
            const m = ctx.measureText(ln);
            if (m.width > maxLineW) maxLineW = m.width;
        }
        const tw = Math.min(280, maxLineW + 24);
        const th = lines.length * 16 + 16;
        let tx = tip.x + 14;
        let ty = tip.y + 14;
        if (tx + tw > w - 8) tx = tip.x - tw - 14;
        if (ty + th > h - 8) ty = h - th - 8;
        if (tx < 8) tx = 8;
        if (ty < 8) ty = 8;

        ctx.save();
        ctx.fillStyle = isDark ? 'rgba(15,23,42,0.96)' : 'rgba(255,255,255,0.98)';
        this.roundRect(ctx, tx, ty, tw, th, 8);
        ctx.fill();
        ctx.strokeStyle = isDark ? tip.colorDark : tip.color;
        ctx.lineWidth = 1.5;
        this.roundRect(ctx, tx, ty, tw, th, 8);
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        let yy = ty + 8;
        ctx.fillStyle = isDark ? tip.colorDark : tip.color;
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(lines[0], tx + 12, yy);
        yy += 16;
        ctx.fillStyle = textColor;
        ctx.font = '11px sans-serif';
        ctx.fillText(lines[1], tx + 12, yy);
        yy += 16;
        ctx.fillStyle = subColor;
        ctx.font = '10px sans-serif';
        const toolLines = this.wrapText(ctx, lines[2], 0, 0, tw - 24, 12);
        for (const ln of toolLines) {
            ctx.fillText(ln, tx + 12, yy);
            yy += 12;
        }
        ctx.restore();
    }

    _withAlpha(hex, alpha) {
        if (typeof hex !== 'string' || hex[0] !== '#' || hex.length < 7) return hex;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    }

    _shade(hex, amount) {
        if (typeof hex !== 'string' || hex[0] !== '#' || hex.length < 7) return hex;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const target = amount < 0 ? 0 : 255;
        const p = Math.abs(amount);
        const nr = Math.round((target - r) * p + r);
        const ng = Math.round((target - g) * p + g);
        const nb = Math.round((target - b) * p + b);
        return '#' + [nr, ng, nb].map(v => v.toString(16).padStart(2, '0')).join('');
    }
}

registerAnimation('ch9-context-window', () => new Ch9Context());

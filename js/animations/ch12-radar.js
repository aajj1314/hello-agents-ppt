/**
 * CH12: Agent Performance Evaluation — 6-Dimension Radar Chart with Draggable Weights
 *
 * Visual concept: 中心六维评估雷达图 + 可拖动权重
 *  - Six evaluation dimensions: 准确率 / 鲁棒性 / 工具调用 / 任务完成 / 推理能力 / 效率
 *  - Each dimension endpoint is a draggable circle: mouse down → drag along axis
 *    to change that dimension's score (0-100), polygon shape updates in real time.
 *  - Four tick rings (25/50/75/100%) on every axis.
 *  - Right-side score card lists all six dimensions with bar + score, plus a
 *    "current total score" weighted average that updates live.
 *  - Play mode: 6 dimensions rise to their target scores one by one (demo).
 */
import { CanvasAnimation } from './canvas-animation.js';
import { registerAnimation } from './animation-registry.js';

class Ch12Radar extends CanvasAnimation {
    constructor() {
        super();
        this.animId = 'ch12-radar';

        // Six evaluation dimensions
        this.dimensions = [
            { name: '准确率',   short: 'Acc',  desc: '任务成功率 / 答案正确率',     weight: 1.0, color: '#6366F1' },
            { name: '鲁棒性',   short: 'Rob',  desc: '异常输入 / 模糊需求下稳定性',  weight: 1.0, color: '#3B82F6' },
            { name: '工具调用', short: 'Tool', desc: '工具选对率 + 参数填对率',      weight: 1.0, color: '#10B981' },
            { name: '任务完成', short: 'Comp', desc: '多步任务的最终完成度',         weight: 1.0, color: '#F59E0B' },
            { name: '推理能力', short: 'Reas', desc: '多步推理 / 复杂问题分解',      weight: 1.0, color: '#EC4899' },
            { name: '效率',     short: 'Eff',  desc: '完成任务的步数 / Token 消耗',  weight: 1.0, color: '#8B5CF6' }
        ];
        this.dimCount = this.dimensions.length;

        // Target scores (for play-mode demo) and current scores (what the user sees / drags)
        this.targetScores  = [85, 70, 78, 75, 80, 65];
        this.currentScores = [0,  0,  0,  0,  0,  0];

        // Playback state
        this._playing = false;
        this._rafId = null;
        this._activeAxis = -1;     // which dim is animating up during play
        this.speed = 1;

        // Drag state
        this._dragging = -1;       // -1 or index of dragged dimension
        this._hovering = -1;       // -1 or index of hovered endpoint (cursor feedback)
        this._pointRects = [];     // hit-test rects, recomputed in draw()
    }

    // -------- lifecycle --------
    init(canvas) {
        super.init(canvas);
        this._setupControls();
        this._setupCanvasEvents();
        window.addEventListener('resize', () => { this._resize(); this.draw(); });
        this.draw();
    }

    _setupControls() {
        const playBtn  = document.getElementById('btn-play-'  + this.animId);
        const resetBtn = document.getElementById('btn-reset-' + this.animId);
        const stepBtn  = document.getElementById('btn-step-'  + this.animId);
        const speedSld = document.getElementById('speed-'     + this.animId);
        if (playBtn)  playBtn.addEventListener('click',  () => this.togglePlay());
        if (resetBtn) resetBtn.addEventListener('click', () => this.reset());
        if (stepBtn)  stepBtn.addEventListener('click',  () => this.stepForward());
        if (speedSld) speedSld.addEventListener('input',  (e) => {
            this.speed = parseFloat(e.target.value) || 1;
        });
    }

    _setupCanvasEvents() {
        this.canvas.addEventListener('mousedown',  (e) => this._onMouseDown(e));
        this.canvas.addEventListener('mousemove',  (e) => this._onMouseMove(e));
        this.canvas.addEventListener('mouseup',    (e) => this._onMouseUp(e));
        this.canvas.addEventListener('mouseleave', () => this._onMouseLeave());
        // Touch support: treat first touch as mouse
        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches[0]) this._onMouseDown(this._touchToMouseEvent(e.touches[0]));
        }, { passive: true });
        this.canvas.addEventListener('touchmove', (e) => {
            if (e.touches[0]) this._onMouseMove(this._touchToMouseEvent(e.touches[0]));
        }, { passive: true });
        this.canvas.addEventListener('touchend', () => this._onMouseUp());
    }

    _touchToMouseEvent(touch) {
        const rect = this.canvas.getBoundingClientRect();
        return { clientX: touch.clientX, clientY: touch.clientY };
    }

    // -------- playback API --------
    togglePlay() {
        if (this._playing) {
            this._playing = false;
            cancelAnimationFrame(this._rafId);
            const btn = document.getElementById('btn-play-' + this.animId);
            if (btn) btn.textContent = '▶ 播放';
            return;
        }
        this._playing = true;
        this._activeAxis = 0;
        const btn = document.getElementById('btn-play-' + this.animId);
        if (btn) btn.textContent = '⏸ 暂停';
        this._loop();
    }

    _loop() {
        if (!this._playing) return;
        // Animate only the "active" axis toward its target; once that one is full,
        // move on to the next dimension (demo mode). If everything is at target, stop.
        let stillAnimating = false;
        for (let i = 0; i < this.dimCount; i++) {
            const target = this.targetScores[i];
            const cur = this.currentScores[i];
            if (cur < target) {
                this.currentScores[i] = Math.min(
                    cur + 0.55 * (this.speed || 1),
                    target
                );
                if (this.currentScores[i] < target) stillAnimating = true;
            }
        }
        this.draw();

        if (!stillAnimating) {
            this._playing = false;
            cancelAnimationFrame(this._rafId);
            const btn = document.getElementById('btn-play-' + this.animId);
            if (btn) btn.textContent = '▶ 播放';
        } else {
            this._rafId = requestAnimationFrame(() => this._loop());
        }
    }

    stepForward() {
        // Boost every dim a little and re-snap to target on the active one
        for (let i = 0; i < this.dimCount; i++) {
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
        this._activeAxis = -1;
        this._dragging = -1;
        this.currentScores = [0, 0, 0, 0, 0, 0];
        const btn = document.getElementById('btn-play-' + this.animId);
        if (btn) btn.textContent = '▶ 播放';
        this.canvas.style.cursor = 'default';
        this.draw();
    }

    setSpeed(v) { this.speed = v; }
    play()      { if (!this._playing) this.togglePlay(); }
    pause()     { if (this._playing) this.togglePlay(); }
    step()      { this.stepForward(); }

    // -------- mouse / drag interaction --------
    _canvasPoint(e) {
        const rect = this.canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    _onMouseDown(e) {
        const { x, y } = this._canvasPoint(e);
        const idx = this._hitTestPoint(x, y);
        if (idx >= 0) {
            this._dragging = idx;
            this.canvas.style.cursor = 'grabbing';
            this.draw();
        }
    }

    _onMouseMove(e) {
        const { x, y } = this._canvasPoint(e);

        // Update score from drag
        if (this._dragging >= 0) {
            // Pause any autoplay so the user can edit
            if (this._playing) {
                this._playing = false;
                cancelAnimationFrame(this._rafId);
                const btn = document.getElementById('btn-play-' + this.animId);
                if (btn) btn.textContent = '▶ 播放';
            }
            this._updateScoreFromDrag(this._dragging, x, y);
            this.draw();
            return;
        }

        // Otherwise update hover state
        const idx = this._hitTestPoint(x, y);
        if (idx !== this._hovering) {
            this._hovering = idx;
            this.canvas.style.cursor = idx >= 0 ? 'grab' : 'default';
            this.draw();
        }
    }

    _onMouseUp() {
        if (this._dragging >= 0) {
            this._dragging = -1;
            this.canvas.style.cursor = this._hovering >= 0 ? 'grab' : 'default';
        }
    }

    _onMouseLeave() {
        this._dragging = -1;
        this._hovering = -1;
        this.canvas.style.cursor = 'default';
        this.draw();
    }

    _hitTestPoint(x, y) {
        // First check the dedicated hit-rects around each endpoint
        for (let i = 0; i < this._pointRects.length; i++) {
            const r = this._pointRects[i];
            if (x >= r.x - r.hw && x <= r.x + r.hw &&
                y >= r.y - r.hh && y <= r.y + r.hh) {
                return i;
            }
        }
        return -1;
    }

    _updateScoreFromDrag(idx, x, y) {
        // Project the mouse position onto the axis at index `idx`, then map the
        // projected distance (in [0, maxR]) to a score in [0, 100].
        const { cx, cy, maxR } = this._radarCenter();
        const angle = this._axisAngle(idx);
        const dx = x - cx;
        const dy = y - cy;
        // Vector from center toward mouse
        const proj = dx * Math.cos(angle) + dy * Math.sin(angle);
        // Negative projection: clamp to 0 (user dragged past the center)
        const clamped = Math.max(0, Math.min(maxR, proj));
        this.currentScores[idx] = Math.round((clamped / maxR) * 100);
    }

    // -------- geometry helpers --------
    _radarCenter() {
        // Radar is in the left ~62% of the canvas, vertically centered in the
        // body region (below title, above footer).
        const w = this.width;
        const h = this.height;
        const padX = 16;
        const titleH = 26;
        const footerH = 26;
        const sidebarW = Math.max(150, Math.min(220, w * 0.30));
        const radarAreaW = w - sidebarW - padX * 2 - 12;
        const radarAreaH = h - titleH - footerH - 12;
        const cx = padX + radarAreaW / 2;
        const cy = titleH + radarAreaH / 2 + 4;
        // Leave room for axis labels
        const maxR = Math.max(60, Math.min(radarAreaW, radarAreaH) * 0.40);
        return { cx, cy, maxR, sidebarW, sidebarX: w - sidebarW - padX, sidebarY: titleH, sidebarH: radarAreaH };
    }

    _axisAngle(i) {
        // Top of the chart (12 o'clock) is index 0, then clockwise
        return (i / this.dimCount) * Math.PI * 2 - Math.PI / 2;
    }

    _weightedTotal() {
        let sum = 0, wsum = 0;
        for (let i = 0; i < this.dimCount; i++) {
            sum += this.currentScores[i] * this.dimensions[i].weight;
            wsum += this.dimensions[i].weight;
        }
        return wsum > 0 ? sum / wsum : 0;
    }

    // -------- main draw --------
    draw() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        const dark = this.isDarkTheme();
        const bg = dark ? '#0F172A' : '#F8FAFC';
        const textColor = dark ? '#F1F5F9' : '#0F172A';
        const subColor  = dark ? '#94A3B8' : '#475569';
        const borderCol = dark ? 'rgba(148,163,184,0.25)' : 'rgba(100,116,139,0.25)';
        const panelBg   = dark ? 'rgba(30,41,59,0.6)' : 'rgba(241,245,249,0.85)';

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        const { cx, cy, maxR, sidebarX, sidebarY, sidebarW, sidebarH } = this._radarCenter();

        // ---- Title ----
        ctx.fillStyle = textColor;
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('智能体六维评估雷达图  ·  Draggable Weights', 16, 8);
        // Subtitle hint
        ctx.fillStyle = subColor;
        ctx.font = '10px sans-serif';
        ctx.fillText('拖动任一端点即可调整该维度分数 (0-100)', 16, 8 + 16);

        // ---- Radar (concentric rings, axes, polygon, draggable points) ----
        this._drawRadar(ctx, cx, cy, maxR, textColor, subColor, borderCol, dark);

        // ---- Right sidebar: 6-dim score card ----
        this._drawScoreCard(ctx, sidebarX, sidebarY, sidebarW, sidebarH, textColor, subColor, borderCol, panelBg, dark);

        // ---- Footer status ----
        this._drawFooter(ctx, w, h, subColor, textColor);
    }

    // -------- radar drawing --------
    _drawRadar(ctx, cx, cy, maxR, textColor, subColor, borderCol, dark) {
        // 1) 4 tick rings at 25/50/75/100%
        const ringFractions = [0.25, 0.50, 0.75, 1.00];
        for (const f of ringFractions) {
            const r = maxR * f;
            ctx.beginPath();
            for (let i = 0; i <= this.dimCount; i++) {
                const idx = i % this.dimCount;
                const angle = this._axisAngle(idx);
                const x = cx + r * Math.cos(angle);
                const y = cy + r * Math.sin(angle);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.strokeStyle = borderCol;
            ctx.lineWidth = 1;
            ctx.stroke();

            // small percentage label on the first axis
            ctx.fillStyle = subColor;
            ctx.font = '9px sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            const labelAngle = this._axisAngle(0);
            const lx = cx + r * Math.cos(labelAngle);
            const ly = cy + r * Math.sin(labelAngle);
            ctx.fillText(Math.round(f * 100) + '%', lx + 4, ly);
        }

        // 2) 6 axes
        for (let i = 0; i < this.dimCount; i++) {
            const angle = this._axisAngle(i);
            const ex = cx + maxR * Math.cos(angle);
            const ey = cy + maxR * Math.sin(angle);
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(ex, ey);
            ctx.strokeStyle = borderCol;
            ctx.lineWidth = 1;
            ctx.stroke();

            // Axis-end label
            const labelR = maxR + 18;
            const lx = cx + labelR * Math.cos(angle);
            const ly = cy + labelR * Math.sin(angle);
            ctx.fillStyle = textColor;
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.dimensions[i].name, lx, ly);
        }

        // 3) Filled data polygon (uses current scores)
        const dataColor = '#6366F1';
        const fillColor = dark ? 'rgba(99,102,241,0.28)' : 'rgba(99,102,241,0.18)';
        ctx.beginPath();
        for (let i = 0; i <= this.dimCount; i++) {
            const idx = i % this.dimCount;
            const angle = this._axisAngle(idx);
            const r = maxR * (this.currentScores[idx] / 100);
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.strokeStyle = dataColor;
        ctx.lineWidth = 2.2;
        ctx.stroke();

        // 4) Center disc (just for aesthetics)
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fillStyle = dark ? 'rgba(148,163,184,0.45)' : 'rgba(100,116,139,0.5)';
        ctx.fill();

        // 5) 6 draggable endpoint circles
        this._pointRects = [];
        for (let i = 0; i < this.dimCount; i++) {
            const angle = this._axisAngle(i);
            const r = maxR * (this.currentScores[i] / 100);
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);
            const isHover = i === this._hovering;
            const isDrag  = i === this._dragging;

            // Outer halo on hover/drag
            if (isHover || isDrag) {
                ctx.beginPath();
                ctx.arc(x, y, isDrag ? 13 : 11, 0, Math.PI * 2);
                ctx.fillStyle = this.dimensions[i].color + (isDrag ? '55' : '33');
                ctx.fill();
            }

            // Solid white center with colored stroke (or fully colored if dragging)
            ctx.beginPath();
            ctx.arc(x, y, isDrag ? 7 : 5.5, 0, Math.PI * 2);
            ctx.fillStyle = isDrag ? this.dimensions[i].color : '#FFFFFF';
            ctx.fill();
            ctx.strokeStyle = this.dimensions[i].color;
            ctx.lineWidth = isDrag ? 2.5 : 2;
            ctx.stroke();

            // Score label a little further along the axis
            const labelR2 = r + 14;
            const lx2 = cx + labelR2 * Math.cos(angle);
            const ly2 = cy + labelR2 * Math.sin(angle);
            ctx.fillStyle = this.dimensions[i].color;
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(Math.round(this.currentScores[i]) + '%', lx2, ly2);

            // Save a generous hit rectangle (handles ~12px radius around the point)
            this._pointRects.push({ idx: i, x, y, hw: 14, hh: 14 });
        }

        // 6) Drag helper: while dragging, show a thin guide line along the axis
        if (this._dragging >= 0) {
            const i = this._dragging;
            const angle = this._axisAngle(i);
            ctx.save();
            ctx.strokeStyle = this.dimensions[i].color + '88';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + maxR * Math.cos(angle), cy + maxR * Math.sin(angle));
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        }
    }

    // -------- sidebar / score card --------
    _drawScoreCard(ctx, x, y, w, h, textColor, subColor, borderCol, panelBg, dark) {
        // Panel background
        ctx.fillStyle = panelBg;
        this.roundRect(ctx, x, y, w, h, 10);
        ctx.fill();
        ctx.strokeStyle = borderCol;
        ctx.lineWidth = 1;
        this.roundRect(ctx, x, y, w, h, 10);
        ctx.stroke();

        const padX = 12;
        let cursorY = y + 12;

        // Title
        ctx.fillStyle = textColor;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('📊  评估得分', x + padX, cursorY);
        cursorY += 18;

        // Weighted total — large number
        const total = this._weightedTotal();
        const totalColor = total >= 80 ? '#10B981' : (total >= 60 ? '#F59E0B' : '#EF4444');
        ctx.fillStyle = subColor;
        ctx.font = '10px sans-serif';
        ctx.fillText('当前总分 (加权平均)', x + padX, cursorY);
        cursorY += 14;
        ctx.fillStyle = totalColor;
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText(total.toFixed(1), x + padX, cursorY);
        ctx.fillStyle = subColor;
        ctx.font = '12px sans-serif';
        ctx.fillText('/ 100', x + padX + ctx.measureText(total.toFixed(1)).width + 4, cursorY + 6);
        cursorY += 26;

        // Separator
        ctx.strokeStyle = borderCol;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + padX, cursorY);
        ctx.lineTo(x + w - padX, cursorY);
        ctx.stroke();
        cursorY += 8;

        // 6 dimension rows (name + bar + score)
        const rowH = Math.min(22, (h - (cursorY - y) - 30) / this.dimCount);
        for (let i = 0; i < this.dimCount; i++) {
            this._drawScoreRow(ctx, x + padX, cursorY + i * rowH, w - padX * 2, rowH, i, textColor, subColor, dark);
        }

        // Footer hint inside the panel
        const hintY = y + h - 22;
        ctx.fillStyle = subColor;
        ctx.font = 'italic 9px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('提示: 拖动雷达端点调整权重', x + padX, hintY);
    }

    _drawScoreRow(ctx, x, y, w, h, i, textColor, subColor, dark) {
        const dim = this.dimensions[i];
        const score = this.currentScores[i];
        const target = this.targetScores[i];

        // Layout: name (left) | bar (middle) | score (right)
        const nameW = 56;
        const scoreW = 36;
        const barX = x + nameW + 4;
        const barW = w - nameW - scoreW - 8;
        const barH = 8;
        const barY = y + (h - barH) / 2;

        // Name + small "target" hint
        ctx.fillStyle = textColor;
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(dim.name, x, y + h / 2);

        // Bar background
        ctx.fillStyle = dark ? 'rgba(148,163,184,0.18)' : 'rgba(100,116,139,0.18)';
        this.roundRect(ctx, barX, barY, barW, barH, 4);
        ctx.fill();
        // Bar fill
        const fillW = Math.max(0, Math.min(barW, (score / 100) * barW));
        if (fillW > 0) {
            const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
            grad.addColorStop(0, dim.color);
            grad.addColorStop(1, this._lighten(dim.color, 0.25));
            ctx.fillStyle = grad;
            this.roundRect(ctx, barX, barY, fillW, barH, 4);
            ctx.fill();
        }
        // Target tick (a small mark at the target value)
        const tx = barX + Math.max(0, Math.min(barW, (target / 100) * barW));
        ctx.strokeStyle = dark ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.55)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(tx, barY - 2);
        ctx.lineTo(tx, barY + barH + 2);
        ctx.stroke();

        // Score number
        ctx.fillStyle = dim.color;
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(Math.round(score), x + w, y + h / 2);
    }

    // -------- footer --------
    _drawFooter(ctx, w, h, subColor, textColor) {
        ctx.fillStyle = subColor;
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';

        let statusText;
        if (this._dragging >= 0) {
            statusText = '正在拖动 ' + this.dimensions[this._dragging].name +
                         ' → ' + Math.round(this.currentScores[this._dragging]) + '%';
        } else if (this._hovering >= 0) {
            statusText = '悬停 ' + this.dimensions[this._hovering].name +
                         ' (' + this.dimensions[this._hovering].desc + ')  |  按住拖动调整分数';
        } else {
            statusText = 'BFCL  ·  GAIA  ·  AgentBench  ·  三大评估基准';
        }
        ctx.fillText(statusText, 16, h - 8);
        ctx.textAlign = 'right';
        ctx.fillText('总加权 ' + this._weightedTotal().toFixed(1) + ' / 100', w - 16, h - 8);
        ctx.textAlign = 'left';
    }

    // -------- color helpers --------
    _hexToRgb(hex) {
        if (typeof hex !== 'string' || hex[0] !== '#') return { r: 99, g: 102, b: 241 };
        const m = hex.replace('#', '');
        const n = parseInt(m.length === 3
            ? m.split('').map((c) => c + c).join('')
            : m, 16);
        return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    }

    _lighten(hex, ratio) {
        const { r, g, b } = this._hexToRgb(hex);
        const f = (v) => Math.min(255, Math.round(v + (255 - v) * ratio));
        return `rgb(${f(r)}, ${f(g)}, ${f(b)})`;
    }
}

registerAnimation('ch12-radar', () => new Ch12Radar());

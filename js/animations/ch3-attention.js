/**
 * CH3: Self-Attention Heatmap + "Guess the Next Word" Probability Bars
 *
 * Two-pane visualization for the chapter on LLMs / Transformer / attention.
 *
 *   LEFT  (~46%): 7x7 self-attention heatmap for the sentence
 *                 "The agent learns because it is intelligent"
 *                 - Cells use indigo gradient (darker = stronger attention).
 *                 - Hover highlights the active row + column and shows a
 *                   numeric tooltip "Q -> K  XX%".
 *                 - The currently active token's row is outlined and pulses.
 *
 *   RIGHT (~52%): per-step top-5 probability distribution of the
 *                 next-token prediction ("guess the next word").
 *                 - 5 vertical bars, each with a gradient fill.
 *                 - Chosen (top-1) candidate gets a highlighted outline.
 *
 *   CENTER:  A dashed arrow from the active token in the heatmap to
 *            the column with the highest non-self weight
 *            (e.g. "it" -> "agent" for pronoun resolution).
 *            A second arrow links the heatmap row to the bar-chart panel.
 *
 * Controls (bound by id):
 *   btn-play-ch3-attention      toggle play / pause
 *   btn-step-ch3-attention      advance to next token
 *   btn-reset-ch3-attention     rewind to the first token
 *   speed-ch3-attention         playback speed multiplier
 */
import { CanvasAnimation } from './canvas-animation.js';
import { registerAnimation } from './animation-registry.js';

class Ch3Attention extends CanvasAnimation {
    constructor() {
        super();
        this.speed = 1;
        this._playing = false;
        this._rafId = null;
        this._lastTick = 0;
        this._holdTime = 0;
        this._holdDuration = 1600; // ms per token during auto-play
        this._animPhase = 0;

        this._activeIdx = 0;   // currently highlighted source token (0..6)
        this._hoverCol = -1;   // heatmap column under cursor (-1 = none)
        this._hoverRow = -1;   // heatmap row under cursor (-1 = none)
    }

    /* ----------------------------------------------------------------
     *  Data
     * -------------------------------------------------------------- */

    get sentence() {
        return ['The', 'agent', 'learns', 'because', 'it', 'is', 'intelligent'];
    }

    /**
     * 7x7 deterministic attention weights.
     * Row = from-token (Query), col = to-token (Key).
     * Notable patterns:
     *   - diagonal is high (self-attention)
     *   - "it" (idx 4) attends strongly to "agent" (idx 1) -> pronoun resolution
     *   - "learns" (idx 2) attends strongly to "agent" (idx 1) -> subject
     *   - "intelligent" (idx 6) attends to "it" (idx 4) -> anaphora
     */
    get attentionMatrix() {
        return [
            // to:  The   agent learns because it   is  intelligent
            /* from The        */ [0.42, 0.18, 0.08, 0.05, 0.12, 0.10, 0.05],
            /* from agent      */ [0.28, 0.34, 0.20, 0.05, 0.05, 0.05, 0.03],
            /* from learns     */ [0.05, 0.42, 0.30, 0.10, 0.06, 0.04, 0.03],
            /* from because    */ [0.04, 0.06, 0.22, 0.34, 0.16, 0.08, 0.10],
            /* from it         */ [0.04, 0.72, 0.06, 0.05, 0.10, 0.02, 0.01],
            /* from is         */ [0.05, 0.10, 0.05, 0.05, 0.45, 0.25, 0.05],
            /* from intelligent*/ [0.04, 0.20, 0.06, 0.10, 0.30, 0.05, 0.25]
        ];
    }

    /**
     * For each source token i, the top-5 candidate next words with
     * probabilities. Models the "guess the next word" intuition:
     * given tokens 0..i, the LLM assigns probability mass to tokens i+1..
     */
    get predictions() {
        return [
            // 0: input "The" -> guess "agent"
            { top: [
                { word: 'agent',   prob: 0.62 },
                { word: 'AI',      prob: 0.18 },
                { word: 'system',  prob: 0.09 },
                { word: 'cat',     prob: 0.06 },
                { word: 'future',  prob: 0.05 }
            ], chosenIdx: 0 },
            // 1: input "...agent" -> guess "learns"
            { top: [
                { word: 'learns',  prob: 0.55 },
                { word: 'can',     prob: 0.20 },
                { word: 'is',      prob: 0.12 },
                { word: 'has',     prob: 0.07 },
                { word: 'will',    prob: 0.06 }
            ], chosenIdx: 0 },
            // 2: input "...learns" -> guess "because"
            { top: [
                { word: 'because', prob: 0.41 },
                { word: 'to',      prob: 0.24 },
                { word: 'how',     prob: 0.18 },
                { word: 'from',    prob: 0.10 },
                { word: 'and',     prob: 0.07 }
            ], chosenIdx: 0 },
            // 3: input "...because" -> guess "it"
            { top: [
                { word: 'it',      prob: 0.58 },
                { word: 'the',     prob: 0.18 },
                { word: 'they',    prob: 0.12 },
                { word: 'this',    prob: 0.07 },
                { word: 'we',      prob: 0.05 }
            ], chosenIdx: 0 },
            // 4: input "...it" -> guess "is"
            { top: [
                { word: 'is',      prob: 0.68 },
                { word: 'was',     prob: 0.14 },
                { word: 'can',     prob: 0.08 },
                { word: 'has',     prob: 0.05 },
                { word: 'will',    prob: 0.05 }
            ], chosenIdx: 0 },
            // 5: input "...is" -> guess "intelligent"
            { top: [
                { word: 'intelligent', prob: 0.45 },
                { word: 'a',           prob: 0.22 },
                { word: 'very',        prob: 0.15 },
                { word: 'really',      prob: 0.10 },
                { word: 'quite',       prob: 0.08 }
            ], chosenIdx: 0 },
            // 6: input "...intelligent" -> guess "<eos>"
            { top: [
                { word: '<eos>',  prob: 0.52 },
                { word: 'and',    prob: 0.18 },
                { word: '.',      prob: 0.16 },
                { word: '!',      prob: 0.08 },
                { word: '?',      prob: 0.06 }
            ], chosenIdx: 0 }
        ];
    }

    /* ----------------------------------------------------------------
     *  Lifecycle
     * -------------------------------------------------------------- */

    init(canvas) {
        super.init(canvas);
        this._setupCanvasEvents();
        this._setupControls();
        window.addEventListener('resize', () => { this._resize(); this.draw(); });
        this.draw();
    }

    _setupCanvasEvents() {
        if (!this.canvas) return;
        this.canvas.addEventListener('mousemove', (e) => this._handleHover(e));
        this.canvas.addEventListener('mouseleave', () => {
            this._hoverCol = -1;
            this._hoverRow = -1;
            this.canvas.style.cursor = 'default';
            this.draw();
        });
        this.canvas.addEventListener('click', (e) => this._handleClick(e));
    }

    _setupControls() {
        const animId = 'ch3-attention';
        const playBtn  = document.getElementById('btn-play-' + animId);
        const stepBtn  = document.getElementById('btn-step-' + animId);
        const resetBtn = document.getElementById('btn-reset-' + animId);
        const speedEl  = document.getElementById('speed-' + animId);
        if (playBtn)  playBtn.addEventListener('click', () => this.togglePlay());
        if (stepBtn)  stepBtn.addEventListener('click', () => this.stepForward());
        if (resetBtn) resetBtn.addEventListener('click', () => this.reset());
        if (speedEl)  speedEl.addEventListener('input', (e) => {
            this.speed = parseFloat(e.target.value) || 1;
        });
    }

    /* ----------------------------------------------------------------
     *  Playback
     * -------------------------------------------------------------- */

    togglePlay() {
        if (this._playing) this.pause();
        else this.play();
    }

    play() {
        if (this._activeIdx >= this.sentence.length - 1) {
            this._activeIdx = 0;
            this._holdTime = 0;
        }
        this._playing = true;
        this._lastTick = performance.now();
        const btn = document.getElementById('btn-play-ch3-attention');
        if (btn) btn.textContent = '暂停';
        this._loop();
    }

    pause() {
        this._playing = false;
        if (this._rafId) cancelAnimationFrame(this._rafId);
        this._rafId = null;
        const btn = document.getElementById('btn-play-ch3-attention');
        if (btn) btn.textContent = '播放';
    }

    _loop() {
        if (!this._playing) return;
        const now = performance.now();
        const dt = now - this._lastTick;
        this._lastTick = now;
        this._holdTime += dt * (this.speed || 1);
        this._animPhase = (this._animPhase + dt * 0.0008) % 1;
        if (this._holdTime >= this._holdDuration) {
            this._holdTime = 0;
            if (this._activeIdx < this.sentence.length - 1) {
                this._activeIdx++;
            } else {
                this.pause();
            }
        }
        this.draw();
        if (this._playing) {
            this._rafId = requestAnimationFrame(() => this._loop());
        }
    }

    stepForward() {
        this.pause();
        if (this._activeIdx < this.sentence.length - 1) this._activeIdx++;
        this._holdTime = 0;
        this.draw();
    }

    reset() {
        this.pause();
        this._activeIdx = 0;
        this._holdTime = 0;
        this._animPhase = 0;
        this.draw();
    }

    setSpeed(v) { this.speed = v; }
    step() { this.stepForward(); }

    /* ----------------------------------------------------------------
     *  Layout
     * -------------------------------------------------------------- */

    _layout() {
        const w = this.width;
        const h = this.height;
        const n = this.sentence.length;
        const padX = Math.max(16, w * 0.02);
        const topY = 56;             // below title + subtitle
        const bottomY = h - 30;      // above hint

        // Heatmap area: left ~46%
        const heatX = padX;
        const heatW = Math.min(w * 0.46 - padX, 360);
        const heatSize = heatW;
        const cellGap = 2;
        const cellSize = Math.floor((heatSize - (n - 1) * cellGap) / n);
        const heatGridX = heatX + 30; // room for row labels
        const heatGridY = topY + 28;  // room for column labels

        // Bar chart area: right ~50%
        const barX = w * 0.54;
        const barW = w - barX - padX;
        const barY = topY + 14;
        const barH = bottomY - barY - 8;

        return {
            heatX, heatW, heatSize, cellSize, cellGap,
            heatGridX, heatGridY,
            barX, barW, barY, barH,
            n, topY, bottomY, padX
        };
    }

    /* ----------------------------------------------------------------
     *  Interaction
     * -------------------------------------------------------------- */

    _hitTestGrid(mx, my) {
        const L = this._layout();
        const n = L.n;
        const gridX0 = L.heatGridX;
        const gridY0 = L.heatGridY;
        const step = L.cellSize + L.cellGap;
        if (my < gridY0 || my > gridY0 + n * step) return null;
        const col = Math.floor((mx - gridX0) / step);
        const row = Math.floor((my - gridY0) / step);
        if (col < 0 || col >= n || row < 0 || row >= n) return null;
        // Make sure we hit inside a cell, not in a gap
        const localX = (mx - gridX0) - col * step;
        const localY = (my - gridY0) - row * step;
        if (localX > L.cellSize || localY > L.cellSize) return null;
        return { row, col };
    }

    _handleHover(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const hit = this._hitTestGrid(mx, my);
        const col = hit ? hit.col : -1;
        const row = hit ? hit.row : -1;
        if (col !== this._hoverCol || row !== this._hoverRow) {
            this._hoverCol = col;
            this._hoverRow = row;
            this.canvas.style.cursor = (col >= 0) ? 'pointer' : 'default';
            this.draw();
        }
    }

    _handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const hit = this._hitTestGrid(mx, my);
        if (hit) {
            this._activeIdx = hit.row;
            this.draw();
        }
    }

    /* ----------------------------------------------------------------
     *  Color helpers
     * -------------------------------------------------------------- */

    /** Heatmap cell color: indigo gradient (light -> deep). */
    _heatColor(v, dark) {
        const t = Math.max(0, Math.min(1, v));
        if (dark) {
            const r = Math.round(30 + t * 70);
            const g = Math.round(40 + t * 70);
            const b = Math.round(90 + t * 165);
            return `rgba(${r}, ${g}, ${b}, ${0.35 + t * 0.6})`;
        }
        const r = Math.round(225 - t * 175);
        const g = Math.round(230 - t * 160);
        const b = Math.round(245 - t * 30);
        return `rgba(${r}, ${g}, ${b}, ${0.4 + t * 0.55})`;
    }

    /** Bar chart bar color: violet -> indigo gradient stops. */
    _barColor(t, dark) {
        if (dark) {
            const r = Math.round(99 + t * 60);
            const g = Math.round(102 + t * 50);
            const b = Math.round(241 - t * 50);
            return `rgb(${r}, ${g}, ${b})`;
        }
        const r = Math.round(124 - t * 30);
        const g = Math.round(58 + t * 30);
        const b = Math.round(237 - t * 50);
        return `rgb(${r}, ${g}, ${b})`;
    }

    /* ----------------------------------------------------------------
     *  Drawing
     * -------------------------------------------------------------- */

    draw() {
        const ctx = this.ctx, w = this.width, h = this.height;
        const dark = this.isDarkTheme();
        const bg = dark ? '#0F172A' : '#F8FAFC';
        const textColor = dark ? '#F1F5F9' : '#0F172A';
        const subColor = dark ? '#94A3B8' : '#475569';
        const cardBg = dark ? '#1E293B' : '#FFFFFF';
        const border = dark ? '#334155' : '#E2E8F0';
        const highlight = dark ? '#A78BFA' : '#7C3AED';
        const gridLine = dark ? 'rgba(148,163,184,0.18)' : 'rgba(100,116,139,0.18)';

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        // Title
        ctx.fillStyle = textColor;
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('自注意力 + “猜下一个字”', 16, 10);

        // Subtitle
        ctx.fillStyle = subColor;
        ctx.font = '11px sans-serif';
        ctx.fillText('左侧：每个 token 在注意谁   ·   右侧：模型对下一个 token 的概率分布', 16, 30);

        const L = this._layout();
        const n = L.n;
        const A = this.attentionMatrix;
        const P = this.predictions[this._activeIdx];
        const pulse = 0.5 + 0.5 * Math.sin(this._animPhase * Math.PI * 2);

        /* -------------------- LEFT: heatmap -------------------- */
        // Panel background
        ctx.fillStyle = cardBg;
        this.roundRect(ctx, L.heatX, L.topY - 8, L.heatW + 40, L.heatSize + 60, 10);
        ctx.fill();
        ctx.strokeStyle = border;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Panel heading
        ctx.fillStyle = textColor;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('自注意力热图 (Query → Key)', L.heatX + 8, L.topY - 4);

        // Column labels (top): Key tokens
        ctx.fillStyle = subColor;
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        for (let i = 0; i < n; i++) {
            const cx = L.heatGridX + i * (L.cellSize + L.cellGap) + L.cellSize / 2;
            ctx.fillText(this.sentence[i], cx, L.heatGridY - 4);
        }

        // Cells + row labels
        for (let row = 0; row < n; row++) {
            for (let col = 0; col < n; col++) {
                const cx = L.heatGridX + col * (L.cellSize + L.cellGap);
                const cy = L.heatGridY + row * (L.cellSize + L.cellGap);
                let v = A[row][col];

                // Hover: emphasise the hovered row/column, dim the rest
                if (this._hoverCol >= 0) {
                    if (row === this._hoverRow || col === this._hoverCol) {
                        v = Math.min(1, v * 1.25);
                    } else {
                        v = v * 0.55;
                    }
                }

                // Active row gets a subtle pulse on the diagonal & self
                if (row === this._activeIdx && this._hoverCol < 0) {
                    v = Math.min(1, v * (1.0 + 0.18 * pulse));
                }

                // Per-cell linear gradient (light at top -> deep at bottom)
                const grad = ctx.createLinearGradient(cx, cy, cx, cy + L.cellSize);
                grad.addColorStop(0, this._heatColor(Math.min(1, v * 1.05), dark));
                grad.addColorStop(1, this._heatColor(v * 0.85, dark));
                ctx.fillStyle = grad;
                this.roundRect(ctx, cx, cy, L.cellSize, L.cellSize, 3);
                ctx.fill();

                // Outline
                if (row === this._activeIdx && col !== this._hoverCol && this._hoverCol < 0) {
                    ctx.strokeStyle = highlight;
                    ctx.lineWidth = 1.6;
                } else if (this._hoverCol >= 0 && (row === this._hoverRow || col === this._hoverCol)) {
                    ctx.strokeStyle = highlight;
                    ctx.lineWidth = 1.6;
                } else {
                    ctx.strokeStyle = border;
                    ctx.lineWidth = 0.5;
                }
                ctx.stroke();

                // Value text in cell
                if (L.cellSize >= 26) {
                    ctx.fillStyle = (v > 0.45) ? '#FFFFFF' : textColor;
                    ctx.font = '9px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText((v * 100).toFixed(0), cx + L.cellSize / 2, cy + L.cellSize / 2 + 1);
                }
            }

            // Row label (left): Query token
            const ly = L.heatGridY + row * (L.cellSize + L.cellGap) + L.cellSize / 2;
            const isActive = (row === this._activeIdx);
            const isHovered = (row === this._hoverRow);
            ctx.fillStyle = isActive ? highlight : (isHovered ? textColor : subColor);
            ctx.font = (isActive ? 'bold ' : '') + '10px sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.sentence[row], L.heatGridX - 6, ly);
        }

        // Top-K "attends to" arrow: from active row -> argmax non-self column
        const row = this._activeIdx;
        let bestJ = -1, bestV = -1;
        for (let j = 0; j < n; j++) {
            if (j === row) continue;
            if (A[row][j] > bestV) { bestV = A[row][j]; bestJ = j; }
        }
        if (bestJ >= 0) {
            const fromX = L.heatGridX + (n - 1) * (L.cellSize + L.cellGap) + L.cellSize + 14;
            const fromY = L.heatGridY + row * (L.cellSize + L.cellGap) + L.cellSize / 2;
            const toX = L.heatGridX + bestJ * (L.cellSize + L.cellGap) + L.cellSize / 2;
            const toY = L.heatGridY + bestJ * (L.cellSize + L.cellGap) + L.cellSize / 2;
            const ctrlY = Math.min(fromY, toY) - 28;
            const ctrlX = (fromX + toX) / 2;
            ctx.strokeStyle = highlight;
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 3]);
            ctx.beginPath();
            ctx.moveTo(fromX, fromY);
            ctx.quadraticCurveTo(ctrlX, ctrlY, toX, toY);
            ctx.stroke();
            ctx.setLineDash([]);
            // arrow head at "to"
            const ang = Math.atan2(toY - ctrlY, toX - ctrlX);
            ctx.beginPath();
            ctx.moveTo(toX, toY);
            ctx.lineTo(toX - 7 * Math.cos(ang - 0.4), toY - 7 * Math.sin(ang - 0.4));
            ctx.lineTo(toX - 7 * Math.cos(ang + 0.4), toY - 7 * Math.sin(ang + 0.4));
            ctx.closePath();
            ctx.fillStyle = highlight;
            ctx.fill();
            // label on curve
            ctx.fillStyle = highlight;
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(
                `"${this.sentence[row]}" 关注 → "${this.sentence[bestJ]}"  (${(bestV * 100).toFixed(0)}%)`,
                ctrlX, ctrlY - 4
            );
        }

        // Hover tooltip on cell
        if (this._hoverRow >= 0 && this._hoverCol >= 0) {
            const v = A[this._hoverRow][this._hoverCol];
            const tipX = L.heatGridX + this._hoverCol * (L.cellSize + L.cellGap) + L.cellSize / 2;
            const tipY = L.heatGridY + this._hoverRow * (L.cellSize + L.cellGap) - 18;
            const label = `"${this.sentence[this._hoverRow]}" → "${this.sentence[this._hoverCol]}"  ${(v * 100).toFixed(0)}%`;
            ctx.font = '10px sans-serif';
            const tw = ctx.measureText(label).width;
            const boxX = Math.min(w - tw - 16, Math.max(8, tipX - tw / 2 - 6));
            ctx.fillStyle = dark ? '#0B1220' : '#0F172A';
            this.roundRect(ctx, boxX, tipY - 4, tw + 12, 18, 4);
            ctx.fill();
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, boxX + 6, tipY + 4);
        }

        /* -------------------- RIGHT: bar chart -------------------- */
        // Panel background
        ctx.fillStyle = cardBg;
        this.roundRect(ctx, L.barX - 8, L.barY - 8, L.barW + 16, L.barH + 18, 10);
        ctx.fill();
        ctx.strokeStyle = border;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Panel heading
        ctx.fillStyle = textColor;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(
            `“${this.sentence[this._activeIdx]}” 之后 → 概率分布 (top-5)`,
            L.barX, L.barY - 4
        );

        // Bar geometry
        const innerX = L.barX + 70;     // room for word labels
        const innerW = L.barW - 100;    // room for % labels
        const innerY = L.barY + 22;
        const innerH = L.barH - 50;
        const top5 = P.top;
        const slotW = innerW / top5.length;

        // Gridlines
        ctx.strokeStyle = gridLine;
        ctx.lineWidth = 1;
        for (let g = 0; g <= 4; g++) {
            const gy = innerY + (innerH / 4) * g;
            ctx.beginPath();
            ctx.moveTo(innerX, gy);
            ctx.lineTo(innerX + innerW, gy);
            ctx.stroke();
        }
        // Y-axis ticks (0%, 25%, 50%, 75%, 100%)
        ctx.fillStyle = subColor;
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        for (let g = 0; g <= 4; g++) {
            const gy = innerY + (innerH / 4) * (4 - g);
            ctx.fillText((g * 25) + '%', innerX - 4, gy);
        }

        // Bars
        for (let i = 0; i < top5.length; i++) {
            const cand = top5[i];
            const v = Math.max(0, Math.min(1, cand.prob));
            const barHeight = innerH * v;
            const bx = innerX + i * slotW + slotW * 0.18;
            const bw = slotW * 0.64;
            const by = innerY + innerH - barHeight;
            // gradient fill (top -> bottom)
            const grad = ctx.createLinearGradient(0, by, 0, by + barHeight);
            grad.addColorStop(0, this._barColor(1.0, dark));
            grad.addColorStop(1, this._barColor(0.35, dark));
            ctx.fillStyle = grad;
            this.roundRect(ctx, bx, by, bw, barHeight, 4);
            ctx.fill();
            // outline: chosen = highlight, others = border
            if (i === P.chosenIdx) {
                ctx.strokeStyle = highlight;
                ctx.lineWidth = 2;
            } else {
                ctx.strokeStyle = border;
                ctx.lineWidth = 0.5;
            }
            ctx.stroke();
            // % label above
            ctx.fillStyle = textColor;
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText((v * 100).toFixed(0) + '%', bx + bw / 2, by - 2);
            // word label below
            const label = cand.word.length > 9 ? cand.word.slice(0, 8) + '…' : cand.word;
            ctx.fillStyle = (i === P.chosenIdx) ? highlight : subColor;
            ctx.font = (i === P.chosenIdx ? 'bold ' : '') + '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(label, bx + bw / 2, innerY + innerH + 4);
        }

        /* -------------------- Bridge arrow -------------------- */
        const srcX = L.heatGridX + n * (L.cellSize + L.cellGap) + 6;
        const srcY = L.heatGridY + this._activeIdx * (L.cellSize + L.cellGap) + L.cellSize / 2;
        const dstX = L.barX - 12;
        const dstY = L.barY + L.barH / 2 - 4;
        ctx.strokeStyle = highlight;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(srcX, srcY);
        ctx.lineTo(dstX, dstY);
        ctx.stroke();
        // arrow head
        ctx.beginPath();
        ctx.moveTo(dstX, dstY);
        ctx.lineTo(dstX - 6, dstY - 4);
        ctx.lineTo(dstX - 6, dstY + 4);
        ctx.closePath();
        ctx.fillStyle = highlight;
        ctx.fill();

        /* -------------------- Bottom hint -------------------- */
        ctx.fillStyle = subColor;
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(
            '点击热图行切换当前 token   ·   播放：模型从左到右逐 token 预测下一个字   ·   悬停查看 Q→K 数值',
            w / 2, h - 10
        );
    }
}

registerAnimation('ch3-attention', () => new Ch3Attention());

/**
 * CH11: Agentic RL — SFT → RLHF → GRPO Pipeline + Reward Feedback Loop
 * Top half: three-stage training pipeline (SFT / RLHF / GRPO)
 * Bottom half: reward feedback loop (Agent center + 4 nodes around, clockwise flow)
 * Hover a stage card to see training details (data / loss / hyperparams).
 */
import { CanvasAnimation } from './canvas-animation.js';
import { registerAnimation } from './animation-registry.js';

class Ch11RL extends CanvasAnimation {
    constructor() {
        super();
        this.animId = 'ch11-rl-feedback';

        // Animation state
        this.activeStage = 0;        // 0=SFT, 1=RLHF, 2=GRPO
        this.stages = 3;
        this._playing = false;
        this._rafId = null;
        this.speed = 1;

        // Particle that flows around the reward loop
        this.particleT = 0;          // 0..1 progress around the loop
        this.pulse = 0;              // sin() based visual pulse

        // Hover state for tooltip
        this.hoveredStage = -1;

        // ----- Pipeline stages (top half) -----
        this.stageDefs = [
            {
                key: 'SFT',
                name: 'SFT 监督微调',
                desc: '看示范学格式',
                formula: 'L = -Σ log P(yₜ | x, y<ₜ)',
                accent: '#3B82F6',
                details: [
                    ['输入数据', '标注样本 (prompt + completion)'],
                    ['训练方式', '最大似然 / 交叉熵'],
                    ['代表工具', 'TRL · SFTTrainer'],
                    ['数据规模', '100 ~ 10k 条即可起跑'],
                    ['产出', '具备格式基础的 π_ref']
                ]
            },
            {
                key: 'RLHF',
                name: 'RLHF 人类反馈',
                desc: '奖励模型 + PPO 闭环',
                formula: 'L = -E[ A·log π(a|s) ]',
                accent: '#8B5CF6',
                details: [
                    ['输入数据', '人类偏好对 (y_a > y_b)'],
                    ['训练方式', 'Reward Model → PPO'],
                    ['代表工具', 'TRL · PPOTrainer'],
                    ['关键超参', 'lr=1e-5 · kl_coef=0.1'],
                    ['产出', '与人类偏好对齐的 π_θ']
                ]
            },
            {
                key: 'GRPO',
                name: 'GRPO 组相对优化',
                desc: '无 Critic，省显存',
                formula: 'Aᵢ = (rᵢ - mean) / std',
                accent: '#EC4899',
                details: [
                    ['输入数据', '可验证答案 (数学 / 代码)'],
                    ['训练方式', '同组内相对优势'],
                    ['代表工具', 'TRL · GRPOTrainer'],
                    ['关键超参', 'group_size=4 · kl_coef=0.04'],
                    ['产出', '强推理、低显存 π_θ']
                ]
            }
        ];

        // ----- Reward feedback loop (bottom half) -----
        // 4 nodes around the agent. Order matters — the particle travels
        // through them in this exact order (clockwise).
        this.loopNodes = [
            { key: 'Action',     cn: '动作 aₜ',   detail: 'Policy πθ 选出的下一步行为', color: '#10B981' },
            { key: 'Environment',cn: '环境 Env',   detail: '状态转移 s → s′, 给 reward',    color: '#3B82F6' },
            { key: 'Reward',     cn: '奖励 rₜ',    detail: '0/1 准确率 + 长度/步骤奖励',     color: '#F59E0B' },
            { key: 'NextState',  cn: '下一态 s′',  detail: '新观测, 回到策略, 闭环',        color: '#8B5CF6' }
        ];

        // Cached hit areas (recomputed in draw())
        this._stageRects = [];
        this._loopNodeRects = [];
        this._tooltip = null;
    }

    init(canvas) {
        super.init(canvas);
        this._setupControls();
        this._bindHover();
        window.addEventListener('resize', () => { this._resize(); this.draw(); });
        this.draw();
    }

    // -------- controls --------
    _setupControls() {
        const playBtn = document.getElementById('btn-play-' + this.animId);
        const resetBtn = document.getElementById('btn-reset-' + this.animId);
        const stepBtn = document.getElementById('btn-step-' + this.animId);
        const speedSlider = document.getElementById('speed-' + this.animId);

        if (playBtn) playBtn.addEventListener('click', () => this.togglePlay());
        if (resetBtn) resetBtn.addEventListener('click', () => this.reset());
        if (stepBtn) stepBtn.addEventListener('click', () => this.stepForward());
        if (speedSlider) speedSlider.addEventListener('input', (e) => {
            this.speed = parseFloat(e.target.value) || 1;
        });
    }

    _bindHover() {
        this.canvas.addEventListener('mousemove', (e) => this._onMouseMove(e));
        this.canvas.addEventListener('mouseleave', () => {
            this.hoveredStage = -1;
            this._tooltip = null;
            this.draw();
        });
    }

    _onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Stage card hover
        let newHover = -1;
        for (let i = 0; i < this._stageRects.length; i++) {
            const r = this._stageRects[i];
            if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
                newHover = i;
                break;
            }
        }

        if (newHover !== this.hoveredStage) {
            this.hoveredStage = newHover;
            this.draw();
        }

        if (this.hoveredStage >= 0) {
            this._tooltip = { x, y, stage: this.hoveredStage };
        } else {
            this._tooltip = null;
        }
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
        const btn = document.getElementById('btn-play-' + this.animId);
        if (btn) btn.textContent = '⏸ 暂停';
        this._loop();
    }

    _loop() {
        if (!this._playing) return;
        // Particle advances around the loop
        this.particleT = (this.particleT + 0.0045 * (this.speed || 1)) % 1;
        this.pulse = (this.pulse + 0.06 * (this.speed || 1)) % (Math.PI * 2);
        this.draw();
        this._rafId = requestAnimationFrame(() => this._loop());
    }

    stepForward() {
        this.activeStage = (this.activeStage + 1) % this.stages;
        this.particleT = 0;
        this.draw();
    }

    reset() {
        this._playing = false;
        cancelAnimationFrame(this._rafId);
        this.activeStage = 0;
        this.particleT = 0;
        this.pulse = 0;
        this.hoveredStage = -1;
        this._tooltip = null;
        const btn = document.getElementById('btn-play-' + this.animId);
        if (btn) btn.textContent = '▶ 播放';
        this.draw();
    }

    setSpeed(v) { this.speed = v; }
    play() { if (!this._playing) this.togglePlay(); }
    pause() { if (this._playing) this.togglePlay(); }
    step() { this.stepForward(); }

    // -------- main draw --------
    draw() {
        const ctx = this.ctx, w = this.width, h = this.height;
        const dark = this.isDarkTheme();
        const bg = dark ? '#0F172A' : '#F8FAFC';
        const textColor = dark ? '#F1F5F9' : '#0F172A';
        const subColor = dark ? '#94A3B8' : '#475569';
        const borderColor = dark ? 'rgba(148,163,184,0.25)' : 'rgba(100,116,139,0.25)';
        const panelBg = dark ? 'rgba(30,41,59,0.6)' : 'rgba(241,245,249,0.85)';

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        // Layout regions
        const padX = 14;
        const titleH = 22;
        const pipelineTop = titleH + 4;
        const pipelineH = 150;
        const gap = 10;
        const loopTop = pipelineTop + pipelineH + gap;
        const loopBottom = h - 26; // leave room for footer
        const loopH = loopBottom - loopTop;

        // Title
        ctx.fillStyle = textColor;
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('Agentic-RL 训练流程: SFT → RLHF → GRPO + 奖励反馈环', padX, 4);

        // ===== TOP: 3-stage pipeline =====
        this._drawPipeline(ctx, padX, pipelineTop, w - padX * 2, pipelineH,
                           textColor, subColor, borderColor, panelBg, dark);

        // ===== BOTTOM: reward feedback loop =====
        this._drawLoop(ctx, padX, loopTop, w - padX * 2, loopH,
                       textColor, subColor, borderColor, panelBg, dark);

        // ===== FOOTER =====
        ctx.fillStyle = subColor;
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        const stage = this.stageDefs[this.activeStage];
        ctx.fillText(
            `阶段 ${this.activeStage + 1}/${this.stages}: ${stage.key} · ${stage.desc}  |  粒子位置 ${(this.particleT * 100).toFixed(0)}%  |  提示: 鼠标悬停阶段卡查看细节`,
            padX,
            h - 6
        );
        ctx.textAlign = 'right';
        ctx.fillText(stage.formula, w - padX, h - 6);
        ctx.textAlign = 'left';

        // ===== TOOLTIP (drawn last so it sits on top) =====
        if (this.hoveredStage >= 0 && this.hoveredStage < this.stageDefs.length) {
            this._drawTooltip(ctx, w, h, textColor, subColor, panelBg, dark);
        }
    }

    _drawTooltip(ctx, w, h, textColor, subColor, panelBg, dark) {
        const def = this.stageDefs[this.hoveredStage];
        const lines = [
            { t: def.key + ' · ' + def.name, bold: true, color: def.accent },
            { t: def.desc, bold: false, color: textColor }
        ];
        def.details.forEach(([k, v]) => {
            lines.push({ t: k + ': ' + v, bold: false, color: dark ? '#E2E8F0' : '#1E293B' });
        });

        ctx.font = '11px sans-serif';
        const lineH = 14;
        const padX = 10;
        const padY = 8;
        let maxW = 0;
        lines.forEach((l) => {
            ctx.font = l.bold ? 'bold 12px sans-serif' : '11px sans-serif';
            const tw = ctx.measureText(l.t).width;
            if (tw > maxW) maxW = tw;
        });
        const boxW = Math.min(280, maxW + padX * 2);
        const boxH = lines.length * lineH + padY * 2;

        // Anchor near mouse, but keep within canvas
        let tx = (this._tooltip?.x || 0) + 12;
        let ty = (this._tooltip?.y || 0) + 12;
        if (tx + boxW > w - 4) tx = w - boxW - 4;
        if (ty + boxH > h - 4) ty = h - boxH - 4;
        if (tx < 4) tx = 4;
        if (ty < 4) ty = 4;

        // background
        ctx.fillStyle = dark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.98)';
        this.roundRect(ctx, tx, ty, boxW, boxH, 6);
        ctx.fill();
        ctx.strokeStyle = def.accent;
        ctx.lineWidth = 1.5;
        this.roundRect(ctx, tx, ty, boxW, boxH, 6);
        ctx.stroke();

        // text
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        lines.forEach((l, i) => {
            ctx.font = l.bold ? 'bold 12px sans-serif' : '11px sans-serif';
            ctx.fillStyle = l.color;
            ctx.fillText(l.t, tx + padX, ty + padY + i * lineH);
        });
    }

    // ----- pipeline drawing -----
    _drawPipeline(ctx, x, y, w, h, textColor, subColor, borderColor, panelBg, dark) {
        // 3 stage cards
        const cardCount = 3;
        const arrowW = 28; // horizontal space reserved for arrows between cards
        const cardGap = arrowW;
        const totalArrowW = (cardCount - 1) * cardGap;
        const cardW = (w - totalArrowW) / cardCount;
        const cardH = h - 4;

        this._stageRects = [];

        for (let i = 0; i < cardCount; i++) {
            const def = this.stageDefs[i];
            const cx = x + i * (cardW + cardGap);
            const cy = y + 2;
            this._stageRects.push({ idx: i, x: cx, y: cy, w: cardW, h: cardH });

            const isActive = i === this.activeStage;
            const isHover = i === this.hoveredStage;
            const baseAlpha = isActive ? 1 : (isHover ? 0.95 : 0.78);

            // Card background
            const grad = ctx.createLinearGradient(cx, cy, cx, cy + cardH);
            if (dark) {
                grad.addColorStop(0, `rgba(51,65,85,${0.85 * baseAlpha})`);
                grad.addColorStop(1, `rgba(30,41,59,${0.85 * baseAlpha})`);
            } else {
                grad.addColorStop(0, `rgba(255,255,255,${0.95 * baseAlpha})`);
                grad.addColorStop(1, `rgba(241,245,249,${0.95 * baseAlpha})`);
            }
            ctx.fillStyle = grad;
            this.roundRect(ctx, cx, cy, cardW, cardH, 10);
            ctx.fill();

            // Accent stripe on the left (clipped rectangle, single-radius is fine
            // because the parent card rounds the same way; the inner stripe uses
            // the card's own r for visual consistency).
            ctx.save();
            ctx.beginPath();
            this.roundRect(ctx, cx, cy, cardW, cardH, 10);
            ctx.clip();
            ctx.fillStyle = def.accent;
            ctx.fillRect(cx, cy, 5, cardH);
            ctx.restore();

            // Card border
            ctx.strokeStyle = isActive ? def.accent : borderColor;
            ctx.lineWidth = isActive ? 2 : 1;
            this.roundRect(ctx, cx, cy, cardW, cardH, 10);
            ctx.stroke();

            // Active glow
            if (isActive) {
                ctx.save();
                ctx.shadowColor = def.accent;
                ctx.shadowBlur = 14;
                this.roundRect(ctx, cx, cy, cardW, cardH, 10);
                ctx.stroke();
                ctx.restore();
            }

            // Header row: stage badge + key
            const padInner = 12;
            const badgeY = cy + 8;
            const badgeR = 11;
            const badgeX = cx + padInner + badgeR;
            // badge dot
            ctx.beginPath();
            ctx.arc(badgeX, badgeY + badgeR, badgeR, 0, Math.PI * 2);
            ctx.fillStyle = def.accent;
            ctx.fill();
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(i + 1), badgeX, badgeY + badgeR);

            // Stage key (right of badge)
            ctx.fillStyle = def.accent;
            ctx.font = 'bold 13px sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(def.key, badgeX + badgeR + 6, badgeY + badgeR);

            // Name
            ctx.fillStyle = textColor;
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText(def.name, cx + padInner, cy + 36);

            // Description
            ctx.fillStyle = subColor;
            ctx.font = '11px sans-serif';
            const descLines = this.wrapText(ctx, def.desc, cx + padInner, cy + 52, cardW - padInner * 2, 13);
            descLines.forEach((line, li) => {
                ctx.fillText(line, cx + padInner, cy + 52 + li * 13);
            });

            // Formula box at the bottom of the card
            const fbY = cy + cardH - 30;
            const fbH = 22;
            const fbX = cx + padInner - 2;
            const fbW = cardW - (padInner - 2) * 2;
            ctx.fillStyle = dark ? 'rgba(15,23,42,0.7)' : 'rgba(226,232,240,0.9)';
            this.roundRect(ctx, fbX, fbY, fbW, fbH, 5);
            ctx.fill();
            ctx.strokeStyle = def.accent + '55';
            ctx.lineWidth = 1;
            this.roundRect(ctx, fbX, fbY, fbW, fbH, 5);
            ctx.stroke();

            ctx.fillStyle = def.accent;
            ctx.font = 'bold 11px ui-monospace, Menlo, monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(def.formula, fbX + fbW / 2, fbY + fbH / 2 + 1);

            // arrow after this card (except for the last one)
            if (i < cardCount - 1) {
                const ax = cx + cardW + 2;
                const ay = cy + cardH / 2;
                const aw = cardGap - 4;
                this._drawChevron(ctx, ax, ay, aw, def.accent, isActive);
            }
        }
    }

    _drawChevron(ctx, x, y, w, color, active) {
        const alpha = active ? 1 : 0.4;
        ctx.save();
        ctx.strokeStyle = color;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = active ? 2.2 : 1.6;
        ctx.beginPath();
        ctx.moveTo(x, y - 6);
        ctx.lineTo(x + w, y);
        ctx.lineTo(x, y + 6);
        ctx.stroke();
        // arrow head triangle
        ctx.beginPath();
        ctx.moveTo(x + w, y);
        ctx.lineTo(x + w - 6, y - 4);
        ctx.lineTo(x + w - 6, y + 4);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();
    }

    // ----- reward feedback loop drawing -----
    _drawLoop(ctx, x, y, w, h, textColor, subColor, borderColor, panelBg, dark) {
        // Panel background
        ctx.fillStyle = panelBg;
        this.roundRect(ctx, x, y, w, h, 10);
        ctx.fill();
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        this.roundRect(ctx, x, y, w, h, 10);
        ctx.stroke();

        // Panel title
        ctx.fillStyle = textColor;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('🔁  奖励反馈环  Reward Feedback Loop', x + 12, y + 8);
        ctx.fillStyle = subColor;
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('顺时针: 动作 → 环境 → 奖励 → 下一态', x + w - 12, y + 10);
        ctx.textAlign = 'left';

        // Loop geometry: center agent + 4 nodes around
        const cx = x + w / 2;
        const cy = y + h / 2 + 12;
        const radius = Math.min(w * 0.36, h * 0.36);

        // 4 node positions (clockwise starting at top)
        // order: Action (top) → Environment (right) → Reward (bottom) → NextState (left)
        const positions = [
            { dx:  0, dy: -1, idx: 0 }, // top
            { dx:  1, dy:  0, idx: 1 }, // right
            { dx:  0, dy:  1, idx: 2 }, // bottom
            { dx: -1, dy:  0, idx: 3 }  // left
        ];

        // Compute node world coordinates and store hit-rects
        this._loopNodeRects = [];
        const nodeR = 28;
        positions.forEach((p, i) => {
            p.x = cx + p.dx * radius;
            p.y = cy + p.dy * radius;
            this._loopNodeRects.push({ idx: i, x: p.x, y: p.y, r: nodeR });
        });

        // ---- Connecting arcs (clockwise) ----
        // Draw 4 curved arrows between consecutive nodes. Each arc is a small
        // piece of the circle so the visual reads as a smooth loop.
        const baseRadius = radius;
        for (let i = 0; i < 4; i++) {
            const a = positions[i];
            const b = positions[(i + 1) % 4];
            const startA = Math.atan2(a.y - cy, a.x - cx);
            const endA = Math.atan2(b.y - cy, b.x - cx);
            // We want the SHORT arc, not the long way around. Because the 4
            // nodes are 90° apart, the short arc is exactly 90° clockwise.
            // Normalize so endA is startA + π/2 (mod 2π).
            const a1 = startA + nodeR * 0.55 / baseRadius;
            let a2 = endA - nodeR * 0.55 / baseRadius;
            // ensure a2 is a1 + (90° - 2 * nodeR*0.55/baseRadius)
            const wantDelta = Math.PI / 2 - 2 * nodeR * 0.55 / baseRadius;
            if ((a2 - a1) < 0 || (a2 - a1) > Math.PI) {
                a2 = a1 + wantDelta;
            }

            const isActiveEdge = this._isParticleOnEdge(i);

            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, baseRadius, a1, a2);
            ctx.strokeStyle = isActiveEdge
                ? this.loopNodes[i].color
                : (dark ? 'rgba(148,163,184,0.45)' : 'rgba(100,116,139,0.5)');
            ctx.lineWidth = isActiveEdge ? 2.5 : 1.4;
            if (isActiveEdge) {
                ctx.shadowColor = this.loopNodes[i].color;
                ctx.shadowBlur = 6;
            }
            ctx.stroke();
            ctx.restore();

            // arrow head at end of arc
            const headA = a2;
            const hx = cx + baseRadius * Math.cos(headA);
            const hy = cy + baseRadius * Math.sin(headA);
            const tx = -Math.sin(headA);
            const ty = Math.cos(headA);
            const headSize = isActiveEdge ? 7 : 5;
            ctx.beginPath();
            ctx.moveTo(hx + tx * headSize, hy + ty * headSize);
            ctx.lineTo(hx - tx * headSize * 0.5 - Math.cos(headA) * headSize,
                       hy - ty * headSize * 0.5 - Math.sin(headA) * headSize);
            ctx.lineTo(hx - tx * headSize * 0.5 + Math.cos(headA) * headSize,
                       hy - ty * headSize * 0.5 + Math.sin(headA) * headSize);
            ctx.closePath();
            ctx.fillStyle = isActiveEdge
                ? this.loopNodes[i].color
                : (dark ? '#94A3B8' : '#64748B');
            ctx.fill();
        }

        // ---- Node circles ----
        positions.forEach((p, i) => {
            const node = this.loopNodes[i];
            const active = this._isParticleAtNode(i);

            // glow halo
            if (active) {
                const haloR = nodeR + 6 + Math.sin(this.pulse) * 2;
                ctx.beginPath();
                ctx.arc(p.x, p.y, haloR, 0, Math.PI * 2);
                ctx.fillStyle = node.color + '33';
                ctx.fill();
            }

            // main circle
            const grad = ctx.createRadialGradient(p.x - 6, p.y - 6, 2, p.x, p.y, nodeR);
            grad.addColorStop(0, node.color);
            grad.addColorStop(1, this._darken(node.color, 0.35));
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(p.x, p.y, nodeR, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = dark ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.7)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // node label
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(node.key, p.x, p.y - 1);
            ctx.font = '8px sans-serif';
            ctx.fillText(node.cn, p.x, p.y + 10);
        });

        // ---- Center: Agent ----
        const agentR = 30 + Math.sin(this.pulse) * 1.5;
        const agentGrad = ctx.createRadialGradient(cx - 6, cy - 6, 2, cx, cy, agentR);
        agentGrad.addColorStop(0, '#A78BFA');
        agentGrad.addColorStop(1, '#5B21B6');
        ctx.fillStyle = agentGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, agentR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();

        // ring around agent
        ctx.beginPath();
        ctx.arc(cx, cy, agentR + 5, 0, Math.PI * 2);
        ctx.strokeStyle = dark ? 'rgba(167,139,250,0.5)' : 'rgba(91,33,182,0.45)';
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);

        // agent label
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Agent', cx, cy - 5);
        ctx.fillText('πθ', cx, cy + 6);

        // ---- Flowing particle ----
        this._drawParticle(ctx, cx, cy, baseRadius, positions, dark);
    }

    _drawParticle(ctx, cx, cy, baseRadius, positions, dark) {
        // The particle is at parameter t in [0,1) around the loop.
        // Each edge (action→env, env→reward, reward→next, next→action)
        // occupies t in [i/4, (i+1)/4).
        const t = this.particleT;
        const segIdx = Math.min(3, Math.floor(t * 4));
        const segT = (t * 4) - segIdx; // 0..1 within this segment
        const a = positions[segIdx];
        const b = positions[(segIdx + 1) % 4];

        // Interpolate angle from a to b (clockwise), so the particle
        // walks from a's angle by +segT*PI/2 radians.
        const aA = Math.atan2(a.y - cy, a.x - cx);
        const bA = Math.atan2(b.y - cy, b.x - cx);
        let delta = bA - aA;
        // normalize to (0, 2π)
        while (delta <= 0) delta += Math.PI * 2;
        // we want the smaller of (delta) and (2π - delta)
        if (delta > Math.PI) delta = delta - Math.PI * 2;
        const angle = aA + delta * segT;
        const px = cx + baseRadius * Math.cos(angle);
        const py = cy + baseRadius * Math.sin(angle);

        // soft tail (faded arc behind the particle)
        ctx.save();
        const tailLen = 0.18;
        for (let k = 0; k < 6; k++) {
            const tBack = (t - k * tailLen / 6 + 1) % 1;
            const sIdx = Math.min(3, Math.floor(tBack * 4));
            const sFrac = (tBack * 4) - sIdx;
            const aa = positions[sIdx];
            const bb = positions[(sIdx + 1) % 4];
            const aaA = Math.atan2(aa.y - cy, aa.x - cx);
            const bbA = Math.atan2(bb.y - cy, bb.x - cx);
            let dd = bbA - aaA;
            while (dd <= 0) dd += Math.PI * 2;
            if (dd > Math.PI) dd = dd - Math.PI * 2;
            const aAng = aaA + dd * sFrac;
            const tx2 = cx + baseRadius * Math.cos(aAng);
            const ty2 = cy + baseRadius * Math.sin(aAng);
            const alpha = 0.18 - k * 0.025;
            if (alpha <= 0) break;
            ctx.fillStyle = this.loopNodes[segIdx].color;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(tx2, ty2, 4.5 - k * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // particle core
        const grad = ctx.createRadialGradient(px, py, 1, px, py, 7);
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(0.4, this.loopNodes[segIdx].color);
        grad.addColorStop(1, this.loopNodes[segIdx].color + '00');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(px, py, 3.2, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.strokeStyle = this.loopNodes[segIdx].color;
        ctx.lineWidth = 1.2;
        ctx.stroke();
    }

    // active edge / node detection
    _isParticleOnEdge(edgeIdx) {
        const t = this.particleT;
        // edge i is t in [i/4, (i+1)/4), highlight if particle is roughly in the middle
        const start = edgeIdx / 4;
        const end = (edgeIdx + 1) / 4;
        return t >= start && t < end;
    }
    _isParticleAtNode(nodeIdx) {
        // consider a node "active" when the particle is near it (within ±5% of t)
        const t = this.particleT;
        const nodeT = nodeIdx / 4; // particle just left this node
        const beforeT = ((nodeIdx - 1 + 4) % 4) / 4; // particle just arrived from prev edge
        const window = 0.04;
        return Math.abs(t - nodeT) < window || Math.abs(t - beforeT) < window;
    }

    // ---- helpers ----
    _hexToRgb(hex) {
        const m = hex.replace('#', '');
        const n = parseInt(m.length === 3
            ? m.split('').map((c) => c + c).join('')
            : m, 16);
        return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    }
    _darken(hex, ratio) {
        const { r, g, b } = this._hexToRgb(hex);
        const f = (v) => Math.max(0, Math.round(v * (1 - ratio)));
        return `rgb(${f(r)}, ${f(g)}, ${f(b)})`;
    }
    _lighten(hex, ratio) {
        const { r, g, b } = this._hexToRgb(hex);
        const f = (v) => Math.min(255, Math.round(v + (255 - v) * ratio));
        return `rgb(${f(r)}, ${f(g)}, ${f(b)})`;
    }
}

registerAnimation('ch11-rl-feedback', () => new Ch11RL());

/**
 * CH2: AI 发展史时间线 — 9 个里程碑 · 4 个时代
 * 播放：从 1950 到 2023，依次高亮每个节点
 * 单步：跳到下一个
 * 悬停/点击：展开该里程碑的"上一代痛点 → 本代方案"对比
 */
import { CanvasAnimation } from './canvas-animation.js';
import { registerAnimation } from './animation-registry.js';

class Ch2HistoryTimeline extends CanvasAnimation {
    constructor() {
        super();
        this._activeIndex   = -1;
        this._selectedIndex = -1;
        this._hoverIndex    = -1;
        this._playing = false;
        this._rafId = null;
        this._lastTick = 0;
        this._holdTime = 0;
        this._holdDuration = 1800; // ms per milestone
        this.speed = 1;
    }

    /* ---------------------------------------------------------------
     *  Data — 9 milestones, 4 eras
     * ------------------------------------------------------------- */
    get milestones() {
        return [
            { year: '1950', title: '图灵测试',       era: 0,
              desc: '图灵提出 "机器能思考吗？" —— 用文字对话间接判断机器是否具有人类智能。',
              before: '没有可操作的"智能"定义，全靠哲学思辨。',
              after:  '"如果分不清是人还是机器，就算有智能"——第一次给出可测试判据。' },
            { year: '1956', title: 'AI 诞生',         era: 0,
              desc: '达特茅斯会议正式提出 "Artificial Intelligence" 一词，AI 成为独立学科。',
              before: '研究散落在数学、心理学、工程里，缺少共同语言。',
              after:  'AI 作为独立学科诞生，吸引首批研究资金与人才。' },
            { year: '1980', title: '专家系统',         era: 1,
              desc: '把领域专家的知识编码成 "IF…THEN…" 规则，机器第一次在医疗、地质等垂直领域商用。',
              before: '通用 AI 进展缓慢，无法落地。',
              after:  '知识 + 推理 = 商用 AI，DENDRAL、MYCIN 等系统证明价值。' },
            { year: '1997', title: '深蓝',             era: 1,
              desc: 'IBM DeepBlue 击败国际象棋世界冠军卡斯帕罗夫，符号搜索达到巅峰。',
              before: '公众怀疑机器能否在复杂博弈中战胜人类。',
              after:  '暴力搜索 + 评估函数在封闭规则游戏中胜出。' },
            { year: '2012', title: 'AlexNet',           era: 1,
              desc: 'Hinton 团队用 CNN + GPU 把 ImageNet 错误率从 26% 降到 15%，深度学习正式爆发。',
              before: '传统视觉算法在自然图像上长期停滞。',
              after:  'CNN + 大数据 + GPU = 视觉突破，引爆深度学习浪潮。' },
            { year: '2016', title: 'AlphaGo',           era: 2,
              desc: 'DeepMind AlphaGo 击败李世石。强化学习 + 深度网络让机器学会"直觉"。',
              before: '围棋复杂度 10^170，符号搜索完全失效。',
              after:  '策略网络 + 价值网络把"直觉"学了出来。' },
            { year: '2017', title: 'Transformer',     era: 3,
              desc: 'Google 发表 "Attention Is All You Need"，自注意力成为 LLM 通用骨架。',
              before: 'RNN/LSTM 长依赖训练慢、难并行。',
              after:  '自注意力 + 并行预训练，模型规模可堆。' },
            { year: '2022', title: 'ChatGPT',         era: 3,
              desc: 'OpenAI 发布 ChatGPT。RLHF 让 LLM 真正"听懂人话"，引爆全球 AI 热潮。',
              before: '语言模型只会续写，不会按指令办事。',
              after:  '指令对齐 + 多轮对话，LLM 走入大众。' },
            { year: '2023', title: 'AutoGPT',         era: 3,
              desc: '自主 LLM Agent 框架兴起：LLM 自己拆解目标、调用工具、循环执行。',
              before: 'LLM 只会"说"，不会"做"。',
              after:  'LLM 拆任务 + 调工具 + 自我评估，Agent 技术栈大爆发。' }
        ];
    }

    get eras() {
        // `colorKey` is resolved against this.theme() inside draw().
        return [
            { id: 0, label: '萌芽期',   from: 0, to: 1,
              colorKey: 'mutedSoft',
              colorKeyDark: 'muted',
              fillAlphaLight: 0.10, fillAlphaDark: 0.14 },
            { id: 1, label: '符号主义', from: 2, to: 4,
              colorKey: 'accentAmber',
              colorKeyDark: 'accentAmber',
              fillAlphaLight: 0.12, fillAlphaDark: 0.16 },
            { id: 2, label: '深度学习', from: 5, to: 5,
              colorKey: 'accentTeal',
              colorKeyDark: 'accentTeal',
              fillAlphaLight: 0.12, fillAlphaDark: 0.16 },
            { id: 3, label: 'LLM 时代', from: 6, to: 8,
              colorKey: 'primary',
              colorKeyDark: 'primary',
              fillAlphaLight: 0.10, fillAlphaDark: 0.16 }
        ];
    }

    /* ---------------------------------------------------------------
     *  Lifecycle
     * ------------------------------------------------------------- */
    init(canvas) {
        super.init(canvas);
        this._setupCanvasEvents();
        this._setupControls();
        window.addEventListener('resize', () => { this._resize(); this.draw(); });
        this.draw();
    }

    _setupCanvasEvents() {
        if (!this.canvas) return;
        this.canvas.addEventListener('click', (e) => this._handleClick(e));
        this.canvas.addEventListener('mousemove', (e) => this._handleHover(e));
        this.canvas.addEventListener('mouseleave', () => {
            this._hoverIndex = -1;
            this.canvas.style.cursor = 'default';
            this.draw();
        });
    }

    _setupControls() {
        const animId = 'ch2-history-timeline';
        const playBtn   = document.getElementById('btn-play-' + animId);
        const stepBtn   = document.getElementById('btn-step-' + animId);
        const resetBtn  = document.getElementById('btn-reset-' + animId);
        const speedEl   = document.getElementById('speed-' + animId);

        if (playBtn)  playBtn.addEventListener('click', () => this.togglePlay());
        if (stepBtn)  stepBtn.addEventListener('click', () => this.stepForward());
        if (resetBtn) resetBtn.addEventListener('click', () => this.reset());
        if (speedEl)  speedEl.addEventListener('input', (e) => {
            this.speed = parseFloat(e.target.value) || 1;
        });
    }

    /* ---------------------------------------------------------------
     *  Playback controls (compatible with base interface)
     * ------------------------------------------------------------- */
    togglePlay() {
        if (this._playing) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        // If at end, restart from beginning
        if (this._activeIndex >= this.milestones.length - 1) {
            this._activeIndex = -1;
            this._holdTime = 0;
        }
        this._playing = true;
        this._lastTick = performance.now();
        const btn = document.getElementById('btn-play-ch2-history-timeline');
        if (btn) btn.textContent = '暂停';
        this._loop();
    }

    pause() {
        this._playing = false;
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
        const btn = document.getElementById('btn-play-ch2-history-timeline');
        if (btn) btn.textContent = '播放';
    }

    _loop() {
        if (!this._playing) return;
        const now = performance.now();
        const dt = now - this._lastTick;
        this._lastTick = now;
        this._holdTime += dt * (this.speed || 1);

        if (this._holdTime >= this._holdDuration) {
            this._holdTime = 0;
            this._activeIndex++;
            if (this._activeIndex >= this.milestones.length) {
                // End of playback - pause and highlight last node
                this._activeIndex = this.milestones.length - 1;
                this.pause();
                this.draw();
                return;
            }
        }
        this.draw();
        this._rafId = requestAnimationFrame(() => this._loop());
    }

    stepForward() {
        this.pause();
        this._activeIndex++;
        if (this._activeIndex >= this.milestones.length) {
            this._activeIndex = this.milestones.length - 1;
        }
        this._selectedIndex = this._activeIndex;
        this.draw();
    }

    reset() {
        this.pause();
        this._activeIndex = -1;
        this._selectedIndex = -1;
        this._hoverIndex = -1;
        this._holdTime = 0;
        this.draw();
    }

    setSpeed(v) { this.speed = v; }

    /* ---------------------------------------------------------------
     *  Layout
     * ------------------------------------------------------------- */
    _getPositions() {
        const w = this.width;
        const h = this.height;
        const n = this.milestones.length;
        const margin = w * 0.06;
        const usable = w - margin * 2;
        const timelineY = h * 0.50;
        const positions = [];
        for (let i = 0; i < n; i++) {
            const x = margin + (usable * i) / (n - 1);
            // Alternate above/below for the label, but use a deterministic pattern
            // so the layout stays stable.
            const yOff = (i % 2 === 0) ? -1 : 1;
            const labelY = timelineY + yOff * Math.max(46, h * 0.12);
            positions.push({ x, y: timelineY, labelY, dir: yOff });
        }
        return positions;
    }

    _hitTest(x, y) {
        const positions = this._getPositions();
        const hitR = 22;
        for (let i = positions.length - 1; i >= 0; i--) {
            const p = positions[i];
            const dx = x - p.x;
            const dy = y - p.y;
            if (Math.sqrt(dx * dx + dy * dy) <= hitR) return i;
        }
        return -1;
    }

    _handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const idx = this._hitTest(x, y);
        if (idx >= 0) {
            this._selectedIndex = (this._selectedIndex === idx) ? -1 : idx;
        } else {
            this._selectedIndex = -1;
        }
        this.draw();
    }

    _handleHover(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const idx = this._hitTest(x, y);
        if (idx !== this._hoverIndex) {
            this._hoverIndex = idx;
            this.canvas.style.cursor = idx >= 0 ? 'pointer' : 'default';
            this.draw();
        }
    }

    /* ---------------------------------------------------------------
     *  Color helpers
     * ------------------------------------------------------------- */
    _eraColor(eraId, t) {
        const era = this.eras[eraId];
        const key = this.isDarkTheme() ? era.colorKeyDark : era.colorKey;
        return t[key];
    }

    _eraFill(eraId, t) {
        const era = this.eras[eraId];
        const key = this.isDarkTheme() ? era.colorKeyDark : era.colorKey;
        const alpha = this.isDarkTheme() ? era.fillAlphaDark : era.fillAlphaLight;
        return this._withAlpha(t[key], alpha);
    }

    _withAlpha(hex, alpha) {
        if (typeof hex !== 'string' || hex[0] !== '#' || hex.length < 7) return hex;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    }

    /* ---------------------------------------------------------------
     *  Drawing
     * ------------------------------------------------------------- */
    draw() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        const t = this.theme();
        const dark = this.isDarkTheme();
        const bg = dark ? t.surfaceDarkSoft : t.canvas;
        const textColor = t.ink;
        const subText = t.muted;
        const cardBg = dark ? t.surfaceDark : t.canvas;
        const border = t.hairline;
        const track = t.muted;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        const positions = this._getPositions();
        const timelineY = positions[0].y;
        const baseNodeR = Math.max(8, Math.min(14, w * 0.014));

        // ---- Era background bands ---------------------------------------
        for (const era of this.eras) {
            const x0 = positions[era.from].x;
            const x1 = positions[era.to].x;
            const bandY = h * 0.18;
            const bandH = h * 0.66;
            ctx.fillStyle = this._eraFill(era.id, t);
            ctx.fillRect(x0 - 6, bandY, (x1 - x0) + 12, bandH);

            // Era label at top of band
            ctx.fillStyle = this._eraColor(era.id, t);
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(era.label, (x0 + x1) / 2, bandY + 6);
        }

        // ---- Timeline backbone ------------------------------------------
        ctx.beginPath();
        ctx.moveTo(positions[0].x, timelineY);
        ctx.lineTo(positions[positions.length - 1].x, timelineY);
        ctx.strokeStyle = this._withAlpha(track, dark ? 0.5 : 0.4);
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Tick marks at each node position
        for (let i = 0; i < positions.length; i++) {
            const p = positions[i];
            ctx.beginPath();
            ctx.moveTo(p.x, timelineY - 4);
            ctx.lineTo(p.x, timelineY + 4);
            ctx.strokeStyle = this._withAlpha(track, dark ? 0.5 : 0.4);
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // ---- Connection line from node to its label --------------------
        const labelOffset = 32;
        for (let i = 0; i < positions.length; i++) {
            const p = positions[i];
            const isActive = (i === this._activeIndex);
            const isSelected = (i === this._selectedIndex);
            const color = this._eraColor(this.milestones[i].era, t);

            const y1 = timelineY + p.dir * 8;
            const y2 = p.labelY - p.dir * labelOffset;
            ctx.beginPath();
            ctx.moveTo(p.x, y1);
            ctx.lineTo(p.x, y2);
            ctx.strokeStyle = (isActive || isSelected) ? color : this._withAlpha(track, dark ? 0.5 : 0.4);
            ctx.lineWidth = (isActive || isSelected) ? 2 : 1.2;
            ctx.stroke();
        }

        // ---- Nodes -----------------------------------------------------
        for (let i = 0; i < positions.length; i++) {
            const p = positions[i];
            const ms = this.milestones[i];
            const color = this._eraColor(ms.era, t);
            const isActive = (i === this._activeIndex);
            const isSelected = (i === this._selectedIndex);
            const isHover = (i === this._hoverIndex);
            const emphasized = isActive || isSelected || isHover;

            let r = baseNodeR;
            if (isSelected) r = baseNodeR * 1.5;
            else if (isActive) r = baseNodeR * 1.3 + Math.sin(performance.now() / 200) * 1.5;
            else if (isHover) r = baseNodeR * 1.2;

            // Outer halo when emphasized
            if (emphasized) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, r + 10, 0, Math.PI * 2);
                ctx.fillStyle = this._withAlpha(color, dark ? 0.3 : 0.22);
                ctx.fill();
            }

            // Soft inner ring
            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            const grad = ctx.createRadialGradient(
                p.x - r * 0.35, p.y - r * 0.35, r * 0.1,
                p.x, p.y, r
            );
            grad.addColorStop(0, t.surfaceCard);
            grad.addColorStop(1, color);
            ctx.fillStyle = grad;
            ctx.fill();

            ctx.strokeStyle = emphasized ? color : border;
            ctx.lineWidth = emphasized ? 3 : 1.5;
            ctx.stroke();

            // Year label (closer to node)
            ctx.fillStyle = emphasized ? color : subText;
            ctx.font = (emphasized ? 'bold ' : '') + Math.max(10, Math.min(12, w * 0.013)) + 'px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = p.dir === -1 ? 'bottom' : 'top';
            ctx.fillText(ms.year, p.x, p.y + p.dir * (r + 4) - p.dir * 0);

            // Title (further out)
            ctx.fillStyle = emphasized ? textColor : subText;
            ctx.font = (emphasized ? 'bold ' : '') + Math.max(10, Math.min(12, w * 0.0125)) + 'px sans-serif';
            ctx.textBaseline = p.dir === -1 ? 'bottom' : 'top';
            ctx.fillText(ms.title, p.x, p.y + p.dir * (r + 18));
        }

        // ---- Bottom detail / instruction card --------------------------
        const showDetails = this._selectedIndex >= 0;
        const cardX = w * 0.04;
        const cardW = w * 0.92;
        const cardY = h * 0.72;
        const cardH = h - cardY - 12;

        this.roundRect(ctx, cardX, cardY, cardW, cardH, 10);
        ctx.fillStyle = cardBg;
        ctx.fill();
        ctx.strokeStyle = showDetails
            ? this._eraColor(this.milestones[this._selectedIndex].era, t)
            : border;
        ctx.lineWidth = showDetails ? 2 : 1;
        ctx.stroke();

        if (showDetails) {
            this._drawDetailsCard(cardX, cardY, cardW, cardH,
                this.milestones[this._selectedIndex], cardBg, textColor, subText, border, t);
        } else {
            this._drawInstructionCard(cardX, cardY, cardW, cardH, textColor, subText);
        }
    }

    _drawInstructionCard(x, y, w, h, textColor, subText) {
        const ctx = this.ctx;
        ctx.fillStyle = textColor;
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('问题驱动的演进阶梯', x + 16, y + 12);

        ctx.fillStyle = subText;
        ctx.font = '11px sans-serif';
        const tipLines = [
            '播放：依次高亮 9 个里程碑节点，看 70 年 AI 发展的演进。',
            '点击：展开节点查看"上一代痛点 → 本代方案"对比。',
            '单步：跳到下一个里程碑。'
        ];
        let ty = y + 34;
        for (const line of tipLines) {
            ctx.fillText('- ' + line, x + 16, ty);
            ty += 16;
        }
    }

    _drawDetailsCard(x, y, w, h, ms, cardBg, textColor, subText, border, t) {
        const ctx = this.ctx;
        const era = this.eras[ms.era];
        const accent = this._eraColor(ms.era, t);

        // Era badge
        const badgeW = 64;
        const badgeH = 22;
        const badgeX = x + 14;
        const badgeY = y + 12;
        this.roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 11);
        ctx.fillStyle = this._withAlpha(accent, this.isDarkTheme() ? 0.25 : 0.18);
        ctx.fill();
        ctx.fillStyle = accent;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(era.label, badgeX + badgeW / 2, badgeY + badgeH / 2);

        // Title (year + name)
        ctx.fillStyle = textColor;
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(ms.year + '  ·  ' + ms.title, badgeX + badgeW + 12, badgeY + badgeH / 2);

        // Description (top line, single short sentence)
        ctx.fillStyle = subText;
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        const descLines = this.wrapText(ctx, ms.desc, x + 16, y + 42, w - 32, 15);
        let ly = y + 42;
        for (const line of descLines) {
            ctx.fillText(line, x + 16, ly);
            ly += 15;
        }

        // Before / After two-column compare
        const cmpY = ly + 6;
        const colW = (w - 32 - 12) / 2;
        const colH = h - (cmpY - y) - 12;
        const dark = this.isDarkTheme();

        // Before column (痛点) — uses t.error
        this.roundRect(ctx, x + 14, cmpY, colW, colH, 8);
        ctx.fillStyle = this._withAlpha(t.error, dark ? 0.18 : 0.10);
        ctx.fill();
        ctx.strokeStyle = this._withAlpha(t.error, dark ? 0.55 : 0.45);
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = t.error;
        ctx.font = 'bold 10px sans-serif';
        ctx.textBaseline = 'top';
        ctx.fillText('上一代痛点', x + 22, cmpY + 8);
        ctx.fillStyle = textColor;
        ctx.font = '11px sans-serif';
        const beforeLines = this.wrapText(ctx, ms.before, x + 22, cmpY + 24, colW - 16, 14);
        let by = cmpY + 24;
        for (const line of beforeLines) {
            ctx.fillText(line, x + 22, by);
            by += 14;
        }

        // After column (突破) — uses t.success
        const ax2 = x + 14 + colW + 12;
        this.roundRect(ctx, ax2, cmpY, colW, colH, 8);
        ctx.fillStyle = this._withAlpha(t.success, dark ? 0.18 : 0.12);
        ctx.fill();
        ctx.strokeStyle = this._withAlpha(t.success, dark ? 0.55 : 0.45);
        ctx.stroke();

        ctx.fillStyle = t.success;
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('本代突破', ax2 + 8, cmpY + 8);
        ctx.fillStyle = textColor;
        ctx.font = '11px sans-serif';
        const afterLines = this.wrapText(ctx, ms.after, ax2 + 8, cmpY + 24, colW - 16, 14);
        let ay = cmpY + 24;
        for (const line of afterLines) {
            ctx.fillText(line, ax2 + 8, ay);
            ay += 14;
        }
    }
}

registerAnimation('ch2-history-timeline', () => new Ch2HistoryTimeline());

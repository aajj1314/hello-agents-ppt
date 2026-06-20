/**
 * CH2: AI Agent History Timeline - "Problem-Driven" Evolution Ladder
 *
 * Renders 9 milestones (1950 Turing Test -> 2023 AutoGPT) arranged left-to-right
 * with 4 era color bands (萌芽期 / 符号主义 / 深度学习 / LLM时代) as background.
 *
 * Modes:
 *  - Auto play: sequentially highlight each milestone, advance automatically.
 *  - Click: toggle a node; on selected, show the "问题 → 解决" before/after card.
 *
 * Controls (bound by id):
 *   btn-play-ch2-history-timeline     toggle play/pause
 *   btn-step-ch2-history-timeline     advance to next milestone
 *   btn-reset-ch2-history-timeline   rewind to start
 *   speed-ch2-history-timeline        playback speed multiplier
 */
import { CanvasAnimation } from './canvas-animation.js';
import { registerAnimation } from './animation-registry.js';

class Ch2HistoryTimeline extends CanvasAnimation {
    constructor() {
        super();
        this.speed = 1;
        this._playing = false;
        this._rafId = null;
        this._activeIndex = -1;     // currently highlighted milestone in play mode
        this._selectedIndex = -1;   // user-clicked milestone (locks details card)
        this._hoverIndex = -1;
        this._lastTick = 0;
        this._holdTime = 0;         // accumulated time on current milestone (ms)
        this._holdDuration = 2400;  // ms per milestone during auto-play
    }

    /* ---------------------------------------------------------------
     *  Milestone data: 9 nodes, 4 eras
     * ------------------------------------------------------------- */
    get milestones() {
        return [
            { year: '1950', title: '图灵测试',        era: 0,
              desc: '图灵提出"机器能否思考"的判定标准，AI 思想先河。',
              before: '哲学思辨："机器能思考吗？"',
              after:  '可操作的判定标准：模仿游戏。' },
            { year: '1956', title: '达特茅斯会议',    era: 0,
              desc: '麦卡锡、明斯基等正式提出"Artificial Intelligence" 一词，学科诞生。',
              before: '没有统一的"AI"概念，散落在数学/控制论/语言学。',
              after:  'AI 作为独立学科登上舞台。' },
            { year: '1966', title: 'ELIZA',          era: 1,
              desc: '魏泽鲍姆开发首个对话程序。模式匹配 + 句式替换，无任何语义理解。',
              before: '无法让机器"说人话"。',
              after:  '模式匹配即可制造"理解"假象（ELIZA 效应）。' },
            { year: '1980s', title: '专家系统',       era: 1,
              desc: 'MYCIN / XCON 等实现商业化。知识库 + 推理机的符号 AI 达到鼎盛。',
              before: '无法把专家经验系统化部署到生产环境。',
              after:  '知识可编码、推理可执行，垂直领域效率倍增。' },
            { year: '1997', title: 'Deep Blue',      era: 1,
              desc: 'IBM 深蓝击败国际象棋世界冠军卡斯帕罗夫，符号主义 + 搜索登顶。',
              before: '机器在国际象棋这种"知识+搜索"任务上不可战胜人类。',
              after:  '暴力搜索 + 评估函数战胜世界冠军。' },
            { year: '2016', title: 'AlphaGo',         era: 2,
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
        return [
            { id: 0, label: '萌芽期',   from: 0, to: 1,
              color: { light: '#3B82F6', dark: '#60A5FA' },
              fill:  { light: 'rgba(59,130,246,0.06)',  dark: 'rgba(96,165,250,0.07)'  } },
            { id: 1, label: '符号主义', from: 2, to: 4,
              color: { light: '#D97706', dark: '#F59E0B' },
              fill:  { light: 'rgba(217,119,6,0.06)',   dark: 'rgba(245,158,11,0.07)'  } },
            { id: 2, label: '深度学习', from: 5, to: 5,
              color: { light: '#059669', dark: '#10B981' },
              fill:  { light: 'rgba(5,150,105,0.07)',   dark: 'rgba(16,185,129,0.08)'  } },
            { id: 3, label: 'LLM 时代', from: 6, to: 8,
              color: { light: '#7C3AED', dark: '#A78BFA' },
              fill:  { light: 'rgba(124,58,237,0.06)',  dark: 'rgba(167,139,250,0.07)' } }
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
        if (this._activeIndex < this.milestones.length - 1) {
            this._activeIndex++;
        }
        this._holdTime = 0;
        this.draw();
    }

    reset() {
        this.pause();
        this._activeIndex = -1;
        this._selectedIndex = -1;
        this._holdTime = 0;
        this.draw();
    }

    setSpeed(v) {
        this.speed = v;
    }

    step() {
        this.stepForward();
    }

    /* ---------------------------------------------------------------
     *  Hit-testing & interaction
     * ------------------------------------------------------------- */
    _getPositions() {
        const w = this.width;
        const h = this.height;
        const count = this.milestones.length;
        const positions = [];
        const margin = Math.max(48, w * 0.05);
        const usableW = w - margin * 2;
        const spacing = usableW / (count - 1);
        const timelineY = h * 0.4;

        for (let i = 0; i < count; i++) {
            const x = margin + i * spacing;
            // Alternate above/below the timeline for legibility
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
    _eraColor(eraId) {
        const era = this.eras[eraId];
        return this.isDarkTheme() ? era.color.dark : era.color.light;
    }

    _eraFill(eraId) {
        const era = this.eras[eraId];
        return this.isDarkTheme() ? era.fill.dark : era.fill.light;
    }

    /* ---------------------------------------------------------------
     *  Drawing
     * ------------------------------------------------------------- */
    draw() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        const dark = this.isDarkTheme();
        const bg = dark ? '#0F172A' : '#F8FAFC';
        const textColor = dark ? '#F1F5F9' : '#0F172A';
        const subText = dark ? '#94A3B8' : '#475569';
        const cardBg = dark ? '#1E293B' : '#FFFFFF';
        const border = dark ? '#334155' : '#E2E8F0';
        const track = dark ? '#334155' : '#CBD5E1';

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
            ctx.fillStyle = this._eraFill(era.id);
            ctx.fillRect(x0 - 6, bandY, (x1 - x0) + 12, bandH);

            // Era label at top of band
            ctx.fillStyle = this._eraColor(era.id);
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(era.label, (x0 + x1) / 2, bandY + 6);
        }

        // ---- Timeline backbone ------------------------------------------
        ctx.beginPath();
        ctx.moveTo(positions[0].x, timelineY);
        ctx.lineTo(positions[positions.length - 1].x, timelineY);
        ctx.strokeStyle = track;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Tick marks at each node position
        for (let i = 0; i < positions.length; i++) {
            const p = positions[i];
            ctx.beginPath();
            ctx.moveTo(p.x, timelineY - 4);
            ctx.lineTo(p.x, timelineY + 4);
            ctx.strokeStyle = track;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // ---- Connection line from node to its label --------------------
        const labelOffset = 32;
        for (let i = 0; i < positions.length; i++) {
            const p = positions[i];
            const isActive = (i === this._activeIndex);
            const isSelected = (i === this._selectedIndex);
            const color = this._eraColor(this.milestones[i].era);

            const y1 = timelineY + p.dir * 8;
            const y2 = p.labelY - p.dir * labelOffset;
            ctx.beginPath();
            ctx.moveTo(p.x, y1);
            ctx.lineTo(p.x, y2);
            ctx.strokeStyle = (isActive || isSelected) ? color : track;
            ctx.lineWidth = (isActive || isSelected) ? 2 : 1.2;
            ctx.stroke();
        }

        // ---- Nodes -----------------------------------------------------
        for (let i = 0; i < positions.length; i++) {
            const p = positions[i];
            const ms = this.milestones[i];
            const color = this._eraColor(ms.era);
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
                ctx.fillStyle = color + (dark ? '35' : '28');
                ctx.fill();
            }

            // Soft inner ring
            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            const grad = ctx.createRadialGradient(
                p.x - r * 0.35, p.y - r * 0.35, r * 0.1,
                p.x, p.y, r
            );
            grad.addColorStop(0, '#FFFFFF');
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
            ? this._eraColor(this.milestones[this._selectedIndex].era)
            : border;
        ctx.lineWidth = showDetails ? 2 : 1;
        ctx.stroke();

        if (showDetails) {
            this._drawDetailsCard(cardX, cardY, cardW, cardH,
                this.milestones[this._selectedIndex], cardBg, textColor, subText, border);
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

    _drawDetailsCard(x, y, w, h, ms, cardBg, textColor, subText, border) {
        const ctx = this.ctx;
        const era = this.eras[ms.era];
        const accent = this._eraColor(ms.era);

        // Era badge
        const badgeW = 64;
        const badgeH = 22;
        const badgeX = x + 14;
        const badgeY = y + 12;
        this.roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 11);
        ctx.fillStyle = accent + (this.isDarkTheme() ? '30' : '22');
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

        // Before column
        this.roundRect(ctx, x + 14, cmpY, colW, colH, 8);
        ctx.fillStyle = this.isDarkTheme() ? '#3F1D1D' : '#FEF2F2';
        ctx.fill();
        ctx.strokeStyle = this.isDarkTheme() ? '#7F1D1D' : '#FCA5A5';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = this.isDarkTheme() ? '#FCA5A5' : '#B91C1C';
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

        // After column
        const ax2 = x + 14 + colW + 12;
        this.roundRect(ctx, ax2, cmpY, colW, colH, 8);
        ctx.fillStyle = this.isDarkTheme() ? '#1E3A2A' : '#F0FDF4';
        ctx.fill();
        ctx.strokeStyle = this.isDarkTheme() ? '#15803D' : '#86EFAC';
        ctx.stroke();

        ctx.fillStyle = this.isDarkTheme() ? '#86EFAC' : '#15803D';
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

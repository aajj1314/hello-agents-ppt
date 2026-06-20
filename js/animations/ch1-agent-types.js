/**
 * CH1: 5 Agent Types — Two-Layer Interactive Canvas
 * Layer 1: 5 gradient nodes at the top (hover/click/auto-cycle)
 * Layer 2: detail card (PEAS 2x2 grid + life example + "how it relates to me")
 *
 * Play button auto-cycles through the 5 types (demo mode).
 * Click a node to inspect it manually.
 */
import { CanvasAnimation } from './canvas-animation.js';
import { registerAnimation } from './animation-registry.js';

class Ch1AgentTypes extends CanvasAnimation {
    constructor() {
        super();
        this.selectedIndex = -1;
        this.hoverIndex = -1;

        this._playing = false;
        this._rafId = null;
        this._lastTickTime = 0;
        this._cycleIndex = 0;
        this.speed = 1;
        this.cycleInterval = 2400; // ms per type during autoplay

        this.types = [
            {
                name: '简单反射',
                nameEn: 'Simple Reflex',
                color: '#60A5FA',
                colorSoft: '#93C5FD',
                key: '只看现在',
                desc: '仅看当前感知，按固定规则立刻行动，不记过去也不想未来。',
                example: '自动恒温器：感知温度 → 低于阈值就加热，高于阈值就制冷。',
                relation: '你家里的空调、电饭煲、感应灯都属于这类，最简单也最可靠。',
                peas: {
                    P: '室温维持在设定区间',
                    E: '当前室温、用户设定值',
                    A: '压缩机 / 加热器开关',
                    S: '温度传感器'
                }
            },
            {
                name: '模型反射',
                nameEn: 'Model-Based',
                color: '#A78BFA',
                colorSoft: '#C4B5FD',
                key: '记得过去',
                desc: '维护一份对世界的内部记录，根据历史状态做决定。',
                example: '扫地机器人：一边扫一边更新房间地图，知道哪里扫过、哪里还没扫。',
                relation: '理解它，就能看懂所有"会建图"的设备：扫地机、辅助驾驶、推荐系统。',
                peas: {
                    P: '清扫覆盖率、电量使用效率',
                    E: '房间布局、已扫区域、障碍物',
                    A: '滚刷、驱动轮、回充指令',
                    S: '激光雷达、悬崖传感器、碰撞开关'
                }
            },
            {
                name: '目标驱动',
                nameEn: 'Goal-Based',
                color: '#F472B6',
                colorSoft: '#F9A8D4',
                key: '面向未来',
                desc: '以目标为导向，主动选择能最快到达目标的行动。',
                example: '导航软件：目标是"到达公司"，自动搜索距离 / 时间最优路径。',
                relation: '做产品时把"目标"写清楚，比堆功能更重要——Agent 会自己规划。',
                peas: {
                    P: '是否到达目的地、耗时',
                    E: '道路网络、实时路况、终点坐标',
                    A: '转向指令、播报语音',
                    S: 'GPS、地图数据'
                }
            },
            {
                name: '效用驱动',
                nameEn: 'Utility-Based',
                color: '#34D399',
                colorSoft: '#86EFAC',
                key: '会权衡',
                desc: '在多个冲突目标间打分，选期望效用最大的行动。',
                example: '订餐助手：在价格、配送时间、评分、口味之间综合打分，挑选最优。',
                relation: '它教我们一件事：好决策不是"对/错"，而是"在多个好方案里选最划算"。',
                peas: {
                    P: '用户满意度 / 多目标加权得分',
                    E: '餐厅列表、用户偏好、历史订单',
                    A: '推荐结果、推送通知',
                    S: '用户输入、评分、位置'
                }
            },
            {
                name: '学习型',
                nameEn: 'Learning',
                color: '#FBBF24',
                colorSoft: '#FCD34D',
                key: '会进化',
                desc: '从经验中学习，用反馈不断改进未来的决策。',
                example: '推荐系统：每次你点击 / 跳过都在告诉它"下次该怎么排"。',
                relation: '现代 LLM 智能体（RLHF）就是学习型——你和它聊得越多，它越懂你。',
                peas: {
                    P: '预测准确率、点击率',
                    E: '用户历史行为、反馈信号',
                    A: '推荐列表、排序权重',
                    S: '点击日志、停留时长、评分'
                }
            }
        ];
    }

    init(canvas) {
        super.init(canvas);
        this._setupControls();
        window.addEventListener('resize', () => { this._resize(); this.draw(); });
        this.draw();
    }

    _setupControls() {
        const animId = 'ch1-agent-types';
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

        this.canvas.addEventListener('click', (e) => this._handleClick(e));
        this.canvas.addEventListener('mousemove', (e) => this._handleHover(e));
        this.canvas.addEventListener('mouseleave', () => {
            this.hoverIndex = -1;
            this.canvas.style.cursor = 'default';
            this.draw();
        });
    }

    _getNodePositions() {
        const w = this.width;
        const h = this.height;
        const n = this.types.length;
        const topY = Math.max(70, h * 0.22);
        const margin = w * 0.08;
        const usable = w - margin * 2;
        const positions = [];
        for (let i = 0; i < n; i++) {
            positions.push({ x: margin + (usable * i) / (n - 1), y: topY });
        }
        return positions;
    }

    _nodeRadius() {
        return Math.max(26, Math.min(46, this.width * 0.055));
    }

    _handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const positions = this._getNodePositions();
        const r = this._nodeRadius() + 6; // include hover halo
        let found = -1;
        for (let i = 0; i < positions.length; i++) {
            const p = positions[i];
            const dx = x - p.x;
            const dy = y - p.y;
            if (dx * dx + dy * dy <= r * r) { found = i; break; }
        }
        if (found < 0) return;
        // Manual click pauses autoplay
        if (this._playing) this._stopLoop();
        this.selectedIndex = this.selectedIndex === found ? -1 : found;
        this.draw();
    }

    _handleHover(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const positions = this._getNodePositions();
        const r = this._nodeRadius() + 4;
        let found = -1;
        for (let i = 0; i < positions.length; i++) {
            const p = positions[i];
            const dx = x - p.x;
            const dy = y - p.y;
            if (dx * dx + dy * dy <= r * r) { found = i; break; }
        }
        if (found !== this.hoverIndex) {
            this.hoverIndex = found;
            this.canvas.style.cursor = found >= 0 ? 'pointer' : 'default';
            this.draw();
        }
    }

    togglePlay() {
        if (this._playing) {
            this._stopLoop();
            return;
        }
        this._playing = true;
        const btn = document.getElementById('btn-play-ch1-agent-types');
        if (btn) btn.textContent = '⏸ 暂停';
        // If nothing selected yet, start from 0
        if (this.selectedIndex < 0) this.selectedIndex = this._cycleIndex % this.types.length;
        this._lastTickTime = 0;
        this._loop();
    }

    _stopLoop() {
        this._playing = false;
        if (this._rafId) cancelAnimationFrame(this._rafId);
        this._rafId = null;
        const btn = document.getElementById('btn-play-ch1-agent-types');
        if (btn) btn.textContent = '▶ 播放';
    }

    _loop() {
        if (!this._playing) return;
        const now = performance.now();
        if (!this._lastTickTime) this._lastTickTime = now;
        const interval = this.cycleInterval / (this.speed || 1);
        if (now - this._lastTickTime >= interval) {
            this._cycleIndex = (this._cycleIndex + 1) % this.types.length;
            this.selectedIndex = this._cycleIndex;
            this._lastTickTime = now;
        }
        this.draw();
        this._rafId = requestAnimationFrame(() => this._loop());
    }

    stepForward() {
        // Step pauses autoplay and advances to the next type
        if (this._playing) this._stopLoop();
        this._cycleIndex = (this.selectedIndex < 0 ? 0 : (this.selectedIndex + 1) % this.types.length);
        this.selectedIndex = this._cycleIndex;
        this.draw();
    }

    reset() {
        this._stopLoop();
        this._cycleIndex = 0;
        this.selectedIndex = -1;
        this.hoverIndex = -1;
        this.draw();
    }

    setSpeed(v) {
        this.speed = v;
    }

    play() {
        this.togglePlay();
    }

    pause() {
        if (this._playing) this._stopLoop();
    }

    step() {
        this.stepForward();
    }

    // ---- drawing helpers ----

    _drawNode(ctx, p, type, i) {
        const isSelected = i === this.selectedIndex;
        const isHover = i === this.hoverIndex;
        const baseR = this._nodeRadius();
        const r = baseR * (isSelected ? 1.12 : isHover ? 1.06 : 1);
        const isDark = this.isDarkTheme();

        // Soft halo (selected / hover)
        if (isSelected || isHover) {
            const haloR = r + 12;
            const halo = ctx.createRadialGradient(p.x, p.y, r * 0.6, p.x, p.y, haloR);
            const alpha = isSelected ? 0.35 : 0.2;
            halo.addColorStop(0, this._withAlpha(type.color, alpha));
            halo.addColorStop(1, this._withAlpha(type.color, 0));
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(p.x, p.y, haloR, 0, Math.PI * 2);
            ctx.fill();
        }

        // Drop shadow
        ctx.save();
        ctx.shadowColor = this._withAlpha(type.color, isDark ? 0.45 : 0.35);
        ctx.shadowBlur = isSelected ? 18 : 10;
        ctx.shadowOffsetY = isSelected ? 4 : 2;

        // Main body — radial gradient
        const grad = ctx.createRadialGradient(
            p.x - r * 0.35, p.y - r * 0.4, r * 0.15,
            p.x, p.y, r
        );
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(0.55, type.colorSoft);
        grad.addColorStop(1, type.color);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Border
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.strokeStyle = isSelected ? type.color : this._withAlpha('#000000', isDark ? 0.25 : 0.12);
        ctx.lineWidth = isSelected ? 3 : 1.5;
        ctx.stroke();

        // Number badge (top-left of node)
        const badgeR = Math.max(9, r * 0.28);
        const bx = p.x - r * 0.55;
        const by = p.y - r * 0.55;
        ctx.fillStyle = isDark ? '#0F172A' : '#FFFFFF';
        ctx.beginPath();
        ctx.arc(bx, by, badgeR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = type.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = type.color;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(i + 1), bx, by + 0.5);

        // Node short name (centered inside)
        ctx.fillStyle = isDark ? '#0F172A' : '#FFFFFF';
        ctx.font = 'bold ' + Math.max(11, r * 0.32) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(type.key, p.x, p.y + r * 0.45);
    }

    _drawConnectorLine(ctx, positions) {
        const isDark = this.isDarkTheme();
        const y = positions[0].y;
        ctx.beginPath();
        ctx.moveTo(positions[0].x, y);
        ctx.lineTo(positions[positions.length - 1].x, y);
        ctx.strokeStyle = isDark ? 'rgba(148,163,184,0.25)' : 'rgba(100,116,139,0.22)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        // "复杂度递增" label
        ctx.fillStyle = isDark ? '#94A3B8' : '#64748B';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText('复杂度递增 →', this.width - 12, y - 22);
    }

    _drawDetailCard(ctx, type, i) {
        const w = this.width;
        const h = this.height;
        const isDark = this.isDarkTheme();
        const textColor = isDark ? '#F1F5F9' : '#0F172A';
        const subColor = isDark ? '#94A3B8' : '#475569';
        const cardBg = isDark ? '#1E293B' : '#FFFFFF';
        const borderColor = isDark ? '#334155' : '#E2E8F0';

        const cardX = w * 0.04;
        const cardY = Math.max(this._getNodePositions()[0].y + this._nodeRadius() + 36, h * 0.42);
        const cardW = w * 0.92;
        const cardH = h - cardY - 14;

        // Card background
        ctx.save();
        ctx.shadowColor = this._withAlpha(type.color, isDark ? 0.35 : 0.25);
        ctx.shadowBlur = 16;
        ctx.shadowOffsetY = 4;
        ctx.fillStyle = cardBg;
        this.roundRect(ctx, cardX, cardY, cardW, cardH, 14);
        ctx.fill();
        ctx.restore();

        // Card border (accent on left edge)
        ctx.save();
        ctx.beginPath();
        this.roundRect(ctx, cardX, cardY, cardW, cardH, 14);
        ctx.clip();
        // Accent stripe
        ctx.fillStyle = type.color;
        ctx.fillRect(cardX, cardY, 6, cardH);
        // Subtle top-right glow
        const g = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY);
        g.addColorStop(0, this._withAlpha(type.color, 0));
        g.addColorStop(1, this._withAlpha(type.color, isDark ? 0.12 : 0.08));
        ctx.fillStyle = g;
        ctx.fillRect(cardX, cardY, cardW, cardH);
        ctx.restore();

        // Outer border line
        ctx.beginPath();
        this.roundRect(ctx, cardX, cardY, cardW, cardH, 14);
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Title row
        const padX = cardX + 22;
        let cursorY = cardY + 30;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        // Color chip
        ctx.fillStyle = type.color;
        this.roundRect(ctx, padX, cursorY - 12, 24, 24, 6);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(i + 1), padX + 12, cursorY);

        // Name + English
        ctx.textAlign = 'left';
        ctx.fillStyle = textColor;
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(type.name, padX + 36, cursorY - 1);
        ctx.fillStyle = subColor;
        ctx.font = '12px sans-serif';
        ctx.fillText('· ' + type.nameEn + ' · ' + type.key, padX + 36 + ctx.measureText(type.name).width + 6, cursorY - 1);

        // Two-column body: left = PEAS 2x2, right = example + relation
        const bodyTopY = cursorY + 22;
        const bodyH = cardH - (bodyTopY - cardY) - 16;
        const gap = 16;
        const leftW = Math.max(180, (cardW - 22 * 2 - gap) * 0.52);
        const rightW = (cardW - 22 * 2 - gap) - leftW;
        const leftX = padX;
        const rightX = leftX + leftW + gap;

        this._drawPeasGrid(ctx, leftX, bodyTopY, leftW, bodyH, type, textColor, subColor, isDark);
        this._drawRightPanel(ctx, rightX, bodyTopY, rightW, bodyH, type, textColor, subColor, isDark);
    }

    _drawPeasGrid(ctx, x, y, w, h, type, textColor, subColor, isDark) {
        // 2x2 grid: P | E
        //           A | S
        const gap = 8;
        const cellW = (w - gap) / 2;
        const cellH = (h - gap) / 2;
        const cells = [
            { key: 'P', full: 'Performance', cn: '性能', val: type.peas.P, accent: type.color },
            { key: 'E', full: 'Environment', cn: '环境', val: type.peas.E, accent: this._shade(type.color, -0.15) },
            { key: 'A', full: 'Actuators', cn: '执行器', val: type.peas.A, accent: this._shade(type.color, 0.1) },
            { key: 'S', full: 'Sensors', cn: '传感器', val: type.peas.S, accent: this._shade(type.color, -0.05) }
        ];
        for (let i = 0; i < 4; i++) {
            const cx = x + (i % 2) * (cellW + gap);
            const cy = y + Math.floor(i / 2) * (cellH + gap);
            this._drawPeasCell(ctx, cx, cy, cellW, cellH, cells[i], textColor, subColor, isDark);
        }
    }

    _drawPeasCell(ctx, x, y, w, h, cell, textColor, subColor, isDark) {
        const bgFill = isDark ? 'rgba(148,163,184,0.06)' : 'rgba(100,116,139,0.06)';
        ctx.fillStyle = bgFill;
        this.roundRect(ctx, x, y, w, h, 8);
        ctx.fill();
        // left accent bar
        ctx.fillStyle = cell.accent;
        ctx.fillRect(x, y, 3, h);

        // Big letter
        ctx.fillStyle = cell.accent;
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(cell.key, x + 12, y + 22);

        // CN + EN mini label
        ctx.fillStyle = subColor;
        ctx.font = '11px sans-serif';
        ctx.fillText(cell.cn + ' · ' + cell.full, x + 36, y + 22);

        // Value (wrapping)
        ctx.fillStyle = textColor;
        ctx.font = '12px sans-serif';
        const maxTextW = w - 16;
        const lines = this.wrapText(ctx, cell.val, 0, 0, maxTextW, 16);
        // render lines
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        const valueY = y + 42;
        const maxLines = Math.floor((h - 46) / 16);
        const visible = lines.slice(0, Math.max(1, maxLines));
        for (let i = 0; i < visible.length; i++) {
            ctx.fillText(visible[i], x + 10, valueY + i * 16);
        }
    }

    _drawRightPanel(ctx, x, y, w, h, type, textColor, subColor, isDark) {
        // Two stacked sections: 生活例子 / 和我有什么关系
        const sectionH = (h - 10) / 2;

        // 生活例子
        this._drawSection(ctx, x, y, w, sectionH, {
            label: '生活例子',
            icon: 'EX',
            text: type.example
        }, textColor, subColor, isDark, type.color);

        // 和我有什么关系
        this._drawSection(ctx, x, y + sectionH + 10, w, sectionH, {
            label: '和我有什么关系',
            icon: 'ME',
            text: type.relation
        }, textColor, subColor, isDark, type.color);
    }

    _drawSection(ctx, x, y, w, h, sec, textColor, subColor, isDark, accent) {
        const bgFill = isDark ? 'rgba(148,163,184,0.05)' : 'rgba(100,116,139,0.04)';
        ctx.fillStyle = bgFill;
        this.roundRect(ctx, x, y, w, h, 8);
        ctx.fill();

        // Icon tag (no emoji — text label inside colored chip)
        const chipW = 30;
        const chipH = 18;
        const cx = x + 10;
        const cy = y + 10;
        ctx.fillStyle = accent;
        this.roundRect(ctx, cx, cy, chipW, chipH, 4);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sec.icon, cx + chipW / 2, cy + chipH / 2 + 0.5);

        // Label
        ctx.fillStyle = textColor;
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(sec.label, cx + chipW + 8, cy + chipH / 2 + 0.5);

        // Body text (wrap)
        ctx.fillStyle = subColor;
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        const textX = x + 12;
        const textY = y + 38;
        const maxW = w - 24;
        const lineH = 18;
        const lines = this.wrapText(ctx, sec.text, 0, 0, maxW, lineH);
        const maxLines = Math.max(1, Math.floor((h - 44) / lineH));
        const visible = lines.slice(0, maxLines);
        for (let i = 0; i < visible.length; i++) {
            ctx.fillText(visible[i], textX, textY + i * lineH);
        }
    }

    _withAlpha(hex, alpha) {
        // hex like #RRGGBB
        if (typeof hex !== 'string' || hex[0] !== '#' || hex.length < 7) return hex;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    }

    _shade(hex, amount) {
        // amount in [-1, 1]: positive = lighten, negative = darken
        if (typeof hex !== 'string' || hex[0] !== '#' || hex.length < 7) return hex;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const t = amount < 0 ? 0 : 255;
        const p = Math.abs(amount);
        const nr = Math.round((t - r) * p + r);
        const ng = Math.round((t - g) * p + g);
        const nb = Math.round((t - b) * p + b);
        return '#' + [nr, ng, nb].map(v => v.toString(16).padStart(2, '0')).join('');
    }

    draw() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        const isDark = this.isDarkTheme();
        const bg = isDark ? '#0F172A' : '#F8FAFC';
        const textColor = isDark ? '#F1F5F9' : '#0F172A';
        const subColor = isDark ? '#94A3B8' : '#475569';

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        // Title
        ctx.fillStyle = textColor;
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('五种智能体类型 · 复杂度从左到右递增', 14, 12);

        // Cycle progress (top-right, visible during autoplay)
        if (this._playing) {
            ctx.fillStyle = subColor;
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText('自动演示中 · ' + (this.selectedIndex + 1) + ' / ' + this.types.length, w - 14, 14);
        }

        // Connector line
        const positions = this._getNodePositions();
        this._drawConnectorLine(ctx, positions);

        // Nodes
        for (let i = 0; i < this.types.length; i++) {
            this._drawNode(ctx, positions[i], this.types[i], i);
            // English label under node
            ctx.fillStyle = subColor;
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(this.types[i].nameEn, positions[i].x, positions[i].y + this._nodeRadius() + 10);
        }

        // Detail card or instruction
        if (this.selectedIndex >= 0) {
            this._drawDetailCard(ctx, this.types[this.selectedIndex], this.selectedIndex);
        } else {
            this._drawEmptyHint(ctx, w, h, subColor);
        }
    }

    _drawEmptyHint(ctx, w, h, subColor) {
        const cardX = w * 0.04;
        const cardY = Math.max(this._getNodePositions()[0].y + this._nodeRadius() + 36, h * 0.42);
        const cardW = w * 0.92;
        const cardH = h - cardY - 14;
        const isDark = this.isDarkTheme();
        const cardBg = isDark ? '#1E293B' : '#FFFFFF';
        const borderColor = isDark ? '#334155' : '#E2E8F0';
        const textColor = isDark ? '#F1F5F9' : '#0F172A';

        ctx.fillStyle = cardBg;
        this.roundRect(ctx, cardX, cardY, cardW, cardH, 14);
        ctx.fill();
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Big hint
        ctx.fillStyle = textColor;
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const cy = cardY + cardH / 2 - 18;
        ctx.fillText('点击上方任意节点，查看 PEAS 详情', w / 2, cy);

        // Sub-hint
        ctx.fillStyle = subColor;
        ctx.font = '13px sans-serif';
        ctx.fillText('或按 "▶ 播放" 自动轮播 5 种类型  ·  "下一步" 手动切换', w / 2, cy + 28);

        // Tiny legend
        ctx.font = '12px sans-serif';
        ctx.fillText('提示：圆点下方写的是英文名 · 圆点内是该类型的"一句话特点"', w / 2, cy + 52);
    }
}

registerAnimation('ch1-agent-types', () => new Ch1AgentTypes());

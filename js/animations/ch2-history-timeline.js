/**
 * CH2: History Timeline Animation
 * Interactive timeline of AI Agent development milestones
 */
const Ch2HistoryTimeline = {
    canvas: null, ctx: null, width: 0, height: 0,
    selectedIndex: -1,
    hoverIndex: -1,

    milestones: [
        { year: '1950', title: '图灵测试', desc: '图灵提出"机器能否思考"的判定标准，开创AI思想先河。' },
        { year: '1956', title: '达特茅斯会议', desc: 'AI学科正式诞生。麦卡锡、明斯基等科学家齐聚，符号主义兴起。' },
        { year: '1966', title: 'ELIZA', desc: '魏泽鲍姆开发首个对话程序。基于模式匹配的聊天机器人，产生著名的"ELIZA效应"。' },
        { year: '1980s', title: '专家系统', desc: 'MYCIN、XCON等专家系统实现商业化成功。知识库+推理机的符号AI达到鼎盛。' },
        { year: '1997', title: 'Deep Blue', desc: 'IBM深蓝击败国际象棋世界冠军卡斯帕罗夫，符号主义+搜索算法的重大胜利。' },
        { year: '2016', title: 'AlphaGo', desc: 'DeepMind AlphaGo击败围棋世界冠军李世石。强化学习+深度学习的里程碑。' },
        { year: '2017', title: 'Transformer', desc: 'Google发表"Attention Is All You Need"，提出Transformer架构，LLM时代基石。' },
        { year: '2022', title: 'ChatGPT', desc: 'OpenAI发布ChatGPT，LLM驱动的对话智能体引爆全球AI热潮。' },
        { year: '2023', title: 'AutoGPT', desc: '自主LLM Agent框架兴起，推动Agent技术栈大爆发。' }
    ],

    // Color for each era
    getEraColor(i) {
        const isDark = this._isDarkTheme();
        if (i <= 1) return isDark ? '#60A5FA' : '#3B82F6';      // Blue: early AI
        if (i <= 4) return isDark ? '#F59E0B' : '#D97706';      // Amber: symbolism
        if (i <= 5) return isDark ? '#10B981' : '#059669';      // Green: RL era
        return isDark ? '#A78BFA' : '#7C3AED';                   // Purple: LLM era
    },

    getEraLabel(i) {
        if (i <= 1) return '萌芽期';
        if (i <= 4) return '符号主义';
        if (i <= 5) return '深度学习';
        return 'LLM时代';
    },

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this._setupControls();
        this._resize();
        window.addEventListener('resize', () => this._resize());
        this.draw();
    },

    _resize() {
        if (!this.canvas) return;
        const container = this.canvas.parentElement;
        const dpr = window.devicePixelRatio || 1;
        const logicalW = container.clientWidth;
        const logicalH = container.clientHeight || 420;
        this.canvas.style.width = logicalW + 'px';
        this.canvas.style.height = logicalH + 'px';
        this.canvas.width = logicalW * dpr;
        this.canvas.height = logicalH * dpr;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.width = logicalW;
        this.height = logicalH;
        this.draw();
    },

    _setupControls() {
        this.canvas.addEventListener('click', (e) => this._handleClick(e));
        this.canvas.addEventListener('mousemove', (e) => this._handleHover(e));
        this.canvas.addEventListener('mouseleave', () => {
            this.hoverIndex = -1;
            this.canvas.style.cursor = 'default';
            this.draw();
        });
    },

    _getPositions() {
        const w = this.width;
        const h = this.height;
        const count = this.milestones.length;
        const positions = [];
        const margin = 50;
        const usableW = w - margin * 2;
        const spacing = usableW / (count - 1);
        const timelineY = h * 0.42;

        for (let i = 0; i < count; i++) {
            const x = margin + i * spacing;
            // Alternate nodes above/below timeline
            const yOff = (i % 2 === 0) ? -50 : 50;
            positions.push({ x, y: timelineY, labelY: timelineY + yOff });
        }
        return positions;
    },

    _handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const positions = this._getPositions();
        const hitR = 18;

        for (let i = positions.length - 1; i >= 0; i--) {
            const p = positions[i];
            const dx = x - p.x;
            const dy = y - p.y;
            if (Math.sqrt(dx * dx + dy * dy) <= hitR) {
                this.selectedIndex = this.selectedIndex === i ? -1 : i;
                this.draw();
                return;
            }
        }
        // Click on background: deselect
        this.selectedIndex = -1;
        this.draw();
    },

    _handleHover(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const positions = this._getPositions();
        const hitR = 18;
        let found = -1;

        for (let i = positions.length - 1; i >= 0; i--) {
            const p = positions[i];
            const dx = x - p.x;
            const dy = y - p.y;
            if (Math.sqrt(dx * dx + dy * dy) <= hitR) {
                found = i;
                break;
            }
        }

        if (found !== this.hoverIndex) {
            this.hoverIndex = found;
            this.canvas.style.cursor = found >= 0 ? 'pointer' : 'default';
            this.draw();
        }
    },

    _isDarkTheme() {
        return document.documentElement.getAttribute('data-theme') === 'dark';
    },

    _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    },

    _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split('');
        let line = '';
        const lines = [];
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n];
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
                lines.push(line);
                line = words[n];
            } else {
                line = testLine;
            }
        }
        lines.push(line);
        const totalH = lines.length * lineHeight;
        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], x, y - totalH / 2 + (i + 0.5) * lineHeight);
        }
    },

    draw() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        const isDark = this._isDarkTheme();
        const bg = isDark ? '#1E293B' : '#F8FAFC';
        const textColor = isDark ? '#F8FAFC' : '#0F172A';
        const subTextColor = isDark ? '#CBD5E1' : '#475569';
        const cardBg = isDark ? '#334155' : '#FFFFFF';
        const borderColor = isDark ? '#475569' : '#E2E8F0';

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        const positions = this._getPositions();
        const timelineY = positions[0].y;
        const nodeR = Math.min(16, w * 0.018);
        const labelOffset = 30;

        // Era background bands
        const eraColors = [
            isDark ? 'rgba(96,165,250,0.06)' : 'rgba(59,130,246,0.05)',
            isDark ? 'rgba(245,158,11,0.06)' : 'rgba(217,119,6,0.05)',
            isDark ? 'rgba(16,185,129,0.06)' : 'rgba(5,150,105,0.05)',
            isDark ? 'rgba(167,139,250,0.06)' : 'rgba(124,58,237,0.05)'
        ];

        // Draw horizontal timeline line
        ctx.beginPath();
        ctx.moveTo(positions[0].x, timelineY);
        ctx.lineTo(positions[positions.length - 1].x, timelineY);
        ctx.strokeStyle = isDark ? '#475569' : '#CBD5E1';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw nodes and labels
        for (let i = 0; i < positions.length; i++) {
            const p = positions[i];
            const isSelected = i === this.selectedIndex;
            const isHover = i === this.hoverIndex;
            const color = this.getEraColor(i);
            const r = isSelected ? nodeR * 1.4 : (isHover ? nodeR * 1.2 : nodeR);

            // Connection line from node to label
            const labelDir = (i % 2 === 0) ? -1 : 1;
            const labelY = timelineY + labelDir * labelOffset;

            ctx.beginPath();
            ctx.moveTo(p.x, timelineY);
            ctx.lineTo(p.x, labelY);
            ctx.strokeStyle = isSelected ? color : (isDark ? '#475569' : '#CBD5E1');
            ctx.lineWidth = isSelected ? 2 : 1.5;
            ctx.stroke();

            // Glow effect for selected/hover
            if (isSelected || isHover) {
                ctx.beginPath();
                ctx.arc(p.x, timelineY, r + 8, 0, Math.PI * 2);
                ctx.fillStyle = color + '30';
                ctx.fill();
            }

            // Node circle
            ctx.beginPath();
            ctx.arc(p.x, timelineY, r, 0, Math.PI * 2);
            const grad = ctx.createRadialGradient(p.x - r * 0.3, timelineY - r * 0.3, r * 0.1, p.x, timelineY, r);
            grad.addColorStop(0, '#FFFFFF');
            grad.addColorStop(1, color);
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.strokeStyle = isSelected ? '#FFFFFF' : borderColor;
            ctx.lineWidth = isSelected ? 3 : 2;
            ctx.stroke();

            // Year label above/below
            ctx.fillStyle = isSelected ? color : subTextColor;
            ctx.font = (isSelected ? 'bold ' : '') + Math.max(11, Math.min(13, w * 0.014)) + 'px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = labelDir === -1 ? 'bottom' : 'top';
            ctx.fillText(this.milestones[i].year, p.x, labelY + labelDir * -4);

            // Title label
            const titleY = labelY + labelDir * (labelOffset + 4);
            ctx.fillStyle = isSelected ? textColor : subTextColor;
            ctx.font = (isSelected ? 'bold ' : '') + Math.max(10, Math.min(12, w * 0.013)) + 'px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = labelDir === -1 ? 'bottom' : 'top';
            ctx.fillText(this.milestones[i].title, p.x, titleY + labelDir * 4);
        }

        // Detail panel for selected item
        if (this.selectedIndex >= 0) {
            const ms = this.milestones[this.selectedIndex];
            const panelX = w * 0.06;
            const panelW = w * 0.88;
            const panelY = h * 0.52;
            const panelH = h * 0.38;

            // Card background
            ctx.fillStyle = cardBg;
            ctx.strokeStyle = this.getEraColor(this.selectedIndex);
            ctx.lineWidth = 2;
            this._roundRect(ctx, panelX, panelY, panelW, panelH, 12);
            ctx.fill();
            ctx.stroke();

            // Era badge
            const eraLabel = this.getEraLabel(this.selectedIndex);
            const eraColor = this.getEraColor(this.selectedIndex);
            ctx.fillStyle = eraColor + '40';
            this._roundRect(ctx, panelX + 16, panelY + 16, 70, 26, 13);
            ctx.fill();
            ctx.fillStyle = textColor;
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(eraLabel, panelX + 51, panelY + 29);

            // Title
            ctx.fillStyle = textColor;
            ctx.font = 'bold 18px sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
            const titleStr = ms.year + ' — ' + ms.title;
            ctx.fillText(titleStr, panelX + 100, panelY + 36);

            // Description
            ctx.fillStyle = subTextColor;
            ctx.font = '14px sans-serif';
            const descX = panelX + 16;
            const descY = panelY + 80;
            const maxTextW = panelW - 40;
            const lines = this._wrapText(ctx, ms.desc, descX, descY, maxTextW, 20);
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            let lineY = descY;
            for (const line of lines) {
                ctx.fillText(line, descX, lineY);
                lineY += 22;
            }
        } else {
            // Instruction
            ctx.fillStyle = subTextColor;
            ctx.font = '13px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText('点击时间节点查看详情 · 从符号主义到LLM Agent的演进历程', w / 2, h - 20);
        }

        // Era legend at top
        const legendY = 16;
        const legendItems = [
            { label: '萌芽期', color: isDark ? '#60A5FA' : '#3B82F6' },
            { label: '符号主义', color: isDark ? '#F59E0B' : '#D97706' },
            { label: '深度学习', color: isDark ? '#10B981' : '#059669' },
            { label: 'LLM时代', color: isDark ? '#A78BFA' : '#7C3AED' }
        ];
        let legendX = w / 2 - (legendItems.length * 70);
        for (const item of legendItems) {
            ctx.fillStyle = item.color;
            ctx.fillRect(legendX, legendY, 12, 12);
            ctx.fillStyle = subTextColor;
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(item.label, legendX + 18, legendY);
            legendX += 90;
        }
    }
};

window.Animations = window.Animations || {};
window.Animations['ch2-history-timeline'] = Ch2HistoryTimeline;

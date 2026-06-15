/**
 * CH1: Agent Types Animation
 * Visualizes the five classic agent types with interactive click-to-view details
 */
const Ch1AgentTypes = {
    canvas: null, ctx: null, width: 0, height: 0,
    selectedIndex: -1,
    hoverIndex: -1,

    types: [
        {
            name: '简单反射型',
            nameEn: 'Simple Reflex',
            color: '#93C5FD',
            desc: '根据当前感知直接选择行动，不考虑历史，规则简单。',
            example: '恒温器：感知温度 → 开/关 空调',
            key: '只看现在'
        },
        {
            name: '模型反射型',
            nameEn: 'Model-Based Reflex',
            color: '#A78BFA',
            desc: '维护内部状态（世界模型，记录部分历史感知以处理部分不可见的信息。',
            example: '自动驾驶：记录上一帧障碍物位置以推断当前状态',
            key: '有记忆'
        },
        {
            name: '目标驱动型',
            nameEn: 'Goal-Based',
            color: '#F9A8D4',
            desc: '以目标为导向，通过规划达成目标，行动有明确方向。',
            example: '导航系统：终点目标 → 搜索最短路径',
            key: '有目标'
        },
        {
            name: '效用驱动型',
            nameEn: 'Utility-Based',
            color: '#86EFAC',
            desc: '在多个冲突目标间权衡，选择期望效用最大的行动。',
            example: '订餐助手：价格、距离、评分多维度综合决策',
            key: '会权衡'
        },
        {
            name: '学习型',
            nameEn: 'Learning Agent',
            color: '#FCD34D',
            desc: '从经验中学习，通过反馈改进未来决策。',
            example: '推荐系统：根据用户点击不断优化推荐',
            key: '会进化'
        }
    ],

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
        // Register click on canvas
        this.canvas.addEventListener('click', (e) => this._handleClick(e));
        this.canvas.addEventListener('mousemove', (e) => this._handleHover(e));
        this.canvas.addEventListener('mouseleave', () => {
            this.hoverIndex = -1;
            this.draw();
        });
    },

    _getPositions() {
        const w = this.width, h = this.height;
        const topY = h * 0.32;
        const botY = h * 0.68;
        const positions = [
            { x: w * 0.2, y: topY },
            { x: w * 0.5, y: topY },
            { x: w * 0.8, y: topY },
            { x: w * 0.35, y: botY },
            { x: w * 0.65, y: botY }
        ];
        return positions;
    },

    _handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const positions = this._getPositions();
        const radius = Math.min(55, this.width * 0.08);
        let found = -1;
        positions.forEach((p, i) => {
            const dx = x - p.x;
            const dy = y - p.y;
            if (Math.sqrt(dx * dx + dy * dy) <= radius) found = i;
        });
        this.selectedIndex = this.selectedIndex === found ? -1 : found;
        this.draw();
    },

    _handleHover(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const positions = this._getPositions();
        const radius = Math.min(55, this.width * 0.08);
        let found = -1;
        positions.forEach((p, i) => {
            const dx = x - p.x;
            const dy = y - p.y;
            if (Math.sqrt(dx * dx + dy * dy) <= radius) found = i;
        });
        if (found !== this.hoverIndex) {
            this.hoverIndex = found;
            this.canvas.style.cursor = found >= 0 ? 'pointer' : 'default';
            this.draw();
        }
    },

    _isDarkTheme() {
        return document.documentElement.getAttribute('data-theme') === 'dark';
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
        const radius = Math.min(55, w * 0.08);

        // Draw connecting lines (suggesting progression)
        ctx.strokeStyle = isDark ? 'rgba(139,92,246,0.25)' : 'rgba(79,70,229,0.2)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 6]);
        for (let i = 0; i < positions.length - 1; i++) {
            const a = positions[i];
            const b = positions[i + 1];
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
        }
        ctx.setLineDash([]);

        // Draw circles
        this.types.forEach((type, i) => {
            const p = positions[i];
            const isSelected = i === this.selectedIndex;
            const isHover = i === this.hoverIndex;
            const scale = isSelected ? 1.15 : (isHover ? 1.08 : 1);
            const r = radius * scale;

            // Glow
            if (isSelected || isHover) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, r + 10, 0, Math.PI * 2);
                ctx.fillStyle = isDark ? 'rgba(139,92,246,0.2)' : 'rgba(79,70,229,0.15)';
                ctx.fill();
            }

            // Circle
            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            const grad = ctx.createRadialGradient(p.x - r * 0.3, p.y - r * 0.3, r * 0.2, p.x, p.y, r);
            grad.addColorStop(0, '#FFFFFF');
            grad.addColorStop(1, type.color);
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.strokeStyle = isSelected ? '#4F46E5' : '#374151';
            ctx.lineWidth = isSelected ? 3 : 2;
            ctx.stroke();

            // Name (short)
            ctx.fillStyle = textColor;
            ctx.font = 'bold 13px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            this._wrapText(ctx, type.name, p.x, p.y, r * 1.6, 16);
        });

        // Bottom area or Detail panel
        if (this.selectedIndex >= 0) {
            const type = this.types[this.selectedIndex];
            const panelX = w * 0.05;
            const panelY = h * 0.08;
            const panelW = w * 0.9;
            const panelH = 110;

            // Card
            ctx.fillStyle = cardBg;
            ctx.strokeStyle = type.color;
            ctx.lineWidth = 2;
            this._roundRect(ctx, panelX, panelY, panelW, panelH, 12);
            ctx.fill();
            ctx.stroke();

            // Badge
            ctx.fillStyle = type.color;
            this._roundRect(ctx, panelX + 16, panelY + 16, 70, 24, 12);
            ctx.fill();
            ctx.fillStyle = '#1F2937';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(type.key, panelX + 51, panelY + 28);

            // Title
            ctx.fillStyle = textColor;
            ctx.font = 'bold 18px sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText(type.name + ' (' + type.nameEn + ')', panelX + 100, panelY + 36);

            // Description
            ctx.fillStyle = subTextColor;
            ctx.font = '13px sans-serif';
            ctx.fillText('• ' + type.desc, panelX + 16, panelY + 62);
            ctx.fillStyle = textColor;
            ctx.font = '13px sans-serif';
            ctx.fillText('• 例子：' + type.example, panelX + 16, panelY + 88);
        } else {
            // Instruction
            ctx.fillStyle = subTextColor;
            ctx.font = '13px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('点击上方类型查看详情 · 智能体复杂度从左到右、从上到下递增', w / 2, h - 18);
        }
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
    }
};
window.Animations = window.Animations || {};
window.Animations['ch1-agent-types'] = Ch1AgentTypes;

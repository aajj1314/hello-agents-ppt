/**
 * CH14: DeepResearch - Task Decomposition Tree
 * Animated Canvas showing recursive task expansion and parallel retrieval
 */
import { CanvasAnimation } from './canvas-animation.js';
import { registerAnimation } from './animation-registry.js';

class Ch14TaskTree extends CanvasAnimation {
    constructor() {
        super();
        this.expandLevel = 0;
        this.maxExpandLevel = 3;
        this.progress = 0;
        this._playing = false;
        this._rafId = null;
        this.speed = 1;
    }

    init(canvas) {
        super.init(canvas);
        this._setupControls();
        window.addEventListener('resize', () => { this._resize(); this.draw(); });
        this.draw();
    }

    _setupControls() {
        const animId = 'ch14-task-tree';
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
    }

    togglePlay() {
        if (this._playing) {
            this._playing = false;
            cancelAnimationFrame(this._rafId);
            const btn = document.getElementById('btn-play-ch14-task-tree');
            if (btn) btn.textContent = '▶ 播放';
            return;
        }
        this._playing = true;
        const btn = document.getElementById('btn-play-ch14-task-tree');
        if (btn) btn.textContent = '⏸ 暂停';
        this._loop();
    }

    _loop() {
        if (!this._playing) return;
        this.progress += 0.01 * (this.speed || 1);
        if (this.progress >= 1) {
            this.progress = 0;
            this.expandLevel = Math.min(this.expandLevel + 1, this.maxExpandLevel);
            if (this.expandLevel >= this.maxExpandLevel) {
                this._playing = false;
                cancelAnimationFrame(this._rafId);
                const btn = document.getElementById('btn-play-ch14-task-tree');
                if (btn) btn.textContent = '▶ 播放';
                return;
            }
        }
        this.draw();
        this._rafId = requestAnimationFrame(() => this._loop());
    }

    stepForward() {
        this.progress = 0;
        this.expandLevel = Math.min(this.expandLevel + 1, this.maxExpandLevel);
        this.draw();
    }

    reset() {
        this._playing = false;
        cancelAnimationFrame(this._rafId);
        this.expandLevel = 0;
        this.progress = 0;
        const btn = document.getElementById('btn-play-ch14-task-tree');
        if (btn) btn.textContent = '▶ 播放';
        this.draw();
    }

    setSpeed(v) {
        this.speed = v;
    }

    play() {
        this._playing = true;
        this._loop();
    }

    step() {
        this.stepForward();
    }

    draw() {
        const ctx = this.ctx, w = this.width, h = this.height;
        const dark = this.isDarkTheme();
        const bg = dark ? '#0F172A' : '#F8FAFC';
        const textColor = dark ? '#F1F5F9' : '#0F172A';
        const subColor = dark ? '#94A3B8' : '#475569';

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        // Define tree node data
        const rootLabel = '研究主题';
        const level1Labels = ['任务A\n信息收集', '任务B\n资料分析', '任务C\n报告撰写'];
        const level2Labels = [
            ['搜索\n文献', '阅读\n摘要', '整理\n笔记'],
            ['数据\n清洗', '模式\n识别', '结论\n提炼'],
            ['大纲\n规划', '内容\n填充', '格式\n校对'],
            ['引用\n追溯', '事实\n核查', '交叉\n验证']
        ];

        // Layout positions
        const rootX = w / 2;
        const rootY = 55;

        // Draw root node
        this._drawNode(ctx, rootX, rootY, rootLabel, '#6366F1', true, dark);

        if (this.expandLevel >= 1) {
            const l1Y = 140;
            const l1Spacing = w / 4;

            for (let i = 0; i < 3; i++) {
                const x = w * (0.25 + i * 0.25);
                // Draw connection line
                this._drawConnection(ctx, rootX, rootY + 25, x, l1Y - 25, '#6366F1', dark);

                const colors = ['#3B82F6', '#10B981', '#F59E0B'];
                this._drawNode(ctx, x, l1Y, level1Labels[i], colors[i], false, dark);
            }
        }

        if (this.expandLevel >= 2) {
            const l2Y = 230;
            const l1Positions = [w * 0.25, w * 0.5, w * 0.75];

            for (let group = 0; group < 3; group++) {
                const px = l1Positions[group];
                const colors = ['#3B82F6', '#10B981', '#F59E0B'];
                const groupColors = [];

                for (let j = 0; j < 3; j++) {
                    groupColors.push(this._lightenColor(colors[group], j * 0.15));
                }

                const count = level2Labels[group].length;
                const spacing = Math.min(90, (w * 0.22) / count);

                for (let j = 0; j < count; j++) {
                    const x = px - (count - 1) * spacing / 2 + j * spacing;
                    // Clamp to visible area
                    const clampedX = Math.max(40, Math.min(w - 40, x));

                    if (j < 3) {
                        this._drawConnection(ctx, px, l1Y + 25, clampedX, l2Y - 25, colors[group], dark);
                        this._drawNode(ctx, clampedX, l2Y, level2Labels[group][j], groupColors[j], false, dark);
                    }
                }
            }
        }

        if (this.expandLevel >= 3) {
            const l3Y = 320;
            const l2Positions = [];

            // Calculate level 2 positions
            const l1Pos = [w * 0.25, w * 0.5, w * 0.75];
            for (let g = 0; g < 3; g++) {
                const px = l1Pos[g];
                const spacing = Math.min(90, w * 0.22 / 3);
                for (let j = 0; j < 3; j++) {
                    const x = px - (2) * spacing / 2 + j * spacing;
                    l2Positions.push(Math.max(40, Math.min(w - 40, x)));
                }
            }

            const l3Labels = [
                '并行\n检索', '摘要\n提取', '关键\n发现',
                '统计\n分析', '趋势\n挖掘', '关联\n发现',
                '引言\n撰写', '方法\n说明', '结果\n呈现',
                '深度\n阅读', '溯源\n验证', '质量\n评估',
                '综合\n分析', '交叉\n验证', '最终\n输出'
            ];

            const l3Spacing = Math.min(80, (w - 40) / 6);
            for (let j = 0; j < Math.min(12, l3Labels.length); j++) {
                const x = 35 + j * l3Spacing;
                if (x > w - 35) break;

                const parentIdx = Math.floor(j / 3);
                if (parentIdx < l2Positions.length) {
                    this._drawConnection(ctx, l2Positions[parentIdx], 255, x, l3Y - 25, '#8B5CF6', dark);
                }
                this._drawLeafNode(ctx, x, l3Y, l3Labels[j], dark);
            }
        }

        // Phase indicator
        const phaseLabels = ['根任务', '子任务分解', '任务展开', '并行执行'];
        ctx.fillStyle = textColor;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('展开阶段 ' + (this.expandLevel + 1) + '/4: ' + phaseLabels[this.expandLevel], w / 2, h - 8);

        // Footer
        ctx.fillStyle = subColor;
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('递归任务分解 | 点击"下一步"逐步展开', 10, h - 8);
    }

    _drawNode(ctx, x, y, label, color, isRoot, dark) {
        const r = isRoot ? 28 : 22;
        const lines = label.split('\n');
        const textH = lines.length * 13;

        // Glow
        if (isRoot) {
            ctx.beginPath();
            ctx.arc(x, y, r + 6, 0, Math.PI * 2);
            ctx.fillStyle = color + '30';
            ctx.fill();
        }

        // Rounded rect for multi-line
        const rectW = isRoot ? 80 : 64;
        const rectH = isRoot ? textH + 20 : textH + 16;
        this.roundRect(ctx, x - rectW / 2, y - rectH / 2, rectW, rectH, 8);
        ctx.fillStyle = isRoot ? color : (dark ? '#1E293B' : '#FFFFFF');
        ctx.fill();

        if (!isRoot) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        ctx.fillStyle = isRoot ? '#FFFFFF' : (dark ? '#F1F5F9' : '#0F172A');
        ctx.font = (isRoot ? 'bold 12px' : '10px') + ' sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        lines.forEach((line, i) => {
            const offset = (i - (lines.length - 1) / 2) * 13;
            ctx.fillText(line, x, y + offset);
        });
    }

    _drawLeafNode(ctx, x, y, label, dark) {
        const r = 18;
        const lines = label.split('\n');

        this.roundRect(ctx, x - 36, y - r, 72, 36, 6);
        ctx.fillStyle = dark ? '#1E293B' : '#FFFFFF';
        ctx.fill();
        ctx.strokeStyle = '#8B5CF6';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = dark ? '#F1F5F9' : '#0F172A';
        ctx.font = '8px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        lines.forEach((line, i) => {
            const offset = (i - (lines.length - 1) / 2) * 10;
            ctx.fillText(line, x, y + offset);
        });
    }

    _drawConnection(ctx, x1, y1, x2, y2, color, dark) {
        ctx.beginPath();
        const midY = (y1 + y2) / 2;

        // Bezier curve
        ctx.moveTo(x1, y1);
        ctx.bezierCurveTo(x1, midY, x2, midY, x2, y2);
        ctx.strokeStyle = dark ? color + '66' : color + '44';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Small dot at child
        ctx.beginPath();
        ctx.arc(x2, y2, 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
    }

    _lightenColor(hex, amount) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.min(255, Math.floor(((num >> 16) & 255) + 255 * amount));
        const g = Math.min(255, Math.floor(((num >> 8) & 255) + 255 * amount));
        const b = Math.min(255, Math.floor((num & 255) + 255 * amount));
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
}

registerAnimation('ch14-task-tree', () => new Ch14TaskTree());

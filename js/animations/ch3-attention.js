/**
 * CH3: Attention Heatmap Animation
 * Visualizes self-attention weight matrix as an interactive heatmap
 */
const Ch3Attention = {
    canvas: null, ctx: null, width: 0, height: 0,
    hoverCol: -1,
    isAnimating: false,
    animFrame: null,
    animPhase: 0, // 0-1 for pulse animation

    sentence: ['The', 'agent', 'learns', 'because', 'it', 'is', 'intelligent'],

    // Pre-computed attention weights (symmetric, showing "it" attends to "agent" strongly)
    // Row = from token, Col = to token
    getAttnWeights() {
        // Simulate realistic attention patterns
        const n = this.sentence.length;
        const w = [];
        for (let i = 0; i < n; i++) {
            w[i] = [];
            for (let j = 0; j < n; j++) {
                // Self-attention is always high
                if (i === j) {
                    w[i][j] = 0.3 + Math.random() * 0.15;
                    continue;
                }
                // "it" (index 4) attends strongly to "agent" (index 1) - pronoun resolution
                if (i === 4 && j === 1) { w[i][j] = 0.7 + Math.random() * 0.1; continue; }
                if (i === 4 && j === 5) { w[i][j] = 0.3 + Math.random() * 0.1; continue; } // "is"
                if (i === 4 && j === 6) { w[i][j] = 0.2 + Math.random() * 0.1; continue; } // "intelligent"
                // "agent" (index 1) attends to "the" (0) and "learns" (2)
                if (i === 1 && (j === 0 || j === 2)) { w[i][j] = 0.3 + Math.random() * 0.1; continue; }
                // "intelligent" (6) attends back to "it" (4) and "agent" (1)
                if (i === 6 && (j === 4 || j === 1)) { w[i][j] = 0.25 + Math.random() * 0.1; continue; }
                // "learns" (2) attends to "agent" (1) - subject-verb
                if (i === 2 && j === 1) { w[i][j] = 0.4 + Math.random() * 0.1; continue; }
                // "because" (3) connects what follows
                if (i === 3 && (j === 4 || j === 6)) { w[i][j] = 0.3 + Math.random() * 0.1; continue; }

                // Default low weight
                w[i][j] = 0.02 + Math.random() * 0.08;
            }
        }
        return w;
    },

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.attnWeights = this.getAttnWeights();
        this._setupControls();
        this._resize();
        window.addEventListener('resize', () => this._resize());
        this._startAnimation();
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
        this.canvas.addEventListener('mousemove', (e) => this._handleHover(e));
        this.canvas.addEventListener('mouseleave', () => {
            this.hoverCol = -1;
            this.draw();
        });
        this.canvas.addEventListener('click', (e) => this._handleClick(e));

        // Control buttons
        const animId = 'ch3-attention';
        const playBtn = document.getElementById('btn-play-' + animId);
        const resetBtn = document.getElementById('btn-reset-' + animId);
        if (playBtn) playBtn.addEventListener('click', () => this._toggleAnimation());
        if (resetBtn) resetBtn.addEventListener('click', () => this._resetAnimation());
    },

    _startAnimation() {
        this.isAnimating = true;
        this._animLoop();
    },

    _animLoop() {
        if (!this.isAnimating) return;
        this.animPhase = (this.animPhase + 0.008) % 1;
        this.draw();
        this.animFrame = requestAnimationFrame(() => this._animLoop());
    },

    _toggleAnimation() {
        this.isAnimating = !this.isAnimating;
        const btn = document.getElementById('btn-play-ch3-attention');
        if (btn) btn.textContent = this.isAnimating ? '⏸ 暂停' : '▶ 播放';
        if (this.isAnimating) this._animLoop();
        else if (this.animFrame) cancelAnimationFrame(this.animFrame);
    },

    _resetAnimation() {
        this.hoverCol = -1;
        this.animPhase = 0;
        this.attnWeights = this.getAttnWeights();
        this.draw();
    },

    _handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const { gridX, gridY, cellSize } = this._getGridLayout();

        for (let i = 0; i < this.sentence.length; i++) {
            const cx = gridX + i * (cellSize + 2);
            const cy = gridY + i * (cellSize + 2);
            if (mx >= cx && mx <= cx + cellSize && my >= cy && my <= cy + cellSize) {
                // Regenerate with a focus on this token
                this._regenerateWithFocus(i);
                this.draw();
                return;
            }
        }
    },

    _regenerateWithFocus(focusIdx) {
        const n = this.sentence.length;
        const w = [];
        for (let i = 0; i < n; i++) {
            w[i] = [];
            for (let j = 0; j < n; j++) {
                if (i === j) {
                    w[i][j] = 0.3 + Math.random() * 0.15;
                    continue;
                }
                // Focus token attends strongly to related tokens
                if (i === focusIdx) {
                    const dist = Math.abs(j - focusIdx);
                    w[i][j] = Math.max(0.05, 0.6 - dist * 0.12 + Math.random() * 0.08);
                    continue;
                }
                // Other tokens attend more to the focus token
                if (j === focusIdx) {
                    w[i][j] = 0.3 + Math.random() * 0.15;
                    continue;
                }
                w[i][j] = 0.02 + Math.random() * 0.08;
            }
        }
        this.attnWeights = w;
    },

    _handleHover(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const { gridX, gridY, cellSize } = this._getGridLayout();

        // Check hover on column labels (top)
        const labelY = gridY - 28;
        const labelH = 20;
        let found = -1;
        for (let i = 0; i < this.sentence.length; i++) {
            const lx = gridX + i * (cellSize + 2) + cellSize / 2;
            if (mx >= lx - cellSize / 2 - 4 && mx <= lx + cellSize / 2 + 4 &&
                my >= labelY && my <= labelY + labelH) {
                found = i;
                break;
            }
        }

        if (found !== this.hoverCol) {
            this.hoverCol = found;
            this.canvas.style.cursor = found >= 0 ? 'pointer' : 'default';
            this.draw();
        }
    },

    _getGridLayout() {
        const w = this.width;
        const h = this.height;
        const n = this.sentence.length;
        const availableW = Math.min(w * 0.55, 320);
        const cellSize = Math.floor((availableW - (n - 1) * 2) / n);
        const gridW = n * (cellSize + 2);
        const gridX = (w - gridW) / 2 + 40;
        const gridY = (h - gridW) / 2 + 10;
        return { gridX, gridY, cellSize, gridW };
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

    _getHeatColor(value, isDark) {
        // Blue-ish heatmap: low = dark/transparent, high = bright cyan/blue
        const r = Math.floor(30 + value * 180);
        const g = Math.floor(80 + value * 150);
        const b = Math.floor(200 + value * 55);
        if (isDark) {
            return `rgba(${r}, ${g}, ${b}, ${0.4 + value * 0.5})`;
        }
        return `rgba(${r - 20}, ${g - 20}, ${b - 20}, ${0.3 + value * 0.65})`;
    },

    draw() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        const isDark = this._isDarkTheme();
        const bg = isDark ? '#1E293B' : '#F8FAFC';
        const textColor = isDark ? '#F8FAFC' : '#0F172A';
        const subTextColor = isDark ? '#CBD5E1' : '#475569';
        const borderColor = isDark ? '#475569' : '#E2E8F0';

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        const n = this.sentence.length;
        const { gridX, gridY, cellSize } = this._getGridLayout();

        // Title
        ctx.fillStyle = textColor;
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('自注意力权重热图', w / 2, 8);

        // Subtitle: explain Q→K
        ctx.fillStyle = subTextColor;
        ctx.font = '12px sans-serif';
        const pulse = 0.5 + 0.5 * Math.sin(this.animPhase * Math.PI * 2);
        const highlight = isDark ? 'rgba(99,102,241,' + (0.3 + pulse * 0.3) + ')' : 'rgba(79,70,229,' + (0.1 + pulse * 0.2) + ')';
        ctx.fillText('色块越亮 = 注意力权重越高  ·  行(Query) → 列(Key)', w / 2, 28);

        // Draw row labels (left side - Query tokens)
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.font = '12px sans-serif';
        for (let i = 0; i < n; i++) {
            const ly = gridY + i * (cellSize + 2) + cellSize / 2;
            ctx.fillStyle = (this.hoverCol === i || this.hoverCol === -1) ? textColor : subTextColor;
            ctx.fillText(this.sentence[i], gridX - 10, ly);
        }

        // Draw column labels (top - Key tokens)
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        for (let i = 0; i < n; i++) {
            const lx = gridX + i * (cellSize + 2) + cellSize / 2;
            ctx.fillStyle = (this.hoverCol === i || this.hoverCol === -1) ? textColor : subTextColor;
            ctx.fillText(this.sentence[i], lx, gridY - 8);
        }

        // Draw attention matrix cells
        const focusedPulse = this.hoverCol >= 0 ? 0 : pulse;
        for (let row = 0; row < n; row++) {
            for (let col = 0; col < n; col++) {
                const cx = gridX + col * (cellSize + 2);
                const cy = gridY + row * (cellSize + 2);

                let value = this.attnWeights[row][col];

                // Apply hover highlight: emphasize the hovered row/column
                if (this.hoverCol >= 0) {
                    if (row === this.hoverCol || col === this.hoverCol) {
                        value = Math.min(1, value * 1.3);
                    } else {
                        value = value * 0.6;
                    }
                } else {
                    // Subtle animation pulse for diagonal
                    if (row === col) {
                        value = Math.min(1, value * (0.9 + 0.15 * Math.sin(this.animPhase * Math.PI * 2 + row * 0.5)));
                    }
                }

                const color = this._getHeatColor(value, isDark);

                ctx.fillStyle = color;
                this._roundRect(ctx, cx, cy, cellSize, cellSize, 3);
                ctx.fill();

                // Border
                ctx.strokeStyle = (this.hoverCol >= 0 && (row === this.hoverCol || col === this.hoverCol))
                    ? (isDark ? '#94A3B8' : '#64748B')
                    : borderColor;
                ctx.lineWidth = (this.hoverCol >= 0 && (row === this.hoverCol || col === this.hoverCol)) ? 2 : 0.5;
                ctx.stroke();

                // Show weight value in cell (only for larger cells)
                if (cellSize > 28) {
                    ctx.fillStyle = textColor;
                    ctx.font = Math.min(9, cellSize * 0.35) + 'px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText((value * 100).toFixed(0), cx + cellSize / 2, cy + cellSize / 2);
                }
            }
        }

        // Right side: explanation panel
        const panelX = w * 0.58;
        const panelY = h * 0.33;
        const panelW = w * 0.38;
        const panelH = h * 0.45;

        ctx.fillStyle = isDark ? '#334155' : '#FFFFFF';
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        this._roundRect(ctx, panelX, panelY, panelW, panelH, 10);
        ctx.fill();
        ctx.stroke();

        // Explanation content
        let explainText = '';
        let highlightToken = '';

        if (this.hoverCol >= 0) {
            highlightToken = this.sentence[this.hoverCol];
            explainText = `当前高亮：Token "${highlightToken}"（第 ${this.hoverCol + 1} 个词）\n\n`;
            explainText += '行（左侧标签）= Query：当前词在"查询"哪些词\n';
            explainText += '列（上方标签）= Key：被查询的词\n\n';
            explainText += `"${highlightToken}" 对自身的注意力最高（自注意力），`;
            // Find top attended tokens
            const attns = [];
            for (let j = 0; j < n; j++) {
                if (j !== this.hoverCol) attns.push({ idx: j, val: this.attnWeights[this.hoverCol][j] });
            }
            attns.sort((a, b) => b.val - a.val);
            if (attns.length > 0) {
                const top = attns.slice(0, 2);
                explainText += `同时也关注 "${this.sentence[top[0].idx]}"`;
                if (top.length > 1) explainText += ` 和 "${this.sentence[top[1].idx]}"`;
            }
            explainText += '。\n\n[提示] 点击网格可重新生成注意力权重。';
        } else {
            explainText = '• 色块亮度代表注意力权重的大小\n';
            explainText += '• 对角线（自注意力）通常权重最高\n';
            explainText += '• "it" 会强烈关注前面相关的名词\n';
            explainText += '• 悬停列标签可高亮特定词的注意力\n';
            explainText += '• 点击网格可随机生成新权重分布\n\n';
            explainText += '[提示] 自注意力是 Transformer 的核心机制，每个词都可以直接关注序列中的所有其他词。';
        }

        ctx.fillStyle = textColor;
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(highlightToken ? 'Token 注意力分析' : '如何理解热图？', panelX + 14, panelY + 12);

        ctx.fillStyle = subTextColor;
        ctx.font = '12px sans-serif';
        const lineH = 18;
        let lineY = panelY + 36;
        const lines = explainText.split('\n');
        for (const line of lines) {
            if (line.startsWith('[提示]')) {
                ctx.fillStyle = isDark ? '#A78BFA' : '#7C3AED';
                ctx.font = '12px sans-serif';
                ctx.fillText(line, panelX + 14, lineY);
                ctx.fillStyle = subTextColor;
                ctx.font = '12px sans-serif';
            } else if (line.startsWith('•') || line.startsWith('当前') || line.startsWith('行') || line.startsWith('列')) {
                ctx.fillText(line, panelX + 14, lineY);
            } else {
                this._wrapText(ctx, line, panelX + 14, lineY, panelW - 28, lineH);
            }
            lineY += lineH;
        }

        // Bottom instruction
        ctx.fillStyle = subTextColor;
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('悬停列标签查看注意力 · 点击矩阵重新生成权重 · 体现"it→agent"的指代关系', w / 2, h - 16);
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
        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], x, y + i * lineHeight);
        }
    }
};

window.Animations = window.Animations || {};
window.Animations['ch3-attention'] = Ch3Attention;

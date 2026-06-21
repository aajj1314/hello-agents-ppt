/**
 * CH5: 低代码平台 + 选型决策树 (Coze / Dify / FastGPT)
 *
 * Two-pane interactive canvas:
 *   LEFT  (≈40%): three vertically-stacked platform cards
 *                 - Coze (凉色 t.accentTeal): 零代码 + 一键发布飞书/抖音
 *                 - Dify (中性 t.success):   开源 + 模型中立 + 私有化
 *                 - FastGPT (暖色 t.accentAmber): 知识库问答做到极致
 *                 - Each card: gradient letter logo + tagline + feature chips + scenario
 *                 - Hover: card lifts + glows with the platform color
 *                 - Click: toggles a "expanded" state that shows strengths/limits
 *
 *   RIGHT (≈60%): selection decision tree (the core interaction)
 *                 - Root diamond:  "需要私有化部署吗？"
 *                 - 是 (right branch) → "团队有工程能力吗？"
 *                     · 是 → Dify         · 否 → FastGPT
 *                 - 否 (left branch)  → "需要一键发布到飞书/抖音吗？"
 *                     · 是 → Coze        · 否 → "有 RAG 高级需求吗？"
 *                         · 是 → FastGPT   · 否 → Dify
 *                 - Diamond = decision, rounded-rect = leaf (platform color)
 *                 - Hover decision node → highlight full path from root
 *                 - Hover leaf node    → highlight full path from root
 *                 - Click leaf         → mark "已选" + show 推荐理由
 *
 *   Play mode auto-walks the Coze path (root → 否 → "一键发布?" → 是 → Coze)
 *   Step  / Reset  advance / rewind the walk through the same path.
 */
import { CanvasAnimation } from './canvas-animation.js';
import { registerAnimation } from './animation-registry.js';

class Ch5Lowcode extends CanvasAnimation {
    constructor() {
        super();
        this.speed = 1;
        this._playing = false;
        this._rafId = null;
        this._lastTick = 0;
        this._stepInterval = 1100; // ms per node during autoplay

        this._hoverPlatform = -1;
        this._selectedPlatform = -1;
        this._hoverNode = null;
        this._selectedNode = null;

        this.platforms = [
            {
                key: 'coze',
                letter: 'C',
                name: 'Coze 扣子',
                colorKey: 'accentTeal',
                colorSoftKey: 'mutedSoft',
                tagline: '零代码 + 一键发布飞书/抖音',
                features: ['拖拽搭建', '插件商店', '官方模板', '5 分钟 Bot'],
                scenario: '场景: 客服 / 运营 / C 端工具',
                strengths: '强项: 发布渠道最广、上手最快',
                limit: '局限: 复杂工作流绕弯、导出弱'
            },
            {
                key: 'dify',
                letter: 'D',
                name: 'Dify',
                colorKey: 'success',
                colorSoftKey: 'mutedSoft',
                tagline: '开源 + 模型中立 + 私有化',
                features: ['模型可换', 'Docker 部署', '插件 8000+', 'LLMOps'],
                scenario: '场景: 企业 RAG / API 嵌入业务',
                strengths: '强项: 模型中立、私有化、生态丰富',
                limit: '局限: 学习曲线陡、高并发需优化'
            },
            {
                key: 'fastgpt',
                letter: 'F',
                name: 'FastGPT',
                colorKey: 'accentAmber',
                colorSoftKey: 'mutedSoft',
                tagline: '知识库问答做到极致',
                features: ['混合检索', 'QA 拆分', '重排序', '评测系统'],
                scenario: '场景: 客服 / 文档检索 / 培训',
                strengths: '强项: RAG 精度、文档解析最深',
                limit: '局限: Agent 弱、UI 偏工程审美'
            }
        ];

        // Build the decision tree as a flat map (positions computed in _layout)
        this.treeNodes = {
            root:    { id: 'root',    type: 'decision', question: '需要私有化部署吗？' },
            n_pub:   { id: 'n_pub',   type: 'decision', question: '需要一键发布到飞书/抖音？' },
            n_rag:   { id: 'n_rag',   type: 'decision', question: '有 RAG 高级需求？' },
            n_eng:   { id: 'n_eng',   type: 'decision', question: '团队有工程能力？' },
            leaf_coze: {
                id: 'leaf_coze', type: 'leaf', platform: 'coze',
                reason: '零代码 + 一键发布飞书/抖音，5 分钟出 Bot，是 C 端创意工具的最快路径。'
            },
            leaf_dify_rag: {
                id: 'leaf_dify_rag', type: 'leaf', platform: 'dify',
                reason: '非私有化 + 普通场景，模型中立 + 插件 8000+，业务可平滑扩展到生产。'
            },
            leaf_fastgpt_rag: {
                id: 'leaf_fastgpt_rag', type: 'leaf', platform: 'fastgpt',
                reason: '非私有化 + RAG 是核心瓶颈，文档问答它最专业，命中率明显领先。'
            },
            leaf_dify_priv: {
                id: 'leaf_dify_priv', type: 'leaf', platform: 'dify',
                reason: '私有化 + 有工程能力，企业级 LLMOps + 完整生产链路 + 生态最丰富。'
            },
            leaf_fastgpt_priv: {
                id: 'leaf_fastgpt_priv', type: 'leaf', platform: 'fastgpt',
                reason: '私有化 + 无工程团队，RAG 开箱即用 + Docker 一键起，文档解析最深。'
            }
        };

        this.treeEdges = [
            { from: 'root',  to: 'n_pub', label: '否' },
            { from: 'root',  to: 'n_eng', label: '是' },
            { from: 'n_pub', to: 'leaf_coze',       label: '是' },
            { from: 'n_pub', to: 'n_rag',           label: '否' },
            { from: 'n_rag', to: 'leaf_fastgpt_rag',label: '是' },
            { from: 'n_rag', to: 'leaf_dify_rag',   label: '否' },
            { from: 'n_eng', to: 'leaf_dify_priv',  label: '是' },
            { from: 'n_eng', to: 'leaf_fastgpt_priv',label: '否' }
        ];

        // Auto-play walk: the Coze branch (shortest)
        this._walkPath = ['root', 'n_pub', 'leaf_coze'];
        this._walkStep = 0; // 0 = nothing highlighted, 1..3 = first/last node of path

        this._layoutCache = null;
    }

    init(canvas) {
        super.init(canvas);
        this._setupControls();
        this.canvas.addEventListener('click', (e) => this._handleClick(e));
        this.canvas.addEventListener('mousemove', (e) => this._handleHover(e));
        this.canvas.addEventListener('mouseleave', () => {
            this._hoverPlatform = -1;
            this._hoverNode = null;
            this.canvas.style.cursor = 'default';
            this.draw();
        });
        window.addEventListener('resize', () => { this._resize(); this._layoutCache = null; this.draw(); });
        this._layoutCache = null;
        this.draw();
    }

    _setupControls() {
        const animId = 'ch5-lowcode';
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

    _stopLoop() {
        this._playing = false;
        if (this._rafId) cancelAnimationFrame(this._rafId);
        this._rafId = null;
        const btn = document.getElementById('btn-play-ch5-lowcode');
        if (btn) btn.textContent = '▶ 播放';
    }

    togglePlay() {
        if (this._playing) { this._stopLoop(); return; }
        if (this._walkStep >= this._walkPath.length) {
            this._walkStep = 0;
            this._selectedNode = null;
        }
        this._playing = true;
        const btn = document.getElementById('btn-play-ch5-lowcode');
        if (btn) btn.textContent = '⏸ 暂停';
        this._lastTick = 0;
        this._loop();
    }

    _loop() {
        if (!this._playing) return;
        const now = performance.now();
        if (!this._lastTick) this._lastTick = now;
        const interval = this._stepInterval / (this.speed || 1);
        if (now - this._lastTick >= interval) {
            this._walkStep++;
            this._lastTick = now;
            if (this._walkStep >= this._walkPath.length) {
                this._stopLoop();
            }
        }
        this.draw();
        if (this._playing) this._rafId = requestAnimationFrame(() => this._loop());
    }

    stepForward() {
        if (this._playing) this._stopLoop();
        if (this._walkStep < this._walkPath.length) {
            this._walkStep++;
        }
        this.draw();
    }

    reset() {
        this._stopLoop();
        this._walkStep = 0;
        this._selectedNode = null;
        this._selectedPlatform = -1;
        this._hoverNode = null;
        this._hoverPlatform = -1;
        this.draw();
    }

    setSpeed(v) { this.speed = v; }

    play() { this.togglePlay(); }
    step() { this.stepForward(); }

    // -------------------- layout --------------------

    _layout() {
        const w = this.width || 800;
        const h = this.height || 420;
        if (this._layoutCache && this._layoutCache.w === w && this._layoutCache.h === h) {
            return;
        }
        const titleH = 30;
        const bodyTop = titleH + 4;
        const bodyH = h - bodyTop - 12;

        // Left panel: platform cards
        const leftPad = 12;
        const leftW = Math.max(220, Math.min(310, w * 0.4));
        const cardGap = 8;
        const cardH = (bodyH - cardGap * 2) / 3;
        this._cardBoxes = [];
        for (let i = 0; i < 3; i++) {
            this._cardBoxes.push({
                x: leftPad,
                y: bodyTop + i * (cardH + cardGap),
                w: leftW,
                h: cardH,
                idx: i
            });
        }

        // Right panel: decision tree
        const rightX = leftPad + leftW + 10;
        const rightW = w - rightX - leftPad;
        const rightCx = rightX + rightW / 2;

        // Reason panel at bottom of right area
        const reasonH = (rightCx - 90 < rightX + 60) ? 0 : 50;
        const treeAreaH = bodyH - reasonH - 4;
        const treeTop = bodyTop + 20;
        const treeBottom = treeTop + treeAreaH - 8;
        const levelGap = (treeBottom - treeTop) / 3;
        const ty = (level) => treeTop + level * levelGap;

        // Assign positions
        const t = this.treeNodes;
        t.root.x = rightCx;                 t.root.y = ty(0);
        t.n_pub.x = rightCx - 90;           t.n_pub.y = ty(1);
        t.n_eng.x = rightCx + 90;           t.n_eng.y = ty(1);
        t.leaf_coze.x = rightCx - 160;      t.leaf_coze.y = ty(2);
        t.n_rag.x = rightCx - 30;           t.n_rag.y = ty(2);
        t.leaf_dify_priv.x = rightCx + 30;  t.leaf_dify_priv.y = ty(2);
        t.leaf_fastgpt_priv.x = rightCx + 160; t.leaf_fastgpt_priv.y = ty(2);
        t.leaf_fastgpt_rag.x = rightCx - 100; t.leaf_fastgpt_rag.y = ty(3);
        t.leaf_dify_rag.x = rightCx + 30;   t.leaf_dify_rag.y = ty(3);

        this._rightPanel = {
            x: rightX, y: bodyTop, w: rightW, h: bodyH, cx: rightCx,
            reasonY: treeBottom + 4, reasonH
        };
        this._titleH = titleH;
        this._layoutCache = { w, h };
    }

    // -------------------- highlight sets --------------------

    _walkNodeSet() {
        const s = new Set();
        for (let i = 0; i < Math.min(this._walkStep, this._walkPath.length); i++) {
            s.add(this._walkPath[i]);
        }
        return s;
    }

    _walkEdgeSet() {
        const s = new Set();
        for (let i = 0; i < Math.min(this._walkStep - 1, this._walkPath.length - 1); i++) {
            s.add(this._walkPath[i] + '->' + this._walkPath[i + 1]);
        }
        return s;
    }

    _hoverPath() {
        if (!this._hoverNode || !this.treeNodes[this._hoverNode]) {
            return { nodes: new Set(), edges: new Set() };
        }
        const nodes = new Set([this._hoverNode]);
        const edges = new Set();
        let cur = this._hoverNode;
        for (let i = 0; i < 8; i++) {
            const incoming = this.treeEdges.find(e => e.to === cur);
            if (!incoming) break;
            nodes.add(incoming.from);
            edges.add(incoming.from + '->' + incoming.to);
            cur = incoming.from;
        }
        return { nodes, edges };
    }

    _isNodeActive(id) {
        if (this._walkNodeSet().has(id)) return true;
        if (this._hoverPath().nodes.has(id)) return true;
        return false;
    }

    _isEdgeActive(key) {
        if (this._walkEdgeSet().has(key)) return true;
        if (this._hoverPath().edges.has(key)) return true;
        return false;
    }

    // -------------------- hit testing --------------------

    _hitTestNode(x, y) {
        // Decision diamonds
        const dw = 70, dh = 26;
        for (const id in this.treeNodes) {
            const n = this.treeNodes[id];
            if (!n.x) continue;
            if (n.type === 'decision') {
                const dx = Math.abs(x - n.x);
                const dy = Math.abs(y - n.y);
                if (dx / dw + dy / dh <= 1) return id;
            }
        }
        // Leaf rounded rects
        const lw = 50, lh = 20;
        for (const id in this.treeNodes) {
            const n = this.treeNodes[id];
            if (!n.x || n.type !== 'leaf') continue;
            if (Math.abs(x - n.x) <= lw && Math.abs(y - n.y) <= lh) return id;
        }
        return null;
    }

    _handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Platform cards first
        for (let i = 0; i < this._cardBoxes.length; i++) {
            const c = this._cardBoxes[i];
            if (x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) {
                this._selectedPlatform = this._selectedPlatform === i ? -1 : i;
                if (this._playing) this._stopLoop();
                this.draw();
                return;
            }
        }

        // Tree nodes
        const id = this._hitTestNode(x, y);
        if (id) {
            const node = this.treeNodes[id];
            if (node.type === 'leaf') {
                this._selectedNode = this._selectedNode === id ? null : id;
            } else {
                this._selectedNode = this._selectedNode === id ? null : id;
            }
            if (this._playing) this._stopLoop();
            this.draw();
        }
    }

    _handleHover(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        let newHoverPlatform = -1;
        for (let i = 0; i < this._cardBoxes.length; i++) {
            const c = this._cardBoxes[i];
            if (x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) {
                newHoverPlatform = i;
                break;
            }
        }
        const newHoverNode = this._hitTestNode(x, y);

        if (newHoverPlatform !== this._hoverPlatform || newHoverNode !== this._hoverNode) {
            this._hoverPlatform = newHoverPlatform;
            this._hoverNode = newHoverNode;
            this.canvas.style.cursor = (newHoverPlatform >= 0 || newHoverNode) ? 'pointer' : 'default';
            this.draw();
        }
    }

    // -------------------- drawing --------------------

    draw() {
        if (!this.ctx) return;
        this._layout();
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        const t = this.theme();
        const dark = this.isDarkTheme();
        const bg = dark ? t.surfaceDarkSoft : t.canvas;
        const textColor = t.ink;
        const subColor = t.muted;
        // Resolve the platform color/soft to actual hex (recomputed every draw,
        // so theme switches re-render correctly).
        for (let i = 0; i < this.platforms.length; i++) {
            const p = this.platforms[i];
            p.color = t[p.colorKey];
            p.colorSoft = t[p.colorSoftKey] || t.hairline;
        }

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        // Title
        ctx.fillStyle = textColor;
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('三大低代码平台 · 选型决策树', 12, 8);

        // Play indicator (top-right)
        if (this._playing) {
            ctx.fillStyle = subColor;
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'right';
            const cur = Math.min(this._walkStep + 1, this._walkPath.length);
            ctx.fillText('▶ 自动演示中 · ' + cur + ' / ' + this._walkPath.length, w - 12, 10);
        }

        // Section labels
        ctx.fillStyle = subColor;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('▎三大平台', this._cardBoxes[0].x, this._titleH);
        ctx.fillText('▎选型决策树', this._rightPanel.x, this._titleH);

        // Tree first (edges under nodes, behind cards)
        this._drawTreeEdges(ctx, dark, subColor, t);
        this._drawTreeNodes(ctx, dark, textColor, subColor, t);
        this._drawSelectedReason(ctx, dark, textColor, subColor, t);

        // Platform cards on top (left side)
        this._drawPlatformCards(ctx, dark, textColor, subColor, t);
    }

    _drawTreeEdges(ctx, dark, subColor, t) {
        const gridColor = this._withAlpha(t.muted, dark ? 0.35 : 0.4);
        const activeColor = t.primary;
        for (const edge of this.treeEdges) {
            const from = this.treeNodes[edge.from];
            const to = this.treeNodes[edge.to];
            if (!from.x || !to.x) continue;
            const key = edge.from + '->' + edge.to;
            const isActive = this._isEdgeActive(key);
            const fromActive = this._isNodeActive(edge.from);
            const toActive = this._isNodeActive(edge.to);

            // Edge line
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            if (isActive) {
                ctx.strokeStyle = activeColor;
                ctx.lineWidth = 3;
            } else {
                ctx.strokeStyle = gridColor;
                ctx.lineWidth = 1.5;
            }
            ctx.stroke();

            // Small arrow head when active
            if (isActive) {
                const angle = Math.atan2(to.y - from.y, to.x - from.x);
                const headLen = 8;
                // Place near the target node, offset by node half-size
                const offset = (to.type === 'leaf') ? 50 : 30;
                const ex = to.x - Math.cos(angle) * offset;
                const ey = to.y - Math.sin(angle) * offset;
                ctx.beginPath();
                ctx.moveTo(ex, ey);
                ctx.lineTo(ex - headLen * Math.cos(angle - Math.PI / 6),
                           ey - headLen * Math.sin(angle - Math.PI / 6));
                ctx.lineTo(ex - headLen * Math.cos(angle + Math.PI / 6),
                           ey - headLen * Math.sin(angle + Math.PI / 6));
                ctx.closePath();
                ctx.fillStyle = activeColor;
                ctx.fill();
            }

            // Edge label (是 / 否) — placed near the start of the edge, offset toward the branch side
            const t = 0.32; // 0 = at parent, 1 = at child
            const mx = from.x + (to.x - from.x) * t;
            const my = from.y + (to.y - from.y) * t;
            // Perpendicular offset so the label doesn't sit on the line
            const ang = Math.atan2(to.y - from.y, to.x - from.x);
            const perpX = -Math.sin(ang);
            const perpY = Math.cos(ang);
            // Push label to the OUTER side of the branch
            const outerSign = (to.x < from.x) ? -1 : 1;
            const offX = perpX * outerSign * 8;
            const offY = perpY * outerSign * 8;
            const lx = mx + offX;
            const ly = my + offY;

            ctx.font = 'bold 10px sans-serif';
            const labelW = ctx.measureText(edge.label).width + 10;
            const labelH = 14;
            const lx0 = lx - labelW / 2;
            const ly0 = ly - labelH / 2;
            ctx.fillStyle = isActive ? t.primary : (dark ? t.surfaceDark : t.canvas);
            this.roundRect(ctx, lx0, ly0, labelW, labelH, 7);
            ctx.fill();
            ctx.strokeStyle = isActive ? t.primary : (fromActive && toActive ? t.primary : gridColor);
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.fillStyle = isActive ? t.onPrimary : subColor;
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(edge.label, lx, ly);
        }
    }

    _drawTreeNodes(ctx, dark, textColor, subColor, t) {
        // Draw decision diamonds first (so leaves sit on top at the same level)
        for (const id in this.treeNodes) {
            const node = this.treeNodes[id];
            if (!node.x) continue;
            const isActive = this._isNodeActive(id);
            const isHover = this._hoverNode === id;
            const isSelected = this._selectedNode === id;
            if (node.type === 'decision') {
                this._drawDecisionDiamond(ctx, node, isActive, isHover, dark, textColor, t);
            } else {
                this._drawLeafNode(ctx, node, isActive, isHover, isSelected, dark, textColor, subColor, t);
            }
        }
    }

    _drawDecisionDiamond(ctx, node, isActive, isHover, dark, textColor, t) {
        const w = 70, h = 26;
        const x = node.x, y = node.y;
        const fill = dark ? t.surfaceDark : t.canvas;
        const stroke = isActive ? t.primary : (dark ? t.muted : t.hairline);
        const activeAccent = t.primary;

        // Glow halo when active
        if (isActive || isHover) {
            ctx.save();
            const glow = isActive ? 0.22 : 0.10;
            ctx.shadowColor = this._withAlpha(activeAccent, isActive ? 0.55 : 0.25);
            ctx.shadowBlur = isActive ? 18 : 10;
            ctx.fillStyle = this._withAlpha(activeAccent, glow);
            ctx.beginPath();
            ctx.moveTo(x, y - h - 4);
            ctx.lineTo(x + w + 4, y);
            ctx.lineTo(x, y + h + 4);
            ctx.lineTo(x - w - 4, y);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        // Body
        ctx.beginPath();
        ctx.moveTo(x, y - h);
        ctx.lineTo(x + w, y);
        ctx.lineTo(x, y + h);
        ctx.lineTo(x - w, y);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = isActive ? 2.5 : 1.5;
        ctx.stroke();

        // Inner accent bar
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x, y - h + 2);
        ctx.lineTo(x + w - 2, y);
        ctx.lineTo(x, y + h - 2);
        ctx.lineTo(x - w + 2, y);
        ctx.closePath();
        ctx.clip();
        ctx.fillStyle = isActive ? t.primary : (dark ? t.muted : t.hairline);
        ctx.fillRect(x - w, y - 2, 4, 4);
        ctx.restore();

        // Question text — wrap inside the diamond (max effective width ~ w * 1.4)
        ctx.fillStyle = isActive ? t.primary : textColor;
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const maxTextW = w * 1.4;
        const lines = this.wrapText(ctx, node.question, 0, 0, maxTextW, 12);
        const lineH = 12;
        const visibleLines = lines.slice(0, 3);
        const totalH = visibleLines.length * lineH;
        for (let i = 0; i < visibleLines.length; i++) {
            ctx.fillText(visibleLines[i], x, y - totalH / 2 + (i + 0.5) * lineH);
        }
    }

    _drawLeafNode(ctx, node, isActive, isHover, isSelected, dark, textColor, subColor, t) {
        const platform = this.platforms.find(p => p.key === node.platform);
        if (!platform) return;
        const w = 100, h = 34;
        const x = node.x, y = node.y;
        const color = platform.color;

        // Halo glow
        if (isActive || isSelected) {
            const haloR = 46;
            const halo = ctx.createRadialGradient(x, y, 6, x, y, haloR);
            halo.addColorStop(0, this._withAlpha(color, isSelected ? 0.5 : 0.32));
            halo.addColorStop(1, this._withAlpha(color, 0));
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(x, y, haloR, 0, Math.PI * 2);
            ctx.fill();
        }

        // Card body
        ctx.save();
        if (isActive || isSelected) {
            ctx.shadowColor = this._withAlpha(color, 0.45);
            ctx.shadowBlur = isSelected ? 18 : 12;
            ctx.shadowOffsetY = 3;
        }
        this.roundRect(ctx, x - w / 2, y - h / 2, w, h, 8);
        // Vertical gradient for richness
        const grad = ctx.createLinearGradient(x, y - h / 2, x, y + h / 2);
        grad.addColorStop(0, this._shade(color, 0.12));
        grad.addColorStop(1, color);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();

        // Border
        ctx.beginPath();
        this.roundRect(ctx, x - w / 2, y - h / 2, w, h, 8);
        ctx.strokeStyle = isSelected ? t.ink : this._shade(color, -0.25);
        ctx.lineWidth = isSelected ? 2.5 : 1;
        ctx.stroke();

        // Name
        ctx.fillStyle = t.onPrimary;
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(platform.name, x, y - 2);

        // Selected ✓ badge
        if (isSelected) {
            const bx = x + w / 2 - 7;
            const by = y - h / 2 - 3;
            ctx.fillStyle = t.ink;
            ctx.beginPath();
            ctx.arc(bx, by, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = t.onDark;
            ctx.font = 'bold 9px sans-serif';
            ctx.fillText('✓', bx, by + 0.5);
        }
    }

    _drawPlatformCards(ctx, dark, textColor, subColor, t) {
        for (let i = 0; i < this.platforms.length; i++) {
            const platform = this.platforms[i];
            const card = this._cardBoxes[i];
            const isHover = this._hoverPlatform === i;
            const isSelected = this._selectedPlatform === i;
            this._drawPlatformCard(ctx, card, platform, isHover, isSelected, dark, textColor, subColor, t);
        }
    }

    _drawPlatformCard(ctx, card, platform, isHover, isSelected, dark, textColor, subColor, t) {
        const x = card.x;
        const y = card.y + (isHover ? -3 : 0);
        const w = card.w;
        const h = card.h;
        const color = platform.color;
        const cardBg = dark ? t.surfaceDark : t.canvas;
        const borderColor = t.hairline;

        // Body with shadow
        ctx.save();
        if (isHover || isSelected) {
            ctx.shadowColor = this._withAlpha(color, dark ? 0.55 : 0.40);
            ctx.shadowBlur = isHover ? 20 : 14;
            ctx.shadowOffsetY = isHover ? 6 : 3;
        } else {
            ctx.shadowColor = 'rgba(0,0,0,0.10)';
            ctx.shadowBlur = 6;
            ctx.shadowOffsetY = 2;
        }
        ctx.fillStyle = cardBg;
        this.roundRect(ctx, x, y, w, h, 10);
        ctx.fill();
        ctx.restore();

        // Border
        ctx.beginPath();
        this.roundRect(ctx, x, y, w, h, 10);
        ctx.strokeStyle = isHover || isSelected ? color : borderColor;
        ctx.lineWidth = isHover || isSelected ? 2 : 1;
        ctx.stroke();

        // Accent stripe (left) — clipped to card
        ctx.save();
        ctx.beginPath();
        this.roundRect(ctx, x, y, w, h, 10);
        ctx.clip();
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 5, h);
        // Subtle inner top-right glow
        const gg = ctx.createLinearGradient(x, y, x + w, y);
        gg.addColorStop(0, this._withAlpha(color, 0));
        gg.addColorStop(1, this._withAlpha(color, isHover ? 0.18 : 0.10));
        ctx.fillStyle = gg;
        ctx.fillRect(x, y, w, h);
        ctx.restore();

        // Logo circle
        const logoR = Math.max(16, Math.min(22, h * 0.22));
        const logoX = x + 24;
        const logoY = y + 24;
        const grad = ctx.createRadialGradient(logoX - logoR * 0.3, logoY - logoR * 0.3, 2, logoX, logoY, logoR);
        grad.addColorStop(0, platform.colorSoft);
        grad.addColorStop(1, color);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(logoX, logoY, logoR, 0, Math.PI * 2);
        ctx.fill();
        // Logo border
        ctx.strokeStyle = this._shade(color, -0.2);
        ctx.lineWidth = 1;
        ctx.stroke();
        // Letter
        ctx.fillStyle = t.onPrimary;
        ctx.font = 'bold ' + Math.round(logoR * 0.95) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(platform.letter, logoX, logoY + 1);

        // Name + tagline
        const nameX = x + 54;
        const nameY = y + 14;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillStyle = textColor;
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(platform.name, nameX, nameY);
        ctx.fillStyle = subColor;
        ctx.font = '10px sans-serif';
        const maxNameW = w - 54 - 10;
        const taglineLines = this.wrapText(ctx, platform.tagline, 0, 0, maxNameW, 12);
        for (let i = 0; i < Math.min(2, taglineLines.length); i++) {
            ctx.fillText(taglineLines[i], nameX, nameY + 14 + i * 12);
        }

        // Feature chips row
        const chipsTop = y + 52;
        const chipH = 14;
        const chipPadX = 6;
        let chipX = x + 12;
        const chipY = chipsTop;
        ctx.font = '9px sans-serif';
        for (const feature of platform.features) {
            const chipW = ctx.measureText(feature).width + chipPadX * 2;
            if (chipX + chipW > x + w - 8) break;
            ctx.fillStyle = this._withAlpha(color, dark ? 0.22 : 0.12);
            this.roundRect(ctx, chipX, chipY, chipW, chipH, 7);
            ctx.fill();
            ctx.strokeStyle = this._withAlpha(color, 0.45);
            ctx.lineWidth = 0.5;
            ctx.stroke();
            ctx.fillStyle = color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(feature, chipX + chipW / 2, chipY + chipH / 2 + 0.5);
            chipX += chipW + 4;
        }

        // Bottom: scenario line (or expanded details when selected)
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        if (isSelected) {
            const baseY = y + 72;
            ctx.fillStyle = textColor;
            ctx.font = '10px sans-serif';
            const maxW = w - 24;
            const scLines = this.wrapText(ctx, platform.scenario, 0, 0, maxW, 12);
            for (let i = 0; i < Math.min(1, scLines.length); i++) {
                ctx.fillText(scLines[i], x + 12, baseY);
            }
            ctx.fillStyle = this._shade(color, 0.15);
            ctx.font = '9px sans-serif';
            const details = [platform.strengths, platform.limit];
            for (let i = 0; i < details.length; i++) {
                const dlines = this.wrapText(ctx, details[i], 0, 0, maxW, 11);
                const ly = baseY + 14 + i * 13;
                for (let j = 0; j < Math.min(1, dlines.length); j++) {
                    ctx.fillText(dlines[j], x + 12, ly);
                }
            }
        } else {
            ctx.fillStyle = subColor;
            ctx.font = '10px sans-serif';
            const maxW = w - 24;
            const lines = this.wrapText(ctx, platform.scenario, 0, 0, maxW, 12);
            ctx.fillText(lines[0] || '', x + 12, y + h - 14);
        }
    }

    _drawSelectedReason(ctx, dark, textColor, subColor) {
        const node = this._selectedNode && this.treeNodes[this._selectedNode];
        if (!node || node.type !== 'leaf') return;
        const platform = this.platforms.find(p => p.key === node.platform);
        if (!platform) return;
        const panel = this._rightPanel;
        if (panel.reasonH <= 0) return;

        const boxX = panel.x + 4;
        const boxY = panel.reasonY;
        const boxW = panel.w - 8;
        const boxH = panel.reasonH - 4;

        // Body
        ctx.save();
        ctx.shadowColor = this._withAlpha(platform.color, 0.4);
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = dark ? t.surfaceDark : t.canvas;
        this.roundRect(ctx, boxX, boxY, boxW, boxH, 8);
        ctx.fill();
        ctx.restore();

        // Border
        ctx.beginPath();
        this.roundRect(ctx, boxX, boxY, boxW, boxH, 8);
        ctx.strokeStyle = platform.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Left color bar (clipped)
        ctx.save();
        ctx.beginPath();
        this.roundRect(ctx, boxX, boxY, boxW, boxH, 8);
        ctx.clip();
        ctx.fillStyle = platform.color;
        ctx.fillRect(boxX, boxY, 4, boxH);
        ctx.restore();

        // Tag chip + label
        const tagX = boxX + 12;
        const tagY = boxY + 7;
        ctx.fillStyle = platform.color;
        this.roundRect(ctx, tagX, tagY, 70, 14, 4);
        ctx.fill();
        ctx.fillStyle = t.onPrimary;
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('已选 ' + platform.name, tagX + 35, tagY + 7);

        // Recommendation label
        ctx.fillStyle = textColor;
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('推荐理由', boxX + 90, tagY);

        // Reason body
        ctx.fillStyle = subColor;
        ctx.font = '10px sans-serif';
        const maxW = boxW - 16;
        const lines = this.wrapText(ctx, node.reason, 0, 0, maxW, 13);
        const visible = lines.slice(0, 2);
        for (let i = 0; i < visible.length; i++) {
            ctx.fillText(visible[i], boxX + 12, boxY + 26 + i * 12);
        }
    }

    // -------------------- color helpers --------------------

    _withAlpha(hex, alpha) {
        if (typeof hex !== 'string' || hex[0] !== '#' || hex.length < 7) return hex;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    }

    _shade(hex, amount) {
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
}

registerAnimation('ch5-lowcode', () => new Ch5Lowcode());

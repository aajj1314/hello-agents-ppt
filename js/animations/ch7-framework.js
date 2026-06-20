/**
 * CH7: HelloAgents 5-Layer Architecture + 4 Pain Points Mapping
 *
 * Visual concept (matches ch7.md "构建你的智能体框架"):
 *   - Left column  · 4 痛点 cards (过度抽象 / 快速迭代不稳定 / 黑盒化 / 依赖复杂),
 *     each with a curved arrow to the HelloAgents layer that resolves it.
 *   - Center       · 5-layer pyramid (bottom-up: L1 基础层 → L2 范式层 →
 *     L3 工具层 → L4 记忆层 → L5 应用层), bars narrow toward the top.
 *   - Right column · layer API surface panel + 3 project thumbs (CH13/14/15)
 *     that unlock once the pyramid is fully lit.
 *   - Play mode    · layers light up bottom-up at 2 s/interval; after L5 the
 *     three CH13/14/15 project thumbnails fade in.
 *   - Step mode    · advances one stage (layer or "projects unlocked") per click.
 *   - Hover        · a layer or a pain-point card glows, the connecting
 *     bezier arrow turns solid with an arrow head, the right panel switches
 *     to that layer's API surface.
 */
import { CanvasAnimation } from './canvas-animation.js';
import { registerAnimation } from './animation-registry.js';

class Ch7Framework extends CanvasAnimation {
    constructor() {
        super();
        this.isPlaying = false;
        this.speed = 1;
        // 0 = nothing lit, 1..5 = L1..L5 lit, 5 also = projects unlocked
        this.step = 0;
        this.animId = null;
        this.lastStepTime = 0;
        this.hover = { type: 'none', index: -1 };   // type: 'layer' | 'pain' | 'project'

        // 5 layers (bottom → top). Each layer declares which pain-points it solves.
        this.layers = [
            {
                key: 'L1', title: 'L1 基础层', color: '#6366F1',
                desc: 'BaseAgent / HelloAgentsLLM / Config',
                api: 'llm = HelloAgentsLLM()\nagent = BaseAgent(llm)\nConfig.from_env()',
                solves: [0, 3]   // 过度抽象 + 依赖复杂
            },
            {
                key: 'L2', title: 'L2 范式层', color: '#8B5CF6',
                desc: 'ReAct / Plan-Solve / Reflection',
                api: 'ReActAgent(llm, tools)\nPlanAndSolveAgent(llm)\nReflectionAgent(llm)',
                solves: [1, 2]   // 快速迭代不稳定 + 黑盒化
            },
            {
                key: 'L3', title: 'L3 工具层', color: '#0EA5E9',
                desc: 'ToolRegistry / 内置工具 / 外部 API',
                api: 'registry.register_tool(t)\n@tool def my_tool(...)\nCalculator / Search / HTTP',
                solves: []
            },
            {
                key: 'L4', title: 'L4 记忆层', color: '#10B981',
                desc: 'Memory / RAG / Note / Terminal (→ CH8)',
                api: 'agent.add_message(m)\nMemoryTool(persist=True)\nRAGTool(vector_db)',
                solves: []
            },
            {
                key: 'L5', title: 'L5 应用层', color: '#F59E0B',
                desc: 'CH13 旅行助手 / CH14 DeepResearch / CH15 赛博小镇',
                api: 'agent.run(user_input)\n→ 业务场景',
                solves: []
            }
        ];

        // 4 痛点 cards, each maps to a target layer index.
        this.painPoints = [
            { title: '过度抽象',     desc: '十几层概念才能跑通简单任务', target: 0, color: '#EF4444' },
            { title: '快速迭代不稳定', desc: 'API 变更频繁，升级即崩溃',     target: 1, color: '#F59E0B' },
            { title: '黑盒化',       desc: '核心逻辑封装，看不见内部',     target: 1, color: '#8B5CF6' },
            { title: '依赖复杂',     desc: '安装包臃肿，版本易冲突',       target: 0, color: '#0EA5E9' }
        ];

        // 3 实战项目缩略 (visible at step >= layerCount).
        this.projects = [
            { ch: 'CH13', name: '旅行助手',    color: '#3B82F6' },
            { ch: 'CH14', name: 'DeepResearch', color: '#10B981' },
            { ch: 'CH15', name: '赛博小镇',    color: '#F59E0B' }
        ];
    }

    init(canvas) {
        super.init(canvas);
        this._setupControls();
        this._setupCanvasEvents();
        window.addEventListener('resize', () => { this._resize(); this.draw(); });
        this.draw();
    }

    _setupControls() {
        const animId = 'ch7-framework';
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

    _setupCanvasEvents() {
        if (!this.canvas) return;
        this.canvas.addEventListener('mousemove', (e) => this._handleHover(e));
        this.canvas.addEventListener('mouseleave', () => {
            this.hover = { type: 'none', index: -1 };
            this.canvas.style.cursor = 'default';
            this.draw();
        });
    }

    _handleHover(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const hit = this._hitTest(mx, my);
        const changed = hit.type !== this.hover.type || hit.index !== this.hover.index;
        this.hover = hit;
        this.canvas.style.cursor = hit.type !== 'none' ? 'pointer' : 'default';
        if (changed) this.draw();
    }

    _hitTest(mx, my) {
        const layout = this._computeLayout();
        for (let i = 0; i < layout.painPoints.length; i++) {
            const r = layout.painPoints[i];
            if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
                return { type: 'pain', index: i };
            }
        }
        for (let i = 0; i < layout.layers.length; i++) {
            const r = layout.layers[i];
            if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
                return { type: 'layer', index: i };
            }
        }
        for (let i = 0; i < layout.projects.length; i++) {
            const r = layout.projects[i];
            if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
                return { type: 'project', index: i };
            }
        }
        return { type: 'none', index: -1 };
    }

    togglePlay() {
        this.isPlaying = !this.isPlaying;
        const btn = document.getElementById('btn-play-ch7-framework');
        if (btn) btn.textContent = this.isPlaying ? '⏸ 暂停' : '▶ 播放';
        if (this.isPlaying) {
            this.lastStepTime = 0;
            this._loop();
        } else {
            cancelAnimationFrame(this.animId);
        }
    }

    _loop() {
        if (!this.isPlaying) return;
        const now = performance.now();
        if (!this.lastStepTime) this.lastStepTime = now;
        const dur = 2000 / this.speed;     // 2 s per layer
        if (now - this.lastStepTime >= dur) {
            this.step = Math.min(this.step + 1, this.layers.length);
            this.lastStepTime = now;
            if (this.step >= this.layers.length) {
                this.isPlaying = false;
                const btn = document.getElementById('btn-play-ch7-framework');
                if (btn) btn.textContent = '▶ 播放';
                this.draw();
                return;
            }
        }
        this.draw();
        this.animId = requestAnimationFrame(() => this._loop());
    }

    stepForward() {
        this.step = Math.min(this.step + 1, this.layers.length);
        this.draw();
    }

    reset() {
        this.step = 0;
        this.isPlaying = false;
        this.lastStepTime = 0;
        this.hover = { type: 'none', index: -1 };
        cancelAnimationFrame(this.animId);
        const btn = document.getElementById('btn-play-ch7-framework');
        if (btn) btn.textContent = '▶ 播放';
        this.draw();
    }

    setSpeed(v) { this.speed = v; }

    play() { if (!this.isPlaying) this.togglePlay(); }
    pause() { if (this.isPlaying) this.togglePlay(); }
    step() { this.stepForward(); }

    /**
     * Compute layout rectangles for pain points, pyramid layers, and right column.
     * Returns logical (CSS) pixel coordinates, NOT DPR-scaled.
     */
    _computeLayout() {
        const w = this.width;
        const h = this.height;
        const titleH = 32;
        const bottomH = 28;
        const padX = 12;
        const gapX = 12;
        const leftW = 200;
        const rightW = Math.min(220, Math.max(180, w * 0.24));
        const centerX = padX + leftW + gapX;
        const rightX = w - padX - rightW;
        const centerW = Math.max(140, rightX - gapX - centerX);
        const top = titleH + 8;
        const bot = h - bottomH;
        const mainH = bot - top;

        // Pain points
        const painCount = this.painPoints.length;
        const painGap = 8;
        const painH = (mainH - painGap * (painCount - 1)) / painCount;
        const painPoints = this.painPoints.map((p, i) => ({
            x: padX,
            y: top + i * (painH + painGap),
            w: leftW,
            h: painH,
            data: p,
            index: i
        }));

        // Pyramid: L1 (i=0) at bottom widest, L5 (i=4) at top narrowest.
        const layerCount = this.layers.length;
        const layerGap = 6;
        const layerH = (mainH - layerGap * (layerCount - 1)) / layerCount;
        const baseCenterW = centerW * 0.96;
        const topCenterW = centerW * 0.50;
        const layers = this.layers.map((l, i) => {
            const reverseI = layerCount - 1 - i;
            const t = reverseI / (layerCount - 1);
            const lw = topCenterW + (baseCenterW - topCenterW) * (1 - t);
            const lx = centerX + (centerW - lw) / 2;
            const ly = top + reverseI * (layerH + layerGap);
            return { x: lx, y: ly, w: lw, h: layerH, data: l, index: i };
        });

        // Right column: API box + project thumbs
        const apiH = mainH * 0.55;
        const apiBox = { x: rightX, y: top, w: rightW, h: apiH };
        const projY = top + apiH + 10;
        const projH = bot - projY;
        const projCount = this.projects.length;
        const projGap = 6;
        const projBoxH = (projH - projGap * (projCount - 1)) / projCount;
        const projects = this.projects.map((p, i) => ({
            x: rightX,
            y: projY + i * (projBoxH + projGap),
            w: rightW,
            h: projBoxH,
            data: p,
            index: i
        }));

        return {
            title: { x: w / 2, y: 16 },
            painPoints, layers, apiBox, projects,
            mainTop: top, mainBot: bot
        };
    }

    _isPainHighlighted(i) {
        if (this.hover.type === 'pain' && this.hover.index === i) return true;
        if (this.hover.type === 'layer' && this.layers[this.hover.index].solves.includes(i)) return true;
        return false;
    }

    _isLayerHighlighted(i) {
        if (this.hover.type === 'layer' && this.hover.index === i) return true;
        if (this.hover.type === 'pain' && this.painPoints[this.hover.index].target === i) return true;
        if (i < this.step) return true;
        return false;
    }

    draw() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        const isDark = this.isDarkTheme();
        const bg = isDark ? '#0F172A' : '#F8FAFC';
        const textColor = isDark ? '#F1F5F9' : '#0F172A';
        const subColor = isDark ? '#94A3B8' : '#475569';
        const cardBg = isDark ? '#1E293B' : '#FFFFFF';
        const cardBorder = isDark ? '#334155' : '#E2E8F0';
        const innerBg = isDark ? '#0B1220' : '#F1F5F9';

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        const layout = this._computeLayout();

        // Title
        ctx.fillStyle = textColor;
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('HelloAgents 五层架构 · 从痛点到底座', layout.title.x, layout.title.y);

        // Subtle section labels
        ctx.fillStyle = subColor;
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('市面框架的痛点', layout.painPoints[0].x, layout.mainTop - 4);
        const centerMidX = (layout.layers[0].x + layout.layers[layout.layers.length - 1].x + layout.layers[0].w) / 2;
        ctx.textAlign = 'center';
        ctx.fillText('HelloAgents 五层底座', centerMidX, layout.mainTop - 4);
        ctx.textAlign = 'right';
        ctx.fillText('实战项目 (CH13/14/15)', layout.projects[0].x + layout.projects[0].w, layout.mainTop - 4);

        // Pain points
        layout.painPoints.forEach((r) => this._drawPainPoint(ctx, r, { isDark, textColor, subColor, cardBg, cardBorder }));

        // Connection arrows (pain point → target layer)
        layout.painPoints.forEach((r) => {
            const layer = layout.layers[r.data.target];
            this._drawArrow(ctx, r, layer, r.data.color, {
                isDark, isActive: this._isPainHighlighted(r.index)
            });
        });

        // Pyramid layers
        layout.layers.forEach((r) => this._drawLayer(ctx, r, { isDark, textColor, subColor, cardBg, cardBorder, innerBg }));

        // Right column
        this._drawApiBox(ctx, layout.apiBox, { isDark, textColor, subColor, cardBg, cardBorder, innerBg });
        if (this.step >= this.layers.length) {
            this._drawProjects(ctx, layout.projects, { isDark, textColor, subColor, cardBg, cardBorder });
        } else {
            this._drawProjectsLocked(ctx, layout.projects, { isDark, subColor, cardBorder });
        }

        // Bottom info bar
        const litCount = Math.min(this.step, this.layers.length);
        const phaseLabel = this.step >= this.layers.length
            ? '✓ 五层全部点亮 · 三大实战项目已解锁'
            : `已点亮 ${litCount} / ${this.layers.length} 层 · 下一层：${this.layers[litCount]?.title || '—'}`;
        ctx.fillStyle = subColor;
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(phaseLabel, 12, h - 10);

        ctx.textAlign = 'right';
        const playTag = this.isPlaying ? '播放中 · 每 2 秒点亮一层' : '点击「播放」自下而上依次点亮 5 层';
        ctx.fillText(playTag + '   ·   hover 任意层查看 API', w - 12, h - 10);
    }

    _drawPainPoint(ctx, r, theme) {
        const { isDark, textColor, subColor, cardBg, cardBorder } = theme;
        const isActive = this._isPainHighlighted(r.index);
        const isDim = (this.hover.type === 'pain' || this.hover.type === 'layer') && !isActive;

        ctx.globalAlpha = isDim ? 0.5 : 1;

        // Card
        ctx.fillStyle = cardBg;
        this.roundRect(ctx, r.x, r.y, r.w, r.h, 8);
        ctx.fill();

        if (isActive) {
            ctx.save();
            ctx.shadowColor = r.data.color;
            ctx.shadowBlur = 10;
            ctx.strokeStyle = r.data.color;
            ctx.lineWidth = 1.8;
            this.roundRect(ctx, r.x, r.y, r.w, r.h, 8);
            ctx.stroke();
            ctx.restore();
        } else {
            ctx.strokeStyle = cardBorder;
            ctx.lineWidth = 1;
            this.roundRect(ctx, r.x, r.y, r.w, r.h, 8);
            ctx.stroke();
        }

        // Left color bar
        ctx.fillStyle = r.data.color;
        ctx.fillRect(r.x, r.y + 4, 4, r.h - 8);

        // Number + label
        ctx.fillStyle = r.data.color;
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('痛点 ' + (r.index + 1), r.x + 12, r.y + 8);

        // Title
        ctx.fillStyle = textColor;
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(r.data.title, r.x + 12, r.y + 22);

        // Description (wraps within card width)
        ctx.fillStyle = subColor;
        ctx.font = '10px sans-serif';
        const descLines = this.wrapText(ctx, r.data.desc, r.x + 12, 0, r.w - 24, 12);
        const startY = r.y + 40;
        const maxLines = Math.max(1, Math.floor((r.h - 60) / 12));
        for (let i = 0; i < Math.min(descLines.length, maxLines); i++) {
            ctx.fillText(descLines[i], r.x + 12, startY + i * 12);
        }

        // Footer: → L? 解决
        if (r.h >= 64) {
            ctx.fillStyle = r.data.color;
            ctx.font = 'bold 10px sans-serif';
            const targetLayer = this.layers[r.data.target];
            ctx.fillText('→ ' + targetLayer.title + ' 解决', r.x + 12, r.y + r.h - 14);
        }

        ctx.globalAlpha = 1;
    }

    _drawLayer(ctx, r, theme) {
        const { isDark, textColor, subColor, cardBg, cardBorder, innerBg } = theme;
        const isLit = r.index < this.step;
        const isActive = this._isLayerHighlighted(r.index);
        const isDim = (this.hover.type === 'layer' || this.hover.type === 'pain') && !isActive;

        ctx.globalAlpha = isDim ? 0.55 : 1;

        // Background gradient
        const gradTop = isLit ? r.data.color : innerBg;
        const gradBot = isLit ? r.data.color + 'CC' : (isDark ? '#0B1220' : '#E2E8F0');
        const grad = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
        grad.addColorStop(0, gradTop);
        grad.addColorStop(1, gradBot);
        ctx.fillStyle = grad;
        this.roundRect(ctx, r.x, r.y, r.w, r.h, 8);
        ctx.fill();

        // Border
        if (isActive) {
            ctx.save();
            ctx.shadowColor = r.data.color;
            ctx.shadowBlur = 12;
            ctx.strokeStyle = r.data.color;
            ctx.lineWidth = 2;
            this.roundRect(ctx, r.x, r.y, r.w, r.h, 8);
            ctx.stroke();
            ctx.restore();
        } else {
            ctx.strokeStyle = isLit ? r.data.color : cardBorder;
            ctx.lineWidth = isLit ? 1.5 : 1;
            this.roundRect(ctx, r.x, r.y, r.w, r.h, 8);
            ctx.stroke();
        }

        // Key pill
        const pillW = 28, pillH = 16;
        const pillX = r.x + 10;
        const pillY = r.y + r.h / 2 - pillH / 2;
        ctx.fillStyle = isLit ? 'rgba(255,255,255,0.18)' : r.data.color + '22';
        this.roundRect(ctx, pillX, pillY, pillW, pillH, 4);
        ctx.fill();
        ctx.fillStyle = isLit ? '#FFFFFF' : r.data.color;
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(r.data.key, pillX + pillW / 2, pillY + pillH / 2 + 0.5);

        // Title
        ctx.fillStyle = isLit ? '#FFFFFF' : textColor;
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(r.data.title, r.x + 10 + pillW + 8, r.y + r.h / 2 - 7);

        // Description
        ctx.fillStyle = isLit ? 'rgba(255,255,255,0.92)' : subColor;
        ctx.font = '10px sans-serif';
        ctx.textAlign = r.w > 220 ? 'right' : 'left';
        const descText = r.data.desc;
        if (r.w > 220) {
            ctx.fillText(descText, r.x + r.w - 12, r.y + r.h / 2 + 9);
        } else {
            const descLines = this.wrapText(ctx, descText, r.x + 10 + pillW + 8, 0, r.w - pillW - 30, 11);
            ctx.fillText(descLines[0] || '', r.x + 10 + pillW + 8, r.y + r.h / 2 + 9);
        }

        ctx.globalAlpha = 1;
    }

    _drawArrow(ctx, painRect, layerRect, color, opts) {
        const { isDark, isActive } = opts;
        const fromX = painRect.x + painRect.w;
        const fromY = painRect.y + painRect.h / 2;
        const toX = layerRect.x;
        const toY = layerRect.y + layerRect.h / 2;

        // Bezier control points pull outward for a soft curve.
        const dx = toX - fromX;
        const cpOffset = Math.max(28, Math.min(60, dx * 0.35));
        const cp1X = fromX + cpOffset;
        const cp1Y = fromY;
        const cp2X = toX - cpOffset;
        const cp2Y = toY;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, toX - 6, toY);
        ctx.strokeStyle = isActive
            ? color
            : (isDark ? 'rgba(148,163,184,0.4)' : 'rgba(100,116,139,0.4)');
        ctx.lineWidth = isActive ? 2 : 1;
        if (!isActive) ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        if (isActive) {
            // Arrow head pointing at the layer
            const angle = Math.atan2(toY - cp2Y, toX - 6 - cp2X);
            const headLen = 8;
            ctx.beginPath();
            ctx.moveTo(toX, toY);
            ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6),
                       toY - headLen * Math.sin(angle - Math.PI / 6));
            ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6),
                       toY - headLen * Math.sin(angle + Math.PI / 6));
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();

            // Small "solved" tag along the line
            const midT = 0.5;
            const midX = this._bezierAt(fromX, cp1X, cp2X, toX, midT);
            const midY = this._bezierAt(fromY, cp1Y, cp2Y, toY, midT);
            ctx.fillStyle = color;
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('解决', midX, midY - 10);
        }
        ctx.restore();
    }

    _bezierAt(p0, p1, p2, p3, t) {
        const mt = 1 - t;
        return mt * mt * mt * p0 +
               3 * mt * mt * t * p1 +
               3 * mt * t * t * p2 +
               t * t * t * p3;
    }

    _drawApiBox(ctx, m, theme) {
        const { isDark, textColor, subColor, cardBg, cardBorder, innerBg } = theme;
        ctx.fillStyle = cardBg;
        this.roundRect(ctx, m.x, m.y, m.w, m.h, 10);
        ctx.fill();
        ctx.strokeStyle = cardBorder;
        ctx.lineWidth = 1;
        this.roundRect(ctx, m.x, m.y, m.w, m.h, 10);
        ctx.stroke();

        // Title bar
        ctx.fillStyle = textColor;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('层 API 接口', m.x + 10, m.y + 8);

        ctx.fillStyle = subColor;
        ctx.font = '9px sans-serif';
        ctx.fillText('hover 任意层查看', m.x + 10, m.y + 24);

        // Determine target layer
        let targetIdx;
        if (this.hover.type === 'layer') {
            targetIdx = this.hover.index;
        } else if (this.hover.type === 'pain') {
            targetIdx = this.painPoints[this.hover.index].target;
        } else {
            targetIdx = Math.max(0, Math.min(this.step - 1, this.layers.length - 1));
        }
        const layer = this.layers[targetIdx];

        // Layer badge + title
        const badgeY = m.y + 44;
        ctx.fillStyle = layer.color;
        this.roundRect(ctx, m.x + 10, badgeY, 32, 16, 4);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(layer.key, m.x + 26, badgeY + 8);

        ctx.fillStyle = textColor;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(layer.title, m.x + 48, badgeY + 8);

        // Layer description
        ctx.fillStyle = subColor;
        ctx.font = '10px sans-serif';
        const descLines = this.wrapText(ctx, layer.desc, m.x + 12, 0, m.w - 24, 12);
        let dy = badgeY + 24;
        for (const line of descLines) {
            ctx.fillText(line, m.x + 12, dy);
            dy += 12;
        }

        // Divider
        const divY = dy + 4;
        ctx.strokeStyle = cardBorder;
        ctx.beginPath();
        ctx.moveTo(m.x + 10, divY);
        ctx.lineTo(m.x + m.w - 10, divY);
        ctx.stroke();

        // API code-style block
        const codeY = divY + 4;
        const codeH = m.y + m.h - codeY - 10;
        ctx.fillStyle = innerBg;
        this.roundRect(ctx, m.x + 10, codeY, m.w - 20, codeH, 6);
        ctx.fill();

        ctx.fillStyle = isDark ? '#A5B4FC' : '#4338CA';
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        const apiLines = layer.api.split('\n');
        let ay = codeY + 6;
        const lineH = 12;
        for (const line of apiLines) {
            if (ay + lineH > codeY + codeH - 4) break;
            ctx.fillText(line, m.x + 14, ay);
            ay += lineH;
        }
    }

    _drawProjects(ctx, projects, theme) {
        const { textColor, subColor, cardBorder } = theme;
        projects.forEach((p) => {
            const r = p;
            ctx.fillStyle = p.data.color;
            this.roundRect(ctx, r.x, r.y, r.w, r.h, 8);
            ctx.fill();
            ctx.strokeStyle = p.data.color;
            ctx.lineWidth = 1;
            this.roundRect(ctx, r.x, r.y, r.w, r.h, 8);
            ctx.stroke();

            // Chapter tag
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(p.data.ch, r.x + 12, r.y + 8);

            // Project name
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 14px sans-serif';
            ctx.fillText(p.data.name, r.x + 12, r.y + 26);

            // Footer: "实战项目"
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.font = '9px sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            ctx.fillText('实战项目', r.x + r.w - 10, r.y + r.h - 8);
        });
    }

    _drawProjectsLocked(ctx, projects, theme) {
        const { subColor, cardBorder, isDark } = theme;
        projects.forEach((p) => {
            const r = p;
            ctx.fillStyle = isDark ? 'rgba(148,163,184,0.08)' : 'rgba(100,116,139,0.08)';
            this.roundRect(ctx, r.x, r.y, r.w, r.h, 8);
            ctx.fill();
            ctx.strokeStyle = cardBorder;
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 1;
            this.roundRect(ctx, r.x, r.y, r.w, r.h, 8);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = subColor;
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('○ 顶层点亮后解锁', r.x + r.w / 2, r.y + r.h / 2);
        });
    }
}

registerAnimation('ch7-framework', () => new Ch7Framework());

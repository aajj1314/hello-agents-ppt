/**
 * CH15: Cybertown — 2D 像素小镇 + NPC 好感度 + 对话气泡
 *
 * 视觉概念:
 *  - 主体保留: 2D 像素小镇 (建筑 + 树木 + 道路 + 多个 NPC 圆点)
 *  - 强化一: 好感度显示  - 每个 NPC 头顶显示心形数字 (0-100),
 *                              颜色随好感度变化 (灰 → 绿 → 金 → 紫)
 *  - 强化二: 对话气泡     - 点击 NPC 弹出圆角矩形 + 三角箭头气泡,
 *                              气泡内显示 NPC 台词 + 玩家选项
 *                              "夸他" → 好感度 +5  /  "怼他" → 好感度 -3
 *  - 强化三: 记忆 log     - 右侧滚动条显示所有对话历史 (最多 8 条)
 *  - 播放模式: 自动依次点击每个 NPC + 选"夸他", 展示好感度累积
 *  - 鼠标 hover NPC → 显示"性格 + 职业" tooltip
 */
import { CanvasAnimation } from './canvas-animation.js';
import { registerAnimation } from './animation-registry.js';

class Ch15Cybertown extends CanvasAnimation {
    constructor() {
        super();
        this.animId = 'ch15-cybertown';

        // Playback state
        this._playing = false;
        this._rafId = null;
        this._playIdx = 0;          // which NPC is the auto-play currently visiting
        this._playPhase = 'idle';   // 'idle' | 'opening' | 'waiting' | 'choosing' | 'closing'
        this._playTimer = 0;        // time accumulator for current phase
        this.speed = 1;

        // Interaction state
        this._selectedIdx = -1;     // index of NPC whose dialogue bubble is open
        this._hoveringNpc = -1;     // index of NPC under the mouse (for tooltip)
        this._npcRects = [];        // hit-test circles, recomputed in draw()

        // Memory log (most recent first). Each entry:
        //   { time, npcName, action, delta, score, level }
        this._memLog = [];

        // ---- NPC list ----
        // 4 个 NPC: 张三 / 李四 / 王五 + 学习者
        // Per spec: t.ink / t.primary / t.accentTeal for the first three,
        // and t.accentAmber for the 4th NPC (访客/学习者).
        this.npcs = [
            {
                name: '张三', role: 'Python工程师',
                personality: '严谨 · 热爱代码',
                affinity: 12, colorKey: 'ink',
                quotes: [
                    '这个 bug 真是见鬼了,已经调试两小时了…',
                    '我刚给 SimpleAgent 重构了消息循环,跑通了!',
                    '记住,代码可读性比"聪明"更重要。',
                    '今天先 merge 一下 PR,晚上再看个新需求。'
                ]
            },
            {
                name: '李四', role: '产品经理',
                personality: '外向 · 注重用户',
                affinity: 24, colorKey: 'primary',
                quotes: [
                    '这个功能的优先级需要重新评估一下。',
                    '我们得先做用户调研,再排开发计划。',
                    '为什么用户要在这一步点击"确认"呢?',
                    '和开发同学对一下 v2 的需求列表。'
                ]
            },
            {
                name: '王五', role: 'UI设计师',
                personality: '温和 · 富有创意',
                affinity: 8, colorKey: 'accentTeal',
                quotes: [
                    '这杯咖啡的拉花真不错,灵感来了!',
                    '圆角再小一点,留白再多一点…',
                    '今天主色定成这个 coral,看着舒服。',
                    '我先把新版的对话气泡设计稿画出来。'
                ]
            },
            {
                name: '访客', role: '学习者',
                personality: '好奇 · 正在成长',
                affinity: 4, colorKey: 'accentAmber',
                quotes: [
                    '我正在学 HelloAgents 框架,有点吃力…',
                    '请问 Agent 和普通 LLM 调用有啥区别?',
                    '我试着做了一个简单的 SimpleAgent demo!',
                    '记忆系统是这套框架最让我惊艳的部分。'
                ]
            }
        ];

        // ---- Town static scenery (re-generated on resize) ----
        this.buildings = [];
        this.trees = [];
    }

    // -----------------------------------------------------------------
    //  lifecycle
    // -----------------------------------------------------------------
    init(canvas) {
        super.init(canvas);
        this._generateTown();
        this._setupControls();
        this._setupCanvasEvents();
        window.addEventListener('resize', () => {
            this._resize();
            this._generateTown();
            this.draw();
        });
        this.draw();
    }

    _setupControls() {
        const playBtn  = document.getElementById('btn-play-'  + this.animId);
        const resetBtn = document.getElementById('btn-reset-' + this.animId);
        const stepBtn  = document.getElementById('btn-step-'  + this.animId);
        const speedSld = document.getElementById('speed-'     + this.animId);
        if (playBtn)  playBtn.addEventListener('click',  () => this.togglePlay());
        if (resetBtn) resetBtn.addEventListener('click', () => this.reset());
        if (stepBtn)  stepBtn.addEventListener('click',  () => this.stepForward());
        if (speedSld) speedSld.addEventListener('input',  (e) => {
            this.speed = parseFloat(e.target.value) || 1;
        });
    }

    _setupCanvasEvents() {
        if (!this.canvas) return;
        this.canvas.addEventListener('mousedown',  (e) => this._onMouseDown(e));
        this.canvas.addEventListener('mousemove',  (e) => this._onMouseMove(e));
        this.canvas.addEventListener('mouseup',    (e) => this._onMouseUp(e));
        this.canvas.addEventListener('mouseleave', ()  => this._onMouseLeave());
        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches[0]) {
                e.preventDefault();
                this._onMouseDown(this._touchToMouseEvent(e.touches[0]));
            }
        }, { passive: false });
        this.canvas.addEventListener('touchmove', (e) => {
            if (e.touches[0]) this._onMouseMove(this._touchToMouseEvent(e.touches[0]));
        }, { passive: true });
        this.canvas.addEventListener('touchend', () => this._onMouseUp());
    }

    _touchToMouseEvent(touch) {
        return { clientX: touch.clientX, clientY: touch.clientY };
    }

    // -----------------------------------------------------------------
    //  playback API
    // -----------------------------------------------------------------
    togglePlay() {
        if (this._playing) {
            this._playing = false;
            cancelAnimationFrame(this._rafId);
            this._playPhase = 'idle';
            this._setPlayButtonLabel('▶ 播放');
            return;
        }
        // If a bubble is open, close it before starting playback
        this._selectedIdx = -1;
        this._playing = true;
        this._playIdx = 0;
        this._playPhase = 'opening';
        this._playTimer = 0;
        this._setPlayButtonLabel('⏸ 暂停');
        this._loop();
    }

    _loop() {
        if (!this._playing) return;
        const phaseDur = 0.9;          // seconds per phase (scaled by speed)
        this._playTimer += 0.016 * (this.speed || 1);

        if (this._playTimer >= phaseDur) {
            this._playTimer = 0;
            this._advancePlayPhase();
        }
        this.draw();
        this._rafId = requestAnimationFrame(() => this._loop());
    }

    _advancePlayPhase() {
        const idx = this._playIdx;
        switch (this._playPhase) {
            case 'opening':
                this._selectedIdx = idx;
                this._playPhase = 'waiting';
                break;
            case 'waiting':
                this._playPhase = 'choosing';
                break;
            case 'choosing':
                // Always "夸他" in play mode
                this._applyAffinity(idx, +5, '夸他 (自动)');
                this._playPhase = 'closing';
                break;
            case 'closing':
                this._selectedIdx = -1;
                this._playIdx = (this._playIdx + 1) % this.npcs.length;
                this._playPhase = 'opening';
                // After completing a full loop, stop auto-play
                if (this._playIdx === 0) {
                    this._playing = false;
                    cancelAnimationFrame(this._rafId);
                    this._playPhase = 'idle';
                    this._setPlayButtonLabel('▶ 播放');
                }
                break;
        }
    }

    stepForward() {
        // Pick the next NPC and "夸" them once (like one frame of auto-play)
        if (this._selectedIdx >= 0) {
            // If a bubble is open, apply a +5 to that NPC
            this._applyAffinity(this._selectedIdx, +5, '夸他 (步进)');
            this._selectedIdx = -1;
        } else {
            this._selectedIdx = this._playIdx % this.npcs.length;
            this._playIdx = (this._playIdx + 1) % this.npcs.length;
        }
        this.draw();
    }

    reset() {
        this._playing = false;
        cancelAnimationFrame(this._rafId);
        this._playIdx = 0;
        this._playPhase = 'idle';
        this._selectedIdx = -1;
        this._hoveringNpc = -1;
        this._memLog = [];
        // Reset all affinity scores
        this.npcs.forEach((n, i) => { n.affinity = [12, 24, 8, 4][i] || 10; });
        this._setPlayButtonLabel('▶ 播放');
        this.canvas.style.cursor = 'default';
        this.draw();
    }

    setSpeed(v) { this.speed = v; }
    play()      { if (!this._playing) this.togglePlay(); }
    pause()     { if (this._playing)  this.togglePlay(); }
    step()      { this.stepForward(); }

    _setPlayButtonLabel(label) {
        const btn = document.getElementById('btn-play-' + this.animId);
        if (btn) btn.textContent = label;
    }

    // -----------------------------------------------------------------
    //  mouse / touch interaction
    // -----------------------------------------------------------------
    _canvasPoint(e) {
        const rect = this.canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    _onMouseDown(e) {
        if (!this.ctx) return;
        const { x, y } = this._canvasPoint(e);

        // If a bubble is open, check the buttons inside it first
        if (this._selectedIdx >= 0) {
            const btn = this._hitTestBubbleButton(x, y);
            if (btn === 'praise') {
                this._applyAffinity(this._selectedIdx, +5, '夸他');
                this._selectedIdx = -1;
                this.canvas.style.cursor = 'default';
                this.draw();
                return;
            } else if (btn === 'scold') {
                this._applyAffinity(this._selectedIdx, -3, '怼他');
                this._selectedIdx = -1;
                this.canvas.style.cursor = 'default';
                this.draw();
                return;
            } else if (btn === 'close') {
                this._selectedIdx = -1;
                this.canvas.style.cursor = 'default';
                this.draw();
                return;
            }
            // Click outside the bubble: close it
            const bub = this._bubbleRect();
            if (bub && this._pointInRect(x, y, bub)) {
                // Click was inside the bubble (but not on a button) - do nothing
                return;
            }
            this._selectedIdx = -1;
            this.canvas.style.cursor = 'default';
            this.draw();
            return;
        }

        // Otherwise: check if click landed on an NPC
        const idx = this._hitTestNpc(x, y);
        if (idx >= 0) {
            // Pause any auto-play so the user can take over
            if (this._playing) {
                this._playing = false;
                cancelAnimationFrame(this._rafId);
                this._playPhase = 'idle';
                this._setPlayButtonLabel('▶ 播放');
            }
            this._selectedIdx = idx;
            this.draw();
        }
    }

    _onMouseMove(e) {
        if (!this.ctx) return;
        const { x, y } = this._canvasPoint(e);

        // If a bubble is open, show pointer cursor over its buttons
        if (this._selectedIdx >= 0) {
            const btn = this._hitTestBubbleButton(x, y);
            if (btn) {
                this.canvas.style.cursor = 'pointer';
            } else {
                this.canvas.style.cursor = 'default';
            }
            return;
        }

        // Otherwise: update hover state over an NPC
        const idx = this._hitTestNpc(x, y);
        if (idx !== this._hoveringNpc) {
            this._hoveringNpc = idx;
            this.canvas.style.cursor = idx >= 0 ? 'pointer' : 'default';
            this.draw();
        }
    }

    _onMouseUp() {
        // nothing special — mousedown handles everything
    }

    _onMouseLeave() {
        if (this._hoveringNpc !== -1) {
            this._hoveringNpc = -1;
            this.canvas.style.cursor = 'default';
            this.draw();
        }
    }

    _hitTestNpc(x, y) {
        for (const r of this._npcRects) {
            const dx = x - r.x, dy = y - r.y;
            if (dx * dx + dy * dy <= r.r * r.r) return r.idx;
        }
        return -1;
    }

    _pointInRect(x, y, rect) {
        return x >= rect.x && x <= rect.x + rect.w &&
               y >= rect.y && y <= rect.y + rect.h;
    }

    // -----------------------------------------------------------------
    //  town generation
    // -----------------------------------------------------------------
    _generateTown() {
        const w = this.width;
        const h = this.height;
        const t = this.theme();
        const dark = this.isDarkTheme();

        // Buildings: light vs dark palette driven by theme tokens
        // (light) / a darker shade (dark) — per-building colorKey determines
        // the family. _lighten / _darken of the resolved token does the rest.
        const bPositions = [
            { x: 0.04, y: 0.30, w: 0.16, h: 0.18, colorKey: 'ink',        label: '研发部' },
            { x: 0.24, y: 0.26, w: 0.17, h: 0.20, colorKey: 'primary',    label: '产品部' },
            { x: 0.45, y: 0.30, w: 0.14, h: 0.17, colorKey: 'accentTeal', label: '设计部' },
            { x: 0.06, y: 0.62, w: 0.13, h: 0.14, colorKey: 'accentAmber',label: '咖啡厅' },
            { x: 0.24, y: 0.60, w: 0.13, h: 0.13, colorKey: 'primary',    label: '会议室' },
            { x: 0.42, y: 0.60, w: 0.13, h: 0.13, colorKey: 'accentTeal', label: '休息区' }
        ];
        this.buildings = bPositions.map(p => {
            const base = t[p.colorKey];
            const color = dark ? this._darken(base, 0.55) : this._lighten(base, 0.10);
            return {
                x: p.x * w, y: p.y * h, w: p.w * w, h: p.h * h,
                color, label: p.label,
                windows: this._generateWindows(p.x * w, p.y * h, p.w * w, p.h * h)
            };
        });

        // Trees — resolve trunk / leaf tokens once and place trees
        const trunkDark  = t.body;
        const trunkLight = t.accentAmber;
        const leafDark   = t.success;
        const leafDark2  = t.accentTeal;
        const leafLight  = t.success;
        const leafLight2 = t.accentTeal;

        const tPositions = [
            { x: 0.02, y: 0.50 }, { x: 0.06, y: 0.54 },
            { x: 0.21, y: 0.12 }, { x: 0.39, y: 0.11 },
            { x: 0.58, y: 0.50 }, { x: 0.59, y: 0.55 }
        ];
        this.trees = tPositions.map(p => ({
            x: p.x * w, y: p.y * h, size: 8 + Math.random() * 6,
            trunkCol: dark ? trunkDark : trunkLight,
            leafCol:  dark ? leafDark  : leafLight,
            leafCol2: dark ? leafDark2 : leafLight2
        }));
    }

    _generateWindows(bx, by, bw, bh) {
        const windows = [];
        const cols = Math.max(2, Math.floor(bw / 26));
        const rows = Math.max(2, Math.floor(bh / 22));
        const padX = 8, padY = 10;
        for (let r = 0; r < rows && r < 4; r++) {
            for (let c = 0; c < cols && c < 5; c++) {
                windows.push({
                    x: bx + padX + c * 22 + (bw - cols * 22) / 2,
                    y: by + padY + r * 18 + (bh - rows * 18) / 2,
                    lit: Math.random() > 0.3
                });
            }
        }
        return windows;
    }

    // -----------------------------------------------------------------
    //  affinity helpers
    // -----------------------------------------------------------------
    _affinityLevel(score) {
        const t = this.theme();
        if (score <= 20) return { name: '陌生',   colorKey: 'mutedSoft' };
        if (score <= 40) return { name: '熟悉',   colorKey: 'success' };
        if (score <= 60) return { name: '友好',   colorKey: 'success' };
        if (score <= 80) return { name: '亲密',   colorKey: 'accentAmber' };
        return                  { name: '挚友',   colorKey: 'primary' };
    }

    _applyAffinity(idx, delta, actionLabel) {
        const npc = this.npcs[idx];
        if (!npc) return;
        npc.affinity = Math.max(0, Math.min(100, npc.affinity + delta));
        const level = this._affinityLevel(npc.affinity);
        const now = new Date();
        const hh = now.getHours().toString().padStart(2, '0');
        const mm = now.getMinutes().toString().padStart(2, '0');
        const ss = now.getSeconds().toString().padStart(2, '0');
        this._memLog.unshift({
            time: `${hh}:${mm}:${ss}`,
            npcName: npc.name,
            action: actionLabel,
            delta: (delta > 0 ? '+' : '') + delta,
            score: npc.affinity,
            level: level.name
        });
        if (this._memLog.length > 8) this._memLog.length = 8;
    }

    // -----------------------------------------------------------------
    //  layout helpers
    // -----------------------------------------------------------------
    _layout() {
        // Layout regions inside the canvas.
        // Left ~62% = town area, right ~32% = memory log panel.
        const w = this.width;
        const h = this.height;
        const titleH  = 28;
        const footerH = 22;
        const padX    = 12;
        const sidebarW = Math.max(200, Math.min(260, w * 0.32));
        const sidebarX = w - sidebarW - padX;
        const townX    = padX;
        const townW    = Math.max(280, sidebarX - padX - 12);
        const townY    = titleH + 4;
        const townH    = h - titleH - footerH - 8;
        return { w, h, titleH, footerH, padX, sidebarX, sidebarW, townX, townW, townY, townH };
    }

    _bubbleRect() {
        if (this._selectedIdx < 0) return null;
        const lay = this._layout();
        const npcR = this._npcRects[this._selectedIdx];
        if (!npcR) return null;
        const bw = 240, bh = 116;
        // Default: above the NPC
        let bx = npcR.x - bw / 2;
        let by = npcR.y - npcR.r - bh - 14;
        // Clamp inside the town area
        if (bx < lay.townX + 4) bx = lay.townX + 4;
        if (bx + bw > lay.townX + lay.townW - 4) bx = lay.townX + lay.townW - bw - 4;
        if (by < lay.townY + 4) by = npcR.y + npcR.r + 14;   // flip below NPC
        return { x: bx, y: by, w: bw, h: bh, npcX: npcR.x, npcY: npcR.y, npcR: npcR.r };
    }

    _hitTestBubbleButton(x, y) {
        const bub = this._bubbleRect();
        if (!bub) return null;
        // Two buttons at the bottom of the bubble
        const btnY = bub.y + bub.h - 36;
        const btnH = 26;
        const padX = 10;
        const btnW = (bub.w - padX * 3) / 2;
        const praiseX = bub.x + padX;
        const scoldX  = praiseX + btnW + padX;
        if (y >= btnY && y <= btnY + btnH) {
            if (x >= praiseX && x <= praiseX + btnW) return 'praise';
            if (x >= scoldX  && x <= scoldX  + btnW) return 'scold';
        }
        // Close (×) in the top-right corner
        const closeX = bub.x + bub.w - 22;
        const closeY = bub.y + 4;
        if (x >= closeX && x <= closeX + 18 &&
            y >= closeY && y <= closeY + 18) {
            return 'close';
        }
        return null;
    }

    // -----------------------------------------------------------------
    //  main draw
    // -----------------------------------------------------------------
    draw() {
        if (!this.ctx) return;
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        const t = this.theme();
        const dark = this.isDarkTheme();

        // Palette
        const bg        = dark ? t.surfaceDarkSoft : t.canvas;
        const textColor = t.ink;
        const subColor  = t.muted;
        const borderCol = this._withAlpha(t.muted, dark ? 0.25 : 0.25);
        const panelBg   = dark
            ? this._withAlpha(t.surfaceDark, 0.6)
            : this._withAlpha(t.surfaceCard, 0.85);
        // Resolve NPC + affinity level colors from theme tokens
        for (let i = 0; i < this.npcs.length; i++) {
            this.npcs[i].color = t[this.npcs[i].colorKey];
        }
        for (const lvl of ['mutedSoft', 'success', 'success', 'accentAmber', 'primary']) {
            // levels cache lazily in _affinityLevel
        }

        // Background
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        // Title
        ctx.fillStyle = textColor;
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('🏙️ 赛博小镇  ·  AI Agent Town + 好感度系统', 16, 6);
        ctx.fillStyle = subColor;
        ctx.font = '10px sans-serif';
        ctx.fillText('点击 NPC 弹出对话气泡  ·  悬停查看性格  ·  播放自动夸人', 16, 24);

        const lay = this._layout();

        // ---- Town panel (left) ----
        this._drawTown(ctx, lay.townX, lay.townY, lay.townW, lay.townH, textColor, subColor, borderCol, dark, t);

        // ---- Memory log (right) ----
        this._drawMemoryLog(ctx, lay.sidebarX, lay.townY, lay.sidebarW, lay.townH, textColor, subColor, borderCol, panelBg, dark, t);

        // ---- Footer ----
        this._drawFooter(ctx, w, h, subColor, textColor);

        // ---- Dialogue bubble (on top of everything) ----
        if (this._selectedIdx >= 0) {
            this._drawBubble(ctx, textColor, subColor, borderCol, dark, t);
        }

        // ---- Hover tooltip (very top layer) ----
        if (this._hoveringNpc >= 0 && this._selectedIdx < 0) {
            this._drawNpcTooltip(ctx, this._hoveringNpc, textColor, subColor, borderCol, dark, t);
        }
    }

    // -----------------------------------------------------------------
    //  town draw
    // -----------------------------------------------------------------
    _drawTown(ctx, x, y, w, h, textColor, subColor, borderCol, dark, t) {
        // Panel background
        ctx.fillStyle = dark
            ? this._withAlpha(t.surfaceDark, 0.40)
            : this._withAlpha(t.surfaceCard, 0.55);
        this.roundRect(ctx, x, y, w, h, 10);
        ctx.fill();
        ctx.strokeStyle = borderCol;
        ctx.lineWidth = 1;
        this.roundRect(ctx, x, y, w, h, 10);
        ctx.stroke();

        // Roads — use t.hairline (light) / t.muted at 0.25 (dark)
        const roadY1 = y + h * 0.48;
        const roadY2 = y + h * 0.80;
        ctx.fillStyle = dark
            ? this._withAlpha(t.muted, 0.25)
            : this._withAlpha(t.hairline, 0.7);
        ctx.fillRect(x + 4, roadY1, w - 8, 6);
        ctx.fillRect(x + 4, roadY2, w - 8, 6);

        // Trees
        for (const tree of this.trees) {
            ctx.fillStyle = tree.trunkCol;
            ctx.fillRect(tree.x - 2, tree.y - 2, 4, 8);
            ctx.beginPath();
            ctx.arc(tree.x, tree.y - 6, tree.size * 0.7, 0, Math.PI * 2);
            ctx.fillStyle = tree.leafCol;
            ctx.fill();
            ctx.beginPath();
            ctx.arc(tree.x - 4, tree.y - 4, tree.size * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = tree.leafCol2;
            ctx.fill();
        }

        // Buildings
        for (const b of this.buildings) {
            const grad = ctx.createLinearGradient(b.x, b.y, b.x + b.w, b.y + b.h);
            grad.addColorStop(0, this._lightenColor(b.color, 20));
            grad.addColorStop(1, b.color);
            this.roundRect(ctx, b.x, b.y, b.w, b.h, 6);
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.strokeStyle = dark
                ? this._withAlpha(t.onDark, 0.10)
                : this._withAlpha(t.ink, 0.15);
            ctx.lineWidth = 1.2;
            ctx.stroke();
            // Windows
            for (const win of b.windows) {
                ctx.fillStyle = win.lit
                    ? t.accentAmber
                    : (dark ? t.surfaceDark : t.hairline);
                ctx.fillRect(win.x, win.y, 12, 9);
            }
            // Label
            ctx.fillStyle = textColor;
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h + 3);
        }

        // NPC positions (within the town area)
        const positions = [
            { x: x + w * 0.18, y: y + h * 0.38 },
            { x: x + w * 0.36, y: y + h * 0.36 },
            { x: x + w * 0.55, y: y + h * 0.38 },
            { x: x + w * 0.10, y: y + h * 0.68 }
        ].map(p => ({
            x: Math.max(x + 28, Math.min(x + w - 28, p.x)),
            y: Math.max(y + 50, Math.min(y + h - 40, p.y))
        }));

        // Draw NPCs (slight bobbing for life)
        const now = performance.now() / 600;
        this._npcRects = [];
        for (let i = 0; i < this.npcs.length; i++) {
            const npc = this.npcs[i];
            const p = positions[i];
            const bob = Math.sin(now + i * 1.3) * 1.5;
            const r = 18;
            const cx = p.x;
            const cy = p.y + bob;
            const isSelected = i === this._selectedIdx;
            const isHover = i === this._hoveringNpc;
            const level = this._affinityLevel(npc.affinity);
            const levelColor = t[level.colorKey];

            this._npcRects.push({ idx: i, x: cx, y: cy, r: r + 4 });

            // Shadow
            ctx.beginPath();
            ctx.ellipse(cx, cy + r + 1, r * 0.7, 3, 0, 0, Math.PI * 2);
            ctx.fillStyle = dark
                ? this._withAlpha(t.ink, 0.35)
                : this._withAlpha(t.ink, 0.12);
            ctx.fill();

            // Halo on hover / selected
            if (isHover || isSelected) {
                ctx.beginPath();
                ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
                ctx.fillStyle = this._withAlpha(npc.color, isSelected ? 0.27 : 0.13);
                ctx.fill();
            }

            // Body circle (radial gradient for that "pixel" glow)
            const grad = ctx.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, r);
            grad.addColorStop(0, this._lightenColor(npc.color, 40));
            grad.addColorStop(1, npc.color);
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.strokeStyle = isSelected
                ? t.primaryActive
                : (dark
                    ? this._withAlpha(t.onDark, 0.25)
                    : this._withAlpha(t.ink, 0.25));
            ctx.lineWidth = isSelected ? 2.5 : 1.5;
            ctx.stroke();

            // Face emoji
            ctx.fillStyle = t.onDark;
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🤖', cx, cy - 1);

            // Affinity heart + number badge above the NPC
            this._drawAffinityBadge(ctx, cx, cy - r - 12, npc.affinity, levelColor, dark, t);

            // Name + role below the NPC
            ctx.fillStyle = textColor;
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(npc.name, cx, cy + r + 4);
            ctx.fillStyle = subColor;
            ctx.font = '9px sans-serif';
            ctx.fillText(npc.role, cx, cy + r + 16);
        }
    }

    _drawAffinityBadge(ctx, cx, cy, score, levelColor, dark, t) {
        const padX = 5;
        const text = `♥ ${score}`;
        ctx.font = 'bold 10px sans-serif';
        const tw = ctx.measureText(text).width;
        const bw = tw + padX * 2 + 4;
        const bh = 16;
        const bx = cx - bw / 2;
        const by = cy - bh / 2;

        // Background pill (dark backdrop for legibility on any theme)
        ctx.fillStyle = this._withAlpha(t.surfaceDark, 0.78);
        this.roundRect(ctx, bx, by, bw, bh, 8);
        ctx.fill();
        // Colored ring (matches the affinity level color)
        ctx.strokeStyle = levelColor;
        ctx.lineWidth = 1.5;
        this.roundRect(ctx, bx, by, bw, bh, 8);
        ctx.stroke();

        // Heart + number
        ctx.fillStyle = levelColor;
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, cx, cy + 0.5);
    }

    // -----------------------------------------------------------------
    //  dialogue bubble
    // -----------------------------------------------------------------
    _drawBubble(ctx, textColor, subColor, borderCol, dark, t) {
        const bub = this._bubbleRect();
        if (!bub) return;
        const npc = this.npcs[this._selectedIdx];
        if (!npc) return;
        const level = this._affinityLevel(npc.affinity);
        const levelColor = t[level.colorKey];

        // Bubble shadow
        ctx.fillStyle = this._withAlpha(t.ink, 0.20);
        this.roundRect(ctx, bub.x + 1, bub.y + 2, bub.w, bub.h, 10);
        ctx.fill();

        // Bubble body
        ctx.fillStyle = dark ? t.surfaceDark : t.surfaceCard;
        this.roundRect(ctx, bub.x, bub.y, bub.w, bub.h, 10);
        ctx.fill();
        ctx.strokeStyle = npc.color;
        ctx.lineWidth = 1.5;
        this.roundRect(ctx, bub.x, bub.y, bub.w, bub.h, 10);
        ctx.stroke();

        // Pointer triangle (toward the NPC)
        const triY = (bub.y < bub.npcY) ? bub.y + bub.h : bub.y;
        const triDir = (bub.y < bub.npcY) ? 1 : -1;
        const triCx = Math.max(bub.x + 14, Math.min(bub.x + bub.w - 14, bub.npcX));
        ctx.beginPath();
        ctx.moveTo(triCx, triY);
        ctx.lineTo(triCx - 6, triY + triDir * 8);
        ctx.lineTo(triCx + 6, triY + triDir * 8);
        ctx.closePath();
        ctx.fillStyle = dark ? t.surfaceDark : t.surfaceCard;
        ctx.fill();
        ctx.strokeStyle = npc.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Header strip (NPC name + level badge)
        // We use a clipped rect to keep the top-left/top-right rounded corners
        // that match the bubble body. The base class roundRect takes a single
        // radius, so we just clip and use a regular rectangle for the header.
        ctx.save();
        ctx.beginPath();
        this.roundRect(ctx, bub.x, bub.y, bub.w, bub.h, 10);
        ctx.clip();
        ctx.fillStyle = npc.color;
        ctx.fillRect(bub.x, bub.y, bub.w, 22);
        ctx.restore();
        ctx.fillStyle = t.onDark;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${npc.name}  ·  ${npc.role}`, bub.x + 10, bub.y + 11);
        // Level pill on the right
        ctx.font = 'bold 9px sans-serif';
        const lblW = ctx.measureText(level.name).width + 10;
        ctx.fillStyle = this._withAlpha(t.onDark, 0.25);
        this.roundRect(ctx, bub.x + bub.w - lblW - 28, bub.y + 4, lblW, 14, 7);
        ctx.fill();
        ctx.fillStyle = t.onDark;
        ctx.textAlign = 'center';
        ctx.fillText(level.name, bub.x + bub.w - lblW / 2 - 28, bub.y + 11);

        // Close (×) button
        ctx.fillStyle = t.onDark;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('×', bub.x + bub.w - 14, bub.y + 11);

        // Dialogue text (NPC quote, wrapped)
        const quote = npc.quotes[Math.floor(performance.now() / 3000) % npc.quotes.length];
        ctx.fillStyle = textColor;
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        const lines = this._wrapCJK(ctx, `"${quote}"`, bub.w - 20);
        let lineY = bub.y + 30;
        for (const line of lines.slice(0, 3)) {
            ctx.fillText(line, bub.x + 10, lineY);
            lineY += 14;
        }

        // ---- Two action buttons (夸他 / 怼他) ----
        const btnY = bub.y + bub.h - 36;
        const btnH = 26;
        const padX = 10;
        const btnW = (bub.w - padX * 3) / 2;
        const praiseX = bub.x + padX;
        const scoldX  = praiseX + btnW + padX;

        // 夸他 (praise) — success
        ctx.fillStyle = t.success;
        this.roundRect(ctx, praiseX, btnY, btnW, btnH, 6);
        ctx.fill();
        ctx.fillStyle = t.onDark;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('👍 夸他  (+5)', praiseX + btnW / 2, btnY + btnH / 2 + 1);

        // 怼他 (scold) — error
        ctx.fillStyle = t.error;
        this.roundRect(ctx, scoldX, btnY, btnW, btnH, 6);
        ctx.fill();
        ctx.fillStyle = t.onDark;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('👎 怼他  (-3)', scoldX + btnW / 2, btnY + btnH / 2 + 1);

        // Hint line
        ctx.fillStyle = subColor;
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('点击外部关闭', bub.x + bub.w / 2, bub.y + bub.h - 6);
    }

    // -----------------------------------------------------------------
    //  memory log (right sidebar)
    // -----------------------------------------------------------------
    _drawMemoryLog(ctx, x, y, w, h, textColor, subColor, borderCol, panelBg, dark, t) {
        // Panel
        ctx.fillStyle = panelBg;
        this.roundRect(ctx, x, y, w, h, 10);
        ctx.fill();
        ctx.strokeStyle = borderCol;
        ctx.lineWidth = 1;
        this.roundRect(ctx, x, y, w, h, 10);
        ctx.stroke();

        const padX = 12;
        let cursorY = y + 10;

        // Title
        ctx.fillStyle = textColor;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('📜  记忆日志  Memory Log', x + padX, cursorY);
        cursorY += 18;

        // Subtitle / counter
        ctx.fillStyle = subColor;
        ctx.font = '9px sans-serif';
        ctx.fillText(`最近 ${this._memLog.length} / 8 条对话`, x + padX, cursorY);
        cursorY += 14;

        // Separator
        ctx.strokeStyle = borderCol;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + padX, cursorY);
        ctx.lineTo(x + w - padX, cursorY);
        ctx.stroke();
        cursorY += 6;

        // Each log entry
        const rowH = 26;
        if (this._memLog.length === 0) {
            ctx.fillStyle = subColor;
            ctx.font = 'italic 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('还没有对话记录  ·  点击 NPC 开始', x + w / 2, cursorY + 20);
        } else {
            for (let i = 0; i < this._memLog.length; i++) {
                const e = this._memLog[i];
                const entryY = cursorY + i * rowH;
                if (entryY + rowH > y + h - 6) break;     // don't overflow panel

                // Left color stripe
                const positive = e.delta.startsWith('+');
                const stripeCol = positive ? t.success : t.error;
                ctx.fillStyle = stripeCol;
                ctx.fillRect(x + padX, entryY + 2, 2, rowH - 6);

                // Time + NPC name
                ctx.fillStyle = textColor;
                ctx.font = 'bold 9px sans-serif';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                ctx.fillText(`${e.time}  ${e.npcName}`, x + padX + 8, entryY + 1);

                // Action (truncated to fit)
                const actionText = e.action.length > 12 ? e.action.slice(0, 12) + '…' : e.action;
                ctx.fillStyle = subColor;
                ctx.font = '9px sans-serif';
                ctx.fillText(actionText, x + padX + 8, entryY + 12);

                // Delta + score on the right
                ctx.fillStyle = stripeCol;
                ctx.font = 'bold 9px sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText(e.delta, x + w - padX - 4, entryY + 1);
                ctx.fillStyle = subColor;
                ctx.font = '8px sans-serif';
                ctx.fillText(`${e.score}/100 · ${e.level}`, x + w - padX - 4, entryY + 12);
            }
        }
    }

    // -----------------------------------------------------------------
    //  hover tooltip (NPC personality + role)
    // -----------------------------------------------------------------
    _drawNpcTooltip(ctx, idx, textColor, subColor, borderCol, dark, t) {
        const npc = this.npcs[idx];
        if (!npc) return;
        const rect = this._npcRects[idx];
        if (!rect) return;

        const text1 = npc.name + ' · ' + npc.role;
        const text2 = '性格: ' + npc.personality;
        const text3 = '好感度: ' + npc.affinity + ' / 100  (' + this._affinityLevel(npc.affinity).name + ')';

        ctx.font = 'bold 10px sans-serif';
        const w1 = ctx.measureText(text1).width;
        ctx.font = '9px sans-serif';
        const w2 = ctx.measureText(text2).width;
        const w3 = ctx.measureText(text3).width;
        const tw = Math.max(w1, w2, w3) + 16;
        const th = 46;
        let tx = rect.x - tw / 2;
        let ty = rect.y - rect.r - th - 8;
        if (tx < 8) tx = 8;
        if (tx + tw > this.width - 8) tx = this.width - tw - 8;
        if (ty < 8) ty = rect.y + rect.r + 8;

        ctx.fillStyle = dark
            ? this._withAlpha(t.surfaceDark, 0.96)
            : this._withAlpha(t.surfaceCard, 0.96);
        this.roundRect(ctx, tx, ty, tw, th, 8);
        ctx.fill();
        ctx.strokeStyle = npc.color;
        ctx.lineWidth = 1.5;
        this.roundRect(ctx, tx, ty, tw, th, 8);
        ctx.stroke();

        ctx.fillStyle = npc.color;
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(text1, tx + 8, ty + 6);
        ctx.fillStyle = textColor;
        ctx.font = '9px sans-serif';
        ctx.fillText(text2, tx + 8, ty + 21);
        ctx.fillStyle = subColor;
        ctx.fillText(text3, tx + 8, ty + 33);
    }

    // -----------------------------------------------------------------
    //  footer
    // -----------------------------------------------------------------
    _drawFooter(ctx, w, h, subColor, textColor) {
        ctx.fillStyle = subColor;
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';

        // Compute average affinity for footer status
        const avg = this.npcs.reduce((s, n) => s + n.affinity, 0) / this.npcs.length;
        let status;
        if (this._playing) {
            const phaseLabel = ({
                opening:  '正在打开气泡',
                waiting:  '等待玩家',
                choosing: '自动选 夸他',
                closing:  '关闭气泡',
                idle:     '播放中'
            })[this._playPhase] || '播放中';
            status = `▶ ${phaseLabel}  ·  NPC ${this._playIdx + 1}/${this.npcs.length}  ·  速度 ×${this.speed.toFixed(1)}`;
        } else if (this._selectedIdx >= 0) {
            status = `💬 与 ${this.npcs[this._selectedIdx].name} 对话中  ·  点击按钮或外部区域`;
        } else {
            status = 'Godot + FastAPI + HelloAgents  ·  5 级好感度: 陌生→熟悉→友好→亲密→挚友';
        }
        ctx.fillText(status, 16, h - 6);
        ctx.textAlign = 'right';
        ctx.fillText('平均好感度: ' + avg.toFixed(1) + ' / 100', w - 16, h - 6);
        ctx.textAlign = 'left';
    }

    // -----------------------------------------------------------------
    //  color helpers
    // -----------------------------------------------------------------
    _withAlpha(hex, alpha) {
        if (typeof hex !== 'string' || hex[0] !== '#' || hex.length < 7) return hex;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    }
    _hexToRgb(hex) {
        const num = parseInt(hex.replace('#', ''), 16);
        return { r: (num >> 16) & 0xff, g: (num >> 8) & 0xff, b: num & 0xff };
    }
    _darken(hex, amount) {
        const { r, g, b } = this._hexToRgb(hex);
        const t2 = 0;
        const nr = Math.round((t2 - r) * amount + r);
        const ng = Math.round((t2 - g) * amount + g);
        const nb = Math.round((t2 - b) * amount + b);
        return '#' + [nr, ng, nb].map(v => v.toString(16).padStart(2, '0')).join('');
    }
    _lighten(hex, amount) {
        const { r, g, b } = this._hexToRgb(hex);
        const t2 = 255;
        const nr = Math.round((t2 - r) * amount + r);
        const ng = Math.round((t2 - g) * amount + g);
        const nb = Math.round((t2 - b) * amount + b);
        return '#' + [nr, ng, nb].map(v => v.toString(16).padStart(2, '0')).join('');
    }
    _lightenColor(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return `rgb(${R},${G},${B})`;
    }

    // CJK-aware character wrap (each char is its own unit so it works for both
    // Chinese and English without breaking in the middle of a word).
    _wrapCJK(ctx, text, maxWidth) {
        const lines = [];
        let line = '';
        for (const ch of text) {
            const test = line + ch;
            if (ctx.measureText(test).width > maxWidth && line.length > 0) {
                lines.push(line);
                line = ch;
            } else {
                line = test;
            }
        }
        if (line) lines.push(line);
        return lines;
    }
}

registerAnimation('ch15-cybertown', () => new Ch15Cybertown());

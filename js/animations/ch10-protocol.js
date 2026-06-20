/**
 * CH10: Agent Communication Protocol — Three-Protocol Tabbed Sequence Diagram
 * Three tabs: MCP (Agent ↔ Tool), A2A (Agent ↔ Agent), ANP (Multi-agent + Directory)
 * Each tab shows a UML sequence diagram with actors, lifelines, and animated message arrows.
 * A right-side panel renders a live "protocol comparison" table that highlights the active row.
 */
import { CanvasAnimation } from './canvas-animation.js';
import { registerAnimation } from './animation-registry.js';

class Ch10Protocol extends CanvasAnimation {
    constructor() {
        super();
        this.tabs = ['MCP', 'A2A', 'ANP'];
        this.tabSubs = ['智能体↔工具', '智能体↔智能体', '多边网络'];
        this.activeTab = 0;
        this.step = 0;
        this.isPlaying = false;
        this.speed = 1;
        this.animationId = null;
        this.lastStepTime = 0;
        this._pulse = 0;

        // Per-protocol definitions: title, description, actors, and ordered message sequence.
        this.protocols = [
            {
                key: 'MCP',
                title: 'MCP — Model Context Protocol',
                desc: '请求-响应式：Agent 通过标准化接口调用 Tool（Anthropic 提出，USB-C 比喻）',
                accent: '#6366F1',
                actors: [
                    { name: 'Agent',       color: '#6366F1' },
                    { name: 'Tool Server', color: '#10B981' }
                ],
                messages: [
                    { from: 0, to: 1, text: '1. list_tools()',                 kind: 'sync' },
                    { from: 1, to: 0, text: '2. tools + JSON-Schema',          kind: 'reply' },
                    { from: 0, to: 1, text: '3. call_tool(name, args)',        kind: 'sync' },
                    { from: 1, to: 0, text: '4. result (content/artifact)',    kind: 'reply' }
                ]
            },
            {
                key: 'A2A',
                title: 'A2A — Agent-to-Agent Protocol',
                desc: '任务协作式：两个 Agent 通过 Task / Artifact 双向对话（Google 提出，微信/钉钉比喻）',
                accent: '#3B82F6',
                actors: [
                    { name: 'Coordinator',  color: '#6366F1' },
                    { name: 'Worker Agent', color: '#3B82F6' }
                ],
                messages: [
                    { from: 0, to: 1, text: '1. GET Agent Card',             kind: 'sync' },
                    { from: 1, to: 0, text: '2. capabilities / skills',      kind: 'reply' },
                    { from: 0, to: 1, text: '3. Task {id, payload}',         kind: 'sync' },
                    { from: 1, to: 0, text: '4. status: processing',         kind: 'reply' },
                    { from: 1, to: 0, text: '5. Artifact result',            kind: 'reply' }
                ]
            },
            {
                key: 'ANP',
                title: 'ANP — Agent Network Protocol',
                desc: '发现-路由式：3+ Agent + Directory 中心，动态发现最佳节点（去中心化服务发现）',
                accent: '#8B5CF6',
                actors: [
                    { name: 'Task Agent',     color: '#6366F1' },
                    { name: 'Directory',      color: '#8B5CF6' },
                    { name: 'Service Agent',  color: '#10B981' }
                ],
                messages: [
                    { from: 0, to: 1, text: '1. discover(type, caps)',     kind: 'sync' },
                    { from: 1, to: 0, text: '2. candidates[] + metadata',  kind: 'reply' },
                    { from: 0, to: 2, text: '3. connect + DID auth',       kind: 'sync' },
                    { from: 2, to: 0, text: '4. handshake OK',             kind: 'reply' },
                    { from: 0, to: 2, text: '5. invoke task',              kind: 'sync' },
                    { from: 2, to: 0, text: '6. result',                   kind: 'reply' }
                ]
            }
        ];

        // Right-side comparison table (4 columns × 3 rows).
        this.compareHeaders = ['协议', '用途', '拓扑', '消息'];
        this.compareRows = [
            { name: 'MCP', usage: 'Agent ↔ Tool',     topo: '星型',     msg: 'JSON-RPC' },
            { name: 'A2A', usage: 'Agent ↔ Agent',    topo: '网状',     msg: 'Task/Artifact' },
            { name: 'ANP', usage: '多边发现',         topo: '中心+边缘', msg: '注册/发现' }
        ];

        // Tab hit-test layout (recomputed in draw() based on canvas size).
        this._tabRects = [];
    }

    init(canvas) {
        super.init(canvas);
        this._setupControls();
        this.canvas.addEventListener('mousedown', (e) => this._onCanvasClick(e));
        window.addEventListener('resize', () => { this._resize(); this.draw(); });
        this.draw();
    }

    _setupControls() {
        const animId = 'ch10-protocol';
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

    _onCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        for (const r of this._tabRects) {
            if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
                if (r.idx !== this.activeTab) {
                    this.activeTab = r.idx;
                    this.step = 0;
                    this.lastStepTime = 0;
                } else {
                    // re-click on active tab → reset to first step
                    this.step = 0;
                    this.lastStepTime = 0;
                }
                this.draw();
                return;
            }
        }
    }

    togglePlay() {
        this.isPlaying = !this.isPlaying;
        const btn = document.getElementById('btn-play-ch10-protocol');
        if (btn) btn.textContent = this.isPlaying ? '⏸ 暂停' : '▶ 播放';
        if (this.isPlaying) {
            this.lastStepTime = 0;
            this._loop();
        } else {
            cancelAnimationFrame(this.animationId);
        }
    }

    _loop() {
        if (!this.isPlaying) return;
        const now = performance.now();
        if (!this.lastStepTime) this.lastStepTime = now;
        this._pulse = (this._pulse + 0.045 * (this.speed || 1)) % (Math.PI * 2);
        const proto = this.protocols[this.activeTab];
        // Each tab gets ~5 seconds total; distribute evenly across its messages.
        const tabDur = 5000 / Math.max(this.speed, 0.25);
        const stepDur = tabDur / Math.max(proto.messages.length, 1);
        if (now - this.lastStepTime >= stepDur) {
            this.step = (this.step + 1) % proto.messages.length;
            this.lastStepTime = now;
            if (this.step === 0) {
                // finished a tab — auto-advance
                this.activeTab = (this.activeTab + 1) % this.protocols.length;
            }
        }
        this.draw();
        this.animationId = requestAnimationFrame(() => this._loop());
    }

    stepForward() {
        const proto = this.protocols[this.activeTab];
        this.step = (this.step + 1) % proto.messages.length;
        this.draw();
    }

    reset() {
        this.step = 0;
        this.activeTab = 0;
        this.isPlaying = false;
        this.lastStepTime = 0;
        cancelAnimationFrame(this.animationId);
        const btn = document.getElementById('btn-play-ch10-protocol');
        if (btn) btn.textContent = '▶ 播放';
        this.draw();
    }

    play() {
        if (!this.isPlaying) this.togglePlay();
    }

    pause() {
        if (this.isPlaying) this.togglePlay();
    }

    step() {
        this.stepForward();
    }

    setSpeed(v) {
        this.speed = v;
    }

    draw() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        const isDark = this.isDarkTheme();
        const bg = isDark ? '#0F172A' : '#F8FAFC';
        const textColor = isDark ? '#F1F5F9' : '#0F172A';
        const subTextColor = isDark ? '#94A3B8' : '#475569';
        const accent = this.protocols[this.activeTab].accent;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        // ---- Layout regions ----
        const padX = 16;
        const tabBarY = 12;
        const tabBarH = 30;
        const sidebarW = Math.max(170, Math.min(230, w * 0.28));
        const seqLeft = padX;
        const seqRight = w - sidebarW - padX;
        const seqW = seqRight - seqLeft;
        const statusH = 28;
        const contentTop = tabBarY + tabBarH + 10;
        const contentBottom = h - statusH;

        // ============ TAB BAR ============
        this._tabRects = [];
        const tabW = 92;
        const tabGap = 8;
        for (let i = 0; i < this.tabs.length; i++) {
            const x = seqLeft + i * (tabW + tabGap);
            const isActive = i === this.activeTab;
            // tab background
            ctx.fillStyle = isActive
                ? accent
                : (isDark ? '#1E293B' : '#E2E8F0');
            this.roundRect(ctx, x, tabBarY, tabW, tabBarH, 6);
            ctx.fill();
            if (isActive) {
                ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.6)';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
            // tab text
            ctx.fillStyle = isActive ? '#FFFFFF' : textColor;
            ctx.font = isActive ? 'bold 14px sans-serif' : '600 13px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.tabs[i], x + tabW / 2, tabBarY + tabBarH / 2 - 1);
            // sub label
            ctx.fillStyle = isActive ? 'rgba(255,255,255,0.85)' : subTextColor;
            ctx.font = '9px sans-serif';
            ctx.fillText(this.tabSubs[i], x + tabW / 2, tabBarY + tabBarH - 7);
            // store hit area
            this._tabRects.push({ idx: i, x, y: tabBarY, w: tabW, h: tabBarH });
        }

        // Subtitle for current protocol
        const proto = this.protocols[this.activeTab];
        ctx.fillStyle = textColor;
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(proto.title, seqLeft, contentTop);
        ctx.fillStyle = subTextColor;
        ctx.font = '11px sans-serif';
        const descLines = this.wrapText(ctx, proto.desc, seqLeft, contentTop + 18, seqW, 14);
        descLines.forEach((line, li) => {
            ctx.fillText(line, seqLeft, contentTop + 18 + li * 14);
        });

        // ============ SEQUENCE DIAGRAM ============
        const actors = proto.actors;
        const n = actors.length;
        const diagTop = contentTop + 18 + descLines.length * 14 + 12;
        const diagBottom = contentBottom - 4;
        const actorY = diagTop;
        const actorBoxH = 30;
        const actorBoxW = Math.min(96, Math.max(60, seqW / Math.max(n, 1) - 12));

        // Compute actor X positions evenly spaced
        const actorXs = [];
        for (let i = 0; i < n; i++) {
            const t = n === 1 ? 0.5 : i / (n - 1);
            actorXs.push(seqLeft + t * seqW);
        }

        // Actor boxes
        actors.forEach((a, i) => {
            const x = actorXs[i];
            const bx = x - actorBoxW / 2;
            // glow for active protocol accent
            const grad = ctx.createLinearGradient(bx, actorY, bx, actorY + actorBoxH);
            grad.addColorStop(0, a.color);
            grad.addColorStop(1, isDark ? this._darken(a.color, 0.6) : this._lighten(a.color, 0.7));
            ctx.fillStyle = grad;
            this.roundRect(ctx, bx, actorY, actorBoxW, actorBoxH, 6);
            ctx.fill();
            ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(15,23,42,0.18)';
            ctx.lineWidth = 1;
            ctx.stroke();
            // label
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(a.name, x, actorY + actorBoxH / 2);
        });

        // Lifelines (vertical dashed lines)
        const lifeTop = actorY + actorBoxH + 4;
        const lifeBottom = diagBottom;
        actorXs.forEach((x) => {
            ctx.beginPath();
            ctx.moveTo(x, lifeTop);
            ctx.lineTo(x, lifeBottom);
            ctx.strokeStyle = isDark ? 'rgba(148,163,184,0.45)' : 'rgba(100,116,139,0.5)';
            ctx.lineWidth = 1.2;
            ctx.setLineDash([4, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
        });

        // Self-loop helper: if from === to, draw a small self arrow
        const messages = proto.messages;
        const msgArea = lifeBottom - lifeTop - 10;
        const rowH = msgArea / Math.max(messages.length, 1);

        // Active message "node" markers — small filled circles on each actor's lifeline
        // for messages already delivered (gives the "trace" feel).
        for (let i = 0; i <= this.step; i++) {
            const m = messages[i];
            if (!m) continue;
            const y = lifeTop + 8 + i * rowH;
            [m.from, m.to].forEach((idx) => {
                if (idx < 0 || idx >= actorXs.length) return;
                const x = actorXs[idx];
                ctx.beginPath();
                ctx.arc(x, y, 2.5, 0, Math.PI * 2);
                ctx.fillStyle = isDark ? 'rgba(99,102,241,0.85)' : 'rgba(99,102,241,0.9)';
                ctx.fill();
            });
        }

        // Messages (arrows)
        messages.forEach((m, i) => {
            const y = lifeTop + 8 + i * rowH;
            const ax = actorXs[m.from];
            const bx = actorXs[m.to];
            const isActive = i === this.step;
            const isDone = i < this.step;
            const isFuture = i > this.step;
            let stroke;
            let labelColor;
            if (isActive) {
                stroke = '#EF4444';
                labelColor = '#EF4444';
            } else if (isDone) {
                stroke = isDark ? 'rgba(99,102,241,0.85)' : 'rgba(79,70,229,0.85)';
                labelColor = textColor;
            } else {
                stroke = isDark ? 'rgba(148,163,184,0.25)' : 'rgba(100,116,139,0.25)';
                labelColor = isDark ? 'rgba(148,163,184,0.5)' : 'rgba(100,116,139,0.55)';
            }

            if (m.from === m.to) {
                // self-loop
                const loopW = 22;
                ctx.beginPath();
                ctx.moveTo(ax, y);
                ctx.lineTo(ax + loopW, y);
                ctx.lineTo(ax + loopW, y + 12);
                ctx.lineTo(ax + 2, y + 12);
                ctx.strokeStyle = stroke;
                ctx.lineWidth = isActive ? 2.5 : 1.4;
                ctx.stroke();
                // arrow head
                ctx.beginPath();
                ctx.moveTo(ax + 2, y + 12);
                ctx.lineTo(ax + 2, y + 7);
                ctx.lineTo(ax + 7, y + 12);
                ctx.closePath();
                ctx.fillStyle = stroke;
                ctx.fill();
            } else {
                ctx.beginPath();
                ctx.moveTo(ax, y);
                ctx.lineTo(bx, y);
                ctx.strokeStyle = stroke;
                ctx.lineWidth = isActive ? 2.5 : 1.4;
                ctx.stroke();
                // arrow head
                const dir = bx > ax ? 1 : -1;
                ctx.beginPath();
                ctx.moveTo(bx - dir * 7, y - 4);
                ctx.lineTo(bx, y);
                ctx.lineTo(bx - dir * 7, y + 4);
                ctx.closePath();
                ctx.fillStyle = stroke;
                ctx.fill();
            }

            // Animated "pulse" on active message — small extra arrow tip overlay
            if (isActive) {
                const pulseT = (Math.sin(this._pulse) + 1) / 2; // 0..1
                ctx.save();
                ctx.globalAlpha = 0.25 + 0.5 * pulseT;
                ctx.fillStyle = '#EF4444';
                ctx.beginPath();
                ctx.arc(bx, y, 4 + pulseT * 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // Label centered above arrow
            ctx.fillStyle = labelColor;
            ctx.font = isActive ? 'bold 11px sans-serif' : '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            const labelX = (ax + bx) / 2;
            const labelY = y - 4;
            // background pill for readability on active message
            if (isActive) {
                const text = m.text;
                const tw = ctx.measureText(text).width;
                ctx.fillStyle = isDark ? 'rgba(239,68,68,0.18)' : 'rgba(239,68,68,0.14)';
                const ph = 14;
                const pw = tw + 10;
                this.roundRect(ctx, labelX - pw / 2, labelY - ph + 2, pw, ph, 4);
                ctx.fill();
                ctx.fillStyle = '#EF4444';
            }
            ctx.fillText(m.text, labelX, labelY);
        });

        // ============ RIGHT SIDEBAR: COMPARISON TABLE ============
        this._drawSidebar(sidebarW, padX, tabBarY, h - statusH, accent, textColor, subTextColor, isDark);

        // ============ STATUS BAR ============
        const cur = messages[this.step];
        ctx.fillStyle = subTextColor;
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        const statusText = this.isPlaying
            ? `▶ 播放中 · Tab ${this.activeTab + 1}/3 (${proto.key}) · 消息 ${this.step + 1}/${messages.length}: ${cur.text}`
            : `Tab ${this.activeTab + 1}/3 (${proto.key}) · 消息 ${this.step + 1}/${messages.length}: ${cur.text}`;
        ctx.fillText(statusText, padX, h - 8);
    }

    _drawSidebar(sidebarW, padX, top, height, accent, textColor, subTextColor, isDark) {
        const ctx = this.ctx;
        const w = this.width;
        const tableX = w - sidebarW;
        const tableW = sidebarW;

        // Panel background
        ctx.fillStyle = isDark ? 'rgba(30,41,59,0.55)' : 'rgba(241,245,249,0.85)';
        this.roundRect(ctx, tableX, top, tableW, height, 10);
        ctx.fill();
        ctx.strokeStyle = isDark ? 'rgba(148,163,184,0.25)' : 'rgba(100,116,139,0.25)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Title
        ctx.fillStyle = textColor;
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('📊 协议对比', tableX + 12, top + 10);

        // Subtitle
        ctx.fillStyle = subTextColor;
        ctx.font = '9px sans-serif';
        ctx.fillText('Protocol Comparison', tableX + 12, top + 26);

        // Table
        const tx = tableX + 12;
        const ty = top + 46;
        const usableW = tableW - 24;
        const colW = [36, 70, 56, usableW - 36 - 70 - 56];
        // header row
        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = subTextColor;
        let cx = tx;
        for (let i = 0; i < this.compareHeaders.length; i++) {
            ctx.fillText(this.compareHeaders[i], cx, ty);
            cx += colW[i];
        }
        // separator
        ctx.beginPath();
        ctx.moveTo(tx, ty + 14);
        ctx.lineTo(tx + usableW, ty + 14);
        ctx.strokeStyle = isDark ? 'rgba(148,163,184,0.3)' : 'rgba(100,116,139,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // rows
        const rowH = 26;
        for (let r = 0; r < this.compareRows.length; r++) {
            const ry = ty + 20 + r * rowH;
            const isActive = r === this.activeTab;
            if (isActive) {
                ctx.fillStyle = isDark
                    ? 'rgba(99,102,241,0.25)'
                    : 'rgba(99,102,241,0.12)';
                this.roundRect(ctx, tx - 4, ry - 4, usableW + 8, rowH - 2, 6);
                ctx.fill();
                // accent bar on left
                ctx.fillStyle = accent;
                ctx.fillRect(tx - 4, ry - 4, 3, rowH - 2);
            }
            const row = this.compareRows[r];
            cx = tx;
            // column 0: protocol name (badge)
            ctx.fillStyle = isActive ? accent : subTextColor;
            this.roundRect(ctx, cx, ry + 1, 32, 16, 4);
            ctx.fill();
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(row.name, cx + 16, ry + 9);
            cx += colW[0];
            // column 1: usage
            ctx.textAlign = 'left';
            ctx.fillStyle = isActive ? textColor : subTextColor;
            ctx.font = '9px sans-serif';
            ctx.textBaseline = 'middle';
            ctx.fillText(row.usage, cx, ry + 9);
            cx += colW[1];
            // column 2: topology
            ctx.fillText(row.topo, cx, ry + 9);
            cx += colW[2];
            // column 3: msg
            ctx.fillText(row.msg, cx, ry + 9);
        }

        // Bottom hint
        const hintY = ty + 20 + this.compareRows.length * rowH + 14;
        ctx.fillStyle = subTextColor;
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        const hints = [
            'MCP: 工具调用的 USB-C',
            'A2A: 智能体间的微信',
            'ANP: 网络层的外卖平台'
        ];
        hints.forEach((t, i) => {
            ctx.fillStyle = i === this.activeTab ? textColor : subTextColor;
            ctx.fillText(t, tx, hintY + i * 13);
        });

        // Tip
        ctx.fillStyle = isDark ? 'rgba(148,163,184,0.6)' : 'rgba(100,116,139,0.65)';
        ctx.font = 'italic 9px sans-serif';
        ctx.fillText('提示: 点击 Tab 切换协议', tx, top + height - 18);
    }

    // ---- small color helpers (avoid pulling CSS libs) ----
    _hexToRgb(hex) {
        const m = hex.replace('#', '');
        const n = parseInt(m.length === 3
            ? m.split('').map((c) => c + c).join('')
            : m, 16);
        return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    }
    _darken(hex, ratio) {
        const { r, g, b } = this._hexToRgb(hex);
        const f = (v) => Math.max(0, Math.round(v * (1 - ratio)));
        return `rgb(${f(r)}, ${f(g)}, ${f(b)})`;
    }
    _lighten(hex, ratio) {
        const { r, g, b } = this._hexToRgb(hex);
        const f = (v) => Math.min(255, Math.round(v + (255 - v) * ratio));
        return `rgb(${f(r)}, ${f(g)}, ${f(b)})`;
    }
}

registerAnimation('ch10-protocol', () => new Ch10Protocol());

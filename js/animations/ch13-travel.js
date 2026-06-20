/**
 * CH13: Multi-Agent Travel Assistant — Single vs Multi Agent + Travel Pipeline
 *
 * Visual concept
 *  ─ Top half: side-by-side comparison
 *      · Left:  SimpleAgent  (one overloaded red circle doing everything)
 *      · Right: 5 specialised multi-agents (attraction / weather / hotel /
 *        transport / planner), hover any of them to see its role + tools.
 *  ─ Bottom half: "3-day Shanghai trip" planning pipeline
 *      · 5 sub-task cards connected by arrows.
 *      · First 3 tasks (POI / weather / hotel / transport) are wired in
 *        PARALLEL with multiple flat arrows — all of them fan into the
 *        "planner" card. This is the visual payoff: "4×LLM time vs 1×LLM time".
 *      · Flowing particles stream from left to right during play.
 *  ─ Playback: show SimpleAgent red overload → switch to multi-agent →
 *    tasks fire in parallel → final plan card appears.
 */
import { CanvasAnimation } from './canvas-animation.js';
import { registerAnimation } from './animation-registry.js';

class Ch13Travel extends CanvasAnimation {
    constructor() {
        super();
        this.animId = 'ch13-travel';

        // -------- playback state --------
        this._playing = false;
        this._rafId = null;
        this.speed = 1;

        // step pointer into the play timeline
        this._step = 0;          // 0..6 (6 = final plan)
        this._phase = 'idle';    // 'idle' | 'single' | 'multi' | 'pipeline' | 'done'

        // hover state for tooltips on the right-side agents
        this._hoveredAgent = -1;
        this._tooltipPos = null;

        // particle streams for the pipeline (each particle = a "tool call"
        // traveling from user → sub-task → planner)
        this._particles = [];

        // "stress" value for the SimpleAgent on the left (0..1, drives red
        // glow & warning text intensity during the single-agent phase)
        this._stress = 0;

        // -------- single agent (left side) --------
        this.simpleAgent = {
            name: 'SimpleAgent',
            desc: '一个 Agent 包揽全部',
            color: '#EF4444',
            tasks: ['POI 搜索', '天气查询', '酒店搜索', '路线规划', '行程整合']
        };

        // -------- multi agents (right side, 5) --------
        this.agents = [
            {
                key: 'attraction',
                name: '景点 Agent',
                role: 'AttractionSearchAgent',
                tools: ['amap_maps_text_search'],
                desc: '按用户偏好(历史/自然/美食)搜索 POI',
                color: '#6366F1'
            },
            {
                key: 'weather',
                name: '天气 Agent',
                role: 'WeatherQueryAgent',
                tools: ['amap_maps_weather'],
                desc: '查询未来几天的天气预报',
                color: '#0EA5E9'
            },
            {
                key: 'hotel',
                name: '酒店 Agent',
                role: 'HotelAgent',
                tools: ['amap_maps_text_search'],
                desc: '按价位 / 区域推荐住宿',
                color: '#10B981'
            },
            {
                key: 'transport',
                name: '交通 Agent',
                role: 'TransportAgent',
                tools: ['amap_maps_direction'],
                desc: '规划两点之间的交通路线',
                color: '#F59E0B'
            },
            {
                key: 'planner',
                name: '整合 Agent',
                role: 'PlannerAgent',
                tools: ['(无外部工具)'],
                desc: '把前 4 个 Agent 的结果整合为最终 JSON 行程',
                color: '#EC4899'
            }
        ];

        // -------- pipeline sub-tasks (bottom) --------
        // 5 cards. index 0..3 are PARALLEL upstream tasks, index 4 is the
        // planner / integrator that depends on all 4.
        this.tasks = [
            { icon: '🗺', title: '收集景点', agent: 'attraction', cost: 12, color: '#6366F1' },
            { icon: '🌤', title: '查天气',   agent: 'weather',    cost:  8, color: '#0EA5E9' },
            { icon: '🏨', title: '订酒店',   agent: 'hotel',      cost: 10, color: '#10B981' },
            { icon: '🚇', title: '安排交通', agent: 'transport',  cost:  9, color: '#F59E0B' },
            { icon: '📋', title: '输出整合方案', agent: 'planner', cost: 12, color: '#EC4899' }
        ];

        // cache hit-rects for the 5 agent circles (right side)
        this._agentRects = [];
    }

    // ---------- lifecycle ----------
    init(canvas) {
        super.init(canvas);
        this._setupControls();
        this._bindHover();
        window.addEventListener('resize', () => { this._resize(); this.draw(); });
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

    _bindHover() {
        this.canvas.addEventListener('mousemove', (e) => this._onMouseMove(e));
        this.canvas.addEventListener('mouseleave', () => {
            if (this._hoveredAgent !== -1 || this._tooltipPos) {
                this._hoveredAgent = -1;
                this._tooltipPos = null;
                this.draw();
            }
        });
    }

    _onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        let hit = -1;
        for (let i = 0; i < this._agentRects.length; i++) {
            const r = this._agentRects[i];
            const dx = x - r.x, dy = y - r.y;
            if (dx * dx + dy * dy <= r.r * r.r) { hit = i; break; }
        }

        if (hit !== this._hoveredAgent) {
            this._hoveredAgent = hit;
            this._tooltipPos = hit >= 0 ? { x, y } : null;
            this.canvas.style.cursor = hit >= 0 ? 'pointer' : 'default';
            this.draw();
        } else if (hit >= 0) {
            // keep tooltip glued to the cursor even within the same agent
            this._tooltipPos = { x, y };
            this.draw();
        }
    }

    // ---------- playback ----------
    togglePlay() {
        if (this._playing) {
            this._playing = false;
            cancelAnimationFrame(this._rafId);
            this._setPlayLabel(false);
            return;
        }
        this._playing = true;
        this._setPlayLabel(true);
        this._loop();
    }

    _setPlayLabel(playing) {
        const btn = document.getElementById('btn-play-' + this.animId);
        if (btn) btn.textContent = playing ? '⏸ 暂停' : '▶ 播放';
    }

    _loop() {
        if (!this._playing) return;

        // advance step pointer based on time, not raw frame count
        if (!this._lastTick) this._lastTick = performance.now();
        const now = performance.now();
        const dt = now - this._lastTick;
        this._lastTick = now;

        // 1.8s per step (scaled by speed)
        const stepDur = 1800 / (this.speed || 1);
        this._stepAccum = (this._stepAccum || 0) + dt;
        if (this._stepAccum >= stepDur) {
            this._stepAccum = 0;
            this.stepForward(true);
            if (this._step >= 6) {
                // finished the story — stop after the final card.
                this._playing = false;
                this._setPlayLabel(false);
                this.draw();
                return;
            }
        }

        // stress ramps up during the single-agent phase, decays later
        if (this._phase === 'single') {
            this._stress = Math.min(1, this._stress + 0.018 * (this.speed || 1));
        } else if (this._phase === 'multi' || this._phase === 'pipeline') {
            this._stress = Math.max(0, this._stress - 0.025 * (this.speed || 1));
        }

        // spawn pipeline particles
        if (this._phase === 'pipeline' && this._step >= 1 && this._step <= 4) {
            if (Math.random() < 0.18 * (this.speed || 1)) {
                // 4 upstream tasks all flow into the planner in parallel
                this._particles.push({
                    from: this._step - 1,
                    to:   4,
                    t: 0,
                    color: this.tasks[this._step - 1].color,
                    width: 2 + Math.random() * 1.2
                });
            }
        }
        // final report particle
        if (this._phase === 'done' || (this._phase === 'pipeline' && this._step === 5)) {
            if (Math.random() < 0.08 * (this.speed || 1)) {
                this._particles.push({
                    from: 4, to: 5, t: 0,
                    color: this.tasks[4].color, width: 2.4
                });
            }
        }

        // update particles
        this._particles.forEach(p => p.t += 0.0085 * (this.speed || 1));
        this._particles = this._particles.filter(p => p.t < 1);

        this.draw();
        this._rafId = requestAnimationFrame(() => this._loop());
    }

    stepForward(auto = false) {
        this._step = (this._step + 1);
        if (this._step === 1) this._phase = 'single';
        else if (this._step === 2) this._phase = 'multi';
        else if (this._step >= 3 && this._step <= 5) this._phase = 'pipeline';
        else if (this._step >= 6) this._phase = 'done';

        // burst a particle on each click for immediate feedback
        if (!auto && this._step >= 1 && this._step <= 4) {
            this._particles.push({
                from: this._step - 1, to: 4, t: 0,
                color: this.tasks[this._step - 1].color, width: 2.4
            });
        }
        if (!auto && this._step === 5) {
            this._particles.push({
                from: 4, to: 5, t: 0,
                color: this.tasks[4].color, width: 2.8
            });
        }
        this.draw();
    }

    reset() {
        this._playing = false;
        cancelAnimationFrame(this._rafId);
        this._step = 0;
        this._phase = 'idle';
        this._stress = 0;
        this._particles = [];
        this._stepAccum = 0;
        this._lastTick = 0;
        this._setPlayLabel(false);
        this.draw();
    }

    setSpeed(v) { this.speed = v; }
    play() { if (!this._playing) this.togglePlay(); }
    pause() { if (this._playing) this.togglePlay(); }
    step() { this.stepForward(); }

    // ---------- geometry helpers ----------
    _topRegion() {
        const w = this.width, h = this.height;
        const padX = 14;
        const titleH = 22;
        const footerH = 28;
        const top = titleH;
        const bottom = h * 0.52;
        return { x: padX, y: top, w: w - padX * 2, h: bottom - top };
    }
    _bottomRegion() {
        const w = this.width, h = this.height;
        const padX = 14;
        const footerH = 28;
        const top = h * 0.52 + 4;
        const bottom = h - footerH;
        return { x: padX, y: top, w: w - padX * 2, h: bottom - top };
    }

    _cardGeom(region) {
        // 5 cards laid out across the region with gaps for arrows
        const gap = 14;
        const cardW = (region.w - gap * 4) / 5;
        const cardH = region.h - 14;
        return { gap, cardW, cardH };
    }
    _cardRect(i) {
        const r = this._bottomRegion();
        const g = this._cardGeom(r);
        return {
            x: r.x + i * (g.cardW + g.gap),
            y: r.y + 8,
            w: g.cardW,
            h: g.cardH
        };
    }

    // ---------- main draw ----------
    draw() {
        const ctx = this.ctx;
        const w = this.width, h = this.height;
        const dark = this.isDarkTheme();
        const bg = dark ? '#0F172A' : '#F8FAFC';
        const textColor = dark ? '#F1F5F9' : '#0F172A';
        const subColor  = dark ? '#94A3B8' : '#475569';
        const borderCol = dark ? 'rgba(148,163,184,0.25)' : 'rgba(100,116,139,0.25)';
        const panelBg   = dark ? 'rgba(30,41,59,0.6)' : 'rgba(241,245,249,0.85)';

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        // ---- Title ----
        ctx.fillStyle = textColor;
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('多 Agent 协作 vs 单 Agent  ·  旅行规划流水线', 14, 6);

        // ---- Top: side-by-side comparison ----
        const top = this._topRegion();
        this._drawTopCompare(ctx, top, textColor, subColor, borderCol, panelBg, dark);

        // ---- Bottom: pipeline ----
        const bot = this._bottomRegion();
        this._drawPipeline(ctx, bot, textColor, subColor, borderCol, panelBg, dark);

        // ---- Footer / status bar ----
        this._drawFooter(ctx, w, h, subColor, textColor, dark);

        // ---- Tooltip on top ----
        if (this._hoveredAgent >= 0) this._drawTooltip(ctx, w, h, textColor, subColor, dark);
    }

    // ---------- top: single vs multi agent ----------
    _drawTopCompare(ctx, r, textColor, subColor, borderCol, panelBg, dark) {
        // Two side-by-side panels
        const gap = 12;
        const halfW = (r.w - gap) / 2;
        const left  = { x: r.x,          y: r.y, w: halfW,        h: r.h };
        const right = { x: r.x + halfW + gap, y: r.y, w: halfW,   h: r.h };

        this._drawSingleAgentPanel(ctx, left, textColor, subColor, borderCol, panelBg, dark);
        this._drawMultiAgentPanel (ctx, right, textColor, subColor, borderCol, panelBg, dark);
    }

    _drawSingleAgentPanel(ctx, p, textColor, subColor, borderCol, panelBg, dark) {
        // panel background
        ctx.fillStyle = panelBg;
        this.roundRect(ctx, p.x, p.y, p.w, p.h, 10);
        ctx.fill();
        ctx.strokeStyle = borderCol;
        ctx.lineWidth = 1;
        this.roundRect(ctx, p.x, p.y, p.w, p.h, 10);
        ctx.stroke();

        // panel title
        ctx.fillStyle = textColor;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('单 Agent  ·  一个 SimpleAgent 干所有事', p.x + 10, p.y + 8);

        // the overloaded agent (big red circle in the center)
        const cx = p.x + p.w / 2;
        const cy = p.y + p.h / 2 + 6;
        const baseR = Math.min(p.w, p.h) * 0.18;
        const stress = this._stress;     // 0..1

        // outer pulsing halo
        if (stress > 0) {
            const haloR = baseR + 12 + Math.sin(performance.now() * 0.006) * 4 * stress;
            ctx.beginPath();
            ctx.arc(cx, cy, haloR, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(239,68,68,${0.18 * stress})`;
            ctx.fill();
        }

        // main circle — color shifts from amber → red as stress rises
        const r = 239, g = Math.round(68 + (187 - 68) * (1 - stress)), b = 68;
        const bodyColor = stress > 0.4 ? `rgb(${r},${g},${b})` : this.simpleAgent.color;
        const grad = ctx.createRadialGradient(cx - 6, cy - 6, 2, cx, cy, baseR);
        grad.addColorStop(0, stress > 0.4 ? '#FCA5A5' : '#FECACA');
        grad.addColorStop(1, bodyColor);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, baseR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();

        // label inside
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Simple', cx, cy - 6);
        ctx.fillText('Agent',  cx, cy + 8);

        // tasks attached around the circle (radial labels)
        const tasks = this.simpleAgent.tasks;
        const labelR = baseR + 22;
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let i = 0; i < tasks.length; i++) {
            const a = (i / tasks.length) * Math.PI * 2 - Math.PI / 2;
            const lx = cx + labelR * Math.cos(a);
            const ly = cy + labelR * Math.sin(a);
            ctx.fillStyle = stress > 0.4 ? '#EF4444' : subColor;
            ctx.fillText(tasks[i], lx, ly);
            // small connector line
            ctx.strokeStyle = `rgba(239,68,68,${0.25 + stress * 0.5})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(cx + baseR * Math.cos(a), cy + baseR * Math.sin(a));
            ctx.lineTo(lx, ly);
            ctx.stroke();
        }

        // warning text — only when this agent is "stressed"
        if (stress > 0.05) {
            ctx.fillStyle = '#EF4444';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            const msg = stress > 0.7 ? '⚠ OVERLOAD  ·  串行 3×LLM  ·  难调试'
                                    : '压力上升  ·  单一 Prompt 膨胀';
            ctx.fillText(msg, cx, p.y + p.h - 18);
        }
    }

    _drawMultiAgentPanel(ctx, p, textColor, subColor, borderCol, panelBg, dark) {
        ctx.fillStyle = panelBg;
        this.roundRect(ctx, p.x, p.y, p.w, p.h, 10);
        ctx.fill();
        ctx.strokeStyle = borderCol;
        ctx.lineWidth = 1;
        this.roundRect(ctx, p.x, p.y, p.w, p.h, 10);
        ctx.stroke();

        ctx.fillStyle = textColor;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('多 Agent  ·  角色清晰  ·  并行协作', p.x + 10, p.y + 8);
        ctx.fillStyle = subColor;
        ctx.font = '9px sans-serif';
        ctx.fillText('悬停任一 Agent 查看角色与工具', p.x + 10, p.y + 22);

        // 5 agent circles laid out across the panel
        const cx = p.x + p.w / 2;
        const cy = p.y + p.h / 2 + 14;
        const radius = Math.min(p.w * 0.42, p.h * 0.32);
        const agentR = 18;

        this._agentRects = [];
        const positions = [];
        for (let i = 0; i < this.agents.length; i++) {
            const a = (i / this.agents.length) * Math.PI * 2 - Math.PI / 2;
            positions.push({ x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) });
        }

        // connecting ring (the "team" line)
        ctx.beginPath();
        for (let i = 0; i <= this.agents.length; i++) {
            const pt = positions[i % this.agents.length];
            if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
        }
        ctx.closePath();
        ctx.strokeStyle = dark ? 'rgba(148,163,184,0.30)' : 'rgba(100,116,139,0.30)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // agent circles
        this.agents.forEach((ag, i) => {
            const pt = positions[i];
            this._agentRects.push({ idx: i, x: pt.x, y: pt.y, r: agentR + 4 });

            const isHover = i === this._hoveredAgent;
            const isActive = (this._phase === 'multi' && i === 0) ||
                             (this._phase === 'pipeline' && i === Math.min(this._step - 2, 3)) ||
                             (this._phase === 'done');

            if (isHover || isActive) {
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, agentR + 6, 0, Math.PI * 2);
                ctx.fillStyle = ag.color + (isActive ? '55' : '33');
                ctx.fill();
            }

            const grad = ctx.createRadialGradient(pt.x - 5, pt.y - 5, 2, pt.x, pt.y, agentR);
            grad.addColorStop(0, '#FFFFFF');
            grad.addColorStop(0.5, ag.color);
            grad.addColorStop(1, this._darken(ag.color, 0.3));
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, agentR, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // name
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(ag.name.split(' ')[0], pt.x, pt.y);
        });

        // center "User" hub
        const hubR = 14;
        const hubGrad = ctx.createRadialGradient(cx - 3, cy - 3, 1, cx, cy, hubR);
        hubGrad.addColorStop(0, '#F1F5F9');
        hubGrad.addColorStop(1, dark ? '#475569' : '#94A3B8');
        ctx.fillStyle = hubGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, hubR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('User', cx, cy);
    }

    // ---------- bottom: pipeline ----------
    _drawPipeline(ctx, r, textColor, subColor, borderCol, panelBg, dark) {
        // panel background
        ctx.fillStyle = panelBg;
        this.roundRect(ctx, r.x, r.y, r.w, r.h, 10);
        ctx.fill();
        ctx.strokeStyle = borderCol;
        ctx.lineWidth = 1;
        this.roundRect(ctx, r.x, r.y, r.w, r.h, 10);
        ctx.stroke();

        // panel title
        ctx.fillStyle = textColor;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('3 天上海旅行  ·  多 Agent 规划流水线', r.x + 10, r.y + 6);

        // right-side parallel callout
        ctx.fillStyle = '#10B981';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('↗  并行  ·  节省 ≈ 60% 时间', r.x + r.w - 10, r.y + 8);
        ctx.textAlign = 'left';

        // 5 cards
        for (let i = 0; i < this.tasks.length; i++) {
            this._drawPipelineCard(ctx, i, textColor, subColor, borderCol, dark);
        }

        // PARALLEL arrows: 4 upstream tasks (0..3) → planner card (4).
        // Drawn as flat multiple arrows (a "highway" of arrows) to hammer
        // home the parallel concept.
        this._drawParallelArrows(ctx, r, dark);

        // standard sequential arrows between consecutive cards
        for (let i = 0; i < this.tasks.length - 1; i++) {
            const a = this._cardRect(i);
            const b = this._cardRect(i + 1);
            // only draw 0→1, 1→2, 2→3, 3→4 as the "pipeline backbone"
            // (we still draw the parallel arrows on top in a different style)
            this._drawSeqArrow(ctx,
                a.x + a.w, a.y + a.h / 2,
                b.x,        b.y + b.h / 2,
                dark, false);
        }

        // flowing particles (one of the key visualisations)
        this._drawParticles(ctx, dark);

        // time-comparison strip at the bottom of the panel
        this._drawTimeCompare(ctx, r, textColor, subColor, borderCol, dark);
    }

    _drawPipelineCard(ctx, i, textColor, subColor, borderCol, dark) {
        const task = this.tasks[i];
        const rect = this._cardRect(i);
        const isActive = (this._phase === 'pipeline' && i === Math.min(this._step - 2, 3)) ||
                         (this._phase === 'done');

        // card background
        const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
        if (dark) {
            grad.addColorStop(0, isActive ? 'rgba(51,65,85,0.95)' : 'rgba(51,65,85,0.55)');
            grad.addColorStop(1, isActive ? 'rgba(30,41,59,0.95)' : 'rgba(30,41,59,0.55)');
        } else {
            grad.addColorStop(0, isActive ? 'rgba(255,255,255,1.0)' : 'rgba(255,255,255,0.65)');
            grad.addColorStop(1, isActive ? 'rgba(241,245,249,1.0)' : 'rgba(241,245,249,0.65)');
        }
        ctx.fillStyle = grad;
        this.roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 8);
        ctx.fill();
        ctx.strokeStyle = isActive ? task.color : borderCol;
        ctx.lineWidth = isActive ? 2 : 1;
        this.roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 8);
        ctx.stroke();

        // accent strip on top
        ctx.fillStyle = task.color;
        this.roundRect(ctx, rect.x, rect.y, rect.w, 5, 2);
        ctx.fill();

        // step number + icon
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillStyle = subColor;
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText('STEP ' + (i + 1), rect.x + 8, rect.y + 10);

        // big icon
        ctx.fillStyle = textColor;
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(task.icon, rect.x + rect.w / 2, rect.y + 22);

        // title
        ctx.fillStyle = textColor;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(task.title, rect.x + rect.w / 2, rect.y + 50);

        // agent name
        ctx.fillStyle = task.color;
        ctx.font = '9px sans-serif';
        ctx.fillText(this._agentNameZh(task.agent), rect.x + rect.w / 2, rect.y + 66);

        // duration chip
        const chipW = 50, chipH = 16;
        const chipX = rect.x + (rect.w - chipW) / 2;
        const chipY = rect.y + rect.h - chipH - 8;
        ctx.fillStyle = dark ? 'rgba(15,23,42,0.85)' : 'rgba(226,232,240,0.95)';
        this.roundRect(ctx, chipX, chipY, chipW, chipH, 8);
        ctx.fill();
        ctx.strokeStyle = task.color + '88';
        ctx.lineWidth = 1;
        this.roundRect(ctx, chipX, chipY, chipW, chipH, 8);
        ctx.stroke();
        ctx.fillStyle = task.color;
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('≈ ' + task.cost + 's', chipX + chipW / 2, chipY + chipH / 2);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
    }

    _agentNameZh(key) {
        const map = {
            attraction: 'Attraction Agent',
            weather:    'Weather Agent',
            hotel:      'Hotel Agent',
            transport:  'Transport Agent',
            planner:    'Planner Agent'
        };
        return map[key] || key;
    }

    _drawSeqArrow(ctx, x1, y1, x2, y2, dark, active) {
        const color = active ? '#10B981' : (dark ? '#64748B' : '#94A3B8');
        const midX = (x1 + x2) / 2;
        ctx.save();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = active ? 2 : 1.4;
        ctx.beginPath();
        ctx.moveTo(x1 + 1, y1);
        ctx.lineTo(x2 - 6, y2);
        ctx.stroke();
        // head
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - 6, y2 - 4);
        ctx.lineTo(x2 - 6, y2 + 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    _drawParallelArrows(ctx, r, dark) {
        // 4 upstream task cards (indices 0..3) all fan into card index 4.
        // We render a bundle of 3 short arrows per upstream card for a clear
        // "parallel highway" look.
        const planner = this._cardRect(4);
        const targetX = planner.x;
        const targetY = planner.y + planner.h / 2;

        for (let i = 0; i < 4; i++) {
            const a = this._cardRect(i);
            const fromX = a.x + a.w;
            const fromY = a.y + a.h / 2;

            // 3 parallel arrows, vertically offset
            for (let k = -1; k <= 1; k++) {
                const yOff = k * 4;
                const xEnd = targetX - 4;
                const yEnd = targetY + yOff;

                const active = (this._phase === 'pipeline' && i === Math.min(this._step - 2, 3));
                const color = active ? this.tasks[i].color
                                     : (dark ? 'rgba(99,102,241,0.55)' : 'rgba(99,102,241,0.6)');

                ctx.save();
                ctx.strokeStyle = color;
                ctx.lineWidth = active ? 1.6 : 1;
                if (k === 0 && !active) {
                    ctx.setLineDash([4, 3]);
                }
                ctx.beginPath();
                ctx.moveTo(fromX + 1, fromY);
                ctx.lineTo(xEnd, yEnd);
                ctx.stroke();
                ctx.setLineDash([]);
                // head
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.moveTo(xEnd, yEnd);
                ctx.lineTo(xEnd - 5, yEnd - 3);
                ctx.lineTo(xEnd - 5, yEnd + 3);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
        }

        // "PARALLEL" label above the bundle
        ctx.save();
        ctx.fillStyle = dark ? '#A5B4FC' : '#4F46E5';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        const labelX = (this._cardRect(0).x + this._cardRect(0).w + this._cardRect(4).x) / 2;
        const labelY = r.y + 30;
        ctx.fillText('↗ 4 路并行', labelX, labelY);
        ctx.restore();
    }

    _drawParticles(ctx, dark) {
        // Compute source/target anchors for cards 0..4 → 5 (a small "完成" badge
        // sits to the right of card 4). If 5 is off-screen we just use card 4
        // as a self-loop indicator.
        const have = (i) => i >= 0 && i <= 4;

        this._particles.forEach(p => {
            if (!have(p.from) || !have(p.to)) return;

            const a = this._cardRect(p.from);
            const b = this._cardRect(p.to);

            const x1 = (p.from === 4) ? a.x + a.w : a.x + a.w; // outgoing from right
            const y1 = a.y + a.h / 2;
            const x2 = b.x;
            const y2 = b.y + b.h / 2;

            // Parallel-flowing particles from upstream tasks get a small Y
            // jitter so the bundle looks dense.
            const jitter = (p.from >= 0 && p.from <= 3 && p.to === 4)
                ? (Math.sin(p.t * Math.PI * 2) * 6)
                : 0;

            const x = x1 + (x2 - x1) * p.t;
            const y = y1 + (y2 - y1) * p.t + jitter;

            // soft trail
            ctx.save();
            ctx.fillStyle = p.color;
            ctx.globalAlpha = 0.25;
            ctx.beginPath();
            ctx.arc(x - (x2 - x1) * 0.02, y, (p.width || 2) + 1, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // particle core
            ctx.save();
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(x, y, p.width || 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 0.8;
            ctx.stroke();
            ctx.restore();
        });
    }

    _drawTimeCompare(ctx, r, textColor, subColor, borderCol, dark) {
        // Time-comparison strip: serial 4 tasks add up; parallel takes the
        // max. Computed from this.tasks[0..3] .cost.
        const serial = this.tasks.slice(0, 4).reduce((a, b) => a + b.cost, 0);
        const parallel = Math.max(...this.tasks.slice(0, 4).map(t => t.cost)) + this.tasks[4].cost;
        const saved = serial - parallel;
        const pct = Math.round((saved / serial) * 100);

        const stripY = r.y + r.h - 18;
        const stripH = 12;
        const stripX = r.x + 10;
        const stripW = r.w - 20;

        ctx.fillStyle = subColor;
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText('串行 (单 Agent)', stripX, stripY - 1);
        // serial bar — full width
        ctx.fillStyle = '#EF4444';
        this.roundRect(ctx, stripX, stripY, stripW, stripH * 0.4, 2);
        ctx.fill();

        // parallel bar — proportional
        const paraW = Math.max(20, (parallel / serial) * stripW);
        ctx.fillStyle = '#10B981';
        this.roundRect(ctx, stripX, stripY + stripH * 0.55, paraW, stripH * 0.4, 2);
        ctx.fill();

        // labels
        ctx.fillStyle = dark ? '#A7F3D0' : '#065F46';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('并行 (多 Agent)', stripX, stripY - 0);
        // wait — we already drew serial label above; keep it consistent
        ctx.textAlign = 'right';
        ctx.fillStyle = dark ? '#FCA5A5' : '#991B1B';
        ctx.fillText('≈ ' + serial + 's', stripX + stripW, stripY - 1);
        ctx.fillStyle = dark ? '#A7F3D0' : '#065F46';
        ctx.fillText('≈ ' + parallel + 's  ·  节省 ' + pct + '%', stripX + stripW, stripY + stripH * 0.55);
        ctx.textAlign = 'left';
    }

    // ---------- footer ----------
    _drawFooter(ctx, w, h, subColor, textColor, dark) {
        ctx.fillStyle = subColor;
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';

        const phaseText = {
            idle:     '▶ 按 播放  开始  ·  或按 单步 逐步推进',
            single:   '单 Agent: 一个 SimpleAgent 同时承担 5 项任务 → 工具限制 + 串行 LLM = 慢、易错',
            multi:    '多 Agent: 5 个 Agent 各司其职  ·  悬停右侧圆圈查看角色 + 工具',
            pipeline: '并行流水线: 4 路并行收集 → 整合 Agent 一次性输出 JSON 行程',
            done:     '✓ 完成  ·  3 天上海行程已生成 (景点 / 天气 / 酒店 / 交通 / 整合方案)'
        }[this._phase] || '';

        ctx.fillText(phaseText, 14, h - 6);

        ctx.textAlign = 'right';
        ctx.fillStyle = textColor;
        ctx.fillText('步骤 ' + Math.min(this._step, 6) + ' / 6', w - 14, h - 6);
        ctx.textAlign = 'left';
    }

    // ---------- tooltip ----------
    _drawTooltip(ctx, w, h, textColor, subColor, dark) {
        const ag = this.agents[this._hoveredAgent];
        const lines = [
            { t: ag.name + '  ·  ' + ag.role, bold: true, color: ag.color },
            { t: ag.desc, color: textColor },
            { t: '工具: ' + ag.tools.join(', '), color: dark ? '#A5F3FC' : '#0E7490' }
        ];

        ctx.font = '11px sans-serif';
        const lineH = 14;
        const padX = 10, padY = 8;
        let maxW = 0;
        lines.forEach((l) => {
            ctx.font = l.bold ? 'bold 12px sans-serif' : '11px sans-serif';
            maxW = Math.max(maxW, ctx.measureText(l.t).width);
        });
        const boxW = Math.min(280, maxW + padX * 2);
        const boxH = lines.length * lineH + padY * 2;

        let tx = (this._tooltipPos?.x || 0) + 12;
        let ty = (this._tooltipPos?.y || 0) + 12;
        if (tx + boxW > w - 4)  tx = w - boxW - 4;
        if (ty + boxH > h - 4)  ty = h - boxH - 4;
        if (tx < 4) tx = 4;
        if (ty < 4) ty = 4;

        ctx.fillStyle = dark ? 'rgba(15,23,42,0.96)' : 'rgba(255,255,255,0.98)';
        this.roundRect(ctx, tx, ty, boxW, boxH, 6);
        ctx.fill();
        ctx.strokeStyle = ag.color;
        ctx.lineWidth = 1.5;
        this.roundRect(ctx, tx, ty, boxW, boxH, 6);
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        lines.forEach((l, i) => {
            ctx.font = l.bold ? 'bold 12px sans-serif' : '11px sans-serif';
            ctx.fillStyle = l.color;
            ctx.fillText(l.t, tx + padX, ty + padY + i * lineH);
        });
    }

    // ---------- color helpers ----------
    _hexToRgb(hex) {
        if (typeof hex !== 'string' || hex[0] !== '#') return { r: 99, g: 102, b: 241 };
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
}

registerAnimation('ch13-travel', () => new Ch13Travel());

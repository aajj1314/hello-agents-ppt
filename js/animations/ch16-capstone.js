/**
 * CH16: 毕业设计 — 5 阶段路线图 + 5 大选题方向矩阵
 *
 * Top half: horizontal 5-stage roadmap (项目选题 / 环境准备 / Fork 仓库 /
 *           开发 + 测试 / 提交 PR + 社区评审).  Each stage is a rounded
 *           card with a number badge + title + 1-line summary; arrows
 *           connect them; the current step glows.
 *           Hovering a stage shows a "本周该做什么" tooltip.
 *
 * Bottom half: 5 topic-direction cards (生产力 / 学习辅助 / 创意娱乐 /
 *              数据分析 / 生活服务).  Each card has a colored letter
 *              icon, category name and 3-4 representative project names.
 *              Hovering a card highlights and gently scales it; clicking
 *              a card selects it.
 *
 * Play mode sequentially highlights stages 1 → 5 (advancing every
 * stepInterval ms, scaled by the speed slider).  Step / Reset advance
 * or rewind the highlight.
 *
 * Controls (bound by id):
 *   btn-play-ch16-capstone    toggle play/pause
 *   btn-step-ch16-capstone    advance to next stage
 *   btn-reset-ch16-capstone   rewind to "no active stage"
 *   speed-ch16-capstone       playback speed multiplier
 */
import { CanvasAnimation } from './canvas-animation.js';
import { registerAnimation } from './animation-registry.js';

class Ch16Capstone extends CanvasAnimation {
    constructor() {
        super();
        this.animId = 'ch16-capstone';

        // ---- playback state ----
        this.speed = 1;
        this._playing = false;
        this._rafId = null;
        this._lastTick = 0;
        this._stageInterval = 1200;          // ms per stage during autoplay
        this._activeStage = -1;              // -1 = none, 0..4 = current stage
        this._pulse = 0;                     // animated pulse for active stage

        // ---- hover / click state ----
        this._hoverStage = -1;
        this._hoverTopic = -1;
        this._selectedTopic = -1;
        this._tooltip = null;                // {x, y, stageIdx}

        // ---- hit-test rects (recomputed in draw()) ----
        this._stageRects = [];
        this._topicRects = [];
    }

    /* ---------------- 5-stage roadmap (top half) ---------------- */
    get stages() {
        return [
            {
                key: 'topic',
                name: '选题',
                tag: 'Topic',
                color: '#6366F1',
                desc: '从 5 大方向里挑一个可完成、有亮点的题目。',
                action: '本周: 在 Co-creation-projects 目录看示范项目，列 3 个候选方向，挑 1 个。'
            },
            {
                key: 'env',
                name: '环境准备',
                tag: 'Env',
                color: '#0EA5E9',
                desc: 'pip install hello-agents / git / jupyter。',
                action: '本周: 安装 hello-agents[all]、配好 Git 用户、生成 SSH Key、跑通 jupyter lab。'
            },
            {
                key: 'fork',
                name: 'Fork 仓库',
                tag: 'Fork',
                color: '#10B981',
                desc: 'Fork → clone → 新建 feature 分支。',
                action: '本周: Fork datawhalechina/hello-agents、git clone、添加 upstream、新建 feature/xxx 分支。'
            },
            {
                key: 'dev',
                name: '开发 + 测试',
                tag: 'Dev',
                color: '#F59E0B',
                desc: '写 main.ipynb + README + requirements。',
                action: '本周: 实现核心功能、跑通用例、README 写齐、自检清单 9 项全打勾。'
            },
            {
                key: 'pr',
                name: '提交 PR',
                tag: 'PR',
                color: '#EC4899',
                desc: 'feat: commit → push → 标题 [毕业设计] xxx。',
                action: '本周: git push、按模板开 PR、积极响应 Review、合并到 Co-creation-projects。'
            }
        ];
    }

    /* ---------------- 5 topic directions (bottom half) ---------------- */
    get topics() {
        return [
            {
                key: 'prod',
                letter: 'P',
                name: '生产力工具',
                color: '#3B82F6',
                colorSoft: '#93C5FD',
                examples: [
                    'CodeReviewAgent 智能代码审查',
                    'DocGenius 文档自动生成',
                    'MeetingNote 会议纪要',
                    'MailMate 邮件助手'
                ]
            },
            {
                key: 'learn',
                letter: 'L',
                name: '学习辅助',
                color: '#10B981',
                colorSoft: '#6EE7B7',
                examples: [
                    'StudyBuddy 学习伙伴',
                    'PaperPilot 论文助手',
                    'CodeMentor 编程导师',
                    'LingoPal 语言学习'
                ]
            },
            {
                key: 'creative',
                letter: 'C',
                name: '创意娱乐',
                color: '#F59E0B',
                colorSoft: '#FCD34D',
                examples: [
                    'TaleSmith 故事生成器',
                    'NPCMind 游戏 NPC',
                    'MoodMix 音乐推荐',
                    'RecipeBot 菜谱助手'
                ]
            },
            {
                key: 'data',
                letter: 'D',
                name: '数据分析',
                color: '#8B5CF6',
                colorSoft: '#C4B5FD',
                examples: [
                    'DataAnalyst 智能分析师',
                    'StockPilot 股票分析',
                    'SentRadar 舆情监控',
                    'CompeteLens 竞品分析'
                ]
            },
            {
                key: 'life',
                letter: 'L',
                name: '生活服务',
                color: '#EC4899',
                colorSoft: '#F9A8D4',
                examples: [
                    'HealthPal 健康助手',
                    'MoneyBee 理财助手',
                    'ShopScout 购物助手',
                    'HomeWhisper 智能家居'
                ]
            }
        ];
    }

    /* ---------------- lifecycle ---------------- */
    init(canvas) {
        super.init(canvas);
        this._setupControls();
        this._setupCanvasEvents();
        window.addEventListener('resize', () => { this._resize(); this.draw(); });
        this.draw();
    }

    _setupControls() {
        const playBtn  = document.getElementById('btn-play-'  + this.animId);
        const stepBtn  = document.getElementById('btn-step-'  + this.animId);
        const resetBtn = document.getElementById('btn-reset-' + this.animId);
        const speedSld = document.getElementById('speed-'     + this.animId);
        if (playBtn)  playBtn.addEventListener('click',  () => this.togglePlay());
        if (stepBtn)  stepBtn.addEventListener('click',  () => this.stepForward());
        if (resetBtn) resetBtn.addEventListener('click', () => this.reset());
        if (speedSld) speedSld.addEventListener('input',  (e) => {
            this.speed = parseFloat(e.target.value) || 1;
        });
    }

    _setupCanvasEvents() {
        if (!this.canvas) return;
        this.canvas.addEventListener('mousemove',  (e) => this._onMouseMove(e));
        this.canvas.addEventListener('mouseleave', ()  => this._onMouseLeave());
        this.canvas.addEventListener('click',      (e) => this._onClick(e));
    }

    /* ---------------- playback API ---------------- */
    togglePlay() {
        if (this._playing) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        if (this._activeStage >= this.stages.length - 1) {
            this._activeStage = -1;
        }
        this._playing = true;
        this._lastTick = 0;
        const btn = document.getElementById('btn-play-' + this.animId);
        if (btn) btn.textContent = '⏸ 暂停';
        this._loop();
    }

    pause() {
        this._playing = false;
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
        const btn = document.getElementById('btn-play-' + this.animId);
        if (btn) btn.textContent = '▶ 播放';
    }

    _loop() {
        if (!this._playing) return;
        const now = performance.now();
        if (!this._lastTick) this._lastTick = now;
        const interval = this._stageInterval / (this.speed || 1);
        if (now - this._lastTick >= interval) {
            this._activeStage++;
            this._lastTick = now;
            if (this._activeStage >= this.stages.length) {
                this._activeStage = this.stages.length - 1;
                this.pause();
                this.draw();
                return;
            }
        }
        this._pulse = (this._pulse + 0.06 * (this.speed || 1)) % (Math.PI * 2);
        this.draw();
        this._rafId = requestAnimationFrame(() => this._loop());
    }

    stepForward() {
        if (this._playing) this.pause();
        if (this._activeStage < this.stages.length - 1) {
            this._activeStage++;
        }
        this.draw();
    }

    reset() {
        this.pause();
        this._activeStage = -1;
        this._pulse = 0;
        this.draw();
    }

    setSpeed(v) { this.speed = v; }
    step()      { this.stepForward(); }

    /* ---------------- interaction ---------------- */
    _canvasPoint(e) {
        const rect = this.canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    _onMouseMove(e) {
        const { x, y } = this._canvasPoint(e);
        let newHoverStage = -1;
        for (let i = 0; i < this._stageRects.length; i++) {
            const r = this._stageRects[i];
            if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
                newHoverStage = i;
                break;
            }
        }
        let newHoverTopic = -1;
        for (let i = 0; i < this._topicRects.length; i++) {
            const r = this._topicRects[i];
            if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
                newHoverTopic = i;
                break;
            }
        }

        if (newHoverStage !== this._hoverStage || newHoverTopic !== this._hoverTopic) {
            this._hoverStage = newHoverStage;
            this._hoverTopic = newHoverTopic;
            this.canvas.style.cursor = (newHoverStage >= 0 || newHoverTopic >= 0) ? 'pointer' : 'default';
            this.draw();
        }

        if (this._hoverStage >= 0) {
            this._tooltip = { x, y, stage: this._hoverStage };
        } else {
            this._tooltip = null;
        }
    }

    _onMouseLeave() {
        if (this._hoverStage !== -1 || this._hoverTopic !== -1) {
            this._hoverStage = -1;
            this._hoverTopic = -1;
            this._tooltip = null;
            this.canvas.style.cursor = 'default';
            this.draw();
        }
    }

    _onClick(e) {
        const { x, y } = this._canvasPoint(e);
        for (let i = 0; i < this._topicRects.length; i++) {
            const r = this._topicRects[i];
            if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
                this._selectedTopic = (this._selectedTopic === i) ? -1 : i;
                this.draw();
                return;
            }
        }
    }

    /* ---------------- layout helpers ---------------- */
    _layout() {
        const w = this.width;
        const h = this.height;
        const padX = 14;
        const titleH = 22;
        const sectionGap = 10;
        const footerH = 22;

        // Title
        const titleY = 6;

        // Top section: roadmap
        const roadTop = titleH + 6;
        const roadH = Math.max(96, Math.min(120, h * 0.30));
        const roadBottom = roadTop + roadH;

        // Bottom section: topic cards
        const topicTop = roadBottom + sectionGap + 14;       // +14 for section label
        const topicBottom = h - footerH - 4;
        const topicH = Math.max(110, topicBottom - topicTop);

        // Stage card layout
        const stageCount = this.stages.length;
        const arrowW = 22;
        const totalArrowW = (stageCount - 1) * arrowW;
        const stageMarginX = padX + 4;
        const stageUsableW = w - stageMarginX * 2 - totalArrowW;
        const stageW = stageUsableW / stageCount;
        const stageCardH = Math.max(60, roadH - 14);

        this._stageRects = [];
        for (let i = 0; i < stageCount; i++) {
            const cx = stageMarginX + i * (stageW + arrowW);
            this._stageRects.push({
                idx: i, x: cx, y: roadTop + 4, w: stageW, h: stageCardH
            });
        }
        this._roadRect = { x: padX, y: roadTop, w: w - padX * 2, h: roadH };

        // Topic card layout
        const topicCount = this.topics.length;
        const topicGap = 8;
        const topicMarginX = padX;
        const topicUsableW = w - topicMarginX * 2 - (topicCount - 1) * topicGap;
        const topicW = topicUsableW / topicCount;

        this._topicRects = [];
        for (let i = 0; i < topicCount; i++) {
            const cx = topicMarginX + i * (topicW + topicGap);
            this._topicRects.push({
                idx: i, x: cx, y: topicTop, w: topicW, h: topicH
            });
        }
        this._topicRect = { x: padX, y: topicTop, w: w - padX * 2, h: topicH };

        this._titleY = titleY;
        this._footerY = h - 6;
        this._sectionLabelY = roadBottom + 2;
    }

    /* ---------------- main draw ---------------- */
    draw() {
        if (!this.ctx) return;
        this._layout();
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        const dark = this.isDarkTheme();
        const bg = dark ? '#0F172A' : '#F8FAFC';
        const textColor = dark ? '#F1F5F9' : '#0F172A';
        const subColor  = dark ? '#94A3B8' : '#475569';
        const borderCol = dark ? 'rgba(148,163,184,0.25)' : 'rgba(100,116,139,0.25)';
        const panelBg   = dark ? 'rgba(30,41,59,0.55)' : 'rgba(241,245,249,0.85)';
        const cardBg    = dark ? '#1E293B' : '#FFFFFF';

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        // ---- Title row ----
        ctx.fillStyle = textColor;
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('毕业设计 5 阶段路线图  +  5 大选题方向', 14, this._titleY);

        if (this._playing) {
            ctx.fillStyle = subColor;
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'right';
            const cur = (this._activeStage < 0) ? 0 : (this._activeStage + 1);
            ctx.fillText('▶ 自动演示中  ·  阶段 ' + cur + ' / ' + this.stages.length,
                w - 14, this._titleY + 2);
        }

        // ---- Section: top roadmap ----
        this._drawRoadmapPanel(ctx, panelBg, borderCol, dark);
        this._drawSectionLabel(ctx,
            '▎ 5 阶段路线图  Capstone Roadmap',
            this._roadRect.x, this._sectionLabelY, subColor);
        this._drawRoadmap(ctx, dark, textColor, subColor, borderCol, cardBg);

        // ---- Section: bottom topics ----
        this._drawSectionLabel(ctx,
            '▎ 5 大选题方向  Topic Directions  ·  鼠标悬停查看示例，点击锁定',
            this._topicRect.x, this._topicRect.y - 14, subColor);
        this._drawTopics(ctx, dark, textColor, subColor, borderCol, cardBg);

        // ---- Footer status ----
        this._drawFooter(ctx, w, h, subColor, textColor, dark);

        // ---- Tooltip (top-most layer) ----
        if (this._tooltip && this._hoverStage >= 0) {
            this._drawTooltip(ctx, w, h, textColor, subColor, borderCol, cardBg, dark);
        }
    }

    _drawRoadmapPanel(ctx, panelBg, borderCol, dark) {
        const r = this._roadRect;
        ctx.fillStyle = panelBg;
        this.roundRect(ctx, r.x, r.y, r.w, r.h, 10);
        ctx.fill();
        ctx.strokeStyle = borderCol;
        ctx.lineWidth = 1;
        this.roundRect(ctx, r.x, r.y, r.w, r.h, 10);
        ctx.stroke();
    }

    _drawSectionLabel(ctx, label, x, y, subColor) {
        ctx.fillStyle = subColor;
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(label, x, y);
    }

    _drawRoadmap(ctx, dark, textColor, subColor, borderCol, cardBg) {
        const stages = this.stages;
        const n = stages.length;

        // Connecting backbone along card centers
        const baseY = this._stageRects[0].y + this._stageRects[0].h / 2;
        ctx.beginPath();
        ctx.moveTo(this._stageRects[0].x, baseY);
        ctx.lineTo(this._stageRects[n - 1].x + this._stageRects[n - 1].w, baseY);
        ctx.strokeStyle = dark ? 'rgba(148,163,184,0.30)' : 'rgba(100,116,139,0.30)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 5]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Arrows between cards
        for (let i = 0; i < n - 1; i++) {
            const cur = this._stageRects[i];
            const next = this._stageRects[i + 1];
            const ax = cur.x + cur.w + 1;
            const aw = (next.x - ax) - 2;
            const active = (this._activeStage >= i + 1);
            this._drawArrow(ctx, ax + aw / 2, baseY, aw,
                active ? stages[i].color : (dark ? '#64748B' : '#94A3B8'),
                active);
        }

        // Stage cards
        for (let i = 0; i < n; i++) {
            this._drawStageCard(ctx, this._stageRects[i], stages[i], i,
                dark, textColor, subColor, borderCol, cardBg);
        }
    }

    _drawArrow(ctx, x, y, w, color, active) {
        if (w <= 6) return;
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = active ? 2.2 : 1.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x - w / 2, y);
        ctx.lineTo(x + w / 2 - 4, y);
        ctx.stroke();
        // arrow head
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y);
        ctx.lineTo(x + w / 2 - 6, y - 4);
        ctx.lineTo(x + w / 2 - 6, y + 4);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();
    }

    _drawStageCard(ctx, box, stage, idx, dark, textColor, subColor, borderCol, cardBg) {
        const isActive = idx === this._activeStage;
        const isHover  = idx === this._hoverStage;
        const color = stage.color;

        const baseX = box.x;
        const baseY = box.y;
        const w = box.w;
        const h = box.h;

        // Active glow halo
        if (isActive) {
            const haloR = h / 2 + 12 + Math.sin(this._pulse) * 2;
            const halo = ctx.createRadialGradient(baseX + w / 2, baseY + h / 2, h * 0.4,
                baseX + w / 2, baseY + h / 2, haloR);
            halo.addColorStop(0, this._withAlpha(color, 0.30));
            halo.addColorStop(1, this._withAlpha(color, 0));
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(baseX + w / 2, baseY + h / 2, haloR, 0, Math.PI * 2);
            ctx.fill();
        }

        // Card body
        ctx.save();
        if (isActive || isHover) {
            ctx.shadowColor = this._withAlpha(color, dark ? 0.55 : 0.40);
            ctx.shadowBlur = isActive ? 16 : 10;
            ctx.shadowOffsetY = isActive ? 4 : 2;
        }
        const bodyY = baseY + (isActive ? -2 : (isHover ? -1 : 0));
        const grad = ctx.createLinearGradient(baseX, bodyY, baseX, bodyY + h);
        if (dark) {
            grad.addColorStop(0, isActive ? this._shade(color, -0.45) : '#1E293B');
            grad.addColorStop(1, isActive ? this._shade(color, -0.25) : '#0F172A');
        } else {
            grad.addColorStop(0, isActive ? this._shade(color, 0.18) : '#FFFFFF');
            grad.addColorStop(1, isActive ? this._shade(color, 0.05) : '#F1F5F9');
        }
        ctx.fillStyle = grad;
        this.roundRect(ctx, baseX, bodyY, w, h, 10);
        ctx.fill();
        ctx.restore();

        // Border
        ctx.beginPath();
        this.roundRect(ctx, baseX, bodyY, w, h, 10);
        ctx.strokeStyle = isActive ? color : (isHover ? this._withAlpha(color, 0.6) : borderCol);
        ctx.lineWidth = isActive ? 2.2 : 1;
        ctx.stroke();

        // Accent left stripe
        ctx.save();
        ctx.beginPath();
        this.roundRect(ctx, baseX, bodyY, w, h, 10);
        ctx.clip();
        ctx.fillStyle = color;
        ctx.fillRect(baseX, bodyY, 4, h);
        ctx.restore();

        // Top row: number badge + key tag
        const padInner = 8;
        const badgeY = bodyY + 6;
        const badgeR = 9;
        const badgeX = baseX + padInner + badgeR;
        ctx.beginPath();
        ctx.arc(badgeX, badgeY + badgeR, badgeR, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(idx + 1), badgeX, badgeY + badgeR + 0.5);

        // Key tag (right of badge)
        ctx.fillStyle = color;
        ctx.font = 'bold 10px ui-monospace, Menlo, monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(stage.tag, badgeX + badgeR + 6, badgeY + badgeR + 0.5);

        // Stage name (large)
        ctx.fillStyle = textColor;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        const nameX = baseX + padInner;
        const nameY = bodyY + 26;
        ctx.fillText(stage.name, nameX, nameY);

        // Description (wraps)
        ctx.fillStyle = subColor;
        ctx.font = '10px sans-serif';
        const maxDescW = w - padInner * 2;
        const descLines = this.wrapText(ctx, stage.desc, 0, 0, maxDescW, 12);
        let dy = nameY + 16;
        const maxDescLines = Math.max(1, Math.floor((h - (dy - bodyY) - 8) / 12));
        for (let i = 0; i < Math.min(maxDescLines, descLines.length); i++) {
            ctx.fillText(descLines[i], nameX, dy + i * 12);
        }

        // Active progress bar (subtle stripe at bottom of card)
        if (isActive) {
            const pbY = bodyY + h - 4;
            ctx.fillStyle = this._withAlpha(color, dark ? 0.45 : 0.35);
            ctx.fillRect(baseX + 6, pbY, w - 12, 2);
        }
    }

    _drawTopics(ctx, dark, textColor, subColor, borderCol, cardBg) {
        const topics = this.topics;
        for (let i = 0; i < topics.length; i++) {
            this._drawTopicCard(ctx, this._topicRects[i], topics[i], i,
                dark, textColor, subColor, borderCol, cardBg);
        }
    }

    _drawTopicCard(ctx, box, topic, idx, dark, textColor, subColor, borderCol, cardBg) {
        const isHover = idx === this._hoverTopic;
        const isSelected = idx === this._selectedTopic;
        const emphasized = isHover || isSelected;
        const color = topic.color;

        // Gentle "lift" on hover
        const liftY = isHover ? -3 : 0;
        const scale = isHover ? 1.04 : 1.0;
        const x = box.x;
        const y = box.y + liftY;
        const w = box.w;
        const h = box.h;
        const cx = x + w / 2;
        const cy = y + h / 2;

        // Card body
        ctx.save();
        if (emphasized) {
            ctx.shadowColor = this._withAlpha(color, dark ? 0.55 : 0.40);
            ctx.shadowBlur = isSelected ? 18 : 14;
            ctx.shadowOffsetY = isSelected ? 4 : 3;
        } else {
            ctx.shadowColor = 'rgba(0,0,0,0.10)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetY = 1;
        }
        ctx.fillStyle = cardBg;
        this.roundRect(ctx, x, y, w, h, 10);
        ctx.fill();
        ctx.restore();

        // Border
        ctx.beginPath();
        this.roundRect(ctx, x, y, w, h, 10);
        ctx.strokeStyle = emphasized ? color : borderCol;
        ctx.lineWidth = emphasized ? 2 : 1;
        ctx.stroke();

        // Subtle accent gradient on right edge
        ctx.save();
        ctx.beginPath();
        this.roundRect(ctx, x, y, w, h, 10);
        ctx.clip();
        const gg = ctx.createLinearGradient(x, y, x + w, y);
        gg.addColorStop(0, this._withAlpha(color, 0));
        gg.addColorStop(1, this._withAlpha(color, emphasized ? 0.16 : 0.07));
        ctx.fillStyle = gg;
        ctx.fillRect(x, y, w, h);
        ctx.restore();

        // Top accent strip
        ctx.fillStyle = color;
        ctx.fillRect(x + 10, y + 8, w - 20, 2.5);

        // Letter icon circle
        const iconR = Math.max(14, Math.min(22, Math.min(w, h) * 0.13));
        const iconX = x + 16 + iconR;
        const iconY = y + 30;
        const grad = ctx.createRadialGradient(iconX - iconR * 0.3, iconY - iconR * 0.3, 2,
            iconX, iconY, iconR);
        grad.addColorStop(0, topic.colorSoft);
        grad.addColorStop(1, color);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(iconX, iconY, iconR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = this._shade(color, -0.2);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold ' + Math.round(iconR * 0.95) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(topic.letter, iconX, iconY + 1);

        // Category name (right of icon)
        const nameX = iconX + iconR + 10;
        const nameY = y + 18;
        ctx.fillStyle = textColor;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(topic.name, nameX, nameY);

        // Index label
        ctx.fillStyle = subColor;
        ctx.font = '9px sans-serif';
        ctx.fillText('方向 ' + (idx + 1) + ' / ' + this.topics.length, nameX, nameY + 14);

        // Examples list
        const listX = x + 12;
        const listY = y + 60;
        const listW = w - 24;
        const rowH = Math.max(12, Math.min(15, (h - (listY - y) - 8) / topic.examples.length));
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        for (let i = 0; i < topic.examples.length; i++) {
            const ex = topic.examples[i];
            const ey = listY + i * rowH;
            // bullet dot
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(listX + 3, ey + 6, 1.8, 0, Math.PI * 2);
            ctx.fill();
            // text (truncate if too long)
            ctx.fillStyle = emphasized ? textColor : subColor;
            const maxTextW = listW - 10;
            const exLines = this.wrapText(ctx, ex, 0, 0, maxTextW, rowH);
            ctx.fillText(exLines[0] || '', listX + 10, ey);
        }

        // Selected check badge (top-right)
        if (isSelected) {
            const bx = x + w - 12;
            const by = y + 12;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(bx, by, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('✓', bx, by + 0.5);
        }

        // Hover tooltip line at bottom
        if (emphasized) {
            ctx.fillStyle = this._withAlpha(color, dark ? 0.25 : 0.18);
            ctx.fillRect(x + 6, y + h - 5, w - 12, 2);
        }

        // Suppress unused-variable warning for scale (kept for future use)
        void scale; void cx; void cy;
    }

    _drawFooter(ctx, w, h, subColor, textColor, dark) {
        ctx.fillStyle = subColor;
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';

        let status;
        if (this._activeStage >= 0) {
            const s = this.stages[this._activeStage];
            status = '阶段 ' + (this._activeStage + 1) + '/' + this.stages.length +
                '  ·  ' + s.name + '  ·  ' + s.tag;
        } else {
            status = '按 ▶ 播放自动演示路线图  ·  ⏭ 单步跳转  ·  悬停阶段查看"本周该做什么"';
        }
        ctx.fillText(status, 14, this._footerY);

        ctx.textAlign = 'right';
        const selectedName = (this._selectedTopic >= 0)
            ? this.topics[this._selectedTopic].name
            : '未选方向';
        ctx.fillStyle = (this._selectedTopic >= 0) ? this.topics[this._selectedTopic].color : subColor;
        ctx.fillText('当前选题方向: ' + selectedName, w - 14, this._footerY);
        ctx.textAlign = 'left';

        // Suppress unused-variable warning
        void textColor; void dark;
    }

    _drawTooltip(ctx, w, h, textColor, subColor, borderCol, cardBg, dark) {
        const stage = this.stages[this._tooltip.stage];
        const color = stage.color;

        const lines = [
            { t: '阶段 ' + (this._tooltip.stage + 1) + ' · ' + stage.name, bold: true, color: color },
            { t: stage.desc, bold: false, color: textColor },
            { t: stage.action, bold: false, color: dark ? '#E2E8F0' : '#1E293B' }
        ];

        ctx.font = '11px sans-serif';
        const lineH = 14;
        const padX = 10;
        const padY = 8;
        let maxW = 0;
        lines.forEach((l) => {
            ctx.font = l.bold ? 'bold 12px sans-serif' : '11px sans-serif';
            const tw = ctx.measureText(l.t).width;
            if (tw > maxW) maxW = tw;
        });
        // wrap the "action" line if needed
        const actionMaxW = Math.min(320, w - 40);
        ctx.font = '11px sans-serif';
        const actionLines = this.wrapText(ctx, stage.action, 0, 0, actionMaxW, lineH);
        const wrappedAction = actionLines.map((ln, i) => ({
            t: ln, bold: false, color: dark ? '#E2E8F0' : '#1E293B'
        }));
        const allLines = [lines[0], lines[1], ...wrappedAction];

        const boxW = Math.max(180, Math.min(actionMaxW + padX * 2,
            maxW + padX * 2));
        const boxH = allLines.length * lineH + padY * 2 + 4;

        // Anchor near mouse, but keep within canvas
        let tx = this._tooltip.x + 14;
        let ty = this._tooltip.y + 14;
        if (tx + boxW > w - 4) tx = w - boxW - 4;
        if (ty + boxH > h - 4) ty = h - boxH - 4;
        if (tx < 4) tx = 4;
        if (ty < 4) ty = 4;

        // background
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.25)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 3;
        ctx.fillStyle = dark ? 'rgba(15,23,42,0.97)' : 'rgba(255,255,255,0.98)';
        this.roundRect(ctx, tx, ty, boxW, boxH, 7);
        ctx.fill();
        ctx.restore();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        this.roundRect(ctx, tx, ty, boxW, boxH, 7);
        ctx.stroke();

        // header bar
        ctx.save();
        ctx.beginPath();
        this.roundRect(ctx, tx, ty, boxW, boxH, 7);
        ctx.clip();
        ctx.fillStyle = this._withAlpha(color, dark ? 0.18 : 0.10);
        ctx.fillRect(tx, ty, boxW, 22);
        // accent stripe
        ctx.fillStyle = color;
        ctx.fillRect(tx, ty, 3, boxH);
        ctx.restore();

        // text
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        allLines.forEach((l, i) => {
            ctx.font = (i === 0) ? 'bold 12px sans-serif' : '11px sans-serif';
            ctx.fillStyle = l.color;
            ctx.fillText(l.t, tx + padX, ty + padY + i * lineH);
        });

        // Suppress unused-variable warning
        void cardBg; void borderCol;
    }

    /* ---------------- color helpers ---------------- */
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

registerAnimation('ch16-capstone', () => new Ch16Capstone());

/**
 * CH15: Cybertown - AI Agent Town Grid
 * Visualizes a 2D pixel-style office town with NPC agents
 */
import { CanvasAnimation } from './canvas-animation.js';
import { registerAnimation } from './animation-registry.js';

class Ch15Cybertown extends CanvasAnimation {
    constructor() {
        super();
        this.npcs = [];
        this.buildings = [];
        this.trees = [];
        this.agentParticles = [];
        this.time = 0;
        this.animationId = null;
        this.isRunning = false;
    }

    init(canvas) {
        super.init(canvas);
        this._generateTown();
        this.draw();
        this.startAmbient();
        window.addEventListener('resize', () => {
            this._resize();
            this._generateTown();
            this.draw();
        });
    }

    _generateTown() {
        const w = this.width;
        const h = this.height;
        const dark = this.isDarkTheme();

        // Generate buildings (office blocks)
        this.buildings = [];
        const buildingPositions = [
            { x: 0.15, y: 0.25, w: 0.18, h: 0.20, color: dark ? '#334155' : '#6366F1', label: '研发部' },
            { x: 0.42, y: 0.20, w: 0.20, h: 0.22, color: dark ? '#1E40AF' : '#3B82F6', label: '产品部' },
            { x: 0.70, y: 0.25, w: 0.16, h: 0.18, color: dark ? '#065F46' : '#10B981', label: '设计部' },
            { x: 0.30, y: 0.60, w: 0.14, h: 0.16, color: dark ? '#7C2D12' : '#F59E0B', label: '咖啡厅' },
            { x: 0.55, y: 0.58, w: 0.15, h: 0.14, color: dark ? '#6B21A8' : '#8B5CF6', label: '会议室' }
        ];

        buildingPositions.forEach(p => {
            this.buildings.push({
                x: p.x * w, y: p.y * h,
                w: p.w * w, h: p.h * h,
                color: p.color,
                label: p.label,
                windows: this._generateWindows(p.x * w, p.y * h, p.w * w, p.h * h)
            });
        });

        // Generate trees
        this.trees = [];
        const treePositions = [
            { x: 0.05, y: 0.50 }, { x: 0.08, y: 0.55 },
            { x: 0.92, y: 0.45 }, { x: 0.88, y: 0.52 },
            { x: 0.50, y: 0.85 }, { x: 0.45, y: 0.88 },
            { x: 0.20, y: 0.12 }, { x: 0.78, y: 0.10 }
        ];
        treePositions.forEach(p => {
            this.trees.push({ x: p.x * w, y: p.y * h, size: 10 + Math.random() * 8 });
        });

        // Generate NPC agents
        this.npcs = [
            { x: 0.32, y: 0.35, name: '张三', role: 'Python工程师', color: '#6366F1', dir: 1, speed: 0.3 + Math.random() * 0.2, offset: 0 },
            { x: 0.55, y: 0.32, name: '李四', role: '产品经理', color: '#3B82F6', dir: -1, speed: 0.2 + Math.random() * 0.2, offset: 0 },
            { x: 0.78, y: 0.35, name: '王五', role: 'UI设计师', color: '#10B981', dir: 1, speed: 0.25 + Math.random() * 0.2, offset: 0 },
            { x: 0.40, y: 0.70, name: '访客', role: '学习者', color: '#F59E0B', dir: -1, speed: 0.15 + Math.random() * 0.15, offset: 0 }
        ];
    }

    _generateWindows(bx, by, bw, bh) {
        const windows = [];
        const cols = Math.floor(bw / 28);
        const rows = Math.floor(bh / 22);
        const padX = 10, padY = 12;
        for (let r = 0; r < rows && r < 4; r++) {
            for (let c = 0; c < cols && c < 5; c++) {
                windows.push({
                    x: bx + padX + c * 28 + (bw - cols * 28) / 2,
                    y: by + padY + r * 22 + (bh - rows * 22) / 2,
                    lit: Math.random() > 0.3
                });
            }
        }
        return windows;
    }

    startAmbient() {
        this.isRunning = true;
        const loop = () => {
            if (!this.isRunning) return;
            this.time += 0.016;
            this.npcs.forEach((npc, i) => {
                npc.offset += npc.speed * 0.008 * npc.dir;
                if (Math.abs(npc.offset) > 40) npc.dir *= -1;
            });
            // Random sparkle agents
            if (Math.random() < 0.06) {
                this.agentParticles.push({
                    x: Math.random() * this.width,
                    y: Math.random() * this.height,
                    life: 1,
                    speed: 0.005 + Math.random() * 0.01
                });
            }
            this.agentParticles.forEach(p => p.life -= p.speed);
            this.agentParticles = this.agentParticles.filter(p => p.life > 0);
            this.draw();
            this.animationId = requestAnimationFrame(loop);
        };
        this.animationId = requestAnimationFrame(loop);
    }

    play() {
        if (!this.isRunning) this.startAmbient();
    }

    step() {
        this.time += 0.1;
        this.npcs.forEach((npc) => {
            npc.offset += npc.speed * 0.03 * npc.dir;
            if (Math.abs(npc.offset) > 40) npc.dir *= -1;
        });
        this.draw();
    }

    reset() {
        this.isRunning = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.time = 0;
        this.agentParticles = [];
        this._generateTown();
        this.draw();
    }

    setSpeed(v) {
        this.npcs.forEach(npc => {
            npc.speed = (0.15 + Math.random() * 0.2) * v;
        });
    }

    _resize() {
        const oldW = this.width;
        super._resize();
        if (oldW !== this.width) {
            this._generateTown();
        }
    }

    draw() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        const dark = this.isDarkTheme();

        ctx.clearRect(0, 0, w, h);

        // Background - grass
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        if (dark) {
            bgGrad.addColorStop(0, '#0F172A');
            bgGrad.addColorStop(0.5, '#1E293B');
            bgGrad.addColorStop(1, '#0F172A');
        } else {
            bgGrad.addColorStop(0, '#E0F2FE');
            bgGrad.addColorStop(0.5, '#F0FDF4');
            bgGrad.addColorStop(1, '#ECFDF5');
        }
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Grid lines (town roads)
        ctx.strokeStyle = dark ? 'rgba(148,163,184,0.12)' : 'rgba(148,163,184,0.20)';
        ctx.lineWidth = 1;
        const gridSize = 60;
        for (let x = 0; x < w; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = 0; y < h; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        // Horizontal roads with labels
        ctx.fillStyle = dark ? 'rgba(148,163,184,0.25)' : 'rgba(226,232,240,0.7)';
        ctx.fillRect(0, h * 0.48, w, 8);
        ctx.fillRect(0, h * 0.80, w, 8);

        // Draw trees
        this.trees.forEach(tree => {
            const s = tree.size;
            // Trunk
            ctx.fillStyle = dark ? '#5D4037' : '#8D6E63';
            ctx.fillRect(tree.x - 2, tree.y - 2, 4, 8);
            // Canopy
            ctx.beginPath();
            ctx.arc(tree.x, tree.y - 6, s * 0.7, 0, Math.PI * 2);
            ctx.fillStyle = dark ? '#2D6A4F' : '#4ADE80';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(tree.x - 4, tree.y - 4, s * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = dark ? '#40916C' : '#86EFAC';
            ctx.fill();
        });

        // Draw buildings
        this.buildings.forEach(b => {
            // Building body
            const grad = ctx.createLinearGradient(b.x, b.y, b.x + b.w, b.y + b.h);
            const bright = dark ? 40 : 20;
            grad.addColorStop(0, this._lightenColor(b.color, bright));
            grad.addColorStop(1, b.color);
            this.roundRect(ctx, b.x, b.y, b.w, b.h, 6);
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.strokeStyle = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.15)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Roof accent
            this.roundRect(ctx, b.x + 4, b.y + 4, b.w - 8, 6, 2);
            ctx.fillStyle = dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.3)';
            ctx.fill();

            // Windows
            b.windows.forEach(win => {
                ctx.fillStyle = win.lit
                    ? (dark ? '#FBBF24' : '#FEF08A')
                    : (dark ? '#1E293B' : '#E2E8F0');
                ctx.fillRect(win.x, win.y, 14, 10);
                ctx.strokeStyle = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(win.x, win.y, 14, 10);
                // Window cross
                ctx.beginPath();
                ctx.moveTo(win.x + 7, win.y);
                ctx.lineTo(win.x + 7, win.y + 10);
                ctx.moveTo(win.x, win.y + 5);
                ctx.lineTo(win.x + 14, win.y + 5);
                ctx.strokeStyle = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
                ctx.stroke();
            });

            // Building label
            ctx.fillStyle = dark ? '#E2E8F0' : '#FFFFFF';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h + 14);
        });

        // Agent particles (floating data dots)
        this.agentParticles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3 + (1 - p.life) * 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(99, 102, 241, ${p.life * 0.6})`;
            ctx.fill();
        });

        // Draw NPC agents (animated)
        this.npcs.forEach((npc, idx) => {
            const baseX = npc.x * w + npc.offset;
            const baseY = npc.y * h + Math.sin(this.time * 2 + idx) * 2;
            const r = 18;

            // Shadow
            ctx.beginPath();
            ctx.ellipse(baseX, baseY + r + 2, r * 0.7, 4, 0, 0, Math.PI * 2);
            ctx.fillStyle = dark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)';
            ctx.fill();

            // Body circle
            const grad = ctx.createRadialGradient(baseX - 4, baseY - 4, 2, baseX, baseY, r);
            grad.addColorStop(0, this._lightenColor(npc.color, 40));
            grad.addColorStop(1, npc.color);
            ctx.beginPath();
            ctx.arc(baseX, baseY, r, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.strokeStyle = dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Agent icon (simplified face)
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🤖', baseX, baseY - 1);

            // Name label
            ctx.fillStyle = dark ? '#F1F5F9' : '#0F172A';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(npc.name, baseX, baseY + r + 4);

            // Role label
            ctx.fillStyle = dark ? '#94A3B8' : '#64748B';
            ctx.font = '9px sans-serif';
            ctx.fillText(npc.role, baseX, baseY + r + 18);
        });

        // Title
        ctx.fillStyle = dark ? '#F1F5F9' : '#0F172A';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('🏙️ 赛博小镇', 16, 16);

        ctx.fillStyle = dark ? '#94A3B8' : '#64748B';
        ctx.font = '12px sans-serif';
        ctx.fillText('AI Agent Town - ' + this.npcs.length + ' 位居民', 16, 42);

        // Time indicator
        const hour = Math.floor(this.time * 10 % 24);
        ctx.fillStyle = dark ? '#94A3B8' : '#64748B';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`🕐 ${hour.toString().padStart(2, '0')}:00`, w - 16, 16);
    }

    _lightenColor(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return `rgb(${R},${G},${B})`;
    }

    destroy() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}

registerAnimation('ch15-cybertown', () => new Ch15Cybertown());

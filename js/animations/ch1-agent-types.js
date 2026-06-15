const Ch1AgentTypes = {
    canvas: null, ctx: null, width: 0, height: 0,
    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.draw();
    },
    draw() {
        const ctx = this.ctx, w = this.width, h = this.height;
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);

        const types = [
            { name: '简单反射型', x: w * 0.2, y: h * 0.3, color: '#93C5FD' },
            { name: '模型反射型', x: w * 0.5, y: h * 0.3, color: '#A78BFA' },
            { name: '目标驱动型', x: w * 0.8, y: h * 0.3, color: '#F9A8D4' },
            { name: '效用驱动型', x: w * 0.35, y: h * 0.7, color: '#86EFAC' },
            { name: '学习型', x: w * 0.65, y: h * 0.7, color: '#FCD34D' }
        ];

        types.forEach(type => {
            ctx.beginPath();
            ctx.arc(type.x, type.y, 50, 0, Math.PI * 2);
            ctx.fillStyle = type.color;
            ctx.fill();
            ctx.strokeStyle = '#374151';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#1F2937';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(type.name, type.x, type.y);
        });

        ctx.fillStyle = '#6B7280';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('点击类型查看详情（功能待完善）', w / 2, h - 30);
    }
};
window.Animations = window.Animations || {};
window.Animations['ch1-agent-types'] = Ch1AgentTypes;
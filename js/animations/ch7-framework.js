const Ch7Framework = {
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

        const components = [
            { name: 'LLMClient', x: w * 0.5, y: h * 0.2, color: '#6366F1' },
            { name: 'ToolManager', x: w * 0.2, y: h * 0.5, color: '#3B82F6' },
            { name: 'Memory', x: w * 0.8, y: h * 0.5, color: '#10B981' },
            { name: 'Planner', x: w * 0.35, y: h * 0.8, color: '#F59E0B' },
            { name: 'Executor', x: w * 0.65, y: h * 0.8, color: '#EF4444' }
        ];

        components.forEach(comp => {
            ctx.fillStyle = comp.color;
            ctx.fillRect(comp.x - 50, comp.y - 25, 100, 50);
            ctx.strokeStyle = '#374151';
            ctx.lineWidth = 2;
            ctx.strokeRect(comp.x - 50, comp.y - 25, 100, 50);

            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(comp.name, comp.x, comp.y);
        });

        // Draw connections
        ctx.strokeStyle = '#9CA3AF';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);

        const connections = [[0,1], [0,2], [0,3], [3,4], [1,4]];
        connections.forEach(([a, b]) => {
            ctx.beginPath();
            ctx.moveTo(components[a].x, components[a].y + 25);
            ctx.lineTo(components[b].x, components[b].y - 25);
            ctx.stroke();
        });
        ctx.setLineDash([]);
    }
};
window.Animations['ch7-framework'] = Ch7Framework;
const Ch13Travel = {
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

        const agents = [
            { name: 'Planner', role: '行程规划', x: w * 0.5, y: h * 0.2, color: '#6366F1' },
            { name: 'Booking', role: '预订服务', x: w * 0.25, y: h * 0.6, color: '#3B82F6' },
            { name: 'Advisor', role: '旅行建议', x: w * 0.75, y: h * 0.6, color: '#10B981' }
        ];

        agents.forEach(agent => {
            ctx.beginPath();
            ctx.arc(agent.x, agent.y, 45, 0, Math.PI * 2);
            ctx.fillStyle = agent.color;
            ctx.fill();
            ctx.strokeStyle = '#374151';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(agent.name, agent.x, agent.y - 5);
            ctx.font = '10px sans-serif';
            ctx.fillText(agent.role, agent.x, agent.y + 10);
        });

        // Draw collaboration arrows
        ctx.strokeStyle = '#9CA3AF';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);

        ctx.beginPath();
        ctx.moveTo(agents[0].x - 30, agents[0].y + 35);
        ctx.lineTo(agents[1].x + 30, agents[1].y - 35);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(agents[0].x + 30, agents[0].y + 35);
        ctx.lineTo(agents[2].x - 30, agents[2].y - 35);
        ctx.stroke();

        ctx.setLineDash([]);

        ctx.fillStyle = '#6B7280';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('任务分配与协作', w / 2, h - 30);
    }
};
window.Animations['ch13-travel'] = Ch13Travel;
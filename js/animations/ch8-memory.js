const Ch8Memory = {
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

        // STM
        ctx.fillStyle = '#DBEAFE';
        ctx.fillRect(w * 0.1, h * 0.3, w * 0.25, h * 0.4);
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 2;
        ctx.strokeRect(w * 0.1, h * 0.3, w * 0.25, h * 0.4);
        ctx.fillStyle = '#1E40AF';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('短期记忆 (STM)', w * 0.225, h * 0.25);

        // Arrow
        ctx.beginPath();
        ctx.moveTo(w * 0.4, h * 0.5);
        ctx.lineTo(w * 0.55, h * 0.5);
        ctx.strokeStyle = '#6B7280';
        ctx.lineWidth = 3;
        ctx.stroke();

        // LTM
        ctx.fillStyle = '#D1FAE5';
        ctx.fillRect(w * 0.6, h * 0.3, w * 0.25, h * 0.4);
        ctx.strokeStyle = '#10B981';
        ctx.strokeRect(w * 0.6, h * 0.3, w * 0.25, h * 0.4);
        ctx.fillStyle = '#065F46';
        ctx.fillText('长期记忆 (LTM)', w * 0.725, h * 0.25);

        // Retrieval arrow
        ctx.beginPath();
        ctx.moveTo(w * 0.725, h * 0.3);
        ctx.lineTo(w * 0.725, h * 0.2);
        ctx.lineTo(w * 0.225, h * 0.2);
        ctx.lineTo(w * 0.225, h * 0.3);
        ctx.strokeStyle = '#F59E0B';
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#92400E';
        ctx.fillText('检索 (Retrieval)', w * 0.475, h * 0.15);
    }
};
window.Animations['ch8-memory'] = Ch8Memory;
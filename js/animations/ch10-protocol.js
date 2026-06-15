const Ch10Protocol = {
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

        const actors = ['Host', 'Client', 'Server'];
        const xPositions = [w * 0.2, w * 0.5, w * 0.8];

        // Actor boxes
        actors.forEach((actor, i) => {
            ctx.fillStyle = '#E0E7FF';
            ctx.fillRect(xPositions[i] - 40, 30, 80, 30);
            ctx.strokeStyle = '#6366F1';
            ctx.strokeRect(xPositions[i] - 40, 30, 80, 30);
            ctx.fillStyle = '#3730A3';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(actor, xPositions[i], 50);

            // Lifeline
            ctx.beginPath();
            ctx.moveTo(xPositions[i], 60);
            ctx.lineTo(xPositions[i], h - 50);
            ctx.strokeStyle = '#C7D2FE';
            ctx.setLineDash([3, 3]);
            ctx.stroke();
        });
        ctx.setLineDash([]);

        // Messages
        const messages = [
            { from: 0, to: 1, text: 'initialize()', y: 100 },
            { from: 1, to: 2, text: 'connect()', y: 150 },
            { from: 2, to: 1, text: 'acknowledge()', y: 200 },
            { from: 1, to: 0, text: 'ready()', y: 250 }
        ];

        messages.forEach(msg => {
            const fromX = xPositions[msg.from];
            const toX = xPositions[msg.to];
            const y = msg.y;

            ctx.beginPath();
            ctx.moveTo(fromX, y);
            ctx.lineTo(toX, y);
            ctx.strokeStyle = '#374151';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Arrow
            const dir = toX > fromX ? 1 : -1;
            ctx.beginPath();
            ctx.moveTo(toX - dir * 10, y - 5);
            ctx.lineTo(toX, y);
            ctx.lineTo(toX - dir * 10, y + 5);
            ctx.fillStyle = '#374151';
            ctx.fill();

            ctx.fillStyle = '#4B5563';
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(msg.text, (fromX + toX) / 2, y - 8);
        });
    }
};
window.Animations['ch10-protocol'] = Ch10Protocol;
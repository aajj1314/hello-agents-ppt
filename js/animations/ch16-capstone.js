import { CanvasAnimation } from './canvas-animation.js';
import { registerAnimation } from './animation-registry.js';

class Ch16Capstone extends CanvasAnimation {
    init(canvas) { super.init(canvas); this.draw(); }
    play() {} step() {} reset() {} setSpeed(v) {}
    draw() {
        const ctx = this.ctx, w = this.width, h = this.height;
        const dark = this.isDarkTheme();
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = dark ? '#1E293B' : '#F8FAFC';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = dark ? '#CBD5E1' : '#475569';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎓', w / 2, h / 2 - 30);

        ctx.fillStyle = dark ? '#F8FAFC' : '#0F172A';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('毕业设计项目演示', w / 2, h / 2 + 15);

        ctx.fillStyle = dark ? '#94A3B8' : '#64748B';
        ctx.font = '14px sans-serif';
        ctx.fillText('将视频文件放入 assets/animations/ch16/demo.mp4 即可启用', w / 2, h / 2 + 45);
    }
}
registerAnimation('ch16-capstone', () => new Ch16Capstone());

// tests/animations/canvas-animation.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CanvasAnimation } from '../../js/animations/canvas-animation.js';

class TestAnim extends CanvasAnimation {
    init(canvas) { super.init(canvas); }
    draw() { this.drawn = true; }
    play() {}
    pause() {}
    step() {}
    reset() {}
    setSpeed(v) { this.speed = v; }
}

// Mock canvas context for jsdom
function mockCtx() {
    return {
        setTransform: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        quadraticCurveTo: vi.fn(),
        closePath: vi.fn(),
        measureText: vi.fn((t) => ({ width: t.length * 20 })),
        fillRect: vi.fn(),
        clearRect: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        fillText: vi.fn(),
        arc: vi.fn()
    };
}

describe('CanvasAnimation', () => {
    let canvas, ctx;
    beforeEach(() => {
        document.body.innerHTML = '<div id="c" style="width:400px;height:300px"><canvas></canvas></div>';
        canvas = document.querySelector('canvas');
        ctx = mockCtx();
        vi.spyOn(canvas, 'getContext').mockReturnValue(ctx);
    });

    it('reads DPR-aware logical size', () => {
        Object.defineProperty(canvas.parentElement, 'clientWidth', { value: 400, configurable: true });
        Object.defineProperty(canvas.parentElement, 'clientHeight', { value: 300, configurable: true });
        const a = new TestAnim();
        a.init(canvas);
        expect(a.width).toBe(400);
        expect(a.height).toBe(300);
        expect(a.canvas.width).toBe(400 * (window.devicePixelRatio || 1));
    });

    it('isDarkTheme() reads data-theme attribute', () => {
        document.documentElement.setAttribute('data-theme', 'dark');
        const a = new TestAnim();
        expect(a.isDarkTheme()).toBe(true);
        document.documentElement.setAttribute('data-theme', 'light');
        expect(a.isDarkTheme()).toBe(false);
    });

    it('roundRect draws rounded path', () => {
        const a = new TestAnim();
        a.init(canvas);
        a.roundRect(ctx, 10, 10, 100, 50, 5);
        expect(ctx.quadraticCurveTo).toHaveBeenCalled();
    });

    it('wrapText splits long text into lines', () => {
        const a = new TestAnim();
        a.init(canvas);
        const lines = a.wrapText(ctx, 'abcdef', 0, 0, 50, 16);
        expect(lines.length).toBeGreaterThan(1);
    });
});

// js/animations/canvas-animation.js
export class CanvasAnimation {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 0;
        this.height = 0;
        this._themeObserver = null;
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this._resize();
        this._observeTheme();
    }

    _observeTheme() {
        if (typeof MutationObserver === 'undefined' || !document.documentElement) return;
        if (this._themeObserver) return;
        const observer = new MutationObserver(() => {
            if (typeof this.render === 'function') {
                this.render();
            } else if (typeof this.draw === 'function') {
                this.draw();
            }
        });
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme'],
        });
        this._themeObserver = observer;
    }

    /**
     * Returns current theme tokens, reading from CSS custom properties.
     * Falls back to Claude default palette if a token is missing.
     */
    theme() {
        const cs = (typeof getComputedStyle === 'function' && document.documentElement)
            ? getComputedStyle(document.documentElement)
            : null;
        const get = (name, fallback) => {
            if (!cs) return fallback;
            const v = cs.getPropertyValue(name).trim();
            return v || fallback;
        };
        return {
            primary:           get('--primary', '#cc785c'),
            primaryActive:     get('--primary-active', '#a9583e'),
            ink:               get('--ink', '#141413'),
            body:              get('--body', '#3d3d3a'),
            muted:             get('--muted', '#6c6a64'),
            mutedSoft:         get('--muted-soft', '#8e8b82'),
            canvas:            get('--canvas', '#faf9f5'),
            surfaceCard:       get('--surface-card', '#efe9de'),
            surfaceDark:       get('--surface-dark', '#181715'),
            surfaceDarkSoft:   get('--surface-dark-soft', '#1f1e1b'),
            accentTeal:        get('--accent-teal', '#5db8a6'),
            accentAmber:       get('--accent-amber', '#e8a55a'),
            hairline:          get('--hairline', '#e6dfd8'),
            onDark:            get('--on-dark', '#faf9f5'),
            onDarkSoft:        get('--on-dark-soft', '#a09d96'),
            success:           get('--success', '#5db872'),
            warning:           get('--warning', '#d4a017'),
            error:             get('--error', '#c64545'),
        };
    }

    _resize() {
        if (!this.canvas) return;
        const container = this.canvas.parentElement;
        const dpr = window.devicePixelRatio || 1;
        const w = container.clientWidth || 800;
        const h = container.clientHeight || 420;
        this.canvas.style.width = w + 'px';
        this.canvas.style.height = h + 'px';
        this.canvas.width = w * dpr;
        this.canvas.height = h * dpr;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.width = w;
        this.height = h;
    }

    isDarkTheme() {
        return document.documentElement.getAttribute('data-theme') === 'dark';
    }

    roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split('');
        let line = '';
        const lines = [];
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n];
            if (ctx.measureText(testLine).width > maxWidth && n > 0) {
                lines.push(line);
                line = words[n];
            } else {
                line = testLine;
            }
        }
        lines.push(line);
        return lines;
    }
}

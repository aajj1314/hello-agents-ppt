// js/slides/slide-router.js
export class SlideRouter {
    constructor() {
        this.handlers = new Map();
        this.defaultFallback = null;
    }

    register(type, handler) {
        this.handlers.set(type, handler);
    }

    route(slide, ctx) {
        const handler = this.handlers.get(slide.type);
        if (handler) return handler(slide, ctx);
        if (this.defaultFallback) return this.defaultFallback(slide, ctx);
        console.warn(`No renderer for slide type: ${slide.type}`);
        return '';
    }
}

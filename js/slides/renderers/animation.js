import { escapeHTML } from '../../core/utils.js';
export const renderAnimation = (slide, ctx) => {
    const id = slide.animation;
    const videoSrc = slide.media?.video;
    return `
<div class="slide-animation">
    <div class="slide-header text-center">
        <span class="slide-num">第 ${ctx.slideIndex + 1} 页 · 交互演示</span>
        <h2>${escapeHTML(slide.title)}</h2>
    </div>
    <div class="animation-wrapper" id="anim-${id}">
        ${videoSrc ? `<video class="animation-video" src="assets/animations/${videoSrc}" preload="none"></video>` : ''}
        <canvas class="animation-canvas" id="canvas-${id}"></canvas>
        <div class="animation-controls">
            <button class="anim-btn" id="btn-play-${id}">▶ 播放</button>
            <button class="anim-btn" id="btn-step-${id}">⏭ 单步</button>
            <button class="anim-btn" id="btn-reset-${id}">↺ 重置</button>
            <div class="speed-control">
                <span>速度:</span>
                <input type="range" min="0.5" max="2" step="0.25" value="1" id="speed-${id}">
                <span class="speed-value" id="speed-val-${id}">1.0x</span>
            </div>
        </div>
    </div>
    ${slide.caption ? `<p class="animation-caption">${escapeHTML(slide.caption)}</p>` : ''}
</div>`;
};

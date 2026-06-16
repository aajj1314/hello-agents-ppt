import { escapeHTML } from '../../core/utils.js';
export const renderCover = (slide, ctx) => `
<div class="slide-cover">
    <div class="cover-icon">${escapeHTML(ctx.chapterData.icon || '📖')}</div>
    <h1>${escapeHTML(slide.title)}</h1>
    <div class="cover-divider"></div>
    <p class="cover-subtitle">${escapeHTML(slide.subtitle || ctx.chapterData.subtitle || '')}</p>
    <div class="cover-meta">共 ${ctx.slidesLength} 页 · 开始学习吧 →</div>
</div>`;

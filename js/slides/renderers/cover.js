// js/slides/renderers/cover.js — Cover slide with glass icon tile
import { escapeHTML } from '../../core/utils.js';
import { resolveIcon } from '../../core/icons.js';

export const renderCover = (slide, ctx) => {
    const iconKey = resolveIcon(ctx.chapterData.icon || 'book');
    return `
<div class="slide-cover reveal">
    <div class="cover-icon" aria-hidden="true">${iconKey}</div>
    <div class="cover-eyebrow">CHAPTER ${String(ctx.chapterIndex != null ? ctx.chapterIndex + 1 : '').padStart(2, '0')}</div>
    <h1>${escapeHTML(slide.title || ctx.chapterData.title || '')}</h1>
    <div class="cover-divider" aria-hidden="true"></div>
    <p class="cover-subtitle">${escapeHTML(slide.subtitle || ctx.chapterData.subtitle || '')}</p>
    <div class="cover-meta">
        <span>共 ${ctx.slidesLength} 页</span>
        <span class="cover-meta__sep" aria-hidden="true"></span>
        <span class="cover-meta__cta">开始学习</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:14px;height:14px;margin-left:4px"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
    </div>
</div>`;
};

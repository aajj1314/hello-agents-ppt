import { escapeHTML } from '../../core/utils.js';
export const renderConcepts = (slide, ctx) => {
    const items = Array.isArray(slide.items) ? slide.items : [];
    return `
<div class="slide-concepts">
    <div class="slide-header">
        <span class="slide-num">核心概念 · ${ctx.slideIndex + 1}/${ctx.slidesLength}</span>
        <h2>${escapeHTML(slide.title)}</h2>
    </div>
    <div class="slide-body">
        <div class="concepts-grid">
            ${items.map((c, i) => `
                <div class="concept-card" style="animation-delay:${i * 0.07}s">
                    <div class="concept-icon">${escapeHTML(c.icon || '✨')}</div>
                    <div class="concept-title">${escapeHTML(c.title || '')}</div>
                    ${c.description ? `<div class="concept-desc">${escapeHTML(c.description)}</div>` : ''}
                </div>`).join('')}
        </div>
    </div>
</div>`;
};

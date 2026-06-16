import { escapeHTML } from '../../core/utils.js';
export const renderTimeline = (slide, ctx) => {
    const items = Array.isArray(slide.items) ? slide.items : [];
    return `
<div class="slide-timeline">
    <div class="slide-header">
        <span class="slide-num">时间线 · ${ctx.slideIndex + 1}/${ctx.slidesLength}</span>
        <h2>${escapeHTML(slide.title)}</h2>
    </div>
    <div class="slide-body">
        <div class="timeline">
            ${items.map((it, i) => `
                <div class="timeline-item ${i === items.length - 1 ? 'last' : ''}">
                    <div class="timeline-dot" style="animation-delay:${i * 0.08}s"></div>
                    <div class="timeline-content">
                        <div class="timeline-year">${escapeHTML(it.year || it.date || '')}</div>
                        <div class="timeline-title">${escapeHTML(it.title || '')}</div>
                        ${it.description ? `<div class="timeline-desc">${escapeHTML(it.description)}</div>` : ''}
                    </div>
                </div>`).join('')}
        </div>
    </div>
</div>`;
};

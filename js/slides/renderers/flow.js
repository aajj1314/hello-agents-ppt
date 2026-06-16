import { escapeHTML } from '../../core/utils.js';
export const renderFlow = (slide, ctx) => {
    const steps = Array.isArray(slide.steps) ? slide.steps : [];
    return `
<div class="slide-flow">
    <div class="slide-header">
        <span class="slide-num">流程 · ${ctx.slideIndex + 1}/${ctx.slidesLength}</span>
        <h2>${escapeHTML(slide.title)}</h2>
    </div>
    <div class="slide-body">
        <div class="flow-diagram">
            ${steps.map((s, i) => `
                <div class="flow-node" style="animation-delay:${i * 0.1}s">
                    <div class="flow-index">${i + 1}</div>
                    <div class="flow-text">
                        <div class="flow-title">${escapeHTML(s.title || '')}</div>
                        ${s.description ? `<div class="flow-desc">${escapeHTML(s.description)}</div>` : ''}
                    </div>
                </div>
                ${i < steps.length - 1 ? '<div class="flow-arrow">↓</div>' : ''}
            `).join('')}
        </div>
    </div>
</div>`;
};

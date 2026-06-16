import { escapeHTML } from '../../core/utils.js';
import { ContentParser } from '../../core/content-parser.js';
const parser = new ContentParser();
export const renderGeneric = (slide, ctx) => `
<div class="slide-content-type">
    <div class="slide-header">
        <span class="slide-num">第 ${ctx.slideIndex + 1} 页 / ${ctx.slidesLength}</span>
        <h2>${escapeHTML(slide.title || '')}</h2>
    </div>
    <div class="slide-body">${parser.parse(slide.content || '')}</div>
</div>`;

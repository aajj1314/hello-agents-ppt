import { escapeHTML } from '../../core/utils.js';
import { highlightCode } from '../../core/code-highlighter.js';
export const renderCode = (slide, ctx) => `
<div class="slide-code">
    <div class="slide-header">
        <span class="slide-num">代码示例 · ${ctx.slideIndex + 1}/${ctx.slidesLength}</span>
        <h2>${escapeHTML(slide.title)}</h2>
    </div>
    <div class="code-block">
        <div class="code-header">
            <span class="code-lang">${escapeHTML(slide.language || 'code')}</span>
            <div class="code-dots"><span></span><span></span><span></span></div>
        </div>
        <pre class="code-content">${highlightCode(slide.code, slide.language)}</pre>
    </div>
    ${slide.explanation ? `<div class="info-box" style="margin-top:1.25rem">${escapeHTML(slide.explanation)}</div>` : ''}
</div>`;

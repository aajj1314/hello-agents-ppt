import { escapeHTML } from '../../core/utils.js';
export const renderComparison = (slide, ctx) => {
    const rows = Array.isArray(slide.rows) ? slide.rows : [];
    const headers = Array.isArray(slide.headers) && slide.headers.length ? slide.headers : ['对比项', '说明'];
    return `
<div class="slide-comparison">
    <div class="slide-header">
        <span class="slide-num">对比表 · ${ctx.slideIndex + 1}/${ctx.slidesLength}</span>
        <h2>${escapeHTML(slide.title)}</h2>
    </div>
    <div class="slide-body">
        <table class="comparison-table">
            <thead>
                <tr>${headers.map(h => `<th>${escapeHTML(h)}</th>`).join('')}</tr>
            </thead>
            <tbody>
                ${rows.map(r => `
                    <tr>${Array.isArray(r) ? r.map(cell => `<td>${escapeHTML(cell)}</td>`).join('') : `<td colspan="${headers.length}">${escapeHTML(r)}</td>`}</tr>
                `).join('')}
            </tbody>
        </table>
    </div>
</div>`;
};

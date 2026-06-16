import { createElement, escapeHTML } from '../core/utils.js';

const ICONS = { cover: '📖', content: '📝', code: '💻', quiz: '✎', animation: '✦', timeline: '⏳', flow: '🔀', concepts: '💡', comparison: '⚖️' };

let _navigate = null;

export function mountTocSidebar(slides, currentIndex, navigate) {
    _navigate = navigate;
    const drawer = createElement('aside', { className: 'toc-drawer' });
    const list = createElement('div', { className: 'toc-list' });
    slides.forEach((s, i) => {
        const item = createElement('div', { className: 'toc-item' + (i === currentIndex ? ' active' : ''), dataset: { index: i } });
        item.innerHTML = `<span class="toc-icon">${ICONS[s.type] || '•'}</span><span class="toc-title">${escapeHTML(s.title || s.type)}</span><span class="toc-num">${i + 1}</span>`;
        item.addEventListener('click', () => { _navigate?.(i); drawer.classList.remove('open'); });
        list.appendChild(item);
    });
    drawer.appendChild(list);
    document.body.appendChild(drawer);
    return drawer;
}

export function toggleToc() {
    document.querySelector('.toc-drawer')?.classList.toggle('open');
}

export function updateTocHighlight(currentIndex) {
    document.querySelectorAll('.toc-item').forEach((el, i) => el.classList.toggle('active', i === currentIndex));
}

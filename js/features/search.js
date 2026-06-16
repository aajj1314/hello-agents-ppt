let _index = null;
let _navigate = null;

export async function ensureIndex() {
    if (_index) return _index;
    const { buildSearchIndex } = await import('./search-index.js');
    const { loadJSON } = await import('../core/utils.js');
    const [chapters, quiz] = await Promise.all([
        loadJSON('data/chapters.json'),
        loadJSON('data/quiz-data.json')
    ]);
    _index = buildSearchIndex(chapters, quiz);
    return _index;
}

export function mountSearch(getIndex, navigate) {
    _navigate = navigate;
    const header = document.querySelector('header');
    if (!header) return;
    const btn = document.createElement('button');
    btn.className = 'search-toggle';
    btn.setAttribute('aria-label', '搜索');
    btn.textContent = '🔍';
    btn.addEventListener('click', () => openSearch());
    header.appendChild(btn);
}

export async function openSearch() {
    if (document.querySelector('.search-modal')) return;

    const modal = document.createElement('div');
    modal.className = 'search-modal';
    const input = document.createElement('input');
    input.className = 'search-input';
    input.type = 'text';
    input.placeholder = '搜索章节、slide、题目…';
    const list = document.createElement('div');
    list.className = 'search-list';
    modal.appendChild(input);
    modal.appendChild(list);
    document.body.appendChild(modal);
    input.focus();

    // Async setup — modal already visible
    const { search: searchIndex } = await import('./search-index.js');
    const { escapeHTML } = await import('../core/utils.js');
    const idx = await ensureIndex();

    let activeIdx = -1;
    const render = (q) => {
        const results = searchIndex(idx, q);
        list.innerHTML = '';
        results.forEach((r, i) => {
            const el = document.createElement('div');
            el.className = 'search-result' + (i === activeIdx ? ' active' : '');
            el.innerHTML = `<div class="search-chapter">${escapeHTML(r.chapterId)}${r.slideIndex >= 0 ? ' · 第 ' + (r.slideIndex + 1) + ' 页' : ''}</div><div class="search-text">${escapeHTML(r.text.slice(0, 100))}</div>`;
            el.addEventListener('click', () => go(r));
            list.appendChild(el);
        });
    };
    const go = (r) => {
        closeSearch();
        _navigate?.({ chapterId: r.chapterId, slideIndex: r.slideIndex });
    };
    input.addEventListener('input', () => { activeIdx = -1; render(input.value); });
    input.addEventListener('keydown', (e) => {
        const items = list.querySelectorAll('.search-result');
        if (e.key === 'ArrowDown') { e.preventDefault(); activeIdx = Math.min(items.length - 1, activeIdx + 1); render(input.value); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); activeIdx = Math.max(0, activeIdx - 1); render(input.value); }
        else if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); go(searchIndex(idx, input.value)[activeIdx]); }
        else if (e.key === 'Escape') { e.preventDefault(); closeSearch(); }
    });
    modal.addEventListener('click', (e) => { if (e.target === modal) closeSearch(); });
}

export function closeSearch() {
    document.querySelector('.search-modal')?.remove();
}

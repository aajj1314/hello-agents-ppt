import { loadJSON } from './core/utils.js';
import { bindPresenterChannel } from './features/presenter-mode.js';

bindPresenterChannel((msg) => { if (msg.type === 'slide') update(msg); });

const params = Object.fromEntries(new URLSearchParams(window.location.search).entries());
const chapterId = params.chapter;
let chapter = null, slides = [], currentIdx = 0;
const start = Date.now();

const stage = document.getElementById('presenterStage');
const notesEl = document.getElementById('notes');
const nextEl = document.getElementById('next');
const timer = document.getElementById('timer');

setInterval(() => {
    const sec = Math.floor((Date.now() - start) / 1000);
    timer.textContent = `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
}, 1000);

async function init() {
    if (!chapterId) { stage.textContent = '未指定章节'; return; }
    const data = await loadJSON('data/chapters.json');
    chapter = data.chapters.find(c => c.id === chapterId);
    if (!chapter) { stage.textContent = '章节不存在'; return; }
    slides = chapter.slides;
    currentIdx = Math.max(0, Math.min((parseInt(params.slide, 10) || 1) - 1, slides.length - 1));
    render();
}

function update(msg) {
    if (msg.chapterId !== chapterId) return;
    currentIdx = msg.slideIndex;
    render(msg.notes);
}

function render(notesText) {
    const slide = slides[currentIdx];
    if (!slide) return;
    stage.innerHTML = `<h1>${slide.title || ''}</h1><div style="margin-top:2rem;font-size:1.1rem;white-space:pre-wrap;">${slide.content || slide.caption || ''}</div>`;
    notesEl.textContent = notesText || slide.speakerNotes || '（无备注）';
    const nxt = slides[currentIdx + 1];
    nextEl.innerHTML = nxt ? `<div>下一页</div><div style="font-weight:bold">${nxt.title || nxt.type}</div>` : '<div>已到末尾</div>';
}

init();

// tests/slides/slide-engine.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SlideEngine } from '../../js/slides/slide-engine.js';
import { Storage } from '../../js/core/storage.js';

const sampleChapter = {
    id: 'ch1', title: 'T', subtitle: 'S', icon: '🤖', slides: [
        { type: 'cover', title: 'C' },
        { type: 'content', title: 'A', content: 'x' },
        { type: 'cover', title: 'C2' }
    ]
};

function stubChapters() {
    vi.stubGlobal('fetch', () => Promise.resolve({
        ok: true, json: () => Promise.resolve({ chapters: [sampleChapter] })
    }));
}

describe('SlideEngine', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="slideStage"></div>
            <h1 id="chapterTitle"></h1>
            <div id="chapterSubtitle"></div>
            <div id="slideProgress"></div>
            <div id="progressBar"></div>
            <button id="btnHome"></button>
            <button id="btnPrev"></button>
            <button id="btnNext"></button>
            <button id="btnPrevBottom"></button>
            <button id="btnNextBottom"></button>
        `;
        localStorage.clear();
        Storage._resetCache();
        vi.unstubAllGlobals();
    });

    it('loads chapter from chapter param', async () => {
        stubChapters();
        const engine = new SlideEngine({ chapter: 'ch1' });
        await engine.init();
        expect(engine.slides.length).toBe(3);
        expect(engine.titleEl.textContent).toBe('T');
    });

    it('initial currentIndex is 0 with fresh state', async () => {
        stubChapters();
        const engine = new SlideEngine({ chapter: 'ch1' });
        await engine.init();
        expect(engine.currentIndex).toBe(0);
    });

    it('uses ?slide= param when provided', async () => {
        stubChapters();
        const engine = new SlideEngine({ chapter: 'ch1', slide: '2' });
        await engine.init();
        expect(engine.currentIndex).toBe(1);
    });

    it('next/prev navigate and stay within bounds', async () => {
        stubChapters();
        const engine = new SlideEngine({ chapter: 'ch1' });
        await engine.init();
        expect(engine.currentIndex).toBe(0);
        engine.next();
        expect(engine.currentIndex).toBe(1);
        engine.next();
        expect(engine.currentIndex).toBe(2);
        expect(engine.btnNext.disabled).toBe(true);
        engine.next();
        expect(engine.currentIndex).toBe(2);
    });
});

// Separate describe to avoid Storage state cross-contamination
describe('SlideEngine with stored progress', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="slideStage"></div>
            <h1 id="chapterTitle"></h1>
            <div id="chapterSubtitle"></div>
            <div id="slideProgress"></div>
            <div id="progressBar"></div>
            <button id="btnHome"></button>
            <button id="btnPrev"></button>
            <button id="btnNext"></button>
            <button id="btnPrevBottom"></button>
            <button id="btnNextBottom"></button>
        `;
        localStorage.clear();
        Storage._resetCache();
        vi.unstubAllGlobals();
    });

    it('respects stored progress if no slide param', async () => {
        Storage.setChapterProgress('ch1', { slideIndex: 2 });
        stubChapters();
        const engine = new SlideEngine({ chapter: 'ch1' });
        await engine.init();
        expect(engine.currentIndex).toBe(2);
    });
});

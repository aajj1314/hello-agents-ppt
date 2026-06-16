// js/core/storage.js
export const STORAGE_KEY = 'hello-agents-ppt';

const defaultState = {
    theme: 'light',
    lastChapter: null,
    lastSlide: 0,
    chapters: {},
    settings: { animationSpeed: 1, showNotes: true, autoPlay: false }
};

let _cache = null;

export const Storage = {
    _readRaw() {
        return localStorage.getItem(STORAGE_KEY);
    },

    _resetCache() { _cache = null; },
    invalidateCache() { _cache = null; },

    get() {
        if (_cache === null) {
            const raw = this._readRaw();
            _cache = raw ? { ...defaultState, ...JSON.parse(raw) } : { ...defaultState };
        }
        return _cache;
    },

    set(data) {
        _cache = { ...defaultState, ...data };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(_cache));
    },

    getChapterProgress(chapterId) {
        const state = this.get();
        return state.chapters[chapterId] || { completed: false, slideIndex: 0, quizScore: 0 };
    },

    setChapterProgress(chapterId, progress) {
        const state = this.get();
        state.chapters[chapterId] = { ...this.getChapterProgress(chapterId), ...progress };
        this.set(state);
    },

    setLastVisited(chapterId, slideIndex) {
        const state = this.get();
        state.lastChapter = chapterId;
        state.lastSlide = slideIndex;
        this.set(state);
    },

    getLastVisited() {
        const state = this.get();
        return { chapterId: state.lastChapter, slideIndex: state.lastSlide };
    },

    getTheme() { return this.get().theme; },

    setTheme(theme) {
        const state = this.get();
        state.theme = theme;
        this.set(state);
        document.documentElement.setAttribute('data-theme', theme);
    },

    reset() {
        _cache = null;
        localStorage.removeItem(STORAGE_KEY);
    },

    getOverallProgress(chapterIds) {
        const state = this.get();
        if (!chapterIds.length) return 0;
        const completed = chapterIds.filter(id => state.chapters[id]?.completed).length;
        return Math.round((completed / chapterIds.length) * 100);
    }
};

// 跨窗口缓存失效：其他窗口写入时让本窗口缓存作废
if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) _cache = null;
    });
    // 启动时从 localStorage 同步一次 theme
    const theme = Storage.getTheme();
    document.documentElement.setAttribute('data-theme', theme);
}

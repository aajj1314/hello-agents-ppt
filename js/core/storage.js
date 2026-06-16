// js/core/storage.js
export const STORAGE_KEY = 'hello-agents-ppt';

const defaultState = {
    theme: 'light',
    lastChapter: null,
    lastSlide: 0,
    chapters: {},
    settings: { animationSpeed: 1, showNotes: true, autoPlay: false }
};

export const Storage = {
    _cache: null,

    _readRaw() {
        return localStorage.getItem(STORAGE_KEY);
    },

    _resetCache() { this._cache = null; },
    invalidateCache() { this._cache = null; },

    get() {
        if (this._cache === null) {
            const raw = this._readRaw();
            if (raw) {
                this._cache = { ...defaultState, ...JSON.parse(raw) };
            } else {
                // Deep copy nested objects to prevent mutating module-level defaults
                this._cache = {
                    ...defaultState,
                    chapters: {},
                    settings: { ...defaultState.settings }
                };
            }
        }
        return this._cache;
    },

    set(data) {
        this._cache = { ...defaultState, ...data };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this._cache));
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
        this._cache = null;
        localStorage.removeItem(STORAGE_KEY);
    },

    getOverallProgress(chapterIds) {
        const state = this.get();
        if (!chapterIds.length) return 0;
        const completed = chapterIds.filter(id => state.chapters[id]?.completed).length;
        return Math.round((completed / chapterIds.length) * 100);
    },

    addWrongAnswer(chapterId, entry) {
        const state = this.get();
        if (!state.wrongAnswers) state.wrongAnswers = {};
        if (!state.wrongAnswers[chapterId]) state.wrongAnswers[chapterId] = [];
        state.wrongAnswers[chapterId].push({ ...entry, ts: Date.now() });
        state.wrongAnswers[chapterId] = state.wrongAnswers[chapterId].slice(-50);
        this.set(state);
    },
    getWrongAnswers(chapterId) {
        return this.get().wrongAnswers?.[chapterId] || [];
    },
    getTotalWrongCount() {
        const wa = this.get().wrongAnswers || {};
        return Object.values(wa).reduce((s, arr) => s + arr.length, 0);
    },
    clearWrong(chapterId) {
        const state = this.get();
        if (state.wrongAnswers?.[chapterId]) { delete state.wrongAnswers[chapterId]; this.set(state); }
    },
    clearAllWrong() {
        const state = this.get();
        state.wrongAnswers = {};
        this.set(state);
    }
};

// 跨窗口缓存失效：其他窗口写入时让本窗口缓存作废
if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) Storage._cache = null;
    });
    // 启动时从 localStorage 同步一次 theme
    const theme = Storage.getTheme();
    document.documentElement.setAttribute('data-theme', theme);
}

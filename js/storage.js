/**
 * Storage manager for user progress and settings
 */
const STORAGE_KEY = 'hello-agents-ppt';

const defaultState = {
    theme: 'light',
    lastChapter: null,
    lastSlide: 0,
    chapters: {},
    settings: {
        animationSpeed: 1,
        showNotes: true,
        autoPlay: false
    }
};

const Storage = {
    get() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : { ...defaultState };
        } catch (e) {
            console.warn('Storage read failed:', e);
            return { ...defaultState };
        }
    },

    set(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('Storage write failed:', e);
        }
    },

    // Chapter progress
    getChapterProgress(chapterId) {
        const state = this.get();
        return state.chapters[chapterId] || { completed: false, slideIndex: 0, quizScore: 0 };
    },

    setChapterProgress(chapterId, progress) {
        const state = this.get();
        state.chapters[chapterId] = { ...this.getChapterProgress(chapterId), ...progress };
        this.set(state);
    },

    // Last visited
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

    // Settings
    getSettings() {
        return this.get().settings;
    },

    setSettings(settings) {
        const state = this.get();
        state.settings = { ...state.settings, ...settings };
        this.set(state);
    },

    // Theme
    getTheme() {
        return this.get().theme;
    },

    setTheme(theme) {
        const state = this.get();
        state.theme = theme;
        this.set(state);
        document.documentElement.setAttribute('data-theme', theme);
    },

    // Reset all progress
    reset() {
        this.set({ ...defaultState });
    },

    // Calculate overall progress percentage
    getOverallProgress(chapterIds) {
        const state = this.get();
        if (!chapterIds.length) return 0;
        const completed = chapterIds.filter(id => state.chapters[id]?.completed).length;
        return Math.round((completed / chapterIds.length) * 100);
    }
};

// Initialize theme on load
(function initTheme() {
    const theme = Storage.getTheme();
    document.documentElement.setAttribute('data-theme', theme);
})();

window.Storage = Storage;
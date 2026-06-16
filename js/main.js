// js/main.js - index.html entry
import './app.js';
import { mountSearch } from './features/search.js';
import { bindShortcuts } from './features/keyboard-shortcuts.js';

document.addEventListener('DOMContentLoaded', () => {
    bindShortcuts();
    mountSearch(null, (target) => {
        window.location.href = `slides.html?chapter=${target.chapterId}&slide=${target.slideIndex + 1}`;
    });
});

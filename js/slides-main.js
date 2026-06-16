// js/slides-main.js - slides.html entry
import { SlideEngine } from './slides/slide-engine.js';
import { bindThemeToggle } from './theme.js';

import { mountTocSidebar, toggleToc, updateTocHighlight } from './features/toc-sidebar.js';
import { mountSearch } from './features/search.js';
import { bindShortcuts, registerShortcut } from './features/keyboard-shortcuts.js';

// Self-registering animation modules
import './animations/ch2-history-timeline.js';
import './animations/ch3-attention.js';
import './animations/ch6-frameworks.js';
import './animations/ch9-context-window.js';
import './animations/ch11-rl-feedback.js';
import './animations/ch12-radar.js';
import './animations/ch14-task-tree.js';
import './animations/ch15-cybertown.js';

if (document.getElementById('slideStage')) {
    document.addEventListener('DOMContentLoaded', () => {
        bindThemeToggle();
        bindShortcuts();
        registerShortcut('Home', () => window.slideEngine?.goTo(0));
        registerShortcut('End', () => window.slideEngine?.goTo(window.slideEngine.slides.length - 1));
        window.slideEngine = new SlideEngine();
        window.slideEngine.init();

        // Mount TOC sidebar
        const engine = window.slideEngine;
        mountTocSidebar(engine.slides, engine.currentIndex, (i) => engine.goTo(i));
        const origUpdateUI = engine.updateUI.bind(engine);
        engine.updateUI = function() { origUpdateUI(); updateTocHighlight(this.currentIndex); };

        mountSearch(null, (target) => {
            window.location.href = `slides.html?chapter=${target.chapterId}&slide=${target.slideIndex + 1}`;
        });
    });
}

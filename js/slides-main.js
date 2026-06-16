// js/slides-main.js - slides.html entry
import { SlideEngine } from './slides/slide-engine.js';
import { bindThemeToggle, syncThemeIcons } from './theme.js';
import { ICONS } from './core/icons.js';

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
import './animations/ch5-lowcode.js';
import './animations/ch16-capstone.js';
import './animations/ch1-agent-types.js';
import './animations/ch4-react-loop.js';
import './animations/ch7-framework.js';
import './animations/ch8-memory.js';
import './animations/ch10-protocol.js';
import './animations/ch13-travel.js';

// Inject SVG icons into the static nav buttons so the page is
// emoji-free even before JS finishes loading the data.
function injectNavIcons() {
    const set = (id, svg) => { const el = document.getElementById(id); if (el) el.innerHTML = svg; };
    set('btnHome', ICONS.home);
    set('btnPrev', ICONS['chevron-left']);
    set('btnNext', ICONS['chevron-right']);
    set('btnPrevBottom', `<span class="bottom-btn__icon" aria-hidden="true">${ICONS['arrow-left']}</span><span>上一页</span>`);
    set('btnNextBottom', `<span>下一页</span><span class="bottom-btn__icon" aria-hidden="true">${ICONS['arrow-right']}</span>`);
}

if (document.getElementById('slideStage')) {
    document.addEventListener('DOMContentLoaded', () => {
        injectNavIcons();
        bindThemeToggle();
        syncThemeIcons();
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

// js/slides-main.js - slides.html entry
import { SlideEngine } from './slides/slide-engine.js';
import { bindThemeToggle } from './theme.js';

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
        window.slideEngine = new SlideEngine();
        window.slideEngine.init();
    });
}

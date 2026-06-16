// js/slides-main.js - slides.html entry
import { SlideEngine } from './slides/slide-engine.js';
import { bindThemeToggle } from './theme.js';

if (document.getElementById('slideStage')) {
    document.addEventListener('DOMContentLoaded', () => {
        bindThemeToggle();
        window.slideEngine = new SlideEngine();
        window.slideEngine.init();
    });
}

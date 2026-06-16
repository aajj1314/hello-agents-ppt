// js/theme.js
import { Storage } from './core/storage.js';
export function bindThemeToggle() {
    const toggle = document.getElementById('themeToggle');
    if (toggle) {
        toggle.addEventListener('click', () => {
            const cur = Storage.getTheme();
            Storage.setTheme(cur === 'light' ? 'dark' : 'light');
        });
    }
}

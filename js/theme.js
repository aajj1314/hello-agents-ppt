// js/theme.js - Theme toggle with icon sync
import { Storage } from './core/storage.js';

const SUN_ICON_ID = 'themeIconSun';
const MOON_ICON_ID = 'themeIconMoon';

function currentTheme() {
    return Storage.getTheme();
}

function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }
    syncThemeIcons();
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0B0A2A' : '#1E1B4B');
}

// Show the icon that represents the OTHER theme (the one user can switch to)
export function syncThemeIcons() {
    const cur = currentTheme();
    const sun = document.getElementById(SUN_ICON_ID);
    const moon = document.getElementById(MOON_ICON_ID);
    if (!sun || !moon) return;
    if (cur === 'dark') {
        sun.style.display = '';
        moon.style.display = 'none';
    } else {
        sun.style.display = 'none';
        moon.style.display = '';
    }
}

export function bindThemeToggle() {
    // Apply stored theme as early as possible
    applyTheme(currentTheme());
    const toggle = document.getElementById('themeToggle');
    if (toggle) {
        toggle.addEventListener('click', () => {
            const cur = currentTheme();
            const next = cur === 'light' ? 'dark' : 'light';
            Storage.setTheme(next);
            applyTheme(next);
        });
    }
}

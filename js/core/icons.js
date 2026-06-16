// js/core/icons.js — Shared SVG icon library (Heroicons-style, 24x24)
// All icons render as inline SVG, use currentColor for theming, and are
// marked aria-hidden by default. Consumers should provide their own
// aria-label on the parent element.

export const ICONS = {
    // UI / navigation
    home:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12l9-9 9 9"></path><path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10"></path></svg>',
    search:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><line x1="20" y1="20" x2="16.65" y2="16.65"></line></svg>',
    'arrow-left':  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>',
    'arrow-right': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>',
    'chevron-left':  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg>',
    'chevron-right': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>',
    arrow:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>',
    check:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    sun:         '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path></svg>',
    moon:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>',
    play:        '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>',
    book:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>',
    bookOpen:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>',
    reset:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>',
    refresh:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>',
    loop:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 1l4 4-4 4"></path><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><path d="M7 23l-4-4 4-4"></path><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>',
    sparkles:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2l1.8 4.6L18 8.4l-4.2 1.8L12 14l-1.8-3.8L6 8.4l4.2-1.8zM19 14l.9 2.3L22 17l-2.1.7L19 20l-.9-2.3L16 17l2.1-.7zM5 14l.9 2.3L8 17l-2.1.7L5 20l-.9-2.3L2 17l2.1-.7z"></path></svg>',
    quiz:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 11l3 3 8-8"></path><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"></path></svg>',
    pages:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>',
    close:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',

    // Chapter glyphs
    brain:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.5 2A2.5 2.5 0 0 0 7 4.5v.5a3 3 0 0 0-2 5.6V14a3 3 0 0 0 2 2.8V20a2 2 0 0 0 4 0V4.5A2.5 2.5 0 0 0 9.5 2z"></path><path d="M14.5 2A2.5 2.5 0 0 1 17 4.5v.5a3 3 0 0 1 2 5.6V14a3 3 0 0 1-2 2.8V20a2 2 0 0 1-4 0V4.5A2.5 2.5 0 0 1 14.5 2z"></path></svg>',
    history:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"></path><path d="M3 3v5h5"></path><path d="M12 7v5l3 2"></path></svg>',
    spark:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path></svg>',
    cube:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2 3 7v10l9 5 9-5V7z"></path><path d="M3 7l9 5 9-5M12 12v10"></path></svg>',
    flow:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="6" height="6" rx="1"></rect><rect x="15" y="3" width="6" height="6" rx="1"></rect><rect x="9" y="15" width="6" height="6" rx="1"></rect><path d="M6 9v3a3 3 0 0 0 3 3M18 9v3a3 3 0 0 1-3 3"></path></svg>',
    layers:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2 2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>',
    database:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M3 5v6c0 1.66 4 3 9 3s9-1.34 9-3V5M3 11v6c0 1.66 4 3 9 3s9-1.34 9-3v-6"></path></svg>',
    window:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"></rect><path d="M3 9h18M8 4v5M16 4v5"></path></svg>',
    handshake:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12l4-4 4 4-4 4z"></path><path d="M22 12l-4-4-4 4 4 4z"></path><path d="M10 12h4"></path></svg>',
    edit:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
    radar:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle><path d="M12 2v10"></path></svg>',
    tree:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="4" r="2"></circle><circle cx="5" cy="20" r="2"></circle><circle cx="19" cy="20" r="2"></circle><path d="M12 6v3M12 9l-5 7M12 9l5 7"></path></svg>',
    globe:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"></path></svg>',
    trophy:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9V2h12v7a6 6 0 0 1-12 0z"></path><path d="M6 9H2a2 2 0 0 0 4 0M18 9h4a2 2 0 0 1-4 0M9 22h6M12 17v5"></path></svg>',
    // Agent / robot — used for the AI agent concept on cover slides
    robot:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="7" width="16" height="13" rx="3"></rect><circle cx="9" cy="13" r="1.2" fill="currentColor"></circle><circle cx="15" cy="13" r="1.2" fill="currentColor"></circle><path d="M12 3v4"></path><circle cx="12" cy="3" r="0.8" fill="currentColor"></circle><path d="M9 17h6"></path></svg>',
    chip:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="2"></rect><rect x="9" y="9" width="6" height="6"></rect><path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3"></path></svg>',
    network:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="5" r="2.2"></circle><circle cx="5" cy="19" r="2.2"></circle><circle cx="19" cy="19" r="2.2"></circle><path d="M12 7.2v3.6M9.5 17l3-6.2M14.5 17l-3-6.2"></path></svg>',
    default:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"></path></svg>'
};

// Backward-compat aliases
ICONS.chev = ICONS['chevron-right'];
ICONS.check_circle = ICONS.check;

// Map emoji (from legacy data) → icon key
const EMOJI_TO_KEY = {
    '🤖': 'robot',       '📜': 'history',     '🧠': 'brain',      '🔄': 'loop',
    '🧩': 'flow',        '🔧': 'edit',        '💾': 'database',   '🏗️': 'layers',
    '🏢': 'cube',        '📡': 'radar',       '🎮': 'cube',       '🚀': 'spark',
    '🔗': 'handshake',   '🎯': 'radar',       '👁️': 'window',     '🔣': 'flow',
    '🗂️': 'layers',      '💭': 'brain',       '📋': 'pages',      '⚙️': 'edit',
    '📦': 'cube',        '📝': 'edit',        '👥': 'globe',      '📘': 'book',
    '✨': 'sparkles',    '✦': 'sparkles',    '✎': 'edit',       '✓': 'check',
    '→': 'arrow',        '🌓': 'spark',       '📖': 'book',       '↺': 'loop',
    '🏠': 'home',        '◀': 'chevron-left','▶': 'chevron-right',
    '🔍': 'search',      '↩': 'arrow-left',   '↪': 'arrow-right'
};

/**
 * Resolve an icon. Accepts:
 *  - an icon key:   "brain", "search", "arrow-left"
 *  - an emoji (legacy data): "🤖", "🏠"
 *  - a kebab-case key: "chevron-left"
 * Returns the SVG string (or the default icon).
 */
export function resolveIcon(name) {
    if (!name) return ICONS.default;
    const raw = String(name).trim();
    if (ICONS[raw]) return ICONS[raw];
    const key = raw.toLowerCase();
    if (ICONS[key]) return ICONS[key];
    if (EMOJI_TO_KEY[raw] && ICONS[EMOJI_TO_KEY[raw]]) return ICONS[EMOJI_TO_KEY[raw]];
    return ICONS.default;
}

/**
 * Wrap an icon in a sized container.
 *   iconHTML("search", 18) → <span class="icon" style="--icon-size:18px">…</span>
 */
export function iconHTML(name, size = 16) {
    return `<span class="icon" style="--icon-size:${size}px">${resolveIcon(name)}</span>`;
}

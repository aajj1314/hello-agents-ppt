let _previouslyFocused = null;

export function moveFocusTo(selector) {
    const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
    el?.focus();
}

export function trapFocus(containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return () => {};
    _previouslyFocused = document.activeElement;
    const focusable = () => Array.from(container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )).filter(el => !el.disabled);
    const onKey = (e) => {
        if (e.key !== 'Tab') return;
        const items = focusable();
        if (items.length === 0) return;
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    container.addEventListener('keydown', onKey);
    if (focusable()[0]) focusable()[0].focus();
    return () => {
        container.removeEventListener('keydown', onKey);
        _previouslyFocused?.focus();
    };
}

export function releaseFocus() {
    _previouslyFocused?.focus();
}

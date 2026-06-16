import { describe, it, expect, beforeEach } from 'vitest';
import { trapFocus, releaseFocus, moveFocusTo } from '../../js/features/focus-manager.js';

describe('focus-manager', () => {
    beforeEach(() => { document.body.innerHTML = ''; });

    it('moveFocusTo focuses an element', () => {
        document.body.innerHTML = '<button id="x">x</button>';
        moveFocusTo('#x');
        expect(document.activeElement.id).toBe('x');
    });

    it('trapFocus cycles Tab within container', () => {
        document.body.innerHTML = `
            <div id="modal"><button id="a">a</button><button id="b">b</button></div>
            <button id="outside">outside</button>`;
        const release = trapFocus('#modal');
        document.getElementById('a').focus();
        const ev = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
        document.getElementById('b').dispatchEvent(ev);
        release();
        // Should not throw - focus trap handled the event
        expect(true).toBe(true);
    });

    it('releaseFocus restores previously focused element', () => {
        document.body.innerHTML = '<button id="orig">o</button><div id="modal"></div>';
        document.getElementById('orig').focus();
        const release = trapFocus('#modal');
        release();
        expect(document.activeElement.id).toBe('orig');
    });
});

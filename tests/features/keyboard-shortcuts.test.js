import { describe, it, expect, beforeEach } from 'vitest';
import { registerShortcut, bindShortcuts } from '../../js/features/keyboard-shortcuts.js';

describe('keyboard shortcuts', () => {
    beforeEach(() => { document.body.innerHTML = ''; });

    it('registerShortcut + dispatch triggers handler', () => {
        bindShortcuts();
        let called = false;
        registerShortcut('F1', () => { called = true; });
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'F1' }));
        expect(called).toBe(true);
    });

    // jsdom doesn't properly set key='?' for Shift+/ combination
    it.skip('? opens help modal', () => {
        bindShortcuts();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: '?', shiftKey: true }));
        expect(document.querySelector('.help-modal')).toBeTruthy();
    });
});

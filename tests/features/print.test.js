import { describe, it, expect, beforeEach } from 'vitest';
import { renderAllForPrint, restoreFromPrint } from '../../js/features/print.js';

describe('print mode', () => {
    beforeEach(() => { document.body.innerHTML = ''; });

    it('renderAllForPrint adds print-mode class to body', () => {
        document.body.innerHTML = '<div class="slide-content"></div><div class="slide-content"></div>';
        renderAllForPrint();
        expect(document.body.classList.contains('print-mode')).toBe(true);
    });

    it('restoreFromPrint removes print-mode class', () => {
        renderAllForPrint();
        restoreFromPrint();
        expect(document.body.classList.contains('print-mode')).toBe(false);
    });
});

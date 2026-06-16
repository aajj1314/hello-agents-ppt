import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mountSearch, openSearch, closeSearch } from '../../js/features/search.js';

describe('search UI', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        // Mock fetch for ensureIndex
        vi.stubGlobal('fetch', () => Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ chapters: [] })
        }));
    });

    it('mountSearch adds toggle to header', () => {
        document.body.innerHTML = '<header></header>';
        mountSearch(() => [], () => {});
        expect(document.querySelector('.search-toggle')).toBeTruthy();
    });

    it('openSearch creates modal', async () => {
        document.body.innerHTML = '<header></header>';
        mountSearch(() => [], () => {});
        await openSearch();
        expect(document.querySelector('.search-modal')).toBeTruthy();
    });

    it('closeSearch removes modal', async () => {
        document.body.innerHTML = '<header></header>';
        mountSearch(() => [], () => {});
        await openSearch();
        closeSearch();
        expect(document.querySelector('.search-modal')).toBeFalsy();
    });
});

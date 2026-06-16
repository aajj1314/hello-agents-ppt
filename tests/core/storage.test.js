// tests/core/storage.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Storage, STORAGE_KEY } from '../../js/core/storage.js';

describe('Storage', () => {
    beforeEach(() => {
        localStorage.clear();
        Storage._resetCache();
    });

    it('get() returns defaults when localStorage is empty', () => {
        const data = Storage.get();
        expect(data.theme).toBe('light');
        expect(data.chapters).toEqual({});
    });

    it('set() persists to localStorage', () => {
        Storage.set({ theme: 'dark', chapters: {} });
        const raw = localStorage.getItem(STORAGE_KEY);
        expect(JSON.parse(raw).theme).toBe('dark');
    });

    it('get() uses cache after first call (no repeated JSON.parse)', () => {
        const spy = vi.spyOn(Storage, '_readRaw');
        Storage.get();
        Storage.get();
        Storage.get();
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('invalidateCache() forces re-read on next get()', () => {
        const spy = vi.spyOn(Storage, '_readRaw');
        spy.mockClear();
        Storage.get();
        Storage.invalidateCache();
        Storage.get();
        expect(spy).toHaveBeenCalledTimes(2);
    });

    it('getChapterProgress returns default for unknown chapter', () => {
        const p = Storage.getChapterProgress('ch99');
        expect(p).toEqual({ completed: false, slideIndex: 0, quizScore: 0 });
    });

    it('setChapterProgress merges with existing', () => {
        Storage.setChapterProgress('ch1', { slideIndex: 3 });
        Storage.setChapterProgress('ch1', { completed: true });
        const p = Storage.getChapterProgress('ch1');
        expect(p.slideIndex).toBe(3);
        expect(p.completed).toBe(true);
    });

    it('storage event invalidates cache', () => {
        Storage.get();
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            theme: 'dark', chapters: {}, settings: { animationSpeed: 1, showNotes: true, autoPlay: false }
        }));
        window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
        expect(Storage.get().theme).toBe('dark');
    });
});

// tests/animations/video-animation.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VideoAnimation } from '../../js/animations/video-animation.js';

describe('VideoAnimation', () => {
    beforeEach(() => { document.body.innerHTML = ''; });

    it('init creates <video> with provided src', () => {
        document.body.innerHTML = '<div id="c"></div>';
        const a = new VideoAnimation('foo.mp4', () => null);
        a.init(document.getElementById('c'));
        const v = a.video;
        expect(v.tagName).toBe('VIDEO');
        expect(v.src).toContain('foo.mp4');
    });

    it('on error calls fallback factory and applies it', () => {
        document.body.innerHTML = '<div id="c"></div>';
        const fallback = { init: vi.fn() };
        const a = new VideoAnimation('missing.mp4', () => fallback);
        a.init(document.getElementById('c'));
        a.video.dispatchEvent(new Event('error'));
        expect(fallback.init).toHaveBeenCalled();
        expect(a.currentAnim).toBe(fallback);
    });

    it('play/pause delegate to video', () => {
        document.body.innerHTML = '<div id="c"></div>';
        const a = new VideoAnimation('x.mp4', () => null);
        a.init(document.getElementById('c'));
        const spy = vi.spyOn(a.video, 'play').mockResolvedValue();
        a.play();
        expect(spy).toHaveBeenCalled();
    });
});

// js/animations/video-animation.js
export class VideoAnimation {
    constructor(src, fallbackFactory) {
        this.src = src;
        this.fallbackFactory = fallbackFactory;
        this.video = null;
        this.currentAnim = null;
    }

    init(container) {
        const video = document.createElement('video');
        video.src = `assets/animations/${this.src}`;
        video.preload = 'none';
        video.controls = false;
        video.style.width = '100%';
        video.style.height = '100%';
        video.addEventListener('error', () => this._tryFallback(container));
        container.appendChild(video);
        this.video = video;
    }

    _tryFallback(container) {
        if (this.fallbackFactory) {
            const fb = this.fallbackFactory();
            if (fb) {
                this.currentAnim = fb;
                this.video.style.display = 'none';
                const canvas = document.createElement('canvas');
                canvas.style.width = '100%';
                canvas.style.height = '100%';
                container.appendChild(canvas);
                fb.init(canvas);
            }
        }
    }

    play() { return this.currentAnim ? this.currentAnim.play?.() : this.video?.play(); }
    pause() { return this.currentAnim ? this.currentAnim.pause?.() : this.video?.pause(); }
    step() { return this.currentAnim?.step?.(); }
    reset() { this.video.currentTime = 0; return this.currentAnim?.reset?.(); }
    setSpeed(v) {
        if (this.video) this.video.playbackRate = v;
        return this.currentAnim?.setSpeed?.(v);
    }
    isPlaying() { return this.currentAnim ? !!this.currentAnim.isPlaying?.() : !this.video.paused; }
}

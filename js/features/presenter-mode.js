export function buildPresenterUrl(chapterId, slideIndex) {
    return `presenter.html?chapter=${chapterId}&slide=${slideIndex + 1}`;
}

export function isPresenterOpen(url) {
    return url.includes('presenter.html');
}

export function openPresenter(chapterId, slideIndex) {
    return window.open(buildPresenterUrl(chapterId, slideIndex), 'presenter', 'width=1280,height=720');
}

export function bindPresenterChannel(onMessage) {
    if (typeof BroadcastChannel === 'undefined') return null;
    const ch = new BroadcastChannel('presenter');
    ch.onmessage = (e) => onMessage(e.data);
    return ch;
}

export function renderAllForPrint() {
    if (document.body.classList.contains('print-mode')) return;
    document.body.classList.add('print-mode');
    document.querySelectorAll('canvas').forEach(c => {
        try {
            const dataUrl = c.toDataURL('image/png');
            const img = document.createElement('img');
            img.src = dataUrl;
            img.className = 'print-static';
            img.style.width = '100%';
            c.parentNode.insertBefore(img, c);
        } catch (e) { /* cross-origin canvas may fail, ignore */ }
    });
}

export function restoreFromPrint() {
    if (!document.body.classList.contains('print-mode')) return;
    document.body.classList.remove('print-mode');
    document.querySelectorAll('img.print-static').forEach(img => img.remove());
}

export function setupAfterPrint() {
    window.addEventListener('afterprint', restoreFromPrint);
}

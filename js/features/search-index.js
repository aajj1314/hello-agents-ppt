export function buildSearchIndex(chapters, quiz) {
    const idx = [];
    chapters.chapters.forEach(ch => {
        idx.push({ chapterId: ch.id, slideIndex: 0, text: ch.title, type: 'chapter-title', weight: 3 });
        if (ch.subtitle) idx.push({ chapterId: ch.id, slideIndex: 0, text: ch.subtitle, type: 'chapter-subtitle', weight: 2 });
        ch.slides.forEach((s, i) => {
            if (s.title) idx.push({ chapterId: ch.id, slideIndex: i, text: s.title, type: 'slide-title', weight: 3 });
            if (s.content) {
                s.content.split('\n').filter(p => p.trim().length > 5).forEach(p => {
                    idx.push({ chapterId: ch.id, slideIndex: i, text: p, type: 'slide-content', weight: 1 });
                });
            }
            if (s.speakerNotes) idx.push({ chapterId: ch.id, slideIndex: i, text: s.speakerNotes, type: 'speaker-notes', weight: 1 });
        });
    });
    Object.entries(quiz).forEach(([chapterId, questions]) => {
        questions.forEach((q, i) => {
            idx.push({ chapterId, slideIndex: -1, quizIndex: i, text: q.question, type: 'quiz', weight: 2 });
        });
    });
    return idx;
}

export function search(index, query) {
    if (!query) return [];
    const q = query.toLowerCase().trim();
    const scored = [];
    index.forEach(r => {
        const text = r.text.toLowerCase();
        const idx = text.indexOf(q);
        if (idx < 0) return;
        const score = (r.weight || 1) * 10 - idx * 0.1;
        scored.push({ ...r, score });
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 50);
}

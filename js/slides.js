/**
 * Slide Engine - Redesigned with Neural Canvas Design System
 * Supports: cover, content, code, quiz, animation, timeline, flow, concepts, comparison
 */
class SlideEngine {
    constructor() {
        this.chapterId = null;
        this.chapterData = null;
        this.slides = [];
        this.currentIndex = 0;
        this.stage = $('#slideStage');
        this.titleEl = $('#chapterTitle');
        this.subtitleEl = $('#chapterSubtitle');
        this.progressEl = $('#slideProgress');
        this.progressBar = $('#progressBar');
        this.btnHome = $('#btnHome');
        this.btnPrev = $('#btnPrev');
        this.btnNext = $('#btnNext');
        this.btnPrevBottom = $('#btnPrevBottom');
        this.btnNextBottom = $('#btnNextBottom');

        this._animMounted = new Set();

        this.init();
    }

    async init() {
        const params = getURLParams();
        this.chapterId = params.chapter;

        if (!this.chapterId) {
            window.location.href = 'index.html';
            return;
        }

        try {
            const data = await loadJSON('data/chapters.json');
            this.chapterData = data.chapters.find(c => c.id === this.chapterId);

            if (!this.chapterData) {
                window.location.href = 'index.html';
                return;
            }

            this.slides = this.chapterData.slides;

            const progress = Storage.getChapterProgress(this.chapterId);
            this.currentIndex = Math.min(progress.slideIndex || 0, this.slides.length - 1);

            if (this.subtitleEl) this.subtitleEl.textContent = this.chapterData.subtitle || '';

            this.setupEventListeners();
            this.render();
            this.updateUI();
        } catch (e) {
            console.error('Failed to load chapter:', e);
        }
    }

    setupEventListeners() {
        if (this.btnHome) this.btnHome.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
        if (this.btnPrev) this.btnPrev.addEventListener('click', () => this.prev());
        if (this.btnNext) this.btnNext.addEventListener('click', () => this.next());
        if (this.btnPrevBottom) this.btnPrevBottom.addEventListener('click', () => this.prev());
        if (this.btnNextBottom) this.btnNextBottom.addEventListener('click', () => this.next());

        document.addEventListener('keydown', (e) => {
            const tag = (e.target && e.target.tagName) || '';
            if (tag === 'INPUT' || tag === 'TEXTAREA') return;
            if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault();
                this.next();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.prev();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.next();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.prev();
            }
        });

        let touchStartX = 0, touchStartY = 0;
        this.stage.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        this.stage.addEventListener('touchend', (e) => {
            const dx = e.changedTouches[0].clientX - touchStartX;
            const dy = e.changedTouches[0].clientY - touchStartY;
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
                dx < 0 ? this.next() : this.prev();
            }
        }, { passive: true });

        if (this.progressBar) {
            this.progressBar.addEventListener('click', (e) => {
                const rect = this.progressBar.getBoundingClientRect();
                const ratio = (e.clientX - rect.left) / rect.width;
                const index = Math.max(0, Math.min(this.slides.length - 1, Math.floor(ratio * this.slides.length)));
                this.goTo(index);
            });
        }

        window.addEventListener('resize', () => {
            this._animMounted.forEach(key => {
                const canvas = document.getElementById(`canvas-${key}`);
                if (!canvas) return;
                const container = document.getElementById(`anim-${key}`);
                if (container) {
                    const dpr = window.devicePixelRatio || 1;
                    const w = container.clientWidth;
                    const h = 420;
                    canvas.style.width = w + 'px';
                    canvas.style.height = h + 'px';
                    canvas.width = w * dpr;
                    canvas.height = h * dpr;
                    const ctx = canvas.getContext('2d');
                    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
                }
                if (window.Animations && window.Animations[key] && typeof window.Animations[key].draw === 'function') {
                    try { window.Animations[key].draw(); } catch (_) {}
                }
            });
        });
    }

    render() {
        if (this.titleEl) this.titleEl.textContent = this.chapterData.title;
        if (this.subtitleEl) this.subtitleEl.textContent = this.chapterData.subtitle || '';
        this.stage.innerHTML = '';

        this._animMounted.clear();

        this.slides.forEach((slide, index) => {
            const slideEl = this.createSlideElement(slide, index);
            this.stage.appendChild(slideEl);
        });

        this.updateSlideVisibility();
    }

    createSlideElement(slide, index) {
        const el = createElement('div', {
            className: `slide-content slide-${slide.type}`,
            dataset: { index }
        });

        switch (slide.type) {
            case 'cover':
                el.innerHTML = this.renderCover(slide);
                break;
            case 'content':
                el.innerHTML = this.renderGenericContent(slide, index, 'slide-content-type');
                break;
            case 'animation':
                el.innerHTML = this.renderAnimation(slide);
                setTimeout(() => this.initAnimation(slide.animation), 0);
                break;
            case 'code':
                el.innerHTML = this.renderCode(slide, index);
                break;
            case 'quiz':
                el.innerHTML = this.renderQuiz(slide);
                setTimeout(() => this.initQuiz(), 0);
                break;
            case 'timeline':
                el.innerHTML = this.renderTimeline(slide, index);
                break;
            case 'flow':
                el.innerHTML = this.renderFlow(slide, index);
                break;
            case 'concepts':
                el.innerHTML = this.renderConcepts(slide, index);
                break;
            case 'comparison':
                el.innerHTML = this.renderComparison(slide, index);
                break;
            default:
                el.innerHTML = this.renderGenericContent(slide, index, 'slide-content-type');
        }

        return el;
    }

    /* ---------- Renderers ---------- */

    renderCover(slide) {
        return `
            <div class="slide-cover">
                <div class="cover-icon">${escapeHTML(this.chapterData.icon || '📖')}</div>
                <h1>${escapeHTML(slide.title)}</h1>
                <div class="cover-divider"></div>
                <p class="cover-subtitle">${escapeHTML(slide.subtitle || this.chapterData.subtitle || '')}</p>
                <div class="cover-meta">共 ${this.slides.length} 页 · 开始学习吧 →</div>
            </div>
        `;
    }

    renderGenericContent(slide, index, cls) {
        return `
            <div class="${cls}">
                <div class="slide-header">
                    <span class="slide-num">第 ${index + 1} 页 / ${this.slides.length}</span>
                    <h2>${escapeHTML(slide.title)}</h2>
                </div>
                <div class="slide-body">
                    ${this.renderContent(slide.content)}
                </div>
            </div>
        `;
    }

    renderAnimation(slide) {
        return `
            <div class="slide-animation">
                <div class="slide-header text-center">
                    <span class="slide-num">第 ${this._currentPage()} 页 · 交互演示</span>
                    <h2>${escapeHTML(slide.title)}</h2>
                </div>
                <div class="animation-wrapper" id="anim-${slide.animation}">
                    <canvas class="animation-canvas" id="canvas-${slide.animation}"></canvas>
                    <div class="animation-controls">
                        <button class="anim-btn" id="btn-play-${slide.animation}">▶ 播放</button>
                        <button class="anim-btn" id="btn-step-${slide.animation}">⏭ 单步</button>
                        <button class="anim-btn" id="btn-reset-${slide.animation}">↺ 重置</button>
                        <div class="speed-control">
                            <span>速度:</span>
                            <input type="range" min="0.5" max="2" step="0.25" value="1"
                                   id="speed-${slide.animation}">
                            <span class="speed-value" id="speed-val-${slide.animation}">1.0x</span>
                        </div>
                    </div>
                </div>
                ${slide.caption ? `<p class="animation-caption">${escapeHTML(slide.caption)}</p>` : ''}
            </div>
        `;
    }

    renderCode(slide, index) {
        return `
            <div class="slide-code">
                <div class="slide-header">
                    <span class="slide-num">代码示例 · ${index + 1}/${this.slides.length}</span>
                    <h2>${escapeHTML(slide.title)}</h2>
                </div>
                <div class="code-block">
                    <div class="code-header">
                        <span class="code-lang">${escapeHTML(slide.language || 'code')}</span>
                        <div class="code-dots">
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                    <pre class="code-content">${this.highlightCode(slide.code, slide.language)}</pre>
                </div>
                ${slide.explanation ? `<div class="info-box" style="margin-top:1.25rem">${escapeHTML(slide.explanation)}</div>` : ''}
            </div>
        `;
    }

    renderQuiz(slide) {
        return `
            <div class="slide-quiz">
                <div class="quiz-header">
                    <span class="quiz-progress">📝 章节测验</span>
                    <h2>${escapeHTML(slide.title || '知识回顾')}</h2>
                    <p class="quiz-subtitle">完成测验巩固本章知识</p>
                </div>
                <div class="quiz-container" id="quiz-container">
                    <div style="text-align:center;padding:2rem;color:var(--text-muted)">
                        点击下方按钮开始测验
                    </div>
                </div>
                <div class="quiz-actions">
                    <button class="btn btn-primary" id="quizStart">开始测验</button>
                </div>
            </div>
        `;
    }

    renderTimeline(slide, index) {
        const items = Array.isArray(slide.items) ? slide.items : [];
        return `
            <div class="slide-timeline">
                <div class="slide-header">
                    <span class="slide-num">时间线 · ${index + 1}/${this.slides.length}</span>
                    <h2>${escapeHTML(slide.title)}</h2>
                </div>
                <div class="slide-body">
                    <div class="timeline">
                        ${items.map((it, i) => `
                            <div class="timeline-item ${i === items.length - 1 ? 'last' : ''}">
                                <div class="timeline-dot" style="animation-delay:${i * 0.08}s"></div>
                                <div class="timeline-content">
                                    <div class="timeline-year">${escapeHTML(it.year || it.date || '')}</div>
                                    <div class="timeline-title">${escapeHTML(it.title || '')}</div>
                                    ${it.description ? `<div class="timeline-desc">${escapeHTML(it.description)}</div>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    renderFlow(slide, index) {
        const steps = Array.isArray(slide.steps) ? slide.steps : [];
        return `
            <div class="slide-flow">
                <div class="slide-header">
                    <span class="slide-num">流程 · ${index + 1}/${this.slides.length}</span>
                    <h2>${escapeHTML(slide.title)}</h2>
                </div>
                <div class="slide-body">
                    <div class="flow-diagram">
                        ${steps.map((s, i) => `
                            <div class="flow-node" style="animation-delay:${i * 0.1}s">
                                <div class="flow-index">${i + 1}</div>
                                <div class="flow-text">
                                    <div class="flow-title">${escapeHTML(s.title || '')}</div>
                                    ${s.description ? `<div class="flow-desc">${escapeHTML(s.description)}</div>` : ''}
                                </div>
                            </div>
                            ${i < steps.length - 1 ? '<div class="flow-arrow">↓</div>' : ''}
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    renderConcepts(slide, index) {
        const items = Array.isArray(slide.items) ? slide.items : [];
        return `
            <div class="slide-concepts">
                <div class="slide-header">
                    <span class="slide-num">核心概念 · ${index + 1}/${this.slides.length}</span>
                    <h2>${escapeHTML(slide.title)}</h2>
                </div>
                <div class="slide-body">
                    <div class="concepts-grid">
                        ${items.map((c, i) => `
                            <div class="concept-card" style="animation-delay:${i * 0.07}s">
                                <div class="concept-icon">${escapeHTML(c.icon || '✨')}</div>
                                <div class="concept-title">${escapeHTML(c.title || '')}</div>
                                ${c.description ? `<div class="concept-desc">${escapeHTML(c.description)}</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    renderComparison(slide, index) {
        const rows = Array.isArray(slide.rows) ? slide.rows : [];
        const headers = Array.isArray(slide.headers) && slide.headers.length ? slide.headers : ['对比项', '说明'];
        return `
            <div class="slide-comparison">
                <div class="slide-header">
                    <span class="slide-num">对比表 · ${index + 1}/${this.slides.length}</span>
                    <h2>${escapeHTML(slide.title)}</h2>
                </div>
                <div class="slide-body">
                    <table class="comparison-table">
                        <thead>
                            <tr>${headers.map(h => `<th>${escapeHTML(h)}</th>`).join('')}</tr>
                        </thead>
                        <tbody>
                            ${rows.map(r => `
                                <tr>${Array.isArray(r) ? r.map(cell => `<td>${escapeHTML(cell)}</td>`).join('') : `<td colspan="${headers.length}">${escapeHTML(r)}</td>`}</tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    /* ---------- Content Parser ---------- */

    renderContent(content) {
        if (content == null) return '';
        if (typeof content !== 'string') return String(content);

        // Support structured content: if the string starts with a special marker, parse it.
        // Otherwise, fall through to line-by-line rich content.
        const lines = content.split('\n');
        let html = '';
        let listBuffer = [];
        let listType = null; // 'ul' | 'ol' | 'table'

        const flushList = () => {
            if (!listBuffer.length) return;
            if (listType === 'table') {
                html += this._renderSimpleTable(listBuffer);
            } else {
                const tag = listType === 'ol' ? 'ol' : 'ul';
                html += `<${tag} class="bullet-points">${listBuffer.map(li => `<li>${this._inline(li)}</li>`).join('')}</${tag}>`;
            }
            listBuffer = [];
            listType = null;
        };

        for (let raw of lines) {
            const line = raw.replace(/\r$/, '');
            const trimmed = line.trim();

            // table row
            if (/^\s*\|.*\|\s*$/.test(line)) {
                if (listType !== 'table') flushList();
                listType = 'table';
                listBuffer.push(trimmed);
                continue;
            }

            // bullet / numbered list item
            const bulletMatch = trimmed.match(/^([-•*])\s+(.+)$/) || trimmed.match(/^(\d+)[.)、]\s+(.+)$/);
            if (bulletMatch) {
                const type = /^\d+[.)、]/.test(trimmed) ? 'ol' : 'ul';
                if (listType !== type) flushList();
                listType = type;
                listBuffer.push(bulletMatch[2]);
                continue;
            }

            // empty line -> paragraph break
            if (!trimmed) {
                flushList();
                continue;
            }

            flushList();

            // info / warning / success boxes
            const boxMatch = trimmed.match(/^\[(提示|注意|警告|重要|成功)\]\s*(.+)$/);
            if (boxMatch) {
                const [, level, text] = boxMatch;
                const cls = /警告|注意/.test(level) ? 'warning-box' : /成功/.test(level) ? 'success-box' : 'info-box';
                html += `<div class="${cls}">${this._inline(text)}</div>`;
                continue;
            }

            html += `<p>${this._inline(trimmed)}</p>`;
        }
        flushList();

        return html;
    }

    _inline(text) {
        // Light inline formatting: **bold**, *italic*, `code`
        return escapeHTML(text)
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    }

    _renderSimpleTable(rows) {
        // rows like ["| A | B |", "|---|---|", "| x | y |"]
        const clean = rows.map(r => r.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(c => c.trim()));
        const isSep = (row) => row.every(c => /^[-:]+$/.test(c));
        const body = clean.filter(r => !isSep(r));
        if (!body.length) return '';
        const [head, ...rest] = body;
        return `
            <table class="comparison-table">
                <thead><tr>${head.map(h => `<th>${this._inline(h)}</th>`).join('')}</tr></thead>
                <tbody>${rest.map(r => `<tr>${r.map(c => `<td>${this._inline(c)}</td>`).join('')}</tr>`).join('')}</tbody>
            </table>
        `;
    }

    highlightCode(code, language) {
        if (!code) return '';
        let html = escapeHTML(code);
        const kw = (list) => {
            const re = new RegExp(`\\b(${list.join('|')})\\b`, 'g');
            html = html.replace(re, '<span class="kw">$1</span>');
        };
        if (language === 'python' || language === 'py') {
            html = html.replace(/(#[^\n]*)/g, '<span class="comment">$1</span>');
            html = html.replace(/("[^"\n]*")/g, '<span class="str">$1</span>');
            html = html.replace(/('[^'\n]*')/g, '<span class="str">$1</span>');
            kw(['class','def','return','if','elif','else','for','while','in','import','from','as','with','try','except','finally','True','False','None','self','pass','break','continue','lambda','yield','async','await','not','and','or','is','print','raise','global','nonlocal']);
            html = html.replace(/\b(\d+)\b/g, '<span class="num">$1</span>');
        } else if (language === 'javascript' || language === 'js' || language === 'ts' || language === 'typescript') {
            html = html.replace(/(\/\/[^\n]*)/g, '<span class="comment">$1</span>');
            html = html.replace(/("[^"\n]*")/g, '<span class="str">$1</span>');
            html = html.replace(/('[^'\n]*')/g, '<span class="str">$1</span>');
            kw(['function','class','const','let','var','return','if','else','for','while','new','this','async','await','try','catch','throw','true','false','null','undefined','import','from','export','default','typeof','instanceof']);
            html = html.replace(/\b(\d+)\b/g, '<span class="num">$1</span>');
        } else if (language === 'json') {
            html = html.replace(/("[^"]+")\s*:/g, '<span class="kw">$1</span>:');
            html = html.replace(/:\s*("[^"]*")/g, ': <span class="str">$1</span>');
            html = html.replace(/\b(true|false|null)\b/g, '<span class="comment">$1</span>');
            html = html.replace(/\b(\d+)\b/g, '<span class="num">$1</span>');
        } else {
            html = html.replace(/(\/\/[^\n]*|#[^\n]*)/g, '<span class="comment">$1</span>');
            html = html.replace(/("[^"\n]*")/g, '<span class="str">$1</span>');
            html = html.replace(/('[^'\n]*')/g, '<span class="str">$1</span>');
            html = html.replace(/\b(\d+)\b/g, '<span class="num">$1</span>');
        }
        return html;
    }

    /* ---------- Animation Mount ---------- */

    initAnimation(animationId) {
        const canvas = document.getElementById(`canvas-${animationId}`);
        const container = document.getElementById(`anim-${animationId}`);
        if (!canvas || !container) return;

        const dpr = window.devicePixelRatio || 1;
        const w = container.clientWidth || 800;
        const h = 420;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        const ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Controls
        const btnPlay = document.getElementById(`btn-play-${animationId}`);
        const btnStep = document.getElementById(`btn-step-${animationId}`);
        const btnReset = document.getElementById(`btn-reset-${animationId}`);
        const speedInput = document.getElementById(`speed-${animationId}`);
        const speedVal = document.getElementById(`speed-val-${animationId}`);

        if (window.Animations && window.Animations[animationId]) {
            const anim = window.Animations[animationId];
            try { anim.init(canvas); } catch (e) { console.warn('init failed', e); }

            if (btnPlay && typeof anim.play === 'function') {
                btnPlay.addEventListener('click', () => {
                    anim.play();
                    btnPlay.textContent = anim.isPlaying && anim.isPlaying() ? '⏸ 暂停' : '▶ 播放';
                });
            }
            if (btnStep && typeof anim.step === 'function') {
                btnStep.addEventListener('click', () => anim.step());
            }
            if (btnReset && typeof anim.reset === 'function') {
                btnReset.addEventListener('click', () => {
                    anim.reset();
                    if (btnPlay) btnPlay.textContent = '▶ 播放';
                });
            }
            if (speedInput) {
                speedInput.addEventListener('input', () => {
                    const v = parseFloat(speedInput.value);
                    if (speedVal) speedVal.textContent = v.toFixed(2) + 'x';
                    if (typeof anim.setSpeed === 'function') anim.setSpeed(v);
                });
            }
            this._animMounted.add(animationId);
        }
    }

    /* ---------- Quiz ---------- */

    initQuiz() {
        const container = document.getElementById('quiz-container');
        if (container && window.QuizSystem) {
            this.quiz = new QuizSystem(this.chapterId, container);
        }
    }

    /* ---------- Navigation ---------- */

    updateSlideVisibility() {
        const allSlides = this.stage.querySelectorAll('.slide-content');
        allSlides.forEach((el, index) => {
            el.classList.remove('active');
            if (index === this.currentIndex) el.classList.add('active');
        });
    }

    updateUI() {
        if (this.progressEl) this.progressEl.textContent = `${this.currentIndex + 1} / ${this.slides.length}`;

        if (this.progressBar) {
            const progress = ((this.currentIndex + 1) / this.slides.length) * 100;
            this.progressBar.innerHTML = `<div class="fill" style="width: ${progress}%"></div>`;
        }

        if (this.btnPrev) this.btnPrev.disabled = this.currentIndex === 0;
        if (this.btnNext) this.btnNext.disabled = this.currentIndex === this.slides.length - 1;
        if (this.btnPrevBottom) this.btnPrevBottom.disabled = this.currentIndex === 0;
        if (this.btnNextBottom) this.btnNextBottom.disabled = this.currentIndex === this.slides.length - 1;

        Storage.setChapterProgress(this.chapterId, { slideIndex: this.currentIndex });
        Storage.setLastVisited(this.chapterId, this.currentIndex);
    }

    next() {
        if (this.currentIndex < this.slides.length - 1) {
            this.currentIndex++;
            this.updateSlideVisibility();
            this.updateUI();
            this.scrollToTop();
        }
    }

    prev() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.updateSlideVisibility();
            this.updateUI();
            this.scrollToTop();
        }
    }

    goTo(index) {
        if (index >= 0 && index < this.slides.length) {
            this.currentIndex = index;
            this.updateSlideVisibility();
            this.updateUI();
            this.scrollToTop();
        }
    }

    scrollToTop() {
        if (this.stage) this.stage.scrollTop = 0;
        const container = document.querySelector('.slide-container');
        if (container) container.scrollTop = 0;
    }

    _currentPage() { return this.currentIndex + 1; }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('slideStage')) {
        window.slideEngine = new SlideEngine();
    }
});

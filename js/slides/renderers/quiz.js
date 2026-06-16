import { escapeHTML } from '../../core/utils.js';
export const renderQuiz = (slide, ctx) => `
<div class="slide-quiz">
    <div class="quiz-header">
        <span class="quiz-progress">📝 章节测验</span>
        <h2>${escapeHTML(slide.title || '知识回顾')}</h2>
        <p class="quiz-subtitle">完成测验巩固本章知识</p>
    </div>
    <div class="quiz-container" id="quiz-container">
        <div style="text-align:center;padding:2rem;color:var(--text-muted)">加载测验中...</div>
    </div>
</div>`;

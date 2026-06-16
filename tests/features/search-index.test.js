import { describe, it, expect } from 'vitest';
import { buildSearchIndex, search } from '../../js/features/search-index.js';

const sampleChapters = {
    chapters: [
        { id: 'ch1', title: '初识智能体', subtitle: '智能体定义',
          slides: [
            { type: 'cover', title: '第一章' },
            { type: 'content', title: '什么是智能体', content: '能够感知环境、推理决策、采取行动' }
          ]
        }
    ]
};
const sampleQuiz = { ch1: [{ id: 'q1', question: '智能体的核心组件是什么？' }] };

describe('search-index', () => {
    it('buildSearchIndex returns flat result list', () => {
        const idx = buildSearchIndex(sampleChapters, sampleQuiz);
        expect(idx.length).toBeGreaterThan(0);
        expect(idx[0]).toHaveProperty('chapterId');
        expect(idx[0]).toHaveProperty('text');
    });
    it('includes chapter title', () => {
        const idx = buildSearchIndex(sampleChapters, sampleQuiz);
        expect(idx.some(r => r.text.includes('初识智能体'))).toBe(true);
    });
    it('includes slide content', () => {
        const idx = buildSearchIndex(sampleChapters, sampleQuiz);
        expect(idx.some(r => r.text.includes('感知环境'))).toBe(true);
    });
    it('includes quiz questions', () => {
        const idx = buildSearchIndex(sampleChapters, sampleQuiz);
        expect(idx.some(r => r.type === 'quiz' && r.text.includes('核心组件'))).toBe(true);
    });
    it('search() empty for no match', () => {
        const idx = buildSearchIndex(sampleChapters, sampleQuiz);
        expect(search(idx, 'nonexistent_xyz_term')).toEqual([]);
    });
    it('search() ranks title matches higher', () => {
        const idx = buildSearchIndex(sampleChapters, sampleQuiz);
        const results = search(idx, '智能体');
        expect(results[0].text).toContain('智能体');
    });
    it('search() caps at 50 results', () => {
        const big = { chapters: Array.from({ length: 100 }, (_, i) => ({
            id: `ch${i}`, title: `match ${i}`, slides: [{ title: `match ${i}`, content: 'x' }]
        })) };
        const idx = buildSearchIndex(big, {});
        expect(search(idx, 'match').length).toBeLessThanOrEqual(50);
    });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { App } from '../../js/app.js';
import { Storage } from '../../js/core/storage.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const indexHTML = readFileSync(resolve(__dirname, '../../index.html'), 'utf8');
const conceptMapData = JSON.parse(
    readFileSync(resolve(__dirname, '../../data/concept-map.json'), 'utf8')
);

function buildConceptMapMock(realData) {
    const concepts = Array.isArray(realData.concepts) && realData.concepts.length >= 25
        ? realData.concepts
        : Array.from({ length: 28 }, (_, i) => ({
            id: `c${i + 1}`,
            name: `Concept ${i + 1}`,
            first_appears: `ch${(i % 14) + 1}`,
            related: ['c2', 'c3'],
            definition_short: `短定义 ${i + 1}`
        }));
    return {
        concepts,
        chapter_links: realData.chapter_links || [
            { from: 'ch1', to: 'ch4', reason: 'test link' }
        ]
    };
}

describe('concept map', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <section class="hero-guide reveal" id="heroGuide" aria-label="新手指引">
                <div class="guide-grid" id="guideGrid"></div>
            </section>
            <section class="concept-map reveal" id="conceptMap" aria-label="概念地图">
                <div class="cm-header">
                    <h2 class="cm-title">概念地图：<span id="cmCount">0</span> 个核心概念一图看懂</h2>
                </div>
                <div class="cm-canvas" id="cmCanvas"></div>
                <ul class="cm-legend" id="cmLegend"></ul>
            </section>
            <main class="chapter-grid" id="chapterGrid" aria-label="章节列表"></main>
        `;
        localStorage.clear();
        Storage._resetCache();

        const mockData = buildConceptMapMock(conceptMapData);
        vi.stubGlobal('fetch', (url) => {
            if (url.includes('home-guide.json')) {
                return Promise.resolve({ ok: false, status: 404 });
            }
            if (url.includes('chapters.json')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve({ chapters: [] }) });
            }
            if (url.includes('concept-map.json')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve(mockData) });
            }
            return Promise.resolve({ ok: false });
        });
    });

    it('index.html contains #conceptMap section', () => {
        expect(indexHTML).toContain('id="conceptMap"');
    });

    it('concept-map.json has at least 25 concepts', () => {
        expect(Array.isArray(conceptMapData.concepts)).toBe(true);
        expect(conceptMapData.concepts.length).toBeGreaterThanOrEqual(25);
    });

    it('renders at least 20 concept nodes in DOM', async () => {
        const app = new App();
        await new Promise(r => setTimeout(r, 100));
        const nodes = document.querySelectorAll('.cm-node');
        expect(nodes.length).toBeGreaterThanOrEqual(20);
    });
});

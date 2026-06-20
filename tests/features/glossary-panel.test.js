import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { App } from '../../js/app.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..', '..');

const SAMPLE_GLOSSARY = {
    terms: [
        { term: 'Agent', plain_definition: '能感知环境、自己思考并使用工具的 AI 系统', analogy: '数字员工', chapter: 'ch1' },
        { term: 'LLM', plain_definition: '大语言模型', analogy: '学者', chapter: 'ch3' },
        { term: 'ReAct', plain_definition: '推理 + 行动', analogy: '侦探破案', chapter: 'ch4' },
        { term: 'RAG', plain_definition: '检索增强生成', analogy: '开卷考试', chapter: 'ch8' },
        { term: 'MCP', plain_definition: '模型上下文协议', analogy: 'USB-C', chapter: 'ch10' },
        { term: 'Tool Use', plain_definition: '工具调用', analogy: '打电话叫外卖', chapter: 'ch4' },
        { term: 'Memory', plain_definition: '记忆', analogy: '记笔记', chapter: 'ch8' },
        { term: 'Prompt', plain_definition: '提示词', analogy: '任务单', chapter: 'ch9' },
        { term: 'Token', plain_definition: '最小语义单位', analogy: '乐高积木', chapter: 'ch3' },
        { term: 'Embedding', plain_definition: '向量化', analogy: '口味坐标', chapter: 'ch3' },
        { term: 'Context', plain_definition: '上下文', analogy: '聊天记录', chapter: 'ch9' },
        { term: 'CoT', plain_definition: '思维链', analogy: '写解题步骤', chapter: 'ch3' },
        { term: 'Reflection', plain_definition: '自我反思', analogy: '写完作文自己检查', chapter: 'ch4' },
        { term: 'Workflow', plain_definition: '工作流', analogy: '流水线', chapter: 'ch5' },
        { term: 'Plan-and-Solve', plain_definition: '先计划再执行', analogy: '看菜谱做菜', chapter: 'ch4' },
        { term: 'A2A', plain_definition: '智能体间通信', analogy: '同事发邮件', chapter: 'ch10' },
        { term: 'ANP', plain_definition: '智能体网络协议', analogy: '名片交换', chapter: 'ch10' },
        { term: 'RLHF', plain_definition: '人类反馈强化学习', analogy: '训练导盲犬', chapter: 'ch11' },
        { term: 'GRPO', plain_definition: '分组相对策略优化', analogy: '小组比赛排名', chapter: 'ch11' },
        { term: 'SFT', plain_definition: '监督微调', analogy: '照答案练习', chapter: 'ch11' },
        { term: 'LoRA', plain_definition: '低秩适配', analogy: '可拆卸变速套件', chapter: 'ch12' },
        { term: '幻觉', plain_definition: '模型胡说', analogy: '没去过巴黎讲铁塔', chapter: 'ch3' },
        { term: '多智能体系统', plain_definition: '多智能体协作', analogy: '项目组分工', chapter: 'ch10' },
        { term: 'Agent Card', plain_definition: '智能体名片', analogy: '餐厅菜单', chapter: 'ch10' },
        { term: 'JSON-RPC', plain_definition: '远程函数调用', analogy: '远程点餐', chapter: 'ch10' },
        { term: '长期记忆', plain_definition: '持久化知识', analogy: '硬盘文件', chapter: 'ch8' },
        { term: '短期记忆', plain_definition: '临时信息', analogy: '便签', chapter: 'ch8' },
        { term: '检索', plain_definition: '从资料中查找', analogy: '图书馆管理员', chapter: 'ch8' },
        { term: '提示工程', plain_definition: '优化提示词', analogy: '描述口味', chapter: 'ch9' },
        { term: '零样本提示', plain_definition: '不给示例直接做', analogy: '不拿范文请假条', chapter: 'ch9' },
        { term: '少样本提示', plain_definition: '给几个示例', analogy: '三篇范文', chapter: 'ch9' },
        { term: '系统提示', plain_definition: '设定角色', analogy: '演员人设', chapter: 'ch9' },
        { term: '温度', plain_definition: '随机性参数', analogy: '奶泡浓度', chapter: 'ch3' },
        { term: 'Top-p', plain_definition: '候选词概率', analogy: '热门候选名单', chapter: 'ch3' },
        { term: '强化学习', plain_definition: '试错学习', analogy: '训练小狗', chapter: 'ch11' },
        { term: '奖励模型', plain_definition: '打分模型', analogy: '作文评分老师', chapter: 'ch11' },
        { term: '策略', plain_definition: '行动规则', analogy: '下棋套路', chapter: 'ch11' },
        { term: '价值网络', plain_definition: '价值评估', analogy: '形势判断', chapter: 'ch11' },
        { term: '监督学习', plain_definition: '用标签数据训练', analogy: '对照标准答案', chapter: 'ch11' },
        { term: '注意力机制', plain_definition: '关注关键词', analogy: '眼睛停在关键词', chapter: 'ch3' },
        { term: 'Vector DB', plain_definition: '向量数据库', analogy: '按感觉找书', chapter: 'ch8' },
        { term: '微调', plain_definition: '继续训练', analogy: '通用厨师学川菜', chapter: 'ch11' },
        { term: 'PEAS', plain_definition: '智能体四要素', analogy: '岗位说明书', chapter: 'ch1' }
    ]
};

describe('glossary panel', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <section class="hero-guide reveal" id="heroGuide">
                <div class="guide-grid" id="guideGrid"></div>
            </section>
            <section class="glossary-panel reveal" id="glossary" aria-label="术语速查">
                <div class="gl-header">
                    <h2 class="gl-title">术语速查：<span id="glCount">0</span> 个 Agent 黑话一次扫盲</h2>
                </div>
                <div class="gl-search">
                    <input type="search" id="glSearch" class="gl-search__input"
                        placeholder="搜索术语或别名" />
                </div>
                <div class="gl-body">
                    <div class="gl-chips" id="glChips" role="list" aria-label="术语列表"></div>
                    <div class="gl-detail" id="glDetail" aria-live="polite"></div>
                </div>
            </section>
            <main class="chapter-grid" id="chapterGrid"></main>
        `;
        localStorage.clear();
        vi.stubGlobal('fetch', (url) => {
            if (url.includes('glossary.json')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve(SAMPLE_GLOSSARY) });
            }
            if (url.includes('chapters.json')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve({ chapters: [] }) });
            }
            return Promise.resolve({ ok: false });
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('index.html contains the #glossary section', () => {
        const indexPath = join(rootDir, 'index.html');
        expect(existsSync(indexPath)).toBe(true);
        const html = readFileSync(indexPath, 'utf-8');
        expect(html).toContain('id="glossary"');
    });

    it('data/glossary.json has at least 40 terms', () => {
        const glossaryPath = join(rootDir, 'data', 'glossary.json');
        expect(existsSync(glossaryPath)).toBe(true);
        const data = JSON.parse(readFileSync(glossaryPath, 'utf-8'));
        expect(Array.isArray(data.terms)).toBe(true);
        expect(data.terms.length).toBeGreaterThanOrEqual(40);
    });

    it('renders at least 40 term chips in the DOM', async () => {
        new App();
        await new Promise(r => setTimeout(r, 60));
        const chips = document.querySelectorAll('#glChips .gl-chip');
        expect(chips.length).toBeGreaterThanOrEqual(40);
    });

    it('expands detail card when a chip is clicked', async () => {
        new App();
        await new Promise(r => setTimeout(r, 60));
        const firstChip = document.querySelector('#glChips .gl-chip');
        expect(firstChip).toBeTruthy();
        const expectedTerm = firstChip.dataset.term || firstChip.textContent.trim();
        firstChip.click();
        const detail = document.getElementById('glDetail');
        expect(detail.textContent).toContain(expectedTerm);
        expect(detail.classList.contains('is-active')).toBe(true);
    });

    it('filters chips in real time as user types in the search box', async () => {
        new App();
        await new Promise(r => setTimeout(r, 60));
        const input = document.getElementById('glSearch');
        const allChips = Array.from(document.querySelectorAll('#glChips .gl-chip'));
        const before = allChips.filter(c => c.style.display !== 'none').length;
        expect(before).toBeGreaterThan(0);
        input.value = '记忆';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        const afterVisible = allChips.filter(c => c.style.display !== 'none').length;
        expect(afterVisible).toBeLessThan(before);
        expect(afterVisible).toBeGreaterThan(0);
    });
});

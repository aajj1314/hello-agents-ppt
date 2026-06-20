// tests/e2e/home-to-ch1.spec.js
import { test, expect } from '@playwright/test';

test.describe('Home → Chapter 1 flow', () => {
    test('首页加载并展示 Hero 标题与副标题', async ({ page }) => {
        await page.goto('/');

        // 标题
        await expect(page).toHaveTitle(/Hello-Agents/);

        // Hero 标题与副标题
        const heroTitle = page.locator('.hero-banner h1');
        await expect(heroTitle).toBeVisible();
        await expect(heroTitle).toHaveText('Hello-Agents');

        const heroSubtitle = page.locator('.hero-banner .subtitle');
        await expect(heroSubtitle).toBeVisible();
        await expect(heroSubtitle).toContainText('从零开始构建智能体');
    });

    test('首页渲染 16 个章节卡片', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#chapterGrid .chapter-card')).toHaveCount(16);
    });

    test('Hero 统计：16 章节、≥ 300 幻灯片', async ({ page }) => {
        await page.goto('/');

        const chaptersText = await page.locator('#statChapters').textContent();
        const pagesText = await page.locator('#statPages').textContent();

        const chapters = parseInt((chaptersText || '').trim(), 10);
        const pages = parseInt((pagesText || '').trim(), 10);

        expect(chapters).toBe(16);
        expect(pages).toBeGreaterThanOrEqual(300);
    });

    test('首页显示 3 张导览卡片', async ({ page }) => {
        await page.goto('/');
        const guideCards = page.locator('#guideGrid .guide-card');
        await expect(guideCards).toHaveCount(3);
        await expect(guideCards.first()).toBeVisible();
    });

    test('点击第一章卡片跳转到 slides.html?chapter=ch1&slide=1', async ({ page }) => {
        await page.goto('/');

        const firstCard = page.locator('#chapterGrid .chapter-card').first();
        await expect(firstCard).toBeVisible();
        await firstCard.click();

        await page.waitForURL(/slides\.html\?chapter=ch1/);
        const url = new URL(page.url());
        expect(url.pathname).toBe('/slides.html');
        expect(url.searchParams.get('chapter')).toBe('ch1');
        expect(url.searchParams.get('slide')).toBe('1');
    });

    test('第一章第一页显示"第一章·初识智能体"', async ({ page }) => {
        await page.goto('/slides.html?chapter=ch1&slide=1');

        // 等待幻灯片加载完成
        await expect(page.locator('.slide-content')).toBeVisible();

        // 章节头部信息
        await expect(page.locator('#chapterTitle')).toContainText('初识智能体');

        // 第一章封面标题 + 副标题
        const coverTitle = page.locator('.slide-cover h1');
        const coverSubtitle = page.locator('.slide-cover .cover-subtitle');
        await expect(coverTitle).toContainText('第一章');
        await expect(coverSubtitle).toContainText('初识智能体');

        // 合并检查"第一章·初识智能体"
        const coverText = `${(await coverTitle.textContent()) || ''}·${(await coverSubtitle.textContent()) || ''}`;
        expect(coverText.replace(/\s+/g, '')).toContain('第一章·初识智能体');
    });
});

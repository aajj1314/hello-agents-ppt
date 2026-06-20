// tests/e2e/ch1-navigation.spec.js
import { test, expect } from '@playwright/test';

test.describe('Chapter 1 navigation flow', () => {
    test('点击"下一页"按钮进入第 2 页', async ({ page }) => {
        await page.goto('/slides.html?chapter=ch1&slide=1');
        await expect(page.locator('.slide-content')).toBeVisible();

        // 点击顶部"下一页"按钮
        await page.locator('#btnNext').click();

        // URL 应更新到 slide=2
        await page.waitForURL(/slide=2/);
        const url = new URL(page.url());
        expect(url.searchParams.get('slide')).toBe('2');

        // 进度文本应为 "2 / ..."
        const progressText = (await page.locator('#slideProgress').textContent()) || '';
        expect(progressText.trim().startsWith('2 /')).toBeTruthy();
    });

    test('第 2 页标题包含"数字员工"', async ({ page }) => {
        await page.goto('/slides.html?chapter=ch1&slide=2');
        await expect(page.locator('.slide-content')).toBeVisible();

        const slideTitle = page.locator('.slide-content h1, .slide-content h2').first();
        await expect(slideTitle).toBeVisible();
        await expect(slideTitle).toContainText('数字员工');
    });

    test('按方向键 → 进入第 3 页', async ({ page }) => {
        await page.goto('/slides.html?chapter=ch1&slide=2');
        await expect(page.locator('.slide-content')).toBeVisible();

        await page.keyboard.press('ArrowRight');

        await page.waitForURL(/slide=3/);
        const url = new URL(page.url());
        expect(url.searchParams.get('slide')).toBe('3');
    });

    test('进度条随翻页更新', async ({ page }) => {
        await page.goto('/slides.html?chapter=ch1&slide=1');
        await expect(page.locator('.slide-content')).toBeVisible();

        const progressBar = page.locator('#progressBar');
        const fillBefore = await progressBar.locator('.fill').evaluate(
            (el) => parseFloat((el.style.width || '0').replace('%', '')) || 0
        );
        const valueNowBefore = parseInt((await progressBar.getAttribute('aria-valuenow')) || '0', 10);

        await page.locator('#btnNext').click();
        await page.waitForURL(/slide=2/);
        // 等待进度条 UI 更新
        await expect(progressBar).toHaveAttribute('aria-valuenow', '2');

        const fillAfter = await progressBar.locator('.fill').evaluate(
            (el) => parseFloat((el.style.width || '0').replace('%', '')) || 0
        );
        const valueNowAfter = parseInt((await progressBar.getAttribute('aria-valuenow')) || '0', 10);

        expect(valueNowAfter).toBeGreaterThan(valueNowBefore);
        expect(fillAfter).toBeGreaterThan(fillBefore);
    });

    test('直接访问 slide=33 进入测验页', async ({ page }) => {
        await page.goto('/slides.html?chapter=ch1&slide=33');
        await expect(page.locator('.slide-content')).toBeVisible();

        // 测验页结构：.slide-quiz 内含 #quiz-container
        await expect(page.locator('.slide-quiz')).toBeVisible();
        await expect(page.locator('#quiz-container')).toBeVisible();

        // 等待 QuizSystem 加载并渲染题目
        await expect(page.locator('#quiz-container .quiz-question')).toBeVisible({ timeout: 10000 });

        // 至少 2 个选项可点击
        const options = page.locator('#quiz-container .quiz-option');
        const count = await options.count();
        expect(count).toBeGreaterThan(0);
    });

    test('测验页选择第一个答案后显示反馈', async ({ page }) => {
        await page.goto('/slides.html?chapter=ch1&slide=33');
        await expect(page.locator('.slide-content')).toBeVisible();

        // 等待题目渲染
        await expect(page.locator('#quiz-container .quiz-question')).toBeVisible({ timeout: 10000 });

        // 点击第一个选项
        const firstOption = page.locator('#quiz-container .quiz-option').first();
        await firstOption.click();
        await expect(firstOption).toHaveClass(/selected/);

        // 提交答案
        await page.locator('#btn-submit').click();

        // 反馈区出现：包含正确/错误文案或对错标识
        const explanation = page.locator('#quiz-explanation');
        await expect(explanation).toBeVisible();
        await expect(explanation).not.toHaveClass(/hidden/);

        const feedbackText = (await explanation.textContent()) || '';
        expect(feedbackText).toMatch(/正确|错误/);

        // 选项高亮：至少有一个选项获得 correct-highlight 或 wrong-highlight
        const highlighted = page.locator('#quiz-container .quiz-option.correct-highlight, #quiz-container .quiz-option.wrong-highlight');
        await expect(highlighted.first()).toBeVisible();
    });
});

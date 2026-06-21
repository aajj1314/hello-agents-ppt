import { chromium } from 'playwright';

const browser = await chromium.launch({
    executablePath: '/root/.cache/ms-playwright/chromium-1228/chrome-headless-shell-linux64/chrome-headless-shell',
    args: ['--no-sandbox', '--disable-dev-shm-usage']
});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();

page.on('console', msg => console.log('PAGE:', msg.type(), msg.text()));
page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

await page.goto('http://127.0.0.1:8090/slides.html?chapter=ch1&slide=8', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);

// --- Screenshot 1: default (no selection) state ---
await page.screenshot({ path: '/tmp/ch1-default.png', fullPage: true });
console.log('--- ch1-default.png saved (1280 × ?) ---');

// --- Internal-state probe ---
const probe1 = await page.evaluate(() => {
    const c = document.querySelector('canvas#canvas-ch1-agent-types');
    if (!c) return { error: 'canvas not found' };
    const parent = c.parentElement;
    const cs = getComputedStyle(parent);
    const anim = window.Animations?.['ch1-agent-types'];
    return {
        canvasCssW: c.clientWidth,
        canvasCssH: c.clientHeight,
        canvasBufferW: c.width,
        canvasBufferH: c.height,
        canvasStyleW: c.style.width,
        canvasStyleH: c.style.height,
        parentClientW: parent.clientWidth,
        parentClientH: parent.clientHeight,
        parentRectW: parent.getBoundingClientRect().width,
        parentRectH: parent.getBoundingClientRect().height,
        parentPadL: cs.paddingLeft,
        parentPadR: cs.paddingRight,
        parentPadT: cs.paddingTop,
        parentPadB: cs.paddingBottom,
        parentBdrL: cs.borderLeftWidth,
        parentBdrR: cs.borderRightWidth,
        parentBdrT: cs.borderTopWidth,
        parentBdrB: cs.borderBottomWidth,
        dpr: window.devicePixelRatio,
        viewportW: window.innerWidth,
        animSelectedIndex: anim?.selectedIndex,
        animWidth: anim?.width,
        animHeight: anim?.height,
        animTypeCount: anim?.types?.length
    };
});
console.log('Probe (default):', JSON.stringify(probe1, null, 2));

// --- Programmatically select ball 3 (Goal-Based, index 2) via the API ---
// This avoids click-coord flakiness and guarantees the detail card renders.
await page.evaluate(() => {
    const anim = window.Animations?.['ch1-agent-types'];
    if (anim) {
        anim.selectedIndex = 2;
        anim.draw();
    }
});
await page.waitForTimeout(400);

const probe2 = await page.evaluate(() => {
    const anim = window.Animations?.['ch1-agent-types'];
    return {
        animSelectedIndex: anim?.selectedIndex,
        animSelectedName: anim?.selectedIndex >= 0 ? anim.types[anim.selectedIndex].name : null
    };
});
console.log('Probe (after select):', JSON.stringify(probe2, null, 2));

// --- Screenshot 2: full page with detail card open ---
await page.screenshot({ path: '/tmp/ch1-detail.png', fullPage: true });
console.log('--- ch1-detail.png saved (1280 × ?) ---');

// --- Screenshot 3: just the canvas region (clipped, no controls) ---
const canvas = await page.$('canvas#canvas-ch1-agent-types');
const box = await canvas.boundingBox();
console.log('Canvas bounding box:', box);

await canvas.scrollIntoViewIfNeeded();
await page.waitForTimeout(200);
const box2 = await canvas.boundingBox();
console.log('Canvas bounding box (after scroll):', box2);

await page.screenshot({
    path: '/tmp/ch1-detail-canvas.png',
    clip: { x: box2.x, y: box2.y, width: box2.width, height: box2.height }
});
console.log('--- ch1-detail-canvas.png saved ---');

// --- Sample some pixel colors to confirm the detail card actually drew ---
const pixelSample = await page.evaluate(() => {
    const c = document.querySelector('canvas#canvas-ch1-agent-types');
    if (!c) return { error: 'no canvas' };
    // sample a few pixels on the right panel (where the gray section backgrounds live)
    // right panel x ≈ c.width * (0.5 + 0.5*0.52 + 0.04) ≈ 0.80 * c.width
    const w = c.width, h = c.height;
    // right panel center X
    const rightX = Math.round(w * 0.85);
    // pixels: just below the title, and at the bottom
    const samples = [
        { name: 'right-top-empty',   x: rightX, y: Math.round(h * 0.55) },
        { name: 'right-mid',         x: rightX, y: Math.round(h * 0.70) },
        { name: 'right-bottom',      x: rightX, y: Math.round(h * 0.90) }
    ];
    const ctx = c.getContext('2d');
    const out = {};
    for (const s of samples) {
        const p = ctx.getImageData(s.x, s.y, 1, 1).data;
        out[s.name] = `rgba(${p[0]},${p[1]},${p[2]},${p[3]})`;
    }
    // also sample the title bar area: where the vertical color bar should be
    out['title-bar'] = (() => {
        const p = ctx.getImageData(80, 100, 1, 1).data;
        return `rgba(${p[0]},${p[1]},${p[2]},${p[3]})`;
    })();
    return out;
});
console.log('Pixel samples:', JSON.stringify(pixelSample, null, 2));

await browser.close();
console.log('DONE');

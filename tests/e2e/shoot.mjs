// Quick screenshot helper: node tests/e2e/shoot.mjs <outDir> <path> [width] [height] [fullPage]
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const [outDir, path = '/', width = '1440', height = '900', full = '1'] = process.argv.slice(2);
const base = process.env.BASE_URL || 'http://127.0.0.1:4321/mwai-portfolio';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: +width, height: +height }, colorScheme: process.env.SCHEME || 'light', reducedMotion: process.env.REDUCED ? 'reduce' : 'no-preference' });
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
await page.goto(base + path, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
const [sw, iw] = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
const name = `${outDir}/${path.replace(/[^a-z0-9]+/gi, '_') || 'home'}-${width}.png`;
await page.screenshot({ path: name, fullPage: full === '1' });
console.log(JSON.stringify({ path, width, overflow: sw > iw, sw, iw, errors }));
await browser.close();

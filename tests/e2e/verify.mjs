// End-to-end checks against `astro preview`. Usage:
//   npx astro preview --port 4321 &   then   node tests/e2e/verify.mjs [screenshotDir]
// Needs Playwright (set PLAYWRIGHT_MODULE if it isn't resolvable from here).
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:4321/mwai-portfolio';
const OUT = process.argv[2] || 'screenshots';
mkdirSync(OUT, { recursive: true });

const ROUTES = ['/', '/about/', '/notes/', '/notes/why-a-lab-notebook/', '/notes/tags/meta/', '/404.html',
  ...['midweek-merchant', 'oraimo-lab', 'glycosafe', 'fitweek', 'wc26', 'chaoslab', 'claude-desktop-arch', 'tutilo'].map((s) => `/work/${s}/`)];
const IGNORE = [/ERR_CERT/, /net::ERR_FAILED/, /Failed to load resource/];

const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`); };

const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: process.env.PROXY_BYPASS || '127.0.0.1,localhost' } : undefined;
const browser = await chromium.launch({ proxy });
async function open(path, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: opts.width ?? 1440, height: opts.height ?? 900 }, colorScheme: opts.scheme ?? 'light', reducedMotion: opts.reduced ? 'reduce' : 'no-preference', ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error' && !IGNORE.some((r) => r.test(m.text()))) errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  if (opts.route) await opts.route(page);
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  return { ctx, page, errors };
}

// 1. Every route, two widths, OS light/dark, with and without reduced motion.
for (const path of process.env.SKIP_ROUTES ? [] : ROUTES) {
  for (const width of [390, 1440]) {
    for (const [scheme, reduced] of [['light', false], ['dark', true]]) {
      const { ctx, page, errors } = await open(path, { width, scheme, reduced });
      await page.waitForTimeout(1200);
      const m = await page.evaluate(() => {
        const bg = getComputedStyle(document.body).backgroundColor;
        return { sw: document.documentElement.scrollWidth, iw: innerWidth, bg, h1: document.querySelectorAll('h1').length, title: document.title };
      });
      const tag = `${path} @${width} ${scheme}${reduced ? ' reduced' : ''}`;
      check(`no horizontal overflow ${tag}`, m.sw <= m.iw, `${m.sw}>${m.iw}`);
      check(`paper background ${tag}`, m.bg === 'rgb(243, 246, 242)', m.bg);
      check(`one h1 ${tag}`, m.h1 === 1, `${m.h1}`);
      check(`no console errors ${tag}`, errors.length === 0, errors.join(' | '));
      if (scheme === 'light') {
        await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } scrollTo(0, 0); });
        await page.waitForTimeout(400);
        await page.screenshot({ path: `${OUT}/${(path.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home')}-${width}.png`, fullPage: true });
      }
      await ctx.close();
    }
  }
}

// 2. Live Midweek Merchant data: live, blocked (fallback) and past deadline (locked).
{
  const { ctx, page } = await open('/');
  await page.waitForFunction(() => document.querySelector('[data-live-strip]')?.getAttribute('data-status'), null, { timeout: 15000 }).catch(() => {});
  const status = await page.getAttribute('[data-live-strip]', 'data-status');
  check('live strip reads the data branch', status === 'live' || status === 'locked' || status === 'off-season', status);
  await ctx.close();
}
{
  const { ctx, page } = await open('/', { route: (p) => p.route(/raw\.githubusercontent\.com/, (r) => r.abort()) });
  await page.waitForFunction(() => document.querySelector('[data-live-strip]')?.getAttribute('data-status'), null, { timeout: 15000 }).catch(() => {});
  const status = await page.getAttribute('[data-live-strip]', 'data-status');
  const text = await page.textContent('[data-live="lamp"]');
  check('live strip falls back to the snapshot when GitHub is unreachable', status?.startsWith('fallback') && /SNAPSHOT/.test(text), `${status} / ${text}`);
  await ctx.close();
}
{
  const { ctx, page } = await open('/', {
    route: (p) => p.route(/meta\.json$/, async (r) => {
      const res = await r.fetch();
      const meta = await res.json();
      meta.events = meta.events.map((e) => (e.gw === meta.next_gw ? { ...e, deadline: '2020-01-01T00:00:00Z' } : e));
      await r.fulfill({ response: res, json: meta });
    }),
  });
  await page.waitForFunction(() => document.querySelector('[data-live-strip]')?.getAttribute('data-status'), null, { timeout: 15000 }).catch(() => {});
  const status = await page.getAttribute('[data-live-strip]', 'data-status');
  const sub = await page.textContent('[data-live="sub"]');
  check('live strip shows the locked state after the deadline', status === 'locked' && /6 H/.test(sub), `${status} / ${sub}`);
  await ctx.close();
}

// 3. Interactions.
{
  const { ctx, page, errors } = await open('/work/chaoslab/');
  await page.locator('[aria-label^="Recommendation Engine"]').click();
  await page.waitForTimeout(900);
  const hDown = Number(await page.textContent('.chaos .health b'));
  check('chaos: killing a node drops health', hDown < 100, String(hDown));
  await page.waitForFunction(() => document.querySelector('.chaos .health b')?.textContent === '100' && document.querySelector('.chaos .log')?.textContent.includes('All services recovered'), null, { timeout: 15000 }).catch(() => {});
  const hUp = await page.textContent('.chaos .health b');
  check('chaos: system recovers to 100', hUp === '100', hUp);
  check('chaos: no errors', errors.length === 0, errors.join(' | '));
  await ctx.close();
}
{
  const { ctx, page } = await open('/work/midweek-merchant/');
  await page.locator('#fpl-gw').fill('3');
  await page.waitForTimeout(200);
  const model = await page.locator('.fpl .pg-stat b').first().textContent();
  const out = await page.textContent('.fpl output');
  check('fpl race: scrubbing to GW3 updates the pitch and score', out === 'GW3' && model === '68', `${out} ${model}`);
  check('fpl race: pitch shows 11 players', (await page.locator('.fpl .pl').count()) === 11);
  await ctx.close();
}
{
  const { ctx, page } = await open('/work/wc26/');
  await page.getByRole('button', { name: 'What happened' }).click();
  const champ = await page.locator('.bracket .tier').first().textContent();
  check('bracket: "What happened" puts Spain in the champion row', champ.includes('ESP'), champ.slice(0, 60));
  await page.getByRole('button', { name: 'Compare' }).click();
  check('bracket: compare mode colours teams by error', (await page.locator('.bracket .team.hit').count()) === 16);
  await ctx.close();
}
{
  const { ctx, page } = await open('/work/glycosafe/');
  await page.waitForTimeout(1500);
  const before = await page.locator('.plates .gauge text').first().textContent();
  await page.locator('.plates .food input[type=range]').first().fill('40');
  const after = await page.locator('.plates .gauge text').first().textContent();
  check('plate: portion slider changes the meal GL', before !== after, `${before} -> ${after}`);
  await ctx.close();
}
{
  const { ctx, page } = await open('/work/oraimo-lab/');
  await page.getByRole('button', { name: 'Reassemble fragments' }).click();
  await page.waitForTimeout(1200);
  await page.getByRole('tab', { name: /H-03/ }).click();
  const row = page.locator('.packets .tr.fresh');
  await row.getByRole('button', { name: 'Cite' }).click();
  const st = await page.textContent('.packets .chip-status');
  check('packet bench: the reassembled packet disproves H-03', st === 'DISPROVEN', st);
  await ctx.close();
}
{
  const { ctx, page } = await open('/work/fitweek/');
  await page.waitForTimeout(1500);
  check('week planner: 7 days planned', (await page.locator('.week .day').count()) === 7);
  await page.getByRole('button', { name: 'Cold snap' }).click();
  const outfit = await page.textContent('.week .outfit');
  check('week planner: a cold snap adds outerwear', /coat|jacket/i.test(outfit), outfit.slice(0, 80));
  await ctx.close();
}
{
  const { ctx, page } = await open('/work/claude-desktop-arch/');
  await page.getByRole('button', { name: 'Replay the build' }).click();
  await page.waitForTimeout(600);
  const n1 = await page.locator('.term .ln').count();
  await page.waitForTimeout(2500);
  const n2 = await page.locator('.term .ln').count();
  check('terminal: replay types lines progressively', n1 < n2, `${n1} -> ${n2}`);
  await ctx.close();
}
{
  const { ctx, page } = await open('/work/tutilo/');
  await page.locator('#cmap-notes').fill('Inflation raises prices. Central banks raise interest rates to fight inflation. Higher interest rates slow borrowing and spending. Lower spending cools prices and inflation.');
  await page.getByRole('button', { name: 'Map my notes' }).click();
  await page.waitForTimeout(600);
  check('concept map: maps pasted notes', (await page.locator('.cmap svg .n').count()) >= 4);
  await ctx.close();
}
{
  const { ctx, page } = await open('/');
  await page.waitForTimeout(800);
  await page.keyboard.press('Control+k');
  check('palette: Ctrl+K opens it', await page.locator('#palette').evaluate((d) => d.open));
  await page.keyboard.type('chaos');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(700);
  check('palette: "Unleash chaos" breaks sections', (await page.locator('[data-chaos].failed').count()) > 0);
  await page.waitForTimeout(6000);
  check('palette: sections heal', (await page.locator('[data-chaos].failed, [data-chaos].recovering').count()) === 0);
  await ctx.close();
}
{
  const { ctx, page } = await open('/');
  await page.waitForTimeout(800);
  const card = page.locator('.specimen').nth(2);
  await page.locator('#work-title').scrollIntoViewIfNeeded();
  await page.evaluate(() => scrollBy(0, 200));
  await page.waitForTimeout(300);
  const b1 = await card.boundingBox();
  await page.mouse.move(b1.x + 60, b1.y + 60);
  await page.mouse.down();
  await page.mouse.move(b1.x + 160, b1.y + 120, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(900);
  const b2 = await card.boundingBox();
  check('bench: dragging moves a card without opening it', Math.abs(b2.x - b1.x) > 40 && page.url().endsWith('/mwai-portfolio/'), `${Math.round(b1.x)} -> ${Math.round(b2.x)}`);
  await page.locator('.specimen[data-id="01"]').click();
  await page.waitForURL(/work\/midweek-merchant/, { timeout: 8000 }).catch(() => {});
  check('bench: clicking a card opens its case study', /work\/midweek-merchant/.test(page.url()), page.url());
  await ctx.close();
}

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);

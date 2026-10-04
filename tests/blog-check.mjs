// Builds the site with temporary fixture posts and checks blog behaviour:
// drafts and future-dated posts stay hidden, a Pages CMS-shaped post builds,
// the RSS feed is valid, and every internal link in dist/ resolves.
// Usage: node tests/blog-check.mjs
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const NOTES = 'src/content/notes';
const BASE = '/mwai-portfolio';
const fixtures = {
  'zz-draft-fixture.md': `---\ntitle: Draft fixture\ndescription: Should never be published.\npubDate: 2026-01-01\ntags: [fixture]\ndraft: true\n---\nDraft body.\n`,
  'zz-future-fixture.md': `---\ntitle: Future fixture\ndescription: Scheduled far in the future.\npubDate: 2099-01-01\ntags: [fixture]\ndraft: false\n---\nFuture body.\n`,
  // Exactly how Pages CMS writes a post with empty optional fields.
  'zz-cms-fixture.md': `---\ntitle: CMS fixture\ndescription: Written the way Pages CMS saves a post.\npubDate: 2026-02-01\nupdatedDate: ''\ntags:\n  - cms\n  - fixture\ndraft: false\ncover: ''\ncoverAlt: ''\n---\nA paragraph with an [internal link](/notes/) and an image path ![x](/favicon.svg).\n`,
};

const results = [];
const check = (name, ok, detail = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`); };
const walk = (dir) => readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : [p]; });

try {
  for (const [f, body] of Object.entries(fixtures)) writeFileSync(join(NOTES, f), body);
  execSync('npx astro build', { stdio: 'pipe' });

  check('draft post has no page', !existsSync('dist/notes/zz-draft-fixture'));
  check('future post has no page', !existsSync('dist/notes/zz-future-fixture'));
  check('Pages CMS-shaped post builds', existsSync('dist/notes/zz-cms-fixture/index.html'));

  const rss = readFileSync('dist/rss.xml', 'utf8');
  check('feed excludes the draft', !rss.includes('Draft fixture'));
  check('feed excludes the future post', !rss.includes('Future fixture'));
  check('feed includes the CMS post with full HTML', rss.includes('CMS fixture') && /<content:encoded>.*internal link/s.test(rss));
  check('feed links are absolute', !/href=&quot;\//.test(rss));
  try { execSync('python3 -c "import sys, xml.dom.minidom as m; m.parse(sys.argv[1])" dist/rss.xml', { stdio: 'pipe' }); check('feed is well-formed XML', true); }
  catch (e) { check('feed is well-formed XML', false, String(e.stderr)); }

  const sitemap = walk('dist').filter((f) => /sitemap-\d+\.xml$/.test(f)).map((f) => readFileSync(f, 'utf8')).join('');
  check('sitemap excludes draft and future posts', !/zz-(draft|future)-fixture/.test(sitemap) && sitemap.includes('zz-cms-fixture'));

  const html = walk('dist').filter((f) => f.endsWith('.html'));
  check('every page advertises the RSS feed', html.every((f) => readFileSync(f, 'utf8').includes('type="application/rss+xml"')), `${html.length} pages`);

  const broken = new Set();
  for (const f of html) {
    const src = readFileSync(f, 'utf8');
    for (const [, url] of src.matchAll(/(?:href|src)="([^"#?]+)/g)) {
      if (!url.startsWith('/')) continue;
      if (!url.startsWith(`${BASE}/`) && url !== BASE) { broken.add(`${url} (missing base) in ${f}`); continue; }
      const rel = decodeURIComponent(url.slice(BASE.length)) || '/';
      const target = join('dist', rel);
      const ok = existsSync(target) && (statSync(target).isFile() || existsSync(join(target, 'index.html')));
      if (!ok) broken.add(`${url} in ${f}`);
    }
  }
  check('no broken internal links or assets', broken.size === 0, [...broken].slice(0, 8).join('; '));
} finally {
  for (const f of Object.keys(fixtures)) rmSync(join(NOTES, f), { force: true });
  execSync('npx astro build', { stdio: 'pipe' });
}

const failed = results.filter((r) => !r).length;
console.log(`\n${results.length - failed}/${results.length} blog checks passed`);
process.exit(failed ? 1 : 0);

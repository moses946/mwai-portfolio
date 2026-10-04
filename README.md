# Moses Mwai's Lab

My portfolio, built as a lab notebook: eight experiments you can poke at, an about page and **lab notes** (the blog).

- **Live site:** https://moses946.github.io/mwai-portfolio (once GitHub Pages is enabled, see [Deploy](#deploy))
- **Stack:** Astro 7 (static), React islands for the playgrounds, MDX, plain CSS tokens, Vitest.

## Run it

```bash
npm ci
npm run dev        # http://localhost:4321/mwai-portfolio/
npm run build      # refreshes Midweek Merchant data, then builds to dist/
npm run build:offline   # same build without the network refresh
npm test           # FitWeek recommender tests (vendored code)
npm run check      # astro check (types + templates)
```

Node 22.12 or newer is required.

## Where things live

| Path | What it is |
|---|---|
| `src/content/work/*.mdx` | One file per experiment: frontmatter for the card, metrics and links; MDX body for the write-up |
| `src/content/notes/*.md(x)` | Lab notes (blog posts) |
| `src/components/playgrounds/` | The interactive demo on each case study (React) |
| `src/components/home/` | Hero, specimen bench, live strip, notes preview, about teaser |
| `src/data/` | Data the playgrounds use (Midweek Merchant snapshot, WC26 scorecard, ChaosLab topology…) |
| `src/data/now.json` | The "Now" block: what I'm building, reading and listening to. Edit freely |
| `src/lib/outfit-recommender/` | FitWeek's recommender, copied from the FitWeek repo. Tests in `tests/outfit-recommender/` |
| `src/styles/global.css` | Design tokens (paper, Riso inks, type scale) |
| `.pages.yml` | Pages CMS configuration for writing posts in the browser |

## Write a lab note

### From the browser or your phone (Pages CMS)

1. Go to [app.pagescms.org](https://app.pagescms.org) and sign in with GitHub. The first time, install the Pages CMS GitHub App on this repository.
2. Open **mwai-portfolio → Lab notes → Add an entry**.
3. Fill in the title, summary, publish date and tags, then write the post.
4. Untick **Draft** when it's ready, and save. Saving commits a Markdown file to `src/content/notes/`, and the deploy workflow publishes it.

- **Drafts** (`draft: true`) never appear on the site, in the RSS feed or in the sitemap.
- **Scheduling:** a publish date in the future keeps the post hidden until that day. The site rebuilds every morning at 06:17 Nairobi time, so a scheduled post goes live on its date.
- **Images** you upload go to `public/notes/media/`.

### From a code editor

Add `src/content/notes/my-post.md` (or press `.` on the GitHub repo page to open github.dev):

```md
---
title: My post
description: One or two sentences for lists, link previews and RSS.
pubDate: 2026-10-20
tags: [ml, post-mortem]
draft: false
---

Write in Markdown here.
```

Use `.mdx` when you want components. For example, margin notes:

```mdx
import Sidenote from '../../components/notes/Sidenote.astro';

The model beat FPL's prediction<Sidenote>Blind, before every deadline.</Sidenote> in 28 of 37 gameweeks.
```

## RSS and cross-posting to DEV

- **The feed** is at `/rss.xml`, with the full text of every post. Every page advertises it, so feed readers find it from the home page URL.
- **Cross-posting to DEV:** set this up once. In DEV, go to **Settings → Extensions → Publishing to DEV Community from RSS**, paste `https://moses946.github.io/mwai-portfolio/rss.xml`, and tick **Mark the RSS source as canonical URL**. New posts then arrive in your DEV dashboard as drafts to publish. The DEV copy points back here, so search engines credit this site as the original.
- **If you move to a custom domain,** update the feed URL in DEV.

## Add or change an experiment

1. Copy any file in `src/content/work/` and edit the frontmatter. The schema in `src/content.config.ts` tells you every field. `ink` picks the Riso colour, and `order` sets the position on the bench.
2. Write the case study with the `Section`, `Aside`, `Pipeline` and `Figure` components (see existing files).
3. Pick a `playground` from the existing ones, or add a component to `src/components/playgrounds/` and register it in `src/components/case/Playground.astro`.

## Live data

The Midweek Merchant ticker on the home page and the "This season, live" panel read the model's public JSON from the `data` branch of [midweek-merchant](https://github.com/moses946/midweek-merchant). That branch refreshes every 6 hours, so the captain pick moves to the next gameweek by itself. `scripts/snapshot-mm.mjs` stores a copy at build time as the fallback when GitHub can't be reached.

## Deploy

`.github/workflows/deploy.yml` tests, checks and builds on every push. On `main` it also deploys to GitHub Pages, both on push and on a daily schedule.

One-time setup: in the repository **Settings → Pages**, set **Source** to **GitHub Actions**.

**Custom domain:** add repository variables `SITE_URL=https://your.domain` and `BASE_PATH=/`, then configure the domain in Settings → Pages.

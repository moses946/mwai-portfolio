// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// GitHub Pages serves this repo from /mwai-portfolio. For a custom domain,
// set SITE_URL=https://your.domain and BASE_PATH=/ in the deploy workflow.
const site = process.env.SITE_URL || 'https://moses946.github.io';
const base = process.env.BASE_PATH ?? '/mwai-portfolio';

export default defineConfig({
  site,
  base,
  compressHTML: true,
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  integrations: [react(), mdx(), sitemap()],
});

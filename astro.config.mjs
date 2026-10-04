// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// GitHub Pages serves this repo from /mwai-portfolio. For a custom domain,
// set SITE_URL=https://your.domain and BASE_PATH=/ in the deploy workflow.
const site = process.env.SITE_URL || 'https://moses946.github.io';
const base = process.env.BASE_PATH || '/mwai-portfolio';

export default defineConfig({
  site,
  base,
  compressHTML: true,
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  build: { inlineStylesheets: 'always' },
  integrations: [react(), mdx(), sitemap()],
  // Self-hosted fonts with metric-matched fallbacks, so swapping fonts in doesn't shift the layout.
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Bricolage Grotesque',
      cssVariable: '--font-bricolage',
      fallbacks: ['sans-serif'],
      options: { variants: [{ src: ['./src/assets/fonts/bricolage-grotesque-latin-standard-normal.woff2'], weight: '200 800', style: 'normal' }] },
    },
    {
      provider: fontProviders.local(),
      name: 'JetBrains Mono',
      cssVariable: '--font-jetbrains',
      fallbacks: ['monospace'],
      options: { variants: [{ src: ['./src/assets/fonts/jetbrains-mono-latin-wght-normal.woff2'], weight: '100 800', style: 'normal' }] },
    },
    {
      provider: fontProviders.local(),
      name: 'Shantell Sans',
      cssVariable: '--font-shantell',
      fallbacks: ['cursive'],
      options: { variants: [{ src: ['./src/assets/fonts/shantell-sans-latin-wght-normal.woff2'], weight: '300 800', style: 'normal' }] },
    },
  ],
});

import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const ink = z.enum(['green', 'teal', 'red', 'yellow', 'pink', 'blue', 'purple', 'orange']);

const work = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/work' }),
  schema: z.object({
    code: z.string().regex(/^\d{2}$/),
    order: z.number(),
    title: z.string(),
    ink,
    year: z.string(),
    medium: z.string(),
    stack: z.array(z.string()),
    metric: z.string(),
    metricLabel: z.string(),
    proves: z.string(),
    dek: z.string(),
    description: z.string(),
    preview: z.enum(['mm', 'hex', 'gauge', 'week', 'bracket', 'graph', 'term', 'map']),
    phrases: z.array(z.enum(['predicts', 'survives', 'pocket', 'takes-apart'])).default([]),
    metrics: z.array(z.object({ value: z.string(), label: z.string() })).min(2).max(4),
    playground: z.enum(['fpl-race', 'packet-bench', 'plate-scanner', 'week-planner', 'bracket-fill', 'chaos-topology', 'terminal-replay', 'concept-map']),
    playgroundTitle: z.string(),
    playgroundNote: z.string(),
    links: z.array(z.object({ label: z.string(), href: z.url() })).default([]),
  }),
});

// Pages CMS writes "" for empty optional fields; treat that as missing.
const blank = (v: unknown) => (v === '' || v === null ? undefined : v);

// Fields mirror .pages.yml so posts written in Pages CMS validate here.
const notes = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/notes' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      pubDate: z.coerce.date(),
      updatedDate: z.preprocess(blank, z.coerce.date().optional()),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
      cover: z.preprocess(blank, z.union([image(), z.string()]).optional()),
      coverAlt: z.preprocess(blank, z.string().optional()),
    }),
});

export const collections = { work, notes };

export const SITE = {
  name: 'Moses Mwai',
  title: "Moses Mwai's Lab",
  description:
    'Software engineer in Nairobi. Eight experiments you can poke at, from forecasting and reverse engineering to applied AI, plus lab notes.',
  email: 'mosesmwaiw@gmail.com',
  location: 'Nairobi, Kenya',
  socials: [
    { label: 'GitHub', href: 'https://github.com/moses946' },
    { label: 'LinkedIn', href: 'https://linkedin.com/in/moses-mwai' },
    { label: 'X', href: 'https://x.com/mwaii__' },
  ],
} as const;

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Prefix a site-relative path with the deploy base (e.g. /mwai-portfolio). */
export function u(path = '/'): string {
  if (/^(https?:|mailto:|#)/.test(path)) return path;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${BASE}${p}` || '/';
}

export type InkKey = 'green' | 'teal' | 'red' | 'yellow' | 'pink' | 'blue' | 'purple' | 'orange';

/** Real Riso ink names. `on` is the text tone that reads on the ink. */
export const INKS: Record<InkKey, { name: string; on: 'light' | 'dark' }> = {
  green: { name: 'RISO GREEN', on: 'dark' },
  teal: { name: 'RISO TEAL', on: 'light' },
  red: { name: 'BRIGHT RED', on: 'dark' },
  yellow: { name: 'RISO YELLOW', on: 'dark' },
  pink: { name: 'FLUO PINK', on: 'dark' },
  blue: { name: 'MEDIUM BLUE', on: 'light' },
  purple: { name: 'RISO PURPLE', on: 'light' },
  orange: { name: 'RISO ORANGE', on: 'dark' },
};

/** Inline style that paints an element in an ink with readable text. */
export function inkStyle(ink: InkKey): string {
  const text = INKS[ink].on === 'light' ? 'var(--paper-text)' : 'var(--ink-text)';
  return `--ink-card: var(--r-${ink}); --on: ${text};`;
}

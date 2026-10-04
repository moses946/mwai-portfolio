import { getCollection, type CollectionEntry } from 'astro:content';

export type Note = CollectionEntry<'notes'>;

/** A post is live when it isn't a draft and its date has arrived. Dev shows everything. */
export function isPublished(n: Note, now = new Date()): boolean {
  if (import.meta.env.DEV) return true;
  return !n.data.draft && n.data.pubDate.getTime() <= now.getTime();
}

export async function publishedNotes(): Promise<Note[]> {
  const all = await getCollection('notes', (n) => isPublished(n));
  return all.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

export function readingMinutes(text = ''): number {
  const words = text.replace(/<[^>]+>/g, ' ').replace(/[#*_`>\-[\]()!]/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function tagSlug(tag: string): string {
  return tag.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function formatDate(d: Date): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Nairobi' }).format(d);
}

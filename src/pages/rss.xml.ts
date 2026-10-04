import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { render } from 'astro:content';
import { loadRenderers } from 'astro:container';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { getContainerRenderer as mdxRenderer } from '@astrojs/mdx/container-renderer';
import { publishedNotes } from '../lib/notes';
import { absolutize, rebase } from '../lib/rebase';
import { SITE, u } from '../lib/site';

export async function GET(context: APIContext) {
  const container = await AstroContainer.create({ renderers: await loadRenderers([mdxRenderer()]) });
  const origin = new URL(context.site!).origin;
  const notes = await publishedNotes();
  const items = [];
  for (const n of notes) {
    const { Content } = await render(n);
    // Full post HTML, with links made absolute so feed readers and DEV resolve them.
    const html = absolutize(rebase(await container.renderToString(Content), import.meta.env.BASE_URL), origin);
    items.push({
      title: n.data.title,
      description: n.data.description,
      pubDate: n.data.pubDate,
      link: u(`/notes/${n.id}/`),
      categories: n.data.tags,
      content: html,
    });
  }
  return rss({
    title: `${SITE.name} · Lab notes`,
    description: 'Essays and post-mortems from a software engineer in Nairobi.',
    site: new URL(u('/'), context.site).href,
    items,
    customData: '<language>en</language>',
  });
}

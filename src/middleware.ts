import { defineMiddleware } from 'astro:middleware';
import { rebase } from './lib/rebase';

export const onRequest = defineMiddleware(async (_ctx, next) => {
  const res = await next();
  const base = import.meta.env.BASE_URL;
  if (base === '/' || !res.headers.get('content-type')?.includes('text/html')) return res;
  const html = await res.text();
  return new Response(rebase(html, base), { status: res.status, statusText: res.statusText, headers: res.headers });
});

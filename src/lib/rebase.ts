/**
 * Posts written in the browser editor link to root paths such as /notes/media/x.jpg.
 * When the site is served under a base path (GitHub Pages: /mwai-portfolio), prefix
 * any root-relative src/href/poster that doesn't already carry the base.
 */
export function rebase(html: string, base: string): string {
  const b = base.replace(/\/$/, '');
  if (!b) return html;
  const seg = b.slice(1).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`\\b(src|href|poster)=(["'])\\/(?!\\/)(?!${seg}(?:\\/|\\2|#|\\?))`, 'g');
  return html.replace(re, `$1=$2${b}/`);
}

/** Make every root-relative src/href absolute against an origin (for RSS readers). */
export function absolutize(html: string, origin: string): string {
  const o = origin.replace(/\/$/, '');
  return html.replace(/\b(src|href|poster)=(["'])\/(?!\/)/g, `$1=$2${o}/`);
}

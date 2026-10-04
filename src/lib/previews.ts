import hindcast from '../data/mm-hindcast.json';

/** Small SVG/ASCII previews printed on each specimen card. Colours use currentColor. */
export function preview(kind: string): string {
  switch (kind) {
    case 'mm': {
      let cm = 0, cf = 0;
      const diffs = hindcast.last.gws.map((g) => { cm += g.m; cf += g.f; return cm - cf; });
      const max = Math.max(...diffs.map(Math.abs)), w = 230, h = 56;
      const pts = diffs.map((d, i) => `${((i / (diffs.length - 1)) * w).toFixed(1)},${(h / 2 - (d / max) * (h / 2 - 4)).toFixed(1)}`).join(' ');
      return `<svg viewBox="0 0 ${w} ${h}" aria-hidden="true"><line x1="0" x2="${w}" y1="${h / 2}" y2="${h / 2}" stroke="currentColor" stroke-dasharray="3 4" stroke-width="1"/><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/><text x="0" y="9" style="font-family:var(--font-mono)" font-size="9" fill="currentColor">+${diffs.at(-1)} pts ahead of FPL by GW38</text></svg>`;
    }
    case 'hex':
      return `<pre>14:02:07.118  ←  0x0015  A5 0A 00 7E
14:02:07.164  →  0x0012  1F 0B 02 01
14:02:07.201  ←  0x0015  A5 0B 00 7E
H-02 echo counter ····· UNKNOWN</pre>`;
    case 'gauge':
      return `<svg viewBox="0 0 230 64" aria-hidden="true"><path d="M70 60a45 45 0 0 1 90 0" fill="none" stroke="currentColor" stroke-opacity=".3" stroke-width="10"/><path d="M70 60a45 45 0 0 1 64-41" fill="none" stroke="currentColor" stroke-width="10"/><line x1="115" y1="60" x2="138" y2="24" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><text x="175" y="40" style="font-family:var(--font-mono)" font-size="10" fill="currentColor">GL 18</text><text x="175" y="54" style="font-family:var(--font-mono)" font-size="9" fill="currentColor">medium</text></svg>`;
    case 'week': {
      const t = [24, 26, 22, 19, 21, 25, 27], d = 'MTWTFSS';
      return `<svg viewBox="0 0 230 64" aria-hidden="true">${t.map((v, i) => `<rect x="${i * 33 + 2}" y="${52 - (v - 14) * 3}" width="22" height="${(v - 14) * 3}" fill="currentColor"${i === 3 ? ' fill-opacity=".45"' : ''}/><text x="${i * 33 + 13}" y="63" text-anchor="middle" style="font-family:var(--font-mono)" font-size="9" fill="currentColor">${d[i]}</text>`).join('')}</svg>`;
    }
    case 'bracket': {
      const rows = [1, 1, 2, 4, 8, 16, 16];
      let s = '';
      rows.forEach((n, r) => { for (let i = 0; i < n; i++) { const x = 115 - (n - 1) * 6.5 + i * 13; s += `<circle cx="${x}" cy="${6 + r * 9}" r="${r < 2 ? 4 : 3.2}" fill="currentColor"${r < 2 ? '' : ' fill-opacity=".55"'}/>`; } });
      return `<svg viewBox="0 0 230 64" aria-hidden="true">${s}</svg>`;
    }
    case 'graph': {
      const n = [[30, 32], [80, 12], [80, 52], [130, 32], [180, 12], [180, 52], [215, 22], [215, 46]];
      const e = [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [3, 5], [4, 6], [5, 7], [4, 5]];
      return `<svg viewBox="0 0 230 64" aria-hidden="true">${e.map(([a, b]) => `<line x1="${n[a][0]}" y1="${n[a][1]}" x2="${n[b][0]}" y2="${n[b][1]}" stroke="currentColor" stroke-width="1.5"${a === 3 || b === 3 ? ' stroke-dasharray="3 3"' : ''}/>`).join('')}${n.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="7" fill="${i === 3 ? 'none' : 'currentColor'}" stroke="currentColor" stroke-width="2"/>`).join('')}<path d="M125 27l10 10m0-10l-10 10" stroke="currentColor" stroke-width="2.5"/></svg>`;
    }
    case 'term':
      return `<pre>$ makepkg -si
==> restoring SUID on chrome-sandbox
-rwsr-xr-x  chrome-sandbox
==> OVMF → /usr/share/edk2/x64 ✓</pre>`;
    case 'map': {
      const c = [115, 32], k = [[40, 12], [44, 52], [188, 10], [192, 50], [115, 4]];
      return `<svg viewBox="0 0 230 64" aria-hidden="true">${k.map(([x, y]) => `<line x1="${c[0]}" y1="${c[1]}" x2="${x}" y2="${y}" stroke="currentColor" stroke-width="1.5"/>`).join('')}<rect x="88" y="22" width="54" height="20" rx="10" fill="currentColor"/>${k.map(([x, y]) => `<rect x="${x - 16}" y="${y - 6}" width="32" height="12" rx="6" fill="none" stroke="currentColor" stroke-width="1.5"/>`).join('')}</svg>`;
    }
    default:
      return '';
  }
}

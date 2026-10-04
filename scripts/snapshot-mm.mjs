// Refreshes the Midweek Merchant data the portfolio ships with:
//   src/data/mm-hindcast.json       2025/26 blind race (frozen season) + 2026/27 so far
//   src/data/mm-live-snapshot.json  fallback for the live "this week" card
// The browser fetches the live files itself; these are only the build-time fallback.
// Network errors keep the committed files, so offline builds still work.
import { writeFile } from 'node:fs/promises';
import { captainShortlist, MM_RAW } from '../src/lib/mm.ts';

const RAW = MM_RAW;
const OUT = new URL('../src/data/', import.meta.url);

async function get(name) {
  const res = await fetch(RAW + name, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  return res.json();
}

const POS = { GKP: 'G', DEF: 'D', MID: 'M', FWD: 'F' };

function compactSeason(h, withXi) {
  const gws = h.gameweeks
    .filter((g) => g.scores && g.scores.model != null)
    .map((g) => {
      const m = g.picks?.model;
      const row = { gw: g.gw, m: g.scores.model, f: g.scores.fpl_ep, fo: g.scores.form, h: g.scores.hindsight };
      if (withXi && m) {
        row.cap = m.captain?.name ?? null;
        row.xi = m.lineup.map((p) => ({ n: p.name, p: POS[p.position] ?? p.position[0], t: p.team, x: Math.round(p.xpts * 10) / 10, a: p.actual ?? null }));
      }
      return row;
    });
  const n = gws.length || 1;
  const mean = (k) => Math.round((gws.reduce((s, g) => s + (g[k] ?? 0), 0) / n) * 10) / 10;
  return {
    season: h.season,
    generatedAt: h.generated_at,
    gameweeks: gws.length,
    meanModel: mean('m'),
    meanFpl: mean('f'),
    meanForm: mean('fo'),
    winsVsFpl: gws.filter((g) => g.m > g.f).length,
    gws,
  };
}

async function main() {
  let summary = null;
  try {
    const [last, now] = await Promise.all([get('hindcast_2025-26.json'), get('hindcast_2026-27.json').catch(() => null)]);
    const out = { last: compactSeason(last, true), current: now ? compactSeason(now, false) : null };
    await writeFile(new URL('mm-hindcast.json', OUT), JSON.stringify(out));
    summary = {
      lastSeason: { season: out.last.season, gameweeks: out.last.gameweeks, meanModel: out.last.meanModel, meanFpl: out.last.meanFpl, winsVsFpl: out.last.winsVsFpl },
      currentGws: (out.current?.gws ?? []).map(({ gw, m, f }) => ({ gw, m, f })),
    };
    console.log(`mm-hindcast: ${out.last.gameweeks} GWs (${out.last.meanModel} vs ${out.last.meanFpl}), current: ${out.current?.gameweeks ?? 0} GWs`);
  } catch (e) {
    console.warn(`mm-hindcast: kept committed file (${e.message})`);
  }
  try {
    const [meta, players] = await Promise.all([get('meta.json'), get('players.json')]);
    const event = meta.events?.find((ev) => ev.gw === meta.next_gw);
    const snap = {
      fetchedAt: new Date().toISOString(),
      season: meta.season,
      nextGw: meta.next_gw ?? null,
      deadline: event?.deadline ?? meta.deadline ?? null,
      picks: captainShortlist(players),
      ...(summary ?? {}),
    };
    await writeFile(new URL('mm-live-snapshot.json', OUT), JSON.stringify(snap, null, 2));
    console.log(`mm-live-snapshot: GW${snap.nextGw}, captain ${snap.picks[0]?.name}`);
  } catch (e) {
    console.warn(`mm-live-snapshot: kept committed file (${e.message})`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();

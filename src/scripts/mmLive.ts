import snapshotJson from '../data/mm-live-snapshot.json';
import { MM_RAW, captainShortlist, classify, eatDeadline, type LiveSnapshot, type LiveState, type SnapshotFile } from '../lib/mm';

export const snapshot = snapshotJson as SnapshotFile;

async function getJSON(name: string): Promise<any> {
  const res = await fetch(MM_RAW + name, { signal: AbortSignal.timeout(12_000) });
  if (!res.ok) throw new Error(`${name}: ${res.status}`);
  return res.json();
}

let inflight: Promise<LiveState> | null = null;

/** Live "this week" data from Midweek Merchant's data branch, with the build snapshot as fallback. */
export function loadLive(): Promise<LiveState> {
  inflight ??= (async () => {
    try {
      const meta = await getJSON('meta.json');
      const ev = meta.events?.find((e: any) => e.gw === meta.next_gw);
      const base: LiveSnapshot = {
        fetchedAt: meta.exported_at ?? meta.generated_at ?? new Date().toISOString(),
        season: meta.season,
        nextGw: meta.next_gw ?? null,
        deadline: ev?.deadline ?? meta.deadline ?? null,
        picks: [],
      };
      if (base.nextGw == null) return classify(base, true);
      const players = await getJSON('players.json');
      return classify({ ...base, picks: captainShortlist(players, 5) }, true);
    } catch {
      return classify(snapshot, false);
    }
  })();
  return inflight;
}

export async function loadSeason(): Promise<{ gws: { gw: number; m: number; f: number }[]; live: boolean }> {
  try {
    const h = await getJSON(`hindcast_${snapshot.season}.json`);
    const gws = h.gameweeks.filter((g: any) => g.scores?.model != null).map((g: any) => ({ gw: g.gw, m: g.scores.model, f: g.scores.fpl_ep }));
    return { gws, live: true };
  } catch {
    return { gws: snapshot.currentGws, live: false };
  }
}

const asOf = (iso: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'Africa/Nairobi' }).format(new Date(iso));

/** One-line status used by the ticker strip. */
export function headline(s: LiveState): { lamp: string; text: string; sub: string } {
  const p = s.picks[0];
  const pick = p ? `${p.name.toUpperCase()} · ${p.xp.toFixed(1)} xPTS VS ${p.fx.replace('(', ' (')}` : '';
  switch (s.status) {
    case 'live':
      return { lamp: '● LIVE', text: `MIDWEEK MERCHANT · GW${s.nextGw} CAPTAIN PICK: ${pick}`, sub: `DEADLINE ${eatDeadline(s.deadline).toUpperCase()}` };
    case 'locked':
      return { lamp: '● LIVE', text: `MIDWEEK MERCHANT · GW${s.nextGw} LOCKED · CAPTAIN PICK WAS ${pick}`, sub: 'NEXT UPDATE WITHIN 6 H' };
    case 'off-season':
      return { lamp: '● OFF-SEASON', text: `MIDWEEK MERCHANT · LAST SEASON: MODEL ${snapshot.lastSeason.meanModel} VS FPL ${snapshot.lastSeason.meanFpl} PTS/GW`, sub: 'BACK FOR THE NEXT SEASON' };
    case 'fallback':
      return { lamp: `○ SNAPSHOT ${asOf(s.fetchedAt).toUpperCase()}`, text: `MIDWEEK MERCHANT · GW${s.nextGw} CAPTAIN PICK: ${pick}`, sub: `DEADLINE ${eatDeadline(s.deadline).toUpperCase()}` };
    default:
      return { lamp: `○ SNAPSHOT ${asOf(s.fetchedAt).toUpperCase()}`, text: `MIDWEEK MERCHANT · GW${s.nextGw} LOCKED`, sub: 'LIVE DATA UNAVAILABLE RIGHT NOW' };
  }
}

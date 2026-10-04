// Shared Midweek Merchant helpers. Plain TS (type-strippable) so the Node snapshot script can import it too.
export const MM_RAW = 'https://raw.githubusercontent.com/moses946/midweek-merchant/data/web/';

export interface Pick { name: string; team: string; pos: string; xp: number; fx: string; own: number | null }

export interface LiveSnapshot {
  fetchedAt: string;
  season: string;
  nextGw: number | null;
  deadline: string | null;
  picks: Pick[];
}

export interface SnapshotFile extends LiveSnapshot {
  lastSeason: { season: string; gameweeks: number; meanModel: number; meanFpl: number; winsVsFpl: number };
  currentGws: { gw: number; m: number; f: number }[];
}

interface RawPlayer { name: string; team: string; pos: string; status?: string; xp?: number[]; fx?: string[]; own?: number }

export function captainShortlist(players: RawPlayer[], n = 5): Pick[] {
  return players
    .filter((p) => Array.isArray(p.xp) && p.xp.length > 0 && p.status !== 'u')
    .sort((a, b) => (b.xp as number[])[0] - (a.xp as number[])[0])
    .slice(0, n)
    .map((p) => ({ name: p.name, team: p.team, pos: p.pos, xp: Math.round((p.xp as number[])[0] * 100) / 100, fx: p.fx?.[0] ?? '', own: p.own ?? null }));
}

export function formatPick(p: Pick): string {
  return `${p.name} · ${p.xp.toFixed(1)} xPts vs ${p.fx.replace('(', ' (')}`;
}

export function eatDeadline(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const day = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Nairobi', weekday: 'short', day: 'numeric', month: 'short' }).format(d);
  const time = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Nairobi', hour: '2-digit', minute: '2-digit' }).format(d);
  return `${day} ${time} EAT`;
}

export type LiveStatus = 'live' | 'locked' | 'off-season' | 'fallback' | 'fallback-locked';

export interface LiveState extends LiveSnapshot { status: LiveStatus }

/** Decide what the card should say for a snapshot, given the current time. */
export function classify(s: LiveSnapshot, fromNetwork: boolean, now = Date.now()): LiveState {
  if (s.nextGw == null) return { ...s, status: 'off-season' };
  const locked = s.deadline != null && Date.parse(s.deadline) <= now;
  if (fromNetwork) return { ...s, status: locked ? 'locked' : 'live' };
  return { ...s, status: locked ? 'fallback-locked' : 'fallback' };
}

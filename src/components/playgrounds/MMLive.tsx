import { useEffect, useState } from 'react';
import { classify, eatDeadline, type LiveState } from '../../lib/mm';
import { loadLive, loadSeason, snapshot } from '../../scripts/mmLive';

const STATUS: Record<LiveState['status'], string> = {
  live: 'LIVE FROM THE DATA BRANCH',
  locked: 'DEADLINE PASSED · NEXT UPDATE WITHIN 6 H',
  'off-season': 'OFF-SEASON',
  fallback: 'SNAPSHOT FROM THE LAST SITE BUILD',
  'fallback-locked': 'SNAPSHOT · LIVE DATA UNAVAILABLE',
};

export default function MMLive() {
  const [live, setLive] = useState<LiveState>(() => classify(snapshot, false));
  const [season, setSeason] = useState({ gws: snapshot.currentGws, live: false });

  useEffect(() => {
    let alive = true;
    loadLive().then((s) => alive && setLive(s));
    loadSeason().then((s) => alive && setSeason(s));
    return () => { alive = false; };
  }, []);

  const wins = season.gws.filter((g) => g.m > g.f).length;
  const avg = (k: 'm' | 'f') => (season.gws.length ? season.gws.reduce((s, g) => s + g[k], 0) / season.gws.length : 0);
  const max = Math.max(1, ...season.gws.flatMap((g) => [g.m, g.f]));
  const isLive = live.status === 'live' || live.status === 'locked';

  return (
    <div className="mmlive pg">
      <div className="mm-card">
        <p className={`pg-live${isLive ? '' : ' off'}`}><i aria-hidden="true" />{STATUS[live.status]}</p>
        {live.nextGw != null ? (
          <>
            <p className="pg-mono muted">GW{live.nextGw} · {live.season} · deadline {eatDeadline(live.deadline)}</p>
            <ol className="picks">
              {live.picks.slice(0, 3).map((p, i) => (
                <li key={p.name}>
                  <b>{i === 0 ? 'Captain: ' : ''}{p.name}</b>
                  <span className="pg-mono">{p.xp.toFixed(2)} xPts · {p.fx.replace('(', ' (')} · {p.pos}</span>
                </li>
              ))}
            </ol>
          </>
        ) : (
          <p>The season is over. Last season the blind XI averaged {snapshot.lastSeason.meanModel} points a week to FPL's {snapshot.lastSeason.meanFpl}.</p>
        )}
      </div>
      <div className="mm-card">
        <p className={`pg-live${season.live ? '' : ' off'}`}><i aria-hidden="true" />{season.live ? 'THIS SEASON, LIVE' : 'THIS SEASON · SNAPSHOT'}</p>
        {season.gws.length ? (
          <>
            <p className="big"><b>{avg('m').toFixed(1)}</b> vs <b>{avg('f').toFixed(1)}</b> points a week · beat FPL in {wins} of {season.gws.length}</p>
            <div className="bars" role="img" aria-label={`This season by gameweek: ${season.gws.map((g) => `GW${g.gw} model ${g.m}, FPL ${g.f}`).join('; ')}`}>
              {season.gws.map((g) => (
                <div className="gw" key={g.gw}>
                  <div className="pair">
                    <i style={{ height: `${(g.m / max) * 100}%`, background: 'var(--r-green)' }} title={`Model ${g.m}`} />
                    <i style={{ height: `${(g.f / max) * 100}%`, background: 'var(--ink)' }} title={`FPL ${g.f}`} />
                  </div>
                  <span className="pg-mono">{g.gw}</span>
                </div>
              ))}
            </div>
            <p className="pg-note">Green: model's blind XI. Ink: FPL's own pick. Gameweek numbers underneath.</p>
          </>
        ) : <p>No gameweeks scored yet this season.</p>}
      </div>
      <style>{`
        .mmlive { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; margin-top: 1em; }
        .mm-card { border: 1.5px solid var(--ink); border-radius: 12px; padding: 14px 16px; background: var(--paper-card); display: flex; flex-direction: column; gap: 8px; }
        .mmlive .muted { color: var(--ink-soft); }
        .mmlive .picks { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
        .mmlive .picks li { display: flex; flex-direction: column; border-top: 1px solid var(--grid-strong); padding-top: 6px; }
        .mmlive .big { font-size: 1rem; }
        .mmlive .big b { font-size: 1.5rem; font-variant-numeric: tabular-nums; }
        .mmlive .bars { display: flex; gap: 10px; align-items: end; height: 120px; padding-top: 6px; }
        .mmlive .gw { display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; flex: 1 1 0; max-width: 48px; }
        .mmlive .pair { flex: 1; width: 100%; display: flex; gap: 3px; align-items: end; }
        .mmlive .pair i { flex: 1; border-radius: 3px 3px 0 0; display: block; }
      `}</style>
    </div>
  );
}

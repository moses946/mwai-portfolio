import { useMemo, useState } from 'react';

type Player = { n: string; p: string; t: string; x: number; a: number | null };
type GW = { gw: number; m: number; f: number; fo: number; h: number; cap?: string | null; xi?: Player[] };
interface Props { season: { season: string; gws: GW[]; meanModel: number; meanFpl: number; winsVsFpl: number } }

const W = 640, H = 380, pad = { l: 44, r: 16, t: 16, b: 104 };

export default function FplRace({ season }: Props) {
  const gws = season.gws;
  const minGw = gws[0].gw, maxGw = gws[gws.length - 1].gw;
  const [sel, setSel] = useState(12);

  const series = useMemo(() => {
    const cum = (k: 'm' | 'f' | 'fo') => { let s = 0; return gws.map((g) => (s += g[k])); };
    return { m: cum('m'), f: cum('f'), fo: cum('fo') };
  }, [gws]);
  const yMax = Math.ceil(Math.max(...series.m) / 500) * 500;
  const xs = (gw: number) => pad.l + ((gw - minGw) / (maxGw - minGw)) * (W - pad.l - pad.r);
  const ys = (v: number) => pad.t + (1 - v / yMax) * (H - pad.t - pad.b);
  const diffTop = H - pad.b + 46, diffH = 48;
  const dMax = Math.max(...gws.map((g) => Math.abs(g.m - g.f)));
  const bw = (W - pad.l - pad.r) / gws.length - 2;
  const i = Math.max(0, gws.findIndex((g) => g.gw === sel));
  const g = gws[i];
  const lead = series.m[i] - series.f[i];
  const lx = Math.min(W - pad.r - 156, Math.max(pad.l + 4, xs(sel) + 8));
  const line = (k: 'm' | 'f' | 'fo') => series[k].map((v, j) => `${xs(gws[j].gw).toFixed(1)},${ys(v).toFixed(1)}`).join(' ');
  const rows: Record<string, Player[]> = { F: [], M: [], D: [], G: [] };
  (g.xi ?? []).forEach((p) => rows[p.p]?.push(p));

  return (
    <div className="pg fpl pg-split">
      <div className="pg-pad">
        <div className="legend pg-mono">
          <span><i style={{ background: 'var(--r-green)' }} />Model</span>
          <span><i style={{ background: 'var(--ink)' }} />FPL's expected points</span>
          <span><i style={{ background: 'var(--ink-faint)' }} />Form (last 4)</span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Cumulative points across ${season.season}. After gameweek ${sel}, the model is ${lead >= 0 ? 'ahead of' : 'behind'} FPL's pick by ${Math.abs(lead)} points.`}>
          {Array.from({ length: yMax / 500 + 1 }, (_, k) => k * 500).map((v) => (
            <g key={v}>
              <line x1={pad.l} x2={W - pad.r} y1={ys(v)} y2={ys(v)} stroke="var(--grid-strong)" />
              <text x={pad.l - 6} y={ys(v) + 4} textAnchor="end" fontSize="10" fill="var(--ink-soft)">{v}</text>
            </g>
          ))}
          {[minGw, 10, 19, 28, maxGw].map((x) => <text key={x} x={xs(x)} y={H - pad.b + 16} textAnchor="middle" fontSize="10" fill="var(--ink-soft)">GW{x}</text>)}
          <polyline points={line('fo')} fill="none" stroke="var(--ink-faint)" strokeWidth="2" strokeDasharray="4 4" />
          <polyline points={line('f')} fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" />
          <polyline points={line('m')} fill="none" stroke="var(--r-green)" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
          <text x={pad.l} y={diffTop - 8} fontSize="10" fill="var(--ink-soft)">Model minus FPL, each gameweek</text>
          <line x1={pad.l} x2={W - pad.r} y1={diffTop + diffH / 2} y2={diffTop + diffH / 2} stroke="var(--ink)" />
          {gws.map((gw) => {
            const d = gw.m - gw.f, h = Math.max(1, (Math.abs(d) / dMax) * (diffH / 2));
            return (
              <rect key={gw.gw} x={xs(gw.gw) - bw / 2} y={d >= 0 ? diffTop + diffH / 2 - h : diffTop + diffH / 2} width={bw} height={h}
                fill={d >= 0 ? 'var(--r-green)' : 'var(--bad)'} stroke={gw.gw === sel ? 'var(--ink)' : 'none'} strokeWidth="1.5"
                onClick={() => setSel(gw.gw)} style={{ cursor: 'pointer' }}><title>{`GW${gw.gw}: model ${gw.m}, FPL ${gw.f}`}</title></rect>
            );
          })}
          <line x1={xs(sel)} x2={xs(sel)} y1={pad.t} y2={diffTop + diffH} stroke="var(--ink)" strokeDasharray="2 3" />
          <circle cx={xs(sel)} cy={ys(series.f[i])} r="5" fill="var(--ink)" stroke="var(--paper-card)" strokeWidth="2" />
          <circle cx={xs(sel)} cy={ys(series.m[i])} r="5" fill="var(--r-green)" stroke="var(--paper-card)" strokeWidth="2" />
          <g fontSize="11">
            <rect x={lx} y={Math.max(2, ys(series.m[i]) - 34)} width="152" height="24" rx="5" fill="var(--paper-card)" stroke="var(--ink)" />
            <text x={lx + 8} y={Math.max(2, ys(series.m[i]) - 34) + 16} fill="var(--ink)">{lead >= 0 ? '+' : ''}{lead} pts vs FPL so far</text>
          </g>
        </svg>
      </div>
      <div className="pg-pad fpl-side">
        <div className="pg-stats">
          <div className="pg-stat"><span>Model</span><b>{g.m}</b></div>
          <div className="pg-stat"><span>FPL pick</span><b>{g.f}</b></div>
          <div className="pg-stat"><span>Form pick</span><b>{g.fo}</b></div>
        </div>
        <div className="pitch" aria-label={`The model's starting eleven for gameweek ${sel}`}>
          {(['F', 'M', 'D', 'G'] as const).map((k) => (
            <div className="line" key={k}>
              {rows[k].map((p) => (
                <div className="pl" key={p.n} title={`${p.n} · ${p.t} · ${p.x} xPts predicted`}>
                  <span className={`shirt${p.a == null ? ' blank' : ''}`}>{p.a ?? '–'}{g.cap === p.n && <span className="c" aria-label="captain">C</span>}</span>
                  <small>{p.n}</small>
                </div>
              ))}
            </div>
          ))}
        </div>
        <p className="pg-note">Shirts show actual points. C is the captain. Hindsight's best XI scored {g.h}.</p>
      </div>
      <div className="pg-foot scrub" style={{ gridColumn: '1 / -1' }}>
        <label htmlFor="fpl-gw" className="pg-mono">Gameweek</label>
        <input id="fpl-gw" type="range" min={minGw} max={maxGw} value={sel} onChange={(e) => setSel(Number(e.target.value))} />
        <output htmlFor="fpl-gw" className="pg-mono">GW{sel}</output>
      </div>
      <style>{`
        .fpl .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; margin-bottom: 6px; color: var(--ink-soft); }
        .fpl .legend i { display: inline-block; width: 18px; height: 3px; vertical-align: middle; margin-right: 6px; border-radius: 2px; }
        .fpl svg { width: 100%; height: auto; display: block; }
        .fpl-side { display: flex; flex-direction: column; gap: 10px; }
        .fpl .pitch { position: relative; border-radius: 10px; background: color-mix(in srgb, var(--r-green) 20%, var(--paper)); border: 1.5px solid var(--ink); padding: 12px 6px; display: flex; flex-direction: column; justify-content: space-around; gap: 6px; min-height: 330px; overflow: hidden; }
        .fpl .pitch::before { content: ""; position: absolute; left: 50%; top: 50%; width: 110px; height: 110px; border: 1.5px solid color-mix(in srgb, var(--ink) 30%, transparent); border-radius: 50%; transform: translate(-50%, -50%); }
        .fpl .pitch::after { content: ""; position: absolute; left: 0; right: 0; top: 50%; border-top: 1.5px solid color-mix(in srgb, var(--ink) 30%, transparent); }
        .fpl .line { display: flex; justify-content: space-evenly; gap: 2px; position: relative; z-index: 1; }
        .fpl .pl { display: flex; flex-direction: column; align-items: center; gap: 3px; min-width: 0; flex: 1 1 0; }
        .fpl .shirt { width: 34px; height: 34px; border-radius: 50%; background: var(--r-green); color: var(--ink-text); display: grid; place-items: center; font-weight: 800; font-size: .95rem; font-variant-numeric: tabular-nums; border: 1.5px solid var(--ink); position: relative; }
        .fpl .shirt.blank { background: var(--paper); }
        .fpl .shirt .c { position: absolute; top: -7px; right: -9px; background: var(--ink); color: var(--paper); font-size: .62rem; width: 17px; height: 17px; border-radius: 50%; display: grid; place-items: center; font-family: var(--font-mono); }
        .fpl .pl small { font-family: var(--font-mono); font-size: .62rem; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .fpl .scrub { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 12px; align-items: center; }
      `}</style>
    </div>
  );
}

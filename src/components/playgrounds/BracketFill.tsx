import { useMemo, useState } from 'react';

type Team = { code: string; name: string; pred: { stage: number; goals: number }; actual: { stage: number; goals: number } };
interface Props {
  data: {
    stages: string[]; champion: string; final: string;
    score: { exactStage: number; within1: number; teams: number; stageMAE: number; goalsMAE: number; baselineGoalsMAE: number; predChampion: string; semisHit: number };
    cv: { stageMAE: number; goalsRMSE: number };
    teams: Team[];
  };
}
type Mode = 'pred' | 'actual' | 'compare';
const SLOTS = [1, 1, 2, 4, 8, 16, 16];

export default function BracketFill({ data }: Props) {
  const [mode, setMode] = useState<Mode>('compare');
  const [run, setRun] = useState(0);
  const [selCode, setSelCode] = useState('ARG');

  // Rank order the fill used: predicted stage first, then predicted goals.
  const order = useMemo(() => [...data.teams].sort((a, b) => b.pred.stage - a.pred.stage || b.pred.goals - a.pred.goals || a.code.localeCompare(b.code)), [data.teams]);
  const rankOf = useMemo(() => new Map(order.map((t, i) => [t.code, i])), [order]);
  const key = mode === 'actual' ? 'actual' : 'pred';
  const tiers = [6, 5, 4, 3, 2, 1, 0].map((s) => ({
    stage: s,
    teams: data.teams.filter((t) => t[key].stage === s).sort((a, b) => (rankOf.get(a.code)! - rankOf.get(b.code)!)),
  }));
  const sel = data.teams.find((t) => t.code === selCode)!;
  const err = (t: Team) => t.actual.stage - t.pred.stage;
  const tone = (t: Team) => (mode !== 'compare' ? '' : err(t) === 0 ? 'hit' : Math.abs(err(t)) === 1 ? 'near' : 'miss');
  const s = data.score;

  return (
    <div className="pg bracket">
      <div className="pg-pad">
        <div className="pg-row bar">
          <div className="pg-row" role="group" aria-label="What to show">
            <button type="button" className="pg-btn" aria-pressed={mode === 'pred'} onClick={() => setMode('pred')}>My prediction</button>
            <button type="button" className="pg-btn" aria-pressed={mode === 'actual'} onClick={() => setMode('actual')}>What happened</button>
            <button type="button" className="pg-btn" aria-pressed={mode === 'compare'} onClick={() => setMode('compare')}>Compare</button>
          </div>
          <button type="button" className="pg-btn" onClick={() => { setMode('pred'); setRun((r) => r + 1); }}>Replay the fill</button>
        </div>
        {mode === 'compare' && (
          <p className="pg-note legend"><i className="hit" />exact stage <i className="near" />one stage off <i className="miss" />two or more off · ↑ went further than predicted, ↓ went out earlier</p>
        )}
        <div className="tiers" key={`${mode}-${run}`}>
          {tiers.map((tier) => (
            <div className="tier" key={tier.stage}>
              <span className="pg-mono label">{data.stages[tier.stage]}<em>{SLOTS[6 - tier.stage]} slot{SLOTS[6 - tier.stage] > 1 ? 's' : ''}</em></span>
              <div className="chips-row">
                {tier.teams.map((t) => {
                  const e = err(t);
                  return (
                    <button key={t.code} type="button" className={`team ${tone(t)}${t.code === selCode ? ' sel' : ''}`}
                      style={{ animationDelay: `${(rankOf.get(t.code) ?? 0) * 28}ms` }}
                      onClick={() => setSelCode(t.code)} aria-label={`${t.code} ${t.name}: predicted ${data.stages[t.pred.stage]}, actual ${data.stages[t.actual.stage]}`}>
                      {t.code}{mode === 'compare' && e !== 0 && <sup aria-hidden="true">{e > 0 ? '↑' : '↓'}</sup>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="pg-split lower">
        <div className="pg-pad">
          <p className="pg-mono muted">SCORECARD · 2026 RESULTS</p>
          <div className="pg-stats">
            <div className="pg-stat"><span>Exact stage</span><b>{s.exactStage}/{s.teams}</b></div>
            <div className="pg-stat"><span>Within one stage</span><b>{s.within1}/{s.teams}</b></div>
            <div className="pg-stat"><span>Stage error</span><b>{s.stageMAE}</b></div>
            <div className="pg-stat"><span>Goals error / team</span><b>{s.goalsMAE}</b></div>
          </div>
          <p className="pg-note">Cross-validation expected {data.cv.stageMAE} stages of error. A naive "everyone scores the average" guess misses goals by {s.baselineGoalsMAE}. Champion: {data.final}; my pick was {s.predChampion}.</p>
        </div>
        <div className="pg-pad team-card">
          <p className="pg-mono muted">{sel.name.toUpperCase()}</p>
          <div className="pg-stats">
            <div className="pg-stat"><span>Predicted</span><b>{data.stages[sel.pred.stage]}</b></div>
            <div className="pg-stat"><span>Actual</span><b>{data.stages[sel.actual.stage]}</b></div>
            <div className="pg-stat"><span>Goals predicted</span><b>{sel.pred.goals}</b></div>
            <div className="pg-stat"><span>Goals scored</span><b>{sel.actual.goals}</b></div>
          </div>
          <p className="pg-note">Pick any team above to compare.</p>
        </div>
      </div>
      <style>{`
        .bracket .bar { justify-content: space-between; }
        .bracket .legend { margin-top: 10px; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
        .bracket .legend i { display: inline-block; width: 12px; height: 12px; border: 1.5px solid var(--ink); border-radius: 3px; margin-left: 8px; }
        .bracket .tiers { margin-top: 14px; display: grid; gap: 6px; }
        .bracket .tier { display: grid; grid-template-columns: 130px minmax(0, 1fr); gap: 12px; align-items: center; padding: 6px 0; border-top: 1px dashed var(--grid-strong); }
        .bracket .label { display: flex; flex-direction: column; }
        .bracket .label em { font-style: normal; color: var(--ink-faint); font-size: .7rem; }
        .bracket .chips-row { display: flex; flex-wrap: wrap; gap: 5px; }
        .bracket .team { font-family: var(--font-mono); font-size: .76rem; padding: 4px 7px; border: 1.5px solid var(--ink); border-radius: 6px; background: var(--paper); animation: drop .45s cubic-bezier(.3,1.4,.5,1) both; position: relative; }
        .bracket .team sup { font-size: .7rem; margin-left: 2px; }
        .bracket .team.sel { outline: 2.5px solid var(--ink); outline-offset: 1px; }
        .bracket .team.hit, .bracket .legend .hit { background: var(--ok); color: var(--ink-text); }
        .bracket .team.near, .bracket .legend .near { background: var(--r-yellow); }
        .bracket .team.miss, .bracket .legend .miss { background: var(--r-pink); color: var(--ink-text); }
        @keyframes drop { from { opacity: 0; transform: translateY(-14px); } }
        .bracket .lower { border-top: 1.5px solid var(--ink); }
        .bracket .muted { color: var(--ink-soft); }
        .bracket .team-card .pg-stat b { font-size: 1.05rem; }
        @media (max-width: 640px) { .bracket .tier { grid-template-columns: minmax(0, 1fr); gap: 4px; } }
      `}</style>
    </div>
  );
}

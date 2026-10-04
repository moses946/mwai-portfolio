import { useMemo, useState } from 'react';

const SAMPLE = `Photosynthesis is how green plants make food. Chlorophyll in the chloroplasts absorbs light energy. In the light stage, water is split and oxygen is released. The light stage produces ATP and NADPH. In the dark stage, carbon dioxide is fixed into glucose using ATP and NADPH. Glucose is stored as starch. The rate of photosynthesis depends on light intensity, carbon dioxide concentration and temperature.`;

/** Hand-checked map for the sample, standing in for Tutilo's AI output. */
const SAMPLE_MAP = {
  center: 'Photosynthesis',
  nodes: ['Chlorophyll', 'Light stage', 'Dark stage', 'Glucose', 'ATP + NADPH', 'Oxygen', 'Limiting factors'],
  edges: [['Photosynthesis', 'Chlorophyll'], ['Photosynthesis', 'Light stage'], ['Photosynthesis', 'Dark stage'], ['Photosynthesis', 'Limiting factors'], ['Light stage', 'Oxygen'], ['Light stage', 'ATP + NADPH'], ['ATP + NADPH', 'Dark stage'], ['Dark stage', 'Glucose']] as [string, string][],
  cards: [
    { q: 'Which stage of photosynthesis releases oxygen?', a: 'The light stage, when water is split.' },
    { q: 'What does the dark stage use to fix carbon dioxide into glucose?', a: 'ATP and NADPH from the light stage.' },
    { q: 'Name three factors that limit the rate of photosynthesis.', a: 'Light intensity, carbon dioxide concentration and temperature.' },
  ],
};

const STOP = new Set('a an the and or of in on at to is are was were be been it its as by for with from this that these those into using used how which what when where who why can will than then there their they them also not but such each other more most some any all into out up down over under same so our your his her'.split(' '));

/** Simple local extraction: frequent terms, linked when they share a sentence. */
function localMap(text: string) {
  const sentences = text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  const words = (s: string) => s.toLowerCase().match(/[a-z][a-z-]{3,}/g)?.filter((w) => !STOP.has(w)) ?? [];
  const freq = new Map<string, number>();
  sentences.forEach((s) => new Set(words(s)).forEach((w) => freq.set(w, (freq.get(w) ?? 0) + 1)));
  const top = [...freq.entries()].sort((a, b) => b[1] - a[1] || b[0].length - a[0].length).slice(0, 8).map(([w]) => w);
  if (top.length < 2) return null;
  const cap = (w: string) => w[0].toUpperCase() + w.slice(1);
  const [center, ...rest] = top;
  const edges: [string, string][] = [];
  for (let i = 0; i < top.length; i++) for (let j = i + 1; j < top.length; j++) {
    if (sentences.some((s) => { const ws = words(s); return ws.includes(top[i]) && ws.includes(top[j]); })) edges.push([cap(top[i]), cap(top[j])]);
  }
  rest.forEach((w) => { if (!edges.some((e) => e.includes(cap(w)))) edges.push([cap(center), cap(w)]); });
  const cards = sentences.filter((s) => rest.some((w) => s.toLowerCase().includes(w))).slice(0, 3).map((s) => {
    const w = rest.find((x) => s.toLowerCase().includes(x))!;
    return { q: s.replace(new RegExp(w, 'i'), '_____'), a: cap(w) };
  });
  return { center: cap(center), nodes: rest.map(cap), edges: edges.slice(0, 14), cards };
}

export default function ConceptMap() {
  const [text, setText] = useState(SAMPLE);
  const [mapped, setMapped] = useState(SAMPLE);
  const [run, setRun] = useState(0);
  const [flip, setFlip] = useState<number | null>(null);
  const map = useMemo(() => (mapped.trim() === SAMPLE.trim() ? SAMPLE_MAP : localMap(mapped)), [mapped]);
  const isSample = mapped.trim() === SAMPLE.trim();

  const W = 560, H = 360, cx = W / 2, cy = H / 2;
  const pos = new Map<string, [number, number]>();
  if (map) {
    pos.set(map.center, [cx, cy]);
    map.nodes.forEach((n, i) => { const a = (i / map.nodes.length) * Math.PI * 2 - Math.PI / 2; pos.set(n, [cx + Math.cos(a) * 205, cy + Math.sin(a) * 128]); });
  }

  return (
    <div className="pg cmap pg-split">
      <div className="pg-pad left">
        <label htmlFor="cmap-notes" className="pg-mono muted">YOUR NOTES (PASTE ANY PARAGRAPH)</label>
        <textarea id="cmap-notes" value={text} onChange={(e) => setText(e.target.value)} rows={9} />
        <div className="pg-row">
          <button type="button" className="pg-btn accent" onClick={() => { setMapped(text); setRun((r) => r + 1); setFlip(null); }}>Map my notes</button>
          {!isSample && <button type="button" className="pg-btn" onClick={() => { setText(SAMPLE); setMapped(SAMPLE); setRun((r) => r + 1); }}>Back to the sample</button>}
        </div>
        <p className="pg-note">{isSample ? 'Sample: a KCSE Biology topic, mapped by hand the way Tutilo maps a lecture.' : 'Mapped in your browser by keyword frequency and co-occurrence. Tutilo itself uses an AI model and understands far more than this.'}</p>
        {map && map.cards.length > 0 && (
          <div className="cards">
            <p className="pg-mono muted">FLASHCARDS · TAP TO FLIP</p>
            {map.cards.map((c, i) => (
              <button key={`${run}-${i}`} type="button" className={`card${flip === i ? ' flipped' : ''}`} onClick={() => setFlip(flip === i ? null : i)} aria-pressed={flip === i}>
                {flip === i ? <><span className="pg-mono">ANSWER</span> {c.a}</> : c.q}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="pg-pad">
        {map ? (
          <svg viewBox={`0 0 ${W} ${H}`} key={run} role="img" aria-label={`Concept map centred on ${map.center}, linked to ${map.nodes.join(', ')}`}>
            {map.edges.map(([a, b], i) => {
              const p = pos.get(a), q = pos.get(b);
              if (!p || !q) return null;
              return <line key={i} className="e" x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} style={{ animationDelay: `${300 + i * 60}ms` }} />;
            })}
            {[map.center, ...map.nodes].map((n, i) => {
              const [x, y] = pos.get(n)!;
              const w = Math.max(70, n.length * 8.2 + 22);
              return (
                <g key={n} className="n" style={{ animationDelay: `${i * 90}ms`, transformOrigin: `${x}px ${y}px` }}>
                  <rect x={x - w / 2} y={y - 16} width={w} height={32} rx={16} fill={i === 0 ? 'var(--r-orange)' : 'var(--paper-card)'} stroke="var(--ink)" strokeWidth="1.5" />
                  <text x={x} y={y + 4.5} textAnchor="middle" fontSize="12.5" fontWeight={i === 0 ? 700 : 500} fill="var(--ink)">{n}</text>
                </g>
              );
            })}
          </svg>
        ) : <p>Add a few more sentences so there's something to map.</p>}
      </div>
      <style>{`
        .cmap .left { display: flex; flex-direction: column; gap: 10px; }
        .cmap textarea { width: 100%; font: inherit; font-size: .9rem; line-height: 1.5; padding: 10px 12px; border: 1.5px solid var(--ink); border-radius: 10px; background: var(--paper); color: var(--ink); resize: vertical; }
        .cmap .muted { color: var(--ink-soft); }
        .cmap svg { width: 100%; height: auto; display: block; }
        .cmap svg text { font-family: var(--font-display); }
        .cmap .e { stroke: var(--ink); stroke-width: 1.5; animation: e-in .5s ease both; }
        .cmap .n { animation: n-in .5s cubic-bezier(.3,1.5,.5,1) both; }
        @keyframes n-in { from { opacity: 0; transform: scale(.3); } }
        @keyframes e-in { from { opacity: 0; } }
        .cmap .cards { display: grid; gap: 6px; }
        .cmap .card { text-align: left; font: inherit; font-size: .88rem; padding: 10px 12px; border: 1.5px solid var(--ink); border-radius: 10px; background: var(--paper); }
        .cmap .card.flipped { background: var(--r-orange); color: var(--ink-text); }
      `}</style>
    </div>
  );
}

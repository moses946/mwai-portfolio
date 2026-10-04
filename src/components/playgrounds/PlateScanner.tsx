import { useEffect, useRef, useState } from 'react';

type Food = { name: string; gi: number; carbsPer100g: number; grams: number; max: number };
type Meal = { id: string; name: string; foods: Food[] };
interface Props { data: { label: string; note: string; defaultThreshold: number; meals: Meal[] } }

const gl = (f: Food, grams: number) => (f.gi * (f.carbsPer100g * grams / 100)) / 100;
const band = (v: number) => (v <= 10 ? 'low' : v < 20 ? 'medium' : 'high');

/** Hand-drawn style plates: a few blobs per food, positioned per meal. */
const SHAPES: Record<string, { cx: number; cy: number; r: number; fill: string; speck?: string }[]> = {
  Ugali: [{ cx: 92, cy: 104, r: 38, fill: '#F4EFD9' }],
  'Sukuma wiki': [{ cx: 150, cy: 78, r: 26, fill: '#3E7D3A', speck: '#5FA052' }],
  'Beef stew': [{ cx: 148, cy: 136, r: 28, fill: '#8A4426', speck: '#B5643A' }],
  Chapati: [{ cx: 96, cy: 100, r: 42, fill: '#D9A85B', speck: '#B9873E' }],
  'Bean stew': [{ cx: 154, cy: 120, r: 32, fill: '#7B2E2E', speck: '#A04848' }],
  Githeri: [{ cx: 104, cy: 108, r: 44, fill: '#E9C547', speck: '#8E3A2E' }],
  Avocado: [{ cx: 160, cy: 84, r: 20, fill: '#9BC25B', speck: '#C8DB8A' }],
  Pilau: [{ cx: 100, cy: 108, r: 44, fill: '#A86B34', speck: '#6B3F1C' }],
  Kachumbari: [{ cx: 162, cy: 86, r: 20, fill: '#E5463C', speck: '#F7F2E6' }],
};

function Plate({ meal, scanning, found, small = false }: { meal: Meal; scanning?: boolean; found?: boolean; small?: boolean }) {
  return (
    <svg viewBox="0 0 220 220" className={`plate${scanning ? ' scanning' : ''}`} aria-hidden={small ? true : undefined} role={small ? undefined : 'img'} aria-label={small ? undefined : `Illustration of ${meal.name}`}>
      <circle cx="110" cy="110" r="100" fill="#FBFBF7" stroke="var(--ink)" strokeWidth="2" />
      <circle cx="110" cy="110" r="78" fill="none" stroke="var(--grid-strong)" strokeWidth="2" />
      {meal.foods.flatMap((f) => (SHAPES[f.name] ?? []).map((s, k) => (
        <g key={f.name + k}>
          <ellipse cx={s.cx} cy={s.cy} rx={s.r} ry={s.r * 0.86} fill={s.fill} stroke="var(--ink)" strokeWidth="1.5" />
          {s.speck && Array.from({ length: 7 }, (_, j) => <circle key={j} cx={s.cx + Math.cos(j * 2.4) * s.r * 0.5} cy={s.cy + Math.sin(j * 2.4) * s.r * 0.42} r={2.6} fill={s.speck} />)}
          {found && !small && (
            <g className="tag">
              <rect x={s.cx - s.r} y={s.cy - s.r * 0.86} width={s.r * 2} height={s.r * 1.72} fill="none" stroke="var(--r-red)" strokeWidth="2" strokeDasharray="5 3" rx="4" />
              <rect x={s.cx - s.r} y={s.cy - s.r * 0.86 - 15} width={f.name.length * 6.4 + 10} height="14" fill="var(--r-red)" rx="2" />
              <text x={s.cx - s.r + 5} y={s.cy - s.r * 0.86 - 4.5} fontSize="9.5" fill="var(--ink-text)">{f.name}</text>
            </g>
          )}
        </g>
      )))}
      {scanning && <rect className="beam" x="10" y="10" width="200" height="6" fill="var(--r-red)" opacity=".65" />}
    </svg>
  );
}

export default function PlateScanner({ data }: Props) {
  const [mealId, setMealId] = useState(data.meals[0].id);
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'done'>('done');
  const [grams, setGrams] = useState<Record<string, number>>({});
  const [threshold, setThreshold] = useState(data.defaultThreshold);
  const timer = useRef<number | undefined>(undefined);
  const meal = data.meals.find((m) => m.id === mealId)!;

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const choose = (id: string) => {
    setMealId(id);
    setGrams({});
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    setPhase('scanning');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setPhase('done'), reduced ? 0 : 1300);
  };

  const g = (f: Food) => grams[`${mealId}:${f.name}`] ?? f.grams;
  const total = meal.foods.reduce((s, f) => s + gl(f, g(f)), 0);
  const over = total > threshold;
  const b = band(total);
  const angle = Math.min(1, total / 60) * 180;

  return (
    <div className="pg plates">
      <div className="pg-split">
        <div className="pg-pad left">
          <div className="pg-row" role="group" aria-label="Choose a meal">
            {data.meals.map((m) => (
              <button key={m.id} type="button" className={`meal-btn${m.id === mealId ? ' on' : ''}`} aria-pressed={m.id === mealId} onClick={() => choose(m.id)}>
                <Plate meal={m} small />
                <span>{m.name}</span>
              </button>
            ))}
          </div>
          <div className="stage">
            <Plate meal={meal} scanning={phase === 'scanning'} found={phase === 'done'} />
            <p className="pg-mono status" aria-live="polite">{phase === 'scanning' ? 'Scanning… recognising foods and estimating portions' : `${meal.foods.length} foods recognised`}</p>
          </div>
        </div>
        <div className="pg-pad right">
          <div className={`gauge ${b}`}>
            <svg viewBox="0 0 200 116" role="img" aria-label={`Meal glycemic load ${total.toFixed(0)}, ${b}`}>
              <path d="M20 100a80 80 0 0 1 160 0" fill="none" stroke="var(--grid-strong)" strokeWidth="16" />
              <path d="M20 100a80 80 0 0 1 160 0" fill="none" stroke={over ? 'var(--bad)' : 'var(--ok)'} strokeWidth="16" pathLength={180} strokeDasharray={`${phase === 'done' ? angle : 0} 180`} style={{ transition: 'stroke-dasharray .6s ease' }} />
              {(() => { const t = Math.min(1, threshold / 60) * Math.PI, c = -Math.cos(t), s = Math.sin(t); return <line x1={100 + c * 68} y1={100 - s * 68} x2={100 + c * 94} y2={100 - s * 94} stroke="var(--ink)" strokeWidth="3" />; })()}
              <text x="100" y="86" textAnchor="middle" fontSize="28" fontWeight="700" fill="var(--ink)">{phase === 'done' ? total.toFixed(0) : '…'}</text>
              <text x="100" y="104" textAnchor="middle" fontSize="10" fill="var(--ink-soft)">MEAL GL · {b.toUpperCase()}</text>
            </svg>
            <p className={`verdict ${over ? 'bad' : 'ok'}`}>{over ? `Over your threshold of ${threshold}` : `Within your threshold of ${threshold}`}</p>
          </div>
          <div className="foods">
            {meal.foods.map((f) => {
              const v = g(f), id = `g-${mealId}-${f.name.replace(/\W/g, '')}`;
              return (
                <div className="food" key={f.name}>
                  <div className="ft"><b>{f.name}</b><span className="pg-mono">GL {gl(f, v).toFixed(1)}</span></div>
                  <label htmlFor={id} className="pg-mono muted">{v} g · GI {f.gi} · {(f.carbsPer100g * v / 100).toFixed(0)} g carbs</label>
                  <input id={id} type="range" min={0} max={f.max} step={10} value={v} onChange={(e) => setGrams((s) => ({ ...s, [`${mealId}:${f.name}`]: Number(e.target.value) }))} />
                </div>
              );
            })}
          </div>
          <div className="food thr">
            <label htmlFor="gl-threshold" className="pg-mono">Your GL threshold per meal: {threshold}</label>
            <input id="gl-threshold" type="range" min={5} max={40} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} />
          </div>
        </div>
      </div>
      <p className="pg-foot pg-note">{data.note} GL = GI × carbohydrate (g) ÷ 100. Bands: low ≤ 10, medium 11–19, high ≥ 20.</p>
      <style>{`
        .plates .meal-btn { display: flex; align-items: center; gap: 8px; padding: 6px 10px 6px 6px; border: 1.5px solid var(--ink); border-radius: 999px; background: var(--paper); font: inherit; font-size: .82rem; text-align: left; }
        .plates .meal-btn svg { width: 34px; height: 34px; flex: none; }
        .plates .meal-btn.on { background: var(--r-red); color: var(--ink-text); }
        .plates .stage { margin-top: 14px; display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .plates .stage .plate { width: min(320px, 100%); height: auto; }
        .plates .beam { animation: beam 1.2s ease-in-out infinite; }
        @keyframes beam { 0% { transform: translateY(0); } 50% { transform: translateY(196px); } 100% { transform: translateY(0); } }
        .plates .tag { animation: tag-in .35s ease both; }
        @keyframes tag-in { from { opacity: 0; } }
        .plates .status { color: var(--ink-soft); }
        .plates .right { display: flex; flex-direction: column; gap: 14px; }
        .plates .gauge svg { width: 100%; max-width: 280px; display: block; margin: 0 auto; }
        .plates .verdict { text-align: center; font-weight: 700; }
        .plates .verdict.bad { color: var(--bad); }
        .plates .verdict.ok { color: #00733F; }
        .plates .foods { display: grid; gap: 10px; }
        .plates .food { border: 1.5px solid var(--ink); border-radius: 8px; padding: 8px 10px; background: var(--paper); display: grid; gap: 4px; }
        .plates .ft { display: flex; justify-content: space-between; gap: 8px; }
        .plates .muted { color: var(--ink-soft); }
        .plates .thr { border-style: dashed; }
      `}</style>
    </div>
  );
}

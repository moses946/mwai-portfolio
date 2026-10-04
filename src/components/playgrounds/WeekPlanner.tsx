import { useEffect, useMemo, useState } from 'react';
import { recommendForWeek, type DailyForecast, type Garment, type GarmentCategory, type WeatherCondition, type DayRecommendation } from '../../lib/outfit-recommender/index';

const DAY = 864e5;
const iso = (d: Date) => d.toISOString().slice(0, 10);
const ago = (today: Date, days: number | null) => (days == null ? null : new Date(today.getTime() - days * DAY).toISOString());

type Seed = [id: string, name: string, cat: GarmentCategory, color: string, tags: string[], wornDaysAgo: number | null, status?: Garment['status']];
const WARDROBE: Seed[] = [
  ['t1', 'White linen shirt', 'tops', 'white', ['linen'], 2],
  ['t2', 'Navy polo', 'tops', 'navy', ['cotton'], 12],
  ['t3', 'Grey tee', 'tops', 'grey', ['cotton'], null],
  ['t4', 'Black knit', 'tops', 'black', ['wool'], 20],
  ['t5', 'Olive overshirt', 'tops', 'olive', ['cotton'], 6],
  ['t6', 'Red tee', 'tops', 'red', ['cotton'], 30, 'laundry'],
  ['b1', 'Beige chinos', 'bottoms', 'beige', ['cotton'], 4],
  ['b2', 'Dark denim', 'bottoms', 'navy', [], 9],
  ['b3', 'Black trousers', 'bottoms', 'black', [], 15],
  ['b4', 'Grey joggers', 'bottoms', 'grey', ['fleece'], null],
  ['d1', 'Kitenge dress', 'dresses', 'orange', ['cotton'], 25],
  ['o1', 'Rain jacket', 'outerwear', 'navy', ['waterproof'], 40],
  ['o2', 'Wool coat', 'outerwear', 'charcoal', ['wool'], 60],
  ['s1', 'White sneakers', 'shoes', 'white', [], 1],
  ['s2', 'Brown boots', 'shoes', 'brown', ['waterproof'], 10],
  ['s3', 'Black loafers', 'shoes', 'black', [], 18],
];
const HEX: Record<string, string> = { white: '#F7F7F2', navy: '#24345E', grey: '#9AA0A6', black: '#1F2125', olive: '#6B7340', red: '#D8423C', beige: '#D8C3A0', orange: '#F07A2C', charcoal: '#3C4046', brown: '#7A4A2A' };

function buildWardrobe(today: Date): Garment[] {
  return WARDROBE.map(([id, name, category, color, tags, worn, status]) => ({
    id, name, category, color, tags, status: status ?? 'active', wearCount: worn == null ? 0 : 3,
    lastWornAt: ago(today, worn), lastSkippedAt: null, skipUntil: null, deletedAt: null, imageUrl: '',
    createdAt: new Date(today.getTime() - 90 * DAY).toISOString(),
  }));
}

function wmo(code: number): WeatherCondition {
  if (code >= 95) return 'thunderstorm';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rainy';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snowy';
  if (code >= 2) return 'cloudy';
  return 'clear';
}

/** Typical early-October Nairobi week, used when the live forecast can't be reached. */
function typicalWeek(today: Date): DailyForecast[] {
  const max = [25, 26, 24, 22, 23, 26, 27], cond: WeatherCondition[] = ['clear', 'cloudy', 'rainy', 'rainy', 'cloudy', 'clear', 'clear'];
  return max.map((m, i) => ({ date: iso(new Date(today.getTime() + i * DAY)), tempMax: m, tempMin: 13, condition: cond[i], pop: cond[i] === 'rainy' ? 70 : 10 }));
}

const SCENARIOS: Record<string, { label: string; make: (base: DailyForecast[]) => DailyForecast[] }> = {
  live: { label: 'Nairobi forecast', make: (b) => b },
  cold: { label: 'Cold snap', make: (b) => b.map((d, i) => ({ ...d, tempMax: 8 + (i % 3), tempMin: 3, condition: i % 3 === 1 ? 'rainy' : 'cloudy' })) },
  heat: { label: 'Heatwave', make: (b) => b.map((d) => ({ ...d, tempMax: 31, tempMin: 20, condition: 'clear' })) },
  rain: { label: 'Rainy week', make: (b) => b.map((d) => ({ ...d, tempMax: 18, tempMin: 12, condition: 'rainy', pop: 90 })) },
};

const ICON: Record<WeatherCondition, string> = { clear: '☀', cloudy: '☁', rainy: '☂', snowy: '❄', windy: '≋', thunderstorm: '⚡' };

function GarmentIcon({ g, size = 40 }: { g: Garment; size?: number }) {
  const c = HEX[g.color] ?? '#ccc';
  const p: Record<string, string> = {
    tops: 'M12 8l8-4h8l8 4 6 8-6 4-2-3v23H14V17l-2 3-6-4z',
    bottoms: 'M14 4h20l2 40h-8l-4-28-4 28h-8z',
    dresses: 'M18 4h12l2 8 8 32H8l8-32z',
    outerwear: 'M10 8l9-4 5 6 5-6 9 4 4 36h-9V20l-1 24H16l-1-24v24H6z',
    shoes: 'M4 30c8 0 12-10 16-10s4 6 12 8 12 4 12 8v4H4z',
    accessories: 'M24 8a14 14 0 1 0 0.1 0z',
    other: 'M8 8h32v32H8z',
  };
  return <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true"><path d={p[g.category]} fill={c} stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" /></svg>;
}

const midnight = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };

/** `initialDate` (from the build) keeps the server render and first client render identical. */
export default function WeekPlanner({ initialDate }: { initialDate: string }) {
  const [today, setToday] = useState(() => new Date(`${initialDate}T00:00:00`));
  useEffect(() => { const t = midnight(new Date()); if (iso(t) !== iso(today)) setToday(t); }, []);
  const [base, setBase] = useState<DailyForecast[]>(() => typicalWeek(today));
  const [live, setLive] = useState<'loading' | 'live' | 'typical'>('loading');
  useEffect(() => { if (live !== 'live') setBase(typicalWeek(today)); }, [today]);
  const [scenario, setScenario] = useState('live');
  const [dayIdx, setDayIdx] = useState(0);
  const [swaps, setSwaps] = useState<Record<string, Record<string, string>>>({});
  const garments = useMemo(() => buildWardrobe(today), [today]);
  const byId = useMemo(() => new Map(garments.map((g) => [g.id, g])), [garments]);

  useEffect(() => {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=-1.2864&longitude=36.8172&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&timezone=Africa%2FNairobi&forecast_days=7';
    fetch(url, { signal: AbortSignal.timeout(8000) })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((j) => {
        const d = j.daily;
        setBase(d.time.map((t: string, i: number) => ({ date: t, tempMax: Math.round(d.temperature_2m_max[i]), tempMin: Math.round(d.temperature_2m_min[i]), condition: wmo(d.weather_code[i]), pop: d.precipitation_probability_max?.[i] ?? 0 })));
        setLive('live');
      })
      .catch(() => setLive('typical'));
  }, []);

  const forecasts = useMemo(() => SCENARIOS[scenario].make(base), [scenario, base]);
  const plan = useMemo(() => {
    const map = new Map(forecasts.map((f) => [f.date, f]));
    return recommendForWeek({ dates: forecasts.map((f) => f.date), garments, forecasts: map, today });
  }, [forecasts, garments, today]);
  useEffect(() => setSwaps({}), [scenario, base]);

  const f = forecasts[dayIdx];
  const rec = plan.get(f.date) as DayRecommendation | null | undefined;
  const outfitIds = (rec?.outfitIds ?? []).map((id) => swaps[f.date]?.[byId.get(id)!.category] ?? id);
  const weekday = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' });
  const bd = rec?.breakdown;

  return (
    <div className="pg week">
      <div className="pg-pad">
        <div className="pg-row top">
          <span className={`pg-live${live === 'live' && scenario === 'live' ? '' : ' off'}`}><i aria-hidden="true" />{live === 'loading' ? 'FETCHING FORECAST…' : live === 'live' ? 'LIVE OPEN-METEO FORECAST' : 'TYPICAL WEEK (FORECAST UNAVAILABLE)'}</span>
          <div className="pg-row" role="group" aria-label="Weather scenario">
            {Object.entries(SCENARIOS).map(([k, s]) => <button key={k} type="button" className="pg-btn" aria-pressed={scenario === k} onClick={() => setScenario(k)}>{s.label}</button>)}
          </div>
        </div>
        <div className="days" role="tablist" aria-label="Days of the week">
          {forecasts.map((d, i) => {
            const r = plan.get(d.date);
            return (
              <button key={d.date} type="button" role="tab" aria-selected={i === dayIdx} className={`day${i === dayIdx ? ' on' : ''}`} onClick={() => setDayIdx(i)}>
                <span className="pg-mono">{weekday(d.date)}</span>
                <span className="wx" aria-label={d.condition}>{ICON[d.condition]}</span>
                <span className="pg-mono">{d.tempMax}°</span>
                <span className="mini">{(r?.outfitIds ?? []).map((id) => { const g = byId.get(swaps[d.date]?.[byId.get(id)!.category] ?? id)!; return <GarmentIcon key={g.id} g={g} size={22} />; })}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="pg-split detail">
        <div className="pg-pad">
          <p className="pg-mono muted">{weekday(f.date)} · {f.tempMin}–{f.tempMax}°C · {f.condition}{f.pop ? ` · ${f.pop}% rain` : ''}</p>
          {rec ? (
            <ul className="outfit">
              {outfitIds.map((id) => {
                const g = byId.get(id)!;
                const alts = rec.deck.map((x) => byId.get(x)!).filter((x) => x.category === g.category && x.id !== g.id).slice(0, 3);
                return (
                  <li key={id}>
                    <GarmentIcon g={g} size={52} />
                    <div><b>{g.name}</b><span className="pg-mono muted">{g.category}{g.tags.length ? ` · ${g.tags.join(', ')}` : ''}</span></div>
                    <div className="alts" aria-label={`Swap ${g.name}`}>
                      {alts.map((a) => <button key={a.id} type="button" className="alt" title={`Swap in ${a.name}`} aria-label={`Swap in ${a.name}`} onClick={() => setSwaps((s) => ({ ...s, [f.date]: { ...(s[f.date] ?? {}), [g.category]: a.id } }))}><GarmentIcon g={a} size={26} /></button>)}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : <p>Nothing suitable is clean for this weather.</p>}
          <p className="pg-note">The red tee is in the laundry, so the engine never suggests it. Tap a small icon to swap a piece.</p>
        </div>
        <div className="pg-pad">
          <p className="pg-mono muted">WHY THIS OUTFIT · SCORE {rec ? rec.score.toFixed(2) : '–'}</p>
          {bd && (
            <div className="bars">
              {([
                ['Recency', bd.garments.recency, '30%'], ['Weather fit', bd.garments.weatherFit, '30%'], ['Variety', bd.garments.variety, '15%'],
                ['Freshness', bd.garments.freshness, '10%'], ['Tag fit', bd.garments.tagFit, '10%'], ['Neutral colour', bd.garments.colorNeutral, '5%'],
                ['Outfit cohesion', (bd.cohesion.completeness + bd.cohesion.colorHarmony + bd.cohesion.outerwearFit + bd.cohesion.categoryCoverage) / 4, 'outfit'],
              ] as [string, number, string][]).map(([k, v, w]) => (
                <div className="bar" key={k}>
                  <span className="pg-mono">{k} <em>{w}</em></span>
                  <span className="track"><i style={{ width: `${Math.round(Math.max(0, Math.min(1, v)) * 100)}%` }} /></span>
                  <span className="pg-mono">{v.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
          <p className="pg-note">Weights from FitWeek's garmentScorer. No AI model involved: same wardrobe and weather, same answer.</p>
        </div>
      </div>
      <style>{`
        .week .top { justify-content: space-between; }
        .week .days { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 8px; margin-top: 12px; }
        .week .day { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 8px 4px; border: 1.5px solid var(--ink); border-radius: 10px; background: var(--paper); font: inherit; min-width: 0; }
        .week .day.on { background: var(--r-yellow); }
        .week .wx { font-size: 1.3rem; line-height: 1; }
        .week .mini { display: flex; flex-wrap: wrap; justify-content: center; gap: 1px; min-height: 22px; }
        .week .detail { border-top: 1.5px solid var(--ink); }
        .week .muted { color: var(--ink-soft); }
        .week .outfit { list-style: none; margin: 10px 0; padding: 0; display: grid; gap: 8px; }
        .week .outfit li { display: grid; grid-template-columns: 56px minmax(0, 1fr) auto; gap: 10px; align-items: center; border: 1.5px solid var(--ink); border-radius: 10px; padding: 6px 10px; background: var(--paper); }
        .week .outfit li > div:nth-child(2) { display: flex; flex-direction: column; }
        .week .alts { display: flex; gap: 4px; }
        .week .alt { border: 1px solid var(--grid-strong); border-radius: 8px; background: var(--paper-card); padding: 2px; line-height: 0; }
        .week .alt:hover { border-color: var(--ink); }
        .week .bars { display: grid; gap: 7px; margin-top: 10px; }
        .week .bar { display: grid; grid-template-columns: 150px minmax(0, 1fr) 40px; gap: 10px; align-items: center; }
        .week .bar em { color: var(--ink-faint); font-style: normal; }
        .week .track { height: 10px; border: 1.5px solid var(--ink); border-radius: 6px; overflow: hidden; background: var(--paper); }
        .week .track i { display: block; height: 100%; background: var(--r-yellow); border-right: 1.5px solid var(--ink); transition: width .4s; }
        @media (max-width: 640px) {
          .week .days { grid-template-columns: repeat(4, minmax(0, 1fr)); }
          .week .bar { grid-template-columns: 112px minmax(0, 1fr) 36px; }
          .week .outfit li { grid-template-columns: 44px minmax(0, 1fr); }
          .week .alts { grid-column: 1 / -1; }
        }
      `}</style>
    </div>
  );
}

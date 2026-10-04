import { useEffect, useRef, useState } from 'react';

type Status = 'healthy' | 'degraded' | 'failed' | 'recovering';
type Service = { id: string; name: string; short: string; zone: string; tier: string };
type Fault = { type: string; label: string; hypothesis: string; impact: { latency: number; errorRate: number; throughput: number; health: number } };
interface Props { model: { baseline: { latency: number; errorRate: number; throughput: number; health: number }; services: Service[]; edges: [string, string][]; faults: Fault[] } }

const POS: Record<string, [number, number]> = {
  'api-gateway': [200, 62], 'user-svc': [92, 172], 'rec-engine': [212, 172], 'auth-svc': [330, 172], 'db-primary': [212, 292],
  cdn: [548, 62], 'content-cat': [500, 172], cache: [548, 292],
};
const COLORS: Record<Status, string> = { healthy: 'var(--ok)', degraded: 'var(--r-yellow)', failed: 'var(--bad)', recovering: 'var(--r-blue)' };
type Log = { id: number; kind: string; text: string };

export default function ChaosTopology({ model }: Props) {
  const { baseline, services, edges, faults } = model;
  const allHealthy = () => Object.fromEntries(services.map((s) => [s.id, 'healthy' as Status]));
  const [status, setStatus] = useState<Record<string, Status>>(allHealthy);
  const [cut, setCut] = useState<string[]>([]);
  const [metrics, setMetrics] = useState(baseline);
  const [faultType, setFaultType] = useState('instance-kill');
  const [intensity, setIntensity] = useState(2);
  const [running, setRunning] = useState(false);
  const [monkey, setMonkey] = useState(false);
  const [log, setLog] = useState<Log[]>([{ id: 0, kind: 'info', text: 'Steady state: 8/8 services healthy. Click a service to inject a fault.' }]);
  const statusRef = useRef(status);
  const setS = (fn: (s: Record<string, Status>) => Record<string, Status>) => { statusRef.current = fn(statusRef.current); setStatus(statusRef.current); };
  const timers = useRef<number[]>([]);
  const seq = useRef(1);
  const runningRef = useRef(false);

  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };
  const add = (kind: string, text: string) => setLog((l) => [{ id: seq.current++, kind, text }, ...l].slice(0, 7));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const neighbours = (id: string) => edges.filter(([a, b]) => a === id || b === id).map(([a, b]) => (a === id ? b : a));
  const name = (id: string) => services.find((s) => s.id === id)!.name;

  function inject(target: string, type = faultType, level = intensity) {
    if (runningRef.current) return;
    runningRef.current = true;
    setRunning(true);
    const fault = faults.find((f) => f.type === type)!;
    const zone = services.find((s) => s.id === target)!.zone;
    const victims = type === 'zone-outage' ? services.filter((s) => s.zone === zone).map((s) => s.id) : [target];
    const state: Status = type === 'instance-kill' || type === 'cascade-failure' || type === 'zone-outage' ? 'failed' : 'degraded';
    const label = ['', 'mild', 'moderate', 'severe'][level];

    add('info', `Hypothesis: the system will ${fault.hypothesis} when ${type === 'zone-outage' ? `zone ${zone}` : name(target)} is hit.`);
    later(() => {
      setS((s) => ({ ...s, ...Object.fromEntries(victims.map((v) => [v, state])) }));
      if (type === 'network-partition') setCut(edges.filter(([a, b]) => a === target || b === target).map(([a, b]) => `${a}|${b}`));
      const i = fault.impact;
      setMetrics({
        latency: Math.max(1, baseline.latency + i.latency * level + Math.round(Math.random() * 5)),
        errorRate: Math.max(0, +(baseline.errorRate + i.errorRate * level + Math.random() * 2).toFixed(1)),
        throughput: Math.max(50, baseline.throughput + i.throughput * level * 10),
        health: Math.max(0, Math.min(100, baseline.health + i.health * level)),
      });
      add('injection', `${fault.label} (${label}) injected into ${type === 'zone-outage' ? `all of zone ${zone}` : name(target)}.`);
    }, 350);

    const cascades = level >= 3 || type === 'cascade-failure' || type === 'zone-outage';
    if (cascades) {
      later(() => {
        const hit = neighbours(victims[0]).filter((n) => statusRef.current[n] === 'healthy');
        if (hit.length) add('detection', `Cascade detected: degradation spreading to ${hit.map(name).join(', ')}.`);
        setS((s) => ({ ...s, ...Object.fromEntries(hit.map((n) => [n, 'degraded' as Status])) }));
      }, 1400);
    } else {
      later(() => add('detection', 'Monitoring flagged the anomaly. Blast radius contained to the target.'), 1400);
    }

    later(() => {
      setCut([]);
      const affected = Object.keys(statusRef.current).filter((k) => statusRef.current[k] !== 'healthy');
      add('recovery', `Auto-recovery healing ${affected.length} service${affected.length === 1 ? '' : 's'}…`);
      setS((s) => ({ ...s, ...Object.fromEntries(affected.map((id) => [id, 'recovering' as Status])) }));
      affected.forEach((id, k) => later(() => setS((x) => ({ ...x, [id]: 'healthy' })), 1500 + k * 800));
      later(() => {
        setMetrics(baseline);
        add('resolution', 'All services recovered. Back to steady state.');
        runningRef.current = false;
        setRunning(false);
      }, 1500 + affected.length * 800 + 400);
    }, 3600);
  }

  // Chaos Monkey: random, never two experiments at once.
  useEffect(() => {
    if (!monkey) return;
    const id = window.setInterval(() => {
      if (runningRef.current) return;
      const t = services[Math.floor(Math.random() * services.length)].id;
      const types = ['instance-kill', 'latency', 'network-partition', 'resource-exhaustion'];
      inject(t, types[Math.floor(Math.random() * types.length)], 1 + Math.floor(Math.random() * 2));
    }, 2500);
    return () => clearInterval(id);
  }, [monkey]);

  const healthy = Object.values(status).filter((s) => s === 'healthy').length;
  const hTone = metrics.health < 40 ? 'var(--bad)' : metrics.health < 70 ? 'var(--r-yellow)' : 'var(--ok)';

  return (
    <div className="pg chaos">
      <div className="pg-pad controls pg-row">
        <label className="pg-mono" htmlFor="chaos-fault">Fault</label>
        <select id="chaos-fault" value={faultType} onChange={(e) => setFaultType(e.target.value)} disabled={running}>
          {faults.map((f) => <option key={f.type} value={f.type}>{f.label}</option>)}
        </select>
        <span className="pg-mono">Intensity</span>
        {[1, 2, 3].map((n) => <button key={n} type="button" className="pg-btn" aria-pressed={intensity === n} onClick={() => setIntensity(n)} disabled={running}>{['Mild', 'Moderate', 'Severe'][n - 1]}</button>)}
        <button type="button" className="pg-btn accent" onClick={() => setMonkey((m) => !m)} aria-pressed={monkey}>{monkey ? 'Stop Chaos Monkey' : 'Chaos Monkey mode'}</button>
      </div>
      <div className="pg-split">
        <div className="pg-pad">
          <svg viewBox="0 0 640 350" role="group" aria-label="Service topology. Each service is a button that injects the selected fault.">
            <rect x="12" y="14" width="392" height="326" rx="12" fill="none" stroke="var(--grid-strong)" strokeDasharray="6 5" />
            <rect x="420" y="14" width="208" height="326" rx="12" fill="none" stroke="var(--grid-strong)" strokeDasharray="6 5" />
            <text x="24" y="34" fontSize="11" fill="var(--ink-soft)">ZONE A</text>
            <text x="432" y="34" fontSize="11" fill="var(--ink-soft)">ZONE B</text>
            {edges.map(([a, b]) => {
              const [x1, y1] = POS[a], [x2, y2] = POS[b];
              const broken = cut.includes(`${a}|${b}`) || status[a] === 'failed' || status[b] === 'failed';
              const hot = status[a] !== 'healthy' || status[b] !== 'healthy';
              return <line key={`${a}${b}`} x1={x1} y1={y1} x2={x2} y2={y2} className={`edge${broken ? ' broken' : hot ? ' hot' : ''}`} />;
            })}
            {services.map((s) => {
              const [x, y] = POS[s.id], st = status[s.id];
              return (
                <g key={s.id} className={`node ${st}`} transform={`translate(${x} ${y})`} role="button" tabIndex={running ? -1 : 0}
                  aria-label={`${s.name}, ${st}. Inject ${faults.find((f) => f.type === faultType)!.label.toLowerCase()}.`}
                  onClick={() => inject(s.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inject(s.id); } }}>
                  <g className="inner">
                  <circle r="30" fill={COLORS[st]} stroke="var(--ink)" strokeWidth="2" />
                  {st === 'failed' && <path d="M-12 -12L12 12M12 -12L-12 12" stroke="var(--paper-text)" strokeWidth="4" strokeLinecap="round" />}
                  <text y={st === 'failed' ? 48 : 5} textAnchor="middle" fontSize="12" fontWeight="700" fill={st === 'failed' ? 'var(--ink)' : st === 'recovering' ? 'var(--paper-text)' : 'var(--ink-text)'}>{s.short}</text>
                  <text y={st === 'failed' ? 62 : 48} textAnchor="middle" fontSize="10" fill="var(--ink-soft)">{st === 'healthy' ? s.name : st.toUpperCase()}</text>
                  </g>
                </g>
              );
            })}
          </svg>
        </div>
        <div className="pg-pad side">
          <div className="health">
            <span className="pg-mono">SYSTEM HEALTH</span>
            <b style={{ color: metrics.health < 40 ? 'var(--bad)' : 'var(--ink)' }}>{metrics.health}</b>
            <span className="track"><i style={{ width: `${metrics.health}%`, background: hTone }} /></span>
          </div>
          <div className="pg-stats">
            <div className="pg-stat"><span>Latency</span><b>{metrics.latency} ms</b></div>
            <div className="pg-stat"><span>Errors</span><b>{metrics.errorRate}%</b></div>
            <div className="pg-stat"><span>Throughput</span><b>{metrics.throughput.toLocaleString('en-GB')}</b></div>
            <div className="pg-stat"><span>Services up</span><b>{healthy}/8</b></div>
          </div>
          <ol className="log" aria-live="polite">
            {log.map((l) => <li key={l.id} className={l.kind}>{l.text}</li>)}
          </ol>
        </div>
      </div>
      <style>{`
        .chaos .controls { border-bottom: 1.5px solid var(--ink); }
        .chaos svg { width: 100%; height: auto; display: block; }
        .chaos .edge { stroke: var(--ink); stroke-width: 2; stroke-dasharray: 2 8; animation: flow 1.2s linear infinite; opacity: .55; }
        .chaos .edge.hot { stroke: #B88600; opacity: .9; }
        .chaos .edge.broken { stroke: var(--bad); stroke-dasharray: 6 6; animation: none; opacity: 1; }
        @keyframes flow { to { stroke-dashoffset: -20; } }
        .chaos .node { cursor: pointer; outline: none; }
        .chaos .node circle { transition: fill .4s; }
        .chaos .node:hover circle, .chaos .node:focus-visible circle { stroke-width: 4; }
        .chaos .node.failed .inner { animation: shake .35s ease 2; }
        @keyframes shake { 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
        .chaos .side { display: flex; flex-direction: column; gap: 12px; }
        .chaos .health { display: grid; grid-template-columns: 1fr auto; gap: 4px 10px; align-items: center; }
        .chaos .health b { font-size: 2rem; line-height: 1; font-variant-numeric: tabular-nums; }
        .chaos .health .track { grid-column: 1 / -1; height: 10px; border: 1.5px solid var(--ink); border-radius: 6px; overflow: hidden; }
        .chaos .health .track i { display: block; height: 100%; transition: width .6s, background .6s; }
        .chaos .log { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; font-size: .84rem; }
        .chaos .log li { border-left: 3px solid var(--grid-strong); padding-left: 8px; }
        .chaos .log li.injection { border-color: var(--bad); }
        .chaos .log li.detection { border-color: var(--r-yellow); }
        .chaos .log li.recovery { border-color: var(--r-blue); }
        .chaos .log li.resolution { border-color: var(--ok); }
      `}</style>
    </div>
  );
}

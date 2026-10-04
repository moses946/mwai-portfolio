import { useMemo, useState } from 'react';

type Dir = 'phone_to_watch' | 'watch_to_phone' | 'local';
type Packet = { id: number; t: number; dir: string; op: string; handle: string | null; hex: string; note?: string };
interface Capture {
  label: string; note: string; session: string; packets: Packet[];
  reassembly: { connectionHandle: string; fragments: { pb: string; header: string; body: string }[]; l2cap: { length: number; cid: string }; att: { opcode: string; handle: string; value: string } };
}
type Verdict = { ok: boolean | null; why: string };
type Hyp = { id: string; claim: string; needs: number; judge: (p: Packet, all: Packet[]) => Verdict };

const bytes = (hex: string) => hex.split(' ').filter(Boolean);
const DIR: Record<Dir, string> = { phone_to_watch: '→', watch_to_phone: '←', local: '·' };

const HYPS: Hyp[] = [
  {
    id: 'H-01', claim: 'Writes to handle 0x0012 always start with byte 0x1F.', needs: 3,
    judge: (p) => {
      if (p.op !== 'write' || p.handle !== '0x0012') return { ok: null, why: 'not a write to 0x0012, so it says nothing either way' };
      return bytes(p.hex)[0] === '1F' ? { ok: true, why: 'write to 0x0012 starting with 1F' } : { ok: false, why: `starts with ${bytes(p.hex)[0]}` };
    },
  },
  {
    id: 'H-02', claim: 'Byte 1 of a 0x0012 write is echoed in the next notification on 0x0015.', needs: 2,
    judge: (p, all) => {
      if (p.op !== 'write' || p.handle !== '0x0012') return { ok: null, why: 'cite the writes; the replies are found automatically' };
      const next = all.find((q) => q.t > p.t && q.op === 'notify' && q.handle === '0x0015');
      if (!next) return { ok: null, why: 'no later notification on 0x0015' };
      return bytes(next.hex)[1] === bytes(p.hex)[1]
        ? { ok: true, why: `byte 1 = ${bytes(p.hex)[1]}, echoed by #${next.id}` }
        : { ok: false, why: `byte 1 = ${bytes(p.hex)[1]}, but #${next.id} carries ${bytes(next.hex)[1]}` };
    },
  },
  {
    id: 'H-03', claim: 'Every notification on 0x0015 ends with byte 0x7E.', needs: 4,
    judge: (p) => {
      if (p.op !== 'notify' || p.handle !== '0x0015') return { ok: null, why: 'not a notification on 0x0015' };
      const last = bytes(p.hex).at(-1);
      return last === '7E' ? { ok: true, why: 'ends with 7E' } : { ok: false, why: `ends with ${last}: counterexample` };
    },
  },
];

function status(verdicts: Verdict[], needs: number) {
  if (verdicts.some((v) => v.ok === false)) return { label: 'DISPROVEN', tone: 'bad' };
  const n = verdicts.filter((v) => v.ok).length;
  if (n >= needs) return { label: 'SUPPORTED', tone: 'ok' };
  if (n > 0) return { label: 'TESTING', tone: 'mid' };
  return { label: 'UNKNOWN', tone: 'none' };
}

export default function PacketBench({ capture }: { capture: Capture }) {
  const [reassembled, setReassembled] = useState(false);
  const [joining, setJoining] = useState(false);
  const packets = useMemo<Packet[]>(() => {
    if (!reassembled) return capture.packets;
    const last = capture.packets[capture.packets.length - 1];
    return [...capture.packets, { id: last.id + 1, t: last.t + 64, dir: 'watch_to_phone', op: 'notify', handle: capture.reassembly.att.handle, hex: capture.reassembly.att.value, note: 'reassembled from 3 ACL fragments' }];
  }, [reassembled, capture]);
  const [selId, setSelId] = useState(7);
  const [hid, setHid] = useState('H-01');
  const [cites, setCites] = useState<Record<string, number[]>>({ 'H-01': [], 'H-02': [], 'H-03': [] });

  const hyp = HYPS.find((h) => h.id === hid)!;
  const cited = cites[hid];
  const verdicts = cited.map((id) => ({ id, ...hyp.judge(packets.find((p) => p.id === id)!, packets) }));
  const st = status(verdicts, hyp.needs);
  const sel = packets.find((p) => p.id === selId) ?? packets[0];
  const toggleCite = (id: number) => setCites((c) => ({ ...c, [hid]: c[hid].includes(id) ? c[hid].filter((x) => x !== id) : [...c[hid], id] }));

  const reassemble = () => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    setJoining(true);
    setTimeout(() => { setReassembled(true); setJoining(false); setSelId(capture.packets.length + 1); }, reduced ? 0 : 900);
  };

  const dump = bytes(sel.hex);
  const rows = Array.from({ length: Math.ceil(dump.length / 8) || 1 }, (_, r) => dump.slice(r * 8, r * 8 + 8));

  return (
    <div className="pg packets">
      <div className="pg-split">
        <div className="pg-pad">
          <p className="pg-note">{capture.session} · click a row to inspect it, press <b>Cite</b> to use it as evidence for {hid}</p>
          <div className="tbl" role="table" aria-label="Captured packets">
            <div className="tr th" role="row"><span role="columnheader">#</span><span role="columnheader">t (ms)</span><span role="columnheader">dir</span><span role="columnheader">operation</span><span role="columnheader">handle</span><span role="columnheader">payload</span><span role="columnheader"><span className="visually-hidden">Cite</span></span></div>
            {packets.map((p) => {
              const isCited = cited.includes(p.id);
              return (
                <div key={p.id} role="row" className={`tr${p.id === sel.id ? ' sel' : ''}${isCited ? ' cited' : ''}${p.note?.startsWith('reassembled') ? ' fresh' : ''}`} onClick={() => setSelId(p.id)}>
                  <span role="cell">{p.id}</span>
                  <span role="cell">{p.t}</span>
                  <span role="cell" aria-label={p.dir.replace(/_/g, ' ')}>{DIR[p.dir as Dir] ?? '·'}</span>
                  <span role="cell">{p.op.replace(/_/g, ' ')}</span>
                  <span role="cell">{p.handle ?? ''}</span>
                  <span role="cell" className="hex">{p.hex ? (bytes(p.hex).length > 6 ? `${bytes(p.hex).slice(0, 6).join(' ')} …` : p.hex) : p.note}</span>
                  <span role="cell">{p.hex && <button type="button" className="pg-btn cite" aria-pressed={isCited} onClick={(e) => { e.stopPropagation(); toggleCite(p.id); }}>{isCited ? 'Cited' : 'Cite'}</button>}</span>
                </div>
              );
            })}
          </div>
          <div className="dump" aria-label={`Packet ${sel.id} as hex and ASCII`}>
            <p className="pg-mono">#{sel.id} · {sel.op.replace(/_/g, ' ')} {sel.handle ?? ''} · {dump.length} bytes{sel.note ? ` · ${sel.note}` : ''}</p>
            {dump.length ? rows.map((r, k) => (
              <div className="dr" key={k}>
                <span className="off">{(k * 8).toString(16).padStart(4, '0')}</span>
                <span className="hx">{r.join(' ')}</span>
                <span className="as">{r.map((b) => { const c = parseInt(b, 16); return c >= 32 && c < 127 ? String.fromCharCode(c) : '.'; }).join('')}</span>
              </div>
            )) : <p className="pg-note">No payload: a local event from the phone's Bluetooth stack.</p>}
          </div>
        </div>

        <div className="pg-pad ledger">
          <div className="pg-row" role="tablist" aria-label="Hypotheses">
            {HYPS.map((h) => {
              const s = status(cites[h.id].map((id) => h.judge(packets.find((p) => p.id === id)!, packets)), h.needs);
              return <button key={h.id} role="tab" aria-selected={h.id === hid} className={`pg-btn${h.id === hid ? ' on' : ''}`} onClick={() => setHid(h.id)}>{h.id} · {s.label}</button>;
            })}
          </div>
          <div className="claim" role="tabpanel">
            <p className="pg-mono muted">HYPOTHESIS {hyp.id}</p>
            <p className="ctext">{hyp.claim}</p>
            <p className={`chip-status ${st.tone}`}>{st.label}</p>
            <p className="pg-note">Needs {hyp.needs} supporting packets and no counterexample. Supported is never "proven".</p>
            <ul className="cites">
              {verdicts.length === 0 && <li className="pg-note">No evidence cited yet.</li>}
              {verdicts.map((v) => (
                <li key={v.id} className={v.ok === true ? 'ok' : v.ok === false ? 'bad' : 'meh'}>
                  <span className="pg-mono">#{v.id}</span> {v.ok === true ? 'supports' : v.ok === false ? 'refutes' : 'irrelevant'}: {v.why}
                </li>
              ))}
            </ul>
            {cited.length > 0 && <button type="button" className="pg-btn" onClick={() => setCites((c) => ({ ...c, [hid]: [] }))}>Clear citations</button>}
          </div>

          <div className="reasm">
            <p className="pg-mono muted">L2CAP REASSEMBLY · CONNECTION {capture.reassembly.connectionHandle}</p>
            <p className="pg-note">A long notification arrived as three ACL fragments. Until they're joined, there's a packet the ledger can't see.</p>
            <div className={`frags${joining ? ' joining' : ''}${reassembled ? ' done' : ''}`}>
              {capture.reassembly.fragments.map((f, k) => (
                <div className="frag" key={k} style={{ ['--k' as string]: k }}>
                  <span className="pb">{f.pb}</span>
                  <span className="hx"><b>{f.header}</b> {bytes(f.body).slice(0, 6).join(' ')} …</span>
                </div>
              ))}
            </div>
            {reassembled ? (
              <p className="pg-mono result">→ L2CAP len {capture.reassembly.l2cap.length}, CID {capture.reassembly.l2cap.cid} → ATT {capture.reassembly.att.opcode} on {capture.reassembly.att.handle} (#{capture.packets.length + 1})</p>
            ) : (
              <button type="button" className="pg-btn accent" onClick={reassemble} disabled={joining}>Reassemble fragments</button>
            )}
          </div>
        </div>
      </div>
      <p className="pg-foot pg-note">{capture.note}</p>
      <style>{`
        .packets .tbl { margin-top: 8px; border: 1.5px solid var(--ink); border-radius: 8px; overflow: auto; max-height: 360px; background: var(--paper); }
        .packets .tr { display: grid; grid-template-columns: 26px 46px 22px minmax(84px, 1fr) 58px minmax(0, 1.6fr) 64px; gap: 8px; align-items: center; padding: 5px 8px; font-family: var(--font-mono); font-size: .74rem; border-bottom: 1px solid var(--grid); cursor: pointer; min-width: 520px; }
        .packets .tr.th { background: var(--paper-2); cursor: default; font-weight: 600; position: sticky; top: 0; z-index: 1; }
        .packets .tr.sel { background: color-mix(in srgb, var(--r-teal) 14%, var(--paper)); }
        .packets .tr.cited { box-shadow: inset 4px 0 0 var(--r-teal); }
        .packets .tr.fresh { animation: pk-in .8s ease; }
        @keyframes pk-in { from { background: var(--r-yellow); } }
        .packets .hex { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .packets .cite { padding: 2px 8px; font-size: .68rem; }
        .packets .dump { margin-top: 12px; border: 1.5px dashed var(--ink); border-radius: 8px; padding: 10px; font-family: var(--font-mono); font-size: .76rem; overflow-x: auto; }
        .packets .dr { display: grid; grid-template-columns: 44px 200px auto; gap: 12px; }
        .packets .off { color: var(--ink-faint); }
        .packets .ledger { display: flex; flex-direction: column; gap: 14px; }
        .packets .claim { border: 1.5px solid var(--ink); border-radius: 10px; padding: 12px; background: var(--paper); display: flex; flex-direction: column; gap: 8px; }
        .packets .muted { color: var(--ink-soft); }
        .packets .ctext { font-weight: 650; font-size: 1.02rem; }
        .packets .chip-status { align-self: flex-start; font-family: var(--font-mono); font-size: .76rem; letter-spacing: .08em; padding: 3px 10px; border-radius: 999px; border: 1.5px solid var(--ink); }
        .packets .chip-status.ok { background: var(--ok); color: var(--ink-text); }
        .packets .chip-status.bad { background: var(--bad); color: var(--paper-text); }
        .packets .chip-status.mid { background: var(--r-yellow); }
        .packets .cites { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; font-size: .86rem; }
        .packets .cites li { padding-left: 10px; border-left: 3px solid var(--grid-strong); }
        .packets .cites li.ok { border-color: var(--ok); }
        .packets .cites li.bad { border-color: var(--bad); }
        .packets .reasm { border-top: 1.5px dashed var(--grid-strong); padding-top: 12px; display: flex; flex-direction: column; gap: 8px; }
        .packets .frags { display: flex; flex-direction: column; gap: 6px; }
        .packets .frag { display: grid; grid-template-columns: 84px minmax(0, 1fr); gap: 8px; font-family: var(--font-mono); font-size: .72rem; border: 1.5px solid var(--ink); border-radius: 6px; padding: 5px 8px; background: var(--paper); transition: transform .8s cubic-bezier(.3,1.3,.5,1), margin .8s; }
        .packets .frag .hx { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .packets .frag .pb { color: var(--ink-soft); }
        .packets .frags.joining .frag { transform: translateY(calc(var(--k) * -6px)); margin-bottom: -8px; }
        .packets .frags.done .frag { background: color-mix(in srgb, var(--r-teal) 14%, var(--paper)); }
        .packets .result { color: var(--ink); }
      `}</style>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';

type Line = { k: 'cmd' | 'out' | 'find' | 'ok' | 'bit'; t: string };

// A scripted replay of a build, using the package's real names, paths and fixes.
const SCRIPT: Line[] = [
  { k: 'cmd', t: 'git clone https://github.com/moses946/unofficial-claude-desktop && cd unofficial-claude-desktop' },
  { k: 'cmd', t: 'makepkg -si' },
  { k: 'out', t: '==> Making package: claude-desktop-unofficial 1.49585.0-1 (x86_64)' },
  { k: 'out', t: '==> Retrieving sources...  -> claude-desktop_1.49585.0_amd64.deb' },
  { k: 'out', t: '==> Validating source files with sha256sums...  Passed' },
  { k: 'out', t: '==> Starting prepare()...  ar x claude-desktop_*.deb && tar -xJf data.tar.xz' },
  { k: 'find', t: 'tar ran as a normal user, so it silently dropped the SUID bit:' },
  { k: 'bit', t: '-rwxr-xr-x  build build  chrome-sandbox' },
  { k: 'out', t: '==> Starting package()...  chmod 4755 "$pkgdir/usr/lib/claude-desktop/chrome-sandbox"' },
  { k: 'bit', t: '-rwsr-xr-x  root  root   chrome-sandbox' },
  { k: 'out', t: '==> Finished making: claude-desktop-unofficial 1.49585.0-1' },
  { k: 'out', t: '==> Installing package with pacman -U...  (edk2-ovmf, qemu-system-x86, virtiofsd for Cowork)' },
  { k: 'find', t: 'Cowork boots a QEMU/KVM VM and looks for UEFI firmware at the Debian path:' },
  { k: 'out', t: ':: post_install  /usr/share/OVMF/OVMF_CODE_4M.fd -> /usr/share/edk2/x64/OVMF_CODE.4m.fd' },
  { k: 'cmd', t: 'claude-desktop' },
  { k: 'ok', t: 'Chat ✓   Claude Code ✓   Cowork VM boots ✓' },
];

export default function TerminalReplay() {
  const [shown, setShown] = useState(SCRIPT.length);
  const [chars, setChars] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!playing) return;
    if (shown >= SCRIPT.length) { setPlaying(false); return; }
    const line = SCRIPT[shown];
    const typing = line.k === 'cmd' && chars < line.t.length;
    timer.current = window.setTimeout(() => {
      if (typing) setChars((c) => Math.min(line.t.length, c + 3));
      else { setShown((s) => s + 1); setChars(0); }
    }, typing ? 18 : line.k === 'find' ? 900 : 380);
    return () => clearTimeout(timer.current);
  }, [playing, shown, chars]);

  const replay = () => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(SCRIPT.length); return; }
    setShown(0); setChars(0); setPlaying(true);
  };

  const visible = SCRIPT.slice(0, Math.min(SCRIPT.length, shown + (playing ? 1 : 0)));

  return (
    <div className="pg term pg-split">
      <div className="pg-pad">
        <div className="pg-row bar">
          <button type="button" className="pg-btn accent" onClick={replay}>{playing ? 'Restart' : 'Replay the build'}</button>
          {playing && <button type="button" className="pg-btn" onClick={() => { setPlaying(false); setShown(SCRIPT.length); }}>Skip to the end</button>}
        </div>
        <div className="screen" role="log" aria-label="Terminal transcript" aria-live="off">
          {visible.map((l, i) => {
            const partial = playing && i === shown && l.k === 'cmd';
            const text = partial ? l.t.slice(0, chars) : l.t;
            if (l.k === 'bit') {
              const [perm, ...rest] = text.split('  ');
              return <div key={i} className="ln bit"><span>{perm.slice(0, 3)}<mark>{perm.slice(3, 4)}</mark>{perm.slice(4)}</span>  {rest.join('  ')}</div>;
            }
            return <div key={i} className={`ln ${l.k}`}>{l.k === 'cmd' ? '$ ' : l.k === 'find' ? '# finding: ' : ''}{text}{partial && <span className="caret" />}</div>;
          })}
        </div>
      </div>
      <div className="pg-pad side">
        <p className="pg-mono muted">THE FIRMWARE PATH, TWO DISTROS</p>
        <table className="diff">
          <thead><tr><th scope="col">Debian / Ubuntu</th><th scope="col">Arch (edk2-ovmf)</th></tr></thead>
          <tbody>
            <tr><td>/usr/share/OVMF/OVMF_CODE_4M.fd</td><td>/usr/share/edk2/x64/OVMF_CODE.4m.fd</td></tr>
            <tr><td>/usr/share/AAVMF/AAVMF_CODE.fd</td><td>/usr/share/edk2/aarch64/QEMU_EFI.fd</td></tr>
          </tbody>
        </table>
        <p className="pg-note">Symlinks are created only if the firmware is installed, so chat and Claude Code work without Cowork's extras.</p>
        <p className="pg-mono muted">THE BIT</p>
        <p className="pg-note"><code>-rwsr-xr-x</code>: the <mark>s</mark> lets <code>chrome-sandbox</code> start as root to set up Chromium's namespace and seccomp sandbox. Without it, Electron refuses to launch sandboxed.</p>
      </div>
      <style>{`
        .term .screen { margin-top: 12px; background: #16181B; color: #E9EDE6; border-radius: 10px; border: 1.5px solid var(--ink); padding: 14px; font-family: var(--font-mono); font-size: .76rem; line-height: 1.65; min-height: 330px; overflow-x: auto; }
        .term .ln { white-space: pre-wrap; word-break: break-word; }
        .term .ln.cmd { color: #FFFFFF; }
        .term .ln.out { color: #AEB6AC; }
        .term .ln.find { color: #C9B6F2; font-family: var(--font-hand); font-size: .9rem; margin-top: 6px; }
        .term .ln.ok { color: #6FE3A3; margin-top: 4px; }
        .term .ln.bit { color: #FFE800; }
        .term mark { background: #FF48B0; color: #16181B; padding: 0 2px; border-radius: 2px; }
        .term .caret { display: inline-block; width: 7px; height: 1em; background: #E9EDE6; vertical-align: text-bottom; animation: blink 1s steps(1) infinite; }
        @keyframes blink { 50% { opacity: 0; } }
        .term .side { display: flex; flex-direction: column; gap: 10px; }
        .term .muted { color: var(--ink-soft); }
        .term .diff { border-collapse: collapse; width: 100%; font-family: var(--font-mono); font-size: .7rem; display: block; overflow-x: auto; }
        .term .diff th, .term .diff td { border: 1px solid var(--grid-strong); padding: 6px 8px; text-align: left; vertical-align: top; overflow-wrap: anywhere; }
        .term .diff th { background: var(--paper-2); }
        .term .side mark { background: var(--r-purple); color: var(--paper-text); padding: 0 3px; border-radius: 2px; }
      `}</style>
    </div>
  );
}

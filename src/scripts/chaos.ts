let running = false;

export function unleashChaos(): void {
  if (running) return;
  const targets = [...document.querySelectorAll<HTMLElement>('[data-chaos]')];
  if (!targets.length) return;
  running = true;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hb = document.createElement('div');
  hb.className = 'health';
  hb.setAttribute('role', 'status');
  hb.innerHTML = '<div>SYSTEM HEALTH <b data-v>100</b></div><div class="bar"><i data-bar style="width:100%"></i></div><div data-s style="margin-top:6px">steady state</div>';
  document.body.appendChild(hb);
  const set = (v: number, msg: string, col: string) => {
    hb.querySelector('[data-v]')!.textContent = String(v);
    const bar = hb.querySelector<HTMLElement>('[data-bar]')!;
    bar.style.width = `${v}%`;
    bar.style.background = col;
    hb.querySelector('[data-s]')!.textContent = msg;
  };
  const victims = targets.sort(() => Math.random() - 0.5).slice(0, Math.min(3, targets.length));
  setTimeout(() => {
    victims.forEach((t) => {
      if (!reduced) {
        t.style.setProperty('--fx', `${Math.random() * 40 - 20}px`);
        t.style.setProperty('--fy', `${Math.random() * 30 - 10}px`);
        t.style.setProperty('--fr', `${Math.random() * 5 - 2.5}deg`);
      }
      t.classList.add('failed');
    });
    set(38, `fault injected: ${victims.length} sections down`, 'var(--bad)');
  }, 300);
  setTimeout(() => {
    victims.forEach((t) => { t.classList.remove('failed'); t.classList.add('recovering'); });
    set(72, 'auto-recovery running', 'var(--r-blue)');
  }, 2300);
  setTimeout(() => { victims.forEach((t) => t.classList.remove('recovering')); set(100, 'all systems nominal', 'var(--ok)'); }, 3900);
  setTimeout(() => { hb.remove(); running = false; }, 5600);
}

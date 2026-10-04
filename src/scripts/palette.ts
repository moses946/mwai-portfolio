import { navigate } from 'astro:transitions/client';
import { copyText, toast } from './toast';
import { unleashChaos } from './chaos';

type Command = { label: string; hint: string; href?: string; action?: 'copy-email' | 'copy-feed' | 'chaos'; value?: string };
const EMAIL = 'mosesmwaiw@gmail.com';

function run(c: Command): void {
  if (c.href) {
    const url = new URL(c.href, location.href);
    if (url.pathname === location.pathname && url.hash) {
      document.getElementById(url.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
      history.replaceState(null, '', url.hash);
    } else navigate(c.href);
    return;
  }
  if (c.action === 'copy-email') copyText(EMAIL, 'Email');
  if (c.action === 'copy-feed' && c.value) copyText(c.value, 'Feed URL');
  if (c.action === 'chaos') {
    if (!document.querySelector('[data-chaos]')) { toast('Chaos needs a page with sections. Try it on the home page.'); return; }
    unleashChaos();
  }
}

export function initPalette(): void {
  const dialog = document.getElementById('palette') as HTMLDialogElement | null;
  const input = document.getElementById('palette-input') as HTMLInputElement | null;
  const list = document.getElementById('palette-list');
  const data = document.getElementById('palette-data');
  if (!dialog || !input || !list || !data) return;
  const all: Command[] = JSON.parse(data.textContent || '[]');
  let shown = all;
  let sel = 0;

  const render = () => {
    const q = input.value.toLowerCase().trim();
    shown = all.filter((c) => `${c.label} ${c.hint}`.toLowerCase().includes(q));
    sel = Math.min(sel, Math.max(0, shown.length - 1));
    list.innerHTML = '';
    if (!shown.length) {
      const li = document.createElement('li');
      li.textContent = 'No match. Try “chaos”.';
      list.appendChild(li);
      return;
    }
    shown.forEach((c, i) => {
      const li = document.createElement('li');
      li.id = `pal-${i}`;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', String(i === sel));
      li.dataset.i = String(i);
      const a = document.createElement('span'); a.textContent = c.label;
      const b = document.createElement('span'); b.className = 'k'; b.textContent = c.hint;
      li.append(a, b);
      list.appendChild(li);
    });
    input.setAttribute('aria-activedescendant', `pal-${sel}`);
    document.getElementById(`pal-${sel}`)?.scrollIntoView({ block: 'nearest' });
  };
  const choose = (i = sel) => { const c = shown[i]; if (!c) return; dialog.close(); setTimeout(() => run(c), 20); };
  const open = () => { input.value = ''; sel = 0; render(); dialog.showModal(); input.focus(); };

  document.querySelectorAll('[data-open-palette]').forEach((b) => b.addEventListener('click', open));
  input.addEventListener('input', () => { sel = 0; render(); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { sel = (sel + 1) % Math.max(1, shown.length); render(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { sel = (sel - 1 + shown.length) % Math.max(1, shown.length); render(); e.preventDefault(); }
    else if (e.key === 'Enter') { choose(); e.preventDefault(); }
  });
  list.addEventListener('click', (e) => {
    const li = (e.target as HTMLElement).closest<HTMLElement>('li[data-i]');
    if (li) choose(Number(li.dataset.i));
  });
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  (window as any).__openPalette = open;
}

let keysBound = false;
export function bindPaletteKeys(): void {
  if (keysBound) return;
  keysBound = true;
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      const dialog = document.getElementById('palette') as HTMLDialogElement | null;
      if (dialog?.open) dialog.close();
      else (window as any).__openPalette?.();
    }
  });
}

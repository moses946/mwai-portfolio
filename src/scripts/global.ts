import { initPalette, bindPaletteKeys } from './palette';
import { copyText } from './toast';

function initCopyButtons(): void {
  document.querySelectorAll<HTMLElement>('[data-copy]').forEach((el) => {
    el.addEventListener('click', () => copyText(el.dataset.copy!, el.dataset.copyLabel || 'Text', document.querySelector(el.dataset.copyTarget || '')));
  });
}

function initClocks(): void {
  const els = document.querySelectorAll<HTMLElement>('[data-clock]');
  if (!els.length) return;
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Nairobi', hour: '2-digit', minute: '2-digit' });
  const tick = () => els.forEach((el) => { el.textContent = `Nairobi · ${fmt.format(new Date())} EAT`; });
  tick();
  const id = setInterval(tick, 30_000);
  document.addEventListener('astro:before-swap', () => clearInterval(id), { once: true });
}

bindPaletteKeys();
document.addEventListener('astro:page-load', () => {
  initPalette();
  initCopyButtons();
  initClocks();
});

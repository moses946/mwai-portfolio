export function toast(msg: string, ms = 2600): void {
  document.querySelectorAll('.toast').forEach((t) => t.remove());
  const t = document.createElement('div');
  t.className = 'toast';
  t.setAttribute('role', 'status');
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), ms);
}

export async function copyText(text: string, label: string, fallbackEl?: Element | null): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toast(`${label} copied`);
  } catch {
    if (fallbackEl) {
      const r = document.createRange();
      r.selectNodeContents(fallbackEl);
      const s = getSelection();
      s?.removeAllRanges();
      s?.addRange(r);
    }
    toast(`Couldn't reach the clipboard. ${label}: ${text}`, 5000);
  }
}

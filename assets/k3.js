// Utilidades comuns dos puzzles: semente do dia, número do puzzle, idioma, relógio, compartilhar.
export const EPOCH = Date.UTC(2026, 9, 27); // puzzle nº1 = 27/10/2026
export function today() {
  const q = new URLSearchParams(location.search).get('d'); // ?d=2026-10-30 pra testar
  const d = q ? new Date(q + 'T12:00:00') : new Date();
  return { y: d.getFullYear(), m: d.getMonth(), d: d.getDate() };
}
export function dayNumber() { const t = today(); return Math.floor((Date.UTC(t.y, t.m, t.d) - EPOCH) / 86400000) + 1; }
export function rng(salt) {
  const t = today(); let a = (t.y * 10000 + (t.m + 1) * 100 + t.d) * 7919 + salt * 104729;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let x = Math.imul(a ^ a >>> 15, 1 | a); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; };
}
export const EN = !/^pt/i.test(navigator.language || 'pt');
export const tr = (pt, en) => (EN ? en : pt);
export function clock(el) {
  const t0 = Date.now(); let stop = false;
  const tick = () => { if (stop) return; const s = Math.floor((Date.now() - t0) / 1000); el.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; setTimeout(tick, 500); };
  tick(); return { stop() { stop = true; }, secs() { return Math.floor((Date.now() - t0) / 1000); } };
}
export function toast(msg) {
  let t = document.querySelector('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('on'); setTimeout(() => t.classList.remove('on'), 1600);
}
export async function share(text) {
  const url = location.origin + location.pathname;
  const full = `${text}\n${url}`;
  try { if (navigator.share) { await navigator.share({ text: full }); return; } } catch (e) { /* cancelou */ }
  try { await navigator.clipboard.writeText(full); toast(tr('Copiado! Cole pros amigos', 'Copied! Paste it to your friends')); }
  catch (e) { prompt(tr('Copie o resultado:', 'Copy your result:'), full); }
}
export function i18n() { document.querySelectorAll('[data-en]').forEach(el => { if (EN) el.innerHTML = el.dataset.en; }); }

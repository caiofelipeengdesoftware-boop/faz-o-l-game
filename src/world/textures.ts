import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';

function canvas(w: number, h: number) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function finish(c: HTMLCanvasElement, repeatX = 1, repeatY = 1, wrap = true) {
  const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; t.anisotropy = 8;
  if (wrap) { t.wrapS = RepeatWrapping; t.wrapT = RepeatWrapping; } t.repeat.set(repeatX, repeatY); return t;
}
function rng(seed: number) { let s = seed; return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; }

/** Fachada de pedra com janelas de moldura clara (mansão). Retorna textura de cor e de brilho noturno. */
export function stoneFacade(base: string, cols: number, rows: number, seed = 5) {
  const w = 512; const h = 256; const c = canvas(w, h); const g = c.getContext('2d')!; const l = canvas(w, h); const lg = l.getContext('2d')!;
  const r = rng(seed); g.fillStyle = base; g.fillRect(0, 0, w, h); lg.fillStyle = '#000'; lg.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${r() > 0.5 ? '255,248,230' : '70,58,40'},${0.04 + r() * 0.08})`; g.fillRect(r() * w, r() * h, 6 + r() * 26, 3 + r() * 8); }
  g.strokeStyle = 'rgba(80,66,46,.22)'; g.lineWidth = 1;
  for (let y = 0; y < h; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); for (let x = (y / 16) % 2 ? 0 : 24; x < w; x += 48) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 16); g.stroke(); } }
  const cw = w / cols; const rh = h / rows;
  for (let rr = 0; rr < rows; rr++) for (let cc = 0; cc < cols; cc++) {
    const ww = cw * 0.46; const hh = rh * 0.62; const x = cc * cw + (cw - ww) / 2; const y = rr * rh + (rh - hh) / 2;
    g.fillStyle = '#efe7d3'; g.fillRect(x - 4, y - 4, ww + 8, hh + 8);
    g.fillStyle = '#24323a'; g.fillRect(x, y, ww, hh);
    g.fillStyle = 'rgba(160,190,205,.35)'; g.fillRect(x, y, ww * 0.5, hh * 0.45);
    g.fillStyle = '#efe7d3'; g.fillRect(x + ww / 2 - 1.5, y, 3, hh); g.fillRect(x, y + hh * 0.5 - 1.5, ww, 3);
    if (r() < 0.45) { lg.fillStyle = '#ffd89a'; lg.fillRect(x, y, ww, hh); }
  }
  return { map: finish(c, 1, 1), glow: finish(l, 1, 1) };
}

/** Gramado de futebol com faixas e marcações oficiais. */
export function pitchTexture() {
  const w = 1024; const h = 640; const c = canvas(w, h); const g = c.getContext('2d')!; const r = rng(9);
  for (let i = 0; i < 12; i++) { g.fillStyle = i % 2 ? '#3f8a3a' : '#378233'; g.fillRect((i * w) / 12, 0, w / 12 + 1, h); }
  for (let i = 0; i < 6000; i++) { g.fillStyle = `rgba(${r() > 0.5 ? '255,255,255' : '0,40,0'},.035)`; g.fillRect(r() * w, r() * h, 2, 5); }
  g.strokeStyle = '#f4f4ee'; g.lineWidth = 5; g.strokeRect(24, 24, w - 48, h - 48);
  g.beginPath(); g.moveTo(w / 2, 24); g.lineTo(w / 2, h - 24); g.stroke();
  g.beginPath(); g.arc(w / 2, h / 2, 74, 0, Math.PI * 2); g.stroke(); g.fillStyle = '#f4f4ee'; g.beginPath(); g.arc(w / 2, h / 2, 6, 0, Math.PI * 2); g.fill();
  for (const side of [0, 1]) {
    const x0 = side ? w - 24 : 24; const dir = side ? -1 : 1;
    g.strokeRect(side ? x0 - 150 : x0, h / 2 - 160, 150, 320); g.strokeRect(side ? x0 - 56 : x0, h / 2 - 82, 56, 164);
    g.beginPath(); g.arc(x0 + dir * 100, h / 2, 72, side ? Math.PI * 0.64 : -Math.PI * 0.36, side ? Math.PI * 1.36 : Math.PI * 0.36); g.stroke();
  }
  return finish(c, 1, 1, false);
}

/** Pavimento de pedra com desenho circular (pátio da mansão). */
export function pavers(base = '#bfae8c') {
  const c = canvas(512, 512); const g = c.getContext('2d')!; const r = rng(33); g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 32) for (let x = (y / 32) % 2 ? 0 : 32; x < 512; x += 64) {
    const tone = 0.78 + r() * 0.26; g.fillStyle = `rgba(${Math.round(190 * tone)},${Math.round(172 * tone)},${Math.round(140 * tone)},1)`; g.fillRect(x + 2, y + 2, 60, 28);
  }
  return finish(c, 14, 14);
}

export function signTexture(text: string, bg: string, fg: string, sub?: string) {
  const c = canvas(512, 128); const g = c.getContext('2d')!; g.fillStyle = bg; g.fillRect(0, 0, 512, 128);
  g.strokeStyle = fg; g.lineWidth = 4; g.strokeRect(6, 6, 500, 116); g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `700 ${sub ? 62 : 76}px "DM Sans", Arial, sans-serif`; g.fillText(text, 256, sub ? 54 : 66);
  if (sub) { g.font = '600 24px "DM Mono", monospace'; g.fillText(sub, 256, 104); }
  return finish(c, 1, 1, false);
}
export function grassTexture(base: string, tx = 30, ty = 30) {
  const c = canvas(256, 256); const g = c.getContext('2d')!; const r = rng(71); g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 4200; i++) { g.fillStyle = `rgba(${r() > 0.5 ? '120,170,80' : '30,70,25'},${0.05 + r() * 0.12})`; g.fillRect(r() * 256, r() * 256, 1 + r() * 2, 2 + r() * 4); }
  return finish(c, tx, ty);
}

import { useEffect } from 'react';

/**
 * Navegação por controle em qualquer menu: o container precisa de `data-pad-scope`.
 * D-pad/analógico esquerdo movem o foco, A confirma, B volta, LB/RB trocam de aba.
 * Um elemento com `data-pad-capture` recebe o movimento como evento `pad:move` (mapa).
 */
const FOCUSABLE = 'button:not(:disabled), input[type=range], [data-pad-focus], select';
const visible = (el: HTMLElement) => { const r = el.getBoundingClientRect(); return r.width > 2 && r.height > 2 && getComputedStyle(el).visibility !== 'hidden'; };
const setRange = (el: HTMLInputElement, direction: number) => {
  const step = Number(el.step) || 1; const next = Math.min(Number(el.max), Math.max(Number(el.min), Number(el.value) + direction * step));
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(el, String(next)); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
};
function mark(el: HTMLElement | null) { document.querySelectorAll('[data-pad-active]').forEach((node) => node.removeAttribute('data-pad-active')); if (el) { el.setAttribute('data-pad-active', ''); el.focus({ preventScroll: true }); el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } }

export function useGamepadUi() {
  useEffect(() => {
    const held: Record<string, number> = {}; let frame = 0; let lastScope: Element | null = null;
    const fire = (key: string, down: boolean, now: number, first = 340, repeat = 130) => {
      if (!down) { delete held[key]; return false; }
      if (held[key] === undefined) { held[key] = now + first; return true; }
      if (now >= held[key]) { held[key] = now + repeat; return true; } return false;
    };
    const poll = (now: number) => {
      frame = requestAnimationFrame(poll);
      const pad = Array.from(navigator.getGamepads?.() ?? []).find((item) => item?.connected);
      const scopes = document.querySelectorAll('[data-pad-scope]'); const scope = scopes[scopes.length - 1] ?? null;
      if (!pad || !scope) { lastScope = null; return; }
      const ax = pad.axes[0] ?? 0; const ay = pad.axes[1] ?? 0; const b = (i: number) => Boolean(pad.buttons[i]?.pressed);
      const left = b(14) || ax < -0.55; const right = b(15) || ax > 0.55; const up = b(12) || ay < -0.55; const down = b(13) || ay > 0.55;
      const list = Array.from(scope.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(visible);
      let current = document.activeElement as HTMLElement | null;
      if (scope !== lastScope || !current || !scope.contains(current)) {
        lastScope = scope; const initial = scope.querySelector<HTMLElement>('[data-pad-default]') ?? list[0] ?? null; mark(initial); current = initial;
        if (b(0)) held.a = 1e12; // evita confirmar sem querer o botão que abriu o menu
      }
      if (!current) return;
      if (current.hasAttribute('data-pad-capture')) {
        const mx = Math.abs(ax) > 0.18 ? ax : 0; const my = Math.abs(ay) > 0.18 ? ay : 0;
        if (mx || my || b(12) || b(13) || b(14) || b(15)) window.dispatchEvent(new CustomEvent('pad:move', { detail: { x: mx + Number(b(15)) - Number(b(14)), y: my + Number(b(13)) - Number(b(12)) } }));
        const zoom = (pad.buttons[7]?.value ?? 0) - (pad.buttons[6]?.value ?? 0); if (Math.abs(zoom) > 0.2) window.dispatchEvent(new CustomEvent('pad:zoom', { detail: zoom }));
        if (fire('a', b(0), now, 1e9)) window.dispatchEvent(new CustomEvent('pad:confirm'));
        if (fire('x', b(2), now, 1e9)) window.dispatchEvent(new CustomEvent('pad:action', { detail: 'x' }));
        if (fire('y', b(3), now, 1e9)) window.dispatchEvent(new CustomEvent('pad:action', { detail: 'y' }));
      } else {
        const move = (dx: number, dy: number) => {
          const from = current!.getBoundingClientRect(); const cx = from.left + from.width / 2; const cy = from.top + from.height / 2;
          let best: HTMLElement | null = null; let bestScore = Infinity;
          for (const el of list) {
            if (el === current) continue; const r = el.getBoundingClientRect(); const ex = r.left + r.width / 2 - cx; const ey = r.top + r.height / 2 - cy;
            const along = dx ? ex * dx : ey * dy; const across = dx ? Math.abs(ey) : Math.abs(ex); if (along <= 4) continue;
            const score = along + across * 2.2; if (score < bestScore) { bestScore = score; best = el; }
          }
          if (best) mark(best);
        };
        const isRange = current instanceof HTMLInputElement && current.type === 'range';
        if (fire('l', left, now)) { if (isRange) setRange(current as HTMLInputElement, -1); else move(-1, 0); }
        if (fire('r', right, now)) { if (isRange) setRange(current as HTMLInputElement, 1); else move(1, 0); }
        if (fire('u', up, now)) move(0, -1);
        if (fire('d', down, now)) move(0, 1);
        if (fire('a', b(0), now, 1e9)) current.click();
        if (fire('x', b(2), now, 1e9)) window.dispatchEvent(new CustomEvent('pad:action', { detail: 'x' }));
        if (fire('y', b(3), now, 1e9)) window.dispatchEvent(new CustomEvent('pad:action', { detail: 'y' }));
      }
      if (fire('b', b(1), now, 1e9)) window.dispatchEvent(new CustomEvent('pad:back'));
      if (fire('lb', b(4), now, 1e9)) window.dispatchEvent(new CustomEvent('pad:tab', { detail: -1 }));
      if (fire('rb', b(5), now, 1e9)) window.dispatchEvent(new CustomEvent('pad:tab', { detail: 1 }));
    };
    frame = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(frame);
  }, []);
}

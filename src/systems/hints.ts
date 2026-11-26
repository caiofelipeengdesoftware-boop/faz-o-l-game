import { useGameStore } from '../state';

const hints = new Map<string, string>();
/** Vários personagens podem pedir um aviso de interação ao mesmo tempo; o HUD mostra o primeiro. */
export function setHint(owner: string, text: string | null) {
  if (text) { if (hints.get(owner) === text) return; hints.set(owner, text); }
  else { if (!hints.has(owner)) return; hints.delete(owner); }
  useGameStore.getState().setInteractHint(hints.values().next().value ?? null);
}
export function clearHints() { hints.clear(); useGameStore.getState().setInteractHint(null); }

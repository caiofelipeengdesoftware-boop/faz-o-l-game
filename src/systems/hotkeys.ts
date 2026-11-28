import { useEffect } from 'react';
import { useGameStore } from '../state';
import { getControllerSettings } from './controllerSettings';

const typing = (target: EventTarget | null) => { const tag = (target as HTMLElement | null)?.tagName; return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'; };

/** Celular, voz e chat: atalhos configuráveis, no teclado e no controle, que funcionam mesmo com menus abertos. */
export function useHotkeys(playing: () => boolean) {
  useEffect(() => {
    const phone = () => { if (!playing()) return; document.exitPointerLock?.(); useGameStore.getState().togglePhone(); };
    const voice = () => { if (playing()) window.dispatchEvent(new CustomEvent('faz:voice-toggle')); };
    const chat = (pad: boolean) => {
      if (!playing()) return; const store = useGameStore.getState();
      if (pad) store.setQuickChatOpen(!store.quickChatOpen); else { document.exitPointerLock?.(); store.setChatOpen(true); }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || typing(event.target)) return;
      const key = event.key.toLowerCase(); const { bindings } = getControllerSettings();
      if (key === bindings.phone) { event.preventDefault(); phone(); }
      else if (key === bindings.voice) voice();
      else if (key === bindings.chat) { event.preventDefault(); chat(false); }
    };
    window.addEventListener('keydown', onKey);
    const held: Record<number, boolean> = {}; let frame = 0;
    const poll = () => {
      frame = requestAnimationFrame(poll);
      const pad = Array.from(navigator.getGamepads?.() ?? []).find((item) => item?.connected); if (!pad) return;
      const { bindings } = getControllerSettings();
      const check = (index: number, action: () => void) => { const down = Boolean(pad.buttons[index]?.pressed); if (down && !held[index]) action(); held[index] = down; };
      const driving = useGameStore.getState().isDriving;
      const phoneOpen = useGameStore.getState().showPhone;
      if (!driving || phoneOpen) check(bindings.padPhone, phone); else held[bindings.padPhone] = Boolean(pad.buttons[bindings.padPhone]?.pressed);
      if (!driving) { check(bindings.padVoice, voice); check(bindings.padChat, () => chat(true)); }
    };
    frame = requestAnimationFrame(poll);
    return () => { window.removeEventListener('keydown', onKey); cancelAnimationFrame(frame); };
  }, [playing]);
}

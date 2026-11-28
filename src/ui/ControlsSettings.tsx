import { useEffect, useState } from 'react';
import { DEFAULT_BINDINGS, PAD_LABELS, getControllerSettings, keyLabel, setBinding, updateControllerSettings, type Bindings } from '../systems/controllerSettings';

const ROWS: { id: 'phone' | 'voice' | 'chat'; label: string; key: keyof Bindings; pad: keyof Bindings; hint: string }[] = [
  { id: 'phone', label: 'Celular', key: 'phone', pad: 'padPhone', hint: 'missões, mensagens, provas' },
  { id: 'voice', label: 'Chat de voz (microfone)', key: 'voice', pad: 'padVoice', hint: 'liga e desliga o microfone' },
  { id: 'chat', label: 'Chat de texto / frases rápidas', key: 'chat', pad: 'padChat', hint: 'teclado: digitar · controle: frases rápidas' },
];
const PROTECTED_PAD = [0, 1, 2, 3, 4, 5, 6, 7, 9];

/** Mudar teclas e botões do controle para celular, voz e chat: clique em "Alterar" e aperte a nova tecla ou botão. */
export function ControlsSettings() {
  const [settings, setSettings] = useState(getControllerSettings); const [capturing, setCapturing] = useState<{ id: string; device: 'key' | 'pad' } | null>(null);
  useEffect(() => { const on = (event: Event) => setSettings({ ...(event as CustomEvent).detail }); window.addEventListener('faz:settings-change', on); return () => window.removeEventListener('faz:settings-change', on); }, []);
  useEffect(() => {
    if (!capturing) return; const row = ROWS.find((item) => item.id === capturing.id)!;
    if (capturing.device === 'key') {
      const onKey = (event: KeyboardEvent) => { event.preventDefault(); event.stopPropagation(); if (event.key === 'Escape') { setCapturing(null); return; } if (event.key.length > 1 && !event.key.startsWith('Arrow') && event.key !== 'Enter') return; setBinding(row.key as 'phone' | 'voice' | 'chat', event.key.toLowerCase()); setCapturing(null); };
      window.addEventListener('keydown', onKey, true); return () => window.removeEventListener('keydown', onKey, true);
    }
    let frame = 0; const start = performance.now(); const poll = () => {
      frame = requestAnimationFrame(poll); const pad = Array.from(navigator.getGamepads?.() ?? []).find((item) => item?.connected); if (!pad || performance.now() - start < 350) return;
      pad.buttons.forEach((button, index) => { if (button.pressed && !PROTECTED_PAD.includes(index)) { setBinding(row.pad as 'padPhone' | 'padVoice' | 'padChat', index); setCapturing(null); } });
    };
    frame = requestAnimationFrame(poll); return () => cancelAnimationFrame(frame);
  }, [capturing]);
  const { bindings } = settings;
  return <section className="controls-settings" aria-label="Teclas e botões">
    <div className="advanced-settings-heading"><span>TECLAS E BOTÕES</span><small>Clique em Alterar e aperte a nova tecla ou botão</small></div>
    {ROWS.map((row) => <div key={row.id} className="bind-row"><div><b>{row.label}</b><small>{row.hint}</small></div>
      <button onClick={() => setCapturing({ id: row.id, device: 'key' })}>{capturing?.id === row.id && capturing.device === 'key' ? 'Aperte uma tecla…' : `Tecla ${keyLabel(bindings[row.key] as string)}`}</button>
      <button onClick={() => setCapturing({ id: row.id, device: 'pad' })}>{capturing?.id === row.id && capturing.device === 'pad' ? 'Aperte um botão…' : `Controle ${PAD_LABELS[bindings[row.pad] as number] ?? `B${bindings[row.pad]}`}`}</button></div>)}
    <button className="bind-reset" onClick={() => { updateControllerSettings({ bindings: DEFAULT_BINDINGS }); }}>Restaurar padrão</button>
  </section>;
}

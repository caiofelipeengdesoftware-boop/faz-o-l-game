import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../state';
import { sendChat, useMultiplayerStore } from './Multiplayer';

export const QUICK_PHRASES = ['Me siga!', 'Preciso de ajuda aqui!', 'Cuidado, perigo!', 'Valeu!', 'Onde você está?', 'Vamos para a missão', 'Entendido', 'Boa jogada!'];
const ROLE_COLOR = { police: '#8fb3d9', criminal: '#d9806b', civilian: '#d9d3b6' } as const;

/** Chat de texto (tecla configurável, padrão T) e frases rápidas para quem joga de controle. */
export function ChatPanel({ connected }: { connected: boolean }) {
  const messages = useMultiplayerStore((state) => state.messages);
  const chatOpen = useGameStore((state) => state.chatOpen);
  const quickOpen = useGameStore((state) => state.quickChatOpen);
  const [text, setText] = useState(''); const [now, setNow] = useState(Date.now()); const input = useRef<HTMLInputElement>(null);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  useEffect(() => { if (chatOpen) { setText(''); window.setTimeout(() => input.current?.focus(), 30); } }, [chatOpen]);
  useEffect(() => {
    const back = () => { const store = useGameStore.getState(); if (store.chatOpen) store.setChatOpen(false); if (store.quickChatOpen) store.setQuickChatOpen(false); };
    window.addEventListener('pad:back', back); return () => window.removeEventListener('pad:back', back);
  }, []);
  useEffect(() => {
    if (!quickOpen) return;
    const onKey = (event: KeyboardEvent) => { const n = Number(event.key); if (n >= 1 && n <= 8) { sendChat(QUICK_PHRASES[n - 1]); useGameStore.getState().setQuickChatOpen(false); } else if (event.key === 'Escape') useGameStore.getState().setQuickChatOpen(false); };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [quickOpen]);
  const submit = () => { const value = text.trim(); if (value) sendChat(value); setText(''); useGameStore.getState().setChatOpen(false); };
  const visible = messages.filter((message) => chatOpen || now - message.at < 12000).slice(-6);
  return <>
    <div className={`chat-log ${chatOpen ? 'is-open' : ''}`} aria-live="polite">
      {visible.map((message, index) => <p key={`${message.at}-${index}`}><b style={{ color: ROLE_COLOR[message.role] }}>{message.name}</b> {message.text}</p>)}
      {chatOpen && !connected && <p className="chat-offline">Você está offline. As mensagens só chegam a outros jogadores quando o servidor online estiver conectado.</p>}
    </div>
    {chatOpen && <div className="chat-input" data-pad-scope><input ref={input} value={text} maxLength={140} placeholder="Digite e pressione Enter · Esc cancela" onChange={(event) => setText(event.target.value)}
      onKeyDown={(event) => { event.stopPropagation(); if (event.key === 'Enter') submit(); else if (event.key === 'Escape') useGameStore.getState().setChatOpen(false); }} /><button onClick={submit}>Enviar</button></div>}
    {quickOpen && <div className="quick-chat" data-pad-scope role="dialog" aria-label="Frases rápidas"><strong>Frases rápidas</strong>
      <div>{QUICK_PHRASES.map((phrase, index) => <button key={phrase} data-pad-default={index === 0 ? '' : undefined} onClick={() => { sendChat(phrase); useGameStore.getState().setQuickChatOpen(false); }}><kbd>{index + 1}</kbd>{phrase}</button>)}</div>
      <small>A envia · B fecha</small></div>}
  </>;
}

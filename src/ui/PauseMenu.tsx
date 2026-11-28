import { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '../state';
import { QUESTS, type QuestId } from '../state/slices/questSlice';
import { sendChat, useMultiplayerStore } from '../multiplayer/Multiplayer';
import { AdvancedSettings } from './MainMenu';
import { ControlsSettings } from './ControlsSettings';
import { MapView } from './MapView';
import { getControllerLabel } from '../systems/controllerSettings';

type Tab = 'map' | 'brief' | 'stats' | 'settings' | 'game' | 'online';
const TABS: { id: Tab; label: string }[] = [{ id: 'map', label: 'MAPA' }, { id: 'brief', label: 'RESUMO' }, { id: 'stats', label: 'ESTATÍSTICAS' }, { id: 'settings', label: 'CONFIGURAÇÕES' }, { id: 'game', label: 'JOGO' }, { id: 'online', label: 'ONLINE' }];
const money = (value: number) => `R$ ${value.toLocaleString('pt-BR')}`;
const clock = (seconds: number, night: boolean) => { const total = Math.floor(seconds / 60); return `${night ? 'Noite' : 'Dia'} · ${Math.floor(total / 60)}h${String(total % 60).padStart(2, '0')} jogados`; };

type Props = { soundEnabled: boolean; cameraMode: 'third' | 'first'; timeOfDay: 'day' | 'night'; weather: 'clear' | 'rain'; controllerName: string;
  onResume: () => void; onSave: () => void; onTitle: () => void; onAcceptQuest: (id: QuestId) => void; onToggleSound: () => void; onToggleCamera: () => void; onToggleTime: () => void; onToggleWeather: () => void };

/** Menu de pausa em abas, no estilo dos jogos de mundo aberto atuais: mapa, resumo, estatísticas, ajustes, jogo e online. */
export function PauseMenu(props: Props) {
  const tab = useGameStore((state) => state.pauseTab) as Tab; const setTab = useGameStore((state) => state.setPauseTab);
  const wallet = useGameStore((state) => state.wallet); const profile = useGameStore((state) => state.profile); const stats = useGameStore((state) => state.stats);
  const quests = useGameStore((state) => state.quests); const reputation = useGameStore((state) => state.reputation);
  const goTab = (delta: number) => { const index = TABS.findIndex((item) => item.id === tab); setTab(TABS[(index + delta + TABS.length) % TABS.length].id); };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement | null)?.tagName === 'INPUT') return;
      if (event.key === 'Escape') { event.preventDefault(); props.onResume(); }
      else if (event.key === 'q' || event.key === 'Q') goTab(-1); else if (event.key === 'e' || event.key === 'E') goTab(1);
    };
    const onTab = (event: Event) => goTab((event as CustomEvent).detail as number);
    window.addEventListener('keydown', onKey); window.addEventListener('pad:tab', onTab); window.addEventListener('pad:back', props.onResume);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('pad:tab', onTab); window.removeEventListener('pad:back', props.onResume); };
  });
  return <div className="pause-menu" data-pad-scope>
    <header className="pause-top"><div className="pause-brand"><b>FAZ O L</b><small>REPÚBLICA DE AURORA</small></div>
      <div className="pause-player"><div><b>{profile.name}</b><small>{clock(stats.playSeconds, props.timeOfDay === 'night')}</small><strong>{money(wallet)}</strong></div><span className="pause-avatar" style={{ background: profile.look.top }}>{profile.name.slice(0, 1)}</span></div></header>
    <nav className="pause-tabs" aria-label="Menu de pausa"><kbd>LB · Q</kbd>{TABS.map((item) => <button key={item.id} className={item.id === tab ? 'is-active' : ''} onClick={() => setTab(item.id)} data-pad-default={item.id === tab ? '' : undefined}>{item.label}</button>)}<kbd>E · RB</kbd></nav>
    <section className="pause-body">
      {tab === 'map' && <MapView />}
      {tab === 'brief' && <Brief quests={quests} onAccept={props.onAcceptQuest} reputation={reputation} />}
      {tab === 'stats' && <Stats stats={stats} wallet={wallet} reputation={reputation} done={quests.filter((q) => q.status === 'complete').length} />}
      {tab === 'settings' && <div className="pause-settings">
        <div className="pause-rows">
          <button className="setting-row" onClick={props.onToggleSound}><span>Áudio e vozes</span><b>{props.soundEnabled ? 'LIGADOS' : 'DESLIGADOS'}</b></button>
          <button className="setting-row" onClick={props.onToggleCamera}><span>Câmera padrão</span><b>{props.cameraMode === 'third' ? '3ª PESSOA' : '1ª PESSOA'}</b></button>
          <button className="setting-row" onClick={props.onToggleTime}><span>Horário da cidade</span><b>{props.timeOfDay === 'day' ? 'DIA' : 'NOITE'}</b></button>
          <button className="setting-row" onClick={props.onToggleWeather}><span>Clima</span><b>{props.weather === 'clear' ? 'SECO' : 'CHUVA'}</b></button>
          <p className="pause-note">{props.controllerName ? `Controle: ${getControllerLabel(props.controllerName)}` : 'Conecte um controle e aperte qualquer botão.'}</p>
        </div>
        <div className="pause-rows"><AdvancedSettings /><ControlsSettings /></div>
      </div>}
      {tab === 'game' && <GameTab {...props} />}
      {tab === 'online' && <OnlineTab />}
    </section>
    <footer className="pause-foot"><span><kbd>Esc</kbd><kbd>B</kbd> Voltar ao jogo</span><span><kbd>A</kbd> Selecionar</span><span><kbd>LB</kbd><kbd>RB</kbd> Trocar aba</span></footer>
  </div>;
}

function Brief({ quests, onAccept, reputation }: { quests: ReturnType<typeof useGameStore.getState>['quests']; onAccept: (id: QuestId) => void; reputation: number }) {
  const tracked = useGameStore((state) => state.trackedQuestId);
  const status = (id: string) => quests.find((q) => q.id === id)?.status ?? 'available'; const progress = (id: string) => quests.find((q) => q.id === id)?.progress ?? 0;
  return <div className="pause-brief"><div className="brief-rep"><small>REPUTAÇÃO</small><strong>{reputation}</strong><i><u style={{ width: `${Math.min(100, reputation)}%` }} /></i></div>
    <div className="brief-list">{QUESTS.map((quest) => { const state = status(quest.id); const locked = Boolean(quest.requires && status(quest.requires) !== 'complete'); const now = progress(quest.id);
      return <article key={quest.id} className={`brief-card is-${state}`}>
        <header><div><b>{quest.title}</b><small>{state === 'complete' ? 'CONCLUÍDA' : state === 'active' ? 'EM ANDAMENTO' : locked ? 'BLOQUEADA' : 'DISPONÍVEL'} · {money(quest.reward)}</small></div>
          {state === 'available' && !locked && <button onClick={() => onAccept(quest.id)}>Aceitar</button>}
          {state === 'active' && <button onClick={() => useGameStore.getState().trackQuest(quest.id)}>{tracked === quest.id ? 'Rastreando' : 'Rastrear'}</button>}
          {state === 'complete' && <span className="brief-check">✓</span>}</header>
        <p>{quest.description}</p>
        {state !== 'available' && <ol>{quest.steps.map((step, index) => <li key={step} className={state === 'complete' || index < now ? 'is-done' : index === now ? 'is-now' : ''}>{step}</li>)}</ol>}
        {locked && state === 'available' && <small className="brief-lock">Conclua “{QUESTS.find((q) => q.id === quest.requires)?.title}” primeiro.</small>}
      </article>; })}</div></div>;
}

function Stats({ stats, wallet, reputation, done }: { stats: ReturnType<typeof useGameStore.getState>['stats']; wallet: number; reputation: number; done: number }) {
  const cards: [string, string][] = [['Tempo de serviço', `${Math.floor(stats.playSeconds / 3600)}h ${Math.floor((stats.playSeconds % 3600) / 60)}min`], ['Missões concluídas', `${done} de ${QUESTS.length}`], ['Dinheiro', money(wallet)], ['Reputação', String(reputation)], ['Inimigos derrotados', String(stats.enemiesDown)], ['Prisões', String(stats.arrests)], ['Tiros disparados', String(stats.shotsFired)], ['Distância percorrida', `${(stats.distance / 1000).toFixed(2)} km`], ['Vezes que caiu', String(stats.deaths)], ['Compras na loja', String(stats.purchases)]];
  return <div className="pause-stats">{cards.map(([label, value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>;
}

function GameTab({ onResume, onSave, onTitle }: Props) {
  const [saved, setSaved] = useState(false);
  return <div className="pause-game"><div className="pause-actions">
    <button className="menu-primary" onClick={onResume} data-pad-default>Retomar jogo <span>→</span></button>
    <button onClick={() => { onSave(); setSaved(true); }}>{saved ? 'Progresso salvo ✓' : 'Salvar progresso'} <span>↗</span></button>
    <button onClick={() => useGameStore.getState().setWaypoint(null)}>Remover marcador do mapa <span>✕</span></button>
    <button onClick={onTitle}>Voltar ao menu inicial <span>⌂</span></button></div>
    <div className="pause-help"><h3>Controles</h3>
      <dl><dt>Mover / correr</dt><dd>WASD · Shift · analógico / A</dd><dt>Interagir</dt><dd>E · Y</dd><dt>Mirar / atirar</dt><dd>Botão direito / esquerdo · LT / RT</dd><dt>Celular</dt><dd>P · direcional ←</dd><dt>Voz</dt><dd>V · direcional →</dd><dt>Chat</dt><dd>T · direcional ↓ (frases rápidas)</dd><dt>Mapa / resumo</dt><dd>M / J · View / direcional ↑</dd><dt>Pausa</dt><dd>Esc · Menu</dd></dl>
      <p>Teclas e botões podem ser trocados em Configurações.</p></div></div>;
}

function OnlineTab() {
  const connected = useMultiplayerStore((state) => state.connected); const players = useMultiplayerStore((state) => state.players);
  const messages = useMultiplayerStore((state) => state.messages); const voiceOn = useMultiplayerStore((state) => state.voiceOn); const speaking = useMultiplayerStore((state) => state.speaking);
  const [px, pz] = useGameStore((state) => state.playerPosition); const trackedPlayerId = useGameStore((state) => state.trackedPlayerId);
  const [text, setText] = useState(''); const sorted = useMemo(() => [...players].sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz)), [players, px, pz]);
  const roleName = { police: 'Polícia', civilian: 'Cidadão', criminal: 'Foragido' } as const;
  return <div className="pause-online">
    <section><div className={`online-status ${connected ? 'is-on' : ''}`}><i />{connected ? `Conectado · ${players.length + 1} no distrito` : 'Sem conexão com o servidor online'}</div>
      {!connected && <p className="pause-note">O modo online precisa do servidor do jogo ligado. Veja o arquivo ONLINE.md para hospedar (Render).</p>}
      <button className={`voice-button ${voiceOn ? 'is-on' : ''}`} onClick={() => window.dispatchEvent(new CustomEvent('faz:voice-toggle'))} data-pad-default>🎙 {voiceOn ? 'Microfone ligado · tocar para desligar' : 'Ligar microfone (chat de voz)'}</button>
      <h3>Jogadores</h3>
      {sorted.length === 0 && <p className="pause-note">Ninguém por perto ainda. Chame um amigo para abrir o jogo no mesmo endereço.</p>}
      {sorted.map((player) => <div key={player.id} className="friend-row"><span className={speaking.includes(player.id) ? 'is-speaking' : ''}>{player.name.slice(0, 1)}</span><div><b>{player.name}</b><small>{roleName[player.role]} · {Math.round(Math.hypot(player.x - px, player.z - pz))} m</small></div>
        <button onClick={() => { useGameStore.getState().setTrackedPlayer(player.id); useGameStore.getState().setWaypoint([Math.round(player.x), Math.round(player.z)]); useGameStore.getState().setPauseTab('map'); }}>{trackedPlayerId === player.id ? 'Rastreando' : 'Rastrear'}</button>
        <button onClick={() => { useGameStore.getState().restorePlayerAt(player.x - 2, player.z); }}>Ir até</button></div>)}
    </section>
    <section><h3>Chat</h3><div className="online-chat">{messages.slice(-14).map((message, index) => <p key={index}><b>{message.name}</b> {message.text}</p>)}{messages.length === 0 && <p className="pause-note">Nenhuma mensagem. Em jogo, aperte T para escrever.</p>}</div>
      <form onSubmit={(event) => { event.preventDefault(); if (text.trim()) sendChat(text.trim()); setText(''); }}><input value={text} maxLength={140} onChange={(event) => setText(event.target.value)} placeholder="Escrever mensagem" /><button type="submit">Enviar</button></form></section>
  </div>;
}

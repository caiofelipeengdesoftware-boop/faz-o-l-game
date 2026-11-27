import { useEffect } from 'react';
import { useGameStore } from '../state';
import { MiniMap } from './MiniMap';
import { getControllerLabel, getControllerSettings } from '../systems/controllerSettings';
import { QUESTS, type QuestId } from '../state/slices/questSlice';
import { Phone } from './Phone';

function QuestBoard({ onAccept }: { onAccept: (id: QuestId) => void }) {
  const quests = useGameStore((state) => state.quests);
  const tracked = useGameStore((state) => state.trackedQuestId);
  const close = useGameStore((state) => state.toggleQuestBoard);
  useEffect(() => {
    let lastUp = false; let lastDown = false; let lastAccept = false;
    const timer = window.setInterval(() => {
      const pad = Array.from(navigator.getGamepads?.() ?? []).find((candidate) => candidate?.connected);
      if (!pad) return;
      const up = Boolean(pad.buttons[12]?.pressed) || (pad.axes[1] ?? 0) < -0.7;
      const down = Boolean(pad.buttons[13]?.pressed) || (pad.axes[1] ?? 0) > 0.7;
      const accept = Boolean(pad.buttons[0]?.pressed);
      const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.quest-board button:not(:disabled)'));
      const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
      if ((up && !lastUp) || (down && !lastDown)) buttons[Math.max(0, Math.min(buttons.length - 1, current + (up ? -1 : 1)))]?.focus();
      if (accept && !lastAccept) (buttons[current >= 0 ? current : 0])?.click();
      lastUp = up; lastDown = down; lastAccept = accept;
    }, 90);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
    window.addEventListener('keydown', escape); return () => window.removeEventListener('keydown', escape);
  }, [close]);
  return <div className="quest-board-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
    <section className="quest-board" role="dialog" aria-modal="true" aria-labelledby="quest-title">
      <header><div><span className="hud-eyebrow">CENTRAL DE OPERAÇÕES</span><h2 id="quest-title">Trabalhos</h2></div><button className="hud-icon" aria-label="Fechar trabalhos" onClick={close}>×</button></header>
      <div className="quest-list">{QUESTS.map((quest) => {
        const progress = quests.find((item) => item.id === quest.id) ?? { id: quest.id, status: 'available' as const, progress: 0 };
        const completed = progress.status === 'complete'; const active = progress.status === 'active';
        const locked = Boolean(quest.requires && quests.find((item) => item.id === quest.requires)?.status !== 'complete');
        const objective = active ? quest.steps[Math.min(progress.progress, quest.steps.length - 1)] : quest.description;
        return <article key={quest.id} className={`quest-row ${active ? 'is-active' : ''}`}>
          <div className="quest-row-copy"><div className="quest-row-meta"><strong>{quest.title}</strong><span>{completed ? 'CONCLUÍDO' : active ? 'EM ANDAMENTO' : 'DISPONÍVEL'}</span></div><p>{objective}</p><small>Recompensa · R$ {quest.reward.toLocaleString('pt-BR')} · reputação +{quest.reputation}</small></div>
          {active ? <button className="quest-action" onClick={() => useGameStore.getState().trackQuest(quest.id)}>{tracked === quest.id ? 'RASTREANDO' : 'RASTREAR'}</button> : completed ? <span className="quest-check">✓</span> : locked ? <span className="quest-lock">BLOQUEADA</span> : <button className="quest-action quest-accept" onClick={() => onAccept(quest.id)}>ACEITAR</button>}
        </article>;
      })}</div>
      <footer>Direcional ou LS para navegar · A / × para confirmar · Esc fecha</footer>
    </section>
  </div>;
}

function NoticeToast() {
  const notice = useGameStore((state) => state.notice);
  useEffect(() => {
    if (!notice) return;
    const id = notice.id; const timer = window.setTimeout(() => useGameStore.getState().clearNotice(id), 4600);
    return () => window.clearTimeout(timer);
  }, [notice]);
  return notice ? <div className="notice-toast" role="status"><span>●</span>{notice.text}</div> : null;
}

function usePhoneKey() {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || (event.target as HTMLElement | null)?.tagName === 'INPUT') return;
      if (event.key === 'p' || event.key === 'P') { document.exitPointerLock?.(); useGameStore.getState().togglePhone(); }
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, []);
}

export function HUD({ onDonate, onMissionStart, onPause, onToggleCamera, onAcceptQuest }: { onDonate: () => void; onMissionStart: () => void; onPause: () => void; onToggleCamera: () => void; onAcceptQuest: (id: QuestId) => void }) {
  usePhoneKey();
  const alert = useGameStore((state) => state.alertLevel);
  const interactHint = useGameStore((state) => state.interactHint);
  const health = useGameStore((state) => state.playerHealth);
  const armor = useGameStore((state) => state.playerArmor);
  const ammo = useGameStore((state) => state.playerAmmo);
  const controllerName = useGameStore((state) => state.controllerName);
  const controllerConnected = useGameStore((state) => state.controllerConnected);
  const inputDevice = useGameStore((state) => state.inputDevice);
  const missionPhase = useGameStore((state) => state.missionPhase);
  const missionText = useGameStore((state) => state.missionText);
  const enemies = useGameStore((state) => state.enemiesRemaining);
  const driving = useGameStore((state) => state.isDriving);
  const isInside = useGameStore((state) => state.isInside);
  const interiorKind = useGameStore((state) => state.interiorKind);
  const quests = useGameStore((state) => state.quests);
  const trackedQuestId = useGameStore((state) => state.trackedQuestId);
  const showQuestBoard = useGameStore((state) => state.showQuestBoard);
  const map = useGameStore((state) => state.showMap);
  const player = useGameStore((state) => state.playerPosition);
  const vehicle = useGameStore((state) => state.vehiclePosition);
  const phaseQuest = useGameStore((state) => state.quests.find((quest) => quest.id === 'contracts'));
  const carDistance = Math.hypot(player[0] - vehicle[0], player[1] - vehicle[1]);
  const officerDistance = Math.hypot(player[0] + 11, player[1] - 10);
  const evidenceDistance = Math.hypot(player[0] - 45, player[1] + 43);
  const houseDistance = Math.hypot(player[0] + 45, player[1] + 37);
  const clubDistance = Math.hypot(player[0] + 15, player[1] - 8);
  const prompt = isInside ? `Sair d${interiorKind === 'club' ? 'a boate' : 'o apartamento'}` : driving ? 'Sair do veículo' : carDistance < 4.5 ? 'Entrar no veículo' : houseDistance < 2.8 ? 'Entrar no apartamento' : clubDistance < 3.1 ? 'Entrar na boate' : missionPhase === 'evidence' && evidenceDistance < 3.5 ? 'Recolher as provas' : (missionPhase === 'available' || missionPhase === 'complete') && officerDistance < 3.2 ? 'Falar com a inspetora' : interactHint;
  const controllerLabel = getControllerLabel(controllerName, getControllerSettings().profile);
  const buttonName = inputDevice === 'gamepad' ? controllerLabel === 'PlayStation' ? '△' : 'Y' : 'E';

  return <>
    <aside className={`wanted-status ${alert ? '' : 'is-calm'}`} aria-label="Nível de alerta"><span>{alert ? 'PROCURADO' : 'CIDADE EM PAZ'}</span><strong>{Array.from({ length: 5 }, (_, i) => <i key={i} className={i < alert ? 'star-on' : ''}>★</i>)}</strong><b className="ammo-readout">▣ {ammo}{missionPhase === 'shootout' && <small>· {enemies} ALVOS</small>}</b></aside>
    <nav className="gta-actions" aria-label="Ações do jogo">
      <button className="hud-icon" title="Celular (P)" aria-label="Abrir celular" onClick={() => useGameStore.getState().togglePhone()}>☎</button>
      <button className="hud-icon" title="Trabalhos (J / direcional para cima)" aria-label="Abrir trabalhos" onClick={() => useGameStore.getState().toggleQuestBoard()}>☷</button>
      <button className={`hud-icon ${map ? 'is-selected' : ''}`} title="Mapa (M / View)" aria-label="Ampliar mapa" onClick={() => useGameStore.getState().toggleMap()}>▦</button>
      <button className="hud-icon" title="Trocar câmera (V)" aria-label="Trocar câmera" onClick={onToggleCamera}>◉</button>
      <button className="hud-icon" title="Pausar (Esc / Start)" aria-label="Pausar jogo" onClick={onPause}>Ⅱ</button>
      <button className="hud-icon support-icon" title="Apoiar o desenvolvimento" aria-label="Apoiar o jogo" onClick={onDonate}>♡</button>
    </nav>
    {controllerConnected && <div className="input-device-chip">{inputDevice === 'gamepad' ? 'CONTROLE' : 'TECLADO · MOUSE'}</div>}
    <MiniMap />
    <NoticeToast />
    <section className={`player-vitals ${health >= 100 && armor >= 100 ? 'is-full' : ''}`} aria-label="Vitalidade e colete">
      <div><span>VIDA</span><b>{health}</b><i className="vital-track"><i className="vital-health" style={{ width: `${health}%` }} /></i></div>
      <div><span>COLETE</span><b>{armor}</b><i className="vital-track"><i className="vital-armor" style={{ width: `${armor}%` }} /></i></div>
    </section>
    <section className="quest-tracker-stack" aria-label="Missões ativas">{quests.filter((quest) => quest.status === 'active').filter((quest, position, list) => trackedQuestId ? quest.id === trackedQuestId : position === list.length - 1).map((active) => {
      const details = QUESTS.find((quest) => quest.id === active.id);
      if (!details) return null;
      const line = active.id === 'contracts' && missionPhase !== 'available' ? missionText : details.steps[Math.min(active.progress, details.steps.length - 1)];
      const done = active.id === 'contracts' ? Math.min(phaseQuest?.progress ?? 0, details.steps.length) : active.progress;
      return <button key={active.id} className={`quest-tracker ${trackedQuestId === active.id ? 'is-tracked' : ''}`} onClick={() => useGameStore.getState().trackQuest(active.id)} title="Selecionar objetivo no minimapa"><span>{details.title}</span><small>{line}</small><i>{done}/{details.steps.length}</i></button>;
    })}</section>
    {prompt && <div className="interact-prompt"><kbd>{isInside || inputDevice !== 'gamepad' ? 'E' : buttonName}</kbd>{prompt}</div>}
    {showQuestBoard && <QuestBoard onAccept={onAcceptQuest} />}
    <Phone />
    {!isInside && missionPhase === 'available' && phaseQuest?.status === 'available' && <button className="minimal-mission-offer" onClick={onMissionStart}>Aceitar ocorrência <kbd>{inputDevice === 'gamepad' ? 'Y / △' : 'E'}</kbd></button>}
  </>;
}

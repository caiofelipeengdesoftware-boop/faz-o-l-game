import { useEffect, useState, type CSSProperties } from 'react';
import { CAST } from '../data/story';
import { getAudioMix, setAudioMix, speakLine, stopSpeech } from '../systems/audio';
import { getControllerLabel, getControllerSettings, updateControllerSettings, type ControllerProfile } from '../systems/controllerSettings';

export type MenuPage = 'title' | 'online' | 'intro' | 'credits' | 'settings' | 'pause' | 'cast';
type GameRole = 'police' | 'civilian' | 'criminal';
export const STORY = [
  { title: 'República de Aurora · 05h47', text: 'A capital ainda dorme quando uma nova denúncia chega à delegacia. Documentos apontam contratos públicos desviados e pagamentos escondidos em uma empresa de fachada.', voice: 'República de Aurora. Cinco horas e quarenta e sete da manhã. A capital ainda dorme quando uma nova denúncia chega à delegacia.' },
  { title: 'Um caso sem respostas', text: 'A inspetora Helena passou meses seguindo o rastro. A testemunha principal desapareceu e o arquivo que poderia provar o esquema sumiu na noite passada.', voice: 'Um caso sem respostas. A inspetora Helena passou meses seguindo o rastro. A testemunha principal desapareceu.' },
  { title: 'Seu primeiro plantão', text: 'Você é o novo investigador da equipe. A primeira pista leva a um depósito no distrito industrial. Lá dentro, alguém já sabe que você está a caminho.', voice: 'Seu primeiro plantão. Você é o novo investigador da equipe. A primeira pista leva a um depósito no distrito industrial.' },
];

function AdvancedSettings() {
  const [controller, setController] = useState(getControllerSettings);
  const [mixer, setMixer] = useState(getAudioMix);
  const changeMixer = (key: 'master' | 'music' | 'effects', value: number) => {
    const next = setAudioMix({ [key]: value }); setMixer(next);
  };
  const changeMouse = (value: number) => setController(updateControllerSettings({ mouseSensitivity: value }));
  const qualities = ['performance', 'balanced', 'quality'] as const;
  const changeQuality = (value: number) => setController(updateControllerSettings({ graphicsQuality: qualities[value] }));
  return <section className="advanced-settings" aria-label="Ajustes de resposta">
    <div className="advanced-settings-heading"><span>AJUSTES EM TEMPO REAL</span><small>As alterações são salvas neste navegador</small></div>
    <label className="range-setting"><span>Sensibilidade do mouse <b>{controller.mouseSensitivity.toFixed(1)}×</b></span><input type="range" min="0.3" max="2.5" step="0.1" value={controller.mouseSensitivity} onChange={(event) => changeMouse(Number(event.target.value))} /></label>
    <label className="range-setting"><span>Qualidade gráfica <b>{controller.graphicsQuality === 'performance' ? 'DESEMPENHO' : controller.graphicsQuality === 'quality' ? 'ALTA' : 'EQUILIBRADA'}</b></span><input type="range" min="0" max="2" step="1" value={qualities.indexOf(controller.graphicsQuality)} onChange={(event) => changeQuality(Number(event.target.value))} /></label>
    <label className="range-setting"><span>Volume geral <b>{Math.round(mixer.master * 100)}%</b></span><input type="range" min="0" max="1" step="0.01" value={mixer.master} onChange={(event) => changeMixer('master', Number(event.target.value))} /></label>
    <label className="range-setting"><span>Música <b>{Math.round(mixer.music * 100)}%</b></span><input type="range" min="0" max="1" step="0.01" value={mixer.music} onChange={(event) => changeMixer('music', Number(event.target.value))} /></label>
    <label className="range-setting"><span>Efeitos sonoros <b>{Math.round(mixer.effects * 100)}%</b></span><input type="range" min="0" max="1" step="0.01" value={mixer.effects} onChange={(event) => changeMixer('effects', Number(event.target.value))} /></label>
  </section>;
}

export function MainMenu({ page, storyIndex, hasSave, soundEnabled, cameraMode, controllerName, timeOfDay, weather, physicsStatus, onRetryPhysics, onNewGame, onStoryStart, onContinue, onCredits, onSettings, onOnline, onCast, onBack, onStoryNext, onStorySkip, onToggleSound, onToggleCamera, onToggleTime, onToggleWeather, onPauseResume, onPauseSave, onReturnTitle }: {
  page: MenuPage; storyIndex: number; hasSave: boolean; soundEnabled: boolean; cameraMode: 'third' | 'first'; controllerName: string; timeOfDay: 'day' | 'night'; weather: 'clear' | 'rain';
  physicsStatus: 'loading' | 'ready' | 'error'; onRetryPhysics: () => void;
  onNewGame: () => void; onStoryStart: () => void; onContinue: () => void; onCredits: () => void; onSettings: () => void; onOnline: () => void; onCast: () => void; onBack: () => void;
  onStoryNext: () => void; onStorySkip: () => void; onToggleSound: () => void; onToggleCamera: () => void; onToggleTime: () => void; onToggleWeather: () => void;
  onPauseResume: () => void; onPauseSave: () => void; onReturnTitle: () => void;
}) {
  const [controllerSettings, setControllerSettings] = useState(getControllerSettings);
  const [role, setRole] = useState<GameRole>(() => {
    try { const saved = localStorage.getItem('faz-o-l-online-role'); return saved === 'police' || saved === 'criminal' ? saved : 'civilian'; } catch { return 'civilian'; }
  });
  const selectRole = (next: GameRole) => { setRole(next); try { localStorage.setItem('faz-o-l-online-role', next); } catch { /* role choice is optional */ } };
  const profileNames: Record<ControllerProfile, string> = { auto: 'Automático', xbox: 'Xbox / 8BitDo', playstation: 'PlayStation' };
  const changeProfile = () => {
    const profiles: ControllerProfile[] = ['auto', 'xbox', 'playstation'];
    const next = profiles[(profiles.indexOf(controllerSettings.profile) + 1) % profiles.length];
    setControllerSettings(updateControllerSettings({ profile: next }));
  };
  const changeSetting = (key: 'sensitivity' | 'deadzone', values: number[], direction: number) => {
    const current = controllerSettings[key]; const index = values.reduce((best, value, i) => Math.abs(value - current) < Math.abs(values[best] - current) ? i : best, 0);
    setControllerSettings(updateControllerSettings({ [key]: values[(index + direction + values.length) % values.length] }));
  };
  useEffect(() => {
    if (page !== 'intro') return;
    speakLine(STORY[storyIndex].voice, 0.91);
    return () => stopSpeech();
  }, [page, storyIndex]);
  useEffect(() => {
    let lastUp = false; let lastDown = false; let lastAccept = false;
    const timer = window.setInterval(() => {
      const pad = Array.from(navigator.getGamepads?.() ?? []).find((candidate) => candidate?.connected);
      if (!pad) return;
      const up = Boolean(pad.buttons[12]?.pressed) || (pad.axes[1] ?? 0) < -0.72;
      const down = Boolean(pad.buttons[13]?.pressed) || (pad.axes[1] ?? 0) > 0.72;
      const accept = Boolean(pad.buttons[0]?.pressed);
      const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.main-menu-screen button:not(:disabled)'));
      const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
      if ((up && !lastUp) || (down && !lastDown)) {
        const next = Math.max(0, current + (up ? -1 : 1));
        buttons[Math.min(buttons.length - 1, next)]?.focus();
      }
      if (accept && !lastAccept) (buttons[current >= 0 ? current : 0])?.click();
      lastUp = up; lastDown = down; lastAccept = accept;
    }, 90);
    return () => window.clearInterval(timer);
  }, [page]);

  return <main className={`main-menu-screen page-${page}`}>
    {page === 'online' && <article className="menu-panel online-lobby"><div className="eyebrow">DISTRITO · COOPERATIVO</div><h2>Escolha seu<br /><em>papel na cidade.</em></h2><p>Entre na sessão compartilhada. Ajude a equipe a investigar ocorrências e encontrar os mesmos objetivos.</p><div className="role-choices">
      {([['police', 'Polícia', 'Investigar ocorrências'], ['civilian', 'Cidadão', 'Explorar e testemunhar'], ['criminal', 'Foragido', 'Cooperar nas missões']] as const).map(([value, title, detail]) => <button key={value} className={role === value ? 'role-choice selected' : 'role-choice'} onClick={() => selectRole(value)}><strong>{title}</strong><small>{detail}</small></button>)}
    </div><button className="menu-primary online-start" onClick={onNewGame} disabled={physicsStatus !== 'ready'}>{physicsStatus === 'ready' ? 'Entrar na cidade' : physicsStatus === 'error' ? 'Física indisponível' : 'Preparando cidade…'} <span>→</span></button><button className="online-back" onClick={onBack}>Voltar</button></article>}
    <div className="menu-topline"><span>FAZ O L</span><span>UM JOGO DE INVESTIGAÇÃO</span><span>REPÚBLICA DE AURORA</span></div>
    {page === 'title' && <div className="title-layout"><div className="title-menu"><div className="menu-emblem">L</div><div className="eyebrow">CIDADE · INVESTIGAÇÃO · ESCOLHAS</div><h1>FAZ O L</h1><p className="menu-subtitle">A verdade tem um preço.</p><div className="menu-actions">
      <button className="menu-primary" onClick={onNewGame} disabled={physicsStatus !== 'ready'}>{physicsStatus === 'ready' ? 'Nova partida' : physicsStatus === 'error' ? 'Física indisponível' : 'Preparando cidade…'} <span>→</span></button>
      <button disabled={!hasSave || physicsStatus !== 'ready'} onClick={onContinue}>Continuar <span>↗</span></button>
      <div className="menu-grid">
        <button onClick={onOnline}>Sessão online <span>◎</span></button><button onClick={onCast}>Elenco <span>☰</span></button>
        <button onClick={onStoryStart} disabled={physicsStatus !== 'ready'}>Prólogo <span>▶</span></button><button onClick={onSettings}>Configurações <span>⚙</span></button>
      </div>
      <button className="menu-quiet" onClick={onCredits}>Créditos <span>✦</span></button>
    </div>{physicsStatus === 'error' ? <button className="menu-footnote" onClick={onRetryPhysics}>Não foi possível preparar a física · tentar novamente</button> : <small className="menu-footnote">{physicsStatus === 'ready' ? 'Use fones de ouvido · Teclado, mouse, gamepad e toque' : 'Preparando física e cidade…'}</small>}</div>
      <aside className="case-card"><div className="eyebrow">CASO 001 · EM ABERTO</div><h3>Contratos suspeitos</h3><p>Uma denúncia, uma empresa de fachada e um secretário que nunca se suja. Siga o dinheiro até quem manda.</p>
        <ul><li><b>01</b> Depósito industrial: recupere as provas</li><li><b>02</b> Marina viu tudo e tem medo de falar</li><li><b>03</b> Persiga Tavinho antes que ele escape</li></ul>
        <div className="case-tags"><span>Investigação</span><span>Tiroteio</span><span>Perseguição</span></div>
        <div className="case-keys"><kbd>WASD</kbd> mover <kbd>Shift</kbd> correr <kbd>E</kbd> interagir <kbd>J</kbd> trabalhos <kbd>M</kbd> mapa</div></aside></div>}
    {page === 'intro' && <article className="story-card"><div className="eyebrow">PRÓLOGO · {String(storyIndex + 1).padStart(2, '0')} / {String(STORY.length).padStart(2, '0')}</div><h2>{STORY[storyIndex].title}</h2><p>{STORY[storyIndex].text}</p><div className="story-progress"><span style={{ width: `${((storyIndex + 1) / STORY.length) * 100}%` }} /></div><button className="menu-primary" onClick={onStoryNext}>{storyIndex === STORY.length - 1 ? 'Entrar na cidade' : 'Continuar'} <span>→</span></button><button className="story-skip" onClick={onStorySkip}>Pular prólogo e entrar na cidade</button><small>Texto narrado pela voz disponível no seu navegador</small></article>}
    {page === 'settings' && <article className="menu-panel settings-panel"><div className="eyebrow">PREFERÊNCIAS</div><h2>Configurações</h2><AdvancedSettings /><button className="setting-row" onClick={onToggleSound}><span>Áudio e vozes</span><b>{soundEnabled ? 'LIGADOS' : 'DESLIGADOS'}</b></button><button className="setting-row" onClick={onToggleCamera}><span>Câmera padrão</span><b>{cameraMode === 'third' ? '3ª PESSOA' : '1ª PESSOA'}</b></button><button className="setting-row" onClick={onToggleTime}><span>Horário da cidade</span><b>{timeOfDay === 'day' ? 'DIA' : 'NOITE'}</b></button><button className="setting-row" onClick={onToggleWeather}><span>Clima</span><b>{weather === 'clear' ? 'SECO' : 'CHUVA'}</b></button><button className="setting-row" onClick={changeProfile}><span>Layout do controle</span><b>{profileNames[controllerSettings.profile]}</b></button><button className="setting-row" onClick={() => changeSetting('sensitivity', [0.8, 1.1, 1.4, 1.7, 2, 2.3], 1)}><span>Sensibilidade do RS</span><b>{controllerSettings.sensitivity.toFixed(1)} · clique para ajustar</b></button><button className="setting-row" onClick={() => changeSetting('deadzone', [0.08, 0.12, 0.16, 0.2, 0.24], 1)}><span>Zona morta LS / RS</span><b>{Math.round(controllerSettings.deadzone * 100)}% · clique para ajustar</b></button><button className="setting-row" onClick={() => setControllerSettings(updateControllerSettings({ invertY: !controllerSettings.invertY }))}><span>Inverter eixo vertical do RS</span><b>{controllerSettings.invertY ? 'SIM' : 'NÃO'}</b></button><p>{controllerName ? `Conectado: ${getControllerLabel(controllerName)} · ${controllerName}` : 'Conecte o controle USB e pressione qualquer botão para detectá-lo.'} A/× confirma; direcional/LS navega. A pé: LS move, A/× corre, X/□ pula, Y/△ interage, LT/L2 mira, RT/R2 atira, B/○ recarrega, RB/R1 cobre, L3 agacha, R3 olha para trás. No carro: LS vira, LT/L2 freia ou dá ré, RT/R2 acelera, RB/A freia de mão, L3 buzina, direcional muda rádio/luzes, View troca a câmera. Start pausa. V alterna a câmera no teclado.</p><button className="menu-primary" onClick={onBack}>Voltar ao menu <span>↵</span></button></article>}
    {page === 'pause' && <article className="menu-panel"><div className="eyebrow">PLANTÃO PAUSADO</div><h2>Respire.<br /><em>Reavalie o caso.</em></h2><p>O mundo fica em pausa enquanto este menu estiver aberto.</p><div className="menu-actions"><button className="menu-primary" onClick={onPauseResume}>Retomar jogo <span>→</span></button><button onClick={onPauseSave}>Salvar progresso <span>↗</span></button><button onClick={onSettings}>Configurações <span>⚙</span></button><button onClick={onReturnTitle}>Voltar ao menu inicial <span>⌂</span></button></div></article>}
    {page === 'cast' && <article className="menu-panel cast-panel"><div className="eyebrow">ELENCO · REPÚBLICA DE AURORA</div><h2>Quem é quem</h2><div className="cast-grid">
      {CAST.filter((member) => !member.id.startsWith('guarda')).map((member) => <section key={member.id} className="cast-card" style={{ '--accent': member.accent } as CSSProperties}><div className="cast-avatar">{member.name.slice(0, 1)}</div><div><strong>{member.name}</strong><small>{member.role}</small><p>{member.bio}</p></div></section>)}
    </div><button className="menu-primary" onClick={onBack}>Voltar ao menu <span>↵</span></button></article>}
    {page === 'credits' && <article className="menu-panel credits-panel"><div className="eyebrow">FAZ O L · PROTÓTIPO WEB</div><h2>Créditos</h2><p><strong>Uma história fictícia</strong><br />República de Aurora, seus personagens, instituições e acontecimentos são inventados.</p><p><strong>Desenvolvimento</strong><br />Projeto independente FAZ O L</p><p><strong>Áudio e vozes</strong><br />Efeitos sintetizados em tempo real e vozes do navegador, quando disponíveis.</p><p><strong>Imagens</strong><br />Cidade, relevo, clima e personagens são gerados em tempo real, sem modelos externos.</p><button className="menu-primary" onClick={onBack}>Voltar ao menu <span>↵</span></button></article>}
    <footer className="menu-bottom"><span>VERSÃO DE DESENVOLVIMENTO</span><span>BUILD WEB · 2026</span></footer>
  </main>;
}

import { useEffect, useState } from 'react';
import { useGameStore } from '../state';
import { QUESTS } from '../state/slices/questSlice';
import { CAST } from '../data/story';

type App = 'home' | 'quests' | 'messages' | 'contacts' | 'evidence';
type Message = { from: string; text: string; accent: string };

function messagesFor(status: (id: string) => string, progress: (id: string) => number): Message[] {
  const list: Message[] = [{ from: 'Inspetora Helena', accent: '#e2c274', text: 'Bem-vindo à equipe. Sem heróis aqui: anote tudo, confie em pouca gente e nunca assine nada sem ler.' }];
  if (status('contracts') !== 'available') list.push({ from: 'Inspetora Helena', accent: '#e2c274', text: 'Depósito industrial, lado leste. Recupere a pasta de contratos. Eles sabem que você vai.' });
  if (progress('contracts') >= 2) list.push({ from: 'Sargento Duarte', accent: '#8fb3d9', text: 'Tem movimento estranho no perímetro. Fique abaixado e use as caixas como cobertura.' });
  if (status('contracts') === 'complete') list.push({ from: 'Delegado Ramos', accent: '#b0b4ba', text: 'Parabéns pelo trabalho. Traga a pasta original para a minha mesa o quanto antes.' }, { from: 'Sargento Duarte', accent: '#8fb3d9', text: 'Não entregue a pasta ao Ramos. Depois eu explico.' });
  if (status('witness') !== 'available') list.push({ from: 'Carla Mendes', accent: '#d96b7c', text: 'Soube que você procura a Marina. Ela é de confiança. Se ela falar, eu publico.' });
  if (status('witness') === 'complete') list.push({ from: 'Marina', accent: '#e59a6b', text: 'O rapaz de moletom laranja se chama Tavinho. Costuma ficar perto da avenida leste. Cuidado, ele corre.' });
  if (status('chase') === 'complete') list.push({ from: 'Zé do Café', accent: '#c4a66f', text: 'Ouvi dizer que o Tavinho abriu o bico. O secretário já sabe. Ande acompanhado.' }, { from: 'Número desconhecido', accent: '#8a8a8a', text: 'Esqueça o caso e eu esqueço o seu endereço.' });
  return list;
}

export function Phone() {
  const open = useGameStore((state) => state.showPhone);
  const close = useGameStore((state) => state.closePhone);
  const quests = useGameStore((state) => state.quests);
  const tracked = useGameStore((state) => state.trackedQuestId);
  const suspicious = useGameStore((state) => state.suspiciousAssets);
  const reputation = useGameStore((state) => state.reputation);
  const timeOfDay = useGameStore((state) => state.timeOfDay);
  const weather = useGameStore((state) => state.weather);
  const [app, setApp] = useState<App>('home');
  useEffect(() => { if (!open) return; setApp('home'); const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); close(); } }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [open, close]);
  if (!open) return null;
  const status = (id: string) => quests.find((quest) => quest.id === id)?.status ?? 'available';
  const progress = (id: string) => quests.find((quest) => quest.id === id)?.progress ?? 0;
  const evidence = [
    progress('contracts') >= 2 && 'Pasta de contratos recuperada no depósito industrial',
    status('witness') === 'complete' && 'Depoimento de Marina: caminhonete descarregando caixas de madrugada',
    status('chase') === 'complete' && 'Confissão de Tavinho: Brandão manda e o delegado Ramos garante',
    status('patrol') === 'complete' && 'Relatório de ronda: nenhuma ocorrência no bairro',
    suspicious > 0 && `Pagamento suspeito recebido: R$ ${suspicious.toLocaleString('pt-BR')} (isso pesa contra você)`,
  ].filter(Boolean) as string[];
  const messages = messagesFor(status, progress);
  const clock = timeOfDay === 'night' ? '22:14' : '14:32';
  const apps: { id: App; icon: string; label: string; badge?: number }[] = [
    { id: 'quests', icon: '☷', label: 'Missões', badge: quests.filter((quest) => quest.status === 'active').length }, { id: 'messages', icon: '✉', label: 'Mensagens', badge: messages.length },
    { id: 'contacts', icon: '☺', label: 'Contatos' }, { id: 'evidence', icon: '▣', label: 'Provas', badge: evidence.length },
  ];
  return <div className="phone-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
    <section className="phone" role="dialog" aria-label="Celular">
      <div className="phone-notch" />
      <header className="phone-status"><b>{clock}</b><span>{weather === 'rain' ? '🌧 18°' : timeOfDay === 'night' ? '☾ 21°' : '☀ 27°'}</span></header>
      {app === 'home' ? <div className="phone-home">
        <div className="phone-greeting"><small>REPUTAÇÃO</small><strong>{reputation}</strong><div className="phone-bar"><i style={{ width: `${reputation}%` }} /></div></div>
        <div className="phone-apps">{apps.map((item) => <button key={item.id} onClick={() => setApp(item.id)}><span className="phone-icon">{item.icon}{item.badge ? <em>{item.badge}</em> : null}</span>{item.label}</button>)}</div>
        <button className="phone-map" onClick={() => { close(); useGameStore.getState().toggleMap(); }}>▦ Abrir mapa da cidade</button>
      </div> : <div className="phone-app">
        <header><button onClick={() => setApp('home')} aria-label="Voltar">‹</button><strong>{apps.find((item) => item.id === app)?.label}</strong></header>
        <div className="phone-scroll">
          {app === 'quests' && QUESTS.map((quest) => {
            const state = status(quest.id); const locked = quest.requires && status(quest.requires) !== 'complete';
            return <article key={quest.id} className={`phone-card ${state === 'active' ? 'is-active' : ''}`}>
              <div><strong>{quest.title}</strong><small>{state === 'complete' ? 'CONCLUÍDA' : state === 'active' ? `EM ANDAMENTO · ${progress(quest.id)}/${quest.steps.length}` : locked ? 'BLOQUEADA' : 'DISPONÍVEL'}</small></div>
              <p>{state === 'active' ? quest.steps[Math.min(progress(quest.id), quest.steps.length - 1)] : quest.description}</p>
              {state === 'active' && <button onClick={() => useGameStore.getState().trackQuest(quest.id)}>{tracked === quest.id ? 'Rastreando' : 'Rastrear no mapa'}</button>}
            </article>;
          })}
          {app === 'messages' && messages.slice().reverse().map((message, index) => <article key={index} className="phone-message" style={{ borderLeftColor: message.accent }}><strong style={{ color: message.accent }}>{message.from}</strong><p>{message.text}</p></article>)}
          {app === 'contacts' && CAST.filter((member) => member.id !== 'player' && !member.id.startsWith('guarda') && member.id !== 'tavinho').map((member) => <article key={member.id} className="phone-contact"><span style={{ borderColor: member.accent, color: member.accent }}>{member.name.slice(0, 1)}</span><div><strong>{member.name}</strong><small>{member.role}</small></div></article>)}
          {app === 'evidence' && (evidence.length ? evidence.map((item, index) => <article key={index} className="phone-message" style={{ borderLeftColor: '#c6b17b' }}><p>{item}</p></article>) : <p className="phone-empty">Nenhuma prova registrada ainda. Investigue a cidade.</p>)}
        </div>
      </div>}
      <footer className="phone-footer"><button onClick={close}>Fechar · P</button></footer>
    </section>
  </div>;
}

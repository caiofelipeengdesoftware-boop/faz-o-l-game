import { useEffect, useState } from 'react';
import { resolveBribe, type BribeChoice, type BribeOffer } from '../systems/bribery';
import { useGameStore } from '../state';
import { speakLine, stopSpeech } from '../systems/audio';

const choices: { id: BribeChoice; label: string }[] = [
  { id: 'accept', label: 'Aceitar a oferta' }, { id: 'refuse', label: 'Recusar' },
  { id: 'denounce', label: 'Denunciar' }, { id: 'feign', label: 'Fingir aceitar' },
];

export function BribeDialogue({ offer, onClose }: { offer: BribeOffer; onClose: () => void }) {
  const [result, setResult] = useState<string | null>(null);
  useEffect(() => { speakLine(offer.description); return () => stopSpeech(); }, [offer]);
  const choose = (choice: BribeChoice) => {
    const outcome = resolveBribe(choice, offer);
    useGameStore.getState().applyOutcome(outcome.corruptionDelta, outcome.assetsDelta, outcome.reputationDelta);
    if (choice === 'denounce') useGameStore.getState().raiseAlert(2);
    const line = `${choices.find((item) => item.id === choice)?.label}. ${outcome.flags[0].replaceAll('_', ' ')}.`;
    setResult(line); speakLine(line);
  };

  return <div className="dialogue" role="dialog" aria-modal="true" aria-labelledby="dialogue-title">
    <div className="eyebrow">DELEGACIA · INTERROGATÓRIO</div>
    <h2 id="dialogue-title">Uma proposta na mesa</h2>
    <p>{offer.description}</p>
    <div className="offer">R$ {offer.amount.toLocaleString('pt-BR')} <span>em dinheiro vivo</span></div>
    {result ? <><p className="outcome">{result}</p><button className="primary" onClick={onClose}>Voltar à cidade</button></> :
      <div className="choice-list">{choices.map((choice) => <button key={choice.id} onClick={() => choose(choice.id)}>{choice.label}<span>↗</span></button>)}</div>}
  </div>;
}

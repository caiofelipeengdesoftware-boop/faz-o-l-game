import { useEffect } from 'react';
import { speakLine, stopSpeech } from '../systems/audio';
import { useGameStore } from '../state';

export function CharacterDialogue({ onClose }: { onClose: () => void }) {
  const dialogue = useGameStore((state) => state.characterDialogue);
  useEffect(() => {
    if (!dialogue) return;
    speakLine(dialogue.text);
    return () => stopSpeech();
  }, [dialogue]);
  if (!dialogue) return null;
  return <section className="character-dialogue" role="dialog" aria-live="polite" aria-label={`Fala de ${dialogue.speaker}`}>
    <div className="eyebrow">CONVERSA · REPÚBLICA DE AURORA</div>
    <div className="character-dialogue-row"><div className="speaker-mark">{dialogue.speaker.slice(0, 1)}</div><div><strong>{dialogue.speaker}</strong><p>{dialogue.text}</p></div></div>
    <button className="primary" onClick={onClose}>Continuar <span>↵</span></button>
    <small>Voz sintetizada pelo navegador · Use o botão para continuar</small>
  </section>;
}

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { Group } from 'three';
import { consumeInteraction, gameInput } from '../systems/gameInput';
import { setHint } from '../systems/hints';
import { useGameStore } from '../state';
import { CAST, npcDialogue, type CastMember } from '../data/story';
import { Person } from './Person';

function Npc({ member, onBribe }: { member: CastMember; onBribe: () => void }) {
  const root = useRef<Group>(null); const [near, setNear] = useState(false); const nearRef = useRef(false);
  const [x, z] = member.position!;
  useFrame((_, delta) => {
    const group = root.current; if (!group) return;
    if (!gameInput.enabled) return;
    const [px, pz] = useGameStore.getState().playerPosition;
    const dx = px - x; const dz = pz - z; const distance = Math.hypot(dx, dz);
    const inView = distance < 9;
    if (inView !== nearRef.current) { nearRef.current = inView; setNear(inView); }
    const target = distance < 7 ? Math.atan2(dx, dz) : member.facing ?? 0;
    let diff = target - group.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    group.rotation.y += diff * Math.min(1, delta * 5);
    const talkable = distance < 2.8;
    setHint(`npc-${member.id}`, talkable ? `Falar com ${member.name}` : null);
    if (!talkable || !gameInput.interactPressed || !consumeInteraction()) return;
    const store = useGameStore.getState();
    if (member.id === 'marina' && store.quests.find((quest) => quest.id === 'witness')?.status === 'active') {
      store.advanceQuest('witness'); store.advanceQuest('witness');
      store.showCharacterDialogue('Marina', 'Eu vi a caminhonete descarregar caixas no galpão depois da meia-noite. Um rapaz de moletom laranja, o Tavinho, carregava tudo. Posso reconhecer a placa e assinar o depoimento.');
      return;
    }
    if (member.id === 'brandao' && store.quests.find((quest) => quest.id === 'chase')?.status === 'complete') { const line = npcDialogue('brandao', store); store.showCharacterDialogue(line.speaker, line.text); window.setTimeout(onBribe, 50); return; }
    const line = npcDialogue(member.id, store); store.showCharacterDialogue(line.speaker, line.text);
  });
  return <group ref={root} position={[x, 0, z]} rotation-y={member.facing ?? 0}>
    <Person look={member.look} />
    {near && <Html position={[0, 2.25 * (member.look.scale ?? 1), 0]} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
      <div className="npc-tag"><b>{member.name}</b><small>{member.role}</small></div>
    </Html>}
  </group>;
}
export function StoryNpcs({ onBribe }: { onBribe: () => void }) {
  return <>{CAST.filter((member) => member.position).map((member) => <Npc key={member.id} member={member} onBribe={onBribe} />)}</>;
}

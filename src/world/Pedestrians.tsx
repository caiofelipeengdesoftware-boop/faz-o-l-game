import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { consumeInteraction, gameInput } from '../systems/gameInput';
import { useGameStore } from '../state';

const CLOTHING = ['#b96545', '#6b8180', '#c4a66f', '#586a54', '#6e627c', '#d0d0c5', '#354b65', '#a38674'];
const walkers = [
  { x: -8, z: -25, lane: 'z', color: 0, name: 'Marina', line: 'O movimento de caminhões no distrito aumentou de madrugada. Não parecia entrega normal.' },
  { x: 9, z: 21, lane: 'z', color: 1, name: 'Paulo', line: 'Meu irmão trabalha no depósito. Esta semana, mandaram todo mundo ir embora mais cedo.' },
  { x: 35, z: -5, lane: 'z', color: 2, name: 'Dona Célia', line: 'Ouvi sirenes perto dos galpões ontem à noite. Depois disso, ninguém quis falar.' },
  { x: -35, z: 12, lane: 'z', color: 3, name: 'Ravi', line: 'Tem uma rua fechada perto do armazém. A polícia ainda não colocou uma placa.' },
  { x: 20, z: -35, lane: 'x', color: 4, name: 'Lúcia', line: 'Um homem deixou uma pasta no balcão do café e saiu correndo. Não voltei a vê-lo.' },
  { x: -22, z: 35, lane: 'x', color: 5, name: 'Davi', line: 'As obras da avenida foram pagas duas vezes, mas a rua continua cheia de buracos.' },
  { x: 50, z: 8, lane: 'z', color: 6, name: 'Nina', line: 'Vi carros sem identificação entrando no galpão depois do fechamento.' },
  { x: -50, z: -10, lane: 'z', color: 7, name: 'João', line: 'Os comerciantes do bairro estão recebendo ameaças. A gente só quer trabalhar em paz.' },
  { x: -8, z: 48, lane: 'x', color: 0, name: 'Marta', line: 'Se encontrar alguma prova, não deixe ela desaparecer dentro de um gabinete.' },
  { x: 8, z: -49, lane: 'x', color: 1, name: 'Beto', line: 'Aquela luz no depósito fica acesa até de madrugada, mesmo quando dizem que está vazio.' },
];

function Pedestrian({ x, z, lane, color, index, name, line }: { x: number; z: number; lane: string; color: number; index: number; name: string; line: string }) {
  const root = useRef<Group>(null);
  const leftArm = useRef<Group>(null); const rightArm = useRef<Group>(null);
  const leftLeg = useRef<Group>(null); const rightLeg = useRef<Group>(null);
  const phase = useRef(index * 2.1);
  useFrame((_, delta) => {
    if (!gameInput.enabled) return;
    const group = root.current;
    if (!group) return;
    phase.current += delta * (index % 2 ? 8.4 : -8.4);
    if (lane === 'z') { group.position.z += delta * (index % 2 ? 0.68 : -0.68); if (group.position.z > z + 12) group.position.z = z - 12; if (group.position.z < z - 12) group.position.z = z + 12; group.rotation.y = index % 2 ? 0 : Math.PI; }
    else { group.position.x += delta * (index % 2 ? 0.68 : -0.68); if (group.position.x > x + 12) group.position.x = x - 12; if (group.position.x < x - 12) group.position.x = x + 12; group.rotation.y = index % 2 ? Math.PI / 2 : -Math.PI / 2; }
    const swing = Math.sin(phase.current) * 0.32;
    if (leftArm.current) leftArm.current.rotation.x = swing;
    if (rightArm.current) rightArm.current.rotation.x = -swing;
    if (leftLeg.current) leftLeg.current.rotation.x = -swing;
    if (rightLeg.current) rightLeg.current.rotation.x = swing;

    if (gameInput.interactPressed) {
      const [px, pz] = useGameStore.getState().playerPosition;
      if (Math.hypot(px - group.position.x, pz - group.position.z) < 2.6 && consumeInteraction()) {
        const store = useGameStore.getState();
        const witness = store.quests.find((quest) => quest.id === 'witness');
        if (name === 'Marina' && witness?.status === 'active') {
          store.advanceQuest('witness'); store.advanceQuest('witness');
          store.showCharacterDialogue(name, 'Eu vi a caminhonete descarregar caixas no galpão depois da meia-noite. Posso reconhecer a placa e assinar o depoimento.');
        } else store.showCharacterDialogue(name, line);
      }
    }
  });
  return <group ref={root} position={[x, 0, z]}>
    <mesh castShadow position={[0, 1.06, 0]}><capsuleGeometry args={[0.23, 0.62, 5, 9]} /><meshStandardMaterial color={CLOTHING[color % CLOTHING.length]} roughness={0.9} /></mesh>
    <mesh castShadow position={[0, 1.73, 0]}><sphereGeometry args={[0.19, 14, 12]} /><meshStandardMaterial color="#b98262" roughness={0.92} /></mesh>
    <mesh castShadow position={[0, 1.81, -0.015]}><sphereGeometry args={[0.197, 12, 9, 0, Math.PI * 2, 0, Math.PI * 0.54]} /><meshStandardMaterial color="#392c28" roughness={0.96} /></mesh>
    <mesh position={[-0.075, 1.73, 0.173]}><sphereGeometry args={[0.018, 8, 8]} /><meshBasicMaterial color="#1c1b19" /></mesh>
    <mesh position={[0.075, 1.73, 0.173]}><sphereGeometry args={[0.018, 8, 8]} /><meshBasicMaterial color="#1c1b19" /></mesh>
    <group ref={leftArm} position={[-0.26, 1.3, 0]}><mesh castShadow position-y={-0.28}><capsuleGeometry args={[0.09, 0.48, 4, 7]} /><meshStandardMaterial color={CLOTHING[color % CLOTHING.length]} /></mesh></group>
    <group ref={rightArm} position={[0.26, 1.3, 0]}><mesh castShadow position-y={-0.28}><capsuleGeometry args={[0.09, 0.48, 4, 7]} /><meshStandardMaterial color={CLOTHING[color % CLOTHING.length]} /></mesh></group>
    <group ref={leftLeg} position={[-0.13, 0.66, 0]}><mesh castShadow position-y={-0.28}><capsuleGeometry args={[0.095, 0.48, 4, 7]} /><meshStandardMaterial color="#30363a" /></mesh></group>
    <group ref={rightLeg} position={[0.13, 0.66, 0]}><mesh castShadow position-y={-0.28}><capsuleGeometry args={[0.095, 0.48, 4, 7]} /><meshStandardMaterial color="#30363a" /></mesh></group>
  </group>;
}

export function Pedestrians() { return <>{walkers.map((walker, index) => <Pedestrian key={index} {...walker} index={index} />)}</>; }

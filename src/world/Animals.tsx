import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { consumeInteraction, gameInput } from '../systems/gameInput';
import { useGameStore } from '../state';

type AnimalData = { name: string; kind: 'cachorro' | 'gato'; x: number; z: number; color: string; speed: number };
const ANIMALS: AnimalData[] = [
  { name: 'Tico', kind: 'cachorro', x: -58, z: -56, color: '#b77d4e', speed: 0.72 },
  { name: 'Lua', kind: 'gato', x: 70, z: -56, color: '#85818a', speed: 0.42 },
  { name: 'Nino', kind: 'cachorro', x: -58, z: 58, color: '#e3d2aa', speed: 0.55 },
  { name: 'Mingau', kind: 'gato', x: 70, z: 58, color: '#25282b', speed: 0.35 },
  { name: 'Pipoca', kind: 'cachorro', x: -55, z: 4, color: '#84634b', speed: 0.62 },
];

function AmbientAnimal({ animal, index }: { animal: AnimalData; index: number }) {
  const root = useRef<Group>(null);
  const gait = useRef<Group>(null);
  useFrame((state) => {
    const group = root.current;
    if (!group) return;
    const phase = state.clock.elapsedTime * animal.speed + index * 1.7;
    group.position.x = animal.x + Math.cos(phase) * 2.2;
    group.position.z = animal.z + Math.sin(phase) * 2.2;
    group.rotation.y = Math.atan2(-Math.sin(phase), -Math.cos(phase));
    if (gait.current) gait.current.position.y = Math.sin(phase * 8) * 0.045;
    if (gameInput.enabled && gameInput.interactPressed) {
      const [px, pz] = useGameStore.getState().playerPosition;
      if (Math.hypot(px - group.position.x, pz - group.position.z) < 2.2 && consumeInteraction()) useGameStore.getState().showCharacterDialogue(animal.name, animal.kind === 'cachorro' ? 'O cachorro abana o rabo e se aproxima com curiosidade.' : 'O gato observa você por um instante e ronrona baixinho.');
    }
  });
  return <group ref={root} position={[animal.x, 0, animal.z]}>
    <group ref={gait}>
      <mesh castShadow={false} position-y={animal.kind === 'gato' ? 0.38 : 0.45} scale={animal.kind === 'gato' ? [0.72, 0.72, 0.72] : [1, 1, 1]}><capsuleGeometry args={[0.2, animal.kind === 'gato' ? 0.25 : 0.42, 4, 7]} /><meshStandardMaterial color={animal.color} roughness={0.92} /></mesh>
      <mesh castShadow={false} position={[0, animal.kind === 'gato' ? 0.62 : 0.68, 0.32]}><sphereGeometry args={[0.17, 10, 8]} /><meshStandardMaterial color={animal.color} roughness={0.9} /></mesh>
      {animal.kind === 'gato' && [-0.1, 0.1].map((x) => <mesh key={x} position={[x, 0.8, 0.3]} rotation-z={x * 2}><coneGeometry args={[0.07, 0.18, 5]} /><meshStandardMaterial color={animal.color} /></mesh>)}
      {animal.kind === 'cachorro' && <mesh position={[0, 0.49, -0.39]} rotation-x={0.65}><capsuleGeometry args={[0.055, 0.34, 3, 5]} /><meshStandardMaterial color={animal.color} /></mesh>}
      {[-1, 1].flatMap((side) => [-1, 1].map((front) => <mesh key={`${side}-${front}`} position={[side * 0.13, 0.17, front * 0.2]}><capsuleGeometry args={[0.055, 0.25, 3, 5]} /><meshStandardMaterial color={animal.color} /></mesh>))}
    </group>
  </group>;
}

export function Animals() { return <>{ANIMALS.map((animal, index) => <AmbientAnimal key={animal.name} animal={animal} index={index} />)}</>; }

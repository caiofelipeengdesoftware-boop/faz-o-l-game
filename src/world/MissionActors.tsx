import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { type Group, type Mesh, Quaternion, Vector3 } from 'three';
import { consumeInteraction, gameInput } from '../systems/gameInput';
import { registerCombatTarget, unregisterCombatTarget } from '../systems/combatTargets';
import { useGameStore } from '../state';
import { playGunshot, playImpact } from '../systems/audio';

function UniformedFigure({ color = '#315f83' }: { color?: string }) {
  return <group>
    <mesh castShadow position={[0, 0.83, 0]}><capsuleGeometry args={[0.28, 0.65, 4, 9]} /><meshStandardMaterial color={color} /></mesh>
    <mesh castShadow position={[0, 1.52, 0]}><sphereGeometry args={[0.21, 14, 12]} /><meshStandardMaterial color="#bd896c" /></mesh>
    <mesh castShadow position={[0, 1.68, 0]}><cylinderGeometry args={[0.25, 0.25, 0.08, 14]} /><meshStandardMaterial color="#244867" /></mesh>
    <mesh castShadow position={[-0.37, 0.58, 0]} rotation-z={-0.12}><capsuleGeometry args={[0.12, 0.55, 3, 7]} /><meshStandardMaterial color="#1e2830" /></mesh>
    <mesh castShadow position={[0.37, 0.58, 0]} rotation-z={0.12}><capsuleGeometry args={[0.12, 0.55, 3, 7]} /><meshStandardMaterial color="#1e2830" /></mesh>
    <mesh castShadow position={[-0.15, 0.2, 0]}><capsuleGeometry args={[0.13, 0.5, 3, 7]} /><meshStandardMaterial color="#1d2d3a" /></mesh>
    <mesh castShadow position={[0.15, 0.2, 0]}><capsuleGeometry args={[0.13, 0.5, 3, 7]} /><meshStandardMaterial color="#1d2d3a" /></mesh>
    <mesh position={[0, 0.96, 0.27]}><boxGeometry args={[0.12, 0.16, 0.025]} /><meshStandardMaterial color="#e0c06d" metalness={0.55} /></mesh>
  </group>;
}

export function MissionOfficer() {
  const phase = useGameStore((state) => state.missionPhase);
  const label = useRef<Group>(null);
  useFrame(() => { if (label.current) label.current.position.y = 2.28 + Math.sin(performance.now() * 0.002) * 0.1; });
  useFrame(() => {
    if (!gameInput.interactPressed && !gameInput.missionPressed) return;
    const [px, pz] = useGameStore.getState().playerPosition;
    if (Math.hypot(px + 11, pz - 10) > 3.2) return;
    const pressed = gameInput.missionPressed || gameInput.interactPressed;
    if (!pressed || !consumeInteraction()) return;
    const store = useGameStore.getState();
    if (store.missionPhase === 'available') {
      if (store.quests.find((quest) => quest.id === 'contracts')?.status === 'available') { store.acceptQuest('contracts'); store.advanceQuest('contracts'); }
      store.beginMission(); store.showCharacterDialogue('Inspetora Helena', 'Temos contratos públicos desviados no distrito industrial. Vá ao depósito, recupere a pasta e não deixe a facção apagar as provas.');
    } else if (store.missionPhase === 'complete') {
      store.resetMission(); store.showCharacterDialogue('Inspetora Helena', 'Bom trabalho, investigador. O dossiê está seguro. Quando estiver pronto, temos outra denúncia para apurar.');
    }
  });
  return <group position={[-11, 0, 10]}>
    <UniformedFigure />
    <group ref={label} position-y={2.28}>
      <mesh><sphereGeometry args={[0.12, 12, 12]} /><meshBasicMaterial color="#e6c66e" /></mesh>
    </group>
    {phase === 'available' && <mesh rotation-x={-Math.PI / 2} position-y={0.05}><ringGeometry args={[0.55, 0.7, 32]} /><meshBasicMaterial color="#e2c274" transparent opacity={0.85} /></mesh>}
  </group>;
}

export const EVIDENCE_POSITION: [number, number, number] = [45, 0, -43];

export function EvidenceSite() {
  const phase = useGameStore((state) => state.missionPhase);
  const marker = useRef<Group>(null);
  useFrame((_, delta) => {
    if (!gameInput.enabled) return;
    if (marker.current) marker.current.rotation.y += delta * 0.7;
    if (phase !== 'evidence' || !gameInput.interactPressed) return;
    const [px, pz] = useGameStore.getState().playerPosition;
    if (Math.hypot(px - EVIDENCE_POSITION[0], pz - EVIDENCE_POSITION[2]) < 3.5 && consumeInteraction()) {
      const store = useGameStore.getState();
      store.collectEvidence();
      store.advanceQuest('contracts');
      store.showCharacterDialogue('Rádio da inspetora Helena', 'A pasta foi localizada. Movimento no perímetro! Procure cobertura e impeça que levem as provas.');
    }
  });
  if (phase !== 'evidence' && phase !== 'shootout') return null;
  return <group position={EVIDENCE_POSITION}>
    <mesh castShadow position-y={0.65}><boxGeometry args={[1.3, 1.2, 1]} /><meshStandardMaterial color="#564638" roughness={0.95} /></mesh>
    <mesh castShadow position-y={1.29}><boxGeometry args={[1.38, 0.1, 1.08]} /><meshStandardMaterial color="#79654a" roughness={0.9} /></mesh>
    {phase === 'evidence' && <group ref={marker} position-y={2.2}>
      <mesh><torusGeometry args={[0.55, 0.08, 8, 24]} /><meshStandardMaterial color="#e7c86d" emissive="#4f3918" /></mesh>
      <mesh position-y={0.18}><sphereGeometry args={[0.16, 12, 12]} /><meshStandardMaterial color="#fff1b8" emissive="#b48331" emissiveIntensity={1.5} /></mesh>
    </group>}
  </group>;
}

const PATROL_POINTS: [number, number][] = [[-45, -15], [0, -45], [45, 15]];
export function QuestObjectives() {
  const marker = useRef<Group>(null);
  useFrame((_, delta) => {
    if (marker.current) marker.current.rotation.y += delta * 0.7;
    const store = useGameStore.getState();
    const patrol = store.quests.find((quest) => quest.id === 'patrol');
    if (!gameInput.enabled || patrol?.status !== 'active' || patrol.progress >= PATROL_POINTS.length) return;
    const [px, pz] = store.playerPosition; const [x, z] = PATROL_POINTS[patrol.progress];
    if (Math.hypot(px - x, pz - z) < 2.4) store.advanceQuest('patrol');
  });
  const patrol = useGameStore((state) => state.quests.find((quest) => quest.id === 'patrol'));
  if (patrol?.status !== 'active' || patrol.progress >= PATROL_POINTS.length) return null;
  const [x, z] = PATROL_POINTS[patrol.progress];
  return <group position={[x, 0, z]}><group ref={marker} position-y={1.7}><mesh><torusGeometry args={[0.48, 0.07, 8, 24]} /><meshStandardMaterial color="#70c9a8" emissive="#205c42" /></mesh><mesh position-y={0.12}><sphereGeometry args={[0.12, 12, 10]} /><meshStandardMaterial color="#d7f5df" emissive="#4a906c" /></mesh></group></group>;
}

const ENEMY_SPAWNS: [number, number, number][] = [[40, 0, -39], [50, 0, -39], [40, 0, -49], [50, 0, -49]];

export function FactionEnemy({ index }: { index: number }) {
  const phase = useGameStore((state) => state.missionPhase);
  const [alive, setAlive] = useState(true);
  const root = useRef<Group>(null);
  const tracer = useRef<Mesh>(null);
  const hp = useRef(3);
  const attack = useRef(1.0 + index * 0.4);
  const tracerTime = useRef(0);
  const direction = useRef(new Vector3());
  const quaternion = useRef(new Quaternion());
  useEffect(() => { if (phase === 'shootout') { hp.current = 3; setAlive(true); } }, [phase]);
  useEffect(() => {
    if (phase !== 'shootout' || !alive || !root.current) return;
    const id = `faction-${index}`;
    registerCombatTarget(id, root.current, () => {
      hp.current -= 1;
      if (hp.current <= 0) { setAlive(false); useGameStore.getState().defeatEnemy(); }
    });
    return () => unregisterCombatTarget(id);
  }, [phase, alive, index]);

  useFrame((_, delta) => {
    if (!gameInput.enabled) return;
    if (phase !== 'shootout' || !alive || !root.current) return;
    const group = root.current;
    const [px, pz] = useGameStore.getState().playerPosition;
    direction.current.set(px - group.position.x, 0, pz - group.position.z);
    const distance = direction.current.length();
    if (distance > 6) {
      direction.current.normalize();
      group.position.addScaledVector(direction.current, Math.min(delta, 0.05) * 1.25);
    }
    group.rotation.y = Math.atan2(direction.current.x, direction.current.z);
    attack.current -= delta;
    if (distance < 17 && attack.current <= 0) {
      attack.current = 1.8 + index * 0.2;
      playGunshot();
      if (distance < 15) { useGameStore.getState().damagePlayer(7); playImpact(); }
      tracerTime.current = 0.12;
      if (tracer.current) {
        tracer.current.visible = true;
        const ray = direction.current.clone().normalize();
        tracer.current.position.set(ray.x * distance / 2, 1.05, ray.z * distance / 2);
        quaternion.current.setFromUnitVectors(new Vector3(0, 1, 0), ray);
        tracer.current.quaternion.copy(quaternion.current);
        tracer.current.scale.y = distance;
      }
    }
    tracerTime.current -= delta;
    if (tracerTime.current <= 0 && tracer.current) tracer.current.visible = false;
  });

  if (phase !== 'shootout' || !alive) return null;
  const [x, y, z] = ENEMY_SPAWNS[index];
  return <group ref={root} position={[x, y, z]}>
    <mesh castShadow position-y={0.85}><capsuleGeometry args={[0.29, 0.68, 4, 8]} /><meshStandardMaterial color="#37383a" /></mesh>
    <mesh castShadow position-y={1.56}><sphereGeometry args={[0.2, 14, 12]} /><meshStandardMaterial color="#ad795d" /></mesh>
    <mesh castShadow position={[0, 1.65, 0.03]}><boxGeometry args={[0.33, 0.12, 0.25]} /><meshStandardMaterial color="#8a332a" /></mesh>
    <mesh castShadow position={[-0.37, 0.61, 0]} rotation-z={-0.14}><capsuleGeometry args={[0.12, 0.56, 3, 7]} /><meshStandardMaterial color="#202226" /></mesh>
    <mesh castShadow position={[0.37, 0.61, 0]} rotation-z={0.14}><capsuleGeometry args={[0.12, 0.56, 3, 7]} /><meshStandardMaterial color="#202226" /></mesh>
    <mesh castShadow position={[-0.15, 0.18, 0]}><capsuleGeometry args={[0.13, 0.5, 3, 7]} /><meshStandardMaterial color="#222326" /></mesh>
    <mesh castShadow position={[0.15, 0.18, 0]}><capsuleGeometry args={[0.13, 0.5, 3, 7]} /><meshStandardMaterial color="#222326" /></mesh>
    <mesh castShadow position={[0.34, 0.98, 0.3]} rotation-x={-0.2}><boxGeometry args={[0.1, 0.1, 0.58]} /><meshStandardMaterial color="#151616" /></mesh>
    <mesh ref={tracer} visible={false}><cylinderGeometry args={[0.035, 0.035, 1, 5]} /><meshBasicMaterial color="#ff6f42" /></mesh>
  </group>;
}


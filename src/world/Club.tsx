import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import type { Group } from 'three';
import { consumeInteraction, gameInput } from '../systems/gameInput';
import { setClubMusicProximity } from '../systems/audio';
import { useGameStore } from '../state';

const DOOR = [-15, 8] as const;

export function ClubExterior() {
  useFrame(() => {
    if (!gameInput.enabled || !gameInput.interactPressed || useGameStore.getState().isInside) return;
    const [x, z] = useGameStore.getState().playerPosition;
    if (Math.hypot(x - DOOR[0], z - DOOR[1]) < 3.1 && consumeInteraction()) useGameStore.getState().enterInterior('club');
  });
  return <group position={[-15, 0, 15]}>
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[7, 0.25, 7]} position={[0, 0.25, 0]} />
      <CuboidCollider args={[0.25, 5, 7]} position={[-6.8, 5, 0]} />
      <CuboidCollider args={[0.25, 5, 7]} position={[6.8, 5, 0]} />
      <CuboidCollider args={[7, 5, 0.25]} position={[0, 5, 6.8]} />
      <CuboidCollider args={[2.7, 5, 0.25]} position={[-4.3, 5, -6.8]} />
      <CuboidCollider args={[2.7, 5, 0.25]} position={[4.3, 5, -6.8]} />
      <CuboidCollider args={[1.6, 2.3, 0.25]} position={[0, 8.5, -6.8]} />
    </RigidBody>
    <mesh receiveShadow castShadow position-y={0.25}><boxGeometry args={[14, 0.5, 14]} /><meshStandardMaterial color="#272832" roughness={0.68} metalness={0.24} /></mesh>
    <mesh castShadow position={[0, 5, 6.8]}><boxGeometry args={[14, 10, 0.5]} /><meshStandardMaterial color="#292a33" roughness={0.58} metalness={0.22} /></mesh>
    <mesh castShadow position={[-4.3, 5, -6.8]}><boxGeometry args={[5.4, 10, 0.5]} /><meshStandardMaterial color="#292a33" roughness={0.58} metalness={0.22} /></mesh>
    <mesh castShadow position={[4.3, 5, -6.8]}><boxGeometry args={[5.4, 10, 0.5]} /><meshStandardMaterial color="#292a33" roughness={0.58} metalness={0.22} /></mesh>
    <mesh castShadow position={[-6.8, 5, 0]}><boxGeometry args={[0.5, 10, 14]} /><meshStandardMaterial color="#22232a" metalness={0.2} /></mesh>
    <mesh castShadow position={[6.8, 5, 0]}><boxGeometry args={[0.5, 10, 14]} /><meshStandardMaterial color="#22232a" metalness={0.2} /></mesh>
    <mesh castShadow position={[0, 10, 0]}><boxGeometry args={[14, 0.5, 14]} /><meshStandardMaterial color="#1c1d25" metalness={0.2} /></mesh>
    <mesh position={[0, 2.25, -7.12]}><boxGeometry args={[7.8, 1.1, 0.06]} /><meshStandardMaterial color="#b53b8c" emissive="#c83294" emissiveIntensity={2.1} /></mesh>
    <mesh position={[0, 3.25, -7.12]}><boxGeometry args={[9.1, 0.1, 0.08]} /><meshStandardMaterial color="#48d4d6" emissive="#48d4d6" emissiveIntensity={2.5} /></mesh>
    <mesh position={[0, 5.5, -7.12]}><boxGeometry args={[9.4, 0.11, 0.08]} /><meshStandardMaterial color="#b53b8c" emissive="#c83294" emissiveIntensity={2.2} /></mesh>
    <mesh position={[-4.9, 4.7, -7.13]}><boxGeometry args={[0.065, 7, 0.08]} /><meshStandardMaterial color="#48d4d6" emissive="#48d4d6" emissiveIntensity={2.3} /></mesh>
    <mesh position={[4.9, 4.7, -7.13]}><boxGeometry args={[0.065, 7, 0.08]} /><meshStandardMaterial color="#48d4d6" emissive="#48d4d6" emissiveIntensity={2.3} /></mesh>
    <mesh position={[0, 5.7, -7.16]}><planeGeometry args={[8.5, 1.2]} /><meshBasicMaterial color="#1c1422" /></mesh>
    <pointLight position={[0, 2.6, -9]} color="#e75cae" intensity={4} distance={15} decay={2} />
    <mesh position={[0, 0.18, -8]} rotation-x={-Math.PI / 2}><ringGeometry args={[1.5, 1.62, 40]} /><meshBasicMaterial color="#50d6d5" transparent opacity={0.8} /></mesh>
  </group>;
}

function ClubDancer({ x, color }: { x: number; color: string }) {
  const body = useRef<Group>(null);
  useFrame((state) => { if (body.current) body.current.rotation.z = Math.sin(state.clock.elapsedTime * 3.1 + x) * 0.11; });
  return <group ref={body} position={[x, 0, -1.4]}>
    <mesh castShadow position-y={1.04}><capsuleGeometry args={[0.22, 0.62, 4, 8]} /><meshStandardMaterial color={color} roughness={0.82} /></mesh>
    <mesh castShadow position-y={1.72}><sphereGeometry args={[0.18, 12, 10]} /><meshStandardMaterial color="#bd896a" roughness={0.92} /></mesh>
    <mesh castShadow position={[-0.28, 1.27, 0]} rotation-z={0.27}><capsuleGeometry args={[0.075, 0.43, 3, 6]} /><meshStandardMaterial color={color} /></mesh>
    <mesh castShadow position={[0.28, 1.27, 0]} rotation-z={-0.27}><capsuleGeometry args={[0.075, 0.43, 3, 6]} /><meshStandardMaterial color={color} /></mesh>
    <mesh castShadow position={[-0.12, 0.36, 0]}><capsuleGeometry args={[0.09, 0.54, 3, 6]} /><meshStandardMaterial color="#27242c" /></mesh>
    <mesh castShadow position={[0.12, 0.36, 0]}><capsuleGeometry args={[0.09, 0.54, 3, 6]} /><meshStandardMaterial color="#27242c" /></mesh>
  </group>;
}

export function ClubInterior() {
  useFrame(() => {
    const game = useGameStore.getState();
    if (gameInput.enabled && gameInput.interactPressed && consumeInteraction()) game.exitInterior();
    const [x, z] = game.playerPosition;
    setClubMusicProximity(Math.hypot(x - DOOR[0], z - DOOR[1]), game.isInside && game.interiorKind === 'club');
  });
  return <group>
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[11, 0.15, 8.5]} position={[0, -0.16, 0]} />
      <CuboidCollider args={[11, 4.8, 0.18]} position={[0, 4.8, -8.3]} />
      <CuboidCollider args={[4, 4.8, 0.18]} position={[-7, 4.8, 8.3]} />
      <CuboidCollider args={[4, 4.8, 0.18]} position={[7, 4.8, 8.3]} />
      <CuboidCollider args={[3, 2.5, 0.18]} position={[0, 7.2, 8.3]} />
      <CuboidCollider args={[0.18, 4.8, 8.5]} position={[-10.8, 4.8, 0]} />
      <CuboidCollider args={[0.18, 4.8, 8.5]} position={[10.8, 4.8, 0]} />
    </RigidBody>
    <mesh receiveShadow position={[0, -0.16, 0]}><boxGeometry args={[22, 0.3, 17]} /><meshStandardMaterial color="#25232b" roughness={0.56} /></mesh>
    <mesh position={[0, 8, 0]}><boxGeometry args={[22, 0.2, 17]} /><meshStandardMaterial color="#181923" roughness={0.8} /></mesh>
    <mesh position={[0, 4, -8.3]}><boxGeometry args={[22, 8, 0.36]} /><meshStandardMaterial color="#302d39" roughness={0.67} /></mesh>
    <mesh position={[-7, 4, 8.3]}><boxGeometry args={[8, 8, 0.36]} /><meshStandardMaterial color="#302d39" roughness={0.67} /></mesh>
    <mesh position={[7, 4, 8.3]}><boxGeometry args={[8, 8, 0.36]} /><meshStandardMaterial color="#302d39" roughness={0.67} /></mesh>
    <mesh position={[0, 7.15, 8.3]}><boxGeometry args={[6, 1.7, 0.36]} /><meshStandardMaterial color="#302d39" roughness={0.67} /></mesh>
    <mesh position={[-10.8, 4, 0]}><boxGeometry args={[0.36, 8, 17]} /><meshStandardMaterial color="#292733" /></mesh>
    <mesh position={[10.8, 4, 0]}><boxGeometry args={[0.36, 8, 17]} /><meshStandardMaterial color="#292733" /></mesh>
    <mesh position={[0, 0.035, -1]} rotation-x={-Math.PI / 2}><planeGeometry args={[9, 6]} /><meshStandardMaterial color="#47365d" emissive="#381d4b" emissiveIntensity={0.65} metalness={0.35} roughness={0.28} /></mesh>
    <mesh castShadow position={[0, 0.8, -6.2]}><boxGeometry args={[12, 1.3, 1.1]} /><meshStandardMaterial color="#513143" roughness={0.34} metalness={0.24} /></mesh>
    <mesh position={[0, 1.5, -6.2]}><boxGeometry args={[11.8, 0.08, 0.92]} /><meshStandardMaterial color="#d1e8ee" emissive="#69c7d4" emissiveIntensity={1.15} metalness={0.48} roughness={0.2} /></mesh>
    {[-4, -2, 0, 2, 4].map((x) => <group key={x} position={[x, 0, -6.2]}><mesh castShadow position-y={0.48}><cylinderGeometry args={[0.32, 0.3, 0.82, 12]} /><meshStandardMaterial color="#25252b" metalness={0.6} roughness={0.38} /></mesh><mesh position-y={0.92}><cylinderGeometry args={[0.36, 0.36, 0.09, 12]} /><meshStandardMaterial color="#c0a56e" metalness={0.6} /></mesh></group>)}
    {[-1.5, 1.5].map((x) => <ClubDancer key={x} x={x} color={x < 0 ? '#427f89' : '#ab4a76'} />)}
    {[[-8.7, '#e45aa6'], [8.7, '#54d2dc']].map(([x, color]) => <mesh key={String(x)} position={[Number(x), 4.4, -4]}><boxGeometry args={[0.1, 5.8, 0.1]} /><meshStandardMaterial color={String(color)} emissive={String(color)} emissiveIntensity={2.2} /></mesh>)}
    <pointLight name="club-dance-wash" position={[0, 6.7, -1]} color="#d556bb" intensity={14} distance={18} decay={2} />
    <pointLight position={[-6.2, 4.2, -3.2]} color="#e055a9" intensity={8} distance={10} decay={2} />
    <pointLight position={[6.2, 4.2, -3.2]} color="#50bde1" intensity={8} distance={10} decay={2} />
    <mesh position={[0, 3.8, 0]}><boxGeometry args={[0.18, 5.2, 0.18]} /><meshStandardMaterial color="#29242e" metalness={0.5} /></mesh>
  </group>;
}

export function ClubSoundscape() {
  const clock = useRef(0);
  useFrame((_, delta) => {
    clock.current += delta;
    if (clock.current < 0.25) return;
    clock.current = 0;
    const game = useGameStore.getState(); const [x, z] = game.playerPosition;
    setClubMusicProximity(Math.hypot(x - DOOR[0], z - DOOR[1]), game.isInside && game.interiorKind === 'club');
  });
  return null;
}

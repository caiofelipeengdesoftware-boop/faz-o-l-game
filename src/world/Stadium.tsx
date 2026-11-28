import { useEffect, useMemo, useRef } from 'react';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { useGameStore } from '../state';
import { STADIUM_CENTER } from '../data/world';
import { grassTexture, pitchTexture, signTexture } from './textures';
import { ParkedCar } from './Vehicle';

const HX = 30; const HZ = 19; const APRON = 4; const DEPTH = 16; const TIERS = 5; const TIER_D = DEPTH / TIERS; const TIER_H = 2.2;
const RED = '#b3222c'; const WHITE = '#e9e5dc'; const CONCRETE = '#c9c4b8';

/** Arquibancada local: frente em z = 0 (voltada ao campo), degraus subindo para -z. `gap` abre um corredor central (portão). */
function Stand({ length, gap = 0, canopy = true, position, yaw }: { length: number; gap?: number; canopy?: boolean; position: [number, number, number]; yaw: number }) {
  const pieces = gap ? [{ w: (length - gap) / 2, x: -(gap / 2 + (length - gap) / 4) }, { w: (length - gap) / 2, x: gap / 2 + (length - gap) / 4 }] : [{ w: length, x: 0 }];
  return <group position={position} rotation-y={yaw}>
    {pieces.map((piece, p) => <RigidBody key={p} type="fixed" colliders={false} position={[piece.x, 0, 0]}>
      {Array.from({ length: TIERS }, (_, i) => {
        const h = (i + 1) * TIER_H; const z = -(i + 0.5) * TIER_D;
        return <group key={i}>
          <CuboidCollider args={[piece.w / 2, h / 2, TIER_D / 2]} position={[0, h / 2, z]} />
          <mesh castShadow receiveShadow position={[0, h / 2, z]}><boxGeometry args={[piece.w, h, TIER_D]} /><meshStandardMaterial color={CONCRETE} roughness={0.95} /></mesh>
          <mesh position={[0, h + 0.04, z]}><boxGeometry args={[piece.w - 0.4, 0.08, TIER_D - 0.5]} /><meshStandardMaterial color={i % 2 ? WHITE : RED} roughness={0.7} /></mesh>
          {Array.from({ length: Math.floor(piece.w / 1.6) }, (_, k) => <mesh key={k} position={[-piece.w / 2 + 0.8 + k * 1.6, h + 0.3, z]}><boxGeometry args={[1.0, 0.55, 0.9]} /><meshStandardMaterial color={(k + i) % 7 === 0 ? WHITE : RED} roughness={0.6} /></mesh>)}
        </group>;
      })}
      <CuboidCollider args={[piece.w / 2, 7, 0.4]} position={[0, 7, -DEPTH - 0.2]} />
      <mesh castShadow position={[0, 7, -DEPTH - 0.2]}><boxGeometry args={[piece.w, 14, 0.8]} /><meshStandardMaterial color="#b9b4a7" roughness={0.9} /></mesh>
      {canopy && <mesh castShadow position={[0, 13.2, -DEPTH / 2 - 1]}><boxGeometry args={[piece.w + 0.6, 0.35, DEPTH + 3]} /><meshStandardMaterial color="#f4f1ea" roughness={0.6} /></mesh>}
    </RigidBody>)}
  </group>;
}

function Floodlight({ x, z }: { x: number; z: number }) {
  const night = useGameStore((state) => state.timeOfDay === 'night');
  return <group position={[x, 0, z]}>
    <mesh castShadow position-y={11}><cylinderGeometry args={[0.35, 0.55, 22, 8]} /><meshStandardMaterial color="#8a8d90" metalness={0.6} roughness={0.4} /></mesh>
    <mesh position-y={22.6}><boxGeometry args={[5, 3, 0.8]} /><meshStandardMaterial color="#e8f0f5" emissive="#fff4d6" emissiveIntensity={night ? 3.2 : 0.15} /></mesh>
  </group>;
}

export function Stadium() {
  const [cx, cz] = STADIUM_CENTER;
  const night = useGameStore((state) => state.timeOfDay === 'night');
  const pitch = useMemo(() => pitchTexture(), []);
  const asphalt = useMemo(() => grassTexture('#3a3e40', 12, 12), []);
  const board = useMemo(() => signTexture('AURORA  0 x 0  VISITANTE', '#101418', '#ffd66b', 'ESTÁDIO AURORA'), []);
  const gate = useMemo(() => signTexture('ESTÁDIO AURORA', RED, '#ffffff', 'PORTÃO PRINCIPAL'), []);
  const lines = useRef(null);
  useEffect(() => { void lines; }, []);
  const ox = HX + APRON; const oz = HZ + APRON;
  return <group position={[cx, 0, cz]}>
    <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, 0.025, 0]}><planeGeometry args={[ox * 2 + 2, oz * 2 + 2]} /><meshStandardMaterial color="#6c6a60" roughness={1} /></mesh>
    <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, 0.04, 0]}><planeGeometry args={[HX * 2, HZ * 2]} /><meshStandardMaterial map={pitch} roughness={0.95} /></mesh>
    {[-1, 1].map((side) => <group key={side} position={[side * (HX - 0.2), 0, 0]}>
      <mesh castShadow position={[0, 1.2, -3.66]}><boxGeometry args={[0.2, 2.4, 0.2]} /><meshStandardMaterial color="#f2f2ee" /></mesh>
      <mesh castShadow position={[0, 1.2, 3.66]}><boxGeometry args={[0.2, 2.4, 0.2]} /><meshStandardMaterial color="#f2f2ee" /></mesh>
      <mesh castShadow position={[0, 2.4, 0]}><boxGeometry args={[0.2, 0.2, 7.5]} /><meshStandardMaterial color="#f2f2ee" /></mesh>
      <mesh position={[side * 1.1, 1.2, 0]}><boxGeometry args={[2.2, 2.4, 7.3]} /><meshStandardMaterial color="#ffffff" transparent opacity={0.25} wireframe /></mesh>
    </group>)}
    {[[0, -oz + 0.5, ox * 2], [0, oz - 0.5, ox * 2]].map(([x, z, w], i) => <mesh key={i} position={[x, 0.5, z]}><boxGeometry args={[w, 1, 0.3]} /><meshStandardMaterial color={i ? '#1b4a8c' : RED} roughness={0.5} /></mesh>)}
    <Stand length={ox * 2} position={[0, 0, -oz]} yaw={0} />
    <Stand length={ox * 2} position={[0, 0, oz]} yaw={Math.PI} />
    <Stand length={oz * 2} gap={9} canopy={false} position={[-ox, 0, 0]} yaw={-Math.PI / 2} />
    <Stand length={oz * 2} position={[ox, 0, 0]} yaw={Math.PI / 2} />
    {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => <Floodlight key={i} x={sx * (ox + DEPTH + 3)} z={sz * (oz + DEPTH + 3)} />)}
    <mesh position={[ox + DEPTH * 0.55, 12.4, 0]} rotation-y={-Math.PI / 2}><planeGeometry args={[14, 3.4]} /><meshStandardMaterial map={board} emissive="#ffffff" emissiveMap={board} emissiveIntensity={night ? 1.5 : 0.4} /></mesh>
    <mesh position={[-ox - 0.5, 6.2, 0]} rotation-y={Math.PI / 2}><planeGeometry args={[9, 2.3]} /><meshStandardMaterial map={gate} emissive="#ffffff" emissiveMap={gate} emissiveIntensity={night ? 1.4 : 0.35} /></mesh>
    <RigidBody type="fixed" colliders={false}><CuboidCollider args={[0.3, 1.3, 3]} position={[-ox - DEPTH - 6, 1.3, 0]} /></RigidBody>
    {/* estacionamento */}
    <mesh receiveShadow rotation-x={-Math.PI / 2} position={[-ox - DEPTH - 14, 0.03, 0]}><planeGeometry args={[28, 62]} /><meshStandardMaterial map={asphalt} roughness={1} /></mesh>
    {Array.from({ length: 9 }, (_, i) => <mesh key={i} rotation-x={-Math.PI / 2} position={[-ox - DEPTH - 14, 0.045, -24 + i * 6]}><planeGeometry args={[22, 0.16]} /><meshStandardMaterial color="#dcd8c8" /></mesh>)}
    <ParkedCar position={[-ox - DEPTH - 20, 0.72, -22]} color="#2d3a4a" />
    <ParkedCar position={[-ox - DEPTH - 20, 0.72, -10]} color="#b3222c" />
    <ParkedCar position={[-ox - DEPTH - 8, 0.72, 16]} color="#d8d2c4" />
    <ParkedCar position={[-ox - DEPTH - 8, 0.72, 28]} color="#1f2a24" />
    <ParkedCar position={[-ox - DEPTH - 20, 0.72, 22]} color="#7d6a3a" />
    <group position={[-ox - DEPTH - 6, 0, 7]}>
      <RigidBody type="fixed" colliders={false}><CuboidCollider args={[1.6, 1.3, 1.1]} position={[0, 1.3, 0]} /></RigidBody>
      <mesh castShadow position-y={1.3}><boxGeometry args={[3.2, 2.6, 2.2]} /><meshStandardMaterial color={RED} roughness={0.7} /></mesh>
      <mesh position={[0, 1.6, 1.12]}><boxGeometry args={[2.2, 0.9, 0.05]} /><meshStandardMaterial color="#cfe3ea" emissive="#fff0c0" emissiveIntensity={night ? 1.2 : 0} /></mesh>
      <mesh castShadow position={[0, 2.75, 0.4]}><boxGeometry args={[3.8, 0.18, 3.2]} /><meshStandardMaterial color="#f2efe6" /></mesh>
    </group>
  </group>;
}

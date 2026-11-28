import { useMemo } from 'react';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { ExtrudeGeometry, Shape } from 'three';
import { useGameStore } from '../state';
import { MANSION_CENTER } from '../data/world';
import { grassTexture, pavers, stoneFacade } from './textures';
import { ParkedCar } from './Vehicle';

const STONE = '#cbbd9b'; const SLATE = '#7d8284'; const BRICK = '#9b5b3d'; const HEDGE = '#2c5428';

function gableGeometry(span: number, rise: number, length: number) {
  const shape = new Shape(); shape.moveTo(-span / 2 - 0.5, 0); shape.lineTo(span / 2 + 0.5, 0); shape.lineTo(0, rise); shape.closePath();
  const geo = new ExtrudeGeometry(shape, { depth: length + 1, bevelEnabled: false }); geo.translate(0, 0, -(length + 1) / 2); return geo;
}

/** Bloco de pedra com janelas e telhado de duas águas. `ridge` define o sentido da cumeeira (x ou z). */
function Block({ x, z, w, d, h, y0 = 0, ridge, rise = 3.2, cols = 4, rows = 2, seed = 3, collide = true }: { x: number; z: number; w: number; d: number; h: number; y0?: number; ridge: 'x' | 'z'; rise?: number; cols?: number; rows?: number; seed?: number; collide?: boolean }) {
  const night = useGameStore((state) => state.timeOfDay === 'night');
  const tex = useMemo(() => stoneFacade(STONE, cols, rows, seed), [cols, rows, seed]);
  const roof = useMemo(() => gableGeometry(ridge === 'x' ? d : w, rise, ridge === 'x' ? w : d), [ridge, w, d, rise]);
  return <group position={[x, 0, z]}>
    {collide && <RigidBody type="fixed" colliders={false}><CuboidCollider args={[w / 2, h / 2, d / 2]} position={[0, y0 + h / 2, 0]} /></RigidBody>}
    <mesh castShadow receiveShadow position-y={y0 + h / 2}><boxGeometry args={[w, h, d]} /><meshStandardMaterial map={tex.map} roughness={0.9} emissive="#ffffff" emissiveMap={tex.glow} emissiveIntensity={night ? 1.4 : 0} /></mesh>
    <mesh castShadow position={[0, y0 + h, 0]} rotation-y={ridge === 'x' ? Math.PI / 2 : 0} geometry={roof}><meshStandardMaterial color={SLATE} roughness={0.85} /></mesh>
    <mesh castShadow position={[ridge === 'x' ? -w * 0.28 : w * 0.2, y0 + h + rise * 0.7, ridge === 'x' ? 0 : -d * 0.2]}><boxGeometry args={[0.9, 3, 0.9]} /><meshStandardMaterial color={BRICK} roughness={0.9} /></mesh>
  </group>;
}

function Cypress({ x, z, s = 1 }: { x: number; z: number; s?: number }) {
  return <group position={[x, 0, z]} scale={s}><mesh castShadow position-y={4.5}><coneGeometry args={[1.15, 9, 9]} /><meshStandardMaterial color="#244a28" roughness={1} /></mesh><mesh position-y={0.4}><cylinderGeometry args={[0.2, 0.28, 0.8, 6]} /><meshStandardMaterial color="#4a3a2a" /></mesh></group>;
}
function Oak({ x, z, s = 1 }: { x: number; z: number; s?: number }) {
  return <group position={[x, 0, z]} scale={s}><mesh castShadow position-y={1.6}><cylinderGeometry args={[0.3, 0.45, 3.2, 7]} /><meshStandardMaterial color="#5a4630" /></mesh>
    {[[0, 4.6, 0, 2.6], [1.4, 4, 0.6, 1.8], [-1.3, 4.2, -0.5, 1.9]].map(([a, b, c, r], i) => <mesh key={i} castShadow position={[a, b, c]}><sphereGeometry args={[r, 10, 8]} /><meshStandardMaterial color="#2f6232" roughness={1} /></mesh>)}</group>;
}

export function Mansion() {
  const [cx, cz] = MANSION_CENTER;
  const night = useGameStore((state) => state.timeOfDay === 'night');
  const pav = useMemo(() => pavers(), []);
  const lawn = useMemo(() => grassTexture('#4f7a3c', 24, 24), []);
  const ring = useMemo(() => Array.from({ length: 24 }, (_, i) => ({ a: (i / 24) * Math.PI * 2 })), []);
  return <group position={[cx, 0, cz]}>
    <mesh receiveShadow rotation-x={-Math.PI / 2} position={[10, 0.03, 0]}><planeGeometry args={[100, 96]} /><meshStandardMaterial map={lawn} roughness={1} /></mesh>
    <mesh receiveShadow rotation-x={-Math.PI / 2} position={[14, 0.05, 0]}><planeGeometry args={[34, 24]} /><meshStandardMaterial map={pav} roughness={0.9} /></mesh>
    <mesh receiveShadow rotation-x={-Math.PI / 2} position={[31, 0.05, 0]}><planeGeometry args={[22, 12]} /><meshStandardMaterial map={pav} roughness={0.9} /></mesh>
    {/* casa: corpo central com passagem, alas laterais e fundos */}
    <Block x={-10} z={0} w={12} d={9.5} h={5.4} y0={3.6} collide={false} ridge="z" rise={3.6} cols={3} rows={1} seed={4} />
    <mesh castShadow position={[-15.6, 1.8, 0]}><boxGeometry args={[0.8, 3.6, 9.5]} /><meshStandardMaterial color={STONE} roughness={0.9} /></mesh>
    <Block x={-10} z={-12.6} w={12} d={15.7} h={9} ridge="z" rise={3.6} cols={3} rows={3} seed={6} />
    <Block x={-10} z={12.6} w={12} d={15.7} h={9} ridge="z" rise={3.6} cols={3} rows={3} seed={8} />
    <Block x={4} z={-19} w={26} d={9} h={7.4} ridge="x" rise={3} cols={5} rows={2} seed={10} />
    <Block x={4} z={19} w={26} d={9} h={7.4} ridge="x" rise={3} cols={5} rows={2} seed={12} />
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[0.5, 4.5, 4.8]} position={[-15.5, 4.5, 0]} />
      <CuboidCollider args={[6, 0.6, 5]} position={[-10, 8.7, 0]} />
    </RigidBody>
    {/* pórtico de entrada com colunas e frontão */}
    {[-3.2, -1.1, 1.1, 3.2].map((zz) => <mesh key={zz} castShadow position={[1.6, 2.4, zz]}><cylinderGeometry args={[0.28, 0.32, 4.8, 12]} /><meshStandardMaterial color="#efe8d6" roughness={0.7} /></mesh>)}
    <mesh castShadow position={[1.2, 5.1, 0]}><boxGeometry args={[3.6, 0.5, 8.6]} /><meshStandardMaterial color="#efe8d6" roughness={0.7} /></mesh>
    <mesh castShadow position={[1.2, 5.9, 0]} rotation-y={0} geometry={useMemo(() => gableGeometry(3.6, 1.4, 8.6), [])} scale={[1, 1, 1]}><meshStandardMaterial color="#efe8d6" roughness={0.7} /></mesh>
    <pointLight position={[0, 4, 0]} intensity={night ? 14 : 0} distance={14} color="#ffd9a0" decay={2} />
    {/* cofre (missão) no fundo da passagem */}
    <group position={[-14.4, 0, 0]}>
      <mesh castShadow position-y={0.7}><boxGeometry args={[1.3, 1.4, 1.5]} /><meshStandardMaterial color="#2f3438" metalness={0.6} roughness={0.4} /></mesh>
      <mesh position={[0.68, 0.85, 0]}><cylinderGeometry args={[0.22, 0.22, 0.06, 14]} /><meshStandardMaterial color="#b9a468" metalness={0.8} roughness={0.3} /></mesh>
    </group>
    {/* fonte e canteiro circular */}
    <group position={[13, 0, 0]}>
      <RigidBody type="fixed" colliders={false}><CuboidCollider args={[2.2, 0.9, 2.2]} position={[0, 0.9, 0]} /></RigidBody>
      <mesh castShadow position-y={0.35}><cylinderGeometry args={[3, 3.2, 0.7, 24]} /><meshStandardMaterial color="#e3dccb" roughness={0.6} /></mesh>
      <mesh position-y={0.62}><cylinderGeometry args={[2.7, 2.7, 0.1, 24]} /><meshStandardMaterial color="#5aa9c4" roughness={0.1} metalness={0.2} emissive="#16536a" emissiveIntensity={0.3} /></mesh>
      <mesh castShadow position-y={1.3}><cylinderGeometry args={[0.45, 0.65, 1.6, 12]} /><meshStandardMaterial color="#e3dccb" roughness={0.6} /></mesh>
      <mesh castShadow position-y={2.3}><cylinderGeometry args={[1.4, 0.3, 0.35, 16]} /><meshStandardMaterial color="#e3dccb" roughness={0.6} /></mesh>
      {ring.map(({ a }, i) => <mesh key={i} castShadow position={[Math.cos(a) * 5.6, 0.5, Math.sin(a) * 5.6]} scale={[1.2, 0.9, 1.2]}><sphereGeometry args={[0.7, 8, 6]} /><meshStandardMaterial color={i % 4 === 0 ? '#e8668c' : HEDGE} roughness={1} /></mesh>)}
    </group>
    {/* muro e portão */}
    {[-1, 1].map((side) => <group key={side}>
      <RigidBody type="fixed" colliders={false}><CuboidCollider args={[0.5, 1.6, 12.5]} position={[38, 1.6, side * 18.5]} /><CuboidCollider args={[22, 1.6, 0.5]} position={[16, 1.6, side * 30]} /></RigidBody>
      <mesh castShadow position={[38, 1.6, side * 18.5]}><boxGeometry args={[1, 3.2, 25]} /><meshStandardMaterial color="#d8d0bc" roughness={0.95} /></mesh>
      <mesh castShadow position={[16, 1.6, side * 30]}><boxGeometry args={[44, 3.2, 1]} /><meshStandardMaterial color="#d8d0bc" roughness={0.95} /></mesh>
      <mesh castShadow position={[38, 2.2, side * 6.4]}><boxGeometry args={[1.4, 4.4, 1.4]} /><meshStandardMaterial color="#e3dccb" roughness={0.8} /></mesh>
      <mesh position={[38, 4.6, side * 6.4]}><sphereGeometry args={[0.5, 10, 8]} /><meshStandardMaterial color="#f8f0d4" emissive="#ffe7a8" emissiveIntensity={night ? 2 : 0.2} /></mesh>
    </group>)}
    <mesh castShadow position={[38, 3.6, 0]}><boxGeometry args={[0.3, 0.3, 11.4]} /><meshStandardMaterial color="#1f2224" metalness={0.7} /></mesh>
    {[-1, 1].map((side) => <mesh key={side} position={[38, 1.9, side * 3]}><boxGeometry args={[0.15, 3.4, 0.15]} /><meshStandardMaterial color="#1f2224" metalness={0.7} /></mesh>)}
    {/* paisagismo */}
    {[-14, -9, 9, 14].map((z) => <Cypress key={z} x={30} z={z * 1.3} s={1.1} />)}
    {[[-26, -24], [-24, 24], [8, -25], [10, 26], [-30, 0]].map(([x, z], i) => <Oak key={i} x={x} z={z} s={1.2 + (i % 3) * 0.2} />)}
    {[-8, 8].map((z) => <Cypress key={z} x={22} z={z * 1.6} s={0.9} />)}
    <ParkedCar position={[24, 0.72, -9]} color="#101214" />
    <ParkedCar position={[24, 0.72, 9.5]} color="#e8e5de" />
  </group>;
}

import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { consumeInteraction, gameInput } from '../systems/gameInput';
import { setHint } from '../systems/hints';
import { useGameStore } from '../state';
import { SHOP_DOOR } from '../data/world';
import { CAST } from '../data/story';
import { Person, type PersonLook } from './Person';
import { signTexture } from './textures';

/** Fachada da loja Aurora Style: letreiro, toldo e vitrine sobre o prédio comum. */
export function ShopFront({ x, z, width, depth, height }: { x: number; z: number; width: number; depth: number; height: number }) {
  const night = useGameStore((state) => state.timeOfDay === 'night');
  const sign = useMemo(() => signTexture('AURORA STYLE', '#14110d', '#e2c274', 'MODA · VISUAL · IDENTIDADE'), []);
  const face = z + depth / 2 + 0.06;
  return <group position={[x, 0, face]}>
    <mesh position={[0, Math.min(height - 0.55, 3.55), 0.12]}><boxGeometry args={[width * 0.86, 0.95, 0.16]} /><meshStandardMaterial map={sign} emissive="#ffffff" emissiveMap={sign} emissiveIntensity={night ? 1.6 : 0.45} /></mesh>
    <mesh castShadow position={[0, 2.95, 0.7]} rotation-x={0.35}><boxGeometry args={[width * 0.86, 0.08, 1.5]} /><meshStandardMaterial color="#14110d" roughness={0.6} /></mesh>
    {Array.from({ length: 8 }, (_, i) => <mesh key={i} position={[(i - 3.5) * (width * 0.86 / 8), 2.93, 0.72]} rotation-x={0.35}><boxGeometry args={[width * 0.86 / 16, 0.09, 1.5]} /><meshStandardMaterial color="#c9a85a" roughness={0.5} /></mesh>)}
    {[-1, 1].map((side) => <mesh key={side} position={[side * width * 0.3, 1.45, 0.08]}><boxGeometry args={[width * 0.27, 1.9, 0.06]} /><meshStandardMaterial color="#cfe6ee" roughness={0.08} metalness={0.3} emissive="#fff0c8" emissiveIntensity={night ? 0.9 : 0.05} transparent opacity={0.82} /></mesh>)}
    <mesh position={[0, 1.15, 0.1]}><boxGeometry args={[1.25, 2.3, 0.08]} /><meshStandardMaterial color="#e2c274" metalness={0.6} roughness={0.3} emissive="#6b4d12" emissiveIntensity={night ? 0.8 : 0.1} /></mesh>
    <mesh position={[0, 1.15, 0.15]}><boxGeometry args={[1.0, 2.05, 0.04]} /><meshStandardMaterial color="#cfe6ee" roughness={0.08} transparent opacity={0.7} /></mesh>
  </group>;
}

/** Porta da loja (lado de fora). */
export function ShopDoor() {
  useFrame(() => {
    const store = useGameStore.getState();
    if (store.isInside || !gameInput.enabled) { setHint('shop-door', null); return; }
    const [px, pz] = store.playerPosition; const near = Math.hypot(px - SHOP_DOOR[0], pz - SHOP_DOOR[1]) < 2.8;
    setHint('shop-door', near ? 'Entrar na loja Aurora Style' : null);
    if (near && gameInput.interactPressed && consumeInteraction()) {
      setHint('shop-door', null); store.enterInterior('shop');
      const quest = store.quests.find((item) => item.id === 'disguise');
      if (quest?.status === 'active' && quest.progress === 0) store.advanceQuest('disguise');
    }
  });
  return null;
}

const MANNEQUINS: PersonLook[] = [CAST[4].look, CAST[5].look, CAST[3].look];
const CLERK: PersonLook = { skin: '#b97a55', top: '#1d2326', bottom: '#14171a', outfit: 'suit', tie: '#e2c274', hair: 'bun', hairColor: '#241914', build: 'female', glasses: true };
const RAILS = ['#c24d5a', '#3f7a8c', '#e2873a', '#586a54', '#6e627c', '#d0d0c5', '#354b65', '#c9a85a', '#8a2f3c', '#2d333a'];

export function ShopInterior() {
  useFrame(() => {
    if (!gameInput.enabled) { setHint('shop-exit', null); setHint('shop-fit', null); setHint('shop-clerk', null); return; }
    const store = useGameStore.getState(); const [px, pz] = store.playerPosition;
    const exit = Math.hypot(px, pz - 7.0) < 3.2; const fit = Math.hypot(px + 5.4, pz + 5.2) < 2.8; const clerk = Math.hypot(px - 4.6, pz + 4) < 3;
    setHint('shop-exit', exit ? 'Sair da loja' : null); setHint('shop-fit', fit ? 'Provar roupas' : null); setHint('shop-clerk', clerk ? 'Falar com a atendente' : null);
    if (!gameInput.interactPressed || !consumeInteraction()) return;
    if (exit) { setHint('shop-exit', null); store.exitInterior(); }
    else if (fit) store.setWardrobeOpen(true);
    else if (clerk) store.showCharacterDialogue('Bia, atendente', 'Bem-vindo à Aurora Style! O provador fica ali ao fundo, à esquerda. Roupas novas custam a partir de R$ 60. E se precisar de um visual discreto para uma investigação, eu não vi nada.');
  });
  return <group>
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[8, 0.15, 8]} position={[0, -0.16, 0]} />
      <CuboidCollider args={[8, 2.1, 0.125]} position={[0, 2, -7.85]} /><CuboidCollider args={[8, 2.1, 0.125]} position={[0, 2, 7.85]} />
      <CuboidCollider args={[0.125, 2.1, 8]} position={[-7.85, 2, 0]} /><CuboidCollider args={[0.125, 2.1, 8]} position={[7.85, 2, 0]} />
      <CuboidCollider args={[2.2, 0.55, 0.6]} position={[4.6, 0.55, -5.6]} />
      {[-1, 1].map((s) => <CuboidCollider key={s} args={[0.3, 0.9, 2.6]} position={[s * 7, 0.9, 0.5]} />)}
    </RigidBody>
    <mesh receiveShadow position={[0, -0.16, 0]}><boxGeometry args={[16, 0.3, 16]} /><meshStandardMaterial color="#b89a6c" roughness={0.55} /></mesh>
    <mesh position={[0, 4.1, 0]}><boxGeometry args={[16, 0.25, 16]} /><meshStandardMaterial color="#e9e4d8" roughness={0.9} /></mesh>
    {[[0, 2, -7.85, 16, 4.2, 0.25], [0, 2, 7.85, 16, 4.2, 0.25], [-7.85, 2, 0, 0.25, 4.2, 16], [7.85, 2, 0, 0.25, 4.2, 16]].map(([x, y, z, w, h, d], i) => <mesh key={i} position={[x, y, z]}><boxGeometry args={[w, h, d]} /><meshStandardMaterial color={i === 0 ? '#1d2326' : '#ece7da'} roughness={0.9} /></mesh>)}
    <mesh position={[0, 2.8, -7.7]}><boxGeometry args={[6, 0.9, 0.08]} /><meshStandardMaterial color="#e2c274" emissive="#ffcf70" emissiveIntensity={1.4} /></mesh>
    {[-1, 1].map((s) => <group key={s} position={[s * 7, 0, 0.5]}>
      <mesh castShadow position-y={1.8}><boxGeometry args={[0.1, 0.1, 5.2]} /><meshStandardMaterial color="#c9a85a" metalness={0.8} roughness={0.3} /></mesh>
      {RAILS.map((c, i) => <mesh key={i} castShadow position={[-s * 0.25, 1.28, -2.4 + i * 0.52]}><boxGeometry args={[0.12, 1.0, 0.36]} /><meshStandardMaterial color={c} roughness={0.9} /></mesh>)}
    </group>)}
    {MANNEQUINS.map((look, i) => <group key={i} position={[-2.2 + i * 2.2, 0, -6.2]}><mesh position-y={0.1}><cylinderGeometry args={[0.55, 0.6, 0.2, 18]} /><meshStandardMaterial color="#14110d" /></mesh><group position-y={0.2}><Person look={look} /></group></group>)}
    <group position={[4.6, 0, -5.6]}><mesh castShadow position-y={0.55}><boxGeometry args={[4.4, 1.1, 1.2]} /><meshStandardMaterial color="#14110d" roughness={0.5} /></mesh><mesh position-y={1.12}><boxGeometry args={[4.5, 0.07, 1.3]} /><meshStandardMaterial color="#e9e4d8" roughness={0.3} /></mesh></group>
    <group position={[4.6, 0, -4.3]} rotation-y={Math.PI}><Person look={CLERK} /></group>
    <group position={[-5.4, 0, -6.1]}>
      <mesh position-y={1.6}><boxGeometry args={[2.6, 3.2, 0.12]} /><meshStandardMaterial color="#9fb7c0" metalness={0.9} roughness={0.08} /></mesh>
      <mesh position={[0, 0.05, 0.8]}><cylinderGeometry args={[1.1, 1.1, 0.05, 20]} /><meshStandardMaterial color="#e2c274" emissive="#6b4d12" emissiveIntensity={0.7} /></mesh>
    </group>
    <group position={[0, 0, 7.4]}><mesh position-y={1.1}><boxGeometry args={[1.5, 2.3, 0.12]} /><meshStandardMaterial color="#e2c274" emissive="#8a6420" emissiveIntensity={0.9} /></mesh></group>
    <pointLight position={[0, 3.6, 0]} intensity={26} distance={14} color="#fff0d6" decay={2} />
    <pointLight position={[-5, 2.6, -5]} intensity={10} distance={8} color="#ffd9a0" decay={2} />
  </group>;
}

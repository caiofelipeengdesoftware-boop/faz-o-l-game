import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { consumeInteraction, gameInput } from '../systems/gameInput';
import { useGameStore } from '../state';

export function HouseDoor() {
  useFrame(() => {
    if (!gameInput.enabled || !gameInput.interactPressed) return;
    const [x, z] = useGameStore.getState().playerPosition;
    if (Math.hypot(x + 45, z + 37) < 2.7 && consumeInteraction()) useGameStore.getState().enterInterior();
  });
  const inside = useGameStore((state) => state.isInside);
  if (inside) return null;
  return <group position={[-45, 0, -37]}>
    <mesh castShadow position-y={1.05}><boxGeometry args={[1.25, 2.1, 0.16]} /><meshStandardMaterial color="#554638" roughness={0.86} /></mesh>
    <mesh position={[0.38, 1.08, 0.1]}><sphereGeometry args={[0.055, 10, 8]} /><meshStandardMaterial color="#d9bc75" metalness={0.7} roughness={0.3} /></mesh>
    <mesh position={[0, 2.35, 0]}><boxGeometry args={[1.4, 0.14, 0.22]} /><meshStandardMaterial color="#e2c274" emissive="#70521d" emissiveIntensity={0.45} /></mesh>
  </group>;
}

export function InteriorRoom() {
  useFrame(() => { if (gameInput.enabled && gameInput.interactPressed && consumeInteraction()) useGameStore.getState().exitInterior(); });
  return <group>
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[8, 0.15, 8]} position={[0, -0.16, 0]} />
      <CuboidCollider args={[8, 2.1, 0.125]} position={[0, 2, -7.85]} />
      <CuboidCollider args={[8, 2.1, 0.125]} position={[0, 2, 7.85]} />
      <CuboidCollider args={[0.125, 2.1, 8]} position={[-7.85, 2, 0]} />
      <CuboidCollider args={[0.125, 2.1, 8]} position={[7.85, 2, 0]} />
    </RigidBody>
    <mesh receiveShadow position={[0, -0.16, 0]}><boxGeometry args={[16, 0.3, 16]} /><meshStandardMaterial color="#827b6d" roughness={0.78} /></mesh>
    <mesh receiveShadow position={[0, 4.1, 0]}><boxGeometry args={[16, 0.25, 16]} /><meshStandardMaterial color="#c8c5bb" roughness={0.92} /></mesh>
    <mesh position={[0, 2, -7.85]}><boxGeometry args={[16, 4.2, 0.25]} /><meshStandardMaterial color="#dedbd0" roughness={0.95} /></mesh>
    <mesh position={[-7.85, 2, 0]}><boxGeometry args={[0.25, 4.2, 16]} /><meshStandardMaterial color="#d8d4c9" roughness={0.95} /></mesh>
    <mesh position={[7.85, 2, 0]}><boxGeometry args={[0.25, 4.2, 16]} /><meshStandardMaterial color="#d8d4c9" roughness={0.95} /></mesh>
    <mesh position={[0, 2, 7.85]}><boxGeometry args={[16, 4.2, 0.25]} /><meshStandardMaterial color="#d5d1c6" roughness={0.95} /></mesh>
    <mesh castShadow position={[0, 0.75, -1.9]}><boxGeometry args={[3.4, 0.8, 1.35]} /><meshStandardMaterial color="#58645f" roughness={0.94} /></mesh>
    <mesh castShadow position={[0, 1.38, -2.25]}><boxGeometry args={[3.5, 0.5, 0.72]} /><meshStandardMaterial color="#777e76" roughness={0.92} /></mesh>
    <mesh castShadow position={[0, 0.72, 1.4]}><boxGeometry args={[2.2, 0.14, 1.25]} /><meshStandardMaterial color="#846c4c" roughness={0.86} /></mesh>
    <mesh castShadow position={[0, 0.35, 1.4]}><cylinderGeometry args={[0.08, 0.11, 0.7, 8]} /><meshStandardMaterial color="#594a37" /></mesh>
    {[-0.85, 0.85].map((x) => <mesh key={x} castShadow position={[x, 0.35, 2.05]}><boxGeometry args={[0.14, 0.7, 0.14]} /><meshStandardMaterial color="#594a37" /></mesh>)}
    <mesh castShadow position={[-4.6, 0.5, -4.7]}><boxGeometry args={[1.3, 0.9, 0.55]} /><meshStandardMaterial color="#846b4e" /></mesh>
    <mesh castShadow position={[-4.6, 1.55, -4.95]}><boxGeometry args={[1.45, 1.3, 0.15]} /><meshStandardMaterial color="#987e5b" /></mesh>
    <mesh castShadow position={[4.8, 0.62, -5.9]}><boxGeometry args={[1.7, 1.15, 0.8]} /><meshStandardMaterial color="#776447" roughness={0.92} /></mesh>
    <mesh position={[0, 3.85, 0]}><sphereGeometry args={[0.14, 12, 10]} /><meshStandardMaterial color="#f5e8c3" emissive="#f5d992" emissiveIntensity={1.1} /></mesh>
    <pointLight position={[0, 3.7, 0]} intensity={22} distance={12} color="#ffe9c0" decay={2} />
    <pointLight position={[5.4, 2.8, -4.5]} intensity={8} distance={7} color="#afc8dc" decay={2} />
  </group>;
}
